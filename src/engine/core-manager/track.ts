import { VideoClipPreview, VideoClipWorker } from "./clip";

export interface VideoTrackPreview {
  id: string;
  muted?: boolean;
  visible?: boolean;
  clips: Map<string, VideoClipPreview>;
}

export interface VideoTrackWorker extends VideoTrackPreview {
  clipWorkers: Map<string, VideoClipWorker>;
  clipOrders: string[];
}
