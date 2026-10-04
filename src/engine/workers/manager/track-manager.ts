import { VideoClipPreview, VideoClipWorker } from "../../core-manager/clip";
import {
  VideoTrack,
  VideoTrackWorkerDeprecated,
} from "../../core-manager/track";
import { sourceManager } from "./source-manager";

export class TrackManager {
  private _videoTracks: Map<string, VideoTrackWorkerDeprecated> = new Map();
  private _trackOrders: string[] = [];

  public addVideoTrack(id: string): VideoTrackWorkerDeprecated {
    const track = new VideoTrackWorkerDeprecated(id);
    this._videoTracks.set(id, track);
    this._trackOrders.push(id);

    return track;
  }

  public async addVideoClip(clip: VideoClipWorker, id: string) {
    const track = this._videoTracks.get(id);
    if (!track) {
      throw new Error("Not found video track");
    }
    if (!sourceManager.getVideoSource(clip.sourceId)) {
      throw new Error("Not found source");
    }
    await track.addClip(clip);
  }

  public async renderAt(currentTime: number) {
    await Promise.all(
      Array.from(this._videoTracks.values()).map((t) =>
        t.renderAt(currentTime),
      ),
    );
  }

  public async seek(targetTime: number, highQuality: boolean) {
    await Promise.all(
      Array.from(this._videoTracks.values()).map((t) =>
        t.seek(targetTime, highQuality),
      ),
    );
  }

  public isStarving() {
    return Array.from(this._videoTracks.values()).some((t) => t.isStarving());
  }

  static toVideoTrackPreview(
    videoTrack: VideoTrackWorkerDeprecated,
  ): VideoTrack {
    return { id: videoTrack.id };
  }

  static toVideoClipPreview(videoClip: VideoClipWorker): VideoClipPreview {
    return { id: videoClip.id };
  }
}

export const trackManager = new TrackManager();
