const { launchBrowser } = require('../funcs/browser');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const sheets = google.sheets('v4');
const currentDirectory = path.dirname(__filename);
const sitemapURL = 'https://movacar.com/sitemap.xml';
const spreadsheetId = '1jyyizfItMyLsRrRrga99VUXImp3j4fuqzWOfeN7T2As';
const destinationsFilePath = path.join(currentDirectory, 'destinations.json')

async function getBrowserPage() {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        const requestType = interceptedRequest.resourceType();
        if (requestType !== 'document') {
            interceptedRequest.abort();
        } else {
            interceptedRequest.continue();
        }
    });

    return page;
}

async function parseMovacarSitemap(page, destinations) {
    const sitemapResponsePromise = new Promise((resolve) => {
        page.on('response', async (response) => {
            if (response.url() === sitemapURL && response.status() === 200) {
                const sitemapResponse = await response.text();
                resolve(sitemapResponse);
            }
        });
    });
    await page.goto(sitemapURL);
    const sitemapResponse = await sitemapResponsePromise;

    const parser = new xml2js.Parser();
    const document = await parser.parseStringPromise(sitemapResponse);
    const urls = document.urlset.url;

    for (const url of urls) {
        const tripURL = url.loc[0]

        const regex = /mietwagen\/(.+)\/(.+)\//;
        const match = regex.exec(url.loc[0]);

        if (match && match[1] != 'von' && match[2]) {
            destinations[tripURL] = destinations[tripURL] || {};
            destinations[tripURL]["origin"] = decodeURIComponent(match[1]);
            destinations[tripURL]["destination"] = decodeURIComponent(match[2]);
        }
    }

    return destinations;
}

function writeDestinationsToFile(
    destinations,
    destinationsFilePath) {
    fs.writeFileSync(destinationsFilePath, JSON.stringify(destinations, null, 4));
    console.log('Trips map file written successfully');
}

async function getPickupLocations(page, destinations) {
    for (const tripURL in destinations) {
        console.log(`Fetching cars for ${tripURL}`);
        await page.goto(tripURL, { timeout: 5000 });
        destinations[tripURL]["route"] = await page.$eval('.header__route-info', element => element.innerText);


        const cars = await page.$$eval('.product-list__item', elements => elements.map((element) => {
            let car = {};
            function parseDate(dateString) {
                const dateParts = dateString.split('.');
                return new Date(new Date().getFullYear(), dateParts[1] - 1, dateParts[0], 2, 0, 0).toISOString().slice(0, 10);
            }

            car.title = element.querySelector(".product__title").innerText
            car.provider = element.querySelector(".product__logo img").alt;

            description_items = element.querySelectorAll(".product__description-item");
            car.deposit = description_items[2].innerText;
            car.seats = description_items[5].innerText;
            car.doors = description_items[7].innerText;

            benefit_items = element.querySelectorAll(".product__benefit-item");
            [_, car.startDate, car.endDate, car.period] = /Pickup from (\d{2}\.\d{2})\. to (\d{2}\.\d{2})\. .+ (\d+h) rental period/.exec(benefit_items[0].innerText);
            car.startDate = parseDate(car.startDate);
            car.endDate = parseDate(car.endDate);
            car.refuel = benefit_items[1].innerText;
            car.distance = /([All,\d]+) km .+/.exec(benefit_items[2].innerText)[1];

            buttonText = element.querySelector(".product__link-item--checkout-button").innerText
            console.log(buttonText);
            car.price = /Book for €(\d+)/.exec(buttonText)[1];

            return car;
        }));
        destinations[tripURL]["cars"] = cars;
        writeDestinationsToFile(destinations, destinationsFilePath)
    }
    destinations["parsedDate"] = new Date().toISOString().slice(0, 10);

    return destinations;
}

async function authorize() {
    const auth = await google.auth.getClient({
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    return auth;
}

async function updateGoogleSheet(auth, spreadsheetId, range, values) {
    const resource = {
        values,
    };
    await sheets.spreadsheets.values.clear({
        auth,
        spreadsheetId,
        range,
    });
    await sheets.spreadsheets.values.update({
        auth,
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        resource,
    });
    console.log('Data updated in Google Sheet');
}

async function convertJSONtoGoogleSheet(spreadsheetId, trips) {
    const auth = await authorize();

    const rows = [[
        'Origin', 'Destination', 'Route', 'Title', 'Provider', 'Deposit',
        'Seats', 'Doors', 'Start Date', 'End Date', 'Period', 'Refuel',
        'Distance (km)', 'Price (€)', 'Trip URL'
    ]];

    for (const tripURL in trips) {
        if (tripURL === 'parsedDate') continue;
        for (const car of trips[tripURL].cars) {
            rows.push([
                trips[tripURL].origin,
                trips[tripURL].destination,
                trips[tripURL].route,
                trips[tripURL].title,
                trips[tripURL].provider,
                car.deposit,
                car.seats,
                car.doors,
                trips[tripURL].startDate,
                trips[tripURL].endDate,
                trips[tripURL].period,
                car.refuel,
                car.distance,
                car.price,
                tripURL
            ]);
        }
    }

    await updateGoogleSheet(auth, spreadsheetId, 'Sheet1!A:O', rows);
}

async function main() {
    const page = await getBrowserPage();
    let destinations = {} // require('./destinations.json');
    destinations = await parseMovacarSitemap(page, destinations);

    writeDestinationsToFile(destinations, destinationsFilePath);

    destinations = await getPickupLocations(page, destinations);
    await page.browser().close();

    convertJSONtoGoogleSheet(spreadsheetId, destinations);

    //remove json file
    fs.unlinkSync(destinationsFilePath);
}

main();
