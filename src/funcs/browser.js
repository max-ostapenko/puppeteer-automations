const puppeteer = require('puppeteer');
const path = require('path');
const os = require('os');

const CHANNELS = {
  canary: {
    id: 'canary',
    name: 'Google Chrome Canary',
    appPath: '/Applications/Google Chrome Canary.app',
    executablePath:
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    localStatePath: path.join(
      os.homedir(),
      'Library/Application Support/Google/Chrome Canary/Local State'
    ),
  },
  chrome: {
    id: 'chrome',
    name: 'Google Chrome',
    appPath: '/Applications/Google Chrome.app',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    localStatePath: path.join(
      os.homedir(),
      'Library/Application Support/Google/Chrome/Local State'
    ),
  },
  beta: {
    id: 'beta',
    name: 'Google Chrome Beta',
    appPath: '/Applications/Google Chrome Beta.app',
    executablePath:
      '/Applications/Google Chrome Beta.app/Contents/MacOS/Google Chrome Beta',
    localStatePath: path.join(
      os.homedir(),
      'Library/Application Support/Google/Chrome Beta/Local State'
    ),
  },
  dev: {
    id: 'dev',
    name: 'Google Chrome Dev',
    appPath: '/Applications/Google Chrome Dev.app',
    executablePath:
      '/Applications/Google Chrome Dev.app/Contents/MacOS/Google Chrome Dev',
    localStatePath: path.join(
      os.homedir(),
      'Library/Application Support/Google/Chrome Dev/Local State'
    ),
  },
};

/**
 * Resolves the target Chrome channel from:
 * 1. Explicit argument ('chrome', 'canary', etc.)
 * 2. CLI flag --channel=<channel> or -c <channel>
 * 3. Boolean flags --chrome, --canary, --beta, --dev, --stable
 * 4. Environment variable CHROME_CHANNEL
 *
 * Throws an error if no channel flag is specified (no defaults).
 */
function resolveChannel(explicitChannel, { required = true } = {}) {
  const validChannels = Object.keys(CHANNELS).join(', ');

  if (explicitChannel && typeof explicitChannel === 'string') {
    const key = explicitChannel.toLowerCase().trim();
    if (key === 'stable') return CHANNELS.chrome;
    if (CHANNELS[key]) return CHANNELS[key];
    throw new Error(`Unknown Chrome channel "${explicitChannel}". Available channels: ${validChannels}`);
  }

  const args = process.argv.slice(2);
  const channelArg =
    args.find((a) => a.startsWith('--channel='))?.split('=')[1] ||
    (args.includes('-c') ? args[args.indexOf('-c') + 1] : null);

  if (channelArg) {
    const key = channelArg.toLowerCase().trim();
    if (key === 'stable') return CHANNELS.chrome;
    if (CHANNELS[key]) return CHANNELS[key];
    throw new Error(`Unknown Chrome channel "${channelArg}". Available channels: ${validChannels}`);
  }

  if (args.includes('--chrome') || args.includes('--stable')) return CHANNELS.chrome;
  if (args.includes('--canary')) return CHANNELS.canary;
  if (args.includes('--beta')) return CHANNELS.beta;
  if (args.includes('--dev')) return CHANNELS.dev;

  const env = process.env.CHROME_CHANNEL?.toLowerCase()?.trim();
  if (env) {
    if (env === 'stable') return CHANNELS.chrome;
    if (CHANNELS[env]) return CHANNELS[env];
    throw new Error(`Unknown CHROME_CHANNEL "${env}". Available channels: ${validChannels}`);
  }

  if (required) {
    throw new Error(
      `Chrome channel flag is required (no default).\n` +
      `Please specify one of the following flags:\n` +
      `  --channel=<name> (e.g. --channel=canary or --channel=chrome)\n` +
      `  or shorthand: --canary, --chrome, --beta, --dev\n` +
      `Available channels: ${validChannels}`
    );
  }

  return null;
}

const launchBrowser = async (headless = 'new', channelOption) => {
  const channel = resolveChannel(channelOption);
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: channel.executablePath,
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
    browser._channel = channel;
    return browser;
  } catch (e) {
    console.error(`Unable to launch ${channel.name} at ${channel.executablePath}`, e);
    throw e;
  }
};

module.exports = { launchBrowser, resolveChannel, CHANNELS };
