const puppeteer = require('puppeteer');
const commandLineArgs = require('command-line-args');

const optionDefinitions = [
    { name: 'clickURL', alias: 'c', type: String },
];
const options = commandLineArgs(optionDefinitions);


(async () => {
    const browser = await puppeteer.launch({});
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    const navigationPromise = page.waitForNavigation();
    await page.goto(options.clickURL);
    await navigationPromise;

    console.log(await page.evaluate(() => document.location.host));
    await browser.close();
})()
