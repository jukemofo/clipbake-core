import { ImageClip, VideoClip } from "../../core-manager/clip";
import { ImageTrackRender } from "../render/image-track-render";
import { VideoClipRender } from "../render/video-clip-render";
import { VideoTrackRender } from "../render/video-track-render";
import { sourceManager } from "./source-manager";

export class TrackManager {
  private _videoTracks: Map<string, VideoTrackRender> = new Map();
  private _imageTracks: Map<string, ImageTrackRender> = new Map();
  private _visualTrackOrders: string[] = [];

  public addVideoTrack(id: string): VideoTrackRender {
    const existed = this._videoTracks.get(id);
    if (existed) {
      return existed;
    }
    this._visualTrackOrders.push(id);
    const track = new VideoTrackRender(id);
    track.updateOrder(this._visualTrackOrders.findIndex((t) => t === id));
    this._videoTracks.set(id, track);
    return track;
  }

  public addImageTrack(id: string): ImageTrackRender {
    const existed = this._imageTracks.get(id);
    if (existed) {
      return existed;
    }
    this._visualTrackOrders.push(id);
    const track = new ImageTrackRender(id);
    track.updateOrder(this._visualTrackOrders.findIndex((t) => t === id));
    this._imageTracks.set(id, track);
    return track;
  }

  public addVideoClip(clip: VideoClip, id: string) {
    const track = this._videoTracks.get(id);
    if (!track) {
      throw new Error("Not found video track");
    }

    if (track.isClipExisted(clip.id)) {
      return track.rawClips;
    }

    if (!sourceManager.getVideoSource(clip.sourceId)) {
      throw new Error("Not found source");
    }
    const renderClip = new VideoClipRender(clip);
    track.addClip(renderClip);

    return track.rawClips;
  }

  public addImageClip(clip: ImageClip, id: string) {
    const track = this._imageTracks.get(id);
    if (!track) {
      throw new Error("Not found image track");
    }

    if (track.isClipExisted(clip.id)) {
      return track.rawClips;
    }

    if (!sourceManager.getImageSource(clip.sourceId)) {
      throw new Error("Not found source");
    }
    track.addClip(clip);
    return track.rawClips;
  }

  public async renderAt(currentTime: number) {
    const tracks = [
      ...Array.from(this._videoTracks.values()),
      ...Array.from(this._imageTracks.values()),
    ];
    await Promise.all(tracks.map((t) => t.renderAt(currentTime)));
  }

  public async seek(targetTime: number) {
    const tracks = [
      ...Array.from(this._videoTracks.values()),
      ...Array.from(this._imageTracks.values()),
    ];
    await Promise.all(tracks.map((t) => t.seek(targetTime)));
  }

  public async scrub(targetTime: number) {
    const tracks = [
      ...Array.from(this._videoTracks.values()),
      ...Array.from(this._imageTracks.values()),
    ];
    await Promise.all(tracks.map((t) => t.scrub(targetTime)));
  }

  public isStarving() {
    const tracks = [
      ...Array.from(this._videoTracks.values()),
      ...Array.from(this._imageTracks.values()),
    ];
    return tracks.some((t) => t.isStarving());
  }

  public async close() {
    const tracks = [
      ...Array.from(this._videoTracks.values()),
      ...Array.from(this._imageTracks.values()),
    ];
    await Promise.all(tracks.map((t) => t.close()));
  }
}

export const trackManager = new TrackManager();
