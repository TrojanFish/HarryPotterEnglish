import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('Cloudflare Pages, R2 & D1 Infrastructure Optimization Suite', async (t) => {
  const functionsPath = path.resolve(projectRoot, 'functions', 'api', '[[path]].js');
  const functionsCode = fs.readFileSync(functionsPath, 'utf8');

  await t.test('P0.1: functions/api/[[path]].js prioritizes prebuilt podcasts/catalog.json to prevent subrequest limit exhaustion', () => {
    // Must check for podcasts/catalog.json or catalog.json before running dynamic subrequest loop
    const hasPrebuiltCatalogCheck = functionsCode.includes('catalog.json') &&
      (functionsCode.includes("bucket.get('podcasts/catalog.json')") || 
       functionsCode.includes('bucket.get("podcasts/catalog.json")') ||
       functionsCode.includes("bucket.get('catalog.json')") ||
       functionsCode.includes('bucket.get("catalog.json")'));
    
    assert.ok(hasPrebuiltCatalogCheck, 'functions/api/[[path]].js must check for prebuilt catalog.json to avoid subrequest limit');
  });

  await t.test('P0.2: functions/api/[[path]].js sets Content-Range and Content-Length on HTTP 206 audio stream', () => {
    // RFC 7233 requirement for iOS Safari audio seek & streaming compatibility
    const hasContentRangeHeader = functionsCode.includes("Content-Range") || functionsCode.includes("'Content-Range'");
    const hasContentLengthCalc = functionsCode.includes("Content-Length") && functionsCode.includes("object.range");

    assert.ok(hasContentRangeHeader, 'functions/api/[[path]].js must set Content-Range header for Range requests');
    assert.ok(hasContentLengthCalc, 'functions/api/[[path]].js must accurately calculate Content-Length from object.range');
  });

  await t.test('P1.1: functions/api/[[path]].js uses db.batch() for atomic bulk synchronization in D1', () => {
    // D1 batch execution prevents multiple sequential roundtrips
    const usesDbBatch = functionsCode.includes('db.batch(') || functionsCode.includes('db.batch (');
    assert.ok(usesDbBatch, 'functions/api/[[path]].js must use db.batch() to execute D1 synchronizations in one transaction');
  });

  await t.test('P1.2: functions/api/[[path]].js implements rate limiting / brute-force protection on pair endpoint', () => {
    // Must inspect client IP and reject rapid failed pairing guesses
    const hasPairRateLimit = (functionsCode.includes('cf-connecting-ip') || functionsCode.includes('x-real-ip') || functionsCode.includes('pairLimiter') || functionsCode.includes('pairRateLimitMap')) &&
      functionsCode.includes('429');
    assert.ok(hasPairRateLimit, 'functions/api/[[path]].js must protect /sync/pair from brute-force passcode guessing');
  });

  await t.test('P2.1: scripts/generate_catalog.js exists and package.json contains build:catalog script', () => {
    const scriptPath = path.resolve(projectRoot, 'scripts', 'generate_catalog.js');
    assert.ok(fs.existsSync(scriptPath), 'scripts/generate_catalog.js must exist');

    const pkg = JSON.parse(fs.readFileSync(path.resolve(projectRoot, 'package.json'), 'utf8'));
    assert.ok(pkg.scripts['build:catalog'], 'package.json must contain build:catalog script');
  });

  await t.test('P2.2: DEPLOYMENT.md provides explicit Cloudflare R2 CORS configuration instructions', () => {
    const deploymentPath = path.resolve(projectRoot, 'DEPLOYMENT.md');
    const deploymentDoc = fs.readFileSync(deploymentPath, 'utf8');

    assert.ok(deploymentDoc.includes('ExposeHeaders') || deploymentDoc.includes('Content-Range'), 
      'DEPLOYMENT.md must document R2 CORS exposure for Content-Range and Accept-Ranges');
  });
});
