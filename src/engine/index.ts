import { v4 as uuid } from "uuid";
import { CoreManager } from "./core-manager";
import { masterClock } from "./master-clock";
import { playbackMachine } from "./playback-state-machine";
import { PlaybackState } from "./playback-state-machine/types";
import {
  MainToWorkerMessage,
  WorkerToMainMessage,
  WrappedMainToWorkerMessage,
} from "./workers/types";
import { AudioEngine } from "./audio-engine";

type CoordinateEvents = {
  "playback:time-update": number;
  "playback:duration-update": number;
  "playback:play": void;
  "playback:pause": void;
  "playback:start-init": void;
  "playback:end-init": void;
  "playback:buffering": void;
  "playback:buffer-resolved": void;
};

type FPS_TYPE = 24 | 30 | 60;

type WorkerResponseCallback = (
  value: WorkerToMainMessage | PromiseLike<WorkerToMainMessage>,
) => void;

export class EngineCoordinator {
  private _init: boolean = false;
  private _playHeadAnimId: number | null = null;
  private _width: number = 1920;
  private _height: number = 1080;
  private _backgroundColor: string = "#000000";
  private _fps: FPS_TYPE = 60;
  private _version: `${number}.${number}.${number}` = "1.0.0";
  private _listeners: Map<string, Set<(data: any) => void>> = new Map();
  private _unsubFSM: (() => void) | null = null;
  private _worker: Worker | null = null;
  private _WORKER_URL = new URL("./workers/engine.worker.ts", import.meta.url);
  private _pendingWorkerRequests: Map<string, WorkerResponseCallback> =
    new Map();
  private _coreManager: CoreManager;
  private _audioEngine: AudioEngine;

  constructor() {
    this._unsubFSM?.();
    this._unsubFSM = playbackMachine.sub(this._handleStateChange);
    if (typeof window !== "undefined") {
      document.addEventListener(
        "visibilitychange",
        this._handleVisibilityChange,
      );
    }
    this._coreManager = new CoreManager(this, this._sendToWorkerAndWait);
    this._audioEngine = new AudioEngine(this._coreManager);
  }

  public init(
    canvas: HTMLCanvasElement,
    options?: {
      width?: number;
      height?: number;
      backgroundColor?: string;
      fps?: FPS_TYPE;
    },
  ) {
    if (this._worker) {
      this._worker.terminate();
      this._worker = null;
    }
    this._width = options?.width ?? 1920;
    this._height = options?.height ?? 1080;
    this._backgroundColor = options?.backgroundColor ?? "#000000";
    this._fps = options?.fps ?? 60;
    this._worker = new Worker(this._WORKER_URL, { type: "module" });
    const offscreenCanvas = canvas?.transferControlToOffscreen();
    this._worker.onmessage = this._handleWorkerMessage;
    this.pub("playback:start-init");
    this._worker.postMessage(
      {
        type: "INIT",
        canvas: offscreenCanvas,
        width: this._width,
        height: this._height,
        backgroundColor: this._backgroundColor,
        fps: this._fps,
      } as MainToWorkerMessage,
      [offscreenCanvas],
    );
  }

  public play(): boolean {
    if (!this._init) {
      throw new Error("Please init the engine first!");
    }
    if (masterClock.getCurrentTime() >= this.core.duration) {
      this.seek(0);
    }
    return playbackMachine.send("PLAY");
  }

  public pause(): boolean {
    if (!this._init) {
      throw new Error("Please init the engine first!");
    }
    return playbackMachine.send("PAUSE");
  }

  public togglePlay(): boolean {
    const state = playbackMachine.currentState;
    return state === "PLAYING" ? this.pause() : this.play();
  }

  public seek(targetTime: number) {
    if (!this._init) {
      throw new Error("Please init the engine first!");
    }
    const clampedTime = Math.max(0, Math.min(targetTime, this.core.duration));
    masterClock.seek(clampedTime);
    this.pub("playback:time-update", clampedTime);

    playbackMachine.send("SEEK_START");
    this._sendToWorker({
      type: "SEEK",
      time: clampedTime,
      highQuality: true,
    });
  }

  public startScrub(): boolean {
    if (!this._init) {
      throw new Error("Please init the engine first!");
    }
    return playbackMachine.send("START_SCRUB");
  }

  public scrub(targetTime: number) {
    if (!this._init) {
      throw new Error("Please init the engine first!");
    }
    if (playbackMachine.currentState !== "SCRUBBING") return;

    const clampedTime = Math.max(0, Math.min(targetTime, this.core.duration));
    masterClock.seek(clampedTime);
    this.pub("playback:time-update", clampedTime);
    this._sendToWorker({
      type: "SEEK",
      time: clampedTime,
      highQuality: false,
    });
  }

  public endScrub(finalTime?: number) {
    if (!this._init) {
      throw new Error("Please init the engine first!");
    }
    const target = finalTime ?? masterClock.getCurrentTime();
    playbackMachine.send("END_SCRUB");
    this._sendToWorker({
      type: "SEEK",
      time: target,
      highQuality: true,
    });
  }

