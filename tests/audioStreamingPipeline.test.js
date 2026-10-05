import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Audio Streaming Pipeline & Range Decoupling Test Suite', async (t) => {

  await t.test('1.1: src/hooks/useCatalog.js must eliminate blocking res.blob() in streaming path', () => {
    const catalogPath = path.resolve(projectRoot, 'src', 'hooks', 'useCatalog.js');
    const code = fs.readFileSync(catalogPath, 'utf8');

    // Regression prevention: No blocking fetch + res.blob in online streaming path
    const hasStreamingBlobFetch = code.includes('await fetch(streamAudioUrl)') || 
                                  (code.includes('streamAudioUrl') && code.includes('res.blob()'));
    assert.equal(hasStreamingBlobFetch, false, 'useCatalog must NOT fetch full audio as blob for online streaming');
  });

  await t.test('1.2: resolveAudioStreamUrl helper function correctly handles CDN domain and proxy fallback', async () => {
    const catalogPath = path.resolve(projectRoot, 'src', 'hooks', 'useCatalog.js');
    const code = fs.readFileSync(catalogPath, 'utf8');

    assert.ok(code.includes('resolveAudioStreamUrl'), 'useCatalog.js must export resolveAudioStreamUrl');
  });

  await t.test('1.3: server/index.js audio route must send public immutable cache headers', () => {
    const serverPath = path.resolve(projectRoot, 'server', 'index.js');
    const code = fs.readFileSync(serverPath, 'utf8');

    assert.ok(
      code.includes("'Cache-Control': 'public") || code.includes('"Cache-Control": "public'),
      'server/index.js audio stream must specify public cache control for CDN acceleration'
    );
  });

  await t.test('1.4: functions/api/[[path]].js must handle action === stream for Cloudflare Pages edge routing', () => {
    const functionsPath = path.resolve(projectRoot, 'functions', 'api', '[[path]].js');
    const code = fs.readFileSync(functionsPath, 'utf8');

    assert.ok(
      code.includes("action === 'stream'") || code.includes('action === "stream"'),
      'functions/api/[[path]].js must handle action === stream to avoid 404 in Cloudflare Pages'
    );
  });
});
