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

/* 手上げ内訳に対応するカテゴリ（FAQ・切り分けフロー・手上げ記録・判断基準表で共通利用） */
const ESCALATION_CATEGORIES = [
  "技術切り分け",
  "V6システム関連",
  "契約確認",
  "工事関連",
  "システム操作",
  "クレーム対応",
  "例外案件",
];

/* 初期表示用のサンプルデータ（未登録時のみ表示される） */
const DEFAULT_FAQS = [
  {
    id: "seed-1",
    question: "インターネットに全く繋がらないと言われたら、最初に何を確認しますか？",
    answer: "ルーター・ONUの各ランプ（電源・インターネット/PPP・LAN）の点灯状況をご案内します。次に、ルーターの電源プラグを抜いて10秒ほど待ってから再度差し込む「再起動」をご案内してください。改善しない場合は切り分けフローの「技術切り分け」に進んでください。",
    category: "技術切り分け",
    tags: ["ランプ確認", "再起動", "切り分け"],
    createdAt: "2025-01-10 10:00",
  },
  {
    id: "seed-2",
    question: "Wi-Fiの速度が遅いと言われた場合の案内手順は？",
    answer: "まず有線LAN接続でも遅いかをご確認ください。有線でも遅い場合は契約プランの速度帯と混雑時間帯の影響をご説明します。Wi-Fiのみ遅い場合は、ルーターの設置場所（電子レンジ・金属製家具を避ける）の見直しや、2.4GHz/5GHzなど周波数帯の変更をご案内してください。",
    category: "技術切り分け",
    tags: ["Wi-Fi", "速度", "設置場所"],
    createdAt: "2025-01-11 09:30",
  },
  {
    id: "seed-3",
    question: "v6プラス対応ルーターとは何ですか？お客様への説明方法は？",
    answer: "「v6プラス」はIPv6 IPoE方式を利用した接続方式で、対応ルーターへの交換・設定変更により追加料金なしで利用でき、混雑時間帯でも速度が安定しやすいというメリットがあります。対応ルーターの一覧や設定手順は、切り分けフローの「V6システム関連」をご確認ください。",
    category: "V6システム関連",
    tags: ["v6プラス", "IPv6", "ルーター"],
    createdAt: "2025-01-12 11:00",
  },
  {
    id: "seed-4",
    question: "v6プラス利用中にオンラインゲームのポート開放ができないと言われたら？",
    answer: "v6プラスは仕様上、ポート開放（UPnP・ポートフォワーディング）に制限があります。従来のPPPoE接続を別途利用できる「PPPoEオプション」をご契約いただくことでポート開放が可能になる場合があることをご案内し、契約確認カテゴリへおつなぎください。",
    category: "V6システム関連",
    tags: ["v6プラス", "ポート開放", "オンラインゲーム"],
    createdAt: "2025-01-13 13:45",
  },
  {
    id: "seed-5",
    question: "契約者本人確認はどのように行いますか？",
    answer: "登録されているお名前・ご住所・契約者番号（お客様番号）のうち2項目以上が一致することを確認します。確認が取れない場合、契約内容に関わるご案内（プラン変更・解約・個人情報の開示等）は行わず、SVにご相談ください。",
    category: "契約確認",
    tags: ["本人確認", "契約者", "個人情報"],
    createdAt: "2025-01-14 10:15",
  },
  {
    id: "seed-6",
    question: "解約のお申し出があった場合、伝えるべき注意事項は？",
    answer: "解約後も当月末まではサービスをご利用いただけることをご案内します。違約金が発生する契約期間内かどうかを契約内容確認システムでご確認のうえ、対象の場合は金額を含めてご説明します。死亡・離婚等の特殊な事情がある場合はSVにご相談ください。",
    category: "契約確認",
    tags: ["解約", "違約金", "本人確認"],
    createdAt: "2025-01-15 14:20",
  },
  {
    id: "seed-7",
    question: "工事日程の変更はどのように受け付けますか？",
    answer: "本人確認後、工事予約システムで現在の予定を確認し、空いている日程の候補をご案内します。工事当日は契約者またはご家族の立会いが必要であることも併せてお伝えください。",
    category: "工事関連",
    tags: ["工事", "日程変更", "立会い"],
    createdAt: "2025-01-16 09:50",
  },
  {
    id: "seed-8",
    question: "メールソフトの設定方法を聞かれた場合は？",
    answer: "お使いのメールソフトに応じて、受信・送信サーバー名、ポート番号、SSL/TLS設定をご案内します。設定情報はご契約時の控え、またはマイページの「メール設定情報」からご確認いただけます。パスワードを忘れた場合はマイページから再設定が可能です。",
    category: "システム操作",
    tags: ["メール設定", "マイページ"],
    createdAt: "2025-01-17 15:00",
  },
  {
    id: "seed-9",
    question: "サービス品質へのご不満に対する一次対応の基本は？",
    answer: "まずお客様のお話を最後までお伺いし、ご不便をおかけした点についてお詫びします。その上で原因や改善状況を分かりやすくご説明します。返金・割引等の金銭的な対応が必要な場合はSVにご確認ください。対応内容は必ず「クレーム対応事例」に記録してください。",
    category: "クレーム対応",
    tags: ["クレーム", "お詫び", "一次対応"],
    createdAt: "2025-01-18 11:10",
  },
  {
    id: "seed-10",
    question: "過去に対応した珍しい事例はどこで確認できますか？",
    answer: "「判断基準表」「手上げ記録」「クレーム対応事例」に類似のケースが登録されていないかをまず確認してください。該当があれば、その対応内容に沿ってご案内します。該当がない場合はSVに確認のうえ対応し、対応後は必ず記録に残してください。",
    category: "例外案件",
    tags: ["例外案件", "ナレッジ", "判断基準"],
    createdAt: "2025-01-19 16:30",
  },
];

