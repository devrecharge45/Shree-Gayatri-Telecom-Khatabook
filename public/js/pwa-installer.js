/**
 * Khatabook Pro - PWA Install Banner Handler
 */
(() => {
  'use strict';

  let deferredPrompt = null;
  const installBtn = document.getElementById('pwa-install-btn');
  const portalInstallBtn = document.getElementById('btnInstallAppPortal');
  const portalInstallBox = document.getElementById('pwaDirectInstallBox');
  const iosHint = document.getElementById('iosInstallHint');

  // Detect iOS Safari
  const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  };

  // Detect if already installed as standalone PWA app
  const isStandalone = () => {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && window.navigator.standalone === true)
    );
  };

  if (isStandalone()) {
    if (portalInstallBox) portalInstallBox.style.display = 'none';
    if (installBtn) installBtn.style.display = 'none';
  } else if (isIos() && iosHint && portalInstallBox) {
    iosHint.style.display = 'block';
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'inline-flex';
    if (portalInstallBox) portalInstallBox.style.display = 'flex';
  });

  const triggerInstall = async () => {
    if (!deferredPrompt) {
      if (isIos() && iosHint) {
        iosHint.style.display = 'block';
      } else {
        alert(
          'To install, tap the 3-dots menu in Chrome and select "Install app" or "Add to Home screen".'
        );
      }
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install response: ${outcome}`);
    deferredPrompt = null;
    if (installBtn) installBtn.style.display = 'none';
    if (portalInstallBox) portalInstallBox.style.display = 'none';
  };

  if (installBtn) installBtn.addEventListener('click', triggerInstall);
  if (portalInstallBtn) portalInstallBtn.addEventListener('click', triggerInstall);

  window.addEventListener('appinstalled', () => {
    console.log('Khatabook app successfully installed');
    if (installBtn) installBtn.style.display = 'none';
    if (portalInstallBox) portalInstallBox.style.display = 'none';
  });
})();
