const puppeteer = require('puppeteer');

const URL = 'https://www.mercedes-benz.de/';
const INTERACTION_DELAY = 300;

function requestInterceptor(request) {
    let requestURL = request.url();

    if (requestURL.match('.*\/b\/ss\/.*')) {
        testAdobeRequest(requestURL);
    }

    request.continue();
}

async function getFrame (page, match) {
    let frames = await page.frames();
    return frames.find(f => f.url().includes(match));
}

async function pageOpen (page, url) {
    const navigationPromise = page.waitForNavigation({waitUntil: 'networkidle2'});
    await page.goto(url);
    await navigationPromise;
}

async function hoverFunction (frame, selector) {
    await frame.hover(selector);
    await frame.waitFor(INTERACTION_DELAY);
}

async function clickFunction (frame, selector) {
    await frame.click(selector);
    await frame.waitFor(INTERACTION_DELAY);
}



(async () => {
    const browser = await puppeteer.launch({
        defaultViewport: {
            width: 1850,
            height: 949
        },
        args: [ '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-webgl',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--mute-audio']
    });
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.setRequestInterception(true); 
    page.on('request', requestInterceptor);

    //...

    await browser.close();
})()