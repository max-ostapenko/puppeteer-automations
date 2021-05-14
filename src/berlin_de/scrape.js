const extractSlots = async (page) => {
  try {
    // console.log(await page.content());

    let test = await page.$eval('td.buchbar', (availableSlot) => {
      console.log(availableSlot);
      try {
        const day = availableSlot.innerHTML;
        console.log(day);

        const sgSend = require('../funcs/sendgrid');
        sgSend((subject = 'Driving licence termin'), (text = day));

        // for (let i = 0; i < availableSlot.parents.length; i++) {}
        return day;
      } catch (e) {
        console.error('Unable to extract slots data', e);
      }
    });
    console.log(test);
  } catch (e) {
    console.error('Unable to extract slots', e);
  }
};

const scrapePersons = async () => {
  const {launchChrome} = require('../funcs/browser');

  const [newPage, exitChrome] = await launchChrome();
  const [page] = await newPage();

  if (!page) return;

  const url =
    'https://service.berlin.de/terminvereinbarung/termin/tag.php?termin=1&anliegen[]=121598&dienstleisterlist=122210,122217,122219,122227,122231,122238,122243,122252,122260,122262,122254,122271,122273,122277,122280,122282,122284,327539,122291,122285,122286,122296,150230,122301,122297,122294,122312,122304,122311,122309,122281,122279,122276,122274,122267,122246,122251,122257,122208,122226&herkunft=http%3A%2F%2Fservice.berlin.de%2Fdienstleistung%2F121598%2F';
  console.log('Opening ' + url);

  try {
    await page.goto(url, {
      waitUntil: 'networkidle0',
    });

    await extractSlots(await page);
  } catch (e) {
    console.error('Unable to visit ' + url, e);
    exitChrome();
    return;
  }

  exitChrome();
};

module.exports = scrapePersons;
