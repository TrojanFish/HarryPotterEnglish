import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;
const ASCII_ONLY_REGEX = /^[\x00-\x7F]*$/;

describe('Windows Quick Launcher Suite', () => {
  const launcherJs = path.join(rootDir, 'scripts/launcher.js');
  const launcherBat = path.join(rootDir, '启动器.bat');
  const webAppBat = path.join(rootDir, '启动主应用.bat');
  const whisperBat = path.join(rootDir, '启动转写工具.bat');

  test('scripts/launcher.js exists and implements robust launch modes', async () => {
    const content = await fs.readFile(launcherJs, 'utf-8');
    assert.ok(content.includes('http://localhost:3000'), 'Must reference Vite port 3000 from vite.config.js');
    assert.ok(content.includes('http://localhost:7860'), 'Must reference Gradio port 7860');
    assert.ok(content.includes('tools/whisper-studio/app.py') || content.includes('tools\\whisper-studio\\app.py'), 'Must reference whisper app');
    assert.ok(content.includes('runLauncher'), 'Must export or define runLauncher function');
    assert.ok(content.includes('findPythonCommand'), 'Must implement findPythonCommand');
    assert.equal(EMOJI_REGEX.test(content), false, 'Must contain zero Unicode emojis');
  });

  test('scripts/launcher.js findPythonCommand dynamically finds python with gradio', async () => {
    const { findPythonCommand } = await import(pathToFileURL(launcherJs).href);
    assert.equal(typeof findPythonCommand, 'function', 'findPythonCommand must be a function');
    const pythonCmd = findPythonCommand();
    assert.ok(pythonCmd && typeof pythonCmd === 'string', 'Must return a valid python command string');
    assert.ok(pythonCmd.length > 0, 'Python command must not be empty');
  });

  test('启动器.bat is pure ASCII wrapper to avoid CMD CP936 encoding bugs', async () => {
    const content = await fs.readFile(launcherBat, 'utf-8');
    assert.ok(ASCII_ONLY_REGEX.test(content), '启动器.bat must be pure ASCII to prevent Windows CMD fseek offset glitches');
    assert.ok(content.includes('cd /d "%~dp0"') || content.includes('cd /d %~dp0'), 'Must navigate to script directory');
    assert.ok(content.includes('node scripts/launcher.js'), 'Must invoke scripts/launcher.js');
    assert.equal(EMOJI_REGEX.test(content), false, 'Must contain zero Unicode emojis');
  });

  test('启动主应用.bat is pure ASCII wrapper calling web mode', async () => {
    const content = await fs.readFile(webAppBat, 'utf-8');
    assert.ok(ASCII_ONLY_REGEX.test(content), '启动主应用.bat must be pure ASCII');
    assert.ok(content.includes('cd /d "%~dp0"') || content.includes('cd /d %~dp0'), 'Must navigate to script directory');
    assert.ok(content.includes('node scripts/launcher.js web'), 'Must invoke launcher in web mode');
    assert.equal(EMOJI_REGEX.test(content), false, 'Must contain zero Unicode emojis');
  });

  test('启动转写工具.bat is pure ASCII wrapper calling whisper mode', async () => {
    const content = await fs.readFile(whisperBat, 'utf-8');
    assert.ok(ASCII_ONLY_REGEX.test(content), '启动转写工具.bat must be pure ASCII');
    assert.ok(content.includes('cd /d "%~dp0"') || content.includes('cd /d %~dp0'), 'Must navigate to script directory');
    assert.ok(content.includes('node scripts/launcher.js whisper'), 'Must invoke launcher in whisper mode');
    assert.equal(EMOJI_REGEX.test(content), false, 'Must contain zero Unicode emojis');
  });
});
