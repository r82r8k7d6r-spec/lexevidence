#!/usr/bin/env node
/**
 * マモリAI ショート動画生成スクリプト
 *
 * 使い方:
 *   npm run generate-video                  # 全パターン生成
 *   npm run generate-video emotional        # 感情訴求型のみ
 *   npm run generate-video testimonial      # 体験談型のみ
 *   npm run generate-video beforeafter      # ビフォーアフター型のみ
 *   npm run generate-video ai              # AI技術驚き型のみ
 *   npm run generate-video consultation    # 弁護士相談準備型のみ
 *
 * 事前準備:
 *   1. creatomate.com でアカウント作成・テンプレート作成
 *   2. .env.local に以下を追加:
 *        CREATOMATE_API_KEY=your_key
 *        CREATOMATE_TEMPLATE_EMOTIONAL=template_id
 *        CREATOMATE_TEMPLATE_TESTIMONIAL=template_id
 *        CREATOMATE_TEMPLATE_BEFOREAFTER=template_id
 *        CREATOMATE_TEMPLATE_AI=template_id
 *        CREATOMATE_TEMPLATE_CONSULTATION=template_id
 *   3. 生成された動画は output/ フォルダに保存されます
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// .env.local を読み込む（dotenv なしで動作）
function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local が見つかりません');
    process.exit(1);
  }
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 5パターンの固定スクリプトコンテンツ
// Creatomate テンプレート内のテキスト要素 Name と対応させること
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PATTERNS = {
  emotional: {
    name: '感情訴求型',
    envKey: 'CREATOMATE_TEMPLATE_EMOTIONAL',
    modifications: {
      hook_text:     'その証拠、一人で抱えてる？',
      body_text:     'LINEスクショをAIに読み込ませるだけ',
      result_text:   '弁護士相談用PDFを自動生成',
      service_name:  'マモリAI',
      cta_text:      'プロフのリンクから試してみて',
    },
  },
  testimonial: {
    name: '体験談型',
    envKey: 'CREATOMATE_TEMPLATE_TESTIMONIAL',
    modifications: {
      hook_text:     '弁護士に「もっと早く来てくれれば」と言われた',
      time_text:     '10分で整理完了',
      body_text:     'スクショを送るだけで自動整理',
      service_name:  'マモリAI',
      cta_text:      '同じ状況の人はプロフへ',
    },
  },
  beforeafter: {
    name: 'ビフォーアフター型',
    envKey: 'CREATOMATE_TEMPLATE_BEFOREAFTER',
    modifications: {
      hook_text:     'これ、同じ人の証拠です',
      before_text:   'スクショがバラバラ\n何がいつのものかも不明',
      after_text:    '時系列・証拠一覧\n自動整理完了',
      time_text:     '最短10分',
      body_text:     'スクショを選んで送るだけ',
      service_name:  'マモリAI',
      cta_text:      'プロフリンクで試せます',
    },
  },
  ai: {
    name: 'AI技術驚き型',
    envKey: 'CREATOMATE_TEMPLATE_AI',
    modifications: {
      hook_text:     'え、これAIができるの？',
      feature_1:    'LINE解析',
      feature_2:    '時系列整理',
      feature_3:    '証拠一覧生成',
      feature_4:    'PDF自動生成',
      body_text:     '弁護士用書類が10分で出てきた',
      service_name:  'マモリAI',
      cta_text:      'プロフリンクから実際に試せます',
    },
  },
  consultation: {
    name: '弁護士相談準備型',
    envKey: 'CREATOMATE_TEMPLATE_CONSULTATION',
    modifications: {
      hook_text:     '弁護士相談、ちゃんと準備できてますか？',
      warning_text:  '初回相談：30〜60分\n相談料：約1万円',
      body_text:     'LINE・スクショをAIが自動整理',
      result_text:   '証拠一覧・時系列まで揃えて相談へ',
      service_name:  'マモリAI',
      cta_text:      '相談前の証拠整理、プロフリンクで',
    },
  },
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Creatomate API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function createRender(apiKey, templateId, modifications) {
  const res = await fetch('https://api.creatomate.com/v1/renders', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ template_id: templateId, modifications }),
  });
  if (!res.ok) {
    throw new Error(`Creatomate API エラー (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function pollUntilDone(apiKey, renderId) {
  for (;;) {
    await new Promise(r => setTimeout(r, 3000));
    const res = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`ポーリングエラー: ${res.status}`);
    const render = await res.json();
    process.stdout.write('.');
    if (render.status === 'succeeded') return render.url;
    if (render.status === 'failed') throw new Error('レンダリング失敗');
  }
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, res => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
      file.on('error', reject);
    }).on('error', reject);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// メイン処理
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function generateVideo(apiKey, patternKey) {
  const pattern = PATTERNS[patternKey];
  const templateId = process.env[pattern.envKey];

  if (!templateId) {
    console.log(`  ⚠ スキップ（${pattern.envKey} が未設定）`);
    return;
  }

  const render = await createRender(apiKey, templateId, pattern.modifications);
  console.log(`  render ID: ${render.id}`);
  process.stdout.write('  レンダリング中 ');

  const url = await pollUntilDone(apiKey, render.id);
  console.log(' 完了!');

  const outputDir = path.join(ROOT, 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `mamori-${patternKey}.mp4`);
  await downloadFile(url, filePath);
  console.log(`  ✅ 保存: output/mamori-${patternKey}.mp4`);
}

async function main() {
  loadEnv();

  const apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) {
    console.error('❌ .env.local に CREATOMATE_API_KEY を設定してください');
    process.exit(1);
  }

  const arg = process.argv[2];
  const validKeys = Object.keys(PATTERNS);
  let targets;

  if (!arg || arg === 'all') {
    targets = validKeys;
  } else if (validKeys.includes(arg)) {
    targets = [arg];
  } else {
    console.error(`❌ 不明なパターン: "${arg}"`);
    console.error(`   使い方: npm run generate-video [${validKeys.join('|')}|all]`);
    process.exit(1);
  }

  console.log('');
  console.log('マモリAI ショート動画生成スクリプト');
  console.log('=====================================');

  let success = 0;
  for (const key of targets) {
    console.log(`\n🎬 ${PATTERNS[key].name}`);
    try {
      await generateVideo(apiKey, key);
      success++;
    } catch (err) {
      console.error(`  ❌ エラー: ${err.message}`);
    }
  }

  console.log(`\n=====================================`);
  console.log(`完了: ${success}/${targets.length} 本生成 → output/ フォルダを確認\n`);
}

main().catch(err => {
  console.error('\n❌ 予期しないエラー:', err.message);
  process.exit(1);
});
