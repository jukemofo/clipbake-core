import { VideoClip } from "../../core-manager/clip";
import { VideoClipRender } from "../render/video-clip-render";
import { VideoTrackRender } from "../render/video-track-render";
import { sourceManager } from "./source-manager";

export class TrackManager {
  private _videoTracks: Map<string, VideoTrackRender> = new Map();
  private _visualTrackOrders: string[] = [];

  public addVideoTrack(id: string): VideoTrackRender {
    const existed = this._videoTracks.get(id);
    if (existed) {
      return existed;
    }
    this._visualTrackOrders.push(id);
    const track = new VideoTrackRender(id);
    this._videoTracks.set(id, track);
    return track;
  }

  public addVideoClip(clip: VideoClip, id: string) {
    const track = this._videoTracks.get(id);
    if (!track) {
      throw new Error("Not found video track");
    }

    if (track.isClipExisted(clip.id)) {
      return clip;
    }

    if (!sourceManager.getVideoSource(clip.sourceId)) {
      throw new Error("Not found source");
    }
    const renderClip = new VideoClipRender(clip);
    track.addClip(renderClip);
    clip.start = renderClip.start;
    clip.sourceStart = renderClip.sourceStart;
    clip.duration = renderClip.duration;

    return clip;
  }

  public async renderAt(currentTime: number) {
    await Promise.all(
      Array.from(this._videoTracks.values()).map((t) =>
        t.renderAt(currentTime),
      ),
    );
  }

  public async seek(targetTime: number) {
    await Promise.all(
      Array.from(this._videoTracks.values()).map((t) => t.seek(targetTime)),
    );
  }

  public isStarving() {
    return Array.from(this._videoTracks.values()).some((t) => t.isStarving());
  }

  public async close() {
    await Promise.all(
      Array.from(this._videoTracks.values()).map((t) => t.close()),
    );
  }
}

export const trackManager = new TrackManager();
