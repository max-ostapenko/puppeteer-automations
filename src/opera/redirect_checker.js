const puppeteer = require('puppeteer');

const links = [
    'http://www.goo.gle',
    'http://www.bit.ly'
];

(async () => {
    const browser = await puppeteer.launch({});
    const page = (await browser.pages())[0];

    for (link of links) {
        await page.goto(link, { waitUntil: 'networkidle0', timeout: 30000 });
        console.log(await page.evaluate(() => document.location));
    }

    await browser.close();
})()
