import { Builder } from "builder-pattern";
import {
  VideoSourcePreview,
  VideoSourceWorker,
} from "../../core-manager/source";
import {
  ALL_FORMATS,
  AudioBufferSink,
  BlobSource,
  CanvasSink,
  Input,
  UrlSource,
} from "mediabunny";
import { POOL_SIZE } from "../constant";

type SourceParam = {
  id: string;
  inputSource: File | string;
  proxySource?: File | string;
};

export class SourceManager {
  private _videoSources: Map<string, VideoSourceWorker> = new Map();

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

    const { vidTrack, vidSink, audSink, audTrack } =
      await this._loadTracksSinks(inputSource);

    if (!vidTrack || !vidSink) {
      throw new Error("Not found video track for this source");
    }

    let proxyVidSink: CanvasSink | null = null;
    let proxyAudSink: AudioBufferSink | null = null;
    if (proxySource) {
      const { vidSink: extractedProxyVidSink, audSink: extractedProxyAudSink } =
        await this._loadTracksSinks(proxySource);
      proxyVidSink = extractedProxyVidSink;
      proxyAudSink = extractedProxyAudSink;
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
        .vidSink(vidSink)
        .audTrack(audTrack)
        .audSink(audSink)
        .proxyVidSink(proxyVidSink)
        .proxyAudSink(proxyAudSink)
        .build(),
    );

    this._videoSources.set(id, source);
    return source;
  }

  private async _loadTracksSinks(inputSource: File | string) {
    const input = new Input({
      formats: ALL_FORMATS,
      source:
        typeof inputSource === "string"
          ? new UrlSource(inputSource)
          : new BlobSource(inputSource),
    });

    const vidTrack = await input.getPrimaryVideoTrack();
    const audTrack = await input.getPrimaryAudioTrack();

    let vidSink: CanvasSink | null = null;
    let audSink: AudioBufferSink | null = null;

    if (vidTrack) {
      const videoCanBeTransparent = vidTrack
        ? await vidTrack.canBeTransparent()
        : false;
      vidSink = new CanvasSink(vidTrack, {
        alpha: videoCanBeTransparent,
        poolSize: POOL_SIZE,
      });
    }

    if (audTrack) {
      audSink = new AudioBufferSink(audTrack);
    }

    return { vidTrack, audTrack, vidSink, audSink };
  }

  static toVideoSourcePreview(
    videoSource: VideoSourceWorker,
  ): VideoSourcePreview {
    const {
      vidSink,
      audSink,
      proxyAudSink,
      proxyVidSink,
      vidTrack,
      audTrack,
      ...rest
    } = videoSource;
    return { ...rest };
  }

  public get totalSources() {
    return this._videoSources.size;
  }

  public getVideoSource(id: string) {
    return this._videoSources.get(id);
  }
}

export const sourceManager = new SourceManager();
