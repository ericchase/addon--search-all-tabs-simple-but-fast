`click` browser action icon
`type` query into "Search tabs for..." input box
`click` "Search" button
	page sends `search` query to service worker
	service worker injects all available tabs with search script
	service worker sends tab details for every tab that contains query