# xiang-bo.top 个人站

纯 HTML + CSS + JS，没有构建步骤、没有数据库、没有 Notion。
推到 GitHub，Vercel 自动部署，域名 `xiang-bo.top` 已绑定。

```
portfolio/
├─ index.html        首页
├─ work.html         全部作品（24 项）+ 底部工作档案入口
├─ cases.html        案例（5）做完一整件事的活
├─ scenes.html       现场（6）会议、赛场、校园，一场一组照片
├─ people.html       人物（7）★ 七位一页，不再每人一个详情页
├─ films.html        影片（6）
├─ archive.html      工作档案（146 条，七类）
├─ project.html      详情页（?id=xxx，所有板块共用）
├─ about.html        关于 + 联系
├─ editor.html       可视化编辑器（只有你自己用，已加 noindex）
├─ projects.html / interview.html / gallery.html / shorts.html
│                    旧地址，只做跳转，内容已并入上面四页
├─ robots.txt / sitemap.xml
└─ assets/
   ├─ css/site.css   全站样式
   ├─ js/content.js  ★ 全站文字都在这里，改这一个文件等于改全站
   ├─ js/app.js      渲染（不用动）
   ├─ js/motion.js   动效（不用动）
   ├─ js/editor.js   编辑器（不用动）
   └─ img/           图片（webp）
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

  featured: 'jiang-an',   // 首页「精选」放哪个作品：填 id 或标题都行，留空则默认第一个

  categories: [ { key:'case', name:'案例', en:'CASE', file:'cases.html', desc:'…' } ],
  // 四类：case 案例 / scene 现场 / people 人物 / film 影片，数组顺序就是导航顺序

  projects: [
    {
      id:'jiang-an', cat:'case', title:'江岸之光 · 五育润心',
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

**「页面上这句话由哪个字段控制」对照表**：

| 页面上看到的东西 | 改这个字段 |
|---|---|
| 首页两行大字标题 | `hero.title`（数组，每一项一行） |
| 标题下面那段话（现在留空） | `hero.lede`，留空则这段不出现 |
| 首屏下三列小字（身份 / 跑过的口 / 坐标） | `hero.meta` |
| 首屏下方那行小字履历（现在留空） | `record`，`<b>` 里的字显示为红色，留空则整块不出现 |
| 白色大引言块 | `pull`，回车就是换行 |
| 首屏下方横向滚动的词 | `marquee`（逗号分隔） |
| 首页「精选」是哪个作品 | `featured`，填 id 或标题都行 |
| 导航栏和分类名 | `categories[].name`，顺序由数组顺序决定 |
| 作品卡片标题 / 下面一行小字 | `projects[].title` / `projects[].summary` |
| 人物页标题下面那行红字 | `projects[].honor` |
| 「阅读报道原文 · 湖北省科协」按钮 | `projects[].ext`（链接）+ `projects[].extName`（来源名），`ext` 留空按钮就不显示 |
| 关于页正文 | `about.paras`（`zh` 中文段，`en` 灰色英文段） |
| 时间线 / 奖项 | `timeline` / `awards` |
| 页脚和联系区的邮箱 | `meta.email` |

---

## 三、加一个人物 / 加一个作品

**加人物（最快）**：在编辑器 →「作品列表」→ 底部 **＋ 新增一个作品**，分类选「人物」，
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

- **`editor.html` 不要删**，它就是你的后台，搜索引擎已屏蔽。
- 内容在浏览器里渲染，分享、微信打开都正常；只是「不执行 JS 也能读到正文」这种极端 SEO 场景不占优。
- 改配色：`assets/css/site.css` 开头 `:root` 里的 `--paper`（米白）、`--ink`（墨色）、`--red`（品牌红），改一处全站生效。

---

## 五点半、改了文件但线上看不到变化，按这个顺序查

90% 的情况不是没生效，是下面某一个环节卡住了。**从第 1 条开始往下排**。

1. **等 60 秒**。Vercel 收到 GitHub 的新提交后要重新部署，通常 30–60 秒。部署期间线上还是旧文件。
   要看进度就去 Vercel 项目的 Deployments 页，最新那条显示 `Ready` 才算好了。

2. **确认文件真进了 main 分支**。打开 `github.com/lxbgjx/xiang-bo-site`，
   看 `assets/js/content.js` 右上角的最近修改时间；或者看首页右侧的提交记录，有没有你刚改的那条。
   如果是在 GitHub 网页上编辑的，注意最后要点绿色的 **Commit changes**，光点预览不算。

3. **强制刷新浏览器**。普通刷新（F5）有时会直接用缓存里的旧文件。
   - 电脑 Chrome / Edge：`Ctrl + F5`，或 `Ctrl + Shift + R`
   - Mac Safari：`Cmd + Shift + R`
   - **微信里打开**：右上角 `···` → `刷新`；不行就关掉整个微信进程再进（微信内置浏览器缓存最顽固）
   - 手机浏览器：设置里清一下「网站数据」，或者用无痕/隐私模式打开一次

4. **看是不是「填错了值」而不是「没更新」**。典型的坑是 `featured`（首页精选）：
   这个字段以前只认作品的英文 id（比如 `jiang-an`），填中文标题会匹配不上，
   于是自动退回显示第一个作品——刚好也是「江岸之光」，看起来就像改了没反应。
   现在 id 和标题都认了，中文标题直接填也能对上。

5. **确认改的是渲染用的那个字段**。比如首页那句大字引言读的是 `pull`，
   首屏标题读的是 `hero.title`，分类名读的是 `categories[].name`。
   改了一个长得像的字段（或改在 `projects` 里却指望首页变），页面当然不动。
   「哪句话由哪个字段控制」看下面第二节的表。

6. 还有一种真·没生效：**文件名大小写或路径错了**（`Content.js`、`assets/JS/`），
   或者整个文件夹拖错了位置，GitHub 上多出一个同名不同路径的文件。对比一下目录树就能看出来。

---

## 六、本地预览（可选）

想在自己电脑上看，用 VSCode 的 Live Server 插件，或者在这个文件夹里跑：

```bash
python -m http.server 8123
```

浏览器打开 <http://localhost:8123/index.html>。
不要直接双击 html 文件，`file://` 下脚本会被浏览器拦住。

