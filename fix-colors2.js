const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/app');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/var\(--color-surface-warm\)/g, 'var(--color-surface-soft)');
  content = content.replace(/bg-\[\#E8D5C4\]/g, 'bg-[var(--color-surface-soft)]');
  content = content.replace(/bg-amber-100/g, 'bg-[var(--color-secondary)]/10');
  content = content.replace(/text-amber-500/g, 'text-[var(--color-secondary)]');
  content = content.replace(/bg-amber-400/g, 'bg-[var(--color-secondary)]');
  content = content.replace(/text-amber-400\/80/g, 'text-[var(--color-secondary)]/80');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed additional ones', file);
  }
});
