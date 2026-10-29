/* ============================================================
   editor.js  ·  可视化内容编辑
   数据源：assets/js/content.js 里的 window.SITE
   保存：localStorage 草稿 + 导出 content.js
   ============================================================ */
(function () {
  'use strict';
  var KEY = 'xb-content-draft';
  var ORIGINAL = window.SITE ? JSON.parse(JSON.stringify(window.SITE)) : null;
  var DATA = null;
  var IMGS = [];
  var dirty = false;
  var page = 'site';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 工具 ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function set(obj, path, val) {
    var ks = path.split('.'), last = ks.pop();
    var t = ks.reduce(function (o, k) { return o[k]; }, obj);
    t[last] = val;
  }
  function markDirty() {
    dirty = true;
    var s = $('#status');
    s.textContent = '有未导出的改动';
    s.classList.add('dirty');
  }
  function clean() {
    dirty = false;
    var s = $('#status');
    s.textContent = '已保存到本机';
    s.classList.remove('dirty');
  }

  /* ---------- 字段渲染 ---------- */
  function fld(label, path, val, hint) {
    return '<div class="fld"><label>' + label + (hint ? ' <b>' + hint + '</b>' : '') + '</label>' +
      '<input class="inp" data-path="' + path + '" value="' + esc(val) + '"></div>';
  }
  function area(label, path, val, rows) {
    return '<div class="fld"><label>' + label + '</label>' +
      '<textarea class="inp" rows="' + (rows || 3) + '" data-path="' + path + '">' + esc(val) + '</textarea></div>';
  }
  function numF(label, path, val) {
    return '<div class="fld"><label>' + label + '</label>' +
      '<input class="inp num" type="number" data-path="' + path + '" value="' + esc(val) + '"></div>';
  }
  function imgF(label, path, val) {
    return '<div class="fld"><label>' + label + '</label><div class="imgf">' +
      '<div class="prev">' + (val ? '<img src="' + esc(val) + '" alt="">' : '') + '</div>' +
      '<div class="col"><input class="inp" data-path="' + path + '" value="' + esc(val) + '">' +
      '<button class="pick" data-pick="' + path + '">从图库选择 →</button></div></div></div>';
  }
  function selF(label, path, val, opts) {
    return '<div class="fld"><label>' + label + '</label><select class="inp" data-path="' + path + '">' +
      opts.map(function (o) {
        return '<option value="' + esc(o.v) + '"' + (o.v === val ? ' selected' : '') + '>' + esc(o.t) + '</option>';
      }).join('') + '</select></div>';
  }

  /* ---------- 分区渲染 ---------- */
  function renderSite() {
    var m = DATA.meta, h = DATA.hero;
    var html = '<h2 class="sect">站点与首屏</h2>' +
      '<p class="hint">这些内容会出现在每一页的页脚，以及首页最上方。</p>' +
      '<div class="row2">' +
        fld('姓名', 'meta.name', m.name) +
        fld('英文名', 'meta.en', m.en) +
      '</div>' +
      '<div class="row2">' +
        fld('身份（一行）', 'meta.role', m.role) +
        fld('所在城市', 'meta.city', m.city) +
      '</div>' +
      '<div class="row2">' +
        fld('邮箱', 'meta.email', m.email, '必填') +
        fld('微信号（可留空）', 'meta.wechat', m.wechat) +
      '</div>';

    html += '<h2 class="sect" style="margin-top:38px">首屏</h2>' +
      '<p class="hint">标题分两行显示，第二行会延续同一字号。建议每行 3–6 个字。</p>' +
      '<div class="row2">' +
        fld('小标签', 'hero.kicker', h.kicker) +
        fld('照片角标', 'hero.coverTag', h.coverTag) +
      '</div>' +
      '<div class="row2">' +
        fld('大标题第一行', 'hero.title.0', h.title[0]) +
        fld('大标题第二行', 'hero.title.1', h.title[1]) +
      '</div>' +
      area('开场段落（可含 <strong> 加粗）', 'hero.lede', h.lede, 4) +
      imgF('首屏照片', 'hero.cover', h.cover) +
      fld('背景数字（淡红色大字，可留空）', 'hero.num', h.num) +
      '<div class="subh" style="font-size:12px;color:var(--muted);margin:22px 0 8px;letter-spacing:.1em">首屏三项信息</div>' +
      ['身份', '领域', '坐标'].map(function (_, i) {
        var it = (h.meta && h.meta[i]) || { k: '', v: '' };
        return '<div class="row2">' +
          fld('第 ' + (i + 1) + ' 项标题', 'hero.meta.' + i + '.k', it.k) +
          fld('第 ' + (i + 1) + ' 项内容', 'hero.meta.' + i + '.v', it.v) +
          '</div>';
      }).join('');

    $('#panel').innerHTML = html;
  }

  function renderHome() {
    var html = '<h2 class="sect">数字栏</h2>' +
      '<p class="hint">首页四格数据。数字会滚动递增，单位跟在数字后面。</p>';
    (DATA.stats || []).forEach(function (s, i) {
      html += '<div class="card open"><div class="ch"><span class="k">' + (i + 1) + '</span>' +
        '<span class="t">' + esc(s.label || '未命名') + '</span></div><div class="cb"><div class="row3">' +
        numF('数字', 'stats.' + i + '.n', s.n) +
        fld('单位/后缀', 'stats.' + i + '.suffix', s.suffix) +
        fld('说明文字', 'stats.' + i + '.label', s.label) +
        '</div></div></div>';
    });

    html += '<h2 class="sect" style="margin-top:38px">引言</h2>' +
      '<p class="hint">首页中间的大字引言，换行请直接回车。</p>' +
      area('引言内容', 'pull', DATA.pull, 3) +
      fld('作品页导语', 'workIntro', DATA.workIntro) +
      fld('精选项目 ID', 'featured', DATA.featured, '对应下方作品的 id');

    html += '<h2 class="sect" style="margin-top:38px">跑马灯文字</h2>' +
      '<p class="hint">首屏下方横向滚动的那行词，用逗号分隔。</p>' +
      area('词条（逗号分隔）', '_marquee', (DATA.marquee || []).join('，'), 2);

    html += '<h2 class="sect" style="margin-top:38px">能力四格</h2>';
    (DATA.skills || []).forEach(function (s, i) {
      html += '<div class="card open"><div class="ch"><span class="k">0' + (i + 1) + '</span>' +
        '<span class="t">' + esc(s.title || '') + '</span></div><div class="cb">' +
        '<div class="row2">' + fld('小标号', 'skills.' + i + '.k', s.k) + fld('标题', 'skills.' + i + '.title', s.title) + '</div>' +
        area('说明', 'skills.' + i + '.desc', s.desc, 2) +
        '</div></div>';
    });

    html += '<h2 class="sect" style="margin-top:38px">作品分类</h2>' +
      '<p class="hint">分类的 key 会用在作品页的筛选按钮上，改动后请确认与作品里的分类一致。</p>';
    (DATA.categories || []).forEach(function (c, i) {
      html += '<div class="row3" style="margin-bottom:8px">' +
        fld('key', 'categories.' + i + '.key', c.key) +
        fld('中文名', 'categories.' + i + '.name', c.name) +
        fld('英文名', 'categories.' + i + '.en', c.en) +
        '</div>';
    });

    $('#panel').innerHTML = html;
  }

  /* ---------- 作品 ---------- */
  var CATS = [{ v: 'project', t: '项目经历' }, { v: 'film', t: '中长视频' }, { v: 'short', t: '短视频' }, { v: 'gallery', t: '作品图集' }];
  var TYPES = [
    { v: 'p', t: '段落' }, { v: 'h2', t: '小标题' }, { v: 'h3', t: '次标题' },
    { v: 'img', t: '图片' }, { v: 'gal', t: '图组' }, { v: 'quote', t: '引用' },
    { v: 'list', t: '列表' }, { v: 'table', t: '表格' }, { v: 'embed', t: '视频嵌入' }, { v: 'hr', t: '分隔线' }
  ];

  function blockEditor(pi, bi, b) {
    var base = 'projects.' + pi + '.blocks.' + bi;
    var inner = '';
    if (b.t === 'img') {
      inner = imgF('图片', base + '.src', b.src) + fld('图注（可留空）', base + '.cap', b.cap);
    } else if (b.t === 'gal') {
      inner = '<div class="fld"><label>图组（每行一个图片路径）</label><textarea class="inp" rows="3" data-path="' + base + '.srcs" data-split="1">' +
        esc((b.srcs || []).join('\n')) + '</textarea>' +
        '<button class="pick" data-pick-multi="' + base + '.srcs">批量选择 →</button></div>';
    } else if (b.t === 'table') {
      inner = '<div class="fld"><label>表格（JSON，保持格式）</label><textarea class="inp" rows="6" data-path="' + base + '" data-json="1">' +
        esc(JSON.stringify({ t: 'table', head: b.head, rows: b.rows }, null, 1)) + '</textarea></div>';
    } else if (b.t === 'hr') {
      inner = '<div style="font-size:12px;color:var(--muted);padding:4px 0">一条分隔线，无需设置。</div>';
    } else if (b.t === 'embed') {
      inner = fld('视频地址', base + '.src', b.src);
    } else if (b.t === 'h2' || b.t === 'h3') {
      inner = fld('标题文字', base + '.x', b.x);
    } else {
      inner = '<div class="fld"><label>正文（可含 &lt;strong&gt; &lt;a&gt; 标签）</label>' +
        '<textarea class="inp" rows="4" data-path="' + base + '.html">' + esc(b.html || b.x || '') + '</textarea></div>';
    }
    var brief = b.t === 'img' ? (b.cap || b.src || '') : (b.x || (b.html || '').replace(/<[^>]+>/g, '') || (b.srcs || []).join(', '));
    return '<div class="blk"><div class="bh">' +
      '<span class="ty">' + esc(b.t) + '</span>' +
      '<span class="sm">' + esc(String(brief).slice(0, 60)) + '</span>' +
      '<span class="acts">' +
        '<button data-act="blk-up" data-pi="' + pi + '" data-bi="' + bi + '">↑</button>' +
        '<button data-act="blk-down" data-pi="' + pi + '" data-bi="' + bi + '">↓</button>' +
        '<button class="del" data-act="blk-del" data-pi="' + pi + '" data-bi="' + bi + '">×</button>' +
      '</span></div><div class="bb">' + inner + '</div></div>';
  }

  function renderWork() {
    var html = '<h2 class="sect">作品（' + DATA.projects.length + ' 项）</h2>' +
      '<p class="hint">点开任意一项编辑。排序就是作品页的显示顺序；分类决定它出现在哪个筛选里。</p>' +
      '<div class="tip"><b>提示：</b>封面图建议用横图（4:3 左右）。正文块里，图片后紧跟的短句会自动变成图注。</div>';

    DATA.projects.forEach(function (p, i) {
      var thumb = p.cover ? '<img src="' + esc(p.cover) + '" alt="">' : '<div style="width:100%;height:100%;background:linear-gradient(140deg,#EFEADE,#E3DBC9)"></div>';
      html += '<div class="pitem" data-pi="' + i + '">' +
        '<div class="ph2" data-toggle="' + i + '">' +
          '<div class="thumb">' + thumb + '</div>' +
          '<div class="tt"><b>' + esc(p.title || '未命名') + '</b>' +
            '<span>' + esc((p.date || '') + ' · ' + (p.cat || '')) + '</span></div>' +
          '<span class="cat">' + esc(p.cat || '') + '</span>' +
          '<span class="acts">' +
            '<button data-act="p-up" data-pi="' + i + '">↑</button>' +
            '<button data-act="p-down" data-pi="' + i + '">↓</button>' +
            '<button class="del" data-act="p-del" data-pi="' + i + '">×</button>' +
          '</span>' +
        '</div>' +
        '<div class="pb" data-body="' + i + '">' +
          '<div class="row2">' +
            fld('标题', 'projects.' + i + '.title', p.title) +
            fld('英文名', 'projects.' + i + '.en', p.en) +
          '</div>' +
          '<div class="row3">' +
            selF('分类', 'projects.' + i + '.cat', p.cat, CATS) +
            fld('日期（如 2026.03）', 'projects.' + i + '.date', p.date) +
            fld('id（链接用）', 'projects.' + i + '.id', p.id) +
          '</div>' +
          area('一句话摘要（列表卡片上显示）', 'projects.' + i + '.summary', p.summary, 2) +
          fld('我的角色', 'projects.' + i + '.role', p.role) +
          imgF('封面图', 'projects.' + i + '.cover', p.cover) +
          '<div class="subh" style="font-size:12px;color:var(--muted);margin:18px 0 8px;letter-spacing:.1em">详情页元信息</div>' +
          (p.facts || []).map(function (f, fi) {
            return '<div class="row2">' +
              fld('项 ' + (fi + 1) + ' 标题', 'projects.' + i + '.facts.' + fi + '.k', f.k) +
              fld('项 ' + (fi + 1) + ' 内容', 'projects.' + i + '.facts.' + fi + '.v', f.v) +
              '</div>';
          }).join('') +
          '<div class="subh" style="font-size:12px;color:var(--muted);margin:20px 0 8px;letter-spacing:.1em">正文（' +
            (p.blocks || []).length + ' 块）</div>' +
          (p.blocks || []).map(function (b, bi) { return blockEditor(i, bi, b); }).join('') +
          '<div class="addbtn" data-act="blk-add" data-pi="' + i + '">＋ 添加正文块</div>' +
        '</div></div>';
    });

    html += '<div class="addbtn" data-act="p-add" style="margin-top:14px;font-size:13px">＋ 新增一个作品</div>';
    $('#panel').innerHTML = html;
  }

  /* ---------- 关于 & 其他 ---------- */
  function renderAbout() {
    var a = DATA.about;
    var html = '<h2 class="sect">关于页</h2>' +
      '<p class="hint">标题支持 &lt;br&gt; 换行。</p>' +
      area('大标题', 'about.title', a.title, 2) +
      area('开场段落', 'about.lede', a.lede, 3) +
      '<div class="row2">' +
        fld('侧栏标题', 'about.sideTitle', a.sideTitle) +
        fld('侧栏英文', 'about.sideEn', a.sideEn) +
      '</div>' +
      '<h2 class="sect" style="margin-top:34px">正文段落</h2>' +
      '<p class="hint">每块是「中文 + 英文」一组。英文可留空，留空就不显示。</p>';
    (a.paras || []).forEach(function (p, i) {
      html += '<div class="card open"><div class="ch"><span class="k">' + (i + 1) + '</span>' +
        '<span class="t">' + esc((p.zh || '').replace(/<[^>]+>/g, '').slice(0, 34)) + '</span>' +
        '<span class="acts"><button class="del" data-act="para-del" data-i="' + i + '">×</button></span></div>' +
        '<div class="cb">' + area('中文', 'about.paras.' + i + '.zh', p.zh, 3) +
        area('英文（可留空）', 'about.paras.' + i + '.en', p.en, 3) + '</div></div>';
    });
    html += '<div class="addbtn" data-act="para-add">＋ 增加一段</div>';

    html += '<h2 class="sect" style="margin-top:34px">照片（' + (a.photos || []).length + ' 张）</h2>' +
      '<p class="hint">关于页的现场照片，三列排布。</p>';
    (a.photos || []).forEach(function (ph, i) {
      html += '<div class="card"><div class="ch"><span class="k">' + (i + 1) + '</span>' +
        '<span class="t">' + esc(ph.cap || '无说明') + '</span>' +
        '<span class="acts"><button class="del" data-act="photo-del" data-i="' + i + '">×</button></span></div>' +
        '<div class="cb">' + imgF('图片', 'about.photos.' + i + '.src', ph.src) +
        fld('图注', 'about.photos.' + i + '.cap', ph.cap) + '</div></div>';
    });
    html += '<div class="addbtn" data-act="photo-add">＋ 增加一张</div>';
    $('#panel').innerHTML = html;
  }

  function renderExtra() {
    var html = '<h2 class="sect">时间线</h2><p class="hint">关于页的竖排节点。</p>';
    (DATA.timeline || []).forEach(function (t, i) {
      html += '<div class="card open"><div class="ch"><span class="k">' + i + '</span>' +
        '<span class="t">' + esc(t.title || '') + '</span>' +
        '<span class="acts"><button class="del" data-act="tl-del" data-i="' + i + '">×</button></span></div><div class="cb">' +
        '<div class="row2">' + fld('年份', 'timeline.' + i + '.when', t.when) +
        fld('标题', 'timeline.' + i + '.title', t.title) + '</div>' +
        area('说明', 'timeline.' + i + '.desc', t.desc, 2) + '</div></div>';
    });
    html += '<div class="addbtn" data-act="tl-add">＋ 增加节点</div>';

    html += '<h2 class="sect" style="margin-top:34px">奖项</h2>';
    (DATA.awards || []).forEach(function (a, i) {
      html += '<div class="row3" style="margin-bottom:8px">' +
        fld('年份', 'awards.' + i + '.year', a.year) +
        fld('奖项', 'awards.' + i + '.title', a.title) +
        fld('颁发方', 'awards.' + i + '.org', a.org) + '</div>';
    });
    html += '<div class="addbtn" data-act="aw-add">＋ 增加奖项</div>';
    $('#panel').innerHTML = html;
  }

  function renderHelp() {
    $('#panel').innerHTML = '<h2 class="sect">改完怎么发布</h2>' +
      '<p class="hint">网站是纯静态文件，内容都存在 <code>assets/js/content.js</code> 里。所以「改内容」= 换掉这个文件。</p>' +
      '<div class="tip"><b>三步走：</b><br>' +
      '1. 在这里改好，点右上角「导出 content.js」，浏览器会下载一个文件。<br>' +
      '2. 打开你的 GitHub 仓库，找到 <code>assets/js/content.js</code>，点右上角铅笔图标编辑，把整个文件内容换成刚下载的。<br>' +
      '3. 提交（Commit changes）。Vercel 会自动重新部署，一两分钟后 xiang-bo.top 就是新的。' +
      '</div>' +
      '<h2 class="sect" style="margin-top:30px">几个注意</h2>' +
      '<p class="hint" style="line-height:2">' +
      '· 「存到本机」只是把草稿存在当前浏览器里，方便你改到一半关掉下次接着改，<b>不会</b>更新线上。<br>' +
      '· 换了电脑或清了浏览器缓存，草稿就没了，所以改完记得导出。<br>' +
      '· 图片放在 <code>assets/img/</code>。想加新图，先把图片传到这个目录，它就会出现在「从图库选择」里。' +
      '编辑器里选的图片路径是相对路径，不要填完整网址。<br>' +
      '· 正文里可以用 <code>&lt;strong&gt;</code> 加粗、<code>&lt;a href=""&gt;</code> 加链接，其它标签会被原样显示。<br>' +
      '· 导出前可以先点「预览站点」看一眼。' +
      '</p>';
  }

  /* ---------- 渲染入口 ---------- */
  function render() {
    if (page === 'site') renderSite();
    else if (page === 'home') renderHome();
    else if (page === 'work') renderWork();
    else if (page === 'about') renderAbout();
    else if (page === 'extra') renderExtra();
    else renderHelp();
  }

  /* ---------- 事件 ---------- */
  document.addEventListener('input', function (e) {
    var t = e.target, path = t.getAttribute('data-path');
    if (!path) return;

    if (t.getAttribute('data-json')) {
      try { set(DATA, path, JSON.parse(t.value)); markDirty(); } catch (err) { /* 输入中途忽略 */ }
      return;
    }
    if (t.getAttribute('data-split')) {
      var arr = t.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      set(DATA, path, arr); markDirty(); return;
    }
    if (path === '_marquee') {
      DATA.marquee = t.value.split(/[,，]/).map(function (s) { return s.trim(); }).filter(Boolean);
      markDirty(); return;
    }
    var v = t.type === 'number' ? Number(t.value) : t.value;
    set(DATA, path, v);
    markDirty();

    // 标题/封面实时更新左侧列表
    if (/projects\.\d+\.(title|cover|date|cat)$/.test(path)) {
      var pi = path.split('.')[1];
      var item = $('.pitem[data-pi="' + pi + '"]');
      if (item && /title$/.test(path)) {
        item.querySelector('.tt b').textContent = v || '未命名';
      }
    }
    // 图片预览
    if (t.parentNode && t.parentNode.classList.contains('col')) {
      var prev = t.parentNode.parentNode.querySelector('.prev');
      if (prev) prev.innerHTML = v ? '<img src="' + esc(v) + '" alt="">' : '';
    }
  });

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act],[data-toggle],[data-pick],[data-pick-multi]');
    if (!b) return;

    // 展开卡片
    if (b.hasAttribute('data-toggle')) {
      var it = b.closest('.pitem');
      it.classList.toggle('open');
      return;
    }

    // 图片选择
    if (b.hasAttribute('data-pick')) { openPick(b.getAttribute('data-pick'), false); return; }
    if (b.hasAttribute('data-pick-multi')) { openPick(b.getAttribute('data-pick-multi'), true); return; }

    var act = b.getAttribute('data-act');
    var pi = Number(b.getAttribute('data-pi'));
    var bi = Number(b.getAttribute('data-bi'));
    var i = Number(b.getAttribute('data-i'));

    function mv(arr, from, to) {
      if (to < 0 || to >= arr.length) return;
      var x = arr.splice(from, 1)[0];
      arr.splice(to, 0, x);
    }

    switch (act) {
      case 'p-up': mv(DATA.projects, pi, pi - 1); break;
      case 'p-down': mv(DATA.projects, pi, pi + 1); break;
      case 'p-del':
        if (confirm('删除「' + DATA.projects[pi].title + '」？这个操作在导出前只影响草稿。')) DATA.projects.splice(pi, 1);
        break;
      case 'p-add':
        DATA.projects.push({
          id: 'new-' + Date.now().toString(36), cat: 'project', title: '新作品', en: '',
          date: new Date().getFullYear() + '.' + String(new Date().getMonth() + 1).padStart(2, '0'),
          cover: '', summary: '', role: '', facts: [], blocks: [{ t: 'p', html: '在这里写内容。' }]
        });
        break;
      case 'blk-add':
        DATA.projects[pi].blocks.push({ t: 'p', html: '' }); break;
      case 'blk-del': DATA.projects[pi].blocks.splice(bi, 1); break;
      case 'blk-up': mv(DATA.projects[pi].blocks, bi, bi - 1); break;
      case 'blk-down': mv(DATA.projects[pi].blocks, bi, bi + 1); break;
      case 'para-add': DATA.about.paras.push({ zh: '', en: '' }); break;
      case 'para-del': DATA.about.paras.splice(i, 1); break;
      case 'photo-add': DATA.about.photos.push({ src: '', cap: '' }); break;
      case 'photo-del': DATA.about.photos.splice(i, 1); break;
      case 'tl-add': DATA.timeline.push({ when: '', title: '', desc: '' }); break;
      case 'tl-del': DATA.timeline.splice(i, 1); break;
      case 'aw-add': DATA.awards.push({ year: '', title: '', org: '' }); break;
      default: return;
    }
    markDirty();
    render();
    if (act.indexOf('p-') === 0) {
      var keep = $('.pitem[data-pi="' + Math.min(pi, DATA.projects.length - 1) + '"]');
      if (keep && act !== 'p-add') keep.classList.add('open');
    }
    if (typeof act === 'string' && act !== 'para-del' && act !== 'photo-del' && act !== 'tl-del') {
      if (page === 'about' || page === 'extra') render();
    }
  });

  /* ---------- 图片选择 ---------- */
  var pickPath = null, pickMulti = false;
  function openPick(path, multi) {
    pickPath = path; pickMulti = multi;
    var cur = get(DATA, path);
    var curList = multi && Array.isArray(cur) ? cur : [];
    $('#pickGrid').innerHTML = IMGS.map(function (f) {
      var on = multi ? curList.indexOf(f) >= 0 : cur === f;
      return '<img src="' + esc(f) + '" data-f="' + esc(f) + '" alt=""' +
        (on ? ' style="border-color:#B23A2E;opacity:.55"' : '') + '>';
    }).join('');
    $('#pick').classList.add('on');
  }
  $('#pick').addEventListener('click', function (e) {
    if (e.target.id === 'pick' || e.target.id === 'pickClose') {
      $('#pick').classList.remove('on'); return;
    }
    var img = e.target.closest('img[data-f]');
    if (!img || !pickPath) return;
    var f = img.getAttribute('data-f');
    if (pickMulti) {
      var arr = get(DATA, pickPath) || [];
      var idx = arr.indexOf(f);
      if (idx >= 0) arr.splice(idx, 1); else arr.push(f);
      set(DATA, pickPath, arr);
      img.style.borderColor = arr.indexOf(f) >= 0 ? '#B23A2E' : 'transparent';
      img.style.opacity = arr.indexOf(f) >= 0 ? '.55' : '1';
      markDirty(); return;
    }
    set(DATA, pickPath, f);
    markDirty();
    $('#pick').classList.remove('on');
    render();
  });

  /* ---------- 侧栏切换 ---------- */
  $$('#side a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      $$('#side a').forEach(function (x) { x.classList.remove('on'); });
      a.classList.add('on');
      page = a.getAttribute('data-p');
      render();
      window.scrollTo(0, 0);
    });
  });

  /* ---------- 保存 / 导出 / 还原 ---------- */
  function serialize() {
    return '/* 站点内容 · 由 editor.html 导出\n' +
      '   想改文字也可以直接改这里，保存后刷新即可。*/\n' +
      'window.SITE = ' + JSON.stringify(DATA, null, 1) + ';\n';
  }

  $('#btnSave').addEventListener('click', function () {
    try {
      localStorage.setItem(KEY, JSON.stringify(DATA));
      clean();
    } catch (e) {
      alert('本机存储空间不够，请直接点「导出 content.js」。');
    }
  });

  $('#btnExport').addEventListener('click', function () {
    $('#outText').value = serialize();
    $('#out').classList.add('on');
  });

  $('#outClose').addEventListener('click', function () {
    $('#out').classList.remove('on');
    clean();
  });

  $('#outDl').addEventListener('click', function () {
    var blob = new Blob([$('#outText').value], { type: 'text/javascript;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'content.js';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    $('#outDl').textContent = '已下载 ✓';
    setTimeout(function () { $('#outDl').textContent = '下载文件'; }, 2400);
  });

  $('#outCopy').addEventListener('click', function () {
    var t = $('#outText');
    t.removeAttribute('readonly');
    t.select();
    t.setSelectionRange(0, 999999);
    var done = function () {
      $('#outCopy').textContent = '已复制 ✓';
      setTimeout(function () { $('#outCopy').textContent = '复制全文'; }, 2400);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(t.value).then(done, function () { document.execCommand('copy'); done(); });
    } else {
      try { document.execCommand('copy'); done(); } catch (e) { alert('请手动按 Ctrl+C 复制'); }
    }
    t.setAttribute('readonly', '');
  });

  $('#btnReset').addEventListener('click', function () {
    if (!confirm('放弃所有改动，回到线上当前的 content.js？')) return;
    localStorage.removeItem(KEY);
    DATA = JSON.parse(JSON.stringify(ORIGINAL));
    clean();
    render();
  });

  window.addEventListener('beforeunload', function (e) {
    if (dirty) { e.preventDefault(); e.returnValue = ''; }
  });

  /* ---------- 启动 ---------- */
  (function boot() {
    if (!ORIGINAL) {
      $('#panel').innerHTML = '<div class="tip">没有读到 <code>assets/js/content.js</code>。请确认这个文件存在，并且和 editor.html 在同一目录下。</div>';
      return;
    }
    var draft = localStorage.getItem(KEY);
    DATA = JSON.parse(JSON.stringify(ORIGINAL));
    if (draft) {
      try {
        DATA = JSON.parse(draft);
        $('#status').textContent = '已恢复本机草稿';
      } catch (e) { /* ignore */ }
    }
    fetch('assets/img/index.json').then(function (r) { return r.json(); })
      .then(function (list) { IMGS = list.map(function (x) { return x.f; }); })
      .catch(function () { IMGS = []; })
      .then(function () { render(); });
  })();
})();
