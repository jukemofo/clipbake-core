import { MediaKind } from "./kind";
import { Second } from "./time";

interface BaseClip {
  id: string;
  name: string;
  trackId: string;
  start: Second;
  duration: Second;
}

export interface VideoClip extends BaseClip {
  sourceId: string;
  sourceStart: Second;
  kind: MediaKind.VIDEO;
}

export interface AudioClip extends BaseClip {
  sourceId: string;
  sourceStart: Second;
  kind: MediaKind.AUDIO;
}

export interface ImageClip extends BaseClip {
  sourceId: string;
  kind: MediaKind.IMAGE;
}

export interface CaptionClip extends BaseClip {
  sourceId: string;
  sourceStart: Second;
  kind: MediaKind.CAPTION;
}

export interface TextClip extends BaseClip {
  text: string;
  kind: MediaKind.TEXT;
}

export type AnyClip =
  VideoClip | AudioClip | ImageClip | CaptionClip | TextClip;
