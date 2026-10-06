import { CanvasSource, Container, Sprite, Texture } from "pixi.js";
import { app } from "../canvas";
import { ImageClip } from "../../core-manager/clip";
import { sourceManager } from "../manager/source-manager";

export class ImageTrackRender {
  private _id: string;
  private _clips: ImageClip[] = [];
  private _container: Container;
  private _textureA: Texture;
  private _textureB: Texture;
  private _spriteA: Sprite;
  private _spriteB: Sprite;
  private _activeSpriteLabel: "A" | "B";
  private _currentClip: ImageClip | null = null;
  private _sessionId: number = 0;

  constructor(id: string) {
    this._id = id;

    this._container = new Container();
    this._activeSpriteLabel = "A";
    this._textureA = new Texture({
      source: new CanvasSource({ resource: new OffscreenCanvas(200, 200) }),
    });
    this._spriteA = new Sprite(this._textureA);
    this._textureA.dynamic = true;

    this._textureB = new Texture({
      source: new CanvasSource({ resource: new OffscreenCanvas(200, 200) }),
    });
    this._spriteB = new Sprite(this._textureB);
    this._textureB.dynamic = true;

    this._container.addChild(this._spriteA);
    this._container.addChild(this._spriteB);

    app!.stage.addChild(this._container);
  }

  public addClip(clip: ImageClip) {
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
    let activeSprite = this._getActiveSprite();
    if (!clip) {
      this._currentClip = null;
      activeSprite.texture = Texture.EMPTY;
      return;
    }
    if (!this._currentClip) {
      this._currentClip = clip;
    }
    const canvas = this._getCanvas(clip);
    if (this._currentClip.id !== clip.id) {
      activeSprite.texture = Texture.EMPTY;
      activeSprite.zIndex = 0;
      this._activeSpriteLabel = this._activeSpriteLabel === "A" ? "B" : "A";
      activeSprite = this._getActiveSprite();
      activeSprite.zIndex = 1;
      this._currentClip = clip;
    }

    if (canvas) {
      const texture =
        this._activeSpriteLabel === "A" ? this._textureA : this._textureB;
      texture.source.resource = canvas;
      activeSprite.texture = texture;
      texture.source.update();
    }

    this._renderProperty(activeSprite);
  }

  public async seek(currentTime: number) {
    this._sessionId += 1;
    const currentSession = this._sessionId;
    await this.close();
    const clip = this._findCurrentClip(currentTime);
    this._currentClip = clip;
    this._activeSpriteLabel = "A";

    if (!clip) {
      this._spriteA.texture = Texture.EMPTY;
      return;
    }

    if (currentSession !== this._sessionId) {
      return;
    }
    const canvas = this._getCanvas(clip);
    this._spriteB.texture = Texture.EMPTY;
    if (canvas) {
      this._textureA.source.resource = canvas;
      this._spriteA.texture = this._textureA;
      this._textureA.source.update();
    }
    this._renderProperty(this._spriteA);
  }

  public async scrub(currentTime: number) {
    const clip = this._findCurrentClip(currentTime);
    this._activeSpriteLabel = "A";
    this._spriteB.texture = Texture.EMPTY;
    if (!clip) {
      this._spriteA.texture = Texture.EMPTY;
      return;
    }
    const canvas = this._getCanvas(clip);
    if (canvas) {
      this._textureA.source.resource = canvas;
      this._spriteA.texture = this._textureA;
      this._textureA.source.update();
    }
    this._renderProperty(this._spriteA);
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
    sprite.scale.set(1, 1);
    sprite.position.set(app!.screen.width / 2, app!.screen.height / 2);
    sprite.anchor.set(0.5, 0.5);
  }

  private _getCanvas(clip: ImageClip) {
    const source = sourceManager.getImageSource(clip.sourceId);
    if (!source) {
      throw new Error("Not found source");
    }
    return source.proxyCanvas ?? source.canvas;
  }

  public isStarving() {
    return false;
  }

  public isClipExisted(id: string) {
    return this._clips.find((c) => c.id === id);
  }

  public updateOrder(index: number) {
    this._container.zIndex = index;
  }

  public async close() {}

  public get id() {
    return this._id;
  }

  public get rawClips() {
    return this._clips;
  }
}
