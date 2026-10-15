import { Settings } from "../../types/settings";
import { dataRepository } from "./data-repository";

export class APISettingsService {
  public update(settings: Settings) {
    dataRepository.settings.update(settings);
  }
}
