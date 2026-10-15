import { SourceKind } from "../../../types/source";

export type AddSourceDto = {
  src: File | string;
  proxy?: File | string;
  kind: SourceKind;
};
