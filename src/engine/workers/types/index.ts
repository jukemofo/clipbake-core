import {
  ImageClip,
  MediaClipProperty,
  VideoClip,
} from "../../core-manager/clip";
import { ImageSource, VideoSource } from "../../core-manager/source";
import { ImageTrack, VideoTrack } from "../../core-manager/track";

export type InitMessage = {
  type: "INIT";
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  backgroundColor: string;
  fps: number;
};

export type PlayMessage = {
  type: "PLAY";
  startTime: number;
  basePerfTime: number;
};

export type PauseMessage = { type: "PAUSE"; time: number };

export type SeekMessage = { type: "SEEK"; time: number; highQuality: boolean };

export type ResizeMessage = { type: "RESIZE"; width: number; height: number };

export type AddVideoSourceMessage = {
  type: "ADD_VIDEO_SOURCE";
  id: string;
  inputSource: File | string;
  proxySource?: File | string;
};

export type AddImageSourceMessage = {
  type: "ADD_IMAGE_SOURCE";
  id: string;
  inputSource: File | string;
  proxySource?: File | string;
};

export type AddVideoTrackMessage = {
  type: "ADD_VIDEO_TRACK";
  id: string;
};

export type AddImageTrackMessage = {
  type: "ADD_IMAGE_TRACK";
  id: string;
};

export type AddVideoClipMessage = {
  type: "ADD_VIDEO_CLIP";
  id: string;
  trackId: string;
  sourceId: string;
  start: number;
  sourceStart: number;
  duration: number;
  property?: Partial<MediaClipProperty>;
  currentTime: number;
};

export type AddImageClipMessage = {
  type: "ADD_IMAGE_CLIP";
  id: string;
  trackId: string;
  sourceId: string;
  start: number;
  duration: number;
  property?: Partial<MediaClipProperty>;
  currentTime: number;
};

export type MainToWorkerMessage =
  | InitMessage
  | PlayMessage
  | PauseMessage
  | SeekMessage
  | ResizeMessage
  | AddVideoSourceMessage
  | AddImageSourceMessage
  | AddVideoTrackMessage
  | AddImageTrackMessage
  | AddVideoClipMessage
  | AddImageClipMessage;

export type WrappedMainToWorkerMessage = MainToWorkerMessage & {
  requestId: string;
};

type StatusType = "failed" | "success";

export type WorkerToMainMessage =
  | {
      type: "WORKER_READY";
      status: StatusType;
      errorMsg?: string;
      requestId: string;
    }
  | {
      type: "INIT_COMPLETED";
      status: StatusType;
      errorMsg?: string;
      requestId: string;
    }
  | {
      type: "SEEK_RESOLVED";
      time: number;
      status: StatusType;
      errorMsg?: string;
      requestId: string;
    }
  | {
      type: "BUFFER_WAIT";
      status: StatusType;
      errorMsg?: string;
      requestId: string;
    }
  | {
      type: "BUFFER_RESOLVED";
      status: StatusType;
      errorMsg?: string;
      requestId: string;
    }
  | {
      type: "FINISH_ADD_VIDEO_SOURCE";
      data?: VideoSource;
      status: StatusType;
      errorMsg?: string;
      requestId: string;
    }
  | {
      type: "FINISH_ADD_IMAGE_SOURCE";
      data?: ImageSource;
      status: StatusType;
      errorMsg?: string;
      requestId: string;
    }
  | {
      type: "FINISH_ADD_VIDEO_TRACK";
      data?: VideoTrack;
      status: StatusType;
      errorMsg?: string;
      requestId: string;
    }
  | {
      type: "FINISH_ADD_IMAGE_TRACK";
      data?: ImageTrack;
      status: StatusType;
      errorMsg?: string;
      requestId: string;
    }
  | {
      type: "FINISH_ADD_VIDEO_CLIP";
      data?: VideoClip[];
      status: StatusType;
      errorMsg?: string;
      requestId: string;
    }
  | {
      type: "FINISH_ADD_IMAGE_CLIP";
      data?: ImageClip[];
      status: StatusType;
      errorMsg?: string;
      requestId: string;
    };