  public sub<T extends keyof CoordinateEvents>(
    event: T,
    callback: (data: CoordinateEvents[T]) => void,
  ) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event)!.add(callback);

    return () => {
      this._listeners.get(event)?.delete(callback);
    };
  }

  public async destroy() {
    if (typeof window !== "undefined") {
      document.removeEventListener(
        "visibilitychange",
        this._handleVisibilityChange,
      );
    }
    this._unsubFSM?.();
    this._unsubFSM = null;
    await masterClock.destroy();
    this._audioEngine.pause();
    this._stopPlayHeadLoop();
    this._listeners.clear();
    this._init = false;
    if (this._worker) {
      this._worker.terminate();
      this._worker = null;
    }
    this._coreManager.close();
  }

  public pub<T extends keyof CoordinateEvents>(
    event: T,
    ...args: CoordinateEvents[T] extends void ? [] : [data: CoordinateEvents[T]]
  ) {
    const data = args[0];
    this._listeners.get(event)?.forEach((callback) => callback(data));
  }

  private _startPlayHeadLoop() {
    if (this._playHeadAnimId !== null) return;

    const loop = () => {
      const currentTime = masterClock.getCurrentTime();
      const duration = this.core.duration;

      if (currentTime >= this.core.duration) {
        masterClock.seek(duration);
        this.pub("playback:time-update", duration);
        playbackMachine.send("PAUSE");
        return;
      }

      this.pub("playback:time-update", currentTime);

      this._playHeadAnimId = requestAnimationFrame(loop);
    };

    this._playHeadAnimId = requestAnimationFrame(loop);
  }

  private _stopPlayHeadLoop() {
    if (this._playHeadAnimId !== null) {
      cancelAnimationFrame(this._playHeadAnimId);
      this._playHeadAnimId = null;
    }
  }

  private _sendToWorker(data: MainToWorkerMessage) {
    const requestId = uuid();
    const message: WrappedMainToWorkerMessage = {
      ...data,
      requestId: requestId,
    };
    this._worker?.postMessage(message);

    return requestId;
  }

  private async _sendToWorkerAndWait(
    data: MainToWorkerMessage,
  ): Promise<WorkerToMainMessage> {
    const requestId = this._sendToWorker(data);
    const response = await new Promise<WorkerToMainMessage>((r) => {
      this._pendingWorkerRequests.set(requestId, r);
    });
    if (response.status === "failed") {
      throw new Error(response.errorMsg);
    }
    return response;
  }

  private _handleVisibilityChange = () => {
    if (document.hidden) {
      if (playbackMachine.currentState === "PLAYING") {
        this.pause();
      }
    } else {
      const state = playbackMachine.currentState;
      if (state === "PAUSED") {
        // send to worker
      }
    }
  };

  // Main logic goes here
  private _handleStateChange = (nextState: PlaybackState) => {
    switch (nextState) {
      case "PLAYING": {
        masterClock.play();
        const startTime = masterClock.getCurrentTime();
        const basePerfTime = performance.timeOrigin + performance.now();
        this._sendToWorker({
          type: "PLAY",
          startTime,
          basePerfTime,
        });
        this._startPlayHeadLoop();
        this._audioEngine.start();
        break;
      }

      case "PAUSED": {
        masterClock.pause();
        const pauseTime = masterClock.getCurrentTime();
        this._sendToWorker({
          type: "PAUSE",
          time: pauseTime,
        });

        this._stopPlayHeadLoop();
        this._audioEngine.pause();
        break;
      }

      case "BUFFERING":
        masterClock.pause();
        this._sendToWorker({
          type: "PAUSE",
          time: masterClock.getCurrentTime(),
        });
        this._stopPlayHeadLoop();
        this._audioEngine.pause();
        break;

      case "SCRUBBING":
      case "SEEKING":
      case "EXPORTING":
        masterClock.pause();
        this._stopPlayHeadLoop();
        this._audioEngine.pause();
        break;
    }
  };

  private _handleWorkerMessage = (e: MessageEvent<WorkerToMainMessage>) => {
    const msg = e.data;
    this._pendingWorkerRequests.get(msg.requestId)?.(msg);

    switch (msg.type) {
      case "WORKER_READY":
        break;
      case "INIT_COMPLETED":
        this.pub("playback:end-init");
        this._init = true;
        break;
      case "SEEK_RESOLVED":
        playbackMachine.send("SEEK_RESOLVED");
        this.pub("playback:time-update", msg.time);
        break;
      case "BUFFER_WAIT":
        playbackMachine.send("BUFFER_WAIT");
        this.pub("playback:buffering");
        break;
      case "BUFFER_RESOLVED":
        playbackMachine.send("BUFFER_RESOLVED");
        this.pub("playback:buffer-resolved");
        break;
    }
  };

  // ---------------------- Public api data ---------

  public get core() {
    return this._coreManager;
  }

  public get width() {
    return this._width;
  }

  public get height() {
    return this._height;
  }

  public get fps() {
    return this._fps;
  }

  public get version() {
    return this._version;
  }

  public get isInit() {
    return this._init;
  }
}

export const engine = new EngineCoordinator();
