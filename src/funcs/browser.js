const puppeteer = require('puppeteer');

const launchBrowser = async (headless = 'new') => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
      headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled',
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
      },
    });
    return browser;
  } catch (e) {
    console.error('Unable to launch browser', e);
  }
};

module.exports = {launchBrowser};
