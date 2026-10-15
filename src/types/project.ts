import { FPS } from "./fps";
import { Settings } from "./settings";
import { AnySource } from "./source";
import { AnyTrack } from "./track";

export interface Project {
  id: string;
  settings: Settings;
  sources: Map<string, AnySource>;
  tracks: Map<string, AnyTrack>;
  videoTrackIds: string[];
  audioTrackIds: string[];
  imageTrackIds: string[];
  captionTrackIds: string[];
  textTrackIds: string[];
  visualTrackOrders: string[];
  audioTrackOrders: string[];
}
