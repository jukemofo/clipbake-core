export type TickCallback = (currentTime: number) => void;

export class PlaybackController {
  private _rafId: number | null = null;
  private _isPlaying = false;
  private _startTime = 0;
  private _basePerfTime = 0;
  private _currentTime = 0;
  private _onTick: TickCallback;

  constructor(onTick: TickCallback) {
    this._onTick = onTick;
  }

  public play(startTime: number, basePerfTime: number) {
    this._startTime = startTime;
    this._basePerfTime = basePerfTime;

    if (this._isPlaying) return;

    this._isPlaying = true;
    this._loop();
  }

  public pause(pausedTime?: number) {
    this._isPlaying = false;

    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    if (pausedTime !== undefined) {
      this._currentTime = pausedTime;
      this._onTick(this._currentTime);
    }
  }

  private _loop = () => {
    if (!this._isPlaying) return;

    const currentWorkerAbsoluteTime =
      performance.timeOrigin + performance.now();
    const elapsed = (currentWorkerAbsoluteTime - this._basePerfTime) / 1000;

    this._currentTime = this._startTime + elapsed;
    this._onTick(this._currentTime);
    this._rafId = requestAnimationFrame(this._loop);
  };

  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  public get currentTime(): number {
    return this._currentTime;
  }
}
