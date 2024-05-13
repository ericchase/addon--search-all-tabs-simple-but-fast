import { SetupKeyClickHandlers } from './helpers.js';

const aside =
  /** @type {HTMLElement} */
  (document.querySelector('aside'));
const main =
  /** @type {HTMLElement} */
  (document.querySelector('main'));

const input_query =
  /** @type {HTMLInputElement} */
  (document.getElementById('query'));
const div_results =
  /** @type {HTMLDivElement} */
  (document.getElementById('results'));
const button_search =
  /** @type {HTMLButtonElement} */
  (document.getElementById('search'));
const button_case_sensitive_search =
  /** @type {HTMLButtonElement} */
  (document.getElementById('case-sensitive-search'));

const template_result =
  /** @type {HTMLTemplateElement} */
  (document.getElementById('template-result'));

/**
 * @param {object} args
 * @param {chrome.tabs.Tab} args.tab
 * @param {boolean} args.inBody
 * @param {boolean} args.inTitle
 */
function addResult({ tab, inBody, inTitle }) {
  const fragment = document.importNode(template_result, true).content;
  /** @param {boolean} ctrlKey */
  function focusTab(ctrlKey) {
    if (tab.id && tab.windowId) {
      if (ctrlKey === true) {
        chrome.windows.create({
          focused: true,
          tabId: tab.id,
        });
      } else {
        chrome.tabs.update(tab.id, { active: true }).then((tab) => {
          chrome.windows.update(tab.windowId, { focused: true });
        });
      }
    }
  }
  fragment.querySelector('button').addEventListener('click', (evt) => {
    focusTab(evt.ctrlKey);
  });
  fragment.querySelector('button').addEventListener('keydown', (evt) => {
    if (evt.key === 'Enter') {
      focusTab(evt.ctrlKey);
    }
  });
  if (tab.favIconUrl !== null && tab.favIconUrl !== undefined) {
    fragment.querySelector('img').src = tab.favIconUrl;
  }
  if (tab.title !== null && tab.title !== undefined) {
    fragment.querySelector('.title').textContent = tab.title;
  }
  if (tab.url !== null && tab.url !== undefined) {
    fragment.querySelector('.url').textContent = tab.url;
  }
  const where = [];
  if (inBody === true) {
    where.push('body');
  }
  if (inTitle === true) {
    where.push('title');
  }
  fragment.querySelector('.where').textContent = `in: ${where.join(', ')}`;
  div_results.append(fragment.firstElementChild);
}

/**
 * @param {boolean} caseSensitive
 */
function initiateSearch(caseSensitive = false) {
  input_query.toggleAttribute('disabled', true);
  button_search.toggleAttribute('disabled', true);
  button_case_sensitive_search.toggleAttribute('disabled', true);
  div_results.replaceChildren();

  const div_searching = document.createElement('div');
  div_searching.setAttribute('id', 'searching');

  div_searching.textContent = 'Searching... (possibly waiting on discarded tabs to be restored)';
  div_results.append(div_searching);

  const port = chrome.runtime.connect();
  port.onMessage.addListener(({ tab, inBody, inTitle }, port) => {
    addResult({ tab, inBody, inTitle });
  });
  port.onDisconnect.addListener((port) => {
    div_searching.remove();
    input_query.toggleAttribute('disabled', false);
    button_search.toggleAttribute('disabled', false);
    button_case_sensitive_search.toggleAttribute('disabled', false);
    if (div_results.childElementCount === 0) {
      const div = document.createElement('div');
      div.textContent = '0 matches.';
      div_results.append(div);
    }
    setTimeout(() => {
      input_query.focus();
      input_query.select();
    }, 50);
  });
  port.postMessage({ query: input_query.value, caseSensitive });
}

(async function () {
  if ((await chrome.permissions.contains({ origins: ['<all_urls>'] })) === true) {
    SetupKeyClickHandlers(window, (evt) => {
      // use hasFocus() here
      if (evt.key === 'Escape' || evt.key === ' ') {
        input_query.focus();
        input_query.select();
      }
    });
    SetupKeyClickHandlers(input_query, (evt) => {
      evt.stopPropagation();
      if (evt.repeat === true) {
        return;
      }
      if (evt.key === 'Enter') {
        initiateSearch(evt.ctrlKey === true);
        input_query.blur();
      }
    });
    button_search.addEventListener('click', () => {
      initiateSearch();
    });
    button_case_sensitive_search.addEventListener('click', () => {
      initiateSearch(true);
    });
  } else {
    aside.toggleAttribute('hidden', false);
    main.toggleAttribute('hidden', true);
  }
})();
