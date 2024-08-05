# media-group

Resurrection of the [mediagroup attribute](https://html.spec.whatwg.org/commit-snapshots/a4c46fc65e8ba138baeadf0bd1c2055b7bb43863/#attr-media-mediagroup) and [MediaController API](https://html.spec.whatwg.org/commit-snapshots/a4c46fc65e8ba138baeadf0bd1c2055b7bb43863/#synchronising-multiple-media-elements) (but renamed) which can be used to sync and control multiple audio / video elements.

⚠️ This library is designed as a polyfill but note that `MediaController` is renamed to `MediaGroupController` and the `mediagroup` attribute is renamed to just `group` to avoid any issues with Safari where the original API is still implemented (while not working properly).

## Example ([CodeSandbox](https://codesandbox.io/s/media-group-4p9v81))

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/media-group"></script>

<video
  group="madmax"
  src="https://stream.mux.com/ibw0201Usmvp9fcDyXRzGwCu01IZXiT5duks8OoO3OQ01e00/low.mp4"
  controls
  playsinline
  muted
></video>

<audio
  group="madmax"
  src="https://stream.mux.com/0201RDkkUbY3501qR9fYuqOd8UXQNNyO3JLNcMG9kW4rpA/audio.m4a"
  controls
  playsinline
></audio>
```

## Related

- [Media Chrome](https://github.com/muxinc/media-chrome) Your media player's dancing suit. 🕺
- [`<mux-video>`](https://github.com/muxinc/elements/tree/main/packages/mux-video) A Mux-flavored HTML5 video element w/ hls.js and Mux data builtin.
- [`<mux-player>`](https://github.com/muxinc/elements/tree/main/packages/mux-player) The official Mux-flavored video player web component.
- [`<youtube-video>`](https://github.com/muxinc/media-elements/tree/main/packages/youtube-video-element) A web component for the YouTube player.
- [`<vimeo-video>`](https://github.com/muxinc/media-elements/tree/main/packages/vimeo-video-element) A web component for the Vimeo player.
- [`<videojs-video>`](https://github.com/muxinc/media-elements/tree/main/packages/videojs-video-element) A web component for Video.js.
- [`<wistia-video>`](https://github.com/muxinc/media-elements/tree/main/packages/wistia-video-element) A web component for the Wistia player.
- [`<jwplayer-video>`](https://github.com/muxinc/media-elements/tree/main/packages/jwplayer-video-element) A web component for the JW player.
- [`<hls-video>`](https://github.com/muxinc/media-elements/tree/main/packages/hls-video-element) A web component for playing HTTP Live Streaming (HLS) videos.
- [`castable-video`](https://github.com/muxinc/media-elements/tree/main/packages/castable-video) Cast your video element to the big screen with ease!
