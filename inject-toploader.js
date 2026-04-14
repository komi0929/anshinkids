const fs = require('fs');
const file = 'src/app/layout.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import NextTopLoader')) {
  content = content.replace('import "./globals.css";', 'import "./globals.css";\nimport NextTopLoader from "nextjs-toploader";');
  content = content.replace('<body className="min-h-[100dvh]">', '<body className="min-h-[100dvh]">\n        <NextTopLoader color="#099bff" initialPosition={0.08} crawlSpeed={200} height={3} crawl={true} showSpinner={false} easing="ease" speed={200} shadow="0 0 10px #099bff,0 0 5px #099bff" />');
  fs.writeFileSync(file, content, 'utf8');
  console.log("TopLoader injected.");
} else {
  console.log("TopLoader already injected.");
}
