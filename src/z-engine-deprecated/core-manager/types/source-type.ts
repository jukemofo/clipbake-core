import { Id, Microseconds } from "./common-type";

export type SourceKind = "video" | "image" | "audio";

interface BaseSource<K extends SourceKind> {
  id: Id;
  type: K;
  name?: string;
}

export interface VideoSourceType extends BaseSource<"video"> {
  duration: Microseconds;
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  sampleRate?: number;
  numberOfChannels?: number;
}

/** Ảnh không có duration tự nhiên: clip ảnh bắt buộc tự truyền `duration`. */
export interface ImageSourceType extends BaseSource<"image"> {
  width: number;
  height: number;
}

export interface AudioSourceType extends BaseSource<"audio"> {
  duration: Microseconds;
  sampleRate?: number;
  numberOfChannels?: number;
}

export type AnySource = VideoSourceType | ImageSourceType | AudioSourceType;

export type SourceOfKind<K extends SourceKind> = Extract<AnySource, { type: K }>;
