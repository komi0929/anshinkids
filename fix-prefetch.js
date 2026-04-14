const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/(main)/layout.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace('<Link\n        key={item.href}\n        href={item.href}', '<Link\n        key={item.href}\n        prefetch={true}\n        href={item.href}');
content = content.replace('<Link\n        href="/login"', '<Link\n        prefetch={true}\n        href="/login"');

fs.writeFileSync(file, content, 'utf8');
console.log("Replaced nav-item prefetch");
