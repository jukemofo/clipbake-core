import {
  CanvasSink,
  EncodedPacketSink,
  InputVideoTrack,
  WrappedCanvas,
} from "mediabunny";
import { VideoClip } from "../../core-manager/clip";
import { MIN_BUFFER_SIZE, POOL_SIZE } from "../constant";
import { sourceManager } from "../manager/source-manager";

export class VideoClipRender {
  private _id: string;
  private _sourceId: string;
  private _videoTrack: InputVideoTrack;
  private _start: number;

  private _sourceStart: number;
  private _duration: number;
  private _sink: CanvasSink | null = null;
  private _packetSink: EncodedPacketSink | null = null;
  private _canvasPacket: OffscreenCanvas | null = null;
  private _videoDecoder: VideoDecoder | null = null;
  private _iterator: AsyncGenerator<WrappedCanvas, void, unknown> | null = null;
  private _sessionId: number = 0;
  private _queue: WrappedCanvas[];
  private _isRefilling: boolean = false;
  private _isEndOfClip: boolean = false;
  private _isPrepared: boolean = false;

  constructor(clip: VideoClip) {
    this._id = clip.id;
    this._sourceId = clip.sourceId;
    this._start = clip.start;
    this._sourceStart = clip.sourceStart;
    this._duration = clip.duration;
    this._queue = [];

    const source = sourceManager.getVideoSource(this._sourceId);
    if (!source) {
      throw new Error("Not found source for this clip");
    }
    this._videoTrack = source.vidTrack;
  }

  public async prepare() {
    if (this._isPrepared) {
      return;
    }
    this._isPrepared = true;
    await this.seek(this._start);
  }

  public async getFrame(currentTime: number) {
    if (this._queue.length <= 0) {
      this._refill();
      return null;
    }
    const elapsed = currentTime - this._start;
    const sourceTime = this._sourceStart + elapsed;
    let latestValidFrame: WrappedCanvas | undefined | null = null;
    while (this._queue[0] && sourceTime >= this._queue[0].timestamp) {
      latestValidFrame = this._queue.shift();
      this._refill();
    }
    return latestValidFrame;
  }

  public async scrub(targetTime: number): Promise<OffscreenCanvas | null> {
    if (!this._packetSink) {
      this._packetSink = new EncodedPacketSink(this._videoTrack);
    }
    if (!this._canvasPacket) {
      this._canvasPacket = new OffscreenCanvas(200, 200);
    }

    if (!this._videoDecoder) {
      this._videoDecoder = new VideoDecoder({
        output: (frame) => {
          if (!this._canvasPacket) return;

          this._canvasPacket.width = frame.displayWidth;
          this._canvasPacket.height = frame.displayHeight;

          const ctx = this._canvasPacket.getContext("2d");
          ctx!.drawImage(
            frame,
            0,
            0,
            this._canvasPacket.width,
            this._canvasPacket.height,
          );
          frame.close();
        },
        error: (e) => {
          console.error("Decoder error:", e);
        },
      });

      const config = await this._videoTrack.getDecoderConfig();
      this._videoDecoder.configure(config!);
    }

    const packet = await this._packetSink.getKeyPacket(targetTime);
    if (!packet) return null;
    const chunk = packet.toEncodedVideoChunk();

    if (this._videoDecoder.decodeQueueSize > 2) {
      this._videoDecoder.reset();
      const config = await this._videoTrack.getDecoderConfig();
      this._videoDecoder.configure(config!);
    }

    this._videoDecoder.decode(chunk);

    try {
      await this._videoDecoder.flush();
    } catch (err) {}

    return this._canvasPacket;
  }

  public async seek(targetTime: number) {
    this._sessionId++;
    await this.close();
    this._sink = new CanvasSink(this._videoTrack);

    const elapsed = targetTime - this._start;
    this._iterator = this._sink.canvases(
      this._sourceStart + elapsed,
      this._sourceStart + this._duration,
    );
    const sampleResult = await this._iterator.next();
    if (sampleResult.value) {
      this._queue.push(sampleResult.value);
      this._refill();
    }
  }

  private async _refill() {
    if (this._isRefilling || !this._iterator) return;
    this._isRefilling = true;

    const currentSession = this._sessionId;
    while (this._queue.length < POOL_SIZE) {
      const result = await this._iterator.next();
      if (result.done || !result.value) {
        this._isEndOfClip = true;
        break;
      }
      this._isEndOfClip = false;
      if (this._sessionId !== currentSession) {
        break;
      }
      this._queue.push(result.value);
    }

    this._isRefilling = false;
  }

  public async close() {
    await this._iterator?.return();
    this._sink = null;
    this._queue = [];
    this._isEndOfClip = false;
    this._isPrepared = false;
    this._packetSink = null;
    this._canvasPacket = null;
    if (this._videoDecoder?.state !== "closed") {
      this._videoDecoder?.close();
    }
    this._videoDecoder = null;
  }

  public isStarving() {
    if (this._isEndOfClip) {
      return false;
    }
    return this._queue.length < MIN_BUFFER_SIZE;
  }

  public get start() {
    return this._start;
  }

  public set start(value: number) {
    this._start = value;
  }

  public get duration() {
    return this._duration;
  }

  public set duration(value: number) {
    this._duration = value;
  }

  public get sourceStart() {
    return this._sourceStart;
  }

  public set sourceStart(value: number) {
    this._sourceStart = value;
  }

  public get id() {
    return this._id;
  }

  public get isPrepared() {
    return this._isPrepared;
  }

  public toRaw(): VideoClip {
    return {
      id: this._id,
      duration: this._duration,
      keyframes: [],
      sourceId: this._sourceId,
      sourceStart: this._sourceStart,
      start: this._start,
      property: {
        x: 0,
        y: 0,
        anchorX: 0,
        anchorY: 0,
        scaleX: 0,
        scaleY: 0,
        volume: 1,
      },
    };
  }
}
