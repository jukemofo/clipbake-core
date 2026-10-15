import { Application, DOMAdapter, WebWorkerAdapter } from "pixi.js";
import { Settings } from "../../types/settings";
import { Second } from "../../types/time";
import { TickCallback } from "../../types/callback";

DOMAdapter.set(WebWorkerAdapter);

export let app: Application | null = null;

export class RenderService {
  private _app: Application;
  private _isInit: boolean;
  private _rafId: number | null = null;
  private _isPlaying: boolean = false;
  private _startTime: Second = 0;
  private _basePerfTime: number = 0;
  private _currentTime: Second = 0;
  private _onTick: TickCallback | null = null;

  constructor() {
    this._app = new Application();
    this._isInit = false;
  }

  public async init(canvas: OffscreenCanvas, settings: Settings) {
    await this._app.init({
      canvas: canvas,
      width: settings.width,
      height: settings.height,
      background: settings.backgroundColor,
    });
    this._isInit = true;
  }

  public async start(time: Second, basePerfTime: number, onTick: TickCallback) {
    if (!this._isInit) {
      throw new Error("Please call 'engine.init()' first.");
    }
    this._startTime = time;
    this._basePerfTime = basePerfTime;

    if (this._isPlaying) return;
    this._isPlaying = true;
    this._onTick = onTick;
    this._loop();
  }

  public async stop(time: Second) {
    if (!this._isInit) {
      throw new Error("Please call 'engine.init()' first.");
    }
    this._isPlaying = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this._currentTime = time;
  }

  public async seek(time: Second) {
    if (!this._isInit) {
      throw new Error("Please call 'engine.init()' first.");
    }
    this._currentTime = time;
  }

  private _loop() {
    if (!this._isPlaying) return;

    const currentWorkerAbsoluteTime =
      performance.timeOrigin + performance.now();
    const elapsed = (currentWorkerAbsoluteTime - this._basePerfTime) / 1000;

    this._currentTime = this._startTime + elapsed;
    this._onTick?.(this._currentTime);
    this._rafId = requestAnimationFrame(this._loop.bind(this));
  }
}
