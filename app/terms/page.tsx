import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">利用規約・免責事項</h1>
          <p className="text-gray-500 mt-1 text-sm">弁護士提出用 マモリAI</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 space-y-8 text-sm text-gray-700 leading-relaxed">

          {/* サービス概要 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">1. サービス概要</h2>
            <p>
              本サービス「弁護士提出用 マモリAI」（以下「本サービス」）は、不倫・不貞行為に基づく慰謝料請求を検討されている方が、弁護士への相談・依頼に際して提出する資料の作成を補助することを目的としたツールです。
            </p>
            <p className="mt-2">
              ユーザーが入力した情報（LINEトーク、スクリーンショット、音声文字起こし等）をAI（Anthropic Claude）に送信し、法的資料の草案を自動生成します。
            </p>
          </section>

          {/* 免責事項 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">2. 免責事項</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>本サービスが生成する資料は、あくまでAIによる補助的な草案であり、法的効力を保証するものではありません。</li>
              <li>生成された資料の内容について、当サービスは一切の責任を負いません。</li>
              <li>AIの性質上、事実誤認・誤解釈・不正確な情報が含まれる可能性があります。必ず弁護士による確認・修正を受けてください。</li>
              <li>本サービスの利用により生じた損害について、当サービスは一切の責任を負いません。</li>
              <li>サービスの停止、障害、データ消失等による損害についても同様です。</li>
            </ul>
          </section>

          {/* 個人情報の取り扱い */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">3. 個人情報の取り扱い</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>ユーザーが入力した個人情報・証拠データは、AI処理（資料生成）のみを目的として使用します。</li>
              <li>入力データは当サービスのサーバーに保存・記録しません。セッション終了後にデータは破棄されます。</li>
              <li>データはAnthropic社（Claude API）およびOpenAI社（Whisper API）のAPIに送信されます。各社のプライバシーポリシーが適用されます。</li>
              <li>第三者への個人情報の提供は、上記API利用を除き行いません。</li>
            </ul>
          </section>

          {/* 弁護士法72条への対応 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">4. 弁護士法第72条への対応</h2>
            <p>
              本サービスは、弁護士法第72条（非弁護士の法律事務の取扱い等の禁止）を遵守します。
            </p>
            <ul className="space-y-2 list-disc list-inside mt-2">
              <li>本サービスは法律事務の代理・代行を行いません。</li>
              <li>法的判断・法律相談・交渉の代理は一切行いません。</li>
              <li>生成される資料は「弁護士への相談補助資料の草案」であり、法的アドバイスではありません。</li>
              <li>実際の慰謝料請求・示談交渉・訴訟手続きは、必ず弁護士に依頼してください。</li>
            </ul>
          </section>

          {/* 利用環境 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">5. 推奨利用環境</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>最新バージョンのChrome、Safari、Firefox、Edgeを推奨します。</li>
              <li>iOSをダークモードでご利用の場合、表示が見にくくなる場合があります。ライトモードでのご利用を推奨します。</li>
              <li>JavaScript が有効な環境でご利用ください。</li>
            </ul>
          </section>

          {/* 禁止事項 */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-3">6. 禁止事項</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>虚偽の情報を入力して資料を生成すること</li>
              <li>生成された資料を弁護士の確認なしに相手方への直接交渉に使用すること</li>
              <li>本サービスを不正な目的（嫌がらせ・脅迫等）に使用すること</li>
              <li>第三者の権利を侵害する目的での使用</li>
              <li>本サービスのシステムへの不正アクセス・改ざん</li>
              <li>商業目的での無断使用・転用</li>
            </ul>
          </section>

          {/* 同意 */}
          <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-lg font-bold text-blue-900 mb-2">7. 利用規約への同意</h2>
            <p className="text-blue-800">
              本サービスを利用することにより、上記の利用規約・免責事項すべてに同意したものとみなします。同意いただけない場合は、本サービスの利用をお控えください。
            </p>
          </section>

          <div className="text-center pt-4">
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-8 py-2 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              ← トップに戻る
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          本ツールはAIによる補助資料生成です。法的判断は必ず弁護士にご相談ください。
        </p>
      </div>
    </main>
  );
}
