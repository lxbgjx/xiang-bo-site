/* POST /api/track  ·  访问埋点
   记录：时间 / 页面 / 来源 / IP / 地区 / 设备 / 浏览器 / 访客标识
   存储走 Upstash Redis REST（Vercel KV 同协议），未配置时返回 503，不影响页面。 */

const LIST = 'xb:v1:visits';
const TOTAL = 'xb:v1:total';
const MAX = 5000;

function conf() {
  return {
    url: String(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/+$/, ''),
    token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ''
  };
}

async function redis(url, token, cmds) {
  const r = await fetch(url + '/pipeline', {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify(cmds)
  });
  if (!r.ok) throw new Error('redis ' + r.status);
  return r.json();
}

function readBody(req) {
  return new Promise(resolve => {
    let s = '';
    req.on('data', c => {
      s += c;
      if (s.length > 4000) { req.destroy(); resolve(''); }
    });
    req.on('end', () => resolve(s));
    req.on('error', () => resolve(''));
  });
}

function cut(v, n) {
  return String(v == null ? '' : v).slice(0, n);
}

function decode(v) {
  try { return decodeURIComponent(String(v || '')); } catch (e) { return String(v || ''); }
}

function device(ua) {
  if (/iPad|Tablet|PlayBook|Kindle/i.test(ua)) return '平板';
  if (/Mobile|Android|iPhone|iPod|HarmonyOS/i.test(ua)) return '手机';
  return '电脑';
}

function browser(ua) {
  if (/Edg\//.test(ua)) return 'Edge';
  if (/MicroMessenger/i.test(ua)) return '微信';
  if (/QQ\//.test(ua)) return 'QQ';
  if (/UCBrowser/i.test(ua)) return 'UC';
  if (/Firefox\//.test(ua)) return 'Firefox';
  if (/Chrome\//.test(ua)) return 'Chrome';
  if (/Safari\//.test(ua)) return 'Safari';
  return '其他';
}

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });

  const { url, token } = conf();
  if (!url || !token) return res.status(503).json({ ok: false, error: 'storage_not_configured' });

  let b = {};
  try { b = JSON.parse(await readBody(req)) || {}; } catch (e) { return res.status(400).json({ ok: false, error: 'bad_json' }); }

  const p = cut(b.p, 300);
  if (!p || p.indexOf('/api/') === 0) return res.status(204).end();

  const ua = cut(req.headers['user-agent'], 300);
  const ip = cut((req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress, 60);

  const rec = {
    t: Date.now(),
    p: p,
    r: cut(b.r, 200),
    ip: ip,
    cc: decode(req.headers['x-vercel-ip-country']),
    rg: decode(req.headers['x-vercel-ip-country-region']),
    ct: decode(req.headers['x-vercel-ip-city']),
    dv: device(ua),
    br: browser(ua),
    v: cut(b.v, 40),
    n: b.n ? 1 : 0,
    w: Number(b.w) || 0,
    lg: cut(b.lg, 12)
  };

  try {
    await redis(url, token, [
      ['LPUSH', LIST, JSON.stringify(rec)],
      ['LTRIM', LIST, '0', String(MAX - 1)],
      ['INCR', TOTAL]
    ]);
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'storage_error' });
  }
  return res.status(204).end();
};
