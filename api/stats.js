/* GET /api/stats  ·  访问记录读取（需要口令，口令存在环境变量 STATS_KEY）
   ?limit=500  最近若干条
   ?key=xxx    也可用查询参数传口令（浏览器直接打开方便），优先读 header。 */

const LIST = 'xb:v1:visits';
const TOTAL = 'xb:v1:total';

function conf() {
  // Vercel 连 Upstash 时可自定义前缀，KV_ / STORAGE_ / UPSTASH_ 都认
  const PREFIXES = ['KV', 'STORAGE', 'UPSTASH_REDIS', 'UPSTASH'];
  for (const p of PREFIXES) {
    const url = String(process.env[p + '_REST_API_URL'] || '').replace(/\/+$/, '');
    const token = process.env[p + '_REST_API_TOKEN'] || '';
    if (url && token) return { url, token };
  }
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

function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

module.exports = async (req, res) => {
  res.setHeader('cache-control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'method' });

  const need = process.env.STATS_KEY || '';
  if (!need) return res.status(503).json({ ok: false, error: 'key_not_configured' });

  const q = new URL(req.url, 'http://x').searchParams;
  const given = req.headers['x-stats-key'] || q.get('key') || '';
  if (!safeEqual(String(given), need)) return res.status(401).json({ ok: false, error: 'unauthorized' });

  const { url, token } = conf();
  if (!url || !token) return res.status(503).json({ ok: false, error: 'storage_not_configured' });

  const limit = Math.min(Math.max(Number(q.get('limit')) || 500, 1), 2000);

  try {
    /* 列表里混着停留记录，多取一倍再合并，保证返回条数够用 */
    const r = await redis(url, token, [
      ['LRANGE', LIST, '0', String(Math.min(limit * 2, 3000))],
      ['GET', TOTAL]
    ]);
    const raw = (r[0] && r[0].result) || [];
    const total = Number((r[1] && r[1].result) || 0);
    const rows = raw.map(s => { try { return JSON.parse(s); } catch (e) { return null; } }).filter(Boolean);

    /* 同一次浏览可能上报多次停留（切标签页、关页面），取最大值 */
    const dur = Object.create(null);
    for (const v of rows) {
      if (v.ty === 'dw' && v.sid) {
        const d = Number(v.d) || 0;
        if (d > (dur[v.sid] || 0)) dur[v.sid] = d;
      }
    }

    const visits = [];
    for (const v of rows) {
      if (v.ty === 'dw') continue;
      if (v.sid && dur[v.sid]) v.d = dur[v.sid];
      visits.push(v);
      if (visits.length >= limit) break;
    }

    return res.status(200).json({ ok: true, total: total, count: visits.length, visits: visits });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'storage_error' });
  }
};
