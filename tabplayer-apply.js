chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript(null, {file: "js/add-tabplayer.js"});
  chrome.tabs.executeScript(null, {file: "js/tabplayer.js"});
});

