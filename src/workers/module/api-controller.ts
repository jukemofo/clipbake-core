import { TickCallback } from "../../types/callback";
import { AnyClip } from "../../types/clip";
import { AnySource } from "../../types/source";
import { Second } from "../../types/time";
import { AnyTrack } from "../../types/track";
import { APIClipService } from "./api-clip-service";
import { APISettingsService } from "./api-settings-service";
import { APISourceService } from "./api-source-service";
import { APITrackService } from "./api-track-service";
import { AddClipDto } from "./dto/clip-dto";
import {
  InitEngineDto,
  SeekEngineDto,
  StartEngineDto,
  StopEngineDto,
} from "./dto/engine-dto";
import { AddSourceDto } from "./dto/source-dto";
import { AddTrackDto } from "./dto/track-dto";
import { RenderService } from "./render-service";

class APIController {
  private _apiSourceService: APISourceService = new APISourceService();
  private _apiSettingsService: APISettingsService = new APISettingsService();
  private _apiTrackService: APITrackService = new APITrackService();
  private _apiClipService: APIClipService = new APIClipService();
  private _renderService: RenderService = new RenderService();

  public readonly engine = {
    init: async (payload: InitEngineDto) => {
      const { canvas, ...settings } = payload;
      this._apiSettingsService.update(settings);
      await this._renderService.init(canvas, settings);
    },

    start: async (payload: StartEngineDto) => {
      const onTick: TickCallback = async (currentTime: Second) => {
        console.log(currentTime);
      };

      await this._renderService.start(
        payload.time,
        payload.basePerfTime,
        onTick,
      );
    },

    stop: async (payload: StopEngineDto) => {
      console.log(payload.time);
      await this._renderService.stop(payload.time);
    },

    seek: async (payload: SeekEngineDto) => {},
  };

  public readonly sources = {
    add: async (payload: AddSourceDto): Promise<AnySource> => {
      return await this._apiSourceService.add(payload);
    },
  };

  public readonly tracks = {
    add: ({ kind }: AddTrackDto): AnyTrack => {
      return this._apiTrackService.add(kind);
    },
  };

  public readonly clips = {
    add: (clip: AddClipDto): AnyClip[] => {
      return this._apiClipService.add(clip);
    },
  };
}

export const apiController = new APIController();
