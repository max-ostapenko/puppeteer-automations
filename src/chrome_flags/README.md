# Chrome Flag Experiments Tracker

## Description

Google Chrome runs hundreds of experimental feature flags across releases. Identifying what changed, what was added or deprecated, or which flags were enabled by default across releases can be difficult.

This tool extracts Chrome's full experimental flag catalog via Puppeteer into structured JSON (`flags.json`), allowing you to track changes over time using version control diffs.

## How It Works

1. Launches Google Chrome Canary via `src/funcs/browser.js`.
2. Navigates to `chrome://flags` and accesses the internal WebUI data model (`flags-app.data`).
3. Extracts full metadata for each experiment:
   - `id`: Internal feature flag key (e.g., `actor-observe-page-content-default`)
   - `name`: Human-readable experiment title
   - `description`: Complete description text
   - `isDefault`: Whether the flag is currently set to default
   - `platforms`: Supported operating systems (`Mac`, `Windows`, `Linux`, `ChromeOS`, `Android`, etc.)
   - `options`: Available selection values (`Default`, `Enabled`, `Disabled`, parameters)
4. Saves deterministic, sorted records to `flags.json` categorized by `supported` and `unsupported` features.

## Usage

A channel flag is **required** (`--channel=<name>` or shorthand `--canary`, `--chrome`, `--beta`, `--dev`). There are no implicit defaults.

### Run Scan

Scan Chrome experiment flags for an explicitly specified channel:

```bash
# Scan Google Chrome Canary -> flags.json
npm run chrome:flags_scan -- --canary
# Or: npm run chrome:flags_scan -- --channel=canary

# Scan Standard Google Chrome -> flags.chrome.json
npm run chrome:flags_scan -- --chrome
# Or: npm run chrome:flags_scan -- --channel=chrome

# Scan Beta or Dev channels
npm run chrome:flags_scan -- --beta
npm run chrome:flags_scan -- --dev
```

### Inspect Changes

```bash
# Check Canary diffs
git diff src/chrome_flags/flags.json

# Check Standard Chrome diffs
git diff src/chrome_flags/flags.chrome.json
```

### Enable Curated Power Flags

To enable cutting-edge features (On-device AI, DevTools, Autofill, Google Wallet, Speed, and Hardware Security) directly into your local Chrome profile:

```bash
# Apply to Google Chrome Canary
npm run chrome:enable_flags -- --canary
npm run chrome:enable_flags -- --canary --restart

# Apply to Standard Google Chrome
npm run chrome:enable_flags -- --chrome
npm run chrome:enable_flags -- --chrome --restart
```
