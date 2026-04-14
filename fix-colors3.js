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

  content = content.replace(/green-[0-9]+/g, '[var(--color-primary-bg)]');
  content = content.replace(/lime-[0-9]+/g, '[var(--color-border)]');

  // Actually I should be careful not to replace things like `to-green-50` with blindly `[var...]` it should be `to-[var(--color-primary-bg)]`.
  // Wait, I messed up the regex.
  content = content.replace(/(from|bg|to|text|border|shadow)-green-[0-9]+/g, '$1-[var(--color-primary-bg)]');
  content = content.replace(/(from|bg|to|text|border|shadow)-lime-[0-9]+/g, '$1-[var(--color-border)]');

  // Let's just fix it robustly.
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed additional ones', file);
  }
});
