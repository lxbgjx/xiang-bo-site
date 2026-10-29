# xiang-bo.top 个人站（纯静态 · 带动效 · 可在浏览器里改内容）

这是一套**不需要服务器、不需要数据库、不需要 Notion** 的静态站点。
纯 HTML + CSS + JS，没有构建步骤，Vercel 直接识别，推上去就上线。

```
portfolio/
├─ index.html          首页
├─ work.html           作品列表（可按分类筛选）
├─ project.html        作品详情（?id=xxx）
├─ about.html          关于 + 联系
├─ editor.html         可视化编辑器（只有你自己用，已设 noindex）
├─ robots.txt / sitemap.xml
└─ assets/
   ├─ css/site.css     全站样式（设计系统 + 动效）
   ├─ css/editor.css   编辑器样式
   ├─ js/content.js    ★ 全站内容都在这里，改这一个文件等于改全站
   ├─ js/app.js        渲染逻辑（不用动）
   ├─ js/motion.js     动效与交互（不用动）
   ├─ js/editor.js     编辑器逻辑（不用动）
   ├─ img/             122 张图（webp，共 13MB）
   └─ favicon.svg
```

---

## 一、先本地看一眼

在这个文件夹里开一个终端：

```bash
python -m http.server 8123
```

浏览器打开 <http://localhost:8123/index.html>。
（不要直接双击 html 文件，`file://` 下脚本会被浏览器拦住。）

---

## 二、发布到 Vercel（两种方式，选一种）

你现在的情况是：**GitHub 上是一个 NotionNext 的分支仓库 → Vercel 部署 → 域名 xiang-bo.top**。

### 方式 A：就地替换（最省事，域名和 Vercel 项目都不用动）

1. 先给旧仓库留个后路：在 GitHub 仓库里新建一个分支 `notionnext-backup`，把当前代码保一份。
2. 把仓库默认分支（一般是 `main`）里的**所有文件删掉**——不是删仓库，是删文件。
3. 把本目录 `portfolio/` 里的**全部内容**（不是 `portfolio` 这一层文件夹，是它里面的东西）上传到仓库根目录。
   - 网页端：仓库首页 → `Add file` → `Upload files` → 把文件拖进去（文件夹会一起保留）→ Commit。
   - 或者命令行：

     ```bash
     cd portfolio
     git init
     git add .
     git commit -m "replace NotionNext with static portfolio"
     git branch -M main
     git remote add origin https://github.com/<你的用户名>/<仓库名>.git
     git push -u origin main --force
     ```
4. 回到 Vercel，打开这个项目的 **Deployments**，等它自动拉取新 commit。
   因为仓库根目录现在就是静态站，Vercel 会按 Static 处理，**不需要改任何构建配置**。
   - 如果之前的 Project Settings 里写过 Framework = Next.js、Build Command = `npm run build`，
     把它改成 **Framework Preset = Other**、Build Command 留空、Output Directory 留空，再 Redeploy 一次。

### 方式 B：新开一个仓库（更安全，旧站随时能回去）

1. GitHub 新建仓库（比如 `xiang-bo-portfolio`），把 `portfolio/` 里的内容推上去。
2. Vercel → `Add New Project` → 选这个新仓库 → Framework 选 **Other** → Deploy。
3. 部署成功后拿到的 `xxx.vercel.app` 先看一眼，确认没问题。
4. Vercel → 旧项目 → Settings → **Domains**，把 `xiang-bo.top` 和 `www.xiang-bo.top` 先 Removed；
   再到新项目 → Settings → Domains → Add，输入 `xiang-bo.top` → 按提示确认（域名本来就在你的账号里，通常点一下就绑上了）。
5. 旧项目留着不要删，想回退只要把域名再绑回去。

> 两种方式都建议先做一件事：把现在线上能跑的那份代码导出来存着（`Code → Download ZIP`）。

---

## 三、以后怎么改内容

### 办法一：用编辑器改（推荐，不用碰代码）

1. 本地起服务（见第一节），打开 <http://localhost:8123/editor.html>
2. 左边选栏目（站点与首屏 / 数字与文案 / 作品列表 / 关于页 / 时间线与奖项）
3. 改完点右上角 **导出 content.js** → 弹窗里选 **下载文件** 或 **复制**
4. 用它覆盖 `assets/js/content.js`，然后 commit → push，Vercel 自动重新部署

编辑器里的改动会先存在浏览器本地（关掉再开还在），点「还原」可以回到线上版本。

### 办法二：直接改 `assets/js/content.js`

这个文件就是一份 JSON，结构很直白：

```js
window.SITE = {
  meta:   { name, en, role, city, email, wechat, domain },   // 全站页脚 + 关于页侧栏
  hero:   { kicker, title:[两行], lede, cover, coverTag, num, meta:[] },  // 首页首屏
  stats:  [{ n: 100, suffix:'+', label:'场政务活动拍摄' }, ...],           // 首页四格数字
  marquee:[...],                                              // 首页跑马灯文字
  projects: [ { id, title, cat, date, cover, summary, role, facts:[], blocks:[] } ],
  about:  { title, lede, sideTitle, sideEn, paras:[{zh,en}], photos:[{src,cap}] },
  timeline: [{ when, title, desc }],
  awards:   [{ year, title, org }]
};
```

正文块 `blocks` 支持这几种：

| 类型 | 写法 | 效果 |
|---|---|---|
| 小标题 | `{t:'h2', x:'…'}` | 左侧红竖线标题 |
| 三级标题 | `{t:'h3', x:'…'}` | 加粗小标题 |
| 段落 | `{t:'p', x:'…', en:true}` | `en:true` 显示为浅灰小字英文段 |
| 引用 | `{t:'quote', x:'…'}` | 白底 + 红左边线 |
| 图片 | `{t:'img', src:'assets/img/x.webp', cap:'图注', w:1500, h:1000}` | 带图注的图 |
| 表格 | `{t:'table', head:['项目','数量'], rows:[['服务学校','15 所']]}` | 竖线表 |
| 分隔 | `{t:'hr'}` | 一条细线 |

> `w` / `h` 是图片真实像素宽高，作用是让浏览器提前占好位置、页面不跳动。
> 换图时一起改掉；嫌麻烦也可以删掉这两个字段，只是滚动时会有一点点跳。

### 办法三：换图

1. 图片按 `assets/img/` 里的相对路径引用，格式建议 webp（JPG 也行）。
2. 上传新图后，把新文件名追加到 `assets/img/index.json`，编辑器里点「从图库选择」就能看到它。

---

## 四、几个要注意的点

- **邮箱现在是占位符**：`meta.email` 还是 `hi@xiang-bo.top`，记得在编辑器「站点与首屏」里改成你真实在用的邮箱。
- **`editor.html` 不要删**，它就是你的后台；已经加了 `noindex`，搜索引擎不会收录。
- 内容是在浏览器里渲染的。如果你很在意「不执行 JS 也能看到正文」的 SEO 场景，这套方案不占优；
  但 Google / 百度现在都能跑 JS，日常分享也不受影响。
- 图片总量 13MB。Vercel 免费额度够用；如果之后图片越堆越多，可以把 `assets/img` 换成图床外链，
  只要 `src` 写完整 URL 就行。
- 想改配色：`assets/css/site.css` 开头 `:root` 里那几个变量（`--paper` 米白、`--ink` 墨色、`--red` 品牌红）改一处全站生效。

---

## 五、动了哪些文件（备忘）

- `assets/js/content.js` —— 内容源，日常改这个
- `assets/css/site.css` —— 样式与动效
- `*.html` —— 五个页面骨架，一般不用动
