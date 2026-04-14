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

  // Replace utility classes
  content = content.replace(/bg-emerald-500/g, 'bg-[var(--color-primary)]');
  content = content.replace(/border-emerald-500/g, 'border-[var(--color-primary)]');
  content = content.replace(/from-emerald-50/g, 'from-[var(--color-primary-bg)]');
  content = content.replace(/to-emerald-50/g, 'to-[var(--color-primary-bg)]');
  content = content.replace(/from-emerald-[0-9]+/g, 'from-[var(--color-primary-bg)]');
  content = content.replace(/border-emerald-[0-9]+/g, 'border-[var(--color-border-light)]');
  content = content.replace(/text-emerald-[0-9]+/g, 'text-[var(--color-primary-dark)]');
  content = content.replace(/bg-emerald-[0-9]+/g, 'bg-[var(--color-primary-bg)]');
  content = content.replace(/bg-green-[0-9]+/g, 'bg-[var(--color-primary-bg)]');
  content = content.replace(/text-green-[0-9]+/g, 'text-[var(--color-primary)]');
  content = content.replace(/border-green-[0-9]+/g, 'border-[var(--color-border-light)]');
  content = content.replace(/bg-lime-[0-9]+/g, 'bg-[var(--color-primary-bg)]');
  content = content.replace(/text-lime-[0-9]+/g, 'text-[var(--color-primary)]');
  
  content = content.replace(/bg-\[\#06C755\]/g, 'bg-[var(--color-primary)]');
  content = content.replace(/"#06C755"/g, '"var(--color-primary)"');
  content = content.replace(/'#06C755'/g, "'var(--color-primary)'");

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});
