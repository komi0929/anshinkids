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
      let modified = false;

      if (content.includes('知恵袋')) {
        content = content.replace(/知恵袋/g, 'ヒント集');
        modified = true;
      }
      
      if (content.includes('知恵')) {
        content = content.replace(/知恵/g, 'ヒント');
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Replaced in ${fullPath}`);
      }
    }
  }
}

replaceRecursively(path.join(__dirname, 'src'));
