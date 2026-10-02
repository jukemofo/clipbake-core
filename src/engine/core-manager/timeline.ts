export class Timeline {
  public get version(): `${number}.${number}.${number}` {
    return this._version;
  }
  public set version(value: `${number}.${number}.${number}`) {
    this._version = value;
  }
  public get id(): string {
    return this._id;
  }
  public set id(value: string) {
    this._id = value;
  }
  constructor(
    private _id: string,
    private _version: `${number}.${number}.${number}`,
    private _name: string,
    private _width: number,
    private _height: number,
    private _fps: number,
    private _backgroundColor: string,
  ) {}
}
