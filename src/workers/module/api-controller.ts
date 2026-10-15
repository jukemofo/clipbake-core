import { AnySource } from "../../types/source";
import { APISourceService } from "./api-source-service";
import { AddSourceDto } from "./dto/source-dto";

type APICentralEvent = {
  "source:add": { src: string };
  "source:delete": void;
};

type EventCallback = (data: any) => void;

class APIController {
  private _listeners: Map<string, Set<EventCallback>> = new Map();
  private _apiSourceService: APISourceService = new APISourceService();

  public readonly source = {
    add: async (payload: AddSourceDto): Promise<AnySource> => {
      return await this._apiSourceService.add(payload);
    },
  };

  private pub<T extends keyof APICentralEvent>(
    event: T,
    data: APICentralEvent[T],
  ) {
    this._listeners.get(event)?.forEach((callback) => callback(data));
  }

  public sub<T extends keyof APICentralEvent>(
    event: T,
    callback: (data: APICentralEvent[T]) => void,
  ) {
    if (!this._listeners.get(event)) {
      this._listeners.set(event, new Set());
    }
    const events = this._listeners.get(event)!;
    events.add(callback);

    return () => {
      events.delete(callback);
    };
  }
}

export const apiController = new APIController();

apiController.sub("source:add", (data) => {
  console.log(data.src);
});
