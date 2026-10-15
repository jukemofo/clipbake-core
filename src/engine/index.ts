import { FPS } from "../types/fps";
import { Second } from "../types/time";
import { WorkerClient } from "../workers/client";
import { CoreWorkerAPI } from "../workers/client/type";
import { AddSourceDto } from "../workers/module/dto/source-dto";
import { AddTrackDto } from "../workers/module/dto/track-dto";
import { MasterClock } from "./master-clock";

export class Engine {
  private _coreClient: WorkerClient<CoreWorkerAPI>;
  private _masterClock: MasterClock;
  private _init: boolean = false;

  public constructor() {
    this._coreClient = new WorkerClient(
      new URL("../workers/server/core.worker.ts", import.meta.url),
    );
    this._masterClock = new MasterClock();
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
    const startTime = this._masterClock.getCurrentTime();
    const basePerfTime = performance.timeOrigin + performance.now();

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
    const startTime = this._masterClock.getCurrentTime();
    await this._coreClient.call("stop", {
      time: startTime,
    });
  }

  public async seek(time: Second) {
    if (!this._init) {
      throw new Error("Please call 'engine.init()' first.");
    }
    const duration = 100;
    const clampedTime = Math.max(0, Math.min(time, duration));
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
      return await this._coreClient.call("addSource", payload);
    },
  };

  public readonly tracks = {
    add: async (payload: AddTrackDto) => {
      if (!this._init) {
        throw new Error("Please call 'engine.init()' first.");
      }
      const result = await this._coreClient.call("addTrack", payload);
      return result.id;
    },
  };

  public readonly clips = {};
}

export const engine = new Engine();
