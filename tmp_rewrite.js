const fs = require('fs');
const path = require('path');

const TARGET_DIR = path.join(__dirname, 'src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

function rewriteFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Text Wrapping for Japanese Headers
  content = content.replace(/<(h1|h2|h3|h4)([^>]*)className="([^"]*)"([^>]*)>/g, (match, tag, before, cls, after) => {
    if (!cls.includes('break-keep')) cls += ' break-keep';
    if (!cls.includes('text-balance')) cls += ' text-balance';
    return `<${tag}${before}className="${cls}"${after}>`;
  });

  // 2. Safe Color replacements
  content = content.replace(/text-red-[4-6]00/g, 'text-[var(--color-danger)]');
  content = content.replace(/bg-red-[50|100]/g, 'bg-[var(--color-danger-light)]');
  content = content.replace(/border-red-200(\/50)?/g, 'border-[var(--color-danger)]/30');
  content = content.replace(/text-amber-[5-8]00/g, 'text-[var(--color-warning)]');
  content = content.replace(/bg-amber-[50|100]/g, 'bg-[var(--color-warning-light)]');
  content = content.replace(/border-amber-200(\/40)?/g, 'border-[var(--color-warning)]/30');
  
  // 3. Micro-interactions in general interactive elements
  content = content.replace(/border-gray-200/g, 'border-[var(--color-border-light)]');
  content = content.replace(/bg-gray-50|bg-slate-50/g, 'bg-[var(--color-surface-warm)]');
  content = content.replace(/bg-gray-100/g, 'bg-[var(--color-surface-soft)]');
  content = content.replace(/text-gray-500/g, 'text-[var(--color-subtle)]');
  content = content.replace(/text-gray-900/g, 'text-[var(--color-text)]');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

walk(TARGET_DIR, rewriteFile);
console.log("Rewrite complete.");
