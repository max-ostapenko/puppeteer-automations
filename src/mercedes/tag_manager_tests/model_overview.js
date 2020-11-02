const puppeteer = require('puppeteer');

const URL = 'https://www.mercedes-benz.de/';

function requestInterceptor(request) {
    let requestURL = request.url();

    if (requestURL.match('.*b\/ss.*')) {
        testAdobeRequest(requestURL);
    }

    request.continue();
}

function testAdobeRequest(url) {
    let array = url.split('&');
    let object = {};
    object.reportsuite = array[0].substring(40).replace(/\/.*/, '');
    array.forEach(
        item => object[item.split('=')[0]] = item.split('=')[1]
    )

    if(object.v16 == 'vmos') {
        console.log("v26:" + object.v26 + " v27:" + object.v27);
    }
}

async function getFrame (page, match) {
    let frames = await page.frames();
    return frames.find(f => f.url().includes(match));
}

async function pageOpen (page, url) {
    try {
        await page.goto(url, {waitUntil: 'networkidle2'});
    } catch(e) {
        console.log(e);
    }
}

async function hoverFunction (frame, selector) {
    try {
        await frame.hover(selector);
    } catch(e) {
        console.log(e);
    }    
    await frame.waitFor(300);
}

async function clickFunction (frame, selector) {
    try {
        await frame.click(selector);
    } catch(e) {
        console.log(e);
    }
    await frame.waitFor(300);
}

(async () => {
    const browser = await puppeteer.launch({
        defaultViewport: {
            width: 1850,
            height: 949
        }
    });
    const context = await browser.createIncognitoBrowserContext();
    const page = await context.newPage();
    await page.setRequestInterception(true); 
    page.on('request', requestInterceptor);

    await pageOpen(page, URL);

    //close consent pop-ups
    await clickFunction (page, '.description > div > #layer-text > p > .btn');

    let mo_frame = await getFrame (page, 'https://www.mercedes-benz.de/bin/daimler/public/blank.html');

    //group filter click
    await clickFunction (mo_frame, 'vmos > div > div > div > div > div:nth-child(2) section ul > li:nth-child(1)');

    /* var verify = {
        v16: 'vmos',
        v26: 'all',
        v27: 'filter_groups'
    }

    //body type filter click
    await clickFunction (mo_frame, '#subgroup-list > ul > li:nth-child(1)');

    //model image click
    await clickFunction (mo_frame, 'vmos a:nth-child(2) > img');

    await pageOpen(page, URL);
    mo_frame = await getFrame (page, 'https://www.mercedes-benz.de/bin/daimler/public/blank.html');
    
    //model menu click
    await hoverFunction(mo_frame, 'section > div:nth-child(1) > div > div > div:nth-child(1)');
    await clickFunction(mo_frame, 'section > div:nth-child(1) > div > div > div:nth-child(1) ul > li:nth-child(2) > a'); */

    await browser.close();
})()