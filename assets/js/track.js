/* 访问记录上报：只在正式域名运行，本地与预览环境不上报 */
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

  function ref() {
    if (!document.referrer) return '';
    try {
      var u = new URL(document.referrer);
      if (u.hostname === host) return '站内 · ' + u.pathname;
      return u.hostname;
    } catch (e) { return ''; }
  }

  function send() {
    var body = JSON.stringify({
      p: location.pathname + location.search,
      r: ref(),
      v: vid,
      n: isNew ? 1 : 0,
      w: window.innerWidth || 0,
      lg: navigator.language || ''
    });

    /* text/plain 属于简单请求，不会触发预检；服务端只按字符串解析 JSON */
    function beacon() {
      try {
        if (navigator.sendBeacon) navigator.sendBeacon('/api/track', body);
      } catch (e) {}
    }

    try {
      fetch('/api/track', {
        method: 'POST', body: body, keepalive: true,
        headers: { 'content-type': 'text/plain;charset=UTF-8' }
      }).catch(beacon);
    } catch (e) { beacon(); }
  }

  if (document.readyState === 'complete') setTimeout(send, 250);
  else window.addEventListener('load', function () { setTimeout(send, 250); });
})();
