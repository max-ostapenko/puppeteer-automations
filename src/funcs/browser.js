const puppeteer = require('puppeteer');

const launchBrowser = async (headless = false) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary",
      headless,
    });
    return browser;
  } catch (e) {
    console.error('Unable to launch browser', e);
  }
};

module.exports = {launchBrowser};
