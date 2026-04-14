const fs = require('fs');
const file = 'src/app/layout.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import Script from "next/script";')) {
  content = content.replace('import NextTopLoader', 'import Script from "next/script";\nimport NextTopLoader');
  fs.writeFileSync(file, content, 'utf8');
}
