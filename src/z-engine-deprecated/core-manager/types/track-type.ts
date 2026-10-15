import { ClipKind } from "./clip-type";
import { Id } from "./common-type";

/** Track kind trùng 1-1 với clip kind: track nào chỉ chứa clip loại đó. */
export type TrackKind = ClipKind;

interface BaseTrack<K extends TrackKind> {
  id: Id;
  type: K;
  name?: string;
  locked: boolean;
  /** Id clip, luôn sắp theo `start` tăng dần. Là danh sách thứ tự, không phải nguồn sự thật của trackId. */
  clipIds: Id[];
}

interface Visual {
  visible: boolean;
}

interface Audible {
  muted: boolean;
}

export type VideoTrackType = BaseTrack<"video"> & Visual & Audible;
export type ImageTrackType = BaseTrack<"image"> & Visual;
export type AudioTrackType = BaseTrack<"audio"> & Audible;
export type TextTrackType = BaseTrack<"text"> & Visual;
export type CaptionTrackType = BaseTrack<"caption"> & Visual;

export type AnyTrack =
  | VideoTrackType
  | ImageTrackType
  | AudioTrackType
  | TextTrackType
  | CaptionTrackType;

export type TrackOfKind<K extends TrackKind> = Extract<AnyTrack, { type: K }>;

export type TrackInput<K extends TrackKind = TrackKind> = K extends TrackKind
  ? { kind: K } & Partial<Omit<TrackOfKind<K>, "id" | "type" | "clipIds">>
  : never;

export type TrackPatch<K extends TrackKind = TrackKind> = K extends TrackKind
  ? Partial<Omit<TrackOfKind<K>, "id" | "type" | "clipIds">>
  : never;
