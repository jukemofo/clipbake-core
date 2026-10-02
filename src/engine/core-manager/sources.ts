import {
  AudioBufferSink,
  CanvasSink,
  InputAudioTrack,
  InputVideoTrack,
} from "mediabunny";
import { nanoid } from "nanoid";
import { getImageDimensions } from "../workers/util/img";

export interface VideoSourcePreview {
  id: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  sampleRate?: number;
  numberOfChannels?: number;
}

export interface VideoSourceWorker extends VideoSourcePreview {
  vidTrack: InputVideoTrack;
  vidSink: CanvasSink;
  audTrack?: InputAudioTrack | null;
  audSink?: AudioBufferSink | null;
  proxyVidSink?: CanvasSink | null;
  proxyAudSink?: AudioBufferSink | null;
}

export interface AudioSourcePreview {
  id: string;
  duration: number;
  sampleRate?: number;
  numberOfChannels?: number;
}

export interface AudioSourceWorker extends AudioSourcePreview {
  audTrack: InputAudioTrack | null;
  audSink: AudioBufferSink | null;
  proxyAudSink?: AudioBufferSink | null;
}

export interface ImageSourcePreview {
  id: string;
  width: number;
  height: number;
}

export interface ImageSourceWorker extends ImageSourcePreview {
  canvas: OffscreenCanvas;
  proxyCanvas?: OffscreenCanvas;
}

// export class ImageSource {
//   private _id: string;
//   private _width?: number;
//   private _height?: number;
//   private _proxy?: File | string;
//   private _original?: File | string;

//   private constructor() {
//     this._id = nanoid();
//   }

//   static async from(input: File | string) {
//     // try {
//     //   const { width, height } = await getImageDimensions(proxy);
//     //   const source = new ImageSource();
//     //   source._id = options?.id ?? source._id;
//     //   source._proxy = proxy;
//     //   source._original = options?.original ?? proxy;
//     //   source._width = width;
//     //   source._height = height;
//     //   return source;
//     // } catch (e) {
//     //   throw e;
//     // }
//   }

// }
