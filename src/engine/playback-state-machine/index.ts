import { PlaybackEvent, PlaybackState, StateListenerCallback } from "./types";

export class PlaybackStateMachine {
  private _listeners: Set<StateListenerCallback> = new Set();
  private _currentState: PlaybackState = "PAUSED";

  private _transition: Record<
    PlaybackState,
    Partial<Record<PlaybackEvent, PlaybackState>>
  > = {
    PAUSED: {
      PLAY: "PLAYING",
      START_SCRUB: "SCRUBBING",
      SEEK_START: "SEEKING",
      START_EXPORT: "EXPORTING",
    },
    PLAYING: {
      PAUSE: "PAUSED",
      BUFFER_WAIT: "BUFFERING",
      START_SCRUB: "SCRUBBING",
      SEEK_START: "SEEKING",
    },
    BUFFERING: {
      BUFFER_RESOLVED: "PLAYING",
      PAUSE: "PAUSED",
      START_SCRUB: "SCRUBBING",
    },
    SCRUBBING: {
      END_SCRUB: "SEEKING",
    },
    SEEKING: {
      SEEK_RESOLVED: "PAUSED",
      START_SCRUB: "SCRUBBING",
    },
    EXPORTING: {
      CANCEL_EXPORT: "PAUSED",
      EXPORT_COMPLETE: "PAUSED",
    },
  };

  public get currentState(): PlaybackState {
    return this._currentState;
  }

  public send(event: PlaybackEvent): boolean {
    const newState = this._transition[this._currentState][event];
    if (!newState) {
      return false;
    }

    if (newState !== this._currentState) {
      const prevState = this._currentState;
      this._currentState = newState;
      this.pub(newState, prevState);
    }

    return true;
  }

  public sub(callback: StateListenerCallback) {
    this._listeners.add(callback);
    return () => {
      this._listeners.delete(callback);
    };
  }

  private pub(newState: PlaybackState, prevState: PlaybackState) {
    this._listeners.forEach((callback) => callback(newState, prevState));
  }
}

export const playbackMachine = new PlaybackStateMachine();
