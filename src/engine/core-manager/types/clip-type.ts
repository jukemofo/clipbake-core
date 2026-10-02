export interface BaseClip {
  id: string;
  timelineStart: number;
  sourceStart: number;
  duration: number;
}

export type VisualProperty = {
  position?: { x?: number; y?: number } | "center";
  width?: number;
  height?: number;
  scale?: { x?: number; y?: number };
  visible?: boolean;
};

export interface VideoClipType extends BaseClip {
  type: "video";
  sourceId: string;
  property?: VisualProperty & {
    muted?: boolean;
    volume?: number;
  };
}

export interface ImageClipType extends BaseClip {
  type: "image";
  sourceId: string;
  property?: VisualProperty;
}

export interface AudioClipType extends BaseClip {
  type: "audio";
  sourceId: string;
  property?: {
    muted?: boolean;
    volume?: number;
  };
}

export interface TextClipType extends BaseClip {
  type: "text";
  content: string;
  property?: VisualProperty & {
    fontSize?: number;
    color?: string;
    fontFamily?: string;
  };
}

export interface CaptionClipType extends BaseClip {
  type: "caption";
  content: string;
  property?: VisualProperty & {
    fontSize?: number;
  };
}

export type AnyClip =
  | VideoClipType
  | ImageClipType
  | AudioClipType
  | TextClipType
  | CaptionClipType;
