const puppeteer = require("puppeteer");
const fs = require("fs");

const urls = [
  "http://localhost:3000/wiki",
  "http://localhost:3000/wiki/mega-daily-food",
  "http://localhost:3000/wiki/mega-products",
  "http://localhost:3000/wiki/mega-eating-out",
  "http://localhost:3000/wiki/mega-school-life",
  "http://localhost:3000/wiki/mega-challenge",
  "http://localhost:3000/wiki/mega-skin-body",
  "http://localhost:3000/wiki/mega-family",
  "http://localhost:3000/wiki/mega-milestone",
];

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 }); // iPhone 12 Pro dimensions
  
  if (!fs.existsSync("screenshots")) {
    fs.mkdirSync("screenshots");
  }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`Navigating to ${url}`);
    await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
    
    // Wait an extra second for animations to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const title = url.split("/").pop() || "wiki-top";
    await page.screenshot({ path: `screenshots/${title}.png`, fullPage: true });
    console.log(`Saved screenshot ${title}.png`);
  }
  
  await browser.close();
})();
