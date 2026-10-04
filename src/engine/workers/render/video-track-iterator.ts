import { WrappedCanvas } from "mediabunny";
import { VideoClipWorker } from "../../core-manager/clip";

export class VideoTrackIterator {
  private _clips: VideoClipWorker[] = [];
  private _currentClip: VideoClipWorker | null = null;
  private _currentTime: number = 0;

  public async rebuild(currentTime: number, clips: VideoClipWorker[]) {
    await this.clear();
    this._currentTime = currentTime;
    this._clips = this._truncateClips(currentTime, clips);
    for (const clip of this._clips) {
      clip.rebuild();
    }
    const firstClip = this._clips.at(0);
    if (firstClip) {
      const sourceTime = this._getSourceTime(currentTime, firstClip);
      firstClip.load(sourceTime);
    }
  }

  public async next(clip: VideoClipWorker) {}

  public async nextOld() {
    while (true) {
      if (!this._currentClip) {
        this._currentClip = this._clips.shift() || null;
      }
      if (!this._currentClip) {
        return undefined;
      }

      if (!this._currentClip.iterator) {
        console.warn("Clip missing iterator, skipping:", this._currentClip);
        this._currentClip = null;
        continue;
      }

      const itResult = await this._currentClip.iterator.next();

      if (itResult.done) {
        const clip = this._currentClip;
        this._currentClip = null;
        if (itResult.value !== undefined) {
          return { clip: clip, value: itResult.value };
        }
        continue;
      }

      return { clip: this._currentClip, value: itResult.value };
    }
  }

  private _findCurrentClip(currentTime: number) {
    let currentClip = null;
    for (const clip of this._clips) {
      if (
        clip &&
        clip.start <= currentTime &&
        currentTime < clip.start + clip.duration
      ) {
        currentClip = clip;
        break;
      }
    }
    return currentClip;
  }

  private _truncateClips(
    currentTime: number,
    clips: VideoClipWorker[],
  ): VideoClipWorker[] {
    const firstValidIndex = clips.findIndex(
      (clip) => clip && clip.start + clip.duration >= currentTime,
    );
    if (firstValidIndex === -1) {
      return [];
    }
    return clips.slice(firstValidIndex);
  }

  private _getSourceTime(currentTime: number, clip: VideoClipWorker) {
    const elapsed = currentTime - clip.start;
    return clip.sourceStart + Math.max(elapsed, 0);
  }

  public async clear() {
    await this._currentClip?.clear();
    this._currentClip = null;
  }
}
