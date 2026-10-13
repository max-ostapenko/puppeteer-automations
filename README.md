# Puppeteer Automations

A collection of autonomous web scraping and browser automation utilities built with [Puppeteer](https://pptr.dev/).

---

## Active Projects

### 1. 🚐 Movacar Route Scraper & Notifier (`src/movacar/`)

An automated monitor for European 1€ one-way relocation deals from [Movacar](https://www.movacar.com/) (Roadsurfer, IndieCampers, etc.).

- **Features**:
  - **High-Speed Parallel Scraping**: Concurrent multi-tab crawler scraping ~55 departure origins and 270+ live deals in ~30 seconds.
  - **Multi-Search Profiles**: Configured via `src/movacar/config.json`
  - **Included Days Prioritization**: Sorts deals by included (free) days first, displaying transparent duration breakdown (e.g. `4d incl. (+2d extra)`).
  - **Smart Alerts**: Native macOS desktop notifications (`osascript`) and optional webhook support (`MOVACAR_WEBHOOK_URL`).
  - **Deduplication**: Remembers seen deals in `seen_offers.json` to prevent repetitive alerts.
  - **Automation Daemon**: Background 6-hour execution via macOS LaunchAgent.

#### Configuration

Route rules and filters can be customized in `src/movacar/config.json`:

```bash
# Copy the example template to get started
cp src/movacar/config.example.json src/movacar/config.json
```

If `config.json` is not present, the scraper defaults to `src/movacar/config.example.json`.

#### Running Movacar Manually

```bash
npm run movacar:routes_scan
```

Logs are written to `~/Library/Logs/movacar/scraper.log`.

#### Viewing the Interactive Dashboard

```bash
npm run movacar:dashboard
```

Opens the local static deal dashboard (`src/movacar/index.html`) in your browser with real-time profile tabs, search, days/pace filters, and sortable columns.

#### Background Scheduling (macOS LaunchAgent)

To run the scraper automatically every 6 hours in the background:

```bash
# Automatically install and schedule the LaunchAgent
npm run movacar:setup_daemon
```

* Alternatively, copy and customize `scripts/com.movacar.scraper.plist.example` to `~/Library/LaunchAgents/` and load via `launchctl`.
* To monitor or edit the schedule via a GUI, use **LaunchControl**: `brew install --cask launchcontrol`.

---

### 2. 🧪 Chrome Flags Tracker (`src/chrome_flags/`)

Monitors and highlights experimental feature flag updates across new versions of Google Chrome.

#### Running Flags Tracker

```bash
# Scan Canary -> src/chrome_flags/flags.json
npm run chrome:flags_scan -- --canary

# Scan Standard Chrome -> src/chrome_flags/flags.chrome.json
npm run chrome:flags_scan -- --chrome
```

#### Enabling Power Flags (AI, DevTools, Autofill, Payments)

Configures cutting-edge experimental features into your local user profile (channel flag is required):

```bash
# Apply to Google Chrome Canary
npm run chrome:enable_flags -- --canary

# Apply to Standard Google Chrome
npm run chrome:enable_flags -- --chrome
```

---

## Prerequisites

- **Node.js** v20+ / v24+
- **Google Chrome Canary** installed at `/Applications/Google Chrome.app`
- macOS for desktop notifications (`osascript`)
