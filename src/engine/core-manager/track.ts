import { WrappedCanvas } from "mediabunny";
import { CanvasSource, Sprite, Texture } from "pixi.js";
import { app } from "../workers/canvas";
import { MIN_BUFFER_SIZE, POOL_SIZE } from "../workers/constant";
import { VideoClipWorker } from "./clip";
import { VideoTrackIterator } from "../workers/render/video-track-iterator";

export interface VideoTrack {
  id: string;
}

// export class VideoTrackWorkerDeprecated {
//   private _id: string;
//   private _clipWorkers: Map<string, VideoClipWorker> = new Map();
//   private _clipOrders: string[] = [];
//   private _queue: { clip: VideoClipWorker; value: WrappedCanvas }[] = [];
//   private _currentFrame: WrappedCanvas | null | undefined = null;
//   private _currentClip: VideoClipWorker | null = null;
//   private _isFetching: boolean = false;
//   private _isEndOfClip: boolean = false;
//   private _sprite: Sprite;
//   private _texture: Texture;
//   private _textureCanvas: OffscreenCanvas;
//   private _currentTime: number = 0;
//   private _iterator: VideoTrackIterator;

//   constructor(id: string) {
//     this._id = id;
//     this._iterator = new VideoTrackIterator();
//     this._textureCanvas = new OffscreenCanvas(200, 200);
//     this._texture = new Texture({
//       source: new CanvasSource({ resource: this._textureCanvas }),
//     });
//     this._texture.dynamic = true;
//     this._sprite = new Sprite(this._texture);

//     app!.stage.addChild(this._sprite);
//   }

//   public get id(): string {
//     return this._id;
//   }

//   public async addClip(clip: VideoClipWorker) {
//     this._clipWorkers.set(clip.id, clip);

//     let sortedClips = Array.from(this._clipWorkers.values()).sort(
//       (a, b) => a.start - b.start,
//     );

//     for (let i = 1; i < sortedClips.length; i++) {
//       let prevClip = sortedClips[i - 1];
//       let currentClip = sortedClips[i];

//       let prevEnd = prevClip.start + prevClip.duration;

//       if (currentClip.start < prevEnd) {
//         currentClip.start = prevEnd;

//         this._clipWorkers.set(currentClip.id, currentClip);
//       }
//     }

//     this._clipOrders = sortedClips.map((c) => c.id);

//     await this._iterator.rebuild(this._currentTime, sortedClips);
//   }

//   public isStarving() {
//     if (!this._currentClip) {
//       return false;
//     }
//     if (this._isEndOfClip) return false;
//     if (this._queue.length < MIN_BUFFER_SIZE) {
//       return true;
//     }
//     return false;
//   }

//   // public async renderAtOld(currentTime: number) {
//   //   this._currentTime = currentTime;
//   //   const currentClip = this._findCurrentClip(currentTime);
//   //   if (!currentClip) {
//   //     this._currentClip = null;
//   //     this._sprite.texture = Texture.EMPTY;
//   //     this._isEndOfClip = false;
//   //     return;
//   //   }
//   //   this._renderProperty(currentClip);

//   //   const elapsed = currentTime - currentClip.start;
//   //   const currentSourceTime = currentClip.sourceStart + elapsed;

//   //   if (this._currentClip?.id !== currentClip.id) {
//   //     this._currentClip?.clear?.();
//   //     this._currentClip = currentClip;
//   //     this._currentClip.load(currentSourceTime);
//   //     this._isEndOfClip = false;
//   //   }

//   //   if (this._queue.length <= 0) {
//   //     this._fillBuffer(currentTime);
//   //     return;
//   //   }

//   //   let latestValidFrame = null;

//   //   while (
//   //     this._queue.length > 0 &&
//   //     currentSourceTime >= this._queue[0].timestamp
//   //   ) {
//   //     latestValidFrame = this._queue.shift();
//   //     this._fillBuffer(currentTime);
//   //   }

//   //   this._renderFrame(latestValidFrame?.canvas);
//   // }

//   public async renderAt(currentTime: number) {
//     // get clip, time at here

//     if (this._queue.length <= 0) {
//       this._fillBuffer(currentTime);
//       return;
//     }

//     let latestValidFrame = null;
//     const { clip, value } = this._queue[0];

