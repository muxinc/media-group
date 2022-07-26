import { MediaGroupController } from './media-group-controller';

declare global {
  interface HTMLMediaElement { // eslint-disable-line
    groupController: MediaGroupController;
    group: string;
  }
}

const mutationCallback = (mutationsList: MutationRecord[]) => {
  for (let mutation of mutationsList) {
    if (mutation.type === 'childList') {
      mutation.removedNodes.forEach(toggleMediaGroup);
      mutation.addedNodes.forEach(toggleMediaGroup);
    } else if (mutation.type === 'attributes') {
      if (mutation.attributeName === 'group') {
        toggleMediaGroup(mutation.target);
      }
    }
  }
};

const observer = new MutationObserver(mutationCallback);
const config = {
  attributes: true,
  attributeFilter: ['group'],
  attributeOldValue: true,
  childList: true,
  subtree: true,
};
observer.observe(document, config);

function toggleMediaGroup(node: Node) {
  const mediaElement = node as HTMLMediaElement;
  if (
    isMediaElement(mediaElement) &&
    (mediaElement.hasAttribute('group') || 'group' in mediaElement)
  ) {
    const proto = Object.getPrototypeOf(node);
    if (!('groupController' in proto)) {
      Object.defineProperty(proto, 'groupController', {
        get() {
          return MediaGroupController.get(this);
        },
        set(controller: MediaGroupController) {
          MediaGroupController.set(this, controller);
        },
      });

      Object.defineProperty(proto, 'group', {
        get() {
          return MediaGroupController.getId(this);
        },
        set(groupId: string) {
          MediaGroupController.setId(this, groupId);
        },
      });
    }
    // group can be null removing the controller from the media element.
    MediaGroupController.setId(mediaElement, mediaElement.group);
  }
}

function isMediaElement(node: any) {
  return (
    node instanceof HTMLMediaElement ||
    node.localName?.endsWith('video') ||
    node.localName?.endsWith('audio')
  );
}
