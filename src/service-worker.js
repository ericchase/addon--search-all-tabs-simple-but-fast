/**
 * @typedef Message
 * @property {string} text,
 * @property {*} data,
 */

let next_uuid = 0;
function newUuid() {
  return next_uuid++;
}

/**
 * @param {object} options
 * @param {string} options.uuid
 * @param {string} options.query
 */
async function search({ uuid, query }) {
  const jobs = [];
  try {
    await checkPermissions();
    for (const tab of await getTabs()) {
      const job = executeScript(tab, query);
      jobs.push(job);
      job
        .then(() => {
          sendMessage('result', { data: { uuid, tab } });
        })
        .catch((err) => {});
    }
  } catch (err) {
    console.log(err);
  }
  await Promise.allSettled(jobs);
  sendMessage('done', { data: { uuid } });
}

async function checkPermissions() {
  if ((await chrome.permissions.contains({ origins: ['<all_urls>'] })) !== true) {
    console.log('need to request permissions');
  }
}

async function getTabs() {
  /** @type {(chrome.tabs.Tab & {id:number})[]} */
  const tabs = [];
  for (const tab of await chrome.tabs.query({})) {
    if (tab.id !== null && tab.id !== undefined) {
      tabs.push(/** @type {chrome.tabs.Tab & {id:number}}*/ (tab));
    }
  }
  return tabs;
}

/**
 * @param {chrome.tabs.Tab & {id:number}} tab
 * @param {string} query
 */
function executeScript(tab, query) {
  return new Promise(async (resolve, reject) => {
    try {
      if (tab.discarded === true) {
        await chrome.tabs.reload(tab.id);
      }
      for (const result of await chrome.scripting.executeScript({
        args: [query],
        func: function (query) {
          return document.body.innerText.indexOf(query) > -1;
        },
        target: {
          tabId: tab.id,
        },
      })) {
        if (result && result.result === true) {
          return resolve(true);
        }
      }
    } catch (error) {
      console.log(tab.id, tab.title, error);
    }
    return reject();
  });
}

chrome.runtime.onInstalled.addListener((details) => {
  if (['install', 'update'].includes(details.reason)) {
    console.log('Search All Tabs for Text:', details.reason);
  }
});

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: './index.html' });
});

chrome.runtime.onMessage.addListener((/**@type {Message}*/ message, sender, sendResponse) => {
  switch (message.text) {
    case 'uuid': {
      sendResponse({ uuid: newUuid() });
      break;
    }
    case 'search': {
      search({ uuid: message.data.uuid, query: message.data.query });
      break;
    }
  }
});

/**
 * @param {string} text
 * @param {object} [options]
 * @param {(response: any)=>void} [options.callback]
 * @param {*} [options.data]
 */
function sendMessage(text, options) {
  const callback = options?.callback;
  const data = options?.data ?? {};

  /** @type {Message} */
  const message = {
    text,
    data,
  };

  if (callback) {
    chrome.runtime.sendMessage(message, callback);
  } else {
    chrome.runtime.sendMessage(message);
  }
}
