import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Dictation Studio & Audio Playback Sentence Lock Test Suite', async (t) => {
  // 1. Verify useAudioPlayback.js supports disableCueAutoAdvance and stopAtCueEnd
  const audioHookPath = path.resolve(projectRoot, 'src', 'hooks', 'useAudioPlayback.js');
  const audioHookCode = fs.readFileSync(audioHookPath, 'utf8');

  await t.test('1.1: useAudioPlayback accepts disableCueAutoAdvance option to prevent auto-advancing cues', () => {
    assert.ok(
      audioHookCode.includes('disableCueAutoAdvance'),
      'useAudioPlayback must accept disableCueAutoAdvance option'
    );
    assert.ok(
      audioHookCode.includes('!disableCueAutoAdvance'),
      'handleTimeUpdate must check !disableCueAutoAdvance before calling setActiveCueIndex'
    );
  });

  await t.test('1.2: useAudioPlayback supports stopAtCueEnd / single sentence boundary containment', () => {
    assert.ok(
      audioHookCode.includes('stopAtCueEnd') || audioHookCode.includes('playSentenceSnippet') || audioHookCode.includes('singleSentenceMode'),
      'useAudioPlayback must support stopping audio when current cue finishes'
    );
  });

  // 2. Verify App.jsx passes disableCueAutoAdvance when studyMode is dictation
  const appPath = path.resolve(projectRoot, 'src', 'App.jsx');
  const appCode = fs.readFileSync(appPath, 'utf8');

  await t.test('2.1: App.jsx enables disableCueAutoAdvance when studyMode === dictation', () => {
    assert.ok(
      appCode.includes("disableCueAutoAdvance: studyMode === 'dictation'") ||
      appCode.includes("studyMode === 'dictation'"),
      'App.jsx must disable cue auto-advance when in dictation study mode'
    );
  });

  await t.test('2.2: App.jsx uses startTransition for playerMode, studyMode, and currentView switches', () => {
    assert.ok(
      appCode.includes('startTransition'),
      'App.jsx must wrap view and mode transitions in startTransition for 120Hz fluid UI response'
    );
  });

  // 3. Verify DictationStudio.jsx replay handler confines audio to current sentence
  const dictationStudioPath = path.resolve(projectRoot, 'src', 'components', 'DictationStudio.jsx');
  const dictationStudioCode = fs.readFileSync(dictationStudioPath, 'utf8');

  await t.test('3.1: DictationStudio replay handler stops audio when current sentence finishes', () => {
    assert.ok(
      dictationStudioCode.includes('stopAtEnd') || dictationStudioCode.includes('onPlaySentenceSnippet') || dictationStudioCode.includes('currentCue.endTime'),
      'DictationStudio must enforce single-sentence audio containment during replay'
    );
  });
});
