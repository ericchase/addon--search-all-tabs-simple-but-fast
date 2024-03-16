chrome.runtime.onInstalled.addListener((details) => {
  if (['install', 'update'].includes(details.reason)) {
    console.log('Search All Tabs for Text:', details.reason);
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: './index.html' });
});

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (query) => {
    await search({ port, query });
    port.disconnect();
  });
});

/**
 * @param {object} args
 * @param {chrome.runtime.Port} args.port
 * @param {string} args.query
 */
async function search({ port, query }) {
  const jobs = [];
  try {
    await checkPermissions();
    for (const tab of await getTabs()) {
      jobs.push(executeScript({ port, query, tab }));
    }
  } catch (err) {
    console.log(err);
  }
  await Promise.allSettled(jobs);
}

/**
 * @param {object} args
 * @param {chrome.runtime.Port} args.port
 * @param {string} args.query
 * @param {chrome.tabs.Tab} args.tab
 */
function executeScript({ port, query, tab }) {
  return new Promise(async (resolve, reject) => {
    try {
      if (tab.id) {
        if (tab.discarded === true) {
          await chrome.tabs.reload(tab.id);
        }
        const results = await chrome.scripting.executeScript({
          args: [query],
          func: function (query) {
            return document.body.innerText.indexOf(query) > -1;
          },
          target: {
            tabId: tab.id,
          },
        });
        for (const result of results) {
          if (result && result.result === true) {
            port.postMessage(tab);
            return resolve(true);
          }
        }
      }
    } catch (error) {
      console.log(tab.id, tab.title, error);
    }
    return reject();
  });
}

async function checkPermissions() {
  if ((await chrome.permissions.contains({ origins: ['<all_urls>'] })) !== true) {
    console.log('need to request permissions');
  }
}

async function getTabs() {
  const tabs = [];
  for (const tab of await chrome.tabs.query({})) {
    tabs.push(tab);
  }
  return tabs;
}
