export type WordType = {
  text: string;
  start: number;
  end: number;
};

export type TranscriptType = {
  text: string;
  words: WordType[];
};
