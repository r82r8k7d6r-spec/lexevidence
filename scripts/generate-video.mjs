#!/usr/bin/env node
/**
 * マモリAI ショート動画生成スクリプト
 *
 * ─── 準備（これだけでOK）───────────────────────────────────
 *  1. https://creatomate.com で無料アカウント作成
 *  2. Settings → API → API Key をコピー
 *
 * ─── 実行 ────────────────────────────────────────────────
 *  npm run generate-video                  # 全5パターン生成
 *  npm run generate-video emotional        # 感情訴求型だけ
 *  npm run generate-video testimonial      # 体験談型だけ
 *  npm run generate-video beforeafter      # ビフォーアフター型だけ
 *  npm run generate-video ai              # AI技術驚き型だけ
 *  npm run generate-video consultation    # 弁護士相談準備型だけ
 *
 * ─── 出力 ────────────────────────────────────────────────
 *  output/mamori-emotional.mp4 など（1〜2分で生成）
 */

import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// .env.local があれば読み込む（なくてもOK）
function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    const val = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
}

// ─────────────────────────────────────────────────────────────
// 動画の見た目を定義するヘルパー関数
// ─────────────────────────────────────────────────────────────

const W = 1080;  // 幅px
const H = 1920;  // 高さpx（縦型 9:16）

/** テキスト要素 */
function text(str, { y, time = 0, duration = 5, size = 70, color = '#ffffff', weight = 'bold', align = 'center', opacity = 1 } = {}) {
  return {
    type: 'text',
    text: str,
    x: 0,
    y: Math.round(y - size * 0.6),  // おおよそ上端を計算
    width: W,
    height: 'auto',
    time,
    duration,
    font_size: size,
    font_weight: weight,
    fill_color: color,
    text_align: align,
    x_padding: 60,
    animations: [
      { type: 'fade', scope: 'element', time: 0,              duration: 0.5 },
      { type: 'fade', scope: 'element', time: duration - 0.5, duration: 0.5, reversed: true },
    ],
  };
}

/** 横線（アクセント） */
function line({ y, time = 0, duration = 5, color = '#e94560' }) {
  return {
    type: 'rectangle',
    x: 80,
    y: Math.round(y),
    width: W - 160,
    height: 6,
    fill_color: color,
    time,
    duration,
    animations: [{ type: 'wipe', scope: 'element', time: 0, duration: 0.6, direction: 'right' }],
  };
}

/** 背景矩形（ハイライトボックス） */
function box({ y, height = 200, time = 0, duration = 5, color = '#1a1a2e' }) {
  return {
    type: 'rectangle',
    x: 60,
    y: Math.round(y),
    width: W - 120,
    height: Math.round(height),
    fill_color: color,
    border_radius: 40,
    time,
    duration,
  };
}

// ─────────────────────────────────────────────────────────────
// 5パターンの動画コンポジション（テンプレート不要・コードで定義）
// ─────────────────────────────────────────────────────────────

function makeSource(elements, duration = 35) {
  return {
    output_format: 'mp4',
    width: W,
    height: H,
    duration,
    frame_rate: 30,
    background_color: '#0f0f1e',
    elements,
  };
}

