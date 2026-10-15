import { AnySourceWorker } from "../../types/source";

class DataCentral {
  private _sources: Map<string, AnySourceWorker> = new Map();

  public readonly sources = {
    add: (source: AnySourceWorker) => {
      this._sources.set(source.id, source);
    },
    delete: (sourceId: string) => {
      this._sources.delete(sourceId);
    },
    get: (sourceId: string) => {
      return this._sources.get(sourceId);
    },
  };
}

export const dtCentral = new DataCentral();
