export type TickCallback = (currentTime: number) => void;
export type SeekCallback = (
  targetTime: number,
  highQuality: boolean,
) => void | Promise<void>;

export class PlaybackController {
  private _rafId: number | null = null;
  private _isPlaying = false;
  private _startTime = 0;
  private _basePerfTime = 0;
  private _currentTime = 0;
  private _onTick: TickCallback;
  private _onSeek: SeekCallback;

  constructor({
    onTick,
    onSeek,
  }: {
    onTick: TickCallback;
    onSeek: SeekCallback;
  }) {
    this._onTick = onTick;
    this._onSeek = onSeek;
  }

  public play(startTime: number, basePerfTime: number) {
    this._startTime = startTime;
    this._basePerfTime = basePerfTime;

    if (this._isPlaying) return;

    this._isPlaying = true;
    this._loop();
  }

  public pause(pausedTime?: number, noRender?: boolean) {
    this._isPlaying = false;

    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    if (pausedTime !== undefined) {
      this._currentTime = pausedTime;
      if (noRender) {
        this._onTick(this._currentTime);
      }
    }
  }

  public async seek(seekedTime: number, highQuality: boolean) {
    await this._onSeek(seekedTime, highQuality);
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
