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

  await t.test('1.3: DesktopSidebar and TabletRail receive playerMode and onSwitchPlayerMode props', () => {
    assert.ok(appCode.includes('playerMode={playerMode}'), 'Must pass playerMode to sidebars');
    assert.ok(appCode.includes('onSwitchPlayerMode={handleSwitchPlayerMode}'), 'Must pass onSwitchPlayerMode to sidebars');
  });

  await t.test('1.4: App wires playerMode properly to ReaderTopBar and dual study engines', () => {
    assert.ok(appCode.includes("playerMode === 'podcast'"), 'Must conditionally switch between podcast and studio engines');
    assert.ok(appCode.includes('onSwitchPlayerMode={handleSwitchPlayerMode}'), 'Must pass handleSwitchPlayerMode to ReaderTopBar');
  });

  await t.test('1.5: All custom hooks in src/hooks have all React hooks explicitly imported', () => {
    const hooksDir = path.resolve(projectRoot, 'src', 'hooks');
    const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.js'));
    const reactHooks = ['useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useTransition', 'useReducer'];

    for (const file of hookFiles) {
      const code = fs.readFileSync(path.join(hooksDir, file), 'utf8');
      const lines = code.split('\n');
      for (const rHook of reactHooks) {
        let isUsed = false;
        let isImported = false;
        lines.forEach(line => {
          if (line.includes('import ') && line.includes(rHook)) {
            isImported = true;
          } else if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            if (new RegExp(`(?<!React\\.)\\b${rHook}\\b`).test(line)) {
              isUsed = true;
            }
          }
        });
        if (isUsed) {
          assert.ok(
            isImported,
            `File src/hooks/${file} uses ${rHook} but does not import it from 'react'`
          );
        }
      }
    }
  });

  await t.test('1.6: All React components in src/components have all React hooks explicitly imported', () => {
    const compDir = path.resolve(projectRoot, 'src', 'components');
    function walkDir(dir) {
      let results = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          results = results.concat(walkDir(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js'))) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const compFiles = walkDir(compDir);
    const reactHooks = ['useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useTransition', 'useReducer'];

    for (const filePath of compFiles) {
      const code = fs.readFileSync(filePath, 'utf8');
      const lines = code.split('\n');
      for (const rHook of reactHooks) {
        let isUsed = false;
        let isImported = false;
        lines.forEach(line => {
          if (line.includes('import ') && line.includes(rHook)) {
            isImported = true;
          } else if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            if (new RegExp(`(?<!React\\.)\\b${rHook}\\b`).test(line)) {
              isUsed = true;
            }
          }
        });
        if (isUsed) {
          const relPath = path.relative(projectRoot, filePath);
          assert.ok(
            isImported,
            `Component ${relPath} uses ${rHook} but does not import it from 'react'`
          );
        }
      }
    }
  });
});

