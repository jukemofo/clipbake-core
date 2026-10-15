import { AnyClip } from "../../../types/clip";
import { MediaKind } from "../../../types/kind";
import { Second } from "../../../types/time";

export type BaseAddClipDto = {
  trackId: string;
  start: Second;
  duration: Second;
};

export type AddVideoClipDto = BaseAddClipDto & {
  sourceId: string;
  kind: MediaKind.VIDEO;
  sourceStart: Second;
};

export type AddAudioClipDto = BaseAddClipDto & {
  sourceId: string;
  kind: MediaKind.AUDIO;
  sourceStart: Second;
};

export type AddImageClipDto = BaseAddClipDto & {
  sourceId: string;
  kind: MediaKind.IMAGE;
};

export type AddCaptionClipDto = BaseAddClipDto & {
  sourceId: string;
  kind: MediaKind.CAPTION;
  sourceStart: Second;
};

export type AddTextClipDto = BaseAddClipDto & {
  kind: MediaKind.TEXT;
  text: string;
};

export type AddClipDto =
  | AddVideoClipDto
  | AddAudioClipDto
  | AddImageClipDto
  | AddCaptionClipDto
  | AddTextClipDto;

export type AddClipResponseDto = {
  clip: AnyClip;
  actualClipsOnTrack: AnyClip[];
};
