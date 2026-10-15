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
import { dtCentral } from "./data-central";
import { AddSourceDto } from "./dto/source-dto";
import { Word } from "../../types/words";
import { isWordArray } from "../utils/source";

export class APISourceService {
  public async add({ src, proxy, kind }: AddSourceDto): Promise<AnySource> {
    switch (kind) {
      case "video":
        return await this._generateVideoSource(src, proxy);
      case "audio":
        return await this._generateAudioSource(src, proxy);
      case "image":
        return await this._generateImageSource(src);
      case "caption":
        return await this._generateCaptionSource(src);
      default:
        throw new Error(`Unsupport source ${kind}`);
    }
  }

  private async _generateVideoSource(
    src: File | string,
    proxy?: File | string,
  ) {
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
      kind: "video",
      name: "",
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

    dtCentral.sources.add(videoSourceWorker);

    return videoSource;
  }

  private async _generateAudioSource(
    src: File | string,
    proxy?: File | string,
  ) {
    const { audTrack } = await this._extractTracks(src);

    if (!audTrack) {
      throw new Error(
        `Can not decode video track of this src ${typeof src === "string" ? src : src.name}`,
      );
    }

    const duration = await audTrack.computeDuration();

    const audioSource: AudioSource = {
      id: nanoid(),
      kind: "audio",
      name: "",
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
    dtCentral.sources.add(audioSourceWorker);
    return audioSourceWorker;
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

  private async _generateImageSource(src: File | string) {
    const canvas = await this._loadImgCanvas(src);
    const imageSource: ImageSource = {
      id: nanoid(),
      name: "",
      kind: "image",
      width: canvas.width,
      height: canvas.height,
    };
    const imageSourceWorker: ImageSourceWorker = {
      ...imageSource,
      canvas: canvas,
    };
    dtCentral.sources.add(imageSourceWorker);
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

  private async _generateCaptionSource(src: File | string) {
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
      name: "",
      kind: "caption",
      duration: data.at(-1)!.end,
    };

    const captionSourceWorker: CaptionSourceWorker = {
      ...captionSource,
      captions: data,
    };

    dtCentral.sources.add(captionSourceWorker);

    return captionSource;
  }
}
