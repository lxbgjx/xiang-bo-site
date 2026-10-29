# xiang-bo.top 个人站

纯 HTML + CSS + JS，没有构建步骤、没有数据库、没有 Notion。
推到 GitHub，Vercel 自动部署，域名 `xiang-bo.top` 已绑定。

```
portfolio/
├─ index.html        首页
├─ work.html         全部作品（19 项）
├─ projects.html     项目经历（3）
├─ interview.html    人物专访（7）★ 每个人单独一页
├─ films.html        中长视频（6）
├─ shorts.html       短视频（2）
├─ gallery.html      作品图集（1）
├─ project.html      详情页（?id=xxx，所有板块共用）
├─ about.html        关于 + 联系
├─ editor.html       可视化编辑器（只有你自己用，已加 noindex）
├─ robots.txt / sitemap.xml
└─ assets/
   ├─ css/site.css   全站样式
   ├─ js/content.js  ★ 全站文字都在这里，改这一个文件等于改全站
   ├─ js/app.js      渲染（不用动）
   ├─ js/motion.js   动效（不用动）
   ├─ js/editor.js   编辑器（不用动）
   └─ img/           122 张图（webp）
```

---

## 一、改文字：三种办法，从最省事排起

### 办法 ① 直接告诉我（推荐）

发一句「首页引言改成 XXX」，我改好 `content.js` 给你，你在 GitHub 网页上传这一个文件就完事。
下面两种是你想自己动手时用的。

### 办法 ② 用浏览器里的编辑器（可视，不用碰代码）

1. 打开 <https://xiang-bo.top/editor.html>（线上直接用，不需要本地环境）
2. 左边选栏目：站点与首屏 / 文案与语录 / 作品列表 / 关于页 / 时间线与奖项
3. 想改哪句就改哪个输入框，右边随时「预览站点」看效果
4. 改完点右上角 **导出 content.js** → 点 **复制** 或 **下载文件**
5. 打开 GitHub 仓库 → 进 `assets/js/` → 右上角 **Add file → Upload files** → 把导出的 `content.js` 拖进去 → **Commit changes**
6. 等 1 分钟，刷新 xiang-bo.top

编辑器里的修改会先存在你浏览器本地（关掉再打开还在），点「还原」可以回到线上版本。
**没导出上传之前，线上什么都不会变。**

### 办法 ③ 在 GitHub 上直接改那一行字

适合只改一两个错别字：

1. 打开 `github.com/lxbgjx/xiang-bo-site` → `assets/js` → `content.js`
2. 点右上角铅笔图标（Edit）
3. `Ctrl+F` 搜你要改的那句中文
4. 只改引号里面的字，**别动引号、括号、逗号**
5. 页面底部 **Commit changes**

> 改坏了怎么办：GitHub 里这个文件的历史版本都留着，点 **History** 找到上一个版本，
> 或者直接跟我说一句「退回上一个版本」，我帮你处理。

---

## 二、content.js 长什么样

```js
window.SITE = {
  meta:  { name, en, role, city, email, wechat, domain },

  hero:  { kicker, title:['把每件事','做到现场'], lede, cover, coverTag, num, meta:[] },
  record: '从 2019 年到现在，跟过 <b>100 多</b>场政务活动…',   // 首页那行大字，<b> 里的数字显示为红色
  pull:   '一个活动从定方案到发出去…',                          // 首页白色引言块

  marquee: ['省市级政务活动','校园文化品牌', …],   // 首屏下面横向滚动那行词

  categories: [ { key:'project', name:'项目经历', en:'PROJECTS', file:'projects.html', desc:'…' } ],

  projects: [
    {
      id:'jiang-an', cat:'project', title:'江岸之光 · 五育润心',
      en:'…', date:'2026.03', cover:'assets/img/xx.webp', cw:1500, ch:844,
      summary:'列表卡片上的一句话', role:'策划 · 采写 · 摄影',
      facts:[{k:'周期',v:'2026.3 — 2026.12'}],
      blocks:[ …正文块… ]
    },
    {
      id:'p-dengjiake', cat:'interview', title:'邓家科',
      honor:'华工法利莱切焊系统工程有限公司董事长兼总经理',   // 标题下面那行红字
      ext:'https://hbkx.org.cn/news/info?newsid=…',            // 「阅读报道原文」按钮，留空则不显示
      extName:'湖北省科协',
      blocks:[ … ]
    }
  ],

  about: { title, lede, sideTitle, sideEn, paras:[{zh,en}], photos:[{src,cap}] },
  timeline: [{ when, title, desc }],
  awards:   [{ year, title, org }]
};
```

正文块 `blocks` 的写法：

| 类型 | 写法 | 效果 |
|---|---|---|
| 段落 | `{t:'p', html:'…'}` | 正文段，可含 `<strong>` `<a>` |
| 英文段 | `{t:'p', html:'…', en:true}` | 浅灰小字 |
| 小标题 | `{t:'h2', x:'…'}` / `{t:'h3', x:'…'}` | 加粗标题 |
| 图片 | `{t:'img', src:'assets/img/x.webp', cap:'图注', w:1500, h:1000}` | 按原始比例完整显示，不裁切 |
| 图组 | `{t:'gal', srcs:['…','…'], dims:[[1500,1000],[1187,2491]]}` | 两列并排 |
| 引用 | `{t:'quote', x:'…'}` | 白底块 |
| 列表 | `{t:'list', items:['…','…']}` | 项目符号 |
| 表格 | `{t:'table', head:['项目','数量'], rows:[['服务学校','15 所']]}` | 表格 |
| 视频 | `{t:'embed', src:'https://player.bilibili.com/…'}` | 16:9 嵌入 |
| 分隔 | `{t:'hr'}` | 一条细线 |

> `w` / `h` 是图片真实像素宽高，作用是让浏览器提前占好位置、页面不跳。
> 换图时一起改；删掉也能用，只是滚动时会有一点点位移。

---

## 三、加一个人物 / 加一个作品

**加人物（最快）**：在编辑器 →「作品列表」→ 底部 **＋ 新增一个作品**，分类选「人物专访」，
填姓名、身份（honor）、原文链接（ext）、封面图，再点「＋ 添加正文块」放照片。

**加作品**：同上，分类选对应的板块。

新增后记得把它的 `id` 写进 `sitemap.xml`（不写也能访问，只是搜索引擎发现得慢）。

---

## 四、换图

1. 图片放 `assets/img/`，建议 webp（JPG 也行），宽度控制在 1500px 以内。
2. 想用编辑器里「从图库选择」，把新文件名加进 `assets/img/index.json`。
3. 图片按原始比例显示，**不做任何裁切**；太高太长的图会自动限高（最多 620px），点开能看全图。

---

## 五、几个要注意的点

- **邮箱还是占位符**：`meta.email` 现在是 `hi@xiang-bo.top`，页脚和「联系」区都在读它，记得换成你真实在用的。
- **`editor.html` 不要删**，它就是你的后台，搜索引擎已屏蔽。
- 内容在浏览器里渲染，分享、微信打开都正常；只是「不执行 JS 也能读到正文」这种极端 SEO 场景不占优。
- 改配色：`assets/css/site.css` 开头 `:root` 里的 `--paper`（米白）、`--ink`（墨色）、`--red`（品牌红），改一处全站生效。

---

## 六、本地预览（可选）

想在自己电脑上看，用 VSCode 的 Live Server 插件，或者在这个文件夹里跑：

```bash
python -m http.server 8123
```

浏览器打开 <http://localhost:8123/index.html>。
不要直接双击 html 文件，`file://` 下脚本会被浏览器拦住。
