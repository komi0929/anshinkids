const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'app');

function runReplace(dir) {
    const files = fs.readdirSync(dir);
    let count = 0;
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            count += runReplace(fullPath);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            // Deepen clicks
            content = content.replace(/active:scale-\[0\.98\]/g, 'active:scale-95 duration-200');

            // Strip remnant shadows completely and enforce 1.5px borders exactly
            content = content.replace(/shadow-sm/g, '');
            // Some stray combinations might leave multiple borders, so let's enforce border-[1.5px] border-[var(--color-border)] where border border-[var(--color-border-light)] exists
            content = content.replace(/border border-\[var\(--color-border-light\)\]/g, 'border-[1.5px] border-[var(--color-border)]');
            
            // Re-deduplicate duplicate spaces that might be caused by removing shadow-sm
            content = content.replace(/  +/g, ' ');

            // Increase padding on list interactions (py-4 -> py-5 in some cases if they are in lists, but we can't be sure it won't break things... actually I will specifically target known py-4 instances safely)
            // It's safer to just let the active:scale and border changes do the heavy lifting of the tactical feel here.
            
            // Clean up empty classes like `className=""` from bad spacing
            content = content.replace(/className=" "/g, 'className=""');
            
            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed tactile feel in', fullPath);
                count++;
            }
        }
    }
    return count;
}

const total = runReplace(srcDir);
console.log('Tactile changes updated in files:', total);
