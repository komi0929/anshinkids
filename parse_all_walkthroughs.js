const fs = require('fs');
const path = require('path');

const brainDir = 'C:\\Users\\hisak\\.gemini\\antigravity\\brain';
const dirs = fs.readdirSync(brainDir).filter(d => fs.statSync(path.join(brainDir, d)).isDirectory());

let walkthroughs = [];

dirs.forEach(dir => {
    const wPath = path.join(brainDir, dir, 'walkthrough.md');
    if (fs.existsSync(wPath)) {
        const stats = fs.statSync(wPath);
        const content = fs.readFileSync(wPath, 'utf8');
        // Only include anshin-kids related walkthroughs
        if (content.toLowerCase().includes('anshin') || content.includes('あんしんキッズ') || content.includes('Mega-Wiki') || content.includes('トークルーム')) {
            walkthroughs.push({
                dir,
                path: wPath,
                mtime: stats.mtimeMs,
                date: new Date(stats.mtimeMs).toISOString(),
                content: content
            });
        }
    }
});

// Sort by oldest to newest
walkthroughs.sort((a, b) => a.mtime - b.mtime);

const recent = walkthroughs.slice(-15);

let summary = "# Comprehensive Bullet Point Extraction\n\n";
recent.forEach((w, i) => {
    const lines = w.content.split('\n');
    const title = lines.find(l => l.startsWith('#')) || 'No Title';
    summary += `## [${i + 1}] ${w.date} - ${title}\n\n`;
    
    // Extract everything that looks like a feature or fix (bullet points, numbered lists, bold text)
    lines.forEach(l => {
        const trimmed = l.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
            summary += `${trimmed}\n`;
        }
    });
    summary += '\n---\n\n';
});

fs.writeFileSync('C:\\Users\\hisak\\.gemini\\antigravity\\tmp_all_walkthroughs.md', summary);
console.log('Saved to tmp_all_walkthroughs.md');