/* 「自己判断OK／SVに確認／即エスカレ」基準表の初期データ */
const DEFAULT_CRITERIA = [
  {
    id: "seed-1",
    category: "契約確認",
    situation: "契約者本人によるプラン・料金・契約内容の確認",
    judgment: "ok",
    note: "本人確認のうえ、契約内容確認システム・マイページの情報で案内可能。",
    createdAt: "2025-01-10 10:00",
  },
  {
    id: "seed-2",
    category: "契約確認",
    situation: "名義変更・解約の手続き受付（通常ケース）",
    judgment: "ok",
    note: "所定の手順に従い受付。違約金の有無を確認して説明する。",
    createdAt: "2025-01-10 10:01",
  },
  {
    id: "seed-3",
    category: "契約確認",
    situation: "契約者以外（家族・代理人）からの契約内容の開示請求",
    judgment: "escalate",
    note: "本人確認ポリシー・個人情報保護に関わるため即時SVへ。",
    createdAt: "2025-01-10 10:02",
  },
  {
    id: "seed-4",
    category: "工事関連",
    situation: "工事日程の確認・変更（通常の空き枠内）",
    judgment: "ok",
    note: "工事予約システムで対応可能。立会いの必要性も説明する。",
    createdAt: "2025-01-10 10:03",
  },
  {
    id: "seed-5",
    category: "工事関連",
    situation: "工事担当者の対応に関する苦情",
    judgment: "confirm",
    note: "協力会社への申し送りが必要となるためSVに確認のうえ対応。",
    createdAt: "2025-01-10 10:04",
  },
  {
    id: "seed-6",
    category: "工事関連",
    situation: "提供エリア外・工事不可と判定された住所への新規申込",
    judgment: "escalate",
    note: "営業判断・特別対応の可否確認が必要なため即時SVへ。",
    createdAt: "2025-01-10 10:05",
  },
  {
    id: "seed-7",
    category: "システム操作",
    situation: "メール設定・Wi-Fi接続設定の手順案内",
    judgment: "ok",
    note: "FAQ・切り分けフローに標準手順があり対応可能。",
    createdAt: "2025-01-10 10:06",
  },
  {
    id: "seed-8",
    category: "システム操作",
    situation: "顧客管理システムの表示エラー・フリーズ（オペレーター側）",
    judgment: "confirm",
    note: "システム障害の可能性があるため、同時発生状況をSVに確認。",
    createdAt: "2025-01-10 10:07",
  },
  {
    id: "seed-9",
    category: "クレーム対応",
    situation: "サービス品質への不満（説明・お詫びで収束が見込める）",
    judgment: "ok",
    note: "傾聴とお詫びで一次対応完結。対応内容はクレーム事例に記録する。",
    createdAt: "2025-01-10 10:08",
  },
  {
    id: "seed-10",
    category: "クレーム対応",
    situation: "返金・割引・補償の要求",
    judgment: "confirm",
    note: "金額・条件は権限外のためSVに確認のうえ回答する。",
    createdAt: "2025-01-10 10:09",
  },
  {
    id: "seed-11",
    category: "クレーム対応",
    situation: "強い暴言、訴訟・法的措置を示唆する発言",
    judgment: "escalate",
    note: "コンプライアンス上、即時SVへ引き上げ。録音確認も依頼する。",
    createdAt: "2025-01-10 10:10",
  },
  {
    id: "seed-12",
    category: "技術切り分け",
    situation: "切り分けフローの案内範囲内で解決策が見つかる",
    judgment: "ok",
    note: "フローに従い案内。解決しない場合のみ次のステップへ進める。",
    createdAt: "2025-01-10 10:11",
  },
  {
    id: "seed-13",
    category: "技術切り分け",
    situation: "切り分けフローの最終ステップでも解決しない（単発の事象）",
    judgment: "confirm",
    note: "SVに状況を共有のうえ対応継続。ナレッジ化候補として記録する。",
    createdAt: "2025-01-10 10:12",
  },
  {
    id: "seed-14",
    category: "技術切り分け",
    situation: "同時間帯・同エリアで複数件の同様の問い合わせが発生",
    judgment: "escalate",
    note: "広域障害の可能性があるため即時SVへ報告し、障害情報の有無を確認。",
    createdAt: "2025-01-10 10:13",
  },
  {
    id: "seed-15",
    category: "V6システム関連",
    situation: "v6プラス対応ルーターへの乗り換え案内・設定手順",
    judgment: "ok",
    note: "対応ルーター一覧・設定手順がFAQ・フローにあり対応可能。",
    createdAt: "2025-01-10 10:14",
  },
  {
    id: "seed-16",
    category: "V6システム関連",
    situation: "v6プラス環境で特定ゲーム・アプリのポートが使えない",
    judgment: "ok",
    note: "v6プラスの仕様上の制限であることをFAQに沿って案内し、PPPoEオプションも案内する。",
    createdAt: "2025-01-10 10:15",
  },
  {
    id: "seed-17",
    category: "V6システム関連",
    situation: "設定済みでも接続できない、エラーコードや原因が不明",
    judgment: "confirm",
    note: "SVに状況を共有し、ナレッジに該当事例があるか確認する。",
    createdAt: "2025-01-10 10:16",
  },
  {
    id: "seed-18",
    category: "V6システム関連",
    situation: "V6システム全体に影響する可能性のある接続不可が複数発生",
    judgment: "escalate",
    note: "システム障害の疑いがあるため即時SVへ報告。",
    createdAt: "2025-01-10 10:17",
  },
  {
    id: "seed-19",
    category: "例外案件",
    situation: "過去にナレッジ化された例外パターンに該当する",
    judgment: "ok",
    note: "本基準表・手上げ記録・クレーム対応事例を参照して対応する。",
    createdAt: "2025-01-10 10:18",
  },
  {
    id: "seed-20",
    category: "例外案件",
    situation: "初めて遭遇するパターンで、ナレッジに該当事例がない",
    judgment: "confirm",
    note: "SVに確認のうえ対応。対応後は必ずナレッジ化（手上げ記録に詳細を記録）する。",
    createdAt: "2025-01-10 10:19",
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
