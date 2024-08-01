const { launchBrowser } = require('../funcs/browser');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;
const destinationsFileName = 'destinations.json';
const currentDirectory = path.dirname(__filename);
const sitemapURL = 'https://movacar.com/sitemap.xml';

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
    destinationsFilePath = path.join(currentDirectory, destinationsFileName)) {
    fs.writeFileSync(destinationsFilePath, JSON.stringify(destinations, null, 4));
    console.log('Trips map file written successfully');
}

function parseDate(dateString) {
    const dateParts = dateString.split('.');
    return new Date(new Date().getFullYear(), dateParts[1] - 1, dateParts[0], 2, 0, 0).toISOString().slice(0, 10);
}

async function getPickupLocations(page, destinations) {
    for (const tripURL in destinations) {
        const { origin, destination } = destinations[tripURL];
        try {
            console.log(`Fetching pickup locations for ${tripURL}`);
            await page.goto(tripURL, { timeout: 5000 });

            destinations[tripURL]["route"] = await page.$eval('.header__route-info', element => element.innerText);

            const cars = await page.$$eval('.product-list__item', elements => elements.map((element) => {
                let car = {}

                try {
                    car.title = element.querySelector(".product__title").innerText
                } catch (e) { }

                try {
                    car.provider = element.querySelector(".product__logo img").alt;
                } catch (e) { }

                try {
                    description_items = element.querySelectorAll(".product__description-item");
                } catch (e) { }


                try {
                    car.deposit = description_items[2].innerText;
                } catch (e) { }

                try {
                    car.seats = description_items[5].innerText;
                } catch (e) { }

                try {
                    car.doors = description_items[7].innerText;
                } catch (e) { }

                try {
                    benefit_items = element.querySelectorAll(".product__benefit-item");
                } catch (e) { }

                try {
                    [_, car.startDate, car.endDate, car.period] = /Pickup from (\d{2}\.\d{2})\. to (\d{2}\.\d{2})\. .+ (\d+h) rental period/.exec(benefit_items[0].innerText);
                    car.startDate = parseDate(car.startDate);
                    car.endDate = parseDate(car.endDate);
                } catch (e) { }
                try {
                    car.refuel = benefit_items[1].innerText;
                } catch (e) { }
                try {
                    car.distance = /([All,\d]+) km .+/.exec(benefit_items[2].innerText)[1];
                } catch (e) { }

                try {
                    buttonText = element.querySelector(".product__link-item--checkout-button").innerText
                    console.log(buttonText);
                    car.price = /'Book for €(\d+)/.exec(buttonText)[1];
                } catch (e) { }

                return car;
            }));
            destinations[tripURL]["cars"] = cars;

        } catch (e) {
            console.log(`Error fetching pickup locations for ${tripURL}: ${e}`);
        }

        writeDestinationsToFile(destinations)
    }

    destinations["parsedDate"] = new Date().toISOString().slice(0, 10);

    return destinations;
}

function convertJSONtoCSV(destinationsFilePath, trips) {
    const csv = csvWriter({
        path: destinationsFilePath,
        header: [
            { id: 'origin', title: 'Origin' },
            { id: 'destination', title: 'Destination' },
            { id: 'route', title: 'Route' },
            { id: 'title', title: 'Title' },
            { id: 'provider', title: 'Provider' },
            { id: 'deposit', title: 'Deposit' },
            { id: 'seats', title: 'Seats' },
            { id: 'doors', title: 'Doors' },
            { id: 'startDate', title: 'Start Date' },
            { id: 'endDate', title: 'End Date' },
            { id: 'period', title: 'Period' },
            { id: 'refuel', title: 'Refuel' },
            { id: 'distance', title: 'Distance (km)' },
            { id: 'price', title: 'Price (€)' },
            { id: 'tripURL', title: 'Trip URL' },
        ],
    });

    const records = [];
    for (const tripURL in trips) {
        if (tripURL === 'parsedDate') continue;
        for (const car of trips[tripURL].cars) {
            records.push({
                ...trips[tripURL],
                ...car,
                'tripURL': tripURL
            });
        }
    }

    //console.log(records);

    csv.writeRecords(records)
        .then(() => {
            console.log('CSV file written successfully');
        });
}


async function main() {
    try {
        const page = await getBrowserPage();
        let destinations = {} // require('./destinations.json');
        destinations = await parseMovacarSitemap(page, destinations);
        writeDestinationsToFile(destinations);

        destinations = await getPickupLocations(page, destinations);
        await page.browser().close();

        convertJSONtoCSV(path.join(currentDirectory, 'destinations.csv'), destinations);

    } catch (error) {
        console.error('An error occurred:', error);
    }
}

main();
