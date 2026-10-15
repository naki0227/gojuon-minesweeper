import { tr } from "../i18n";

// The privacy policy text. The web build is always Japanese; the English
// version is what the iOS app shows on English devices.
export const PRIVACY_TEXT = tr({
  ja: {
    headTitle: "プライバシーポリシー | 五十音マインスイーパー",
    headDescription: "五十音マインスイーパーのプライバシーポリシー",
    title: "プライバシーポリシー",
    updated: "最終更新: 2026年10月15日",
    collected: {
      heading: "取得する情報",
      body: "現在、本サービスはアカウント登録を必要とせず、氏名、住所、電話番号などの個人情報をゲーム利用のために要求しません。",
    },
    usage: {
      heading: "利用状況データ",
      body: "サービス品質の改善のため、iOS版ではGoogle（Google LLC）のFirebaseアナリティクスを使い、ゲームの開始・終了、正解・不正解、出題の種類（言語・ジャンル・文字数）、広告の表示と収益などの利用状況と、アプリごとに発行されるインスタンスID、端末の種類、OSのバージョン、おおよその国・地域を送信します。氏名、メールアドレス、入力した回答の文字列は送りません。これらは何人が遊んでいるか、どの機能が使われているか、広告収益の集計にだけ使い、Googleのプライバシーポリシーに従って処理されます。Web版は利用状況データを送信しません。",
    },
    ads: {
      heading: "広告",
      intro:
        "本サービスは広告配信サービスとしてGoogleを利用しています（iOS・Android版はGoogle AdMob、Web版はGoogle AdSense）。広告はゲーム設定画面と結果画面にのみ表示し、対局中には表示しません。",
      collects:
        "広告の配信、効果測定、不正防止のために、Googleが次の情報を収集・処理することがあります。",
      items: [
        "・IPアドレスと、そこから推定されるおおよその位置",
        "・端末の識別子（iOSのベンダー識別子、Androidの広告ID、Web版のCookieなど）",
        "・広告の表示やタップなどの広告データ",
        "・アプリやページの操作情報",
        "・クラッシュやパフォーマンスの情報",
        "・端末、OS、ブラウザの種類",
      ],
      tracking:
        "iOS・Android版では「Appのトラッキング」の許可を求めず、AdMobには非パーソナライズ広告のみをリクエストしています。Web版では、Googleの同意管理の結果に応じて、Cookieを使ったパーソナライズ広告が表示される場合があります。",
      partnerSites: "Googleのパートナーサイトでのデータ利用について",
      partnerSitesHref:
        "https://policies.google.com/technologies/partner-sites?hl=ja",
      adsPolicy: "Googleの広告に関するポリシー",
      adsPolicyHref: "https://policies.google.com/technologies/ads?hl=ja",
    },
    consent: {
      heading: "広告に関する同意の変更・撤回",
      body: "欧州経済領域・英国など同意が必要な地域では、初回に広告に関する同意を確認します。同意の内容は、下の「広告のプライバシー設定を変更する」からいつでも変更・撤回できます（同意が必要な地域でのみ表示されます）。",
      other:
        "ほかに、Androidでは端末の設定から広告IDを削除またはリセットでき、Web版ではブラウザのCookieを削除するか、Googleの広告設定でパーソナライズ広告を無効にできます。",
      adCenter: "Googleのマイ アド センター",
    },
    removeAds: {
      heading: "広告の非表示（アプリ内課金）",
      body: "アプリ版では、広告を非表示にするアプリ内課金を提供します。決済はApple（App Store）またはGoogle（Google Play）が行い、本サービスがクレジットカード番号などの決済情報を取得することはありません。購入状態は端末上で各ストアに照会して確認します。購入はWeb版には引き継がれません。",
    },
    retention: {
      heading: "保存期間と削除",
      body: "ひとりの端末で遊ぶゲームの状態は端末内だけで扱い、アプリを削除すると消えます。オンライン対戦のデータは下記「オンライン対戦」のとおりです。購入履歴はAppleまたはGoogleが管理します。iOS版でAppleでログインしてジェムを使う場合、サーバーにアカウントID、Appleから受け取るメールアドレス（「メールを非公開」を選んだ場合はAppleの転送用アドレス）、ジェム残高と増減の履歴、ジェム購入の取引番号を保存します。メールアドレスはアカウントの管理とお問い合わせへの対応にだけ使い、広告や第三者への提供には使いません。アプリの「アカウントを削除」から、アカウント・残高・履歴を削除できます（残っているジェムは失われます）。取引番号は同じ購入の重複付与を防ぐため、アカウントと切り離して保存します。また、初回特典を同じApple IDに二度付与しないよう、AppleのユーザーIDを復元できない形（ハッシュ値）にして保存します。返金されたジェム購入は、そのパックのジェム数を上限に残高から差し引きます（残高は0未満になりません）。Googleが広告のために処理する情報の保存期間と削除方法は、上記のGoogleのポリシーに従います。",
      contact:
        "情報の取り扱いに関するお問い合わせや削除のご相談は、下記のメールアドレスまでご連絡ください。",
    },
    online: {
      heading: "オンライン対戦",
      body: "オンライン対戦では、対戦を成立させるために、端末ごとに自動で発行するランダムな識別子（匿名ログイン。氏名やメールアドレスは使いません）、入力した合言葉、出題内容、回答や開いた文字などの対戦の記録を、Supabase（Supabase, Inc.）のサーバーに保存します。通信の過程でIPアドレスが処理されます。",
      visibility:
        "対戦相手に見えるのは盤面と回答の結果だけで、あなたの識別子は表示しません。対戦の記録は対戦の進行と不正防止のためだけに使い、終了した部屋の記録はおよそ1週間で削除します。",
    },
    daily: {
      heading: "今日の一問 プレゼント",
      body: "今日の一問のページで答えて応募すると、重複応募の防止と抽選のために、ブラウザごとに自動で発行するランダムな識別子とIPアドレスを、そのままでは復元できない形（鍵付きのハッシュ値）にして、受け取り番号・応募日・当選結果とともにSupabaseのサーバーに保存します。氏名やメールアドレス、SNSのアカウントはいただきません。識別子とIPアドレスのハッシュ値はおよそ30日後に削除し、受け取り番号と当選結果はコードを二重に渡さないために保存します。回答の内容は正解かどうかの判定にだけ使い、保存しません。受け取り番号と識別子はお使いのブラウザにも保存されます。",
    },
    thirdParties: {
      heading: "第三者提供",
      body: "法令に基づく場合を除き、取得した情報を第三者へ販売しません。外部サービスを利用する場合は、サービス提供に必要な範囲で情報が処理されることがあります。",
    },
    changes: {
      heading: "変更",
      body: "機能追加や利用サービスの変更に伴い、本ポリシーを更新することがあります。重要な変更は本ページ上で告知します。",
    },
    support: "サポート",
    back: "ゲームへ戻る",
  },
  en: {
    headTitle: "Privacy Policy | Gojuon Minesweeper",
    headDescription: "Privacy policy for Gojuon Minesweeper",
    title: "Privacy Policy",
    updated: "Last updated: October 15, 2026",
    collected: {
      heading: "Information we collect",
      body: "This service currently does not require you to create an account, and does not ask for personal information such as your name, address or phone number in order to play the game.",
    },
    usage: {
      heading: "Usage data",
      body: "To improve the service, the iOS app uses Firebase Analytics by Google (Google LLC) to send usage data, such as game starts and ends, correct and wrong answers, the kind of question (language, genre, length), and ad views and revenue, together with an app instance ID issued per installation, your device model, OS version and approximate country or region. We do not send your name, email address or the answers you type. We use this data only to count how many people play, which features are used and ad revenue, and Google processes it under its privacy policy. The web version does not send usage data.",
    },
    ads: {
      heading: "Ads",
      intro:
        "This service uses Google to serve ads (Google AdMob in the iOS and Android apps, Google AdSense on the web). Ads are shown only on the game setup and results screens, never during a game.",
      collects:
        "To serve ads, measure their performance and prevent fraud, Google may collect and process the following information:",
      items: [
        "• Your IP address and the approximate location estimated from it",
        "• Device identifiers (such as the identifier for vendors on iOS, the advertising ID on Android, and cookies on the web)",
        "• Ad data, such as which ads were shown or tapped",
        "• How you use the app or pages",
        "• Crash and performance information",
        "• Device, OS and browser type",
      ],
      tracking:
        "The iOS and Android apps do not ask for permission to track you (“App Tracking”), and request only non-personalized ads from AdMob. On the web, depending on your choices in Google's consent management, personalized ads that use cookies may be shown.",
      partnerSites:
        "How Google uses data from sites and apps that use its services",
      partnerSitesHref:
        "https://policies.google.com/technologies/partner-sites?hl=en",
      adsPolicy: "Google's advertising policy",
      adsPolicyHref: "https://policies.google.com/technologies/ads?hl=en",
    },
    consent: {
      heading: "Changing or withdrawing ad consent",
      body: "In regions where consent is required, such as the European Economic Area and the UK, we ask for your ad consent the first time. You can change or withdraw your consent at any time with “Change ad privacy settings” below (shown only in regions where consent is required).",
      other:
        "In addition, on Android you can delete or reset your advertising ID in your device settings, and on the web you can delete your browser's cookies or turn off personalized ads in Google's ad settings.",
      adCenter: "Google My Ad Center",
    },
    removeAds: {
      heading: "Removing ads (in-app purchase)",
      body: "The apps offer an in-app purchase that removes ads. Payment is handled by Apple (App Store) or Google (Google Play), and this service never receives payment information such as credit card numbers. Your purchase status is checked on your device by asking the store. Purchases do not carry over to the web version.",
    },
    retention: {
      heading: "Retention and deletion",
      body: "The state of games you play alone on your device stays only on your device and is erased when you delete the app. Online match data is handled as described under “Online matches” below. Purchase history is managed by Apple or Google. If you sign in with Apple on iOS to use gems, we store on our server your account ID, the email address we receive from Apple (Apple's relay address if you chose “Hide My Email”), your gem balance and its history of changes, and the transaction IDs of your gem purchases. We use the email address only to manage your account and respond to your inquiries, and never use it for ads or share it with third parties. You can delete your account, balance and history with “Delete account” in the app (any remaining gems will be lost). Transaction IDs are kept separately from your account so that the same purchase is never credited twice. Also, so that the first-time bonus is not given twice to the same Apple ID, we store your Apple user ID in a form that cannot be restored (a hash). For refunded gem purchases, we deduct up to that pack's number of gems from your balance (your balance never goes below 0). The retention and deletion of information Google processes for ads follow Google's policies above.",
      contact:
        "For questions about how we handle your information, or to ask about deleting it, please contact us at the email address below.",
    },
    online: {
      heading: "Online matches",
      body: "To set up online matches, we store on the servers of Supabase (Supabase, Inc.) a random identifier issued automatically for each device (anonymous sign-in; no name or email address is used), the room code you enter, the questions, and match records such as answers and opened letters. Your IP address is processed in the course of communication.",
      visibility:
        "Your opponent sees only the board and the results of answers; your identifier is not shown. Match records are used only to run matches and prevent cheating, and records of finished rooms are deleted after about one week.",
    },
    daily: {
      heading: "Daily Question (今日の一問) giveaway",
      body: "When you answer and enter on the Daily Question page, we store a random identifier issued automatically for each browser and your IP address, both converted into a form that cannot be restored as is (a keyed hash), together with your claim number, entry date and draw result, on Supabase's servers in order to prevent duplicate entries and run the draw. We do not ask for your name, email address or social media accounts. The hashes of the identifier and IP address are deleted after about 30 days; the claim number and draw result are kept so that a code is never given out twice. Your answer is used only to check whether it is correct and is not stored. The claim number and identifier are also stored in your browser.",
    },
    thirdParties: {
      heading: "Sharing with third parties",
      body: "Except as required by law, we do not sell the information we collect to third parties. When we use external services, information may be processed to the extent needed to provide the service.",
    },
    changes: {
      heading: "Changes",
      body: "We may update this policy as we add features or change the services we use. We will announce important changes on this page.",
    },
    support: "Support",
    back: "Back to game",
  },
});
