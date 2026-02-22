document.addEventListener('DOMContentLoaded', () => {
  const endpointInput = document.getElementById('apiEndpoint');
  const tokenInput = document.getElementById('authToken');
  const saveBtn = document.getElementById('saveBtn');
  const msg = document.getElementById('msg');

  browser.storage.local.get(['apiEndpoint', 'authToken']).then((result) => {
    if (result.apiEndpoint) endpointInput.value = result.apiEndpoint;
    if (result.authToken) tokenInput.value = result.authToken;
  });

  saveBtn.addEventListener('click', () => {
    const endpoint = endpointInput.value.trim().replace(/\/+$/, '');
    const token = tokenInput.value.trim();

    if (!endpoint) {
      msg.textContent = 'API endpoint is required.';
      msg.style.color = '#b91c1c';
      return;
    }

    browser.storage.local.set({ apiEndpoint: endpoint, authToken: token }).then(() => {
      msg.textContent = 'Settings saved.';
      msg.style.color = '#16a34a';
    });
  });
});
