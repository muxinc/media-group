# Media Group

Resurrection of the [mediagroup attribute](https://html.spec.whatwg.org/commit-snapshots/a4c46fc65e8ba138baeadf0bd1c2055b7bb43863/#attr-media-mediagroup) and [MediaController API](https://html.spec.whatwg.org/commit-snapshots/a4c46fc65e8ba138baeadf0bd1c2055b7bb43863/#synchronising-multiple-media-elements) (but renamed) which can be used to sync and control multiple audio / video elements.

⚠️ This library is designed as a polyfill but note that `MediaController` is renamed to `MediaGroupController` and the `mediagroup` attribute is renamed to just `group` to avoid any issues with Safari where the original API is still implemented (while not working properly).

## Example ([CodeSandbox](https://codesandbox.io/s/media-group-4p9v81))

```html
  <script src="https://unpkg.com/media-group"></script>

  <video
    group="madmax"
    controls
    playsinline
    muted
  >
    <source src="https://api.playerx.io/mad-max-fury-road-video-avc.mp4" />
  </video>

  <audio
    group="madmax"
    controls
    playsinline
    src="https://api.playerx.io/mad-max-fury-road-audio-fr.m4a"
  ></audio>
```

## Related

- [Media Chrome](https://github.com/muxinc/media-chrome) Your media player's dancing suit. 🕺
- [`<media-playlist>`](https://github.com/muxinc/media-playlist) A custom element for playing through a set of audio and/or video elements.
- [`<hls-video>`](https://github.com/muxinc/hls-video-element) A web component for playing HTTP Live Streaming (HLS) videos.
- [`<youtube-video>`](https://github.com/muxinc/youtube-video-element) A web component for the YouTube player.
- [`<vimeo-video>`](https://github.com/luwes/vimeo-video-element) A web component for the Vimeo player.
- [`castable-video`](https://github.com/muxinc/castable-video) Cast your video element to the big screen with ease!
- [`<mux-player>`](https://github.com/muxinc/elements/tree/main/packages/mux-player) The official Mux-flavored video player web component.
- [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video) A Mux-flavored HTML5 video element w/ hls.js and Mux data builtin.
