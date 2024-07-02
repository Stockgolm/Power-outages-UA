chrome.runtime.onInstalled.addListener(() => {
  console.log('Background script running');
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchData") {
    const url = message.url;
    fetch(url)
      .then(response => response.text())
      .then(data => {
        sendResponse({ success: true, data });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.toString() });
      });
    return true;
  }
}); 
