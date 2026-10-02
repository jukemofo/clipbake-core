import { Builder } from "builder-pattern";
import { VideoTrackPreview, VideoTrackWorker } from "../../core-manager/track";
import { VideoClipPreview, VideoClipWorker } from "../../core-manager/clip";
import { sourceManager } from "./source-manager";

export class TrackDataManager {
  private _videoTracks: Map<string, VideoTrackWorker> = new Map();
  private _trackOrders: string[] = [];

  public addVideoTrack(id: string): VideoTrackWorker {
    const track = Builder<VideoTrackWorker>()
      .id(id)
      .clips(new Map())
      .clipWorkers(new Map())
      .muted(false)
      .visible(false)
      .clipOrders([])
      .build();
    this._videoTracks.set(id, track);
    this._trackOrders.push(id);

    return track;
  }

  public addVideoClip(clip: VideoClipWorker, id: string) {
    const track = this._videoTracks.get(id);
    if (!track) {
      throw new Error("Not found video track");
    }
    if (!sourceManager.getVideoSource(clip.sourceId)) {
      throw new Error("Not found source");
    }
    track.clipWorkers.set(clip.id, clip);

    let sortedClips = Array.from(track.clipWorkers.values()).sort(
      (a, b) => a.start - b.start,
    );

    for (let i = 1; i < sortedClips.length; i++) {
      let prevClip = sortedClips[i - 1];
      let currentClip = sortedClips[i];

      let prevEnd = prevClip.start + prevClip.duration;

      if (currentClip.start < prevEnd) {
        currentClip.start = prevEnd;

        track.clipWorkers.set(currentClip.id, currentClip);
      }
    }

    track.clipOrders = sortedClips.map((c) => c.id);
  }

  static toVideoTrackPreview(videoTrack: VideoTrackWorker): VideoTrackPreview {
    const { clipOrders, clipWorkers, ...rest } = videoTrack;
    return { ...rest };
  }

  static toVideoClipPreview(videoClip: VideoClipWorker): VideoClipPreview {
    return { ...videoClip };
  }
}

export const trackDataManager = new TrackDataManager();
