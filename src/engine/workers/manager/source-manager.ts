import { Builder } from "builder-pattern";
import {
  ALL_FORMATS,
  BlobSource,
  Input,
  InputAudioTrack,
  InputVideoTrack,
  UrlSource,
} from "mediabunny";
import { VideoSource, VideoSourceWorker } from "../../core-manager/source";

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

    const { vidTrack, audTrack } = await this._loadTracksSinks(inputSource);

    if (!vidTrack) {
      throw new Error("Not found video track for this source");
    }

    let proxyVidTrack: InputVideoTrack | null = null;
    let proxyAudTrack: InputAudioTrack | null = null;
    if (proxySource) {
      const {
        vidTrack: extractedProxyVidTrack,
        audTrack: extractedProxyAudTrack,
      } = await this._loadTracksSinks(proxySource);
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

    return { vidTrack, audTrack };
  }

  static toVideoSourcePreview(videoSource: VideoSourceWorker): VideoSource {
    const { proxyAudTrack, proxyVidTrack, vidTrack, audTrack, ...rest } =
      videoSource;
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
