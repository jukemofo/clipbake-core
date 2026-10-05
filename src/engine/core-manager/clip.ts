export interface MediaClipProperty {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  anchorX: number;
  anchorY: number;
}

export type Keyframe<T = MediaClipProperty> = {
  [K in keyof T]: {
    key: K;
    frames: {
      time: number;
      value: T[K];
    }[];
  };
}[keyof T];

export interface VideoClip {
  id: string;
  sourceId: string;
  start: number;
  sourceStart: number;
  duration: number;
  property: MediaClipProperty;
  keyframes: Keyframe[];
}
