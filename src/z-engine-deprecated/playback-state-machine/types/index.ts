export type PlaybackState =
  | "PAUSED"
  | "PLAYING"
  | "BUFFERING"
  | "SCRUBBING"
  | "SEEKING"
  | "EXPORTING";

export type PlaybackEvent =
  | "PLAY"
  | "PAUSE"
  | "BUFFER_WAIT"
  | "BUFFER_RESOLVED"
  | "START_SCRUB"
  | "END_SCRUB"
  | "SEEK_START"
  | "SEEK_RESOLVED"
  | "START_EXPORT"
  | "CANCEL_EXPORT"
  | "EXPORT_COMPLETE";

export type StateListenerCallback = (
  state: PlaybackState,
  prevState: PlaybackState,
) => void;
