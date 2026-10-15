import { AnyClip } from "./clip-type";
import { DeepReadonly, Id } from "./common-type";
import { AnySource } from "./source-type";
import { AnyTrack } from "./track-type";

export interface EngineSettings {
  width: number;
  height: number;
  fps: number;
  backgroundColor: string;
}

/** Cách xử lý transform của clip khi đổi width/height. */
export type ResizePolicy = "keep" | "scale";

export type EngineSettingsPatch = Partial<EngineSettings> & {
  resizePolicy?: ResizePolicy;
};

/**
 * State có thể serialize (không Map/Set/class) để postMessage, diff, undo/redo
 * và lưu project. Dạng normalized: entity phẳng theo id, quan hệ qua id.
 * `duration` không lưu, luôn tính từ clips.
 */
export type TimelineType = {
  id: Id;
  version: `${number}.${number}.${number}`;
  name: string;
  settings: EngineSettings;
  sources: Record<Id, AnySource>;
  tracks: Record<Id, AnyTrack>;
  clips: Record<Id, AnyClip>;
  /** Thứ tự track, index 0 ở dưới cùng (z thấp nhất). */
  trackOrder: Id[];
};

/** Thứ `engine.getState()` trả về: replica chỉ đọc. */
export type EngineState = DeepReadonly<TimelineType>;
