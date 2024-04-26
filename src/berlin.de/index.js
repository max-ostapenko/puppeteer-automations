const puppeteer = require('puppeteer');

(async () => {
    try {
        let browser = await puppeteer.connect({
            browserWSEndpoint: 'ws://127.0.0.1:9222/devtools/browser/0f6483e1-143c-4bdd-b081-f019219b920a'
        });
        const page = await browser.newPage()

        const url =
            'https://service.berlin.de/terminvereinbarung/termin/restart/?' +
            'providerList=122208%2C122217%2C122219%2C122226%2C122227%2C122231%2C122238%2C122243%2C122246%2C122251%2C122252%2C122254%2C122257%2C122260%2C122262%2C122267%2C122271%2C122273%2C122274%2C122276%2C122277%2C122279%2C122280%2C122281%2C122282%2C122284%2C122285%2C122286%2C122291%2C122294%2C122296%2C122297%2C122301%2C122304%2C122309%2C122311%2C122312%2C122314%2C150230%2C351065' +
            '&requestList=121874'

        await page.goto(url, {
            waitUntil: 'networkidle0',
        });

        if (page.url() == 'https://service.berlin.de/terminvereinbarung/termin/taken/') {
            console.log('No slots available');
            page.close();
            process.exit();
        }
    } catch (error) {
        console.error('Scrape failed:', error);
    }
})();
