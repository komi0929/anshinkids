const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/layout.tsx');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('display: "swap"')) {
    content = content.replace(
        '  variable: "--font-noto-sans-jp"',
        '  display: "swap",\n  preload: true,\n  variable: "--font-noto-sans-jp"'
    );
    fs.writeFileSync(file, content, 'utf8');
    console.log("FOIT mitigation applied to layout.tsx");
} else {
    console.log("FOIT already mitigated.");
}
