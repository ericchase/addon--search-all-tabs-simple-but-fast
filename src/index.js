const input_query =
  /** @type {HTMLInputElement} */
  (document.getElementById('query'));
const div_results =
  /** @type {HTMLDivElement} */
  (document.getElementById('results'));
const button_search =
  /** @type {HTMLButtonElement} */
  (document.getElementById('search'));

/**
 * @param {chrome.tabs.Tab} tab
 */
function addResult(tab) {
  const button = document.createElement('button');
  const div_title = document.createElement('div');
  const div_url = document.createElement('div');
  div_title.classList.add('title');
  div_url.classList.add('url');
  if (tab.title) {
    div_title.textContent = tab.title;
  }
  if (tab.url) {
    div_url.textContent = tab.url;
  }
  button.addEventListener('click', () => {
    if (tab.id && tab.windowId) {
      chrome.tabs.update(tab.id, { active: true });
      chrome.windows.update(tab.windowId, { focused: true });
    }
  });
  button.append(div_title, div_url);
  div_results.append(button);
}

function initiateSearch() {
  input_query.toggleAttribute('disabled', true);
  button_search.toggleAttribute('disabled', true);
  div_results.replaceChildren();

  const port = chrome.runtime.connect();
  port.onMessage.addListener((message, port) => {
    addResult(message);
  });
  port.onDisconnect.addListener((port) => {
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
    }, 0);
  });
  port.postMessage(input_query.value);
}

window.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape' || ev.key === ' ') {
    setTimeout(() => {
      input_query.focus();
      input_query.select();
    }, 0);
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
