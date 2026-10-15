import { CaptionClip, ImageClip, VideoClip, AudioClip, TextClip } from "./clip";
import { MediaKind } from "./kind";

export interface BaseTrack {
  id: string;
}

export interface VideoTrack extends BaseTrack {
  kind: MediaKind.VIDEO;
  clips: VideoClip[];
}

export interface AudioTrack extends BaseTrack {
  kind: MediaKind.AUDIO;
  clips: AudioClip[];
}

export interface ImageTrack extends BaseTrack {
  kind: MediaKind.IMAGE;
  clips: ImageClip[];
}

export interface CaptionTrack extends BaseTrack {
  kind: MediaKind.CAPTION;
  clips: CaptionClip[];
}

export interface TextTrack extends BaseTrack {
  kind: MediaKind.TEXT;
  clips: TextClip[];
}

export type AnyTrack =
  VideoTrack | AudioTrack | ImageTrack | CaptionTrack | TextTrack;
