(() => {
  'use strict';
  if (!('serviceWorker' in navigator) || !window.isSecureContext || !/^https?:$/.test(location.protocol)) return;

  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (standalone) document.documentElement.dataset.ekStandalone = 'true';
  let installPrompt = null;
  let registration = null;
  let reloadRequested = false;
  const panel = document.createElement('section');
  panel.className = 'ek-pwa-panel';
  panel.setAttribute('aria-label', '홈 화면 설치와 앱 업데이트');
  panel.innerHTML = '<div class="ek-pwa-install"><div><p class="ek-pwa-title">이케이클린을 홈 화면에서 만나세요.</p><p class="ek-pwa-copy">앱 아이콘을 누르면 뽀송한 일상으로 바로 연결돼요.</p></div><button type="button" class="ek-pwa-button" id="ekPwaInstall">홈 화면에 추가</button></div><p class="ek-pwa-status" id="ekPwaStatus" role="status">첫 방문 시 화면을 저장하면 오프라인에서도 볼 수 있어요.</p><div class="ek-pwa-update" id="ekPwaUpdate" hidden><p>새 버전이 준비됐어요. 작성 중인 문의 내용은 먼저 복사해 주세요.</p><button type="button" class="ek-pwa-button" id="ekPwaApplyUpdate">새 버전 적용</button></div>';
  const footer = document.querySelector('.site-footer .container') || document.querySelector('main') || document.body;
  footer.appendChild(panel);
  const installRow = panel.querySelector('.ek-pwa-install');
  const status = panel.querySelector('#ekPwaStatus');
  const updateRow = panel.querySelector('#ekPwaUpdate');
  if (standalone) installRow.hidden = true;

  const help = document.createElement('dialog');
  help.className = 'ek-pwa-help';
  help.setAttribute('aria-labelledby', 'ekPwaHelpTitle');
  help.innerHTML = '<h2 id="ekPwaHelpTitle">홈 화면에 이케이클린 추가하기</h2><p><strong>안드로이드</strong><br>Chrome에서 이 사이트를 열고 메뉴의 “앱 설치” 또는 “홈 화면에 추가”를 선택하세요.</p><p><strong>아이폰</strong><br>Safari에서 이 사이트를 열고 공유 메뉴의 “홈 화면에 추가”를 선택하세요.</p><p class="ek-pwa-help-note">카카오톡 안에서 보고 있다면 먼저 Chrome 또는 Safari로 열어주세요. 브라우저에 따라 메뉴 이름과 설치 방식이 다를 수 있어요.</p><button type="button" class="ek-pwa-button" id="ekPwaCloseHelp">확인했어요</button>';
  document.body.appendChild(help);
  let lastFocus = null;
  panel.querySelector('#ekPwaInstall').addEventListener('click', async () => {
    if (installPrompt) {
      const prompt = installPrompt;
      installPrompt = null;
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        status.textContent = choice.outcome === 'accepted' ? '설치 요청을 완료했어요. 홈 화면의 앱 아이콘을 확인해 주세요.' : '원하실 때 다시 홈 화면에 추가할 수 있어요.';
      } catch (_) { status.textContent = '브라우저 메뉴에서 홈 화면에 추가해 주세요.'; }
    } else {
      lastFocus = document.activeElement;
      help.showModal();
    }
  });
  panel.querySelector('#ekPwaApplyUpdate').addEventListener('click', () => {
    if (registration && registration.waiting) {
      reloadRequested = true;
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
  help.querySelector('#ekPwaCloseHelp').addEventListener('click', () => help.close());
  help.addEventListener('close', () => { if (lastFocus) lastFocus.focus({ preventScroll: true }); });
  help.addEventListener('click', event => {
    const rect = help.getBoundingClientRect();
    if (event.target === help && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) help.close();
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    if (!standalone) installRow.hidden = false;
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    installRow.hidden = true;
    status.textContent = '홈 화면에 추가했어요. 앱 아이콘으로 다시 만나세요.';
  });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadRequested) { reloadRequested = false; location.reload(); }
  });

  const scopeURL = new URL('./', document.baseURI);
  navigator.serviceWorker.register(new URL('sw.js', scopeURL), { scope: scopeURL.href, updateViaCache: 'none' })
    .then(async value => {
      registration = value;
      if (registration.waiting) updateRow.hidden = false;
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        if (worker) worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) updateRow.hidden = false;
        });
      });
      await navigator.serviceWorker.ready;
      status.textContent = '화면이 저장됐어요. 홈과 소개는 오프라인에서도 볼 수 있어요.';
    })
    .catch(() => { status.textContent = '화면 저장을 완료하지 못했어요. 인터넷 연결 후 다시 방문해 주세요.'; });
})();
