import { FPS } from "../../../types/fps";
import { Second } from "../../../types/time";

export type InitEngineDto = {
  canvas: OffscreenCanvas;
  width: number;
  height: number;
  fps: FPS;
  backgroundColor: string;
};

export type StartEngineDto = {
  time: Second;
  basePerfTime: number;
};

export type StopEngineDto = {
  time: Second;
};

export type SeekEngineDto = {
  time: Second;
  highQuality: boolean;
};
