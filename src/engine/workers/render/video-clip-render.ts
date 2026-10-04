import { CanvasSink, InputVideoTrack, WrappedCanvas } from "mediabunny";
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
    return this._duration;
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
}
