import { TickCallback } from "../../types/callback";
import { Second } from "../../types/time";

export class LoopService {
  private _rafId: number | null = null;
  private _isPlaying: boolean = false;
  private _startTime: Second = 0;
  private _basePerfTime: number = 0;
  private _currentTime: Second = 0;
  private _onTick: TickCallback | null = null;

  public start(time: Second, basePerfTime: number, onTick: TickCallback) {
    this._startTime = time;
    this._basePerfTime = basePerfTime;

    if (this._isPlaying) return;
    this._isPlaying = true;
    this._onTick = onTick;
    this._loop();
  }

  public stop(time: Second) {
    this._isPlaying = false;
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
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
