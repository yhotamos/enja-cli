# Enja CLI

![NPM Version](https://img.shields.io/npm/v/%40yhotamos%2Fenja-cli)
![NPM Downloads](https://img.shields.io/npm/dm/%40yhotamos%2Fenja-cli)
![NPM License](https://img.shields.io/npm/l/%40yhotamos%2Fenja-cli)

英語を日本語に翻訳するシンプルなコマンドラインツール

## 特徴

- セットアップ不要で，インストール後すぐに利用可能
- Google Apps Script の LanguageApp を使用した軽量な翻訳
- 引数，標準入力（パイプ），ファイル入力に幅広く対応
- HTML タグを除去して Web コンテンツもそのまま翻訳
- OpenAI, Gemini, LM Studio などの各種 API による高品質な翻訳
- 英日・日英の翻訳方向の切り替えが可能
- 翻訳履歴の保存やプロファイル機能による複数 API の切り替えが可能

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

# OpenAI API を一時的に使用して翻訳
enja "Hello, world!" --provider openai --api-key YOUR_OPENAI_API_KEY

# フォーマルなスタイルで翻訳（OpenAI, Gemini, LM Studio, Ollama）
enja "Hello, world!" --provider openai --api-key YOUR_OPENAI_API_KEY --style formal
```

### 履歴と設定

```bash
# 翻訳履歴を表示
enja history

# 設定を表示/追加/アクティブ化
enja config
enja config add work --provider gemini --api-key YOUR_GEMINI_API_KEY --model gemini-2.5-flash
enja config use work
```

### 実用例

```bash
# エラーメッセージの翻訳
npm install nonexistent-package 2>&1 | enja

# コマンドのヘルプを日本語化
docker --help | enja

# 英語で書かれたドキュメントを日本語に翻訳
enja -f README.md -o README.ja.md

# Webページの本文を翻訳（HTMLタグ除去）
curl -s https://example.com | enja -s

# APIドキュメントなどテキストコンテンツの翻訳
curl -s https://example.com/api/docs | enja
```

## コマンド

[COMMANDS.md](docs/COMMANDS.md) を参照してください．

## セキュリティとプライバシー

### デフォルトプロバイダー（GAS）使用時

- 翻訳データは保存されません（その場で処理され，すぐに結果が返ります）
- 公開エンドポイントを使用しているため，機密情報の翻訳は避けてください

### その他のプロバイダー使用時

OpenAI，Gemini，LM Studio などを使用する場合は，各サービスのプライバシーポリシーに従います．
プロバイダーによっては，入力データが保存されたり，学習に利用されることがありますので，注意してください．

## 貢献

バグ報告や機能リクエストは [GitHub Issues](https://github.com/yhotamos/enja-cli/issues) へお願いします．

## 作者

yhotta240

- Email: yhotta240@gmail.com
- GitHub: [@yhotta240](https://github.com/yhotta240)
