const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const { resolveChannel, CHANNELS } = require('../funcs/browser');

const RECOMMENDED_FLAGS = [
  // 1. AI, Agents & Assistant
  {
    key: 'actor-observe-page-content-default@1',
    id: 'actor-observe-page-content-default',
    name: 'Actor observe page content default',
    desc: 'Captures full DOM page content by default for AI agent tools',
  },
  {
    key: 'actor-observe-screenshot-default@1',
    id: 'actor-observe-screenshot-default',
    name: 'Actor observe screenshot default',
    desc: 'Captures visual viewport screenshots by default for AI agent tools',
  },
  {
    key: 'ai-overlay-dialog@1',
    id: 'ai-overlay-dialog',
    name: 'AI Overlay Dialog',
    desc: 'Enables native desktop AI Overlay floating dialog',
  },
  {
    key: 'aim-3p-entrypoint@1',
    id: 'aim-3p-entrypoint',
    name: 'AIM 3P Entrypoint',
    desc: 'Enables Omnibox AI Mode (AIM) entrypoint for searches',
  },
  {
    key: 'password-change-with-glic@1',
    id: 'password-change-with-glic',
    name: 'Password change with Glic',
    desc: 'Automates credential changes through Chrome Glic AI assistant',
  },
  {
    key: 'glic-context-menu-below-search@1',
    id: 'glic-context-menu-below-search',
    name: 'Glic Context Menu Below Search',
    desc: 'Adds Glic assistant actions directly to browser context menus',
  },

  // 2. DevTools & Web Platform
  {
    key: 'devtools-enable-durable-messages@1',
    id: 'devtools-enable-durable-messages',
    name: 'Preserve HTTP bodies across navigations',
    desc: 'Preserves full HTTP request & response bodies across navigations in DevTools',
  },
  {
    key: 'devtools-aria-live-recording@1',
    id: 'devtools-aria-live-recording',
    name: 'ARIA-Live announcements recorder',
    desc: 'Records and audits live screen-reader accessibility announcements in DevTools',
  },
  {
    key: 'canvas-accessibility@1',
    id: 'canvas-accessibility',
    name: 'Canvas Accessibility',
    desc: 'Synthesizes accessibility trees for HTML5 Canvas elements',
  },
  {
    key: 'enable-webgpu-developer-features',
    id: 'enable-webgpu-developer-features',
    name: 'WebGPU Developer Features',
    desc: 'Unlocks experimental WebGPU APIs, debug shaders, and profiling extensions',
  },
  {
    key: 'cws-review-prompting-native-ui@1',
    id: 'cws-review-prompting-native-ui',
    name: 'CWS Review Prompting Native UI',
    desc: 'Native in-browser management UI for reviewing Chrome Web Store extensions',
  },

  // 3. Autofill, Payments & Wallet
  {
    key: 'autofill-enable-ai-based-amount-extraction@1',
    id: 'autofill-enable-ai-based-amount-extraction',
    name: 'AI-based checkout amount extraction',
    desc: 'Extracts real checkout amounts from e-commerce checkout pages via AI',
  },
  {
    key: 'autofill-enable-ai-card-recommendation@1',
    id: 'autofill-enable-ai-card-recommendation',
    name: 'AI-based card recommendation',
    desc: 'Recommends the best card based on category rewards, cashback, and benefits',
  },
  {
    key: 'autofill-enable-wallet-direct-offers@1',
    id: 'autofill-enable-wallet-direct-offers',
    name: 'Wallet Direct Offers in Autofill',
    desc: 'Syncs active Google Wallet merchant coupons and discounts directly into autofill',
  },
  {
    key: 'autofill-enable-travel-category-and-merchant-benefits-from-curinos@1',
    id: 'autofill-enable-travel-category-and-merchant-benefits-from-curinos',
    name: 'Card perks & travel benefits preview',
    desc: 'Displays card rewards and benefits inline inside the credit card selection dropdown',
  },
  {
    key: 'autofill-enable-omnibox-autofill@1',
    id: 'autofill-enable-omnibox-autofill',
    name: 'Omnibox payment chip',
    desc: 'Shows a 1-click checkout chip in the address bar on payment forms',
  },
  {
    key: 'autofill-enable-save-and-fill@1',
    id: 'autofill-enable-save-and-fill',
    name: '1-Click Save and Fill',
    desc: 'Offers to save and fill newly typed cards in a single click',
  },
  {
    key: 'autofill-enable-pay-now-pay-later-tabs@1',
    id: 'autofill-enable-pay-now-pay-later-tabs',
    name: 'Pay Now / Pay Later tabs',
    desc: 'Integrates BNPL (Klarna / Affirm) tabs directly into payments autofill',
  },

  // 4. Hardware Security & Privacy
  {
    key: 'enable-cookie-binding-cookie-upgrade@1',
    id: 'enable-cookie-binding-cookie-upgrade',
    name: 'Hardware-bound session cookies',
    desc: 'Cryptographically binds session cookies to local Secure Enclave / TPM',
  },
  {
    key: 'enable-global-privacy-control@1',
    id: 'enable-global-privacy-control',
    name: 'Global Privacy Control (GPC)',
    desc: 'Sends Sec-GPC: 1 headers with every outbound request',
  },
  {
    key: 'child-process-security-policy-rust@1',
    id: 'child-process-security-policy-rust',
    name: 'Rust Security Policy',
    desc: 'Enables experimental Rust-based ChildProcessSecurityPolicy',
  },

  // 5. Built-in On-Device AI (Gemini Nano / window.ai)
  {
    key: 'prompt-api@1',
    id: 'prompt-api',
    name: 'Prompt API (window.ai)',
    desc: 'Enables client-side LLM inference in the browser via window.ai.languageModel',
  },
  {
    key: 'prompt-api-multimodal-input@1',
    id: 'prompt-api-multimodal-input',
    name: 'Multimodal Prompt API',
    desc: 'Extends window.ai to accept image and audio inputs alongside text',
  },
  {
    key: 'summarizer-api@1',
    id: 'summarizer-api',
    name: 'Summarizer API',
    desc: 'Native client-side text summarization API (window.ai.summarizer)',
  },
  {
    key: 'writer-api@1',
    id: 'writer-api',
    name: 'Writer API',
    desc: 'Native on-device text drafting API (window.ai.writer)',
  },
  {
    key: 'rewriter-api@1',
    id: 'rewriter-api',
    name: 'Rewriter API',
    desc: 'Native on-device text rewriting and tone-adjustment API (window.ai.rewriter)',
  },

  // 6. High-Performance Browsing, Speed & Graphics
  {
    key: 'enable-zero-copy@1',
    id: 'enable-zero-copy',
    name: 'Zero-copy rasterizer',
    desc: 'Raster threads write directly to GPU memory associated with tiles on Apple Silicon',
  },
  {
    key: 'omnibox-dui-prerendering@1',
    id: 'omnibox-dui-prerendering',
    name: 'Omnibox Direct URL Prerendering',
    desc: 'Pre-renders web pages in memory as you type in the address bar for 0ms load',
  },
  {
    key: 'prerender2@1',
    id: 'prerender2',
    name: 'Prerendering (Speculation Rules)',
    desc: 'Enables background speculative pre-rendering for upcoming clicks',
  },
  {
    key: 'enable-quic@1',
    id: 'enable-quic',
    name: 'Experimental QUIC / HTTP3',
    desc: 'Lowers handshake latency and packet loss recovery over HTTP/3',
  },

  // 7. Workspace, Split View & Tabs
  {
    key: 'split-view-horizontal@1',
    id: 'split-view-horizontal',
    name: 'Stacked Split Views',
    desc: 'Allows side-by-side and stacked split tab views inside a single window',
  },
  {
    key: 'auto-picture-in-picture-on-window-occluded@1',
    id: 'auto-picture-in-picture-on-window-occluded',
    name: 'Auto PiP on Window Occlusion',
    desc: 'Automatically pops video into Picture-in-Picture when covered by another window',
  },
  {
    key: 'tab-group-ribbon@1',
    id: 'tab-group-ribbon',
    name: 'Vertical Tab Group Ribbon',
    desc: 'Displays a vertical ribbon on the left side of the window to switch tab workspaces',
  },
  {
    key: 'tab-groups-focusing@1',
    id: 'tab-groups-focusing',
    name: 'Tab Groups Focus Mode',
    desc: 'Constrains the tab strip strictly to the active group, hiding visual clutter',
  },

  // 8. Distraction-Free Reading Mode
  {
    key: 'read-anything-with-readability-enabled@1',
    id: 'read-anything-with-readability-enabled',
    name: 'Readability.js Distiller',
    desc: 'Distills complex articles into clean markdown-style distraction-free reading',
  },
  {
    key: 'read-anything-read-aloud-experimental-playback-ui@1',
    id: 'read-anything-read-aloud-experimental-playback-ui',
    name: 'Read Aloud Playback UI',
    desc: 'Text-to-speech player with synced real-time phrase and word highlighting',
  },
  {
    key: 'read-anything-docs-integration@1',
    id: 'read-anything-docs-integration',
    name: 'Reading Mode for Google Docs',
    desc: 'Extends reader mode distillation directly to Google Docs documents',
  },

  // 9. Next-Gen JavaScript & WebAssembly Engine
  {
    key: 'enable-javascript-harmony',
    id: 'enable-javascript-harmony',
    name: 'Experimental ECMAScript Features',
    desc: 'Unlocks Stage 3/4 JavaScript features in the V8 engine ahead of shipping',
  },
  {
    key: 'enable-experimental-webassembly-features',
    id: 'enable-experimental-webassembly-features',
    name: 'Experimental WebAssembly',
    desc: 'Unlocks WasmFX stack switching, relaxed SIMD, and shared-everything threads',
  },
];

