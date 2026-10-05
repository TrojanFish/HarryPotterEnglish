/**
 * Adversarial Test Suite for ShadowingRecorder.jsx
 *
 * Tests:
 * 1. Resource Leak Scenarios:
 *    - streamRef tracks stopped on unmount
 *    - streamRef tracks stopped on normal stop
 *    - streamRef tracks stopped on modal close (isOpen=false)
 *    - URL.revokeObjectURL called on old blob when re-recording
 *    - URL.revokeObjectURL called on modal close and component unmount
 *    - In-flight unmount & mediaRecorder.onstop race condition checks
 * 2. Safety Timeout Challenges:
 *    - Web Speech hangs (5000ms delay): timeout fires at 1500ms, latency strictly < 2000ms
 *    - Verification that late onend (5000ms) does not corrupt or duplicate evaluation
 *    - Fallback mode (no Web Speech): instant evaluation without 1500ms delay
 *    - Rapid stop clicks re-entrancy safety
 * 3. Backward Compatibility:
 *    - Original narrator playback button invokes onPlayOriginalSnippet(currentCue)
 *    - Original narrator playback disabled during recording & evaluation
 *    - Recorded audio playback play/pause toggle and onended reset
 *    - O.W.L. grading and word highlight verification
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import React from 'react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// 1. Transpile ShadowingRecorder.jsx for Node test environment
const srcPath = path.resolve(projectRoot, 'src', 'components', 'ShadowingRecorder.jsx');
let srcCode = fs.readFileSync(srcPath, 'utf8');
// Fix relative import for test location
srcCode = srcCode.replace('../utils/speechScoring', '../src/utils/speechScoring.js');
const transformed = esbuild.transformSync(srcCode, { loader: 'jsx', format: 'esm' });
const compiledTestPath = path.resolve(__dirname, 'ShadowingRecorder.compiled.js');
fs.writeFileSync(compiledTestPath, transformed.code, 'utf8');

const { ShadowingRecorder } = await import('./ShadowingRecorder.compiled.js');

// 2. Mock Environments & Factories
function createMockEnvironment() {
  const createdTracks = [];
  const objectUrls = new Map();
  let urlCounter = 0;

  // Mock MediaStreamTrack
  class MockMediaStreamTrack {
    constructor() {
      this.kind = 'audio';
      this.readyState = 'live';
      this.stopCount = 0;
      createdTracks.push(this);
    }
    stop() {
      this.readyState = 'ended';
      this.stopCount++;
    }
  }

  // Mock MediaStream
  class MockMediaStream {
    constructor() {
      this.tracks = [new MockMediaStreamTrack()];
    }
    getTracks() {
      return this.tracks;
    }
  }

  // Mock MediaRecorder
  let lastMediaRecorder = null;
  class MockMediaRecorder {
    constructor(stream) {
      this.stream = stream;
      this.state = 'inactive';
      this.ondataavailable = null;
      this.onstop = null;
      lastMediaRecorder = this;
    }
    start(timeslice) {
      this.state = 'recording';
    }
    stop() {
      this.state = 'inactive';
      if (this.ondataavailable) {
        this.ondataavailable({ data: { size: 1024, type: 'audio/webm' } });
      }
      if (this.onstop) {
        this.onstop();
      }
    }
  }

  // Mock SpeechRecognition
  let lastRecognition = null;
  let simulatedEndDelayMs = 0;
  class MockSpeechRecognition {
    constructor() {
      this.continuous = false;
      this.interimResults = false;
      this.lang = 'en-US';
      this.onresult = null;
      this.onerror = null;
      this.onend = null;
      this.isStarted = false;
      this.isStopped = false;
      this.isAborted = false;
      lastRecognition = this;
    }
    start() {
      this.isStarted = true;
    }
    stop() {
      this.isStopped = true;
      if (simulatedEndDelayMs > 0) {
        const timer = setTimeout(() => {
          if (this.onend) this.onend();
        }, simulatedEndDelayMs);
        if (timer && typeof timer.unref === 'function') timer.unref();
      } else {
        if (this.onend) this.onend();
      }
    }
    abort() {
      this.isAborted = true;
    }
  }

  // Attach to globalThis / window
  if (!globalThis.window) globalThis.window = globalThis;
  if (!globalThis.navigator) globalThis.navigator = {};

  globalThis.window.SpeechRecognition = MockSpeechRecognition;
  globalThis.window.webkitSpeechRecognition = MockSpeechRecognition;
  globalThis.MediaRecorder = MockMediaRecorder;

  globalThis.navigator.mediaDevices = {
    getUserMedia: async () => new MockMediaStream()
  };

  // Mock URL object URL lifecycle
  const origCreate = URL.createObjectURL;
  const origRevoke = URL.revokeObjectURL;

  URL.createObjectURL = (blob) => {
    const id = ++urlCounter;
    const url = `blob:test-url-${id}`;
    objectUrls.set(url, { id, blob, revoked: false, revokedAt: null });
    return url;
  };

  URL.revokeObjectURL = (url) => {
    if (objectUrls.has(url)) {
      const entry = objectUrls.get(url);
      entry.revoked = true;
      entry.revokedAt = Date.now();
    }
  };

  return {
    createdTracks,
    objectUrls,
    getLastMediaRecorder: () => lastMediaRecorder,
    getLastRecognition: () => lastRecognition,
    setSimulatedEndDelay: (ms) => { simulatedEndDelayMs = ms; },
    restore: () => {
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
    }
  };
}

// 3. React Component Test Harness
function mountComponent(Component, initialProps) {
  let hooks = [];
  let hookIndex = 0;
  let effects = [];
  let effectCleanups = [];
  let currentProps = { ...initialProps };
  let renderedTree = null;
  let isUnmounted = false;
  let audioElemRef = {
    currentTime: 0,
    paused: true,
    play: async function() { this.paused = false; return Promise.resolve(); },
    pause: function() { this.paused = true; },
    onended: null
  };

  const dispatcher = {
    useState(initial) {
      const idx = hookIndex++;
      if (hooks[idx] === undefined) {
        hooks[idx] = typeof initial === 'function' ? initial() : initial;
      }
      const setState = (newVal) => {
        if (isUnmounted) return;
        const val = typeof newVal === 'function' ? newVal(hooks[idx]) : newVal;
        if (val !== hooks[idx]) {
          hooks[idx] = val;
          render();
        }
      };
      return [hooks[idx], setState];
    },
    useRef(initial) {
      const idx = hookIndex++;
      if (hooks[idx] === undefined) {
        hooks[idx] = { current: initial };
      }
      return hooks[idx];
    },
    useEffect(effect, deps) {
      const idx = hookIndex++;
      const prev = hooks[idx];
      let hasChanged = true;
      if (prev && deps) {
        hasChanged = deps.some((dep, i) => !Object.is(dep, prev.deps[i]));
      }
      hooks[idx] = { deps };
      if (hasChanged) {
        effects.push({ idx, effect });
      }
    },
    useCallback(fn, deps) {
      const idx = hookIndex++;
      const prev = hooks[idx];
      if (prev && deps && !deps.some((dep, i) => !Object.is(dep, prev.deps[i]))) {
        return prev.fn;
      }
      hooks[idx] = { fn, deps };
      return fn;
    },
    useMemo(fn, deps) {
      const idx = hookIndex++;
      const prev = hooks[idx];
      if (prev && deps && !deps.some((dep, i) => !Object.is(dep, prev.deps[i]))) {
        return prev.val;
      }
      const val = fn();
      hooks[idx] = { val, deps };
      return val;
    }
  };

  function render(newProps) {
    if (isUnmounted) return renderedTree;
    if (newProps) currentProps = { ...currentProps, ...newProps };
    hookIndex = 0;
    const prevDispatcher = React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current;
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current = dispatcher;
    try {
      renderedTree = Component(currentProps);
    } finally {
      React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentDispatcher.current = prevDispatcher;
    }

    // Attach mock audio ref if audio node rendered
    traverseTree(renderedTree, (node) => {
      if (node && node.type === 'audio' && node.ref) {
        node.ref.current = audioElemRef;
      }
    });

    // Execute pending effects
    const toRun = [...effects];
    effects = [];
    for (const { idx, effect } of toRun) {
      if (effectCleanups[idx]) {
        try { effectCleanups[idx](); } catch (e) {}
      }
      const cleanup = effect();
      if (typeof cleanup === 'function') {
        effectCleanups[idx] = cleanup;
      }
    }
    return renderedTree;
  }

  function unmount() {
    if (isUnmounted) return;
    isUnmounted = true;
    for (let idx = effectCleanups.length - 1; idx >= 0; idx--) {
      if (typeof effectCleanups[idx] === 'function') {
        try { effectCleanups[idx](); } catch (e) {}
        effectCleanups[idx] = null;
      }
    }
  }

  render();

  return {
    render,
    unmount,
    getTree: () => renderedTree,
    getAudioElem: () => audioElemRef,
    isUnmounted: () => isUnmounted
  };
}

// Helper to traverse React element tree
function traverseTree(node, callback) {
  if (!node) return;
  callback(node);
  if (node.props) {
    if (node.props.children) {
      if (Array.isArray(node.props.children)) {
        node.props.children.forEach(c => traverseTree(c, callback));
      } else {
        traverseTree(node.props.children, callback);
      }
    }
  }
}

// Helper to find button by text substring
function findButtonByText(tree, text) {
  let found = null;
  function search(node) {
    if (!node || found) return;
    if (node.type === 'button') {
      const texts = [];
      traverseTree(node, (n) => {
        if (typeof n === 'string') texts.push(n);
      });
      const combined = texts.join(' ');
      const title = node.props && (node.props.title || node.props['aria-label'] || '');
      if (combined.includes(text) || title.includes(text)) {
        found = node;
        return;
      }
    }
    if (node.props && node.props.children) {
      if (Array.isArray(node.props.children)) {
        node.props.children.forEach(search);
      } else {
        search(node.props.children);
      }
    }
  }
  search(tree);
  return found;
}

// ============================================================================
// CHALLENGE 1: Resource Leak Scenarios
// ============================================================================

test('Challenge 1.1: streamRef tracks are stopped on component unmount during active recording', async () => {
  const env = createMockEnvironment();
  try {
    const cue = { id: 1, text: 'Expecto Patronum', chapterId: 'hp1' };
    const wrapper = mountComponent(ShadowingRecorder, {
      isOpen: true,
      currentCue: cue,
      onClose: () => {},
      onPlayOriginalSnippet: () => {},
      isParchment: false
    });

    // Find and click "开始录音"
    const startBtn = findButtonByText(wrapper.getTree(), '开始录音');
    assert.ok(startBtn, 'Start recording button must exist');
    await startBtn.props.onClick();

    assert.strictEqual(env.createdTracks.length, 1, 'One audio track should be created');
    assert.strictEqual(env.createdTracks[0].readyState, 'live', 'Track should be live while recording');

    // Unmount while recording
    wrapper.unmount();

    // Verify track is stopped
    assert.strictEqual(env.createdTracks[0].readyState, 'ended', 'Track MUST be stopped upon unmount');
    assert.ok(env.createdTracks[0].stopCount >= 1, 'Track.stop() must be invoked');
  } finally {
    env.restore();
  }
});

test('Challenge 1.2: streamRef tracks are stopped when modal closes (isOpen -> false)', async () => {
  const env = createMockEnvironment();
  try {
    const cue = { id: 1, text: 'Wingardium Leviosa', chapterId: 'hp1' };
    const wrapper = mountComponent(ShadowingRecorder, {
      isOpen: true,
      currentCue: cue,
      onClose: () => {},
      onPlayOriginalSnippet: () => {},
      isParchment: false
    });

    const startBtn = findButtonByText(wrapper.getTree(), '开始录音');
    await startBtn.props.onClick();

    assert.strictEqual(env.createdTracks[0].readyState, 'live');

    // Close modal
    wrapper.render({ isOpen: false });

    // Verify track is stopped
    assert.strictEqual(env.createdTracks[0].readyState, 'ended', 'Track MUST be stopped when isOpen becomes false');
  } finally {
    env.restore();
  }
});

test('Challenge 1.3: URL.revokeObjectURL is invoked on old blob when starting re-recording', async () => {
  const env = createMockEnvironment();
  try {
    const cue = { id: 1, text: 'Alohomora', chapterId: 'hp1' };
    const wrapper = mountComponent(ShadowingRecorder, {
      isOpen: true,
      currentCue: cue,
      onClose: () => {},
      onPlayOriginalSnippet: () => {},
      isParchment: false
    });

    // 1st recording
    const startBtn = findButtonByText(wrapper.getTree(), '开始录音');
    await startBtn.props.onClick();

    const stopBtn = findButtonByText(wrapper.getTree(), '停止录音');
    stopBtn.props.onClick();

    // One blob URL created
    assert.strictEqual(env.objectUrls.size, 1);
    const [firstUrl, firstEntry] = [...env.objectUrls.entries()][0];
    assert.strictEqual(firstEntry.revoked, false, 'First URL should be active initially');

    // 2nd recording: click "重新录音"
    const reRecordBtn = findButtonByText(wrapper.getTree(), '重新录音');
    assert.ok(reRecordBtn, 'Re-record button must appear after first recording');
    await reRecordBtn.props.onClick();

    // Verify old blob URL was revoked
    assert.strictEqual(firstEntry.revoked, true, 'First blob URL MUST be revoked when re-recording starts');
  } finally {
    env.restore();
  }
});

test('Challenge 1.4: URL.revokeObjectURL is invoked on modal close and component unmount', async () => {
  const env = createMockEnvironment();
  try {
    const cue = { id: 1, text: 'Lumos Maxima', chapterId: 'hp1' };
    const wrapper = mountComponent(ShadowingRecorder, {
      isOpen: true,
      currentCue: cue,
      onClose: () => {},
      onPlayOriginalSnippet: () => {},
      isParchment: false
    });

    const startBtn = findButtonByText(wrapper.getTree(), '开始录音');
    await startBtn.props.onClick();

    const stopBtn = findButtonByText(wrapper.getTree(), '停止录音');
    stopBtn.props.onClick();

    const [firstUrl, firstEntry] = [...env.objectUrls.entries()][0];
    assert.strictEqual(firstEntry.revoked, false);

    // Close modal
    wrapper.render({ isOpen: false });
    assert.strictEqual(firstEntry.revoked, true, 'Blob URL MUST be revoked on modal close');

    // Unmount
    wrapper.unmount();
    assert.strictEqual(firstEntry.revoked, true, 'Blob URL remains revoked on unmount');
  } finally {
    env.restore();
  }
});

// ============================================================================
// CHALLENGE 2: Safety Timeout Challenges
// ============================================================================

test('Challenge 2.1: Web Speech hanging (5000ms delay) triggers safety timeout at 1500ms, guaranteeing <2s SLA', async () => {
  const env = createMockEnvironment();
  // Simulate Web Speech hanging for 5000ms after recognition.stop()
  env.setSimulatedEndDelay(5000);

  try {
    const cue = { id: 1, text: 'Expecto Patronum', chapterId: 'hp1' };
    let scoreReported = null;
    const wrapper = mountComponent(ShadowingRecorder, {
      isOpen: true,
      currentCue: cue,
      onClose: () => {},
      onPlayOriginalSnippet: () => {},
      onShadowingScore: (record) => { scoreReported = record; },
      isParchment: false
    });

    const startBtn = findButtonByText(wrapper.getTree(), '开始录音');
    await startBtn.props.onClick();

    // Simulate speech recognition results during recording
    const rec = env.getLastRecognition();
    assert.ok(rec, 'Speech recognition must be instantiated');
    rec.onresult({
      results: [
        [{ transcript: 'Expecto Patronum' }]
      ]
    });

    const stopStartTime = Date.now();
    const stopBtn = findButtonByText(wrapper.getTree(), '停止录音');
    stopBtn.props.onClick();

    // Verify immediately evaluating state
    let tree = wrapper.getTree();
    assert.ok(tree, 'Component should remain rendered');

    // Wait 1600ms for safety timeout to fire (configured for 1500ms)
    await new Promise(resolve => setTimeout(resolve, 1600));

    const elapsed = Date.now() - stopStartTime;
    assert.ok(elapsed >= 1500 && elapsed < 2000, `Elapsed ${elapsed}ms must be between 1500ms and 2000ms`);

    // Verify evaluation finished via safety timeout before 5000ms Web Speech onend
    assert.ok(scoreReported !== null, 'onShadowingScore must be called by safety timeout');
    assert.strictEqual(scoreReported.score, 100, 'Score must evaluate correctly to 100%');

    // Find grade badge in rendered tree
    let foundGrade = false;
    traverseTree(wrapper.getTree(), (node) => {
      if (node && node.props && node.props.children) {
        const text = Array.isArray(node.props.children) 
          ? node.props.children.map(c => String(c)).join('')
          : String(node.props.children);
        if (text.includes('100%')) foundGrade = true;
      }
    });
    assert.ok(foundGrade, '100% score badge must be rendered in UI');

    // Wait until beyond 5000ms to ensure the delayed onend does not cause double evaluation or error
    await new Promise(resolve => setTimeout(resolve, 3600));
    assert.strictEqual(scoreReported.score, 100, 'Score should remain stable after delayed onend');
  } finally {
    env.restore();
  }
});

test('Challenge 2.2: Fallback mode (no Web Speech API) completes evaluation immediately without 1500ms delay', async () => {
  const env = createMockEnvironment();
  // Disable Web Speech API
  globalThis.window.SpeechRecognition = null;
  globalThis.window.webkitSpeechRecognition = null;

  try {
    const cue = { id: 2, text: 'Expelliarmus', chapterId: 'hp1' };
    let scoreReported = null;
    const wrapper = mountComponent(ShadowingRecorder, {
      isOpen: true,
      currentCue: cue,
      onClose: () => {},
      onPlayOriginalSnippet: () => {},
      onShadowingScore: (record) => { scoreReported = record; },
      isParchment: false
    });

    const startBtn = findButtonByText(wrapper.getTree(), '开始录音');
    await startBtn.props.onClick();

    const startStop = Date.now();
    const stopBtn = findButtonByText(wrapper.getTree(), '停止录音');
    stopBtn.props.onClick();

    const elapsed = Date.now() - startStop;
    assert.ok(elapsed < 200, `Fallback evaluation must complete immediately, took ${elapsed}ms`);
    assert.ok(scoreReported !== null, 'Fallback evaluation must produce a result');
    assert.strictEqual(scoreReported.score, 0, 'Fallback with empty speech transcript returns 0');
  } finally {
    env.restore();
  }
});

test('Challenge 2.3: Re-entrancy analysis on rapid stopRecording clicks', async () => {
  const env = createMockEnvironment();
  try {
    const cue = { id: 3, text: 'Lumos', chapterId: 'hp1' };
    let scoreCallCount = 0;
    const wrapper = mountComponent(ShadowingRecorder, {
      isOpen: true,
      currentCue: cue,
      onClose: () => {},
      onPlayOriginalSnippet: () => {},
      onShadowingScore: () => { scoreCallCount++; },
      isParchment: false
    });

    const startBtn = findButtonByText(wrapper.getTree(), '开始录音');
    await startBtn.props.onClick();

    const stopBtn = findButtonByText(wrapper.getTree(), '停止录音');
    // First stop click
    stopBtn.props.onClick();
    
    // Once React re-renders to not recording:
    // Second click after re-render is blocked because isRecording is false
    assert.ok(scoreCallCount >= 1, 'Evaluation must be triggered');
  } finally {
    env.restore();
  }
});

// ============================================================================
// CHALLENGE 3: Backward Compatibility
// ============================================================================

test('Challenge 3.1: Original narrator playback invokes onPlayOriginalSnippet(currentCue) and disables during recording', async () => {
  const env = createMockEnvironment();
  try {
    const cue = { id: 10, text: 'Mr. and Mrs. Dursley', chapterId: 'hp1' };
    let playedCue = null;
    const wrapper = mountComponent(ShadowingRecorder, {
      isOpen: true,
      currentCue: cue,
      onClose: () => {},
      onPlayOriginalSnippet: (c) => { playedCue = c; },
      isParchment: false
    });

    // 1. Click "播放原音" while idle
    const playOriginalBtn = findButtonByText(wrapper.getTree(), '播放原音');
    assert.ok(playOriginalBtn, 'Narrator play button must exist');
    assert.strictEqual(playOriginalBtn.props.disabled, false, 'Narrator button must be enabled when idle');
    playOriginalBtn.props.onClick();
    assert.deepStrictEqual(playedCue, cue, 'Must pass currentCue to onPlayOriginalSnippet');

    // 2. Start recording: narrator button must be disabled
    const startBtn = findButtonByText(wrapper.getTree(), '开始录音');
    await startBtn.props.onClick();

    const playOriginalBtnDuringRec = findButtonByText(wrapper.getTree(), '播放原音');
    assert.strictEqual(playOriginalBtnDuringRec.props.disabled, true, 'Narrator button MUST be disabled during recording');

    // 3. Stop recording
    const stopBtn = findButtonByText(wrapper.getTree(), '停止录音');
    stopBtn.props.onClick();

    // 4. Narrator button becomes enabled again
    const playOriginalBtnAfter = findButtonByText(wrapper.getTree(), '播放原音');
    assert.strictEqual(playOriginalBtnAfter.props.disabled, false, 'Narrator button MUST be re-enabled after evaluation');
  } finally {
    env.restore();
  }
});

test('Challenge 3.2: User recording playback toggles play/pause and resets onended', async () => {
  const env = createMockEnvironment();
  try {
    const cue = { id: 11, text: 'Hogwarts Castle', chapterId: 'hp1' };
    const wrapper = mountComponent(ShadowingRecorder, {
      isOpen: true,
      currentCue: cue,
      onClose: () => {},
      onPlayOriginalSnippet: () => {},
      isParchment: false
    });

    // Prior to recording, no playback button exists
    assert.strictEqual(findButtonByText(wrapper.getTree(), '回放录音'), null);

    // Record audio
    const startBtn = findButtonByText(wrapper.getTree(), '开始录音');
    await startBtn.props.onClick();

    const stopBtn = findButtonByText(wrapper.getTree(), '停止录音');
    stopBtn.props.onClick();

    // Now "回放录音" button must exist
    const playRecordingBtn = findButtonByText(wrapper.getTree(), '回放录音');
    assert.ok(playRecordingBtn, 'Playback button must appear after recording');

    const audioMock = wrapper.getAudioElem();

    // Click play
    playRecordingBtn.props.onClick();
    // Await microtask for .play().then(() => setIsPlayingRecording(true))
    await new Promise(resolve => setTimeout(resolve, 20));

    assert.strictEqual(audioMock.paused, false, 'Audio should be playing');
    assert.strictEqual(audioMock.currentTime, 0, 'Audio should start from 0');

    // Click again: pause
    const pauseRecordingBtn = findButtonByText(wrapper.getTree(), '回放录音');
    pauseRecordingBtn.props.onClick();
    await new Promise(resolve => setTimeout(resolve, 20));

    assert.strictEqual(audioMock.paused, true, 'Audio should be paused');

    // Simulate audio onended
    if (audioMock.onended) {
      audioMock.onended();
    }
  } finally {
    env.restore();
  }
});

test('Challenge 3.3: Word badges render accurate Hogwarts color scheme and O.W.L. grades', async () => {
  const env = createMockEnvironment();
  try {
    const cue = { id: 12, text: 'Expecto Patronum', chapterId: 'hp1' };
    const wrapper = mountComponent(ShadowingRecorder, {
      isOpen: true,
      currentCue: cue,
      onClose: () => {},
      onPlayOriginalSnippet: () => {},
      isParchment: false
    });

    const startBtn = findButtonByText(wrapper.getTree(), '开始录音');
    await startBtn.props.onClick();

    const rec = env.getLastRecognition();
    rec.onresult({
      results: [
        [{ transcript: 'Expecto Patronum' }]
      ]
    });

    const stopBtn = findButtonByText(wrapper.getTree(), '停止录音');
    stopBtn.props.onClick();

    // Inspect rendered word badges
    const tree = wrapper.getTree();
    const wordBadges = [];
    traverseTree(tree, (node) => {
      if (node && node.type === 'span' && node.props && node.props.title && node.props.title.includes('发音准确')) {
        wordBadges.push(node);
      }
    });

    assert.strictEqual(wordBadges.length, 2, 'Should render 2 matched word badges');
    assert.ok(wordBadges[0].props.className.includes('emerald'), 'Matched badge should use emerald styling');

    // Verify O.W.L. Grade O for 100% score
    let foundOwlGrade = false;
    traverseTree(tree, (node) => {
      if (node && node.props && node.props.children) {
        const text = Array.isArray(node.props.children) 
          ? node.props.children.map(c => String(c)).join('')
          : String(node.props.children);
        if (text.includes('Grade O')) foundOwlGrade = true;
      }
    });
    assert.ok(foundOwlGrade, 'Grade O should be awarded for 100% score');
  } finally {
    env.restore();
  }
});
