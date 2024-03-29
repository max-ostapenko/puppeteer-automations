const scrape = async () => {
    const { launchBrowser } = require('../funcs/browser');

    const browser = await launchBrowser();
    const page = (await browser.pages())[0];

    const session = await page.target().createCDPSession();
    const { windowId } = await session.send('Browser.getWindowForTarget');
    await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } });

    const url =
        'https://service.berlin.de/terminvereinbarung/termin/tag.php?termin=1&anliegen[]=120686&dienstleisterlist=122210,122217,327316,122219,327312,122227,327314,122231,327346,122243,327348,122254,122252,329742,122260,329745,122262,329748,122271,327278,122273,327274,122277,327276,330436,122280,327294,122282,327290,122284,327292,122291,327270,122285,327266,122286,327264,122296,327268,150230,329760,122297,327286,122294,327284,122312,329763,122314,329775,122304,327330,122311,327334,122309,327332,317869,122281,327352,122279,329772,122283,122276,327324,122274,327326,122267,329766,122246,327318,122251,327320,122257,327322,122208,327298,122226,327300&herkunft=http%3A%2F%2Fservice.berlin.de%2Fdienstleistung%2F120686%2F'
    // Fahrererlaubnis 'https://service.berlin.de/terminvereinbarung/termin/tag.php?termin=1&anliegen[]=121627&dienstleisterlist=122210,122217,122219,122227,122231,122238,122243,122254,331011,349977,122252,122260,122262,122271,122273,122277,122282,122284,122291,122285,122286,122296,150230,122297,122294,122312,122314,122304,122311,122309,317869,122281,122279,122276,122274,122267,122246,122251,327653,122257,122208,122226&herkunft=http%3A%2F%2Fservice.berlin.de%2Fdienstleistung%2F121627%2F';

    await page.goto(url, {
        waitUntil: 'networkidle0',
    });

    let availableSlots = await page.$$('td.buchbar')

    if (availableSlots.length == 0) {
        //chrome.close();
        console.log('No slots available');
    } else {
        console.log('Slots available');
        console.log(await availableSlots[0].evaluate(x => x.textContent));
    }

};

scrape();
