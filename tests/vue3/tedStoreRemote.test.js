import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createPinia, setActivePinia } from 'pinia';
import { useTedStore } from '../../src/stores/tedStore.js';
import { TALKS } from '../../src/data/tedData.js';

beforeEach(() => {
  setActivePinia(createPinia());
});

describe('useTedStore Remote R2 Catalog Sync', () => {
  it('initializes with default talks, local source and not loading', () => {
    const store = useTedStore();
    assert.equal(store.isLoadingTalks, false);
    assert.equal(store.talksSource, 'local');
    assert.ok(Array.isArray(store.talks));
    assert.equal(store.talks.length, TALKS.length);
  });

  it('fetchRemoteTalks fetches from /api/ted/talks and updates store when successful', async () => {
    const store = useTedStore();

    const mockRemoteTalks = [
      {
        id: 'ted-brene-brown-vulnerability',
        title: 'The Power of Vulnerability',
        titleCn: '脆弱的力量',
        speaker: 'Brené Brown',
        year: 2010,
        durationSeconds: 1219,
        cefrLevel: 'B2',
        videoKey: 'ted/brene-brown-vulnerability/video.mp4',
        vttKey: 'ted/brene-brown-vulnerability/subtitle.vtt',
        vocabSet: []
      },
      {
        id: 'ted-simon-sinek-2009',
        title: 'How Great Leaders Inspire Action',
        titleCn: '伟大领袖如何激励行动',
        speaker: 'Simon Sinek',
        year: 2009,
        durationSeconds: 1088,
        cefrLevel: 'B1',
        videoKey: 'ted/simon-sinek-2009/video.mp4',
        vttKey: 'ted/simon-sinek-2009/subtitle.vtt',
        vocabSet: [{ word: 'inspire' }]
      }
    ];

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      if (url === '/api/ted/talks') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            talks: mockRemoteTalks,
            cached: false
          })
        };
      }
      return { ok: false, status: 404 };
    };

    try {
      await store.fetchRemoteTalks();

      assert.equal(store.talks.length, 2);
      assert.equal(store.talksSource, 'api');
      assert.equal(store.isLoadingTalks, false);
      assert.equal(store.selectedTalkId, 'ted-brene-brown-vulnerability');
      assert.equal(store.videoSrc.includes('brene-brown-vulnerability'), true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('fetchRemoteTalks gracefully falls back to local talks when network fails', async () => {
    const store = useTedStore();

    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
      throw new Error('Network error connecting to /api/ted/talks');
    };

    try {
      await store.fetchRemoteTalks();

      assert.equal(store.talks.length, TALKS.length);
      assert.equal(store.talksSource, 'local');
      assert.equal(store.isLoadingTalks, false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('selectTalk automatically unlocks vocab when a talk has no vocabSet', () => {
    const store = useTedStore();

    // Inject a talk with 0 vocab items
    store.talks = [
      {
        id: 'ted-no-vocab',
        title: 'Talk with No Vocab',
        speaker: 'Speaker',
        videoKey: 'ted/no-vocab/video.mp4',
        vocabSet: []
      }
    ];

    store.selectTalk('ted-no-vocab');
    assert.equal(store.vocabUnlocked, true, 'Vocab must be unlocked if vocabSet is empty');

    // Test that goToStep(2) can advance immediately
    store.goToStep(2);
    assert.equal(store.currentStep, 2);
  });

  it('selectTalk keeps vocab locked when a talk has vocabSet items until listened', () => {
    const store = useTedStore();
    store.selectTalk(TALKS[0].id);
    assert.equal(store.vocabUnlocked, false);

    store.goToStep(2);
    assert.equal(store.currentStep, 1); // Remains 1 because vocab is not yet listened
  });
});
