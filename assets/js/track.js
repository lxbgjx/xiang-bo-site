/* 访问记录上报：只在正式域名运行，本地与预览环境不上报。
   上报两类事件：
     pv  进入页面（页面 / 来源 / 设备 / 作品标题）
     dw  离开或切走后（停留秒数，后台按 sid 合并回对应的 pv）  */
(function () {
  var host = location.hostname;
  if (!/^(www\.)?xiang-bo\.top$/i.test(host)) return;
  if (/^\/admin\.html/i.test(location.pathname)) return;

  var KEY = 'xb_vid';
  var vid = '';
  var isNew = false;
  try {
    vid = localStorage.getItem(KEY) || '';
    if (!vid) {
      vid = 'v' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(KEY, vid);
      isNew = true;
    }
  } catch (e) {}

  /* 本次页面加载的唯一标识，dw 靠它挂回自己的 pv */
  var sid = (vid || 'x') + '.' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);

  /* 只累计「页面在前台」的时间：切到别的标签页、最小化都不算 */
  var acc = 0;
  var since = document.visibilityState === 'visible' ? Date.now() : 0;
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') {
      since = Date.now();
    } else if (since) {
      acc += Date.now() - since;
      since = 0;
    }
  });

  function elapsedSec() {
    var ms = acc + (since ? Date.now() - since : 0);
    return Math.round(ms / 1000);
  }

  function ref() {
    if (!document.referrer) return '';
    try {
      var u = new URL(document.referrer);
      if (u.hostname === host) return '站内 · ' + u.pathname + u.search;
      return u.hostname;
    } catch (e) { return ''; }
  }

  /* 作品详情页把标题带上去，后台直接显示作品名而不是 ?id=xxx */
  function workTitle() {
    if (!/\/project\.html/i.test(location.pathname)) return '';
    return String(document.title || '').split(' · ')[0].slice(0, 60);
  }

  /* text/plain 属于简单请求，不触发预检；服务端按字符串解析 JSON */
  function post(payload, onFail) {
    var body = JSON.stringify(payload);
    try {
      fetch('/api/track', {
        method: 'POST', body: body, keepalive: true,
        headers: { 'content-type': 'text/plain;charset=UTF-8' }
      }).catch(function () { if (onFail) onFail(body); });
    } catch (e) { if (onFail) onFail(body); }
  }

  function pv() {
    post({
      ty: 'pv',
      p: location.pathname + location.search,
      r: ref(),
      v: vid,
      sid: sid,
      n: isNew ? 1 : 0,
      w: window.innerWidth || 0,
      lg: navigator.language || '',
      ti: workTitle()
    });
  }

  var lastSent = -1;
  function dw() {
    var sec = elapsedSec();
    if (sec < 2) return;              /* 秒开秒关的不算停留 */
    if (sec > 7200) sec = 7200;       /* 挂着过夜的封顶两小时 */
    if (sec - lastSent < 3) return;   /* 来回切标签页不重复上报 */
    lastSent = sec;
    post(
      { ty: 'dw', sid: sid, v: vid, p: location.pathname + location.search, d: sec },
      function (body) {
        try { if (navigator.sendBeacon) navigator.sendBeacon('/api/track', body); } catch (e) {}
      }
    );
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') dw();
  });
  window.addEventListener('pagehide', dw);

  if (document.readyState === 'complete') setTimeout(pv, 250);
  else window.addEventListener('load', function () { setTimeout(pv, 250); });
})();
