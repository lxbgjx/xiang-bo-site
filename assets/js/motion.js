/* ============================================================
   motion.js  ·  动效与交互基础设施
   ============================================================ */
(function () {
  'use strict';
  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 首屏遮罩 ---------- */
  function curtain() {
    var c = $('#curtain');
    if (!c) return;
    var seen = sessionStorage.getItem('xb-seen');
    if (seen) { c.remove(); return; }
    setTimeout(function () {
      c.classList.add('done');
      sessionStorage.setItem('xb-seen', '1');
      setTimeout(function () { c.remove(); }, 1000);
    }, 340);
  }

  /* ---------- 滚动揭示 ---------- */
  function reveal() {
    var els = $$('.rv');
    if (!els.length) return;
    if (RM) { els.forEach(function (e) { e.classList.add('in'); }); return; }

    // 同一容器内的子女依次延迟
    $$('[data-stagger]').forEach(function (box) {
      var step = parseFloat(box.getAttribute('data-stagger')) || 90;
      $$(':scope > .rv', box).forEach(function (el, i) {
        el.style.setProperty('--d', (i * step) + 'ms');
      });
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    els.forEach(function (e) { io.observe(e); });

    /* 安全网：快速滑动 / 锚点直达时 IO 可能来不及回调，
       凡是已经进入视口的一律补上，避免留下永久隐形的段落 */
    var ticking = false;
    function sweep() {
      ticking = false;
      var rest = $$('.rv:not(.in)');
      if (!rest.length) {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        return;
      }
      var vh = window.innerHeight;
      rest.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.94 && r.bottom > -vh * 0.5) el.classList.add('in');
      });
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sweep);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
  }

  /* ---------- 视差 ---------- */
  function parallax() {
    var items = $$('[data-parallax]');
    if (!items.length || RM) return;
    var ticking = false;
    function run() {
      var vh = window.innerHeight;
      items.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(el.getAttribute('data-parallax')) || 0.12;
        var mid = r.top + r.height / 2 - vh / 2;
        el.style.transform = 'translate3d(0,' + (-mid * speed).toFixed(2) + 'px,0)';
      });
      ticking = false;
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(run); } }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    run();
  }

  /* ---------- 导航 ---------- */
  function nav() {
    var el = $('#nav'), prog = $('#prog');
    var onScroll = function () {
      var y = window.scrollY;
      if (el) el.classList.toggle('small', y > 40);
      if (prog) {
        var h = document.documentElement.scrollHeight - window.innerHeight;
        prog.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var t = $('#navToggle'), panel = $('#navPanel');
    if (t && panel) {
      t.addEventListener('click', function () {
        var open = !panel.classList.contains('on');
        panel.classList.toggle('on', open);
        document.body.classList.toggle('menu-open', open);
        $$('a', panel).forEach(function (a, i) {
          a.style.setProperty('--d', (open ? 0.12 + i * 0.06 : 0) + 's');
        });
      });
      $$('a', panel).forEach(function (a) {
        a.addEventListener('click', function () {
          panel.classList.remove('on');
          document.body.classList.remove('menu-open');
        });
      });
    }

    // 当前页高亮
    var page = document.body.getAttribute('data-page');
    if (page) {
      var cur = $('.nav-links a[data-nav="' + page + '"]');
      if (cur) cur.classList.add('on');
    }
  }

  /* ---------- 光标 ---------- */
  function cursor() {
    if (RM || window.matchMedia('(hover:none)').matches) return;
    var d = document.createElement('div');
    d.id = 'dot';
    document.body.appendChild(d);
    var x = 0, y = 0, tx = 0, ty = 0, on = false;
    document.addEventListener('mousemove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!on) { on = true; d.classList.add('on'); }
    });
    document.addEventListener('mouseleave', function () { d.classList.remove('on'); on = false; });
    (function loop() {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      d.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', function (e) {
      var t = e.target;
      var hot = t.closest('a,button,.shot,.card,.cat,[data-zoom]');
      d.classList.toggle('big', !!hot);
    });
  }

  /* ---------- 数字滚动 ---------- */
  function counters() {
    var els = $$('[data-count]');
    if (!els.length) return;
    if (RM) {
      els.forEach(function (e) { e.textContent = e.getAttribute('data-count'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, to = parseFloat(el.getAttribute('data-count')) || 0;
        var dur = 1300, t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var e2 = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * e2);
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    els.forEach(function (e) { el_reset(e); io.observe(e); });
    function el_reset(e) { e.textContent = '0'; }
  }

  /* ---------- 灯箱 ---------- */
  var lb, lbImg, lbCap;
  function lightbox() {
    document.addEventListener('click', function (e) {
      var img = e.target.closest('[data-zoom] img, .fig img, .gal img, .photo-grid img, .shot img');
      if (!img) return;
      var src = img.currentSrc || img.src;
      if (!src) return;
      e.preventDefault();
      if (!lb) build();
      lbImg.src = src;
      lbImg.alt = img.alt || '';
      lbCap.textContent = img.alt || '';
      lb.classList.add('on');
      document.body.style.overflow = 'hidden';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb && lb.classList.contains('on')) close();
    });
    function build() {
      lb = document.createElement('div');
      lb.id = 'lb';
      lb.innerHTML = '<button id="lbClose">关闭 Esc</button><img alt=""><div id="lbCap"></div>';
      document.body.appendChild(lb);
      lbImg = $('#lb img', lb); lbCap = $('#lbCap', lb);
      lb.addEventListener('click', function (e) {
        if (e.target === lb || e.target.id === 'lbClose') close();
      });
    }
    function close() {
      lb.classList.remove('on');
      document.body.style.overflow = '';
    }
  }

  /* ---------- 页面切换过渡 ---------- */
  function transitions() {
    if (!document.startViewTransition || RM) return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')
        || a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      document.startViewTransition(function () {
        window.location.href = href;
      });
    });
  }

  /* ---------- 锚点平滑（避开固定导航） ---------- */
  function anchors() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var top = t.getBoundingClientRect().top + window.scrollY - 74;
      window.scrollTo({ top: top, behavior: RM ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 启动 ---------- */
  function boot() {
    curtain();
    nav();
    reveal();
    parallax();
    cursor();
    counters();
    lightbox();
    transitions();
    anchors();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.XB = {
    reveal: reveal,
    counters: counters,
    parallax: parallax
  };
})();
