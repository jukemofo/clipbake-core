import { Builder } from "builder-pattern";
import {
  ALL_FORMATS,
  BlobSource,
  Input,
  InputAudioTrack,
  InputVideoTrack,
  UrlSource,
} from "mediabunny";
import {
  AudioSource,
  AudioSourceMainThread,
  ImageSource,
  ImageSourceWorker,
  VideoSource,
  VideoSourceWorker,
} from "../../core-manager/source";
import { getImageDimensions } from "../util/img";

type SourceParam = {
  id: string;
  inputSource: File | string;
  proxySource?: File | string;
};

export class SourceManager {
  private _videoSources: Map<string, VideoSourceWorker> = new Map();
  private _imageSources: Map<string, ImageSourceWorker> = new Map();
  private _audioSources: Map<string, AudioSourceMainThread> = new Map();

  public async addVideoSource({
    id,
    inputSource,
    proxySource,
  }: SourceParam): Promise<VideoSourceWorker> {
    if (!id || !inputSource) {
      throw new Error("Invalid params");
    }

    const existedSource = this._videoSources.get(id);
    if (existedSource) {
      return existedSource;
    }

    const { vidTrack, audTrack } = await this._loadTracks(inputSource);

    if (!vidTrack) {
      throw new Error("Not found video track for this source");
    }

    let proxyVidTrack: InputVideoTrack | null = null;
    let proxyAudTrack: InputAudioTrack | null = null;
    if (proxySource) {
      const {
        vidTrack: extractedProxyVidTrack,
        audTrack: extractedProxyAudTrack,
      } = await this._loadTracks(proxySource);
      proxyVidTrack = extractedProxyVidTrack;
      proxyAudTrack = extractedProxyAudTrack;
    }

    const width = await vidTrack.getDisplayWidth();
    const height = await vidTrack.getDisplayHeight();
    const duration = await vidTrack.computeDuration();
    const fps = (await vidTrack.computeFrameRateMetrics()).bestGuessFrameRate;
    const sampleRate = await audTrack?.getSampleRate();
    const numberOfChannels = await audTrack?.getNumberOfChannels();

    const source = Object.freeze(
      Builder<VideoSourceWorker>()
        .id(id)
        .width(width!)
        .height(height!)
        .duration(duration!)
        .fps(fps!)
        .numberOfChannels(numberOfChannels)
        .sampleRate(sampleRate)
        .vidTrack(vidTrack)
        .audTrack(audTrack)
        .proxyVidTrack(proxyVidTrack)
        .proxyAudTrack(proxyAudTrack)
        .build(),
    );

    this._videoSources.set(id, source);
    return source;
  }

  public async addAudioSourceMainThread({
    id,
    inputSource,
    proxySource,
  }: SourceParam): Promise<AudioSourceMainThread> {
    if (!id || !inputSource) {
      throw new Error("Invalid params");
    }
    const existedSource = this._audioSources.get(id);
    if (existedSource) {
      return existedSource;
    }

    const { audTrack } = await this._loadTracks(inputSource);

    if (!audTrack) {
      throw new Error("Not found audio track for this source");
    }

    let proxyAudTrack: InputAudioTrack | null = null;
    if (proxySource) {
      const { audTrack: extractedProxyAudTrack } =
        await this._loadTracks(proxySource);
      proxyAudTrack = extractedProxyAudTrack;
    }

    const duration = await audTrack.computeDuration();
    const sampleRate = await audTrack?.getSampleRate();
    const numberOfChannels = await audTrack?.getNumberOfChannels();

    const source = Object.freeze(
      Builder<AudioSourceMainThread>()
        .id(id)
        .duration(duration!)
        .numberOfChannels(numberOfChannels)
        .sampleRate(sampleRate)
        .audTrack(audTrack)
        .proxyAudTrack(proxyAudTrack)
        .build(),
    );

    this._audioSources.set(id, source);
    return source;
  }

  public async addImageSource({
    id,
    inputSource,
    proxySource,
  }: SourceParam): Promise<ImageSourceWorker> {
    if (!id || !inputSource) {
      throw new Error("Invalid params");
    }

    const existedSource = this._imageSources.get(id);
    if (existedSource) {
      return existedSource;
    }

    const canvas = await this._loadImgCanvas(inputSource);

    let proxyCanvas: OffscreenCanvas | null = null;
    if (proxySource) {
      proxyCanvas = await this._loadImgCanvas(inputSource);
    }

    const width = canvas.width;
    const height = canvas.height;
    const source = Object.freeze(
      Builder<ImageSourceWorker>()
        .id(id)
        .width(width!)
        .height(height!)
        .canvas(canvas)
        .proxyCanvas(proxyCanvas || undefined)
        .build(),
    );

    this._imageSources.set(id, source);
    return source;
  }

  private async _loadTracks(inputSource: File | string) {
    const input = new Input({
      formats: ALL_FORMATS,
      source:
        typeof inputSource === "string"
          ? new UrlSource(inputSource)
          : new BlobSource(inputSource),
    });

    const vidTrack = await input.getPrimaryVideoTrack();
    const audTrack = await input.getPrimaryAudioTrack();
    return { vidTrack, audTrack };
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

  static toVideoSourcePreview(videoSource: VideoSourceWorker): VideoSource {
    const { proxyAudTrack, proxyVidTrack, vidTrack, audTrack, ...rest } =
      videoSource;
    return { ...rest };
  }

  static toAudioSourceRaw(audioSource: AudioSourceMainThread): AudioSource {
    const { proxyAudTrack, audTrack, ...rest } = audioSource;
    return { ...rest };
  }

  static toImageSourceRaw(imageSource: ImageSourceWorker): ImageSource {
    const { canvas, proxyCanvas, ...rest } = imageSource;
    return { ...rest };
  }

  public get totalSources() {
    return (
      this._videoSources.size +
      this._imageSources.size +
      this._audioSources.size
    );
  }

  public getVideoSource(id: string) {
    return this._videoSources.get(id);
  }

  public getImageSource(id: string) {
    return this._imageSources.get(id);
  }

  public getAudioSource(id: string) {
    return this._audioSources.get(id);
  }
}

export const sourceManager = new SourceManager();
