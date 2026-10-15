export class MasterClock {
  private audioCtx: AudioContext | null = null;
  private _currentTime: number = 0;

  private _timelineStartTime: number = 0;
  private _audioContextStartTime: number = 0;

  private _isPlaying: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      document.addEventListener(
        "visibilitychange",
        this.handleVisibilityChange,
      );
    }
  }

  private handleVisibilityChange = () => {
    if (document.hidden && this.audioCtx && this.audioCtx.state === "running") {
      this.pause();
      this.audioCtx.suspend();
    }
  };

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume();
    }
  }

  public play() {
    if (this._isPlaying) return;
    this.initAudioContext();

    this._isPlaying = true;
    this._timelineStartTime = this._currentTime;
    this._audioContextStartTime = this.audioCtx!.currentTime;
  }

  public pause() {
    if (!this._isPlaying) return;

    this._currentTime = this.getCurrentTime();
    this._isPlaying = false;
  }

  public seek(targetTime: number) {
    this._currentTime = targetTime;

    if (this._isPlaying) {
      this._timelineStartTime = targetTime;
      this._audioContextStartTime = this.audioCtx!.currentTime;
    }
  }

  public get audioContext(): AudioContext | null {
    return this.audioCtx;
  }

  public getCurrentTime(): number {
    if (!this._isPlaying || !this.audioCtx) {
      return this._currentTime;
    }

    const elapsed = this.audioCtx.currentTime - this._audioContextStartTime;
    return this._timelineStartTime + elapsed;
  }

  public async destroy() {
    if (typeof window !== "undefined") {
      document.removeEventListener(
        "visibilitychange",
        this.handleVisibilityChange,
      );
    }

    this._isPlaying = false;
    this._currentTime = 0;

    if (this.audioCtx && this.audioCtx.state !== "closed") {
      await this.audioCtx.close();
      this.audioCtx = null;
    }
  }
}

export const masterClock = new MasterClock();
