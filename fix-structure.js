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

            // Reduce all radii to Nani scale
            // rounded-[32px] -> rounded-2xl  (16px in Tailwind)
            // rounded-[28px] -> rounded-2xl
            // rounded-[24px] -> rounded-xl   (12px in Tailwind)
            // rounded-[20px] -> rounded-xl
            content = content.replace(/rounded-\[32px\]/g, 'rounded-2xl');
            content = content.replace(/rounded-\[28px\]/g, 'rounded-2xl');
            content = content.replace(/rounded-\[24px\]/g, 'rounded-xl');
            content = content.replace(/rounded-\[20px\]/g, 'rounded-xl');
            // Remove deep glows and borders
            content = content.replace(/shadow-soft/g, 'shadow-sm border border-[var(--color-border-light)]');
            content = content.replace(/shadow-md/g, 'shadow-sm');
            content = content.replace(/shadow-lg/g, 'shadow-sm');
            // Flatten bubbly buttons (remove shadow-inner if it's there)
            content = content.replace(/shadow-inner/g, '');
            // Some cards have crazy custom shadows
            content = content.replace(/shadow-\[0_12px_40px_rgba[^\]]+\]/g, 'shadow-sm');
            content = content.replace(/shadow-\[0_8px_30px_rgb[^\]]+\]/g, 'shadow-sm');
            content = content.replace(/shadow-\[0_8px_32px_rgba[^\]]+\]/g, 'shadow-sm');
            content = content.replace(/shadow-\[0_4px_24px_rgb[^\]]+\]/g, 'shadow-sm');
            
            // Re-deduplicate duplicate borders if shadow-soft added one and one explicitly existed
            content = content.replace(/border border-\[var\(--color-border-light\)\] border border-\[var\(--color-border-light\)\]/g, 'border border-[var(--color-border-light)]');

            if (content !== originalContent) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Fixed structure in', fullPath);
                count++;
            }
        }
    }
    return count;
}

const total = runReplace(srcDir);
console.log('Structure updated in files:', total);
