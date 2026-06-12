/* 共通ストレージユーティリティ（localStorage ベース） */
const STORAGE_PREFIX = "cck_";

function loadItems(key, defaults) {
  const raw = localStorage.getItem(STORAGE_PREFIX + key);
  if (raw === null) {
    return defaults.slice();
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : defaults.slice();
  } catch (e) {
    return defaults.slice();
  }
}

function saveItems(key, items) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(items));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[ch]);
}

function nowForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function todayForInput() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* 初期表示用のサンプルデータ（未登録時のみ表示される） */
const DEFAULT_FAQS = [
  {
    id: "seed-1",
    question: "ログインパスワードを忘れた場合はどうすればよいですか？",
    answer: "ログイン画面の「パスワードをお忘れの方」リンクから登録メールアドレスを入力すると、パスワード再設定用のメールが送信されます。メールが届かない場合は迷惑メールフォルダもご確認いただくよう案内してください。",
    category: "ログイン・認証",
    tags: ["パスワード", "再設定", "ログイン"],
    createdAt: "2025-01-10 10:00",
  },
  {
    id: "seed-2",
    question: "料金プランの変更や解約はどこから行えますか？",
    answer: "マイページの「ご契約情報」から、プラン変更・解約のお手続きが可能です。解約後も当月末まではサービスをご利用いただけます。",
    category: "料金・決済",
    tags: ["解約", "プラン変更", "料金"],
    createdAt: "2025-01-12 11:30",
  },
  {
    id: "seed-3",
    question: "音声ファイルをアップロードしても処理が完了しません。",
    answer: "アップロード可能なファイル形式・サイズの上限をご確認ください。大容量ファイルの場合は処理に数分かかることがあります。10分以上完了しない場合はエスカレーション記録に登録し、開発チームへ連携してください。",
    category: "不具合・エラー",
    tags: ["アップロード", "音声", "処理エラー"],
    createdAt: "2025-01-15 09:15",
  },
  {
    id: "seed-4",
    question: "作成したPDFレポートをダウンロードできません。",
    answer: "ブラウザのポップアップブロック設定をご確認のうえ、再度ダウンロードボタンを押していただくよう案内してください。改善しない場合は別のブラウザでの再試行をお願いしてください。",
    category: "操作方法",
    tags: ["PDF", "ダウンロード", "出力"],
    createdAt: "2025-01-18 14:00",
  },
];

const DEFAULT_CLAIMS = [
  {
    id: "seed-1",
    date: "2025-02-03",
    category: "対応品質",
    content: "電話対応の際、こちらの説明が分かりにくく、解決まで何度も同じ内容を聞かれて時間がかかったとのご指摘があった。",
    response: "ご不便をおかけしたことをお詫びし、改めて手順を一つずつ確認しながら案内し直した。最終的にはお客様の問題は解決した。",
    result: "お客様にはご納得いただき、対応終了。後日担当者へフィードバックを実施。",
    lesson: "案内時は一文ずつ区切り、お客様の理解度を確認しながら進める。FAQの文言も平易な表現に見直す。",
    createdAt: "2025-02-03 15:20",
  },
  {
    id: "seed-2",
    date: "2025-02-20",
    category: "料金・契約",
    content: "解約手続きをしたはずなのに翌月も課金されていたとのご連絡があった。",
    response: "契約状況を確認したところ、解約申請が完了していなかったことが判明。お詫びの上、即時解約処理を行い、誤って課金された分は返金手続きを実施した。",
    result: "返金処理完了後、お客様より了承いただいた。",
    lesson: "解約手続き完了後は、完了通知メールを必ず送信する運用に変更。手続きの最終確認画面の文言も見直す。",
    createdAt: "2025-02-20 11:05",
  },
];
