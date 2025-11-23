# Enja CLI コマンドリファレンス

## `enja` コマンド

### 使い方

```bash
enja [text] [options]
```

### Arguments

- `text` - テキストを翻訳する

### Options

- `-f, --file <path>` - ファイルを翻訳する
- `-o, --output <path>` - ファイルに出力する (デフォルト: 標準出力)
- `-s, --strip-html` - HTML タグを除去してから翻訳する
- `-N, --no-cache` - キャッシュを使用せずに再翻訳する
- `-F, --flip` - 翻訳方向を逆にする (デフォルト: 英語 → 日本語)
- `--endpoint <url>` - カスタム翻訳エンドポイントを指定
- `--api-key <key>` - API キーを指定
- `--provider <name>` - 翻訳プロバイダーを指定 (gas, custom)
- `-h, --help` - ヘルプを表示

### Examples

```bash
# 引数で渡された文字列を翻訳
enja "Hello, world!"

# パイプで渡されたテキストを翻訳
git --help | enja

# ファイルから読み込んで翻訳
enja -f input.txt

# 翻訳結果をファイルに保存
enja -f input.txt -o output.txt

# HTMLタグを除去して翻訳
curl -s https://example.com | enja -s

# キャッシュを使用せずに再翻訳
enja "Hello, world!" -N

# 日本語→英語に翻訳
enja "こんにちは" -F

# カスタムエンドポイントを使用
enja "Hello" --endpoint https://api.example.com/translate --api-key YOUR_KEY
```

## `enja history` コマンド

翻訳履歴を表示する

### 使い方

```bash
enja history [options]
```

### Arguments

- `id` - ID で履歴を表示する（完全 ID または短縮 ID）

### Options

- `-d, --detail` - 詳細表示
- `-n, --number <number>` - 表示件数 (デフォルト: 10)
- `--delete <id>` - 特定の履歴を削除する
- `--clear` - 履歴をクリア
- `-h, --help` - ヘルプを表示

### Examples

```bash
# 最新10件の履歴を表示
enja history

# 特定のIDの履歴を表示
enja history <ID>

# 詳細表示
enja history -d

# 最新20件を表示
enja history -n 20

# 特定のIDの履歴を削除
enja history --delete <ID>

# 履歴をすべて削除
enja history --clear
```

### 履歴ファイルの場所

- **Windows**: `%APPDATA%\enja-cli\history.json`
- **Linux/Mac**: `~/.config/enja-cli/history.json`

## `enja config` コマンド

設定を管理する

### 使い方

```bash
enja config [key] [value] [options]
```

### Arguments

- `key` - 設定キー (endpoint, api-key, provider)
- `value` - 設定値

### Options

- `-l, --list` - 設定を一覧表示
- `--unset` - 設定を削除（デフォルトに戻す）
- `--reset` - すべての設定をリセット
- `-h, --help` - ヘルプを表示

### Examples

```bash
# すべての設定を表示
enja config

# endpoint の値を表示
enja config endpoint

# endpoint を設定
enja config endpoint https://api.example.com/translate

# API キーを設定
enja config api-key YOUR_API_KEY

# プロバイダーを設定
enja config provider gas

# API キーを削除
enja config --unset api-key

# すべての設定をリセット
enja config --reset
```

### 設定ファイルの場所

- **Windows**: `%APPDATA%\enja-cli\config.json`
- **Linux/Mac**: `~/.config/enja-cli/config.json`

### 設定の優先順位

CLI オプション > 設定ファイル > デフォルト値
