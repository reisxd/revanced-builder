const fetch = require('node-fetch');
const { readFileSync } = require('node:fs');

async function fetchPackages(packages) {
  const request = await fetch(
    `https://www.apkmirror.com/wp-json/apkm/v1/app_exists/`,
    {
      method: 'POST',
      body: JSON.stringify({ pnames: packages }),
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization:
          'Basic YXBpLXRvb2xib3gtZm9yLWdvb2dsZS1wbGF5OkNiVVcgQVVMZyBNRVJXIHU4M3IgS0s0SCBEbmJL'
      }
    }
  );

  const response = await request.json();

  return response.data;
}
/**
 * @param {import('ws').WebSocket} ws
 */
module.exports = async function getPatches(ws) {
  const patchesList = JSON.parse(
    readFileSync(global.jarNames.patchesList, 'utf8')
  );
  const appsList = [];
  const list = [];

  for (const patches of patchesList) {
    for (const packages of patches.compatiblePackages) {
      if (!appsList.some((el) => el.pname === packages.name))
        appsList.push({ pname: packages.name });
    }
  }

  const apps = await fetchPackages(appsList);
  for (const app of apps) {
    if (!app.exists) continue;

    list.push({
      appName: app.app.name,
      appPackage: app.pname,
      link: app.app.link
    });
  }

  ws.send(
    JSON.stringify({
      event: 'appList',
      list
    })
  );

  return;
};
