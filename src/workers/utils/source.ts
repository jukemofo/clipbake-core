import { Word } from "../../types/words";

export function isWordArray(data: unknown): data is Word[] {
  return (
    Array.isArray(data) &&
    data.every(
      (word) =>
        typeof word === "object" &&
        word !== null &&
        typeof word.text === "string" &&
        typeof word.start === "number" &&
        typeof word.end === "number",
    )
  );
}