//     // wrong
//     const sourceTime = this._getSourceTime(currentTime, clip);
//     while (
//       this._queue.length > 0 &&
//       sourceTime >= this._queue[0]?.value?.timestamp
//     ) {
//       latestValidFrame = this._queue.shift();
//       this._fillBuffer(currentTime);
//     }

//     this._renderProperty(currentClip);
//     this._renderFrame(latestValidFrame?.canvas);
//   }

//   public async seek(targetTime: number, highQuality: boolean) {
//     await this.clear();
//     this._currentTime = targetTime;
//     const currentClip = this._findCurrentClip(targetTime);
//     if (!currentClip) {
//       return;
//     }
//     const elapsed = targetTime - currentClip.start;
//     const currentSourceTime = currentClip.sourceStart + elapsed;
//     // highQuality = true
//     if (highQuality) {
//       // currentClip.load(currentSourceTime);
//       // const wrapped = await currentClip.iterator?.next();
//       // this._renderFrame(wrapped?.value?.canvas);
//       // this._renderProperty(currentClip);
//     }

//     // highQuality = false
//   }

//   // private async _fillBuffer(currentTime: number) {
//   //   const currentClip = this._currentClip;
//   //   if (!currentClip) {
//   //     this._isEndOfClip = false;
//   //     this._isFetching = false;
//   //     return;
//   //   }
//   //   const iterator = currentClip?.iterator;
//   //   if (this._isFetching || !iterator) return;
//   //   this._isFetching = true;

//   //   while (this._queue.length < POOL_SIZE && iterator) {
//   //     const result = await iterator.next();
//   //     if (result.done || !result.value) {
//   //       this._isEndOfClip = true;
//   //       break;
//   //     }

//   //     const elapsed = currentTime - currentClip.start;
//   //     const currentSourceTime = currentClip.sourceStart + elapsed;

//   //     if (result.value.timestamp < currentSourceTime) {
//   //       continue;
//   //     }

//   //     this._queue.push(result.value);
//   //   }

//   //   this._isFetching = false;
//   // }

//   private async _fillBuffer(currentTime: number) {
//     if (this._isFetching) return;

//     // const currentClip = this._currentClip;
//     // if (!currentClip) {
//     //   this._isEndOfClip = false;
//     //   this._isFetching = false;
//     //   return;
//     // }
//     // const iterator = currentClip?.iterator;

//     this._isFetching = true;

//     while (this._queue.length < POOL_SIZE) {
//       const result = await this._iterator.next();
//       if (!result) {
//         this._isEndOfClip = true;
//         break;
//       }

//       const { clip, value } = result;
//       const elapsed = currentTime - clip.start;
//       const currentSourceTime = clip.sourceStart + elapsed;
//       if (value.timestamp < currentSourceTime) {
//         continue;
//       }
//       this._queue.push(result);
//     }
//     this._isFetching = false;
//   }

//   private _findCurrentClip(currentTime: number) {
//     let currentClip = null;
//     for (const id of this._clipOrders) {
//       const clip = this._clipWorkers.get(id);
//       if (
//         clip &&
//         clip.start <= currentTime &&
//         currentTime < clip.start + clip.duration
//       ) {
//         currentClip = clip;
//         break;
//       }
//     }
//     return currentClip;
//   }

//   private _renderFrame(
//     canvas: HTMLCanvasElement | OffscreenCanvas | undefined | null,
//   ) {
//     if (!canvas) {
//       return;
//     }
//     this._texture.source.resource = canvas;
//     this._sprite.texture = this._texture;
//     this._texture.source.resize(canvas.width, canvas.height);
//     this._texture.source.update();
//   }

//   private _renderProperty(currentClip: VideoClipWorker | null) {
//     if (!currentClip) {
//       return;
//     }
//     this._sprite.anchor.set(0.5, 0.5);
//     this._sprite.scale.set(
//       currentClip.getProperty("scaleX") ?? 1,
//       currentClip.getProperty("scaleY") ?? 1,
//     );
//     this._sprite.position.set(
//       currentClip.getProperty("x"),
//       currentClip.getProperty("y"),
//     );
//   }

//   private _getSourceTime(currentTime: number, clip: VideoClipWorker) {
//     const elapsed = currentTime - clip.start;
//     return clip.sourceStart + Math.max(elapsed, 0);
//   }

//   public async clear() {
//     await this._iterator.clear();
//     await this._currentClip?.clear?.();
//     this._currentClip = null;
//     this._queue = [];
//     this._isEndOfClip = false;
//   }
// }
