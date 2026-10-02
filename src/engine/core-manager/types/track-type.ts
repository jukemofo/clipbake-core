import { AnyClip } from "./clip-type";

export type TrackKindType = "video" | "audio" | "text" | "overlay";

export type TrackType = {
  id: string;
  type: TrackKindType;
  property?: {
    muted?: boolean;
    visible?: boolean;
  };
  clips: Map<string, Set<AnyClip>>;
  clipOrders: string[];
};
