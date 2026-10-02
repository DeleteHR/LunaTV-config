#!/usr/bin/env node
/**
 * to_tvbox.js —— 把 LunaTV/MoonTV 的 api_site 配置转成 TVBox 可用的 sites 格式
 *
 * 放在仓库根目录，由 .github/workflows/build-check-encode.yml 调用。
 *
 * 输入 : LunaTV-config.json / jingjian.json / jin18.json
 * 输出 : tvbox.json / tvbox-jingjian.json / tvbox-jin18.json
 *
 * 映射规则：
 *   api_site 是 { "<域名key>": { name, api, detail } } 的对象
 *   TVBox 要的是 sites 数组 [ { key, name, type, api, searchable, quickSearch, filterable } ]
 *   源本身都是苹果CMS V10 的 JSON 接口，所以 type=1
 *
 * 本地可单独运行： node to_tvbox.js
 */
const fs = require('fs');
const path = require('path');

// 相对脚本所在目录解析，这样从任何 cwd 调用都能跑（GitHub Action 与本地一致）
const ROOT = __dirname;
const resolve = f => path.join(ROOT, f);

const JOBS = [
  { input: 'LunaTV-config.json', output: 'tvbox.json', label: '完整版' },
  { input: 'jingjian.json', output: 'tvbox-jingjian.json', label: '精简+成人版' },
  { input: 'jin18.json', output: 'tvbox-jin18.json', label: '精简版' },
];

/** 把任意字符串整理成 TVBox 能接受的 key（只保留字母数字下划线） */
function makeKey(raw, used) {
  let k = String(raw)
    .normalize('NFKC')
    .replace(/[^A-Za-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!k) k = 'site';
  if (/^[0-9]/.test(k)) k = 's' + k;
  let base = k;
  let n = 2;
  while (used.has(k)) k = base + '_' + n++;
  used.add(k);
  return k;
}

/** api_site -> TVBox config */
function convert(cfg) {
  const apiSite = cfg.api_site || cfg.sites || {};
  const list = Array.isArray(apiSite)
    ? apiSite.map((v, i) => [v.key || 'site' + i, v])
    : Object.entries(apiSite);

  const used = new Set();
  const sites = [];
  let skipped = 0;

  for (const [rawKey, v] of list) {
    if (!v || typeof v.api !== 'string' || !/^https?:\/\//i.test(v.api)) {
      skipped++;
      continue;
    }
    const adult = /🔞/.test(v.name || '');
    const site = {
      key: makeKey(rawKey, used),
      name: (v.name || rawKey).trim(),
      type: 1,
      api: v.api,
      searchable: 1,
      quickSearch: 1,
      filterable: 0,
    };
    if (adult) site.adult = 1;
    sites.push(site);
  }

  return { config: { sites }, count: sites.length, skipped };
}

function main() {
  const lines = [];
  let any = false;

  for (const job of JOBS) {
    const inPath = resolve(job.input);
    const outPath = resolve(job.output);
    if (!fs.existsSync(inPath)) {
      lines.push(`⊘ ${job.input} 不存在，跳过`);
      continue;
    }
    let cfg;
    try {
      cfg = JSON.parse(fs.readFileSync(inPath, 'utf8'));
    } catch (e) {
      lines.push(`✗ ${job.input} 不是合法 JSON：${e.message}`);
      process.exitCode = 1;
      continue;
    }

    const { config, count, skipped } = convert(cfg);

    // 自检：必须能解析回来，且 sites 数量合理
    const round = JSON.parse(JSON.stringify(config));
    if (!Array.isArray(round.sites) || round.sites.length !== count) {
      lines.push(`✗ ${job.label} 自检失败`);
      process.exitCode = 1;
      continue;
    }
    const keys = new Set(config.sites.map(s => s.key));
    if (keys.size !== count) {
      lines.push(`✗ ${job.label} 自检失败：key 有重复`);
      process.exitCode = 1;
      continue;
    }

    fs.writeFileSync(outPath, JSON.stringify(config, null, 2), 'utf8');
    any = true;
    lines.push(
      `✓ ${job.label.padEnd(12)} ${job.input.padEnd(22)} -> ${job.output.padEnd(24)} ${count} 个源` +
      (skipped ? `（跳过 ${skipped} 条无 api 的项）` : '')
    );
  }

  console.log(lines.join('\n'));
  if (!any) {
    console.log('⚠️ 没有生成任何文件');
    process.exitCode = 1;
  }
}

main();
