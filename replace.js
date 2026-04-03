const fs = require('fs');
const path = require('path');

function replaceRecursively(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceRecursively(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.md')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('みんなの声')) {
        const newContent = content.replace(/みんなの声/g, 'トークルーム');
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Replaced in ${fullPath}`);
      }
    }
  }
}

replaceRecursively(path.join(__dirname, 'src'));
