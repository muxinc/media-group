const mediaToController: WeakMap<HTMLMediaElement, MediaGroupController> =
  new WeakMap();

const controllers: Record<string, MediaGroupController> = {};

export class MediaGroupController extends EventTarget {
  static set(
    mediaElement: HTMLMediaElement,
    controller?: MediaGroupController
  ) {
    const prevController = mediaToController.get(mediaElement);
    if (prevController) prevController.#delete(mediaElement);

    if (controller) {
      mediaToController.set(mediaElement, controller);
      controller.#add(mediaElement);
      return;
    }
    mediaToController.delete(mediaElement);
  }

  static get(mediaElement: HTMLMediaElement): MediaGroupController | undefined {
    return mediaToController.get(mediaElement);
  }

  static getId(mediaElement: HTMLMediaElement) {
    return mediaElement.getAttribute('group');
  }

  static setId(mediaElement: HTMLMediaElement, groupId?: string) {
    if (groupId) {
      const controller = controllers[groupId] ?? new MediaGroupController();
      controller.#id = groupId;
      controllers[groupId] = controller;
      this.set(mediaElement, controller);
      return;
    }
    this.set(mediaElement, undefined);
  }

  #mediaElements: Set<HTMLMediaElement> = new Set();
  // eslint-disable-next-line
  #listeners: Record<string, EventListenerOrEventListenerObject> = {};
  #promises: Record<string, PublicPromise<void> | undefined> = {
    play: undefined,
    pause: undefined,
    currentTime: undefined,
  };
  #correctionTime = 0.5;
  #seekThreshold = 1;
  #syncTimeoutId: number;
  #diffSamples: number[] = [];
  #lastSeek = 0;
  #id = uniqueId('g');
  #prevPlaybackRate?: number;

  constructor() {
    super();

    this.#listeners = {
      play: ({ currentTarget }) => {
        if (!this.#promises.play) {
          this.play();
        }

        if (currentTarget === this.#baseMedia) {
          this.dispatchEvent(new Event('play'));
        }
      },
      playing: ({ currentTarget }) => {
        if (currentTarget !== this.#baseMedia) return;

        this.dispatchEvent(new Event('playing'));
      },
      pause: ({ currentTarget }) => {
        // don't trigger a final pause while seeking, some players pause internally while seeking.
        if (!this.#promises.pause && !this.#promises.currentTime) {
          this.pause();
        }

        if (currentTarget === this.#baseMedia) {
          this.dispatchEvent(new Event('pause'));
        }
      },
      timeupdate: ({ currentTarget }) => {
        if (currentTarget !== this.#baseMedia) return;

        this.dispatchEvent(new Event('timeupdate'));
      },
      ended: ({ currentTarget }) => {
        if (currentTarget !== this.#baseMedia) return;

        this.dispatchEvent(new Event('ended'));
      },
      seeking: ({ currentTarget }) => {
        const media = currentTarget as HTMLMediaElement;
        if (media !== this.#baseMedia) {
          if (!this.#promises.currentTime) {
            const diff = Math.abs(this.currentTime - media.currentTime);
            if (
              diff >
              (toNumberOrUndefined(media.dataset.groupSeekPrecision) ?? 0.5)
            ) {
              this.currentTime = media.currentTime;
            }
          }
          return;
        }

        if (currentTarget === this.#baseMedia) {
          this.dispatchEvent(new Event('seeking'));
        }
      },
      seeked: ({ currentTarget }) => {
        if (currentTarget !== this.#baseMedia) return;

        this.dispatchEvent(new Event('seeked'));
      },
      waiting: () => {
        if (this.#prevPlaybackRate != null) return;

        this.#prevPlaybackRate = this.playbackRate;
        this.playbackRate = 0;
        this.dispatchEvent(new Event('waiting'));

        const interval = setInterval(() => {
          if (
            this.#prevPlaybackRate != null &&
            this.#mediaList.every((media) => media.readyState >= 3)
          ) {
            clearInterval(interval);
            this.playbackRate = this.#prevPlaybackRate;
            this.#prevPlaybackRate = undefined;
          }
        }, 100);
      },
      progress: () => {
        this.dispatchEvent(new Event('progress'));
      },
      volumechange: ({ currentTarget }) => {
        if (currentTarget !== this.#baseMedia) return;

        this.dispatchEvent(new Event('volumechange'));
      },
      ratechange: ({ currentTarget }) => {
        if (currentTarget !== this.#baseMedia) return;

        this.dispatchEvent(new Event('ratechange'));
      },
    };

    const isSafari = !!(globalThis as any).MediaController;
    if (isSafari) {
      this.#syncTimeoutId = setTimeout(() => this.#safariSyncMedia(), 200);
      return;
    }
    this.#syncTimeoutId = setTimeout(() => this.#syncMedia(), 200);
  }

  get id() {
    return this.#id;
  }

  get duration() {
    return this.#baseMedia.duration ?? NaN;
  }

  get paused() {
    return this.#baseMedia.paused ?? true;
  }

  get currentTime() {
    return this.#baseMedia.currentTime ?? 0;
  }

  set currentTime(val) {
    this.#promises.currentTime = new PublicPromise();
    Promise.all(
      this.#mediaList.map((media) => {
        if (media.currentTime === val) return;
        const result = promisify(media.addEventListener.bind(media))('seeked');
        media.currentTime = val;
        return result;
      })
    ).then(() => {
      this.#promises.currentTime?.resolve?.();
      this.#promises.currentTime = undefined;
    });
  }

  get playbackRate() {
    return this.#baseMedia.playbackRate ?? 1;
  }

  set playbackRate(val) {
    this.#mediaList.forEach((media) => {
      media.playbackRate = val;
    });
  }

  get volume() {
    return this.#baseMedia.volume ?? 1;
  }

  set volume(val) {
    this.#mediaList.forEach((media) => {
      media.volume = this.#baseMedia.volume;
    });
  }

  get muted() {
    return this.#baseMedia.muted ?? false;
  }

  set muted(val) {
    this.#mediaList.forEach((media) => {
      media.muted = this.#baseMedia.muted;
    });
  }

  get buffered() {
    return this.#baseMedia?.buffered;
  }

  get played() {
    return this.#baseMedia?.played;
  }

  get seekable() {
    return this.#baseMedia?.seekable;
  }

  async play() {
    if (this.#promises.play) return this.#promises.play;

    this.#promises.play = new PublicPromise();
    Promise.all(
      this.#mediaList.map((media) => {
        if (!media.paused) return;
        return media.play();
      })
    ).then(() => {
      this.#promises.play?.resolve?.();
      this.#promises.play = undefined;
    });
    return this.#promises.play;
  }

  async pause() {
    if (this.#promises.pause) return this.#promises.pause;

    this.#promises.pause = new PublicPromise();
    Promise.all(
      this.#mediaList.map((media) => {
        if (media.paused) return;
        const result = promisify(media.addEventListener.bind(media))('pause');
        media.pause();
        return result;
      })
    ).then(() => {
      this.#promises.pause?.resolve?.();
      this.#promises.pause = undefined;
    });
    return this.#promises.pause;
  }

  async #safariSyncMedia() {
    if (this.#baseMedia.localName.includes('-')) {
      await customElements.whenDefined(this.#baseMedia.localName);
    }

    const sourceTime = this.#baseMedia.currentTime;
    const sourcePlaybackRate = this.#baseMedia.playbackRate;
    const syncInterval = 100;

    this.#syncedMediaList.forEach(async (child) => {
      if (child.localName.includes('-')) {
        await customElements.whenDefined(child.localName);
      }

      try {
        // https://www.prosoundtraining.com/site/wp-content/uploads/2014/02/Lip-Sync-Errors.pdf
        // Safari is very difficult to get synced so close.
        // Working with playbackRate is impossible on Safari, try with seeking.
        const target = child.dataset.groupSeekPrecision ?? 0.05;
        const offset = 0;
        const targetTime = sourceTime + offset / 1000;
        const currentTime = child.currentTime;
        let diff = targetTime - currentTime;
        const sourcePaused =
          this.#baseMedia.paused ||
          this.#baseMedia.ended ||
          targetTime < 0 ||
          targetTime >= child.duration;

        if (
          !this.#promises.play &&
          !this.#promises.pause &&
          !this.#promises.currentTime &&
          sourcePaused !== child.paused
        ) {
          sourcePaused ? child.pause() : child.play();
        }

        if (sourcePlaybackRate === 0) {
          return;
        }

        if (
          sourcePlaybackRate > 0 &&
          child.playbackRate != sourcePlaybackRate
        ) {
          child.playbackRate = sourcePlaybackRate;
        }

        // Need to smooth diffs, many browsers are too inconsistent!
        if (this.#diffSamples.length >= 4) this.#diffSamples.shift();
        this.#diffSamples.push(diff);
        diff = average(this.#diffSamples);

        if (Math.abs(diff) < target) {
          if (child.playbackRate != 1) {
            child.playbackRate = 1;
          }

          clearTimeout(this.#syncTimeoutId);
          this.#syncTimeoutId = setTimeout(
            () => this.#safariSyncMedia(),
            syncInterval
          );
          return;
        }

        // Safari needs enough time to recuperate from the seek, poor baby.
        if (
          child.currentTime != targetTime &&
          performance.now() - this.#lastSeek > 1000
        ) {
          if (child.currentTime) {
            // Over seek on purpose here because it performs better.
            child.currentTime = targetTime + 0.4;
          }
          this.#lastSeek = performance.now();
        }
      } catch (error) {
        console.error(error);
      }
    });

    clearTimeout(this.#syncTimeoutId);
    this.#syncTimeoutId = setTimeout(
      () => this.#safariSyncMedia(),
      syncInterval
    );
  }

  // Adapted from https://github.com/tjenkinson/media-element-syncer (WL)
  async #syncMedia() {
    if (this.#baseMedia.localName.includes('-')) {
      await customElements.whenDefined(this.#baseMedia.localName);
    }

    const sourceTime = this.#baseMedia.currentTime;
    const sourcePlaybackRate = this.#baseMedia.playbackRate;

    this.#syncedMediaList.forEach(async (child) => {
      if (child.localName.includes('-')) {
        await customElements.whenDefined(child.localName);
      }

      try {
        // https://www.prosoundtraining.com/site/wp-content/uploads/2014/02/Lip-Sync-Errors.pdf
        const target = 0.025;
        const offset = 0;
        const targetTime = sourceTime + offset / 1000;
        const currentTime = child.currentTime;
        const diff = targetTime - currentTime;
        const sourcePaused =
          this.#baseMedia.paused ||
          this.#baseMedia.ended ||
          targetTime < 0 ||
          targetTime >= child.duration;

        if (
          !this.#promises.play &&
          !this.#promises.pause &&
          !this.#promises.currentTime &&
          sourcePaused !== child.paused
        ) {
          sourcePaused ? child.pause() : child.play();
        }

        if (sourcePlaybackRate === 0) {
          return;
        }

        if (Math.abs(diff) < target) {
          if (child.playbackRate != 1) {
            child.playbackRate = 1;
          }
          return;
        }

        const rate = Math.max(
          0,
          ((diff + this.#correctionTime) / this.#correctionTime) *
            sourcePlaybackRate
        );

        if (sourcePaused || rate < 0 || Math.abs(diff) >= this.#seekThreshold) {
          if (child.playbackRate != sourcePlaybackRate) {
            child.playbackRate = sourcePlaybackRate;
          }
          if (child.currentTime != targetTime) {
            child.currentTime = targetTime;
          }
        } else {
          if (child.playbackRate != rate) {
            child.playbackRate = rate;
          }
        }
      } catch (error) {
        console.error(error);
      }
    });

    clearTimeout(this.#syncTimeoutId);
    this.#syncTimeoutId = setTimeout(() => this.#syncMedia(), 200);
  }

  get #mediaList() {
    return [...this.#mediaElements];
  }

  get #baseMedia(): HTMLMediaElement {
    return this.#mediaList?.[0] ?? {};
  }

  get #syncedMediaList(): HTMLMediaElement[] {
    return [...this.#mediaElements].slice(1);
  }

  #add(mediaElement: HTMLMediaElement) {
    this.#mediaElements.add(mediaElement);

    this.#addListeners(mediaElement);
  }

  #delete(mediaElement: HTMLMediaElement) {
    this.#removeListeners(mediaElement);

    this.#mediaElements.delete(mediaElement);
  }

  #addListeners(mediaElement: HTMLMediaElement) {
    Object.entries(this.#listeners).forEach(([type, listener]) => {
      mediaElement.addEventListener(type, listener);
    });
  }

  #removeListeners(mediaElement: HTMLMediaElement) {
    Object.entries(this.#listeners).forEach(([type, listener]) => {
      mediaElement.removeEventListener(type, listener);
    });
  }
}

const average = (array: number[]) =>
  array.reduce((a, b) => a + b) / array.length;

let idCounter = 0;
function uniqueId(prefix: string = '') {
  let id = ++idCounter;
  return `${prefix}${id}`;
}

function promisify(fn: Function) {
  return (...args: any[]) =>
    new Promise((resolve) => {
      fn(...args, (...res: any[]) => {
        if (res.length > 1) resolve(res);
        else resolve(res[0]);
      });
    });
}

function toNumberOrUndefined(val: any) {
  if (val == null) return undefined;
  const num = +val;
  return !Number.isNaN(num) ? num : undefined;
}

/**
 * A utility to create Promises with convenient public resolve and reject methods.
 * @return {Promise}
 */
class PublicPromise<T> extends Promise<T> {
  resolve?: () => void;
  reject?: () => void;
  // eslint-disable-next-line
  constructor(executor = (r: Function, j: Function) => {}) {
    let res, rej;
    super((resolve, reject) => {
      executor(resolve, reject);
      res = resolve;
      rej = reject;
    });
    this.resolve = res;
    this.reject = rej;
  }
}

if (!(globalThis as any).MediaGroupController) {
  (globalThis as any).MediaGroupController = MediaGroupController;
}