const PATTERNS = {

  // ──────────────────────────────────────
  // 感情訴求型
  // ──────────────────────────────────────
  emotional: {
    name: '😢 感情訴求型',
    source: makeSource([
      // フック
      text('その証拠\n一人で抱えてる？',        { y: 680,  time: 0,  duration: 5,  size: 95 }),
      // 問題
      text('LINEのスクショ\n大量に保存してるのに\n何から整理すれば…', { y: 640, time: 5, duration: 8, size: 62, color: '#cccccc', weight: 'normal' }),
      // 転換
      line({                                     y: 980,  time: 13, duration: 12, color: '#e94560' }),
      text('そのスクショをAIに\n読み込ませるだけで', { y: 1020, time: 13.5, duration: 6, size: 68 }),
      // 解決
      text('弁護士相談用PDF\n自動生成',           { y: 1050, time: 20, duration: 9, size: 80, color: '#f5a623' }),
      text('10分で完了',                         { y: 1280, time: 22, duration: 7, size: 100, color: '#e94560' }),
      // CTA
      line({                                     y: 1480, time: 29, duration: 6, color: '#e94560' }),
      text('マモリAI',                           { y: 1540, time: 29, duration: 6, size: 110, color: '#f5a623' }),
      text('プロフのリンクから試してみて',         { y: 1700, time: 30, duration: 5, size: 50, color: '#aaaaaa', weight: 'normal' }),
    ], 35),
  },

  // ──────────────────────────────────────
  // 体験談型
  // ──────────────────────────────────────
  testimonial: {
    name: '💬 体験談型',
    source: makeSource([
      // フック（引用）
      text('弁護士に言われた言葉',               { y: 540,  time: 0,  duration: 5,  size: 58, color: '#aaaaaa', weight: 'normal' }),
      text('「もっと早く\n来てくれれば」',        { y: 720,  time: 0.3,duration: 5,  size: 88 }),
      // 状況
      text('1年分のLINE\n消えかけた記憶\n全部スマホの中にあった', { y: 620, time: 5, duration: 9, size: 62, color: '#cccccc', weight: 'normal' }),
      // 転換
      box({                                      y: 1100, height: 260, time: 14, duration: 12, color: '#0a1a2e' }),
      text('試しにアプリに\n投げ込んでみたら',    { y: 1130, time: 14.5,duration: 5,  size: 65 }),
      text('10分で整理された',                   { y: 1330, time: 16, duration: 10, size: 88, color: '#4a9eff' }),
      // 結果
      text('時系列・証拠一覧\n精神的苦痛まで書いてある\n自分では書けなかった', { y: 620, time: 26, duration: 7, size: 58, color: '#cccccc', weight: 'normal' }),
      // CTA
      line({                                     y: 1500, time: 31, duration: 7, color: '#4a9eff' }),
      text('マモリAI',                           { y: 1560, time: 31.5,duration: 6.5,size: 110, color: '#f5a623' }),
      text('プロフへ',                           { y: 1730, time: 32, duration: 6,  size: 55, color: '#aaaaaa', weight: 'normal' }),
    ], 38),
  },

  // ──────────────────────────────────────
  // ビフォーアフター型
  // ──────────────────────────────────────
  beforeafter: {
    name: '✨ ビフォーアフター型',
    source: makeSource([
      // フック
      text('これ、同じ人の証拠です',              { y: 360,  time: 0,  duration: 4,  size: 72 }),
      // BEFORE
      box({                                      y: 460,  height: 380, time: 4,  duration: 13, color: '#1a0a0a' }),
      text('BEFORE',                             { y: 490,  time: 4.2, duration: 12.8,size: 52, color: '#888888' }),
      text('スクショがバラバラ\n何がいつのものかも不明\n整理できない…', { y: 620, time: 4.5, duration: 12.5, size: 60, color: '#ff6b6b', weight: 'normal' }),
      // AFTER
      box({                                      y: 940,  height: 380, time: 17, duration: 13, color: '#0a1a0a' }),
      text('AFTER',                              { y: 970,  time: 17.2,duration: 12.8,size: 52, color: '#4caf50' }),
      text('時系列・証拠一覧\n精神的苦痛まで\n自動整理完了',         { y: 1100, time: 17.5,duration: 9,  size: 62, color: '#69ff69', weight: 'normal' }),
      text('最短10分',                           { y: 1380, time: 19, duration: 8,  size: 95, color: '#f5a623' }),
      // CTA
      text('スクショを選んで送るだけ',            { y: 1550, time: 30, duration: 7,  size: 62 }),
      line({                                     y: 1680, time: 30.5, duration: 6.5, color: '#e94560' }),
      text('マモリAI',                           { y: 1720, time: 31, duration: 6,  size: 100, color: '#f5a623' }),
    ], 37),
  },

  // ──────────────────────────────────────
  // AI技術驚き型
  // ──────────────────────────────────────
  ai: {
    name: '🤖 AI技術驚き型',
    source: makeSource([
      // フック
      text('え、これ\nAIができるの？',            { y: 620,  time: 0,  duration: 4,  size: 100, color: '#4a9eff' }),
      // 驚き
      text('LINEのスクショを送ったら——',          { y: 700,  time: 4,  duration: 5,  size: 60, color: '#cccccc', weight: 'normal' }),
      text('弁護士用書類が\n10分で出てきた',       { y: 900,  time: 5,  duration: 4,  size: 80 }),
      // 機能フロー
      line({                                     y: 640,  time: 9,  duration: 20, color: '#4a9eff' }),
      text('AIがやること',                        { y: 680,  time: 9,  duration: 20, size: 55, color: '#4a9eff' }),
      text('① LINE解析',                         { y: 800,  time: 10, duration: 4,  size: 75 }),
      text('② 時系列整理',                        { y: 800,  time: 14, duration: 4,  size: 75 }),
      text('③ 証拠一覧生成',                      { y: 800,  time: 18, duration: 4,  size: 75 }),
      text('④ PDF自動生成',                       { y: 800,  time: 22, duration: 7,  size: 75, color: '#f5a623' }),
      // CTA
      text('こういうのが\nもう使える時代になってる', { y: 1380, time: 29, duration: 8,  size: 62, color: '#cccccc', weight: 'normal' }),
      line({                                     y: 1560, time: 30, duration: 7,  color: '#4a9eff' }),
      text('マモリAI',                           { y: 1610, time: 30.5,duration: 6.5,size: 110, color: '#f5a623' }),
      text('プロフリンクから試せます',             { y: 1780, time: 31, duration: 6,  size: 50, color: '#aaaaaa', weight: 'normal' }),
    ], 37),
  },

  // ──────────────────────────────────────
  // 弁護士相談準備型
  // ──────────────────────────────────────
  consultation: {
    name: '⚖️ 弁護士相談準備型',
    source: makeSource([
      // フック
      text('弁護士相談\nちゃんと準備\nできてますか？',              { y: 560,  time: 0,  duration: 5,  size: 80 }),
      // 警告ボックス
      box({                                      y: 880,  height: 300, time: 5,  duration: 11, color: '#1a0505' }),
      text('初回相談：30〜60分\n相談料：約1万円',                   { y: 920,  time: 5.3, duration: 10.7,size: 65, color: '#ff6b6b' }),
      text('準備ゼロで行くのは\nもったいない',                      { y: 1130, time: 7,  duration: 9,  size: 58, color: '#cccccc', weight: 'normal' }),
      // 解決
      line({                                     y: 1280, time: 16, duration: 14, color: '#e94560' }),
      text('LINE・スクショ・メモ\n全部AIに渡すだけ',               { y: 1330, time: 16.5,duration: 6,  size: 68 }),
      text('証拠一覧・時系列まで\n自動整理',                        { y: 1400, time: 23, duration: 7,  size: 68, color: '#f5a623' }),
      // CTA
      text('準備した人が\n一番いい結果を引き出せる',               { y: 1580, time: 30, duration: 8,  size: 60, color: '#cccccc', weight: 'normal' }),
      text('マモリAI',                           { y: 1760, time: 31, duration: 7,  size: 100, color: '#f5a623' }),
    ], 38),
  },
};

