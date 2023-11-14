const url = 'https://www.similarweb.com/top-websites/';
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = (await chrome.pages())[0];

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    setTimeout(async function () {
        let tr = await page.$$eval('tr.tw-table__row', rows => {
            table = [];
            for (row of rows) {
                table.push(row.innerText.split('\n'))
            }

            return table
        });
        console.log(tr);
    }, 10000);

    //await browser.close();
})();


/*
document.querySelector('div.data-page-filter.data-page-filter--category > div > button').click()
document.querySelectorAll('div.data-page-filter.data-page-filter--category > div > div > button')

document.querySelector('div.data-page-filter.data-page-filter--country > div > button').click()
document.querySelectorAll('div.data-page-filter.data-page-filter--country > div > div > button')

document.querySelector('div.data-page-filter.data-page-filter--category > div > button').click()
document.querySelectorAll('div.data-page-filter.data-page-filter--category > div > div > button')

document.querySelector('button.swui-button.swui-button--solid.swui-button--primary.top-controls__filters-apply-button') */
