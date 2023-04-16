# puppeteer-automations

Some interesting browser automation use-cases implemented

## Puppeteer hints

Run a Puppeteer on an interactive browser window:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

and copy the websocket URL shown and change it [here](https://github.com/max-ostapenko/puppeteer-automations/blob/331004d45a14025c083df4319c4d39114add0a1c/src/funcs/browser.js#L13).
