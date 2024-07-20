const { launchBrowser } = require('../funcs/browser');
const sleep = require('../funcs/helpers');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const csvWriter = require('csv-writer').createObjectCsvWriter;

const destinationsFileName = 'destinations.json';

let destinations = require(`./${destinationsFileName}`);

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

async function parseMovacarSitemap(page, destinations = {}) {
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

    for (let i = 0; i < urls.length; i++) {
        const loc = urls[i].loc[0];
        const regex = /https:\/\/www\.movacar\.com\/mietwagen\/(?:von|)([^\/]+)\/([^\/]+)\/(?:[^\/]+\/|)/;
        const match = regex.exec(loc);

        if (match) {
            const origin = decodeURIComponent(match[1]);
            const destination = decodeURIComponent(match[2]);
            if (destination !== "") {
                destinations[origin] = destinations[origin] || {};
                destinations[origin][destination] = { url: `https://movacar.com/mietwagen/${origin}/${destination}/` };
            }
        }
    }

    return destinations;
}

async function getPickupLocations(page, destinations) {
    for (const origin in destinations) {
        if (origin === "von") continue;
        for (const destination in destinations[origin]) {
            if (destinations[origin][destination]["parsedDate"] <= "2024-03-30") continue;

            const url = destinations[origin][destination]["url"];
            try {
                console.log(`Fetching pickup locations for ${url}`);
                await page.goto(url, { timeout: 5000 });
                const [productElements, routeElement] = await Promise.all([
                    page.waitForSelector('ul.product__benefit-list'),
                    page.waitForSelector('div.header__route-info')
                ]);

                const products = await page.$$eval('ul.product__benefit-list', elements => elements.map((element) => {
                    let product = {}
                    product.description = element.innerText;
                    function parseDate(dateString) {
                        const dateParts = dateString.split('.');
                        return new Date("2024", dateParts[1] - 1, dateParts[0]).toISOString().slice(0, 10);
                    }
                    try {
                        product.startDate = parseDate(/Pickup from (\d{2}\.\d{2}\.) .+/.exec(product.description.split('\n')[0])[1]);
                    } catch (e) { }
                    try {
                        product.endDate = parseDate(/.+ to (\d{2}\.\d{2}\.) .+/.exec(product.description.split('\n')[0])[1]);
                    } catch (e) { }
                    try {
                        product.distanceKm = /([All,\d]+) km .+/.exec(product.description.split('\n')[2])[1];
                    } catch (e) { }
                    return product;
                }));
                destinations[origin][destination]["products"] = products;

                const route = await routeElement.evaluate(element => element.innerText);
                destinations[origin][destination]["route"] = route;

                destinations[origin][destination]["parsedDate"] = new Date().toISOString().slice(0, 10);
            } catch (e) {
                console.log(`Error fetching pickup locations for ${url}: ${e}`);
            }

            writeDestinationsToFile(destinations)
        }
    }

    return destinations;
}

function convertJSONtoCSV(destinationsFilePath, destinations) {
    const csv = csvWriter({
        path: destinationsFilePath,
        header: [
            { id: 'origin', title: 'Origin' },
            { id: 'destination', title: 'Destination' },
            { id: 'url', title: 'URL' },
            { id: 'route', title: 'Route' },
            { id: 'product.startDate', title: 'Start Date' },
            { id: 'product.endDate', title: 'End Date' },
            { id: 'product.distanceKm', title: 'Distance (km)' },

        ],
    });

    const records = [];
    for (const origin in destinations) {
        for (const destination in destinations[origin]) {
            const { url, products, route } = destinations[origin][destination];

            if (products && products.length > 0) {
                products.forEach(product => {
                    records.push({
                        origin: origin,
                        destination: destination,
                        url: url,
                        route: route,
                        'product.startDate': product.startDate,
                        'product.endDate': product.endDate,
                        'product.distanceKm': product.distanceKm,
                    });
                })
            }
        }
    }

    csv.writeRecords(records)
        .then(() => {
            console.log('CSV file written successfully');
        });
}

function writeDestinationsToFile(
    destinations,
    destinationsFilePath = path.join(currentDirectory, destinationsFileName)) {
    fs.writeFileSync(destinationsFilePath, JSON.stringify(destinations, null, 4));
    console.log('JSON file written successfully');
}

// main function
async function main() {
    try {
        let page = await getBrowserPage();
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
