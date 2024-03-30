const { launchBrowser } = require('../funcs/browser');
const sleep = require('../funcs/helpers');
let destinations = require('./destinations.json');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');

const currentDirectory = path.dirname(__filename);

async function getBrowserPage() {
    const browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
        const requestType = interceptedRequest.resourceType();

        // Abort requests for resources other than document
        if (requestType !== 'document') {
            interceptedRequest.abort();
        } else {
            interceptedRequest.continue(); // Continue loading document requests
        }
    });

    return page;
}

// Parse the Movacar sitemap to extract destinations and their URLs
async function parseMovacarSitemap(page, destinations = {}) {
    const sitemapURL = 'https://movacar.com/sitemap.xml';

    // Promise to capture the sitemap response
    const sitemapResponsePromise = new Promise((resolve) => {
        page.on('response', async (response) => {
            if (response.url() === sitemapURL && response.status() === 200) {
                const sitemapResponse = await response.text();
                resolve(sitemapResponse);
            }
        });
    });

    await page.goto(sitemapURL);

    // Wait for the sitemap response before proceeding
    const sitemapResponse = await sitemapResponsePromise;

    // Parsing XML using xml2js library
    const parser = new xml2js.Parser();
    const document = await parser.parseStringPromise(sitemapResponse);
    const urls = document.urlset.url;

    // Iterate over URLs
    for (let i = 0; i < Math.max(urls.length, 17); i++) {
        const loc = urls[i].loc[0];

        // Regular expression to extract URLs matching the desired pattern
        const regex = /https:\/\/www\.movacar\.com\/mietwagen\/(?:von|)([^\/]+)\/([^\/]+)\/(?:[^\/]+\/|)/;
        const match = regex.exec(loc);

        if (match) {
            const origin = decodeURIComponent(match[1]); // Extract origin from the URL
            const destination = decodeURIComponent(match[2]); // Extract destination from the URL

            // If the destination part exists
            if (destination !== "") {
                // If the origin is not already in the destinations object, add it
                if (!destinations[origin]) {
                    destinations[origin] = {};
                }

                // Add the destination to the origin in the destinations object
                if (!destinations[origin][destination]) {
                    destinations[origin][destination] = {
                            "url": addUrlsToDestinations(origin, destination)
                    };
                }

            }
        }
    }

    return destinations;
}

function addUrlsToDestinations(origin, destination) {
    const url = `https://movacar.com/mietwagen/${origin}/${destination}/`;

    return url;
}

function parseDate(dateString) {
    const dateParts = dateString.split('.');
    return new Date("2024", dateParts[1] - 1, dateParts[0]).toISOString().slice(0, 10);
}

async function getPickupLocations(page, destinations) {
    for (const origin in destinations) {
        if (origin == "von") {
            continue
        }
        for (const destination in destinations[origin]) {
            if (destinations[origin][destination]["parsedDate"] <= "2024-03-30") {
                continue;
            }

            const url = destinations[origin][destination]["url"];
            try {
                console.log(`Fetching pickup locations for ${url}`);

                // Navigate to the destination page
                await page.goto(url);

                await page.waitForSelector('ul.product__benefit-list');
                const products = await page.$$eval('ul.product__benefit-list', elements => elements.map((element) => {
                    let product = {}
                    product.description = element.innerText;

                    try {
                        product.startDate = parseDate(/Pickup from (\d{2}\.\d{2}\.) .+/.exec(product.description.split('\n')[0])[1]);
                    } catch (e) { }
                    try {
                        product.endDate = parseDate(/.+ to (\d{2}\.\d{2}\.) .+/.exec(product.description.split('\n')[0])[1]);
                    } catch (e) { }
                    try {
                        product.distanceKm = parseDate(/([All,\d]+) km .+/.exec(product.description.split('\n')[2])[1]);
                    } catch (e) { }

                    return product;
                }));
                destinations[origin][destination]["products"] = products;

                await page.waitForSelector('div.header__route-info');
                const route = await page.$eval('div.header__route-info', element => element.innerText);
                destinations[origin][destination]["route"] = route;
                destinations[origin][destination]["parsedDate"] = new Date().toISOString().slice(0, 10);
            } catch (e) {
                console.log(`Error fetching pickup locations for ${url}: ${e}`);
            }
        }
    }

    return destinations;
}

function convertJSONtoCSV(destinationsFilePath, destinations) {
    const csvWriter = require('csv-writer').createObjectCsvWriter;

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
            const url = destinations[origin][destination].url;
            const products = destinations[origin][destination].products;
            const route = destinations[origin][destination].route;

            if (products &&products.length > 0) {

                for (const product of products) {
                    records.push({
                        origin: origin,
                        destination: destination,
                        url: url,
                        route: route,
                        'product.startDate': product.startDate,
                        'product.endDate': product.endDate,
                        'product.distanceKm': product.distanceKm,
                    });
                }
            }
        }
    }

    csv.writeRecords(records)
        .then(() => {
            console.log('CSV file written successfully');
        });
}

// Main function to execute the above steps and write the results to a JSON file
async function main() {
    let page = await getBrowserPage()

    // Get the destinations and their URLs from the Movacar sitemap
    //destinations = await parseMovacarSitemap(page, destinations);

    // Get the pickup locations for each destination from the Movacar sitemap
    //destinations = await getPickupLocations(page, destinations);

    await page.browser().close();

    // Write the destinations object to a file
    fs.writeFileSync(path.join(currentDirectory, 'destinations.json'), JSON.stringify(destinations, null, 4))
    convertJSONtoCSV(path.join(currentDirectory, 'destinations.csv'), destinations);
}

main();
