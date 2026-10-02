import { VideoSourcePreview } from "../../core-manager/sources";

export type MainToWorkerMessage =
  | {
      type: "INIT";
      canvas: OffscreenCanvas;
      width: number;
      height: number;
      backgroundColor: string;
      fps: number;
    }
  | { type: "PLAY"; startTime: number; basePerfTime: number }
  | { type: "PAUSE"; time: number }
  | { type: "SEEK"; time: number; highQuality: boolean }
  | { type: "RESIZE"; width: number; height: number }
  | {
      type: "SOURCE_VIDEO_ADD";
      id: string;
      inputSource: File | string;
      proxySource?: File | string;
    };

export type WrappedMainToWorkerMessage = MainToWorkerMessage & {
  requestId: string;
};

type StatusType = "failed" | "success";

export type WorkerToMainMessage =
  | { type: "WORKER_READY"; requestId: string }
  | { type: "INIT_COMPLETED"; requestId: string }
  | { type: "SEEK_RESOLVED"; time: number; requestId: string }
  | { type: "BUFFER_WAIT"; requestId: string }
  | { type: "BUFFER_RESOLVED"; requestId: string }
  | {
      type: "SOURCE_VIDEO_ADD_FINISHED";
      data?: VideoSourcePreview;
      status: StatusType;
      errorMsg?: string;
      requestId: string;
    };
