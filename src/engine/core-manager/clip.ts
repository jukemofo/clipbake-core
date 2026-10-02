export interface MediaClipProperty {
  width: number;
  height: number;
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  anchorX: number;
  anchorY: number;
}

export interface VideoClipPreview {
  id: string;
  sourceId: string;
  sourceStart: number;
  start: number;
  duration: number;
  property: Partial<MediaClipProperty>;
}

export interface VideoClipWorker extends VideoClipPreview {}
