const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    devtools: true,
    headless: false,
  });

  const page = await browser.newPage();

  await page.goto('https://accounts.google.com/');
  //await page.waitForNavigation();

  await page.waitForSelector('input[type="email"]');
  await page.click('input[type="email"]');
  await page.type('input[type="email"]', 'example@gmail.com');
  await page.waitFor(500);

  await page.waitForSelector('#identifierNext > div > button');
  await page.click('#identifierNext > div > button');
  await page.waitFor(500);

  //await page.waitForSelector('input[type="password"]')
  //await page.click('input[type="password"]')
  //await page.type('input[type="password"]', '12345');
  //await page.waitFor(500);

  //await page.waitForSelector('#passwordNext');
  //await page.click('#passwordNext');

  //await navigationPromise;

  await page.screenshot({path: 'screenshot.png'});

  await browser.close();
})();
