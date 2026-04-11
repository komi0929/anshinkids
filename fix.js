const fs = require('fs');
let code = fs.readFileSync('src/lib/themes.ts', 'utf-8');
code = code.split('"is_recommended": false,').join('"is_recommended": false,\n    "source_message_ids": ["発言ID"],');
fs.writeFileSync('src/lib/themes.ts', code);
console.log('done');
