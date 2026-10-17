import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;

describe('Windows Quick Launcher Batch Scripts', () => {
  const launcherBat = path.join(rootDir, '启动器.bat');
  const webAppBat = path.join(rootDir, '启动主应用.bat');
  const whisperBat = path.join(rootDir, '启动转写工具.bat');

  test('启动器.bat exists and contains valid menu options and UTF-8 setting', async () => {
    const content = await fs.readFile(launcherBat, 'utf-8');
    assert.ok(content.includes('chcp 65001'), 'Must specify UTF-8 codepage 65001');
    assert.ok(content.includes('cd /d "%~dp0"') || content.includes('cd /d %~dp0'), 'Must navigate to script directory');
    assert.ok(content.includes('npm run dev'), 'Must support starting dev web app');
    assert.ok(content.includes('tools/whisper-studio/app.py') || content.includes('tools\\whisper-studio\\app.py'), 'Must support starting Whisper Studio');
    assert.ok(content.includes('http://localhost:5173'), 'Must reference web port 5173');
    assert.ok(content.includes('http://localhost:7860'), 'Must reference Gradio port 7860');
    assert.equal(EMOJI_REGEX.test(content), false, 'Must contain zero Unicode emojis');
  });

  test('启动主应用.bat exists and runs dev server with browser launch', async () => {
    const content = await fs.readFile(webAppBat, 'utf-8');
    assert.ok(content.includes('chcp 65001'), 'Must specify UTF-8 codepage 65001');
    assert.ok(content.includes('cd /d "%~dp0"') || content.includes('cd /d %~dp0'), 'Must navigate to script directory');
    assert.ok(content.includes('npm run dev'), 'Must run npm run dev');
    assert.ok(content.includes('http://localhost:5173'), 'Must open port 5173');
    assert.equal(EMOJI_REGEX.test(content), false, 'Must contain zero Unicode emojis');
  });

  test('启动转写工具.bat exists and runs Whisper Studio with browser launch', async () => {
    const content = await fs.readFile(whisperBat, 'utf-8');
    assert.ok(content.includes('chcp 65001'), 'Must specify UTF-8 codepage 65001');
    assert.ok(content.includes('cd /d "%~dp0"') || content.includes('cd /d %~dp0'), 'Must navigate to script directory');
    assert.ok(content.includes('tools/whisper-studio/app.py') || content.includes('tools\\whisper-studio\\app.py'), 'Must run whisper app.py');
    assert.ok(content.includes('http://localhost:7860'), 'Must open port 7860');
    assert.equal(EMOJI_REGEX.test(content), false, 'Must contain zero Unicode emojis');
  });
});
