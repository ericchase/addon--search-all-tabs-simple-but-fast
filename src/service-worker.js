chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: './index.html' });
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
  const jobs = [];
  try {
    for (const tab of await chrome.tabs.query({})) {
      jobs.push(executeScript({ port, query, tab, caseSensitive }));
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
 * @param {boolean} args.caseSensitive
 */
function executeScript({ port, query, tab, caseSensitive }) {
  return new Promise(async (resolve, reject) => {
    try {
      if (tab.id) {
        if (tab.discarded === true) {
          await chrome.tabs.reload(tab.id);
        }
        const results = await chrome.scripting.executeScript({
          args: [query, caseSensitive],
          func: searchTabText,
          target: {
            tabId: tab.id,
          },
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
      }
    } catch (error) {
      console.log(tab.id, tab.title, error);
    }
    return reject();
  });
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
