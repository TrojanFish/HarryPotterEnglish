import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

console.log('[Security Audit] Scanning production build for credential leaks & security hazards...');

if (!fs.existsSync(distDir)) {
  console.error('[Security Audit ERROR] dist/ directory not found. Please run `npm run build` first.');
  process.exit(1);
}

// Patterns of sensitive secrets and private environment variables that must NEVER be in client bundle
const SENSITIVE_PATTERNS = [
  /R2_SECRET_ACCESS_KEY/i,
  /R2_ACCESS_KEY_ID/i,
  /AWS_SECRET_ACCESS_KEY/i,
  /secretAccessKey\s*[:=]/i,
  /AI_GATEWAY_TOKEN/i,
  /DEEPSEEK_API_KEY/i,
  /CLOUDFLARE_API_KEY/i,
  /PRIVATE_KEY/i,
  /BEGIN RSA PRIVATE KEY/i,
  /BEGIN PRIVATE KEY/i,
];

let hasViolations = false;
let scannedFilesCount = 0;

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (/\.(js|html|json|map)$/i.test(entry.name)) {
      scannedFilesCount++;
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of SENSITIVE_PATTERNS) {
        if (pattern.test(content)) {
          console.error(`[SECURITY LEAK DETECTED] File "${path.relative(distDir, fullPath)}" matches forbidden pattern: ${pattern}`);
          hasViolations = true;
        }
      }
    }
  }
}

scanDirectory(distDir);

if (hasViolations) {
  console.error(`[Security Audit FAILED] Sensitive credentials detected in client bundle! Deployment halted.`);
  process.exit(1);
} else {
  console.log(`[Security Audit PASSED] Scanned ${scannedFilesCount} client distribution files. Zero credential leaks found!`);
  process.exit(0);
}
