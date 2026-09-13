const path = require('path');
const fs = require('fs');
const { launchBrowser, resolveChannel } = require('../funcs/browser');

async function main() {
  const channel = resolveChannel();
  const browser = await launchBrowser();
  if (!browser) {
    throw new Error(`Failed to launch ${channel.name} instance.`);
  }

  try {
    const page = await browser.newPage();
    await page.goto('chrome://flags');

    // Wait until the flags-app WebUI element and its dataset are available
    await page.waitForFunction(() => {
      const app = document.querySelector('body > flags-app');
      return Boolean(
        app &&
          app.data &&
          Array.isArray(app.data.supportedFeatures) &&
          app.data.supportedFeatures.length > 0
      );
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
      channel: channel.id,
      version: browserVersion,
      counts: {
        supported: flags.supported.length,
        unsupported: flags.unsupported.length,
        total: flags.supported.length + flags.unsupported.length,
      },
      supported: flags.supported,
      unsupported: flags.unsupported,
    };

    // Output file: flags.json for Canary, flags.<channel>.json for other channels
    const filename = channel.id === 'canary' ? 'flags.json' : `flags.${channel.id}.json`;
    const outputPath = path.join(__dirname, filename);
    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2) + '\n');

    console.log(`Successfully parsed ${channel.name} (${browserVersion}):`);
    console.log(`- Channel:                 ${channel.id}`);
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
