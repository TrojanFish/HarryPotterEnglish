import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

const srcDir = path.resolve('src');
let changedFiles = 0;
let totalReplacements = 0;

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('#eee5d8')) {
      const occurrences = (content.match(/#eee5d8/g) || []).length;
      const updated = content.replaceAll('#eee5d8', '#e8ddd0');
      fs.writeFileSync(filePath, updated, 'utf8');
      changedFiles++;
      totalReplacements += occurrences;
      console.log(`Updated ${path.relative(process.cwd(), filePath)} (${occurrences} replacements)`);
    }
  }
});

console.log(`\nDone! Successfully updated ${totalReplacements} occurrences across ${changedFiles} files with safe UTF-8.`);
