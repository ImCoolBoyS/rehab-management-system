import { chromium } from "playwright";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 700 } });
  await page.goto("file:///" + path.join(__dirname, "logo_preview.html"), { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(__dirname, "assets", "screenshots", "logo_preview.png"), fullPage: true });
  await browser.close();
  console.log("OK");
})();
