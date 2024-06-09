chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: './index.html' });
});

chrome.contextMenus.create({
  contexts: ['action'],
  id: 'open-store-page-chrome',
  title: 'Open Chrome Web Store Page',
});
chrome.contextMenus.create({
  contexts: ['action'],
  id: 'open-store-page-firefox',
  title: 'Open Firefox Browser Add-ons Page',
});

chrome.contextMenus.onClicked.addListener((info) => {
  switch (info.menuItemId) {
    case 'open-store-page-chrome':
      chrome.tabs.create({ url: 'https://chromewebstore.google.com/detail/search-all-tabs-simple-bu/lmeapdggiiabkbhbkdcppjnfkcfjhlpo' });
      break;
    case 'open-store-page-firefox':
      chrome.tabs.create({ url: 'https://addons.mozilla.org/en-US/firefox/addon/searchalltabs-simplebutfast/' });
      break;
  }
});

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async ({ query, caseSensitive }) => {
    await search({ port, query, caseSensitive });
    port.disconnect();
  });
});

/**
 * @param {object} args
 * @param {chrome.runtime.Port} args.port
 * @param {string} args.query
 * @param {boolean} args.caseSensitive
 */
async function search({ port, query, caseSensitive }) {
  // if a tab is discarded, it cannot be searched
  // try to restore any discarded tabs before searching
  await restoreDiscardedTabs();
  // activate search page again
  await activatePortTab(port);

  const jobs = [];
  // queue up jobs
  for (const tab of await chrome.tabs.query({})) {
    if (tab.id) {
      jobs.push(executeSearch({ port, query, tab, caseSensitive }));
    }
  }
  // wait for all jobs to finish before returning
  await Promise.allSettled(jobs);
}
/**
 * @param {object} args
 * @param {chrome.runtime.Port} args.port
 * @param {string} args.query
 * @param {chrome.tabs.Tab} args.tab
 * @param {boolean} args.caseSensitive
 */
function executeSearch({ port, query, tab, caseSensitive }) {
  return new Promise(async (resolve, reject) => {
    try {
      const results = await chrome.scripting.executeScript({
        args: [query, caseSensitive],
        func: searchTabText,
        target: { tabId: tab.id },
      });
      const inBody = (function () {
        for (const result of results) {
          if (result && result.result === true) {
            return true;
          }
        }
        return false;
      })();
      const inTitle = searchTabTitle(tab, query, caseSensitive);
      if (inBody || inTitle) {
        port.postMessage({ tab, inBody, inTitle });
        return resolve(true);
      }
    } catch (error) {
      console.log(tab.id, tab.title, error);
    }
    return reject();
  });
}

function restoreDiscardedTabs() {
  return new Promise(async (resolve) => {
    const updateSet = new Set();
    const loadSet = new Set();

    function checkIfDone() {
      if (updateSet.size === 0 && loadSet.size === 0) {
        return resolve(true);
      }
    }

    /** @param {number} tabId */
    function queueUpdate(tabId) {
      updateSet.add(tabId);
    }
    /** @param {number} tabId */
    function queueLoad(tabId) {
      loadSet.add(tabId);
    }
    /** @param {number} tabId */
    function endUpdate(tabId) {
      updateSet.delete(tabId);
    }
    /** @param {number} tabId */
    function endLoad(tabId) {
      loadSet.delete(tabId);
      checkIfDone();
    }

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      switch (changeInfo.status) {
        case 'complete': {
          if (loadSet.has(tabId)) {
            endLoad(tabId);
          }
          break;
        }
        case 'loading': {
          if (updateSet.has(tabId)) {
            queueLoad(tabId);
            endUpdate(tabId);
          }
          break;
        }
      }
    });

    for (const tab of await chrome.tabs.query({})) {
      if (tab.id && tab.discarded === true) {
        try {
          await chrome.windows.update(tab.windowId, { focused: true });
          await chrome.tabs.update(tab.id, { active: true });
          queueUpdate(tab.id);
        } catch (err) {}
      }
    }

    checkIfDone();
  });
}

/**
 * @param {chrome.runtime.Port} port
 */
async function activatePortTab(port) {
  if (port.sender?.tab?.id !== null && port.sender?.tab?.id !== undefined) {
    await chrome.tabs.update(port.sender.tab.id, { active: true });
    await chrome.windows.update(port.sender.tab.windowId, { focused: true });
  }
}

/**
 * @param {string} query
 * @param {boolean} caseSensitive
 */
function searchTabText(query, caseSensitive) {
  if (caseSensitive === true) {
    if (document.body.innerText.indexOf(query) !== -1) {
      return true;
    }
  } else {
    if (document.body.innerText.toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) !== -1) {
      return true;
    }
  }
  return false;
}

/**
 * @param {chrome.tabs.Tab} tab
 * @param {string} query
 * @param {boolean} caseSensitive
 */
function searchTabTitle(tab, query, caseSensitive) {
  if (caseSensitive === true) {
    if ((tab.title ?? '').indexOf(query) !== -1) {
      return true;
    }
  } else {
    if ((tab.title ?? '').toLocaleLowerCase().indexOf(query.toLocaleLowerCase()) !== -1) {
      return true;
    }
  }
  return false;
}
