import { TickCallback } from "../../types/callback";
import { MediaKind } from "../../types/kind";
import { AnySource } from "../../types/source";
import { Second } from "../../types/time";
import { AnyTrack } from "../../types/track";
import { APIClipService } from "./api-clip-service";
import { APIDurationService } from "./api-duration-service";
import { APISettingsService } from "./api-settings-service";
import { APISourceService } from "./api-source-service";
import { APITrackService } from "./api-track-service";
import { AddClipDto, AddClipResponseDto } from "./dto/clip-dto";
import {
  InitEngineDto,
  SeekEngineDto,
  StartEngineDto,
  StopEngineDto,
} from "./dto/engine-dto";
import { AddSourceDto } from "./dto/source-dto";
import { AddTrackDto } from "./dto/track-dto";
import { LoopService } from "./loop-service";
import { RenderService } from "./render-service";

class APIController {
  private _apiSourceService: APISourceService = new APISourceService();
  private _apiSettingsService: APISettingsService = new APISettingsService();
  private _apiTrackService: APITrackService = new APITrackService();
  private _apiClipService: APIClipService = new APIClipService();
  private _apiDurationService: APIDurationService = new APIDurationService();
  private _loopService: LoopService = new LoopService();
  private _renderService: RenderService = new RenderService();

  public readonly engine = {
    init: async (payload: InitEngineDto) => {
      const { canvas, ...settings } = payload;
      this._apiSettingsService.update(settings);
      await this._renderService.init(canvas, settings);
    },

    start: async (payload: StartEngineDto) => {
      const onTick: TickCallback = async (currentTime: Second) => {
        this._renderService.render(currentTime);
      };
      this._loopService.start(payload.time, payload.basePerfTime, onTick);
    },

    stop: async (payload: StopEngineDto) => {
      this._loopService.stop(payload.time);
    },

    seek: async (payload: SeekEngineDto) => {},
  };

  public readonly sources = {
    add: async (payload: AddSourceDto): Promise<AnySource> => {
      return await this._apiSourceService.add(payload);
    },
  };

  public readonly project = {
    getDuration: () => {
      return this._apiDurationService.get();
    },
  };

  public readonly tracks = {
    add: ({ kind }: AddTrackDto): AnyTrack => {
      const track = this._apiTrackService.add(kind);
      if (kind !== MediaKind.AUDIO) {
        const order = this._apiTrackService.getVisualTrackOrder(track.id);
        this._renderService.addTrack(track, order);
      }
      return track;
    },
  };

  public readonly clips = {
    add: (clip: AddClipDto): AddClipResponseDto => {
      const result = this._apiClipService.add(clip);
      this._renderService.updateTrackClips(result.actualClipsOnTrack);
      return result;
    },
  };
}

export const apiController = new APIController();
