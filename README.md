# puppeteer-automations

Some interesting browser automation use-cases implemented

## Puppeteer hints

Run a Puppeteer on an interactive browser window:

```bash
/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary --remote-debugging-port=9222
```

and copy the websocket URL shown and change it [here](./src/funcs/browser.js#L13).
