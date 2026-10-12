# 五十音マインスイーパー

五十音表 / Alphabet を使った2人対戦のワード推理ゲームです。

お題の答えに含まれる文字が盤面上の「地雷」になります。プレイヤーは交互に「回答 → 1文字開ける」を行い、先に正解した方が勝ちです。地雷を開いたプレイヤーは、次の自分のターンだけ回答権を失います。

## 現在のMVP

- iOS / Android / Web 共通
- ローカル2人対戦
- 日本語の五十音盤 / 英語のA〜Z盤
- 完全ランダム出題
- 言語・ジャンル・文字数フィルター
- セーフマスは周囲8マスの地雷数を表示
- 0マスは通常のマインスイーパーと同じ連鎖オープン
- 日本語は小文字・濁音・半濁音を区別しない
- 長音 `ー` は `ん` の下の独立マス
- 同じ文字の重複を許可
- 同ジャンル・同文字数・同signatureの別単語は複数正解として自動グルーピング
- 漢字の表示名と読みを分離し、どちらでも回答可能
- 問題バンク 11,284件（raw entries。signature衝突は出題時に自動統合）
- GA4 / Firebase Analytics 用イベント窓口
- 問題バンク検証 + TypeScript CI

## 主なジャンル

日本語:

- スポーツ / 食べ物 / 動物
- 理科・生物 / 化学 / 物理 / 地学
- 社会・歴史 / 公民 / 地理 / 歴史人物
- 都道府県 / 世界の国
- 俳優 / 女優 / アイドル / アイドル・グループ / 声優
- 音楽アーティスト / お笑い
- アニメ・漫画 / ゲーム / IT用語 / 職業

English:

- Animals / Foods / Sports / Science / Geography
- Technology / Programming / Jobs
- Nature / Space / Weather
- Countries / Transport / Home / Body / Colors / Music / Everyday
- 3D Graphics / Algorithms / Architecture / Astronomy
- Birds / Cats / Dogs / Fish / Fruit / Furniture
- Chemistry / Construction / Data Structures / Machine Learning
- Gaming / History / Geometry / Infrastructure / Insurance
- Military / Minerals / Music Instruments など

## 文字ルール

### 日本語

- 小文字は区別しない（`っ → つ`, `ゃ → や`）
- 濁音・半濁音は区別しない（`が → か`, `ば/ぱ → は`）
- 長音 `ー` は独立した1文字
- 重複文字は回数をsignatureに保持する

### English

- 大文字・小文字は区別しない
- スペース・記号は盤面に含めない
- A〜Zの出現回数をsignatureに保持する

## Tech

- Expo
- React Native
- TypeScript
- Expo Router
- iOS / Android / Web

## Development

```bash
npm install
npm run validate:questions
npm run typecheck
npm run start
```

Webのみ:

```bash
npm run web
```

## 問題データ

問題は `src/data/question-bank-*.json` に追加します。

現在は駅名・路線名などの単純な地名データで水増しせず、学習用語・芸能・ゲーム・一般語など、ジャンルとして遊べるデータを優先しています。

```json
{
  "id": "example",
  "language": "ja",
  "category": "理科・生物",
  "display": "光合成",
  "value": "こうごうせい"
}
```

`display` は画面・回答用の正式表記、`value` は盤面生成に使う読み / spelling です。

追加後は必ず:

```bash
npm run validate:questions
```

でID重複、空データ、正規化不能な問題などを検査します。

## Roadmap

- [x] ゲームルール
- [x] ローカル2人対戦
- [x] 日本語 / 英語
- [x] ジャンル / 文字数 / 完全ランダム
- [x] 10,000件超の問題バンク
- [ ] GA4 / Firebase Analytics 実接続
- [ ] Search Console / SEO
- [ ] 問題データのDB同期
- [ ] オンライン対戦
- [ ] 任意アカウント・戦績

> オンライン対戦時は、不正防止のため正解データをクライアントへ配らず、サーバー側で判定する構成に変更します。
