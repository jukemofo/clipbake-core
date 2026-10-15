import { nanoid } from "nanoid";
import { MediaKind } from "../../types/kind";

import { dataRepository } from "./data-repository";
import {
  AnyClip,
  AudioClip,
  VideoClip,
  ImageClip,
  CaptionClip,
  TextClip,
} from "../../types/clip";
import { AddClipDto, AddClipResponseDto } from "./dto/clip-dto";

export class APIClipService {
  public add(clipDto: AddClipDto): AddClipResponseDto {
    const clip = this._generateClip(clipDto);
    const results = dataRepository.clips.add(clip);
    const currentClip = results.find((c) => c.id === clip.id);
    if (!currentClip) {
      throw new Error("Something went wrong while adding new clip");
    }
    return { clip: currentClip, actualClipsOnTrack: results };
  }

  private _generateClip(clipDto: AddClipDto): AnyClip {
    const kind = clipDto.kind;
    switch (kind) {
      case MediaKind.VIDEO:
        const videoClip: VideoClip = {
          id: nanoid(),
          name: "",
          ...clipDto,
        };
        return videoClip;
      case MediaKind.AUDIO:
        const audioClip: AudioClip = {
          id: nanoid(),
          name: "",
          ...clipDto,
        };
        return audioClip;
      case MediaKind.IMAGE:
        const imageClip: ImageClip = {
          id: nanoid(),
          name: "",
          ...clipDto,
        };
        return imageClip;
      case MediaKind.CAPTION:
        const captionClip: CaptionClip = {
          id: nanoid(),
          name: "",
          ...clipDto,
        };
        return captionClip;
      case MediaKind.TEXT:
        const textClip: TextClip = {
          id: nanoid(),
          name: "",
          ...clipDto,
        };
        return textClip;
      default:
        throw new Error(`Unsupport track's type "${kind}"`);
    }
  }
}
