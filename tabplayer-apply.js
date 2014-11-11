chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.executeScript(null, {file: "js/contents-script.js"});
  chrome.tabs.executeScript(null, {file: "js/tabplayer.js"});
});