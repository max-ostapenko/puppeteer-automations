const { launchBrowser } = require('../funcs/browser');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const sheets = google.sheets('v4');
const sitemapURL = 'https://movacar.com/sitemap.xml';
const spreadsheetId = '1jyyizfItMyLsRrRrga99VUXImp3j4fuqzWOfeN7T2As';

class MovacarScraper {
  constructor(sitemapURL, spreadsheetId) {
    this.sitemapURL = sitemapURL;
    this.spreadsheetId = spreadsheetId;
    this.tripsJSONfile = this._destinationsFilePath('destinations.json');
  }

  _destinationsFilePath(filename) {
    const currentDirectory = path.dirname(__filename);
    return path.join(currentDirectory, filename);
  }

  async _getBrowserPage() {
    const browser = await launchBrowser();
    const page = (await browser.pages())[0];
    await page.setRequestInterception(true);
    page.on('request', interceptedRequest => {
      const requestType = interceptedRequest.resourceType();
      requestType !== 'document' ? interceptedRequest.abort() : interceptedRequest.continue();
    });

    return page;
  }

  async _fetchSitemap(page) {
    const sitemapResponsePromise = new Promise((resolve) => {
      page.on('response', async (response) => {
        if (response.url() === this.sitemapURL && response.status() === 200) {
          const sitemapResponse = await response.text();
          resolve(sitemapResponse);
        }
      });
    });
    await page.goto(this.sitemapURL);
    return await sitemapResponsePromise;
  }

  async _parseSitemap(sitemapResponse) {
    const parser = new xml2js.Parser();
    const document = await parser.parseStringPromise(sitemapResponse);
    return document.urlset.url;
  }

  _extractDestinations(urls) {
    let destinations = {
      "parsedDate": new Date().toISOString().slice(0, 10),
      "trips": {},
    };

    urls.forEach(url => {
      const tripURL = url.loc[0];
      const regex = /mietwagen\/(.+)\/(.+)\//;
      const match = regex.exec(url.loc[0]);

      if (match && match[1] !== 'von' && match[2]) {
        if (!destinations["trips"][tripURL]) destinations["trips"][tripURL] = {};
        destinations["trips"][tripURL]["origin"] = decodeURIComponent(match[1]);
        destinations["trips"][tripURL]["destination"] = decodeURIComponent(match[2]);
      }
    });

    return destinations;
  }

  _writeToFile(destinations) {
    fs.writeFileSync(this.tripsJSONfile, JSON.stringify(destinations, null, 2));
    console.log('Trips map file written successfully');
  }

  async _fetchPickupLocations(page, destinations) {
    for (const tripURL in destinations["trips"]) {
      console.log(`Fetching cars for ${tripURL}`);
      await page.goto(tripURL, { timeout: 5000 });

      const route = await page.$eval('.header__route-info', element => element.innerText);

      const cars = await page.$$eval('.product-list__item', elements => {
        return elements.map(element => {
          let car = {};
          car.title = element.querySelector(".product__title").innerText;
          car.provider = element.querySelector(".product__logo img").alt;

          const descriptionItems = element.querySelectorAll(".product__description-item");
          car.deposit = descriptionItems[2].innerText;
          car.seats = descriptionItems[5].innerText;
          car.doors = descriptionItems[7].innerText;

          const benefitItems = element.querySelectorAll(".product__benefit-item");
          const [_, startDate, endDate, period] = /Pickup from (\d{2}\.\d{2})\. to (\d{2}\.\d{2})\. .+ (\d+h) rental period/.exec(benefitItems[0].innerText);
          car.startDate = startDate;
          car.endDate = endDate;
          car.period = period;
          car.refuel = benefitItems[1].innerText;
          car.distance = /([All,\d]+) km .+/.exec(benefitItems[2].innerText)[1];

          const buttonText = element.querySelector(".product__link-item--checkout-button").innerText;
          car.price = /Book for €(\d+)/.exec(buttonText)[1];

          return car;
        });
      });

      destinations["trips"][tripURL]["route"] = route;
      destinations["trips"][tripURL]["cars"] = cars.map(car => ({
        ...car,
        startDate: this._parseDate(car.startDate),
        endDate: this._parseDate(car.endDate)
      }));
    }
    return destinations;
  }


  _parseDate(dateString) {
    const [day, month] = dateString.split('.');
    return new Date(new Date().getFullYear(), month - 1, day, 2, 0, 0).toISOString().slice(0, 10);
  }

  async _authorize() {
    return google.auth.getClient({
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  async _updateGoogleSheet(auth, range, values) {
    const resource = { values };

    await sheets.spreadsheets.values.clear({
      auth,
      spreadsheetId: this.spreadsheetId,
      range,
    });

    await sheets.spreadsheets.values.update({
      auth,
      spreadsheetId: this.spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource,
    });

    console.log('Data updated in Google Sheet');
  }

  async _convertJSONtoGoogleSheet(trips) {
    const auth = await this._authorize();

    const rows = [[
      'Origin', 'Destination', 'Route', 'Title', 'Provider', 'Start Date', 'End Date', 'Period',
      'Deposit', 'Seats', 'Doors', 'Refuel', 'Distance (km)', 'Price (€)', 'Trip URL'
    ]];

    for (const tripURL in trips["trips"]) {
      trips["trips"][tripURL].cars.forEach(car => {
        rows.push([
          trips["trips"][tripURL].origin,
          trips["trips"][tripURL].destination,
          trips["trips"][tripURL].route,
          car.title,
          car.provider,
          car.startDate,
          car.endDate,
          car.period,
          car.deposit,
          car.seats,
          car.doors,
          car.refuel,
          car.distance,
          car.price,
          tripURL
        ]);
      });
    }

    await this._updateGoogleSheet(auth, 'Sheet1', rows);
  }

  async _saveJSONtoFile(trips) {
    this._writeToFile(trips);
  }

  async _readFromFile() {
    return JSON.parse(fs.readFileSync(this.tripsJSONfile));
  }

  async run() {
    const page = await this._getBrowserPage();
    const sitemapResponse = await this._fetchSitemap(page);
    const urls = await this._parseSitemap(sitemapResponse);
    let destinations = this._extractDestinations(urls);

    destinations = await this._fetchPickupLocations(page, destinations);
    await page.browser().close();

    //this._saveJSONtoFile(destinations);
    //let destinations = await this._readFromFile();
    this._convertJSONtoGoogleSheet(destinations);
  }
}

const scraper = new MovacarScraper(sitemapURL, spreadsheetId);
scraper.run();