---

## 七、访问记录后台（/admin.html）

线上地址：<https://xiang-bo.top/admin.html>

打开后输一次口令，就能看到最近的访问：时间、IP、地区、看了哪个页面、从哪儿来、设备、新访客还是回访。

### 它怎么工作

- `assets/js/track.js` 在每页加载后往 `/api/track` 发一条记录（只在 `xiang-bo.top` 和 `www.xiang-bo.top` 上发，本地预览不记录）。
- `api/track.js` 拿到浏览器 IP、Vercel 附带的地区信息、UA，写进 Redis 列表 `xb:v1:visits`，只留最近 5000 条。
- `api/stats.js` 用口令换取记录，口令是环境变量 `STATS_KEY`，不写在任何文件里。
- `admin.html` 只是读这个接口，口令存在浏览器 sessionStorage，关掉标签页就没了。

### 第一次要配两样东西（只配一次）

1. Vercel 项目 → **Storage** → Create Database → **Upstash for Redis**（免费额度足够个人站）→ 创建后点 **Connect Project**，选中这个站点。连接后环境变量会自动注入（`KV_REST_API_URL` / `KV_REST_API_TOKEN`，或 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`，两种都认）。
2. 项目 → **Settings → Environment Variables** → 新增 `STATS_KEY`，值自己定一串别人猜不到的字符（这就是后台口令）。

配完到 **Deployments** 里挑最新一条，右边 `⋯` → **Redeploy**。之后打开 `/admin.html` 输口令就有数据了。

### 说明

- 只能看到 IP 和地区，看不到「具体是谁」——静态站没有登录，任何人访问都拿不到姓名。IP 是识别同一个人的唯一线索。
- 想看某个页面被谁看过，在后台用「今天 / 近 7 天 / 全部」筛，或者直接看「页面」那一列。
- 记录里不含搜索关键词、不含鼠标行为，只有页面地址和来源域名。
- 以后想停掉：把环境变量删掉就恢复成 503，页面本身不受影响。

### 停留时长与作品记录

后台除了「谁在什么时候看了哪页」，还会记两件事：

- **停留多久**：只算页面在前台的秒数。切到别的标签页、最小化都暂停计时；不足 2 秒的点击不算；单页封顶 2 小时（防止挂着过夜）。列表里显示成 `3 分 34 秒`，顶部有「今日平均停留」。
- **点开了哪个作品**：作品详情页会额外带上标题，列表里显示成 `作品 · 江岸之光·五育润心`，不用再看 `project.html?id=xxx` 猜是哪个。

实现上分成两类事件：进入页面报一条 `pv`，离开或切走报一条 `dw`（带同一个 `sid`）。`api/stats.js` 按 `sid` 把停留时长合并回对应的 `pv`，同一个 `sid` 报多次取最大值，`dw` 记录本身不展示、也不计入累计访问。

注意：改动前已经存下的老记录没有停留时长，显示为 `—`，属正常。
