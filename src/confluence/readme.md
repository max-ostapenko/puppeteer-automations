# Parse list of users from confluence

Puppeteer is configured forto connect to use an installed local browser application.

We'll need to shut down Google Chrome application completely on the machine, and do the following steps:

1. run Google Chrome with remote debugging port activated:

    for Mac:

    `/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=21222`

2. run the crawling application:

    `node ./src/idealo/confluence_users.js`
