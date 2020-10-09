/**
 * Copyright 2018 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author ebidel@ (Eric Bidelman)
 */

/**
 * Discovers all the pages in site or single page app (SPA) and creates
 * a tree of the result in ./output/<site slug/crawl.json. Optionally
 * takes screenshots of each page as it is visited.
 *
 * Usage:
 *   node crawlsite.js
 *   URL=https://yourspa.com node crawlsite.js
 *   URL=https://yourspa.com node crawlsite.js --screenshots
 *
 * Then open the visualizer in a browser:
 *   http://localhost:8080/html/d3tree.html
 *   http://localhost:8080/html/d3tree.html?url=../output/https___yourspa.com/crawl.json
 *
 *Start Server:
 *   node server.js
 *
 */

const fs = require('fs');
const del = require('del');
const util = require('util');
const parser = require('json2csv');
const puppeteer = require('puppeteer');
const OUT_DIR = `output/MO_CTAs`;
const root = {
    "https://www.mercedes-benz.at": {},
    "https://www.mercedes-benz.be": {},
    "https://www.mercedes-benz.ch": {},
    "https://www.mercedes-benz.cz/": {},
    "https://www.mercedes-benz.dk/": {},
    "https://www.mercedes-benz.fi/": {},
    "https://www.mercedes-benz.fr/": {},
    "https://www.mercedes-benz.gr/": {},
    "https://www.mercedes-benz.ie/": {},
    "https://www.mercedes-benz.is/": {},
    "https://www.mercedes-benz.it/": {},
    "https://www.mercedes-benz.lt/": {},
    "https://www.mercedes-benz.lu/": {},
    "https://www.mercedes-benz.lv/": {},
    "https://www.mercedes-benz.nl/": {},
    "https://www.mercedes-benz.no/": {},
    "https://www.mercedes-benz.pl/": {},
    "https://www.mercedes-benz.pt/": {},
    "https://www.mercedes-benz.se/": {},
    "https://www.mercedes-benz.co.uk/": {},
    "https://www.mercedes-benz-asia.com/": {},
    "https://www.diplomaticsales.mercedes-benz.com/": {},
    "https://www.la.mercedes-benz.com/": {},
    "https://www.mercedes-benz-mena.com/": {},
    "https://www.mercedes-benz-eastern-europe.com/": {},
    "https://www.mercedes-benz.com.ar/": {},
    "https://www.mercedes-benz.com.au/": {},
    "https://www.abu-dhabi.mercedes-benz-mena.com/": {},
    "https://www.mercedes-benz.cl/": {},
    "https://www.mercedes-benz.com.co/": {},
    "https://www.mercedes-benz.com.hk/": {},
    "https://www.mercedes-benz.co.id/": {},
    "https://www.mercedes-benz.co.in/": {},
    "https://www.mercedes-benz.co.jp/": {},
    "https://www.mercedes-benz.co.kr/": {},
    "https://www.mercedes-benz.com.my/": {},
    "https://www.mercedes-benz.co.nz/": {},
    "https://www.mercedes-benz.com.pe/": {},
    "https://www.mercedes-benz.com.sg/": {},
    "https://www.mercedes-benz.co.th/": {},
    "https://www.mercedes-benz.com.tr/": {},
    "https://www.mercedes-benz.com.tw/": {},
    "https://www.mercedes-benz.com.vn/": {},
    "https://www.mercedes-benz.co.za/": {},
    "https://www.mercedes-benz.bg/": {},
    "https://www.mercedes-benz.com.cy/": {},
    "https://www.mercedes-benz.ee/": {},
    "https://www.mercedes-benz.hr/": {},
    "https://www.mercedes-benz.hu/": {},
    "https://www.mercedes-benz.com.mt/": {},
    "https://www.mercedes-benz-north-cyprus.com/": {},
    "https://www.mercedes-benz.ro/": {},
    "https://www.mercedes-benz.rs/": {},
    "https://www.mercedes-benz.ru/": {},
    "https://www.mercedes-benz.si/": {},
    "https://www.mercedes-benz.sk/": {},
    "https://www.mercedes-benz.ua/": {}
};

/* structure
url
status
case
linkDestination
*/
let myResult = [];

function mkdirSync(dirPath) {
    try {
        dirPath.split('/').reduce((parentPath, dirName) => {
            const currentPath = parentPath + dirName;
            if (!fs.existsSync(currentPath)) {
                fs.mkdirSync(currentPath);
            }
            return currentPath + '/';
        }, '');
    } catch (err) {
        if (err.code !== 'EEXIST') {
            throw err;
        }
    }
}

async function getElements() {
    try {
        return [...document.querySelectorAll('#modeltabs div.modeloverview__grid')[0].getElementsByTagName('a')].map(element => element.href);
    } catch(error) {
        console.log(error);
        return [];
    }

}

