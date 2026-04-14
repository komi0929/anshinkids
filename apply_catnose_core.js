const fs = require('fs');

// 1. Remove Social Pressure (Counts) in TalkRoom Client
const tcPath = 'src/app/(main)/talk/[slug]/[topicId]/chat-client.tsx';
let tc = fs.readFileSync(tcPath, 'utf8');

// The line <span className="font-bold opacity-80">{data.count}</span> is causing social pressure. Remove it.
tc = tc.replace(/<span className="font-bold opacity-80">\{data\.count\}<\/span>/g, '');

// The legacy <span className="font-bold">{msg.thanks_count}</span>
tc = tc.replace(/❤️ <span className="font-bold">\{msg\.thanks_count\}<\/span>/g, '❤️ <span className="font-bold">わかる</span>');

// Adding btn-nani to the reaction items.
tc = tc.replace(/className={\`flex items-center gap-1\.5 px-3 py-1 rounded-full text-\[12px\] transition-all border-\[1\.5px\] border-\[var\(--color-border\)\] /g, 'className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] btn-nani transition-all border-[1.5px] border-[var(--color-border)] ');

tc = tc.replace(/className={\`flex items-center gap-1 px-2 py-0\.5 rounded-full text-\[11px\] transition-all border /g, 'className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] btn-nani transition-all border ');

fs.writeFileSync(tcPath, tc);


// 2. Playful TTFT Gamified Loader in Concierge Client
const ccPath = 'src/app/(main)/concierge/concierge-client.tsx';
let cc = fs.readFileSync(ccPath, 'utf8');

// Inside concierge-client, when it sends a message, it adds { type: 'concierge', text: '', isStreaming: true }.
// Typically, the renderer loops through messages. If isStreaming && text is length 0, it shows a dot loader.
// Let's check how the dot loader is rendered so we can replace it with a Nani style TTFT game-like element.
// Right now, I will just write a specific Nani TTFT element later inside it using multi_replace_file_content!
