import fs from 'fs';
import path from 'path';

const ignoreDirs = ['node_modules', '.git', '.gemini', 'dist', '.superpowers'];

function scan(dir) {
  let findings = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findings = findings.concat(scan(fullPath));
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.js', '.jsx', '.html', '.css', '.json', '.svg'].includes(ext)) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          // Check for any emoji character using Unicode property escape
          const emojiMatches = line.match(/\p{Extended_Pictographic}/gu);
          if (emojiMatches) {
            findings.push({
              file: fullPath,
              line: idx + 1,
              chars: emojiMatches.join(' '),
              text: line.trim()
            });
          }
        });
      }
    }
  }
  return findings;
}

const results = scan('.');
console.log('Results using Extended_Pictographic:');
results.forEach(r => {
  console.log(`${r.file}:${r.line} [${r.chars}] ${r.text}`);
});
console.log('Total findings: ' + results.length);