function classifyElements(url, elements) {
    let classification;
    elements.forEach(href => {
        if (!href) {
            return;
        } else if (href.match('https:\/\/kampanje\.mercedes-benz\.no\/tilbud\/.*') ||
            href.match('https:\/\/oferta\.mercedes-benz\.pl\/code\/.*') ||
            href.match('https:\/\/ofertavan\.mercedes-benz\.pl\/nadwozie\/.*') ||
            href.match('https:\/\/www\.mercedes-benz\.co\.uk\/passengercars\/buy\/latest-offers.*') ||
            href.match('https:\/\/www\.mercedes-benz\..*\/passengercars\/mercedes-benz-cars\/campaigns\/.*') ||
            href.match('https:\/\/www\.mercedes-benz\..*\/passengercars\/buy\/latest-offers\/.*') ||
            href.match('https:\/\/www\.mercedes-benz\..*\/passengercars\/mercedes-benz-cars\/models\/.*\/(offers-and-services|offers\.module|tarifs)\.html.*')
        ) {
            classification = "SPECIAL_OFFER";
        } else if (href.match('https:\/\/.*\.mercedes-benz\..*\/passengercars\/mercedes-benz-cars\/car-configurator\.html.*') ||
            href.match('https:\/\/www\.mercedes-benz\..*\/passengercars\/content-pool\/tool-pages\/car-configurator\.html.*') ||
            href.match('https:\/\/voc\.i\.daimler\.com\/voc\/.*') ||
            href.match('https:\/\/voc\.mercedes-benz\.com\/van_konfigurator_VAN_.*\/vp\..*')
        ) {
            classification = "CONFIGURATOR";
        } else if (href.match('https:\/\/.*\.mercedes-benz\..*\/passengercars\/mercedes-benz-cars\/models\/.*') ||
            href.match('https:\/\/www\.mercedes-benz\..*\/osobna-vozila\/mercedes-benz-vozila\/modeli\/.*') ||
            href.match('https:\/\/www\.mercedes-benz\..*\/vans\/.*')
        ) {
            classification = "PRODUCT_PAGE";
        } else if (href.match('https:\/\/www\.mercedes-benz\..*\/passengercars\/mercedes-benz-cars\/test-drive\.html.*') ||
            href.match('https:\/\/www\.mercedes-benz\..*\/passengercars\/content-pool\/marketing-pool\/contact-forms\/test-drive-request\.html.*') ||
            href.match('https:\/\/www\.mercedes-benz\..*\/passengercars\/content-pool\/marketing-pool\/forms\/request-test-drive\.html.*') ||
            href.match('https:\/\/www\.mercedes-benz\..*\/passengercars\/content-pool\/marketing-pool\/forms\/testdriveform\.html.*') ||
            href.match('https:\/\/www\.mercedes-benz\.sk\/content\/slovakia\/sk\/passengercars\/content-pool\/marketing-pool\/contact-forms\/test-drive\.html.*') ||
            href.match('https:\/\/test-drive\.mercedes-benz\.ru\/class\/.*') ||
            href.match('https?:\/\/www\.testdrive\.mercedes-benz\.com\.tw\/service\.aspx.*')
        ) {
            classification = "TEST_DRIVE";
        } else if (href.match('https:\/\/www\.mercedes-benz\.co\.jp\/content\/japan\/ja\/passengercars\/buy\/finance\/payment-example\/.*') ||
            href.match('http:\/\/www\.mercedes-benz\.jp\/passenger\/estimate\/.*') ||
            href.match('https:\/\/www\.think-agility\.com\/en\/payment_estimator\/.*')
        ) {
            classification = "EXTERNAL_FINANCE";
        } else if (href.match('https:\/\/www\.mercedes-benz\..*\/passengercars\/mercedes-benz-cars\/eqc?-registration\.html.*') ||
            href.match('https:\/\/www\.mercedes-benz\.se\/content\/sweden\/sv\/passengercars/buy/eq-registration\/.*') ||
            href.match('https:\/\/www\.mercedes-benz\.pl\/content\/poland\/pl\/passengercars/buy/eq-registration\.html.*')
        ) {
            classification = "REGISTRATION";
        } else if (href.match('https:\/\/www\.mercedes-benz\..*\/passengercars\/mercedes-benz-cars\/vehicle-search\.html.*') ||
            href.match('https:\/\/www\.mercedes-benz\..*\/passengercars\/mercedes-benz-cars\/new-vehicles-search\.html.*')
        ) {
            classification = "VEHICLE_SEARCH";
        } else if (href.match('https:\/\/shop\.mercedes-benz\.com\/.*')
        ) {
            classification = "DCP_VEHICLE_SEARCH";
        } else {
            classification = "UNKNOWN";
        }

        myResult.push({
            "url": url,
            "status": "crawled",
            "case": classification,
            "linkDestination": href
        })
    });

}

/**
 * Crawls a URL by visiting an url, then recursively visiting any child subpages.
 * @param {!Browser} browser
 * @param {{url: string, title: string, img?: string, children: !Array<!Object>}} page Current page.
 * @param {number=} depth Current subtree depth of crawl.
 */
async function crawl(browser, url) {
    console.log(`Loading: ${url}`);

    const newPage = await browser.newPage();

    try {
        await newPage.goto(url, {
            waitUntil: 'networkidle2'
        });

        let elements = await newPage.evaluate(getElements);
        if (elements.length > 0) {
            classifyElements(url, elements);
        } else {
            myResult.push({
                "url": url,
                "status": "no_elements",
                "case": undefined,
                "linkDestination": undefined
            })
        }

    } catch(error) {
        console.log(error)
        myResult.push({
            "url": url,
            "status": "failed_to_load",
            "case": undefined,
            "linkDestination": undefined
        })
    }

    await newPage.close();

}

(async () => {

    mkdirSync(OUT_DIR); // create output dir if it doesn't exist.
    await del([`${OUT_DIR}/*`]); // cleanup after last run.

    const browser = await puppeteer.launch();

    const context = await browser.createIncognitoBrowserContext();
    for (key in root) {
        await crawl(context, key);
    }
    
    try {
        const csv = parser.parse(myResult, { fields: [ 'url', 'status', 'case', 'linkDestination' ] });
        await util.promisify(fs.writeFile)(`./${OUT_DIR}/crawled_elements.csv`, csv);
    } catch (error) {
        console.error(error);
    }

    await browser.close();

})();