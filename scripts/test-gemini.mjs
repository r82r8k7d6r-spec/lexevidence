/**
 * Gemini API 接続テストスクリプト
 * 使い方: GEMINI_API_KEY=your_key node scripts/test-gemini.mjs
 */

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY が設定されていません');
  console.error('   実行方法: GEMINI_API_KEY=your_key node scripts/test-gemini.mjs');
  process.exit(1);
}

console.log('✓ GEMINI_API_KEY 確認済み（先頭8文字）:', apiKey.slice(0, 8) + '...');
console.log('📡 Gemini 1.5 Pro に接続中...\n');

const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

const body = {
  system_instruction: {
    parts: [{ text: 'あなたはテキスト分析の専門家です。' }],
  },
  contents: [
    { role: 'user', parts: [{ text: '「テスト」と返答してください。' }] },
  ],
  safetySettings: [
    { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
  ],
  generationConfig: { maxOutputTokens: 100, temperature: 0.1 },
};

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    console.error('❌ API エラー', res.status);
    console.error('レスポンス:', JSON.stringify(json, null, 2));
    process.exit(1);
  }

  const candidate = json.candidates?.[0];
  if (!candidate) {
    console.error('❌ candidates が空です');
    console.error('promptFeedback:', json.promptFeedback);
    process.exit(1);
  }

  const text = candidate.content?.parts?.[0]?.text ?? '';
  console.log('✅ Gemini API 接続成功！');
  console.log('レスポンス:', text);
  console.log('finishReason:', candidate.finishReason);
} catch (err) {
  console.error('❌ 接続エラー:', err.message);
  process.exit(1);
}
