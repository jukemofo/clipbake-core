import { FPS } from "../types/fps";
import { MediaKind } from "../types/kind";
import { Second } from "../types/time";
import { AudioTrack, VideoTrack } from "../types/track";
import { WorkerClient } from "../workers/client";
import { CoreWorkerAPI } from "../workers/client/type";
import { AddClipDto } from "../workers/module/dto/clip-dto";
import { AddSourceDto } from "../workers/module/dto/source-dto";
import { AddTrackDto } from "../workers/module/dto/track-dto";
import { AudioEngine } from "./audio-engine";
import { MasterClock } from "./master-clock";

export class Engine {
  private _coreClient: WorkerClient<CoreWorkerAPI>;
  private _masterClock: MasterClock;
  private _audioEngine: AudioEngine;
  private _init: boolean = false;
  private _duration: Second = 0;

  public constructor() {
    this._coreClient = new WorkerClient(
      new URL("../workers/server/core.worker.ts", import.meta.url),
    );
    this._masterClock = new MasterClock();
    this._audioEngine = new AudioEngine();
  }

  public async init(
    canvas: HTMLCanvasElement,
    options: {
      width: number;
      height: number;
      fps: FPS;
      backgroundColor: string;
    },
  ) {
    const offscreenCanvas = canvas.transferControlToOffscreen();
    await this._coreClient.call(
      "init",
      {
        ...options,
        canvas: offscreenCanvas,
      },
      [offscreenCanvas],
    );
    this._init = true;
  }

  public async start() {
    if (!this._init) {
      throw new Error("Please call 'engine.init()' first.");
    }
    this._masterClock.start();

    if (this._masterClock.getCurrentTime() >= this._duration) {
      await this.seek(0);
    }
    const startTime = this._masterClock.getCurrentTime();
    const basePerfTime = performance.timeOrigin + performance.now();
    this._audioEngine.start(this._masterClock);
    await this._coreClient.call("start", {
      time: startTime,
      basePerfTime: basePerfTime,
    });
  }

  public async stop() {
    if (!this._init) {
      throw new Error("Please call 'engine.init()' first.");
    }
    this._masterClock.stop();
    this._audioEngine.stop();
    const startTime = this._masterClock.getCurrentTime();
    await this._coreClient.call("stop", {
      time: startTime,
    });
  }

  public async seek(time: Second) {
    if (!this._init) {
      throw new Error("Please call 'engine.init()' first.");
    }
    const clampedTime = Math.max(0, Math.min(time, this._duration));
    this._masterClock.seek(clampedTime);
    await this._coreClient.call("seek", {
      time: clampedTime,
      highQuality: true,
    });
  }

  public readonly sources = {
    add: async (payload: AddSourceDto) => {
      if (!this._init) {
        throw new Error("Please call 'engine.init()' first.");
      }
      const source = await this._coreClient.call("addSource", payload);
      if (this._validAudioKind(payload.kind)) {
        await this._audioEngine.addSource({
          id: source.id,
          src: payload.src,
          proxy: payload.proxy,
        });
      }
      return source;
    },
  };

  public readonly tracks = {
    add: async (payload: AddTrackDto) => {
      if (!this._init) {
        throw new Error("Please call 'engine.init()' first.");
      }
      const result = await this._coreClient.call("addTrack", payload);
      this._duration = await this._coreClient.call("getDuration");
      if (this._validAudioKind(result.kind)) {
        this._audioEngine.addTrack(result as VideoTrack | AudioTrack);
      }
      return result.id;
    },
  };

  public readonly clips = {
    add: async (payload: AddClipDto) => {
      if (!this._init) {
        throw new Error("Please call 'engine.init()' first.");
      }
      const result = await this._coreClient.call("addClip", payload);
      this._duration = await this._coreClient.call("getDuration");
      console.log("check");
      if (this._validAudioKind(payload.kind)) {
        console.log("here");
        this._audioEngine.updateTrackClips(
          result.clip.trackId,
          result.actualClipsOnTrack as any,
        );
      }
      return result;
    },
  };

  public get duration() {
    return this._duration;
  }

  private _validAudioKind(kind: MediaKind) {
    return kind === MediaKind.VIDEO || kind === MediaKind.AUDIO;
  }
}

export const engine = new Engine();
