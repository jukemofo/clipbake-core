import { ALL_FORMATS, BlobSource, Input, UrlSource } from "mediabunny";
import { nanoid } from "nanoid";
import {
  AnySource,
  AudioSource,
  AudioSourceWorker,
  CaptionSource,
  CaptionSourceWorker,
  ImageSource,
  ImageSourceWorker,
  VideoSource,
  VideoSourceWorker,
} from "../../types/source";
import { dataRepository } from "./data-repository";
import { AddSourceDto } from "./dto/source-dto";
import { Word } from "../../types/words";
import { isWordArray } from "../utils/source";
import { MediaKind } from "../../types/kind";

export class APISourceService {
  public async add({ src, proxy, kind }: AddSourceDto): Promise<AnySource> {
    switch (kind) {
      case MediaKind.VIDEO:
        return await this._generateVideoSource(src, proxy);
      case MediaKind.AUDIO:
        return await this._generateAudioSource(src, proxy);
      case MediaKind.IMAGE:
        return await this._generateImageSource(src);
      case MediaKind.CAPTION:
        return await this._generateCaptionSource(src);
      default:
        throw new Error(`Unsupport source ${kind}`);
    }
  }

  private async _generateVideoSource(
    src: File | string,
    proxy?: File | string,
  ): Promise<VideoSource> {
    const { vidTrack, audTrack } = await this._extractTracks(src);

    if (!vidTrack) {
      throw new Error(
        `Can not decode video track of this src ${typeof src === "string" ? src : src.name}`,
      );
    }

    const width = await vidTrack.getDisplayWidth();
    const height = await vidTrack.getDisplayHeight();
    const duration = await vidTrack.computeDuration();
    const fps = (await vidTrack.computeFrameRateMetrics()).bestGuessFrameRate;

    const videoSource: VideoSource = {
      id: nanoid(),
      kind: MediaKind.VIDEO,
      name: src instanceof File ? src.name : "",
      width: width,
      height: height,
      duration: duration,
      fps: fps,
    };

    const videoSourceWorker: VideoSourceWorker = {
      ...videoSource,
      vidTrack: vidTrack,
      audTrack: audTrack,
    };

    if (proxy) {
      const { vidTrack: proxyVidTrack, audTrack: proxyAudTrack } =
        await this._extractTracks(proxy);
      videoSourceWorker.proxyVidTrack = proxyVidTrack;
      videoSourceWorker.proxyAudTrack = proxyAudTrack;
    }

    dataRepository.sources.add(videoSourceWorker);

    return videoSource;
  }

  private async _generateAudioSource(
    src: File | string,
    proxy?: File | string,
  ): Promise<AudioSource> {
    const { audTrack } = await this._extractTracks(src);

    if (!audTrack) {
      throw new Error(
        `Can not decode video track of this src ${typeof src === "string" ? src : src.name}`,
      );
    }

    const duration = await audTrack.computeDuration();

    const audioSource: AudioSource = {
      id: nanoid(),
      kind: MediaKind.AUDIO,
      name: src instanceof File ? src.name : "",
      duration: duration,
    };

    const audioSourceWorker: AudioSourceWorker = {
      ...audioSource,
      audTrack: audTrack,
    };

    if (proxy) {
      const { audTrack: proxyAudTrack } = await this._extractTracks(proxy);
      audioSourceWorker.proxyAudTrack = proxyAudTrack;
    }
    dataRepository.sources.add(audioSourceWorker);

    return audioSource;
  }

  private async _extractTracks(src: File | string) {
    const input = new Input({
      formats: ALL_FORMATS,
      source:
        typeof src === "string" ? new UrlSource(src) : new BlobSource(src),
    });

    const vidTrack = await input.getPrimaryVideoTrack();
    const audTrack = await input.getPrimaryAudioTrack();
    return { vidTrack, audTrack };
  }

  private async _generateImageSource(src: File | string): Promise<ImageSource> {
    const canvas = await this._loadImgCanvas(src);
    const imageSource: ImageSource = {
      id: nanoid(),
      name: src instanceof File ? src.name : "",
      kind: MediaKind.IMAGE,
      width: canvas.width,
      height: canvas.height,
    };
    const imageSourceWorker: ImageSourceWorker = {
      ...imageSource,
      canvas: canvas,
    };
    dataRepository.sources.add(imageSourceWorker);
    return imageSource;
  }

  private async _loadImgCanvas(inputSource: File | string) {
    try {
      let bitmap: ImageBitmap;

      if (typeof inputSource === "string") {
        {
          const response = await fetch(inputSource);
          if (!response.ok) {
            throw new Error(`Failed to download img: ${response.statusText}`);
          }
          const blob = await response.blob();
          bitmap = await createImageBitmap(blob);
        }
      } else {
        bitmap = await createImageBitmap(inputSource);
      }

      const offscreenCanvas = new OffscreenCanvas(bitmap.width, bitmap.height);
      const ctx = offscreenCanvas.getContext("2d");
      if (!ctx) {
        throw new Error("Can not initiate image source.");
      }
      ctx.drawImage(bitmap, 0, 0);
      bitmap.close();
      return offscreenCanvas;
    } catch (e) {
      throw e;
    }
  }

  private async _generateCaptionSource(
    src: File | string,
  ): Promise<CaptionSource> {
    let data: Word[] = [];

    if (src instanceof File) {
      const words = JSON.parse(await src.text());
      if (!isWordArray(words)) {
        throw new Error(`Invalid caption file ${src.name}`);
      }
      data = words;
    } else {
      const response = await fetch(src);

      if (!response.ok) {
        throw new Error(`Failed to load JSON: ${response.status}`);
      }
      const words = await response.json();
      if (!isWordArray(words)) {
        throw new Error(`Invalid caption data ${src}`);
      }
      data = words;
    }

    const captionSource: CaptionSource = {
      id: nanoid(),
      name: src instanceof File ? src.name : "",
      kind: MediaKind.CAPTION,
      duration: data.at(-1)!.end,
    };

    const captionSourceWorker: CaptionSourceWorker = {
      ...captionSource,
      captions: data,
    };

    dataRepository.sources.add(captionSourceWorker);

    return captionSource;
  }
}
