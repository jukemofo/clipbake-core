export interface MediaClipProperty {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  anchorX: number;
  anchorY: number;
}

export interface AudioClipProperty {
  volume: number;
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
  property: MediaClipProperty & AudioClipProperty;
  keyframes: Keyframe[];
}

export interface AudioClip {
  id: string;
  sourceId: string;
  start: number;
  sourceStart: number;
  duration: number;
  property: AudioClipProperty;
}

export interface ImageClip {
  id: string;
  sourceId: string;
  start: number;
  duration: number;
  property: MediaClipProperty;
  keyframes: Keyframe[];
}