function isChromeRunning(appName) {
  try {
    const out = execSync(`pgrep -f "${appName}.app/Contents/MacOS/${appName}" || true`).toString().trim();
    return out.length > 0;
  } catch {
    return false;
  }
}

function enableFlags(options = {}) {
  const channel = resolveChannel(options.channel);

  if (!fs.existsSync(channel.localStatePath)) {
    throw new Error(`${channel.name} Local State file not found at: ${channel.localStatePath}`);
  }

  const running = isChromeRunning(channel.name);
  if (running && !options.restart) {
    console.warn(`\n⚠️  WARNING: ${channel.name} is currently running!`);
    console.warn('Chrome flushes in-memory preferences on exit, which may overwrite changes.');
    console.warn('To ensure changes take effect:');
    console.warn(`  1. Quit ${channel.name} (Cmd + Q)`);
    console.warn(`  2. Run: npm run chrome:enable_flags -- --channel=${channel.id}`);
    console.warn(`  3. Reopen ${channel.name}`);
    console.warn(`Or run with --restart to automatically quit, apply, and relaunch ${channel.name}.\n`);
  }

  // Backup original Local State file
  const backupPath = `${channel.localStatePath}.backup.${Date.now()}`;
  fs.copyFileSync(channel.localStatePath, backupPath);
  console.log(`[${channel.name}] Backed up Local State to: ${backupPath}`);

  if (running && options.restart) {
    console.log(`Closing ${channel.name} to flush memory state...`);
    execSync(`osascript -e 'tell application "${channel.name}" to quit' || true`);
    // Wait for process termination
    let waited = 0;
    while (isChromeRunning(channel.name) && waited < 10) {
      execSync('sleep 0.5');
      waited += 0.5;
    }
  }

  const raw = fs.readFileSync(channel.localStatePath, 'utf8');
  const localState = JSON.parse(raw);

  if (!localState.browser) {
    localState.browser = {};
  }
  if (!Array.isArray(localState.browser.enabled_labs_experiments)) {
    localState.browser.enabled_labs_experiments = [];
  }

  const existing = new Set(localState.browser.enabled_labs_experiments);
  let added = 0;

  for (const flag of RECOMMENDED_FLAGS) {
    if (!existing.has(flag.key)) {
      existing.add(flag.key);
      added++;
    }
  }

  localState.browser.enabled_labs_experiments = Array.from(existing);
  fs.writeFileSync(channel.localStatePath, JSON.stringify(localState, null, 2));

  console.log(`\n Successfully enabled ${RECOMMENDED_FLAGS.length} experimental flags (${added} new) for ${channel.name}:`);
  RECOMMENDED_FLAGS.forEach((f) => {
    console.log(`  ✓ ${f.name} (#${f.id})`);
  });

  if (options.restart) {
    console.log(`\nRelaunching ${channel.name} with new flags...`);
    execSync(`open -a "${channel.appPath}"`);
  }

  console.log(`\nDone! All flags are configured in ${channel.name} Local State.`);
}

module.exports = { RECOMMENDED_FLAGS, enableFlags, resolveChannel, CHANNELS };

if (require.main === module) {
  const args = process.argv.slice(2);
  const shouldRestart = args.includes('--restart');
  const channel = resolveChannel();

  enableFlags({ restart: shouldRestart, channel: channel.id });
}
