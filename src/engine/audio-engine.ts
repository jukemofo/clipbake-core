import {
  ALL_FORMATS,
  AudioBufferSink,
  BlobSource,
  Input,
  InputAudioTrack,
  UrlSource,
} from "mediabunny";
import { AudioTrack, VideoTrack } from "../types/track";
import { MasterClock } from "./master-clock";
import { AddSourceDto } from "../workers/module/dto/source-dto";
import { AnyClip } from "../types/clip";
import { AudioClip, VideoClip } from "../z-engine-deprecated/core-manager/clip";

export class AudioEngine {
  private _sinkCache: Record<string, AudioBufferSink> = {};
  private _masterGain: GainNode | null = null;
  private _nodes: Set<AudioBufferSourceNode> = new Set();
  private _abortController: AbortController | null = null;
  private _clipGains: Map<string, GainNode> = new Map();
  private _audioSourceTracks: Map<string, InputAudioTrack> = new Map();
  private _proxyAudioSourceTracks: Map<string, InputAudioTrack> = new Map();
  private _tracks: Map<string, VideoTrack | AudioTrack> = new Map();

  public async start(masterClock: MasterClock) {
    this.stop();
    this._abortController = new AbortController();
    const signal = this._abortController.signal;

    const tracks = Array.from(this._tracks.values());
    const audioContext = masterClock.audioContext;
    if (!audioContext) throw new Error("not found audio context");

    if (!this._masterGain) {
      this._masterGain = audioContext.createGain();
      this._masterGain.connect(audioContext.destination);
    }

    const startCtxTime = audioContext.currentTime;
    const startTimelineTime = masterClock.getCurrentTime();

    await Promise.all(
      tracks.map(async (track) => {
        for (const clip of track.clips) {
          if (signal.aborted) return;

          const clipEnd = clip.start + clip.duration;
          if (startTimelineTime >= clipEnd) continue;

          const sourceId = clip.sourceId;
          if (!this._sinkCache[sourceId]) {
            // TODO: switch proxy here
            const audioTrack =
              this._proxyAudioSourceTracks.get(sourceId) ??
              this._audioSourceTracks.get(sourceId);
            if (!audioTrack) continue;
            this._sinkCache[sourceId] = new AudioBufferSink(audioTrack);
          }

          let clipGain = this._clipGains.get(clip.id);
          if (!clipGain) {
            clipGain = audioContext.createGain();
            const volume = clip.volume ?? 1;
            clipGain.gain.value = volume ** 2;
            clipGain.connect(this._masterGain!);
            this._clipGains.set(clip.id, clipGain);
          }

          const sink = this._sinkCache[clip.sourceId];
          const offsetInClip = Math.max(startTimelineTime - clip.start, 0);
          const startFetch = clip.sourceStart + offsetInClip;
          const endFetch = clip.sourceStart + clip.duration;

          const iterator = sink.buffers(startFetch, endFetch);

          try {
            for await (const { buffer, timestamp } of iterator) {
              if (signal.aborted) break;

              const currentClipStartTimeline =
                clip.start + (timestamp - clip.sourceStart);

              const timeDiff = currentClipStartTimeline - startTimelineTime;
              const startTimestamp = startCtxTime + timeDiff;

              const node = audioContext.createBufferSource();
              node.buffer = buffer;
              node.connect(clipGain);

              if (startTimestamp >= audioContext.currentTime) {
                node.start(startTimestamp);
              } else {
                const offsetInsideBuffer =
                  audioContext.currentTime - startTimestamp;
                if (offsetInsideBuffer < buffer.duration) {
                  node.start(audioContext.currentTime, offsetInsideBuffer);
                }
              }

              this._nodes.add(node);
              node.onended = () => this._nodes.delete(node);

              await this._awaitNodes(
                currentClipStartTimeline,
                masterClock,
                signal,
              );
            }
          } finally {
            iterator.return?.();
          }
        }
      }),
    );
  }

  private async _awaitNodes(
    currentClipStartTimeline: number,
    masterClock: MasterClock,
    signal: AbortSignal,
  ) {
    if (currentClipStartTimeline - masterClock.getCurrentTime() >= 1) {
      await new Promise<void>((resolve) => {
        const id = setInterval(() => {
          if (
            signal.aborted ||
            currentClipStartTimeline - masterClock.getCurrentTime() < 1
          ) {
            clearInterval(id);
            resolve();
          }
        }, 50);
      });
    }
  }

  public stop() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    for (const node of this._nodes) {
      try {
        node.stop();
        node.disconnect();
      } catch (_) {}
    }
    this._nodes.clear();

    for (const gainNode of this._clipGains.values()) {
      try {
        gainNode.disconnect();
      } catch (_) {}
    }
    this._clipGains.clear();
  }

  public async addSource({
    id,
    src,
    proxy,
  }: {
    id: string;
    src: string | File;
    proxy?: string | File;
  }) {
    const { audTrack } = await this._extractTracks(src);
    if (audTrack) {
      this._audioSourceTracks.set(id, audTrack);
    }

    if (proxy) {
      const { audTrack } = await this._extractTracks(proxy);
      if (audTrack) {
        this._proxyAudioSourceTracks.set(id, audTrack);
      }
    }
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

  public addTrack(track: VideoTrack | AudioTrack) {
    this._tracks.set(track.id, track);
  }

  public updateTrackClips(trackId: string, clips: (VideoClip | AudioClip)[]) {
    const track = this._tracks.get(trackId);
    if (!track) {
      throw new Error(`Not found track ${trackId}`);
    }
    (track as any).clips = clips;
  }
}
