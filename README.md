# Enja CLI

英語を日本語に翻訳するシンプルなコマンドラインツール

## 特徴

- インストール後すぐ使える（セットアップ不要）
- Google Apps Script の LanguageApp を使用した軽量な翻訳
- 引数，パイプ，ファイルから翻訳可能
- HTML タグ除去機能で Web ページも翻訳可能
- API キー不要，課金なし

## インストール

```bash
npm install -g enja-cli
```

## 使い方

### 基本的な使い方

```bash
# 引数で渡された文字列を翻訳
enja "Hello, world!"

# パイプ(標準入力)で渡されたテキストを翻訳
git --help | enja
echo "Good morning" | enja

# ファイルからテキストを読み込んで翻訳
enja -f input.txt

# ファイルから読み込み，翻訳結果をファイルに保存
enja -f input.txt -o output.txt

# パイプとファイル出力の組み合わせ
cat README.md | enja -o japanese.md
```

### オプション

```
-f, --file <path>     ファイルを翻訳する
-o, --output <path>   ファイルに出力する (デフォルト: 標準出力)
-s, --strip-html      HTMLタグを除去してから翻訳する
-v, --version         バージョンを表示
-h, --help            ヘルプを表示
```

## 実用例

### エラーメッセージの翻訳

```bash
npm install nonexistent-package 2>&1 | enja
```

### Git コマンドのヘルプを日本語化

```bash
git commit --help | enja
```

### 英語のドキュメントを日本語に変換

```bash
enja -f CONTRIBUTING.md -o CONTRIBUTING.ja.md
```

### Web ページのコンテンツを翻訳

```bash
# HTMLタグを除去して翻訳
curl -s https://example.com | enja -s

# APIドキュメントなどテキストコンテンツの翻訳
curl -s https://example.com/api/docs | enja
```

## 仕組み

このツールは無料の Google Apps Script (LanguageApp) を使用して翻訳を行います．

- 共有エンドポイント: すべてのユーザーが同じ翻訳エンドポイントを使用
- プライバシー: 翻訳データは保存されません（ステートレス）
- レート制限: 1 日あたり約 5,000 リクエストまで共有

### セキュリティとプライバシー

- 翻訳データは保存されません（リクエストごとに処理し，即座にレスポンス）
- 他のユーザーの翻訳内容は見えません（完全にステートレス）
- 機密情報の翻訳は避けてください（公開エンドポイントを使用しているため）

## 制限事項

- 1 日あたりのリクエスト数: すべてのユーザーで共有で約 5,000 リクエスト
- 文字数制限: 1 リクエストあたり最大 100,000 文字
- 翻訳方向: 現在は英語 → 日本語のみ対応

制限に達した場合はエラーメッセージが表示されます．

## 今後の予定

- [ ] 日本語 → 英語の双方向翻訳対応
- [ ] 複数言語対応
- [ ] 翻訳履歴の保存機能
- [ ] カスタム翻訳エンドポイント対応

## 貢献

バグ報告や機能リクエストは [GitHub Issues](https://github.com/yhotamos/enja-cli/issues) へお願いします．

## 作者

yhotta240

- Email: yhotta240@gmail.com
- GitHub: [@yhotta240](https://github.com/yhotta240)
