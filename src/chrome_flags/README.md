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

### Run Scan

```bash
npm run chrome:flags_scan
```

### Inspect Changes

```bash
git diff src/chrome_flags/flags.json
```
