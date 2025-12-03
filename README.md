# Enja CLI

![NPM Version](https://img.shields.io/npm/v/%40yhotamos%2Fenja-cli)
![NPM Downloads](https://img.shields.io/npm/dm/%40yhotamos%2Fenja-cli)
![NPM License](https://img.shields.io/npm/l/%40yhotamos%2Fenja-cli)

英語を日本語に翻訳するシンプルなコマンドラインツール

## 特徴

- インストール後すぐ使える（セットアップ不要）
- Google Apps Script の LanguageApp を使用した軽量な翻訳
- 引数，パイプ，ファイルから翻訳可能
- HTML タグ除去機能で Web ページも翻訳可能
- OpenAI API を使用して高品質な翻訳も可能
- 翻訳履歴の保存・参照機能

## インストール

```bash
npm install -g @yhotamos/enja-cli
```

## 使い方

### 基本的な使い方

```bash
# 引数で渡された文字列を翻訳
enja "Hello, world!"

# パイプで翻訳
echo "Hello, world!" | enja

# ファイルから読み込み
enja -f input.txt -o output.txt

# 翻訳方向を逆にする (日本語 → 英語)
enja "こんにちは" -F

# OpenAI API を使用して翻訳
enja "Hello, world!" --provider openai --api-key YOUR_OPENAI_API_KEY
```

### 履歴と設定

```bash
# 翻訳履歴を表示
enja history

# 設定を表示・変更
enja config
enja config endpoint https://api.example.com/translate
```

### 実用例

```bash
# エラーメッセージの翻訳
npm install nonexistent-package 2>&1 | enja

# Git コマンドのヘルプを日本語化
git --help | enja

# 英語のドキュメントを日本語に変換
enja -f CONTRIBUTING.md -o CONTRIBUTING.ja.md

# Webページの本文を翻訳（HTMLタグ除去）
curl -s https://example.com | enja -s

# APIドキュメントなどテキストコンテンツの翻訳
curl -s https://example.com/api/docs | enja
```

## コマンド

[COMMANDS.md](docs/COMMANDS.md) を参照してください．

## セキュリティとプライバシー

- 翻訳データは保存されません（リクエストごとに処理し，即座にレスポンス）
- 他のユーザーの翻訳内容は見えません（完全にステートレス）
- 機密情報の翻訳は避けてください（公開エンドポイントを使用しているため）

## 制限事項

- 1 日あたりのリクエスト数: すべてのユーザーで共有で約 5,000 リクエスト
- 文字数制限: 1 リクエストあたり最大 100,000 文字

制限に達した場合はエラーメッセージが表示されます．

## 今後の予定

- [ ] 複数言語対応
- [ ] プロファイル機能（複数の設定を切り替え）
- [ ] API キーの暗号化保存

## 貢献

バグ報告や機能リクエストは [GitHub Issues](https://github.com/yhotamos/enja-cli/issues) へお願いします．

## 作者

yhotta240

- Email: yhotta240@gmail.com
- GitHub: [@yhotta240](https://github.com/yhotta240)
