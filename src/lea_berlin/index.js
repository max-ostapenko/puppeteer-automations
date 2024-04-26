const puppeteer = require('puppeteer');

const scrape = async () => {
    try {
        let browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://127.0.0.1:9222/devtools/browser/5ad3ab79-2e6a-4fdf-ab74-f1d4cf87fd73',
            defaultViewport: null,
        });

        const page = await browser.newPage();
        await page.goto('https://otv.verwalt-berlin.de/ams/TerminBuchen/wizardng?sprachauswahl=de');
        console.log('Page opened');

        await page.locator('#xi-cb-1').click();
        await page.locator('#applicationForm\\:managedForm\\:proceed').click();
        console.log('Page 1');


        // document.querySelector("#xi-sel-400").value = '166'
        await page.locator('#xi-sel-400.XItem.XSelect.left-top.XDropDown').wait();
        await page.locator('#xi-sel-400.XItem.XSelect.left-top.XDropDown').fill('166');
        await page.evaluate(() => {
            document.querySelector("#xi-sel-400.XItem.XSelect.left-top.XDropDown").value = '166';
        });


        await page.locator('#xi-sel-422').fill('2');
        await page.locator('#xi-sel-427').fill('1');
        await page.locator('#xi-sel-428').fill('166-0');

        // document.querySelector("#SERVICEWAHL_DE3166-0-3").click()
        await page.locator('#SERVICEWAHL_DE3166-0-3').wait();
        await page.evaluate(() => {
            document.querySelector("#SERVICEWAHL_DE3166-0-3").click()
        });

        // document.querySelector("#SERVICEWAHL_DE166-0-3-99-121874").click()
        await page.locator('#SERVICEWAHL_DE166-0-3-99-121874').wait();
        await page.evaluate(() => {
            document.querySelector("#SERVICEWAHL_DE166-0-3-99-121874").click()
        });


        //await page.locator('#applicationForm\\:managedForm\\:proceed').click();

    } catch (error) {
        console.error('Task failed:', error);
    }
};

scrape();
