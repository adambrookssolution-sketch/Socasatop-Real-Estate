const { chromium } = require('playwright');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

async function newBrowser() {
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-dev-shm-usage',
    ],
  });
  return browser;
}

async function newContext(browser) {
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    viewport: { width: 1366, height: 768 },
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
    javaScriptEnabled: true,
    extraHTTPHeaders: {
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Sec-Ch-Ua': '"Chromium";v="131", "Not_A Brand";v="24"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
    },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'languages', { get: () => ['pt-BR', 'pt', 'en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    window.chrome = { runtime: {}, loadTimes: function(){}, csi: function(){}, app: {} };
    const originalQuery = window.navigator.permissions && window.navigator.permissions.query;
    if (originalQuery) {
      window.navigator.permissions.query = (p) =>
        p.name === 'notifications'
          ? Promise.resolve({ state: Notification.permission })
          : originalQuery(p);
    }
  });

  return context;
}

async function waitForChallenge(page, maxWaitMs) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const title = await page.title().catch(() => '');
    const url = page.url();
    const content = await page.content().catch(() => '');

    const isChallenge =
      /just a moment|checking your browser|attention required|ddos protection|verifying you are human/i.test(content) ||
      /just a moment|attention required/i.test(title);

    if (!isChallenge) return true;

    const turnstile = await page.$('iframe[src*="challenges.cloudflare.com"], .cf-turnstile, #cf-turnstile');
    if (turnstile) {
      try {
        const box = await turnstile.boundingBox();
        if (box) {
          const x = box.x + 30;
          const y = box.y + box.height / 2;
          await page.mouse.move(x - 50, y - 20, { steps: 10 });
          await page.waitForTimeout(300 + Math.random() * 400);
          await page.mouse.move(x, y, { steps: 8 });
          await page.waitForTimeout(200 + Math.random() * 300);
          await page.mouse.click(x, y, { delay: 80 + Math.random() * 120 });
        }
      } catch (e) { /* ignore click errors */ }
    }

    await page.waitForTimeout(2000);
  }
  return false;
}

async function fetchRenderedHTML(url, opts = {}) {
  const maxWait = opts.maxWait || 30000;
  const waitAfterLoad = opts.waitAfterLoad || 3000;
  const browser = await newBrowser();
  try {
    const context = await newContext(browser);
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await waitForChallenge(page, maxWait);

    await page.waitForTimeout(waitAfterLoad);

    try { await page.waitForLoadState('networkidle', { timeout: 10000 }); } catch (e) { /* ok */ }

    await page.evaluate(async () => {
      await new Promise(resolve => {
        let total = 0;
        const step = 400;
        const timer = setInterval(() => {
          window.scrollBy(0, step);
          total += step;
          if (total >= document.body.scrollHeight - window.innerHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 200);
        setTimeout(() => { clearInterval(timer); resolve(); }, 8000);
      });
    }).catch(() => {});

    await page.waitForTimeout(1500);

    const html = await page.content();
    const finalUrl = page.url();
    await context.close();
    return { html, finalUrl };
  } finally {
    await browser.close();
  }
}

module.exports = { fetchRenderedHTML };
