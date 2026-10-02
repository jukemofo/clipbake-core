import { TrackType } from "./track-type";

export type TimelineType = {
  id: string;
  version: `${number}.${number}.${number}`;
  name: string;
  settings: {
    width: number;
    height: number;
    fps: number;
    backgroundColor: string;
  };
  tracks: Map<string, TrackType>;
  trackOrders: string[];
};