// ─────────────────────────────────────────────────────────────
// Creatomate API 呼び出し
// ─────────────────────────────────────────────────────────────

async function createRender(apiKey, source) {
  const res = await fetch('https://api.creatomate.com/v1/renders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  });
  if (!res.ok) throw new Error(`API エラー (${res.status}): ${await res.text()}`);
  const data = await res.json();
  return Array.isArray(data) ? data[0] : data;
}

async function pollUntilDone(apiKey, renderId) {
  for (;;) {
    await new Promise(r => setTimeout(r, 4000));
    const res = await fetch(`https://api.creatomate.com/v1/renders/${renderId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`ポーリングエラー: ${res.status}`);
    const render = await res.json();
    process.stdout.write('.');
    if (render.status === 'succeeded') return render.url;
    if (render.status === 'failed')    throw new Error('レンダリング失敗');
  }
}

function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, res => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

// ─────────────────────────────────────────────────────────────
// メイン
// ─────────────────────────────────────────────────────────────

async function run(patternKey) {
  const apiKey = process.env.CREATOMATE_API_KEY;
  const pattern = PATTERNS[patternKey];

  console.log(`\n${pattern.name}`);

  const render = await createRender(apiKey, pattern.source);
  process.stdout.write(`  レンダリング中 `);

  const url = await pollUntilDone(apiKey, render.id);
  console.log(' 完了!');

  const outputDir = path.join(ROOT, 'output');
  fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `mamori-${patternKey}.mp4`);
  await downloadFile(url, filePath);
  console.log(`  ✅ output/mamori-${patternKey}.mp4 に保存`);
}

// APIキーをターミナルで対話的に入力してもらう
function askApiKey() {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Creatomate の API Key を入力してください');
    console.log('  （creatomate.com → Settings → API → API Key）');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    rl.question('\n  API Key: ', answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// APIキーを .env.local に保存（次回から入力不要になる）
function saveApiKey(key) {
  const envPath = path.join(ROOT, '.env.local');
  const line = `CREATOMATE_API_KEY=${key}\n`;
  if (fs.existsSync(envPath)) {
    const existing = fs.readFileSync(envPath, 'utf-8');
    if (!existing.includes('CREATOMATE_API_KEY')) {
      fs.appendFileSync(envPath, '\n' + line);
      console.log('\n  ✅ API Key を .env.local に保存しました（次回から入力不要）');
    }
  } else {
    fs.writeFileSync(envPath, line);
    console.log('\n  ✅ .env.local を作成して API Key を保存しました（次回から入力不要）');
  }
}

async function main() {
  loadEnv();

  let apiKey = process.env.CREATOMATE_API_KEY;
  if (!apiKey) {
    apiKey = await askApiKey();
    if (!apiKey) {
      console.error('\n❌ API Key が入力されませんでした\n');
      process.exit(1);
    }
    saveApiKey(apiKey);
    process.env.CREATOMATE_API_KEY = apiKey;
  }

  const allKeys = Object.keys(PATTERNS);
  const arg = process.argv[2];
  let targets;

  if (!arg || arg === 'all') {
    targets = allKeys;
  } else if (allKeys.includes(arg)) {
    targets = [arg];
  } else {
    console.error(`\n❌ 不明なパターン: "${arg}"`);
    console.error(`   使い方: npm run generate-video [${allKeys.join('|')}|all]\n`);
    process.exit(1);
  }

  console.log('\nマモリAI ショート動画生成スクリプト');
  console.log('=====================================');

  let ok = 0;
  for (const key of targets) {
    try {
      await run(key);
      ok++;
    } catch (err) {
      console.error(`  ❌ エラー: ${err.message}`);
    }
  }

  console.log(`\n=====================================`);
  console.log(`完了: ${ok}/${targets.length} 本 → output/ フォルダを確認\n`);
}

main().catch(err => {
  console.error('\n❌ エラー:', err.message);
  process.exit(1);
});
