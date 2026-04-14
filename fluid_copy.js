const fs = require('fs');

let path = 'src/app/(main)/concierge/concierge-client.tsx';
let c = fs.readFileSync(path, 'utf8');

// We need to add an import for Haptics and Icons
if (!c.includes('Copy')) {
  c = c.replace(/import {([^}]+)} from "@\/components\/icons";/, 'import { $1, Copy, CheckCircle2 } from "@/components/icons";');
}
if (!c.includes('Haptics')) {
  c = c.replace(/import { useState/i, 'import { Haptics } from "@/lib/haptics";\nimport { useState');
}

// Add state for copied text and copy handler
if (!c.includes('handleCopy')) {
  const handlerCode = `
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopy = async (text: string, id: number) => {
    Haptics.light();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch(e) {}
  };
`;
  c = c.replace(/const \[showEmergency, setShowEmergency\] = useState\(false\);/, 'const [showEmergency, setShowEmergency] = useState(false);\n' + handlerCode);
}

// Inject the copy button under the assistant message bubble
const copyBtnHTML = `
              </div>
              
              {msg.role === "assistant" && !isLoading && (
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={() => handleCopy(msg.content, index)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] btn-nani transition-all border border-[var(--color-border)] text-[var(--color-subtle)] hover:bg-[var(--color-surface-soft)]"
                  >
                    {copiedId === index ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> <span className="text-green-600 font-bold">コピーしました</span></>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> コピーする</>
                    )}
                  </button>
                </div>
              )}
`;
c = c.replace(/<\/div>\n\s*<\/div>\n\s*{msg\.role === "user"/, copyBtnHTML + '\n            </div>\n\n            {msg.role === "user"');

fs.writeFileSync(path, c);
console.log('Fluid Copy Applied to Concierge');
