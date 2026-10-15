import { dataRepository } from "./data-repository";

export class APIDurationService {
  public get() {
    return dataRepository.project.getDuration();
  }
}
