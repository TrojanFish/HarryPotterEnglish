#!/usr/bin/env node
import { spawn, exec, execSync } from 'node:child_process';
import readline from 'node:readline';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const WEB_PORT = 3000;
const WHISPER_PORT = 7860;
const WEB_URL = 'http://localhost:3000';
const WHISPER_URL = 'http://localhost:7860';

let cachedPythonCmd = null;

export function findPythonCommand() {
  if (cachedPythonCmd) return cachedPythonCmd;

  if (process.env.PYTHON_PATH) {
    try {
      execSync(`"${process.env.PYTHON_PATH}" -c "import gradio"`, { stdio: 'ignore', timeout: 3000 });
      cachedPythonCmd = `"${process.env.PYTHON_PATH}"`;
      return cachedPythonCmd;
    } catch {}
  }

  const candidates = [
    'py -3.10',
    'python',
    'python3',
    'py -3.11',
    'py -3.12',
    'py -3',
    'C:\\Users\\KeiyeeYu\\AppData\\Local\\Programs\\Python\\Python310\\python.exe'
  ];

  for (const cmd of candidates) {
    try {
      execSync(`${cmd} -c "import gradio"`, { stdio: 'ignore', timeout: 3000 });
      cachedPythonCmd = cmd;
      return cachedPythonCmd;
    } catch {}
  }

  for (const cmd of candidates) {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore', timeout: 2000 });
      cachedPythonCmd = cmd;
      return cachedPythonCmd;
    } catch {}
  }

  cachedPythonCmd = 'python';
  return cachedPythonCmd;
}

function openBrowser(url) {
  const isWindows = process.platform === 'win32';
  const isMac = process.platform === 'darwin';
  if (isWindows) {
    exec(`start "" "${url}"`);
  } else if (isMac) {
    exec(`open "${url}"`);
  } else {
    exec(`xdg-open "${url}"`);
  }
}

function launchProcess(command, args = [], options = {}) {
  const fullCommand = [command, ...args].join(' ');
  const child = spawn(fullCommand, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
    ...options
  });
  return child;
}

export function startWebApp() {
  console.log('[INFO] 正在启动 Hogwarts Audio 学习平台 (Web App)...');
  console.log(`[INFO] 正在启动 Vite 开发服务，稍后将自动打开 ${WEB_URL}`);
  setTimeout(() => openBrowser(WEB_URL), 2000);
  return launchProcess('npm', ['run', 'dev']);
}

export function startWhisperStudio() {
  console.log('[INFO] 正在启动 Whisper 智能转写工作台 (Gradio UI)...');
  const pythonCmd = findPythonCommand();
  console.log(`[INFO] 检测到兼容的 Python 环境: ${pythonCmd}`);
  console.log(`[INFO] 正在启动 Python 服务，稍后将自动打开 ${WHISPER_URL}`);
  setTimeout(() => openBrowser(WHISPER_URL), 2000);
  return launchProcess(pythonCmd, ['tools/whisper-studio/app.py']);
}

export function startBoth() {
  console.log('[INFO] 正在同时启动 Web 主应用与 Whisper 转写工作台...');
  const pythonCmd = findPythonCommand();
  console.log(`[INFO] 检测到兼容的 Python 环境: ${pythonCmd}`);
  setTimeout(() => {
    openBrowser(WEB_URL);
    openBrowser(WHISPER_URL);
  }, 2500);

  const web = launchProcess('npm', ['run', 'dev']);
  const whisper = launchProcess(pythonCmd, ['tools/whisper-studio/app.py']);

  const onExit = () => {
    try { web.kill(); } catch {}
    try { whisper.kill(); } catch {}
    process.exit(0);
  };

  process.on('SIGINT', onExit);
  process.on('SIGTERM', onExit);
}

export function runCliTranscribe(args = []) {
  const pythonCmd = findPythonCommand();
  console.log(`[INFO] 检测到兼容的 Python 环境: ${pythonCmd}`);
  return launchProcess(pythonCmd, ['tools/whisper-studio/cli.py', ...args]);
}

export function syncR2() {
  console.log('[INFO] 正在执行增量 R2 内容同步...');
  const child = launchProcess('npm', ['run', 'content:sync']);
  child.on('close', (code) => {
    console.log(`[INFO] 同步完成，退出码: ${code}`);
  });
}

export function buildFeed() {
  console.log('[INFO] 正在重新编译本地 content/ 目录清单...');
  const child = launchProcess('npm', ['run', 'content:build']);
  child.on('close', (code) => {
    console.log(`[INFO] 编译完成，退出码: ${code}`);
  });
}

export function showMenu() {
  console.clear();
  console.log('============================================================');
  console.log('          Hogwarts Audio 本地开发与工具控制中心');
  console.log('============================================================');
  console.log('');
  console.log('  [1] 启动 Hogwarts Audio 主应用 (Web 前端学习平台)');
  console.log('  [2] 启动 Whisper 智能转写工作台 (Gradio 可视化界面)');
  console.log('  [3] 同时启动两者 (主应用 + 转写工作台)');
  console.log('  [4] 增量同步内容至 Cloudflare R2 (npm run content:sync)');
  console.log('  [5] 重新编译本地内容清单 (npm run content:build)');
  console.log('  [0] 退出控制中心');
  console.log('');
  console.log('============================================================');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('请输入选项编号 [0-5]: ', (answer) => {
    rl.close();
    const choice = answer.trim();
    switch (choice) {
      case '1':
        startWebApp();
        break;
      case '2':
        startWhisperStudio();
        break;
      case '3':
        startBoth();
        break;
      case '4':
        syncR2();
        break;
      case '5':
        buildFeed();
        break;
      case '0':
        console.log('[INFO] 已退出控制中心。');
        process.exit(0);
        break;
      default:
        console.log('[ERROR] 无效输入，请重新输入...');
        setTimeout(showMenu, 1500);
        break;
    }
  });
}

export function runLauncher(arg = process.argv[2], extraArgs = process.argv.slice(3)) {
  switch (arg) {
    case 'web':
      startWebApp();
      break;
    case 'whisper':
      startWhisperStudio();
      break;
    case 'transcribe':
      runCliTranscribe(extraArgs);
      break;
    case 'all':
    case 'both':
      startBoth();
      break;
    case 'sync':
      syncR2();
      break;
    case 'build':
      buildFeed();
      break;
    default:
      showMenu();
      break;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  runLauncher();
}
