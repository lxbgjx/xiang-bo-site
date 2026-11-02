/* ============================================================
   app.js  ·  内容渲染
   所有文案来自 assets/js/content.js
   ============================================================ */
(function () {
  'use strict';
  var S = window.SITE || { meta: {}, projects: [], categories: [] };
  var page = document.body.getAttribute('data-page') || 'home';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  // 标题里允许用 <br> 手动换行：先转义，再把转义后的 <br> 放回来
  function allowBr(html) {
    return String(html == null ? '' : html).replace(/&lt;br\s*\/?&gt;/gi, '<br>');
  }
  // 有真实宽高就写进 <img>，懒加载时浏览器能提前占位，页面不跳
  function dimAttr(w, h) {
    return (w && h) ? ' width="' + (w | 0) + '" height="' + (h | 0) + '"' : '';
  }
  function catName(k) {
    var c = (S.categories || []).filter(function (x) { return x.key === k; })[0];
    return c ? c.name : k;
  }
  function catEn(k) {
    var c = (S.categories || []).filter(function (x) { return x.key === k; })[0];
    return c ? c.en : '';
  }
  /* 宽松匹配：既认 id，也认标题（忽略空格、引号、间隔号大小写差异），
     这样在编辑器里把「精选项目」写成中文标题也能正确命中 */
  function normKey(s) {
    return String(s == null ? '' : s).replace(/[\s\u3000“”"'‘’·・.。,，、\-—_]/g, '').toLowerCase();
  }
  function byId(id) {
    var list = S.projects || [];
    var key = String(id == null ? '' : id).trim();
    if (!key) return null;
    var hit = list.filter(function (p) { return p.id === key; })[0];
    if (hit) return hit;
    var n = normKey(key);
    if (!n) return null;
    hit = list.filter(function (p) { return normKey(p.title) === n; })[0];
    if (hit) return hit;
    return list.filter(function (p) { return normKey(p.title).indexOf(n) >= 0; })[0] || null;
  }
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var ARROW_UP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17L17 7M9 7h8v8"/></svg>';

  /* ---------- 图片块 ---------- */
  function coverImg(p, cls) {
    if (p.cover) {
      return '<img src="' + esc(p.cover) + '" alt="' + esc(p.title) + '" loading="lazy" decoding="async">';
    }
    return '<div class="ph"><span>' + esc(catEn(p.cat) || 'WORK') + '</span>' +
      '<em>' + esc(catName(p.cat)) + '</em></div>';
  }

  /* ---------- 正文块 ---------- */
  function renderBlocks(blocks) {
    return (blocks || []).map(function (b) {
      switch (b.t) {
        case 'h2': return '<h2>' + esc(b.x) + '</h2>';
        case 'h3': return '<h3>' + esc(b.x) + '</h3>';
        case 'p': return '<p' + (b.en ? ' class="en-p"' : '') + '>' + (b.html || esc(b.x)) + '</p>';
        case 'quote': return '<blockquote><p>' + (b.html || esc(b.x)) + '</p></blockquote>';
        case 'list': return '<ul>' + (b.html || '') + '</ul>';
        case 'note': return '<div class="note">' + (b.html || esc(b.x)) + '</div>';
        case 'hr': return '<hr>';
        case 'img':
          return '<figure class="fig"><div class="shot' + (b.crop ? ' crop' : '') + '">' +
            '<img src="' + esc(b.src) + '" alt="' + esc(b.cap || '') + '"' + dimAttr(b.w, b.h) + ' loading="lazy" decoding="async">' +
            '</div>' + (b.cap ? '<figcaption>' + esc(b.cap) + '</figcaption>' : '') + '</figure>';
        case 'gal':
          var cells = (b.srcs || []).map(function (s, i) {
            var cap = (b.caps || [])[i] || '';
            var d = (b.dims || [])[i] || [];
            return '<div class="shot"><img src="' + esc(s) + '" alt="' + esc(cap) + '"' + dimAttr(d[0], d[1]) + ' loading="lazy" decoding="async"></div>';
          }).join('');
          return '<div class="gal">' + cells + '</div>' +
            (b.cap ? '<p style="font-size:12px;color:var(--ink-3);margin:-14px 0 30px">' + esc(b.cap) + '</p>' : '');
        case 'table':
          var th = (b.head || []).map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('');
          var tr = (b.rows || []).map(function (r) {
            return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>';
          }).join('');
          return '<div class="tblwrap"><table><thead><tr>' + th + '</tr></thead><tbody>' + tr + '</tbody></table></div>';
        case 'embed':
          return '<div class="embed"><iframe src="' + esc(b.src) + '" loading="lazy" allowfullscreen ' +
            'allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture"></iframe></div>';
        case 'video':
          var ratio = b.ratio || '16 / 9';
          return '<figure class="fig vidfig">' +
            '<video controls playsinline preload="none" controlslist="nodownload noplaybackrate" ' +
            'disablepictureinpicture oncontextmenu="return false" ' +
            (b.poster ? 'poster="' + esc(b.poster) + '" ' : '') +
            'src="' + esc(b.src) + '" style="aspect-ratio:' + ratio + '"></video>' +
            (b.cap ? '<figcaption>' + esc(b.cap) + '</figcaption>' : '') + '</figure>';
        default: return '';
      }
    }).join('');
  }

  /* ============================================================
     首页
     ============================================================ */
  function renderHome() {
    var H = S.hero || {};
    var m = S.meta || {};
    var titleHtml = (H.title || []).map(function (line, i) {
      return '<span class="line-mask" style="--d:' + (0.08 + i * 0.09) + 's"><span>' + line + '</span></span>';
    }).join('');

    var metaHtml = (H.meta || []).map(function (x) {
      return '<div><dt>' + esc(x.k) + '</dt><dd>' + esc(x.v) + '</dd></div>';
    }).join('');

    var recordHtml = '<p class="record rv">' + (S.record || '') + '</p>';

    var marq = (S.marquee || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');

    var feat = byId(S.featured) || (S.projects || []).filter(function (p) { return p.cat === 'case'; })[0];
    var featHtml = '';
    if (feat) {
      var facts = (feat.facts || []).map(function (f) { return '<li>' + esc(f.k) + ' · ' + esc(f.v) + '</li>'; }).join('');
      featHtml =
        '<div class="feat">' +
          '<a class="feat-media rv" data-rv="left" href="project.html?id=' + esc(feat.id) + '">' +
            coverImg(feat) +
            '<span class="badge">' + esc(catName(feat.cat)) + '</span>' +
          '</a>' +
          '<div class="feat-body rv" data-rv="right">' +
            '<span class="eyebrow"><b>01</b><span class="rule"></span>精选项目</span>' +
            '<h3 class="t-md">' + esc(feat.title) + '</h3>' +
            '<p>' + esc(feat.summary) + '</p>' +
            '<ul class="feat-facts">' + facts + '</ul>' +
            '<a class="link-arrow" href="project.html?id=' + esc(feat.id) + '">查看完整记录 ' + ARROW + '</a>' +
          '</div>' +
        '</div>';
    }

    var catHtml = (S.categories || []).map(function (c, i) {
      var n = (S.projects || []).filter(function (p) { return p.cat === c.key; }).length;
      return '<a class="cat rv" style="--d:' + (i * 70) + 'ms" href="' + esc(c.file || 'work.html') + '">' +
        '<div><b>' + esc(c.name) + '</b><em>' + esc(c.en) + '</em></div>' +
        '<div class="nw"><div class="n">' + String(n).padStart(2, '0') + ' 项</div>' +
        '<span class="go">查看 →</span></div></a>';
    }).join('');

    var skillHtml = (S.skills || []).map(function (s, i) {
      return '<div class="skill rv" style="--d:' + (i * 80) + 'ms">' +
        '<span class="k">' + esc(s.k) + '</span>' +
        '<b>' + esc(s.title) + '</b><p>' + esc(s.desc) + '</p></div>';
    }).join('');

    var html =
      /* hero */
      '<section class="hero">' +
        '<div class="wrap"><div class="hero-grid">' +
          '<div class="hero-copy">' +
            '<div class="hero-eyebrow rv in" style="--d:.05s"><span class="eyebrow">' +
              '<b>' + esc(H.kicker || '') + '</b><span class="rule"></span>' + esc(m.role || '') +
            '</span></div>' +
            '<h1 class="t-xl">' + titleHtml + '</h1>' +
            (H.lede ? '<p class="lead rv" style="--d:.3s">' + H.lede + '</p>' : '') +
            '<div class="hero-acts rv" style="--d:.4s">' +
              '<a class="btn" href="work.html">看作品 ' + ARROW + '</a>' +
              '<a class="btn ghost" href="about.html">关于我</a>' +
            '</div>' +
            '<dl class="hero-meta rv" style="--d:.5s">' + metaHtml + '</dl>' +
          '</div>' +
          '<figure class="hero-figure rv" data-rv="scale" style="--d:.2s">' +
            '<div class="frame"><img src="' + esc(H.cover || '') + '" alt="' + esc(m.name || '') + '" data-parallax="0.06"></div>' +
            '<span class="tag">' + esc(H.coverTag || '') + '</span>' +
            '<span class="num">' + esc(H.num || '') + '</span>' +
          '</figure>' +
        '</div></div>' +
        '<div class="marquee"><div class="marquee-track">' + marq + marq + '</div></div>' +
      '</section>' +

      /* 一句话履历（留空则整块不出） */
      (S.record ? '<section class="record-sec">' +
        '<div class="wrap">' + recordHtml + '</div>' +
      '</section>' : '') +

      /* 引言 */
      '<section class="sec" style="padding-top:0">' +
        '<div class="wrap"><blockquote class="pull rv">' +
          '<p>' + (S.pull || '').replace(/\n/g, '<br>') + '</p>' +
          '<cite>' + esc(m.name || '') + ' · ' + esc(m.en || '') + '</cite>' +
        '</blockquote></div>' +
      '</section>' +

      /* 精选 */
      (featHtml ? '<section class="sec"><div class="wrap">' + featHtml + '</div></section>' : '') +

      /* 分类 */
      '<section class="sec" style="padding-top:0">' +
        '<div class="wrap">' +
          '<div class="sec-head">' +
            '<div><span class="eyebrow"><b>02</b><span class="rule"></span>作品构成</span>' +
            '<h2 class="t-lg" style="margin-top:12px">四类作品，<br>样样都有看头</h2></div>' +
            '<p class="lead">案例是完整交付的项目，现场是活动中拍下的影像，人物是采访写成的报道，' +
            '影片是独立拍摄剪辑的成片。四类合起来，正好串起策划、采写、拍摄、剪辑到发布的一条线，每一项都可以点开核对。</p>' +
          '</div>' +
          '<div class="cats">' + catHtml + '</div>' +
        '</div>' +
      '</section>' +

      /* 能力 */
      '<section class="sec" style="padding-top:0">' +
        '<div class="wrap">' +
          '<div class="sec-head">' +
            '<div><span class="eyebrow"><b>03</b><span class="rule"></span>工作范围</span>' +
            '<h2 class="t-lg" style="margin-top:12px">从方案到成片，<br>一个人接得住</h2></div>' +
            '<p class="lead">一个项目从立项到发布，中间要排节点、写稿、拍照、剪片、投渠道。' +
            '这几件事都在自己手上，不用等下一个人的档期，进度也自己说了算。</p>' +
          '</div>' +
          '<div class="skills">' + skillHtml + '</div>' +
        '</div>' +
      '</section>' +

      /* CTA */
      '<section class="sec" style="padding-top:0">' +
        '<div class="wrap"><div class="cta rv">' +
          '<h2 class="t-lg">有合作或岗位机会，<br>可以直接联系</h2>' +
          '<p>项目合作、内容拍摄、活动记录与全职岗位，均可邮件沟通。' +
          '如需更完整的作品清单、任职证明或作品原件，也可以在邮件中一并说明。</p>' +
          '<div class="acts">' +
            '<a class="btn" href="mailto:' + esc(m.email || '') + '">发邮件 ' + ARROW + '</a>' +
            '<a class="btn ghost" href="about.html#contact">其他联系方式</a>' +
          '</div>' +
        '</div></div>' +
      '</section>';

    $('#main').innerHTML = html;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        var h = $('.hero h1');
        if (h) h.classList.add('in');
      });
    });
  }

  /* ============================================================
     作品总览页：只放分类目录，每类一个入口 + 一张样图
     （不再把 19 个作品混排在一起，也不再重复一排分类按钮）
     ============================================================ */
  function renderWorkIndex() {
    var total = (S.projects || []).length;
    var rows = (S.categories || []).map(function (c, i) {
      var items = (S.projects || []).filter(function (p) { return p.cat === c.key; });
      var sample = items.filter(function (p) { return p.cover; })[0] || items[0];
      return '<a class="wrow rv" style="--d:' + (i * 80) + 'ms" href="' + esc(c.file || 'work.html') + '">' +
        '<div class="wthumb">' +
          (sample ? coverImg(sample) : '<div class="ph"><span>' + esc(c.en || 'WORK') + '</span></div>') +
        '</div>' +
        '<div class="wmain">' +
          '<span class="weyebrow">' + esc(c.en || 'WORK') + ' · ' + String(items.length).padStart(2, '0') + ' 项</span>' +
          '<h2>' + esc(c.name) + '</h2>' +
          (c.desc ? '<p>' + esc(c.desc) + '</p>' : '') +
          '<span class="wgo">查看 →</span>' +
        '</div></a>';
    }).join('');

    var arcCount = ((S.archive || {}).groups || []).reduce(function (s, g) {
      return s + (g.items || []).length;
    }, 0);
    var arcHtml = arcCount ? '<a class="arc-entry rv" href="archive.html">' +
      '<div>' +
        '<span class="weyebrow">ARCHIVE · ' + arcCount + ' 条</span>' +
        '<h2>工作档案</h2>' +
        '<p>2025 年 8 月至 2026 年 10 月任职期间的全部业务活动，按校园、科普、人物、会议等七类归档，' +
        '每条标注稿件数与照片数。以上为遴选后的代表作，此处为全量记录。</p>' +
      '</div>' +
      '<span class="wgo">看全部 →</span></a>' : '';

    $('#main').innerHTML =
      '<header class="phead"><div class="wrap">' +
        '<span class="eyebrow rv"><b>WORK</b><span class="rule"></span>' + total + ' 项</span>' +
        '<h1 class="t-xl rv" style="--d:.06s">作品清单，<br><em style="font-style:normal;color:var(--red)">按类别整理</em></h1>' +
      '</div></header>' +
      '<section style="padding-bottom:clamp(60px,8vw,110px)"><div class="wrap">' +
        '<div class="windex">' + rows + '</div>' +
        arcHtml +
      '</div></section>';
  }

  /* ============================================================
     列表页（单个分类）
     ============================================================ */
  function renderList() {
    var cat = document.body.getAttribute('data-cat') || '';
    var cur = null;
    (S.categories || []).forEach(function (c) { if (c.key === cat) cur = c; });

    if (cat === 'people') { renderPeople(cur); return; }
    if (!cur) { renderWorkIndex(S); return; }

    var list = (S.projects || []).filter(function (p) { return !cat || p.cat === cat; });
    /* 现场：会议打头，接着是补的几场，视频合集垫底 */
    if (cat === 'scene') {
      var so = ['meeting', 'sc-innovation-40', 'sc-yuan-workshop', 'sc-laoyu', 'activity', 'douyin'];
      list = list.slice().sort(function (a, b) {
        var ia = so.indexOf(a.id), ib = so.indexOf(b.id);
        if (ia < 0) ia = 99;
        if (ib < 0) ib = 99;
        return ia - ib;
      });
    }

    var cards = list.map(function (p, i) {
      return '<a class="card rv" style="--d:' + Math.min(i * 55, 400) + 'ms" ' +
        'data-cat="' + esc(p.cat) + '" href="project.html?id=' + esc(p.id) + '">' +
        '<div class="cm">' + coverImg(p) + '<span class="access">ACCESS →</span></div>' +
        '<div class="cw">' +
          '<div class="cmeta"><span class="c">' + esc(catName(p.cat)) + '</span>' +
          '<span>·</span><span>' + esc(p.date || '') + '</span></div>' +
          '<h3>' + esc(p.title) + '</h3>' +
          (p.honor ? '<p class="chonor">' + esc(p.honor) + '</p>' : '') +
          (p.summary && !p.honor ? '<p>' + esc(p.summary) + '</p>' : '') +
          (p.ext ? '<span class="cext">打开专访 →</span>' : '') +
        '</div></a>';
    }).join('');

    var heading = allowBr(esc(cur.heading || cur.name));
    var desc = esc(cur.desc || '');
    var eyebrow = esc(cur.en || 'WORK');

    $('#main').innerHTML =
      '<header class="phead"><div class="wrap">' +
        '<span class="eyebrow rv"><b>' + eyebrow + '</b><span class="rule"></span>' + list.length + ' 项</span>' +
        '<h1 class="t-xl rv" style="--d:.06s">' + heading + '</h1>' +
        (desc ? '<p class="lead rv" style="--d:.12s">' + desc + '</p>' : '') +
      '</div></header>' +
      '<section style="padding-bottom:clamp(60px,8vw,110px)"><div class="wrap">' +
        '<div class="grid" id="grid">' + cards + '</div>' +
        '<div class="empty" id="empty" style="display:none">这个分类下暂时没有内容。</div>' +
      '</div></section>';
  }

  /* ============================================================
     人物页：七位一页
     每人的料就一张现场照加一段话，拆成七个详情页只会得到七个空房间。
     ============================================================ */
  function renderPeople(cur) {
    cur = cur || {};
    var list = (S.projects || []).filter(function (p) { return p.cat === 'people'; });

    var cards = list.map(function (p, i) {
      var meta = [p.date, p.role].filter(Boolean).map(function (v) { return esc(v); }).join(' · ');
      return '<article class="pcard rv" style="--d:' + Math.min(i * 60, 360) + 'ms">' +
        '<div class="pfig">' +
          (p.cover ? '<img src="' + esc(p.cover) + '" alt="' + esc(p.title) + '" loading="lazy" decoding="async">' : '') +
        '</div>' +
        '<div class="ptxt">' +
          '<h2>' + esc(p.title) + '</h2>' +
          (p.honor ? '<p class="prole">' + esc(p.honor) + '</p>' : '') +
          (p.summary ? '<p class="psum">' + esc(p.summary) + '</p>' : '') +
          (meta ? '<p class="pmeta">' + meta + '</p>' : '') +
          (p.ext ? '<a class="pext" href="' + esc(p.ext) + '" target="_blank" rel="noopener">' +
            '读原文' + (p.extName ? ' · ' + esc(p.extName) : '') + ' <span>↗</span></a>' : '') +
        '</div></article>';
    }).join('');

    $('#main').innerHTML =
      '<header class="phead"><div class="wrap">' +
        '<span class="eyebrow rv"><b>' + esc(cur.en || 'PEOPLE') + '</b><span class="rule"></span>' + list.length + ' 位</span>' +
        '<h1 class="t-xl rv" style="--d:.06s">' + allowBr(esc(cur.heading || cur.name || '跟谁聊过')) + '</h1>' +
        (cur.desc ? '<p class="lead rv" style="--d:.12s">' + esc(cur.desc) + '</p>' : '') +
      '</div></header>' +
      '<section style="padding-bottom:clamp(60px,8vw,110px)"><div class="wrap">' +
        '<div class="pgrid">' + cards + '</div>' +
      '</div></section>';
  }

  /* ============================================================
     详情页
     ============================================================ */
  /* 人物页：封面已经在正文上方大图展示过，正文里不重复出现同一张 */
  function bodyOnly(p) {
    return (p.blocks || []).filter(function (b) {
      return !(b.t === 'img' && p.cover && b.src === p.cover);
    });
  }

  function renderDetail() {
    var params = new URLSearchParams(location.search);
    var id = params.get('id');
    var list = S.projects || [];
    var p = byId(id) || list[0];
    if (!p) { $('#main').innerHTML = '<div class="wrap" style="padding:160px 0"><p class="lead">没有找到这个项目。</p></div>'; return; }

    document.title = p.title + ' · ' + ((S.meta || {}).name || 'xiang-bo.top');

    // 这个项目属于哪个板块，返回链接就指向那个板块
    var curCat = null;
    (S.categories || []).forEach(function (c) { if (c.key === p.cat) curCat = c; });
    var backFile = curCat ? curCat.file : 'work.html';
    var backName = curCat ? curCat.name : '全部作品';

    /* 上下篇只在同一个板块里翻，别把影片的上一篇接到人物上 */
    var siblings = list.filter(function (x) { return x.cat === p.cat; });
    var idx = siblings.indexOf(p);
    var prev = siblings[idx - 1], next = siblings[idx + 1];

    var metaHtml = [
      { k: '分类', v: catName(p.cat) },
      { k: '时间', v: p.date || '—' },
      (p.role ? { k: '角色', v: p.role } : null)
    ].filter(Boolean).concat(p.facts || []).slice(0, 4).map(function (f) {
      return '<div><dt>' + esc(f.k) + '</dt><dd>' + esc(f.v) + '</dd></div>';
    }).join('');

    var pager = '<div class="pager">' +
      (prev ? '<a href="project.html?id=' + esc(prev.id) + '"><span class="k">← 上一个</span><b>' + esc(prev.title) + '</b></a>'
        : '<a href="' + esc(backFile) + '"><span class="k">← 返回</span><b>' + esc(backName) + '</b></a>') +
      (next ? '<a class="next" href="project.html?id=' + esc(next.id) + '"><span class="k">下一个 →</span><b>' + esc(next.title) + '</b></a>'
        : '<a class="next" href="' + esc(backFile) + '"><span class="k">返回 →</span><b>' + esc(backName) + '</b></a>') +
      '</div>';

    $('#main').innerHTML =
      '<header class="dhead"><div class="wrap">' +
        '<div class="crumb"><a href="index.html">首页</a><span class="sep">/</span>' +
          '<a href="' + esc(backFile) + '">' + esc(backName) + '</a><span class="sep">/</span><span>' + esc(p.title) + '</span></div>' +
        '<h1 class="t-xl rv">' + esc(p.title) + '</h1>' +
        (p.honor ? '<p class="dhonor rv" style="--d:.05s">' + esc(p.honor) + '</p>' : '') +
        '<p class="sub rv" style="--d:.08s">' + esc(p.summary || '') + '</p>' +
        '<dl class="dmeta rv" style="--d:.14s">' + metaHtml + '</dl>' +
        (p.ext ? '<div class="rv" style="--d:.18s"><a class="extlink" href="' + esc(p.ext) + '" target="_blank" rel="noopener">' +
          '阅读报道原文' + (p.extName ? ' · ' + esc(p.extName) : '') + ' <span>↗</span></a>' +
 '</div>' : '') +
      '</div></header>' +
      '<div class="wrap">' +
        '<div class="dcover rv" data-rv="scale">' +
          '<img src="' + esc(p.cover || '') + '" alt="' + esc(p.title) + '" data-parallax="0.05">' +
        '</div>' +
      '</div>' +
      '<article class="body-flow">' + renderBlocks(p.cat === 'people' ? bodyOnly(p) : p.blocks) + '</article>' +
      '<div class="wrap" style="max-width:880px">' + pager + '</div>';

    // 让正文块也参与动效
    $$('.body-flow > *').forEach(function (el, i) {
      el.classList.add('rv');
      el.style.setProperty('--d', Math.min(i * 30, 220) + 'ms');
    });
    $$('.body-flow .fig, .body-flow .gal').forEach(function (el) {
      el.classList.add('rv');
    });
  }

  /* ============================================================
     工作档案
     ============================================================ */
  function renderArchive() {
    var A = S.archive || {};
    var groups = A.groups || [];
    var num = function (n) { return Number(n || 0).toLocaleString('en-US'); };

    var stats = (A.stats || []).map(function (s) {
      return '<div><b>' + esc(s.v) + '</b><span>' + esc(s.k) + '</span></div>';
    }).join('');

    var body = groups.map(function (g, gi) {
      var items = g.items || [];
      var doc = items.reduce(function (a, i) { return a + (i.d || 0); }, 0);
      var img = items.reduce(function (a, i) { return a + (i.p || 0); }, 0);
      var lastY = '';
      var lis = items.map(function (it) {
        var head = '';
        if (it.y !== lastY) { head = '<li class="ayear">' + esc(it.y) + '</li>'; lastY = it.y; }
        var cnt = [];
        if (it.d) cnt.push(it.d + ' 稿');
        if (it.p) cnt.push(it.p + ' 图');
        if (it.v) cnt.push(it.v + ' 段');
        return head + '<li><span class="ad">' + esc(it.date || '') + '</span>' +
          '<span class="an">' + esc(it.n) + '</span>' +
          '<span class="ac">' + cnt.join(' · ') + '</span></li>';
      }).join('');

      return '<article class="agroup rv" style="--d:' + Math.min(gi * 55, 300) + 'ms">' +
        '<div class="agtop">' +
          '<div class="agimg"><img src="' + esc(g.img || '') + '" alt="' + esc(g.name) + '" loading="lazy" decoding="async"></div>' +
          '<div class="aghead">' +
            '<span class="agk"><b>' + esc(g.k) + '</b>' + esc(g.en || '') + '</span>' +
            '<h2>' + esc(g.name) + '</h2>' +
            '<p>' + esc(g.desc || '') + '</p>' +
            '<span class="agstat">' + items.length + ' 个活动 · ' + doc + ' 份稿件 · ' + num(img) + ' 张照片</span>' +
          '</div>' +
        '</div>' +
        '<ul class="alist">' + lis + '</ul>' +
      '</article>';
    }).join('');

    var t = A.title || [];
    $('#main').innerHTML =
      '<header class="phead"><div class="wrap">' +
        '<span class="eyebrow rv"><b>ARCHIVE</b><span class="rule"></span>' + esc(A.kicker || '') + '</span>' +
        '<h1 class="t-xl rv" style="--d:.06s">' + esc(t[0] || '') + '<br><em class="azed">' + esc(t[1] || '') + '</em></h1>' +
        (A.intro ? '<p class="lead rv" style="--d:.1s">' + esc(A.intro) + '</p>' : '') +
        '<div class="astats rv" style="--d:.14s">' + stats + '</div>' +
      '</div></header>' +
      '<section class="archwrap"><div class="wrap">' +
        body +
        (A.note ? '<p class="anote">' + esc(A.note) + '</p>' : '') +
      '</div></section>';
  }

  /* ============================================================
     关于页
     ============================================================ */
  function renderAbout() {
    var A = S.about || {};
    var m = S.meta || {};

    // 中文为主，英文对照跟在后面
    var paraHtml = (A.paras || []).map(function (p) {
      var zh = p.zh || '';
      var en = p.en || '';
      return (zh ? '<p>' + zh + '</p>' : '') +
             (en ? '<p class="en-p">' + en + '</p>' : '');
    }).join('');

    var photoHtml = (A.photos || []).map(function (ph, i) {
      return '<figure class="rv" style="--d:' + (i * 60) + 'ms"><div class="shot">' +
        '<img src="' + esc(ph.src) + '" alt="' + esc(ph.cap) + '"' + dimAttr(ph.w, ph.h) + ' loading="lazy" decoding="async">' +
        '</div><figcaption>' + esc(ph.cap) + '</figcaption></figure>';
    }).join('');

    var tlHtml = (S.timeline || []).map(function (t) {
      return '<div class="tl-item rv"><div class="tl-when">' + esc(t.when) + '</div>' +
        '<div class="tl-body"><b>' + esc(t.title) + '</b><p>' + esc(t.desc) + '</p></div></div>';
    }).join('');

    var awardHtml = (S.awards || []).map(function (a) {
      return '<div class="award"><span class="y">' + esc(a.year) + '</span>' +
        '<b>' + esc(a.title) + '</b><span>' + esc(a.org || '') + '</span></div>';
    }).join('');

    $('#main').innerHTML =
      '<header class="about-hero"><div class="wrap">' +
        '<span class="eyebrow rv"><b>ABOUT</b><span class="rule"></span>' + esc(m.en || '') + '</span>' +
        '<h1 class="t-xl rv" style="--d:.06s">' + allowBr(esc(A.title || '')) + '</h1>' +
        '<p class="lead rv" style="--d:.12s;max-width:34em">' + esc(A.lede || '') + '</p>' +
      '</div></header>' +

      '<section style="padding-bottom:clamp(40px,6vw,80px)"><div class="wrap"><div class="about-grid">' +
        '<aside class="side rv">' +
          '<h2 class="t-md">' + esc(A.sideTitle || '我是谁') + '</h2>' +
          '<p class="en">' + esc(A.sideEn || '') + '</p>' +
          '<dl class="hero-meta" style="margin-top:0;border-top:none;padding-top:0;flex-direction:column;gap:18px">' +
            '<div><dt>坐标</dt><dd>' + esc(m.city || '') + '</dd></div>' +
            '<div><dt>方向</dt><dd>' + esc(m.role || '') + '</dd></div>' +
            '<div><dt>邮箱</dt><dd>' + esc(m.email || '') + '</dd></div>' +
          '</dl>' +
        '</aside>' +
        '<div class="main rv" style="--d:.1s">' + paraHtml + '</div>' +
      '</div></div></section>' +

      (photoHtml ? '<section style="padding-top:0"><div class="wrap">' +
        '<span class="eyebrow"><b>02</b><span class="rule"></span>在现场</span>' +
        '<div class="photo-grid" data-stagger="60">' + photoHtml + '</div>' +
      '</div></section>' : '') +

      (tlHtml ? '<section class="sec"><div class="wrap"><div class="sec-head">' +
        '<div><span class="eyebrow"><b>03</b><span class="rule"></span>工作经历</span>' +
        '<h2 class="t-lg" style="margin-top:12px">从工地到政务现场</h2></div>' +
        '<p class="lead">拍摄对象由建设工地延伸至省市级政务活动，工作范围由县城街巷扩展至高山峡谷。' +
        '以下节点按时间排列，可以看到拍摄对象、工作内容与职责范围的变化。</p></div>' +
        '<div class="tl">' + tlHtml + '</div>' +
      '</div></section>' : '') +

      (awardHtml ? '<section class="sec" style="padding-top:0"><div class="wrap">' +
        '<span class="eyebrow"><b>04</b><span class="rule"></span>获奖</span>' +
        '<h2 class="t-lg" style="margin-top:12px;margin-bottom:8px">获奖与证书</h2>' +
        '<div class="awards">' + awardHtml + '</div>' +
      '</div></section>' : '') +

      '<section class="sec" id="contact" style="padding-top:0"><div class="wrap"><div class="cta rv">' +
        '<h2 class="t-lg">有合作意向，<br>可以通过邮件联系</h2>' +
        '<p>项目合作、内容拍摄、活动记录与全职岗位，均可邮件沟通。' +
        '请附具体需求与时间安排，便于尽快回复，工作日当日答复。</p>' +
        '<div class="acts">' +
          '<a class="btn" href="mailto:' + esc(m.email || '') + '">' + esc(m.email || '写邮件') + ' ' + ARROW + '</a>' +
          (m.wechat ? '<span class="btn ghost" style="cursor:default">微信：' + esc(m.wechat) + '</span>' : '') +
        '</div>' +
      '</div></div></section>';
  }

  /* ---------- 路由 ---------- */
  try {
    if (page === 'home') renderHome();
    else if (page === 'work') renderList();
    else if (page === 'project') renderDetail();
    else if (page === 'archive') renderArchive();
    else if (page === 'about') renderAbout();
  } catch (err) {
    console.error('[render]', err);
    var m = $('#main');
    if (m) m.innerHTML = '<div class="wrap" style="padding:160px 0"><p class="lead">页面加载出了点问题，刷新试试。</p><p class="small">' + esc(err.message) + '</p></div>';
  }

  // 内容渲染完再跑一次动效挂载
  if (window.XB) {
    window.XB.reveal();
    window.XB.counters();
    window.XB.parallax();
  }
})();
