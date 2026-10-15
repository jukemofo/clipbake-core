import { InputAudioTrack, InputVideoTrack } from "mediabunny";
import { Second } from "./time";
import { Word } from "./words";

export interface BaseSource {
  id: string;
  name: string;
}

export interface VideoSource extends BaseSource {
  kind: "video";
  duration: Second;
  width: number;
  height: number;
  fps: number;
}

export interface VideoSourceWorker extends VideoSource {
  vidTrack: InputVideoTrack;
  audTrack?: InputAudioTrack | null;
  proxyVidTrack?: InputVideoTrack | null;
  proxyAudTrack?: InputAudioTrack | null;
}

export interface AudioSource extends BaseSource {
  kind: "audio";
  duration: Second;
}

export interface AudioSourceWorker extends AudioSource {
  audTrack: InputAudioTrack;
  proxyAudTrack?: InputAudioTrack | null;
}

export interface ImageSource extends BaseSource {
  kind: "image";
  width: number;
  height: number;
}

export interface ImageSourceWorker extends ImageSource {
  canvas: OffscreenCanvas;
}

export interface CaptionSource extends BaseSource {
  kind: "caption";
  duration: Second;
}

export interface CaptionSourceWorker extends CaptionSource {
  captions: Word[];
}

export type AnySource = VideoSource | AudioSource | ImageSource | CaptionSource;

export type AnySourceWorker =
  | VideoSourceWorker
  | AudioSourceWorker
  | ImageSourceWorker
  | CaptionSourceWorker;

export type SourceKind = AnySource["kind"];
