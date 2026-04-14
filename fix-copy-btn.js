const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/app/(main)/concierge/concierge-client.tsx');
let content = fs.readFileSync(file, 'utf8');

const target = `            )}
          </div>
        )}
      </div>
    </div>

    {msg.role === "user"`;

const replacement = `            )}
          </div>
        )}
        
        {msg.role === "assistant" && (
          <InstantCopyButton text={msg.content} />
        )}
      </div>
    </div>

    {msg.role === "user"`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("InstantCopyButton injected into assistant bubbles!");
