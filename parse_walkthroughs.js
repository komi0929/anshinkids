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
        walkthroughs.push({
            dir,
            path: wPath,
            mtime: stats.mtimeMs,
            date: new Date(stats.mtimeMs).toISOString(),
            content: content
        });
    }
});

// Sort by oldest to newest
walkthroughs.sort((a, b) => a.mtime - b.mtime);

// Just take the last 15
const recent = walkthroughs.slice(-15);

let summary = "# Chronological Walkthrough History (Last 15)\n\n";
recent.forEach((w, i) => {
    const lines = w.content.split('\n').filter(l => l.trim().length > 0);
    const title = lines.find(l => l.startsWith('#')) || 'No Title';
    summary += `## [${i + 1}] ${w.date} - ${dirShort(w.dir)}\n`;
    summary += `**Title:** ${title}\n\n`;
    summary += `### Extracted Details:\n`;
    // Extract headers (H2 and H3)
    const headers = lines.filter(l => l.startsWith('## ') || l.startsWith('### '));
    headers.forEach(h => {
        summary += `- ${h}\n`;
    });
    summary += '\n---\n\n';
});

function dirShort(d) {
    return d.substring(0, 8);
}

fs.writeFileSync('C:\\Users\\hisak\\.gemini\\antigravity\\tmp_timeline.md', summary);
console.log('Timeline generated at C:\\Users\\hisak\\.gemini\\antigravity\\tmp_timeline.md');
