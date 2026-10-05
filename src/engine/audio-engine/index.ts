import { AudioBufferSink } from "mediabunny";
import { CoreManager } from "../core-manager";
import { masterClock } from "../master-clock";
import { sourceManager } from "../workers/manager/source-manager";

export class AudioEngine {
  private _core: CoreManager;
  private _sinkCache: Record<string, AudioBufferSink> = {};
  private _masterGain: GainNode | null = null;
  private _nodes: Set<AudioBufferSourceNode> = new Set();
  private _abortController: AbortController | null = null;
  private _clipGains: Map<string, GainNode> = new Map();

  constructor(core: CoreManager) {
    this._core = core;
  }

  public async start() {
    this.pause();

    this._abortController = new AbortController();
    const signal = this._abortController.signal;

    const tracks = Array.from(this._core.videoTracks.values());
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

          if (!this._sinkCache[clip.sourceId]) {
            const source = sourceManager.getVideoSource(clip.sourceId);
            if (!source || !source.audTrack) continue;
            this._sinkCache[source.id] = new AudioBufferSink(source.audTrack);
          }

          let clipGain = this._clipGains.get(clip.id);
          if (!clipGain) {
            clipGain = audioContext.createGain();
            // TODO: change volume here
            const volume = 1;
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

              await this._awaitNodes(currentClipStartTimeline, signal);
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

  public pause() {
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
}
