/**
 * Module loader for Hogwarts Audio E2E Test Suite.
 * Loads either real implementation in src/utils or reference oracle based on environment.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const isOracleMode = process.env.USE_ORACLE === '1';

export async function loadModule(moduleName, milestoneTag) {
  const srcPath = path.resolve(projectRoot, 'src', 'utils', `${moduleName}.js`);
  const oraclePath = path.resolve(__dirname, 'oracles', `${moduleName}Oracle.js`);

  if (isOracleMode) {
    if (fs.existsSync(oraclePath)) {
      return await import(`./oracles/${moduleName}Oracle.js`);
    }
  }

  if (fs.existsSync(srcPath)) {
    return await import(`../src/utils/${moduleName}.js`);
  }

  // If src file does not exist yet and oracle mode is not explicitly requested
  if (fs.existsSync(oraclePath)) {
    // If running in development before worker creates file, provide fallback or fail
    if (process.env.ALLOW_ORACLE_FALLBACK === '1') {
      return await import(`./oracles/${moduleName}Oracle.js`);
    }
  }

  throw new Error(`[${milestoneTag} Pending] Missing implementation file: src/utils/${moduleName}.js`);
}

export async function getSpeechScoring() {
  return await loadModule('speechScoring', 'M1-R1');
}

export async function getAnalyticsStore() {
  return await loadModule('analyticsStore', 'M2-R2');
}

export async function getAnkiExport() {
  // Production Anki functionality has been completely uninstalled per user request.
  // Historical E2E suite runs against test oracle.
  return await import('./oracles/ankiExportOracle.js');
}

export async function getOfflineStorage() {
  return await loadModule('offlineStorage', 'M4-R4');
}
