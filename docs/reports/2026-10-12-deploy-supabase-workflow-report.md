# 作業報告書

## 作業日時

2026年10月12日 13時32分25秒（作業環境の現在時刻）

## 作業対象・目的

Supabase（DB マイグレーション・Edge Function `online-game`）の本番反映を、順番固定・記録付きで行えるようにする。

## 変更内容・変更したファイル

- `.github/workflows/deploy-supabase.yml`: 手動実行のみ。main 限定、`production` 環境、Secrets 未設定なら失敗。dry run（既定）は適用待ちのマイグレーション表示だけ。本実行はマイグレーション → ルールのコピー → Edge Function デプロイ。
- `docs/online-play.md`: 使い方と初回の Secrets 登録手順。
- `docs/adr/2026-10-12-manual-supabase-deploy.md`、`docs/TODO.md`。

## 設計上の意図

順番の誤りと、意図しない本番 DB 変更を防ぐ。自動実行にはしない。

## 影響範囲

アプリ・CI には影響なし。実行するまで本番は変わらない。

## 追加・更新したテスト・確認コマンド

ワークフローは単体テストの対象外。`npm run online:sync` がローカルで成功することを確認。Secrets 未登録のため実際の実行は未確認。

## CIで確認される内容

既存の CI（このワークフロー自体は CI では動かない）。

## 未解決の課題・次にやること

1. GitHub の `production` 環境に Secrets 3つを登録する（ユーザー作業）。
2. dry run で `20261012035108_atomic_quick_match` が表示されることを確認し、本実行する。

## 次回最初に見るべきファイル

`.github/workflows/deploy-supabase.yml`、`docs/online-play.md`

## 引き継ぎ事項

本番反映はユーザーの了承を得てから。順番はマイグレーション → Edge Function → アプリ。
