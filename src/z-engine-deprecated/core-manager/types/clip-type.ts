import { Id, Microseconds } from "./common-type";
import { WordType } from "./transcript-type";

export type ClipKind = "video" | "image" | "audio" | "text" | "caption";

/** Toạ độ theo canvas (pixel của settings.width/height), gốc ở góc trên trái. */
export interface Transform {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  anchorX: number;
  anchorY: number;
  opacity: number;
}

export interface AudioProps {
  volume: number;
  muted: boolean;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number | "normal" | "bold";
  color: string;
  align: "left" | "center" | "right";
}

export interface CaptionStyle extends TextStyle {
  /** Màu từ đang được đọc (highlight theo word timing). */
  activeColor?: string;
  maxWidth?: number;
}

export type Keyframe<T = Transform> = {
  [K in keyof T]: {
    key: K;
    /** `time` tính từ đầu clip (không phải timeline). */
    frames: { time: Microseconds; value: T[K] }[];
  };
}[keyof T];

interface BaseClip<K extends ClipKind> {
  id: Id;
  type: K;
  trackId: Id;
  /** Vị trí bắt đầu trên timeline. */
  start: Microseconds;
  /** Độ dài trên timeline. */
  duration: Microseconds;
}

/** Clip lấy dữ liệu từ source: có đoạn cắt `sourceStart`. */
interface SourcedClip {
  sourceId: Id;
  /** Điểm bắt đầu trong source (expect.md gọi là `in`). */
  sourceStart: Microseconds;
}

export interface VideoClipType extends BaseClip<"video">, SourcedClip {
  transform: Transform;
  audio: AudioProps;
  keyframes: Keyframe[];
}

export interface ImageClipType extends BaseClip<"image"> {
  sourceId: Id;
  transform: Transform;
  keyframes: Keyframe[];
}

export interface AudioClipType extends BaseClip<"audio">, SourcedClip {
  audio: AudioProps;
}

export interface TextClipType extends BaseClip<"text"> {
  content: string;
  style: TextStyle;
  transform: Transform;
  keyframes: Keyframe[];
}

export interface CaptionClipType extends BaseClip<"caption"> {
  content: string;
  /** Thời gian từng từ, tính từ đầu clip. */
  words: WordType[];
  style: CaptionStyle;
  transform: Transform;
}

export type AnyClip =
  | VideoClipType
  | ImageClipType
  | AudioClipType
  | TextClipType
  | CaptionClipType;

export type ClipOfKind<K extends ClipKind> = Extract<AnyClip, { type: K }>;

// ---- Input / patch cho engine.clips.add / engine.clips.update ----

type GroupKey = "transform" | "audio" | "style";

type ClipFields<K extends ClipKind> = Omit<
  ClipOfKind<K>,
  "id" | "type" | "trackId" | "keyframes" | GroupKey
>;

type ClipGroups<K extends ClipKind> = {
  [P in GroupKey & keyof ClipOfKind<K>]?: Partial<ClipOfKind<K>[P]>;
};

/** `type` suy ra từ track; các nhóm transform/audio/style có default nên optional. */
export type ClipInput<K extends ClipKind = ClipKind> = K extends ClipKind
  ? ClipFields<K> & ClipGroups<K> & { trackId: Id }
  : never;

/** Patch nông theo từng field, riêng transform/audio/style merge theo key con. */
export type ClipPatch<K extends ClipKind = ClipKind> = K extends ClipKind
  ? Partial<ClipFields<K>> & ClipGroups<K> & { trackId?: Id }
  : never;
