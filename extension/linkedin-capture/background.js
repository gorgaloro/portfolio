/* LinkedIn Capture — Background Script
   Relays messages between popup and content script. */

browser.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === 'extractProfile') {
    return browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      if (!tabs[0]?.id) return { success: false, error: 'No active tab' };
      return browser.tabs.sendMessage(tabs[0].id, { action: 'extractProfile' });
    });
  }
});
