import { nanoid } from "nanoid";
import { MediaKind } from "../../types/kind";
import {
  AnyTrack,
  AudioTrack,
  CaptionTrack,
  ImageTrack,
  TextTrack,
  VideoTrack,
} from "../../types/track";
import { dataRepository } from "./data-repository";
import { AnyClip } from "../../types/clip";
import { AddClipDto } from "./dto/clip-dto";

export class APIClipService {
  public add(clip: AddClipDto): AnyClip[] {
    // const track = this._generateTrack(kind);
    // dataRepository.clips.add(track);
    // return track;
    return [];
  }

  private _generateTrack(kind: MediaKind): AnyTrack {
    switch (kind) {
      case MediaKind.VIDEO:
        const videoTrack: VideoTrack = {
          id: nanoid(),
          clips: [],
          kind: kind,
        };
        return videoTrack;
      case MediaKind.AUDIO:
        const audioTrack: AudioTrack = {
          id: nanoid(),
          clips: [],
          kind: kind,
        };
        return audioTrack;
      case MediaKind.IMAGE:
        const imageTrack: ImageTrack = {
          id: nanoid(),
          clips: [],
          kind: kind,
        };
        return imageTrack;
      case MediaKind.CAPTION:
        const captionTrack: CaptionTrack = {
          id: nanoid(),
          clips: [],
          kind: kind,
        };
        return captionTrack;
      case MediaKind.TEXT:
        const textTrack: TextTrack = {
          id: nanoid(),
          clips: [],
          kind: kind,
        };
        return textTrack;
      default:
        throw new Error(`Unsupport track's type "${kind}"`);
    }
  }
}
