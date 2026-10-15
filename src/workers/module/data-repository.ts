import { nanoid } from "nanoid";
import { Project } from "../../types/project";
import { AnySourceWorker } from "../../types/source";
import { Settings } from "../../types/settings";
import {
  AnyTrack,
  AudioTrack,
  CaptionTrack,
  ImageTrack,
  TextTrack,
  VideoTrack,
} from "../../types/track";
import { MediaKind } from "../../types/kind";
import { AnyClip, VideoClip } from "../../types/clip";

class DataRepository {
  private _project: Project;

  constructor() {
    this._project = {
      id: nanoid(),
      settings: {
        width: 1920,
        height: 1080,
        backgroundColor: "#000000",
        fps: 60,
      },
      sources: new Map(),
      tracks: new Map(),
      videoTrackIds: [],
      audioTrackIds: [],
      imageTrackIds: [],
      captionTrackIds: [],
      textTrackIds: [],
      visualTrackOrders: [],
      audioTrackOrders: [],
    };
  }

  public readonly settings = {
    update: (settings: Partial<Settings>) => {
      this._project.settings = { ...this._project.settings, ...settings };
    },
  };

  public readonly sources = {
    add: (source: AnySourceWorker) => {
      this._project.sources.set(source.id, source);
    },
    delete: (sourceId: string) => {
      this._project.sources.delete(sourceId);
    },
    get: (sourceId: string) => {
      return this._project.sources.get(sourceId);
    },
  };

  public readonly tracks = {
    add: (track: AnyTrack) => {
      const trackId = track.id;
      this._project.tracks.set(trackId, track);
      if (track.kind === MediaKind.AUDIO) {
        this._project.audioTrackOrders.push(trackId);
      } else {
        this._project.visualTrackOrders.push(trackId);
      }
      switch (track.kind) {
        case MediaKind.VIDEO:
          this._project.videoTrackIds.push(trackId);
          break;
        case MediaKind.AUDIO:
          this._project.audioTrackIds.push(trackId);
          break;
        case MediaKind.IMAGE:
          this._project.imageTrackIds.push(trackId);
          break;
        case MediaKind.CAPTION:
          this._project.captionTrackIds.push(trackId);
          break;
        case MediaKind.TEXT:
          this._project.textTrackIds.push(trackId);
          break;
      }
    },
  };

  public readonly clips = {
    add: (clip: AnyClip): AnyClip[] => {
      const track = this._project.tracks.get(clip.trackId);
      if (!track) {
        throw new Error(`Track ${clip.trackId} doesn't exist!`);
      }
      const clipKind = clip.kind;

      if (clipKind !== track.kind) {
        throw new Error(`Track kind unmatch! (${track.kind} != ${clipKind})`);
      }

      switch (clipKind) {
        case MediaKind.VIDEO:
          this._throwIfSourceNotExisted(clip.sourceId);
          (track as VideoTrack).clips.push(clip);
          break;
        case MediaKind.AUDIO:
          this._throwIfSourceNotExisted(clip.sourceId);
          (track as AudioTrack).clips.push(clip);
          break;
        case MediaKind.IMAGE:
          this._throwIfSourceNotExisted(clip.sourceId);
          (track as ImageTrack).clips.push(clip);
          break;
        case MediaKind.CAPTION:
          this._throwIfSourceNotExisted(clip.sourceId);
          (track as CaptionTrack).clips.push(clip);
          break;
        case MediaKind.TEXT:
          this._throwIfSourceNotExisted(clip.sourceId);
          (track as TextTrack).clips.push(clip);
          break;
        default:
          throw new Error(`Unsupport clip's type "${clipKind}"`);
      }

      this._normalizedClipsOnTrack(track);

      return track.clips;
    },
  };

  private _throwIfSourceNotExisted(sourceId: string) {
    const source = this._project.sources.get(sourceId);
    if (!source) {
      throw new Error(`Source ${sourceId} doesn't exist!`);
    }
  }

  private _normalizedClipsOnTrack(track: AnyTrack) {
    track.clips.sort((a, b) => a.start - b.start);

    for (let i = 1; i < track.clips.length; i++) {
      let prevClip = track.clips[i - 1];
      let currentClip = track.clips[i];

      let prevEnd = prevClip.start + prevClip.duration;

      if (currentClip.start < prevEnd) {
        currentClip.start = prevEnd;
      }
    }
  }
}

export const dataRepository = new DataRepository();
