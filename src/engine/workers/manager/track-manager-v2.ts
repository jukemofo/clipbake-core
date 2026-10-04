import { VideoClip } from "../../core-manager/clip";
import { VideoClipRender } from "../render/video-clip-render";
import { VideoTrackRender } from "../render/video-track-render";
import { sourceManager } from "./source-manager";

export class TrackManagerV2 {
  private _videoTracks: Map<string, VideoTrackRender> = new Map();
  private _trackOrders: string[] = [];

  public addVideoTrack(id: string): VideoTrackRender {
    const track = new VideoTrackRender(id);
    this._videoTracks.set(id, track);
    this._trackOrders.push(id);

    return track;
  }

  public addVideoClip(clip: VideoClip, id: string) {
    const track = this._videoTracks.get(id);
    if (!track) {
      throw new Error("Not found video track");
    }
    if (!sourceManager.getVideoSource(clip.sourceId)) {
      throw new Error("Not found source");
    }
    track.addClip(new VideoClipRender(clip));
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
    // return Array.from(this._videoTracks.values()).some((t) => t.isStarving());
  }
}

export const trackManagerV2 = new TrackManagerV2();
