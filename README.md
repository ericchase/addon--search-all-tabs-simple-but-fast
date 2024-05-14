## Browser Addon

_Search the title and body content of all open tabs for specific text._

Performs simple but fast text searches across every open tab's title and body content (if extension has permission to do so).

Features:

- Case-sensitive and case-insensitive search.
- Restores tabs that have been discarded by the browser due to inactivity.
  - Discarded tabs cannot be searched.
  - Activates each tab instead of reloading the tab, so that previous state is retained.

Limitations:

- Cannot search tabs with specific URLs that are restricted by the browser.
  - This typically includes "about..." and "chrome..." pages and the pages from the browser's add-on/web store.

This is a Manifest V3 extension (https://developer.chrome.com/docs/extensions/develop/migrate).

### Chrome

https://chromewebstore.google.com/detail/search-all-tabs-simple-bu/lmeapdggiiabkbhbkdcppjnfkcfjhlpo

### Firefox

https://addons.mozilla.org/en-US/firefox/addon/searchalltabs-simplebutfast/

## Developer Notes

The `bun` runtime seems to have some issues with an Archiver dependency (readable-stream?). Because of that, I opt to continue using `node` for running the `build` and `bundle` scripts.
