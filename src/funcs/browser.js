const launchBrowser = async () => {
  const puppeteer = require('puppeteer');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
    });
    return browser;
  } catch (e) {
    console.error('Unable to launch browser', e);
  }
};

module.exports = {launchBrowser};
