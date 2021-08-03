const puppeteer = require('puppeteer');
const fs = require('fs');
const https = require('https');

const browserURL = 'http://127.0.0.1:21222';
const confluence_host = 'confluence.eu.company.com';
const user_list_path = '/dopeopledirectorysearch.action?startIndex=';
const user_page_path = '/rest/cup/1.0/profile/';

function requestInterceptor(request) {
  let requestURL = request.url();

  if (requestURL.match('.(png|jpg|jpeg|gif|tiff|js|css|woff|woff2|ttf|eot)$')) {
    request.abort();
  } else {
    request.continue();
  }
}

async function pageOpen(page, url) {
  try {
    await page.goto(url);
  } catch (e) {
    console.log(e);
  }
}

async function get_users(page) {
  try {
    const users_list_handle = await page.evaluateHandle(() =>
      Array.prototype.slice
        .call(document.querySelectorAll('.profile-macro[data-username]'))
        ?.map(node => [node?.dataset?.username])
    );

    return users_list_handle.jsonValue();
  } catch (e) {
    console.log(e);
  }
}

async function get_user_attributes(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      res.on('data', d => {
        let user_attributes = JSON.parse(d);
        resolve(user_attributes);
      });
    });

    req.on('error', error => {
      console.error(error);
      reject(error);
    });

    req.end();
  });
}

(async () => {
  const browser = await puppeteer.connect({browserURL});
  const context = await browser.browserContexts()[0];
  const page = await context.newPage();
  await page.setRequestInterception(true);
  page.on('request', requestInterceptor);

  let users = {};
  let users_length = -1;

  while (users_length < Object.keys(users).length) {
    users_length = Object.keys(users).length;

    await pageOpen(page, 'https://' + confluence_host + user_list_path + Object.keys(users).length);
    let page_users = Object.fromEntries(await get_users(page));

    users = Object.assign(users, page_users);
  }

  const credentials = (await page.cookies()).filter(
    cookie => cookie.name === 'seraph.confluence'
  )[0];

  let options = {
    hostname: confluence_host,
    path: user_page_path,
    method: 'GET',
    headers: {
      Cookie: credentials.name + '=' + credentials.value,
    },
  };

  for (username in users) {
    options.path = user_page_path + username;
    users[username] = await get_user_attributes(options);
    console.log(username, users[username]);
  }

  let users_data = JSON.stringify(users);
  fs.writeFileSync('confluence_users.json', users_data);

  await page.close();

  return 0;
})();
