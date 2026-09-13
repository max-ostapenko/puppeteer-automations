const path = require('path');
const fs = require('fs');
const { launchBrowser } = require('../funcs/browser');

async function main() {
  const browser = await launchBrowser();
  if (!browser) {
    throw new Error('Failed to launch browser instance.');
  }

  try {
    const page = await browser.newPage();
    await page.goto('chrome://flags');

    // Wait until the flags-app WebUI element and its dataset are available
    await page.waitForFunction(() => {
      const app = document.querySelector('body > flags-app');
      return Boolean(app && app.data && Array.isArray(app.data.supportedFeatures) && app.data.supportedFeatures.length > 0);
    });

    const browserVersion = await browser.version();

    const flags = await page.evaluate(() => {
      const app = document.querySelector('body > flags-app');

      const cleanFlag = (f) => ({
        id: f.internal_name,
        name: f.name,
        description: f.description,
        isDefault: f.is_default,
        platforms: f.supported_platforms || [],
        options: (f.options || []).map((opt) => ({
          name: opt.description,
          selected: opt.selected,
        })),
      });

      const sortById = (a, b) => a.id.localeCompare(b.id);

      return {
        supported: (app.data.supportedFeatures || []).map(cleanFlag).sort(sortById),
        unsupported: (app.data.unsupportedFeatures || []).map(cleanFlag).sort(sortById),
      };
    });

    const payload = {
      version: browserVersion,
      counts: {
        supported: flags.supported.length,
        unsupported: flags.unsupported.length,
        total: flags.supported.length + flags.unsupported.length,
      },
      supported: flags.supported,
      unsupported: flags.unsupported,
    };

    const outputPath = path.join(__dirname, 'flags.json');
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + '\n');

    console.log(`Successfully parsed ${browserVersion}:`);
    console.log(`- Supported experiments:   ${flags.supported.length}`);
    console.log(`- Unsupported experiments: ${flags.unsupported.length}`);
    console.log(`- Total experiments:       ${payload.counts.total}`);
    console.log(`- Output written to:       ${outputPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
