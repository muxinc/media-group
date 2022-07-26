// not sure if this is needed
// would be something like <media-group><video/><audio/></media-group>

class MediaGroup extends HTMLElement {}

if (
  globalThis.customElements.get('media-group') ||
  (globalThis as any).MediaGroup
) {
  console.debug('MediaGroup: <media-group> defined more than once.');
} else {
  (globalThis as any).MediaGroup = MediaGroup;
  globalThis.customElements.define('media-group', MediaGroup);
}
