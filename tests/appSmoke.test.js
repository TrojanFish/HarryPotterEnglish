import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

test('App.jsx Integrity & Hook Binding Smoke Test', async (t) => {
  const appPath = path.resolve(projectRoot, 'src', 'App.jsx');
  assert.ok(fs.existsSync(appPath), 'src/App.jsx must exist');

  const appCode = fs.readFileSync(appPath, 'utf8');

  await t.test('1.1: All React hooks used in App.jsx are explicitly imported', () => {
    // Extract imports from react
    const reactImportMatch = appCode.match(/import\s+(?:React,\s*)?\{([^}]+)\}\s+from\s+['"]react['"]/);
    assert.ok(reactImportMatch, 'Must have named imports from react in App.jsx');

    const importedHooks = reactImportMatch[1].split(',').map(s => s.trim());

    // Check all standard hook usages
    const hookNames = ['useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useTransition'];
    for (const hook of hookNames) {
      const hookRegex = new RegExp(`\\b${hook}\\s*\\(`, 'g');
      if (hookRegex.test(appCode)) {
        assert.ok(
          importedHooks.includes(hook),
          `Hook "${hook}" is used in App.jsx but not imported in "from 'react'"`
        );
      }
    }
  });

  await t.test('1.2: No undefined hook references in App.jsx', () => {
    // Assert useMemo specifically
    assert.ok(appCode.includes('useMemo'), 'App.jsx uses useMemo for chapter-scoped bookmarks');
    const importLine = appCode.split('\n')[0];
    assert.ok(importLine.includes('useMemo'), 'First import line must explicitly include useMemo');
  });
});
