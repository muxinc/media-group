import { fixture, assert, aTimeout } from '@open-wc/testing';
import { MediaGroupController } from '../src/index.ts';

describe('Media Group', () => {
  it('group property and attribute', async function () {
    this.timeout(10000);

    let video = await fixture(
      `<video id="video" group="madmax" muted>
        <source src="https://api.playerx.io/mad-max-fury-road-video-avc.mp4" />
      </video>`
    );
    let audio = await fixture(
      `<audio id="audiofr" group="madmax"
        src="https://api.playerx.io/mad-max-fury-road-audio-fr.m4a"
      ></audio>`
    );

    assert.equal(video.group, 'madmax');
    assert.equal(audio.group, 'madmax');

    assert.equal(audio.groupController, video.groupController);

    audio.group = null;

    assert.equal(audio.getAttribute('group'), null);
    assert.equal(audio.groupController, undefined);

    video.group = 'maddermax';
    audio.group = 'maddermax';

    assert.equal(audio.getAttribute('group'), 'maddermax');
    assert.equal(video.getAttribute('group'), 'maddermax');
    assert.equal(audio.groupController, video.groupController);

    video.groupController.currentTime = 3;
    assert.equal(audio.currentTime, 3);
    assert.equal(video.currentTime, 3);
  });

  it('groupController', async function () {
    this.timeout(10000);

    let video = await fixture(
      `<video id="video" muted>
        <source src="https://api.playerx.io/mad-max-fury-road-video-avc.mp4" />
      </video>`
    );
    let audio = await fixture(
      `<audio id="audiofr" muted
        src="https://api.playerx.io/mad-max-fury-road-audio-fr.m4a"
      ></audio>`
    );

    let controller = new MediaGroupController();
    video.groupController = controller;
    audio.groupController = controller;

    assert.equal(audio.groupController, video.groupController);

    controller.currentTime = 3;
    assert.equal(audio.currentTime, 3);
    assert.equal(video.currentTime, 3);
  });
});

export function promisify(fn) {
  return (...args) =>
    new Promise((resolve) => {
      fn(...args, (...res) => {
        if (res.length > 1) resolve(res);
        else resolve(res[0]);
      });
    });
}
