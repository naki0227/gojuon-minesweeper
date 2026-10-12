# ADR: ファイル行数と重複コードをCIとpre-commitで検査する

## 背景と課題

1ファイル300行以内という方針に対し、既存の画面・コンポーネント・Edge Functionの6ファイルが超えている。重複コードの検知もなく、レビューでしか気づけない。CIはあるがローカルのコミット時の検査がない。

## 選択肢

1. ESLint の `max-lines` と手書きの重複チェック。`max-lines` は既存ファイルの例外をファイルごとの上限で表せず、`supabase/` は lint 対象外。
2. 行数は小さな Node スクリプト、重複は jscpd。pre-commit は husky。
3. 行数は小さな Node スクリプト、重複は jscpd。pre-commit は `core.hooksPath` と `.githooks/`。

## 決定と理由

3を採用する。行数チェックは既存ファイルを当時の行数で登録し、増やせないが減らせる「ラチェット」にした。依存を増やさずにテストできる。重複検知は自前実装より jscpd が確実で、devDependency のみ。pre-commit は husky を使わず、`npm install` の `prepare` で `core.hooksPath` を設定する（git のない EAS ビルド環境では何もしない）。

## 利点と欠点

- 利点: 新しい大きいファイルと重複がCIとコミット時に止まる。既存ファイルを今すぐ分割しなくてよい。
- 欠点: pre-commit は数秒かかり、`--no-verify` で回避できる（最終的な保証はCIとmain保護）。jscpd の更新を追う必要がある。重複率はしきい値方式なので、小さな重複は通る。

## 見直し条件

既存の大きいファイルを分割したら `scripts/file-line-limits.mjs` の行数を下げる。重複率が下がったら `.jscpd.json` の `threshold` も下げる。pre-commit が遅くなったらテストをCIのみに移す。
