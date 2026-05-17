const { launchBrowser } = require('../funcs/browser');
const fs = require("fs");
const prettier = require("prettier");

async function main() {
  // Launch Chrome.
  const browser = await launchBrowser();

  // Open the 'chrome://flags' page.
  const page = await browser.newPage();
  await page.goto("chrome://flags");

  // Select the element using document.querySelector("body > flags-app").shadowRoot.querySelector("#flagsTemplate")
  const flagsTemplate = await page.evaluate(() => {
    const flagsApp = document.querySelector("body > flags-app");
    const flagsTemplate = flagsApp.shadowRoot.querySelector("#flagsTemplate");

    return flagsTemplate.innerHTML;
  });

  // Format the HTML using Prettier and save it to a file.
  const formattedFlags = await prettier.format(flagsTemplate, {
    parser: "html",
    htmlWhitespaceSensitivity: "ignore",
    printWidth: 250,
  });

  console.log(formattedFlags);

  fs.writeFileSync(__dirname + "/flags.html", formattedFlags);

  // Close the browser.
  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
