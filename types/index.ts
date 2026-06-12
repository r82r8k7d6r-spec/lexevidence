export interface BasicInfo {
  applicantName: string;
  opponentName: string;
  marriageDate: string;
  discoveryDate: string;
  relationship: string;
  additionalInfo: string;
  // 不貞相手の情報
  affairPartnerName: string;
  affairPartnerAge: string;
  affairPartnerOccupation: string;
  affairPartnerMeetingContext: string;
  affairStartPeriod: string;
}

export interface LineData {
  text: string;
  fileName?: string;
}

export interface ScreenshotFile {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
}

export interface AudioData {
  fileName?: string;
  transcription: string;
}

export interface FormData {
  basicInfo: BasicInfo;
  lineData: LineData;
  screenshots: ScreenshotFile[];
  audioData: AudioData;
}

export interface TimelineEvent {
  date: string;
  event: string;
  source: string;
}

export interface EvidenceItem {
  type: string;
  description: string;
}

export interface GeneratedReport {
  timeline: TimelineEvent[];
  evidenceList: EvidenceItem[];
  partiesInfo: string;
  rawSummary: string;
}

// ナレッジベース
export const KNOWLEDGE_CATEGORIES = [
  "契約確認",
  "工事関連",
  "システム操作",
  "クレーム対応",
  "技術切り分け",
  "V6システム関連",
  "例外案件",
  "その他",
] as const;

export type KnowledgeCategory = (typeof KNOWLEDGE_CATEGORIES)[number];

export interface KnowledgeEntry {
  id: string;
  title: string;
  category: string;
  tags: string[];
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
