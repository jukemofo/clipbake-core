import { CanvasSource, Sprite, Texture } from "pixi.js";
import { app } from "../canvas";
import { VideoClipRender } from "./video-clip-render";

export class VideoTrackRender {
  private _id: string;
  private _clips: VideoClipRender[] = [];
  private _spriteA: Sprite;
  private _spriteB: Sprite;
  private _activeSpriteLabel: "A" | "B";
  private _currentClip: VideoClipRender | null = null;

  constructor(id: string) {
    this._id = id;

    this._activeSpriteLabel = "A";
    const canvasA = new OffscreenCanvas(200, 200);
    const canvasB = new OffscreenCanvas(200, 200);

    this._spriteA = new Sprite(
      new Texture({
        source: new CanvasSource({ resource: canvasA }),
      }),
    );
    this._spriteA.texture.dynamic = true;
    this._spriteA.visible = false;
    app!.stage.addChild(this._spriteA);

    this._spriteB = new Sprite(
      new Texture({
        source: new CanvasSource({ resource: canvasB }),
      }),
    );
    this._spriteB.texture.dynamic = true;
    this._spriteB.visible = false;
    app!.stage.addChild(this._spriteB);
  }

  public addClip(clip: VideoClipRender) {
    this._clips.push(clip);
    this._clips.sort((a, b) => a.start - b.start);

    for (let i = 1; i < this._clips.length; i++) {
      let prevClip = this._clips[i - 1];
      let currentClip = this._clips[i];

      let prevEnd = prevClip.start + prevClip.duration;

      if (currentClip.start < prevEnd) {
        currentClip.start = prevEnd;
      }
    }
  }

  public async renderAt(currentTime: number) {
    const clip = this._findCurrentClip(currentTime);
    const nextClip = this._findCurrentClip(currentTime + 1.5);
    let activeSprite = this._getActiveSprite();

    if (!clip) {
      activeSprite.visible = false;
      return;
    }

    if (nextClip && nextClip.id !== clip.id) {
      nextClip.prepare();
    }

    if (!this._currentClip) {
      this._currentClip = clip;
    }

    if (this._currentClip.id !== clip.id) {
      this._currentClip?.close();
      activeSprite.visible = false;
      activeSprite.zIndex = 0;
      this._activeSpriteLabel = this._activeSpriteLabel === "A" ? "B" : "A";
      activeSprite = this._getActiveSprite();
      activeSprite.zIndex = 1;
      this._currentClip = clip;
    }

    const wrapped = await clip.getFrame(currentTime);
    if (wrapped) {
      activeSprite.scale.set(1, 1);
      const canvas = wrapped.canvas;
      activeSprite.texture.source.resource = canvas;
      activeSprite.texture.source.update();
      activeSprite.updateCacheTexture();
    }

    this._renderProperty(activeSprite);
    activeSprite.visible = true;
  }

  public async seek(currentTime: number, highQuality: boolean) {
    this._currentClip?.close();
    const clip = this._findCurrentClip(currentTime);
    this._activeSpriteLabel = "A";
    this._spriteA.visible = false;
    this._spriteB.visible = false;
    this._currentClip = clip;

    if (!clip) {
      return;
    }

    await clip.seek(currentTime);
    const wrapped = await clip.getFrame(currentTime);
    if (wrapped) {
      this._spriteA.texture.source.resource = wrapped.canvas;
      this._spriteA.texture.source.update();
    }
    this._renderProperty(this._spriteA);
    this._spriteA.visible = true;
  }

  private _findCurrentClip(currentTime: number) {
    let currentClip = null;
    for (const clip of this._clips) {
      if (
        clip &&
        clip.start <= currentTime &&
        currentTime < clip.start + clip.duration
      ) {
        currentClip = clip;
        break;
      }
    }
    return currentClip;
  }

  private _getActiveSprite() {
    return this._activeSpriteLabel === "A" ? this._spriteA : this._spriteB;
  }

  private _renderProperty(sprite: Sprite) {
    sprite.position.set(app!.screen.width / 2, app!.screen.height / 2);
    sprite.anchor.set(0.5, 0.5);
  }

  public get id() {
    return this._id;
  }
}
