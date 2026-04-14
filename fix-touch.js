const fs = require('fs');
const path = require('path');

// 1. globals.css updates
const cssFile = path.join(__dirname, 'src/app/globals.css');
let cssContent = fs.readFileSync(cssFile, 'utf8');

if (!cssContent.includes('-webkit-tap-highlight-color: transparent;')) {
    cssContent = cssContent.replace(
        '  html {',
        '  * {\n    -webkit-tap-highlight-color: transparent;\n  }\n\n  html {'
    );
    cssContent = cssContent.replace(
        '  .btn-primary {',
        '  .btn-primary {\n    touch-action: manipulation;\n    user-select: none;\n    -webkit-user-select: none;'
    );
    // Also inject touch-action to nav-item
    cssContent = cssContent.replace(
        '  .nav-item {',
        '  .nav-item {\n    touch-action: manipulation;\n    user-select: none;\n    -webkit-user-select: none;'
    );
    fs.writeFileSync(cssFile, cssContent, 'utf8');
    console.log("globals.css native touch hacks applied.");
}

// 2. Prefetch updates to nav links in layout.tsx
function enforcePrefetch(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            enforcePrefetch(fullPath);
        } else if (file === 'layout.tsx' && fullPath.includes('(main)')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('<Link\n') && !content.includes('prefetch={true}')) {
                // Add to multi-line Link components
                content = content.replace(/<Link\n/g, '<Link prefetch={true}\n');
                // Also single line Link href="..."
                content = content.replace(/<Link href=/g, '<Link prefetch={true} href=');
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log("Aggressive prefetch applied to", fullPath);
            }
        }
    }
}
enforcePrefetch(path.join(__dirname, 'src/app'));
