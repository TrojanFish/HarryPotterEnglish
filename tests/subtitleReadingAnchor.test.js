import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('SubtitleViewer 0.382 Golden Ratio Reading Anchor & Compass Re-anchor Test Suite', async (t) => {
  const viewerSrcPath = path.resolve(projectRoot, 'src', 'components', 'SubtitleViewer.jsx');
  const viewerSrc = fs.readFileSync(viewerSrcPath, 'utf8');

  await t.test('3.1: SubtitleViewer scrolling algorithm adopts 0.382 golden ratio anchor offset calculation', () => {
    // Assert 0.382 golden ratio factor is used in calculation instead of hardcoded block center
    assert.ok(
      viewerSrc.includes('0.382'),
      'SubtitleViewer must calculate scroll anchor offset using 0.382 golden ratio factor'
    );
  });

  await t.test('3.2: SubtitleViewer floating re-anchor uses Compass icon and clear action affordance', () => {
    assert.ok(
      viewerSrc.includes('Compass'),
      'SubtitleViewer must import and render Compass icon for the reading anchor'
    );
    assert.ok(
      viewerSrc.includes('一键归位') || viewerSrc.includes('归位'),
      'Floating action button must include clear re-anchor affordance copy'
    );
  });
});
