/**
 * @typedef Message
 * @property {string} text,
 * @property {*} data,
 */

let uuid = 0;

sendMessage('uuid', {
  callback: (response) => {
    uuid = response.uuid;
  },
});

const input_query =
  /** @type {HTMLInputElement} */
  (document.getElementById('query'));
const div_results =
  /** @type {HTMLDivElement} */
  (document.getElementById('results'));
const button_search =
  /** @type {HTMLButtonElement} */
  (document.getElementById('search'));

chrome.runtime.onMessage.addListener((/**@type {Message}*/ message, sender, sendResponse) => {
  if (message.data.uuid && message.data.uuid !== uuid) {
    return;
  }

  switch (message.text) {
    case 'done': {
      input_query.toggleAttribute('disabled', false);
      button_search.toggleAttribute('disabled', false);
      if (div_results.childElementCount === 0) {
        const div = document.createElement('div');
        div.textContent = '0 matches.';
        div_results.append(div);
      }
      setTimeout(() => {
        input_query.focus();
        input_query.select();
      }, 10);
      break;
    }
    case 'result': {
      const button = document.createElement('button');
      const div_title = document.createElement('div');
      div_title.classList.add('title');
      div_title.textContent = message.data.tab.title;
      const div_url = document.createElement('div');
      div_url.classList.add('url');
      div_url.textContent = message.data.tab.url;
      button.append(div_title, div_url);
      div_results.append(button);
      button.addEventListener('click', () => {
        chrome.tabs.update(message.data.tab.id, { active: true });
        chrome.windows.update(message.data.tab.windowId, { focused: true });
      });
      break;
    }
  }
});

window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' || ev.key === ' ') {
    setTimeout(() => {
      input_query.focus();
      input_query.select();
    }, 10);
  }
});
input_query.addEventListener('keydown', (ev) => {
  if (ev.repeat === true) {
    return;
  }
  if (ev.key === 'Enter') {
    initiateSearch();
    input_query.blur();
  }
});

button_search.addEventListener('click', () => {
  initiateSearch();
});

function initiateSearch() {
  input_query.toggleAttribute('disabled', true);
  button_search.toggleAttribute('disabled', true);
  div_results.replaceChildren();
  sendMessage('search', { data: { uuid, query: input_query.value } });
}

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