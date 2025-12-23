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
- `-p, --profile <name>` - 使用するプロファイルを指定
- `--endpoint <url>` - カスタム翻訳エンドポイントを指定
- `--api-key <key>` - API キーを指定
- `--provider <name>` - 翻訳プロバイダーを指定 (gas, custom, openai, gemini)
- `--model <name>` - 翻訳モデルを指定 (openai, gemini のみ)
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

# プロファイルを使用
enja "Hello, world!" -p work

# カスタムエンドポイントを使用
enja "Hello, world!" --endpoint https://api.example.com/translate --api-key YOUR_KEY

# OpenAI API を使用して翻訳
enja "Hello, world!" --provider openai --api-key YOUR_OPENAI_API_KEY --model gpt-4o

# Gemini API を使用して翻訳
enja "Hello, world!" --provider gemini --api-key YOUR_GEMINI_API_KEY --model gemini-1.5-flash
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

設定とプロファイルを管理する

### プロファイル機能

プロファイルを使用すると，複数の設定を切り替えて使用できます．例えば，仕事用とプライベート用で異なる API キーやプロバイダーを使い分けることができます．

- `default` プロファイルは常に存在し，削除できません
- アクティブなプロファイルの設定が自動的に使用されます
- `enja` コマンドで `-p, --profile` オプションを使用して一時的に別のプロファイルを使用できます

### 使い方

```bash
enja config [profile|subcommand] [subcommandArg] [options]
```

### Arguments

First argument:

- `profile|subcommand` - プロファイル名またはサブコマンド (`ls`, `list`, `use`, `rm`, `delete`, `add`)
  - プロファイル名を指定した場合: 詳細表示または設定変更
  - サブコマンドを指定した場合: プロファイル管理操作

Second argument (subcommand only):

- `subcommandArg` - サブコマンド (`use`, `rm`, `delete`, `add`)で必要なプロファイル名

### Profile Argument

- `<profile>` - 指定したプロファイルの詳細を表示
- `<profile> [options]` - 指定したプロファイルの設定を変更

### Subcommands

- `ls`, `list` - 全プロファイルを一覧表示
- `use <profile>` - アクティブプロファイルを変更
- `rm <profile>`, `delete <profile>` - プロファイルを削除
- `add <profile> [options]` - 新しいプロファイルを作成

### Options

`--provider`, `--endpoint`, `--api-key`, `--model` はプロファイル名または `add` と一緒に使用します．  
`--unset`, `--reset` はプロファイル名と一緒に使用します．

- `--provider <name>` - プロファイルのプロバイダーを設定 (gas, custom, openai, gemini)
- `--endpoint <url>` - プロファイルのエンドポイントを設定
- `--api-key <key>` - プロファイルの API キーを設定
- `--model <name>` - プロファイルのモデルを設定
- `--unset <key>` - プロファイルの指定した設定をリセット
- `--reset` - プロファイル全体をリセット
- `-h, --help` - ヘルプを表示

オプションの使用方法:

- `enja config add <profile> [options]` - プロファイル作成時に初期設定
- `enja config <profile> [options]` - 既存プロファイルの設定を変更

### Named Providers

- `gas` - Google Apps Script の LanguageApp を使用した翻訳（デフォルト）
- `custom` - カスタム翻訳エンドポイントを使用
- `openai` - OpenAI API を使用した翻訳
- `gemini` - Gemini API を使用した翻訳

### Examples

```bash
# 現在のプロファイルを表示
enja config

# 全プロファイルを一覧表示
enja config ls
enja config list

# 指定したプロファイルの詳細を表示
enja config work-profile

# 新しいプロファイルを作成（デフォルトで gas プロバイダー）
enja config add work-profile

# OpenAI を使用するプロファイルを作成
enja config add personal-profile --provider openai --api-key YOUR_KEY --model gpt-4o

# Gemini を使用するプロファイルを作成
enja config add gemini-profile --provider gemini --api-key YOUR_KEY --model gemini-1.5-flash

# カスタムエンドポイントを使用するプロファイルを作成
enja config add custom-profile --provider custom --endpoint https://api.example.com/translate --api-key YOUR_KEY

# アクティブプロファイルを変更
enja config use work-profile

# プロファイルを削除
enja config rm work-profile

# プロファイルの provider を変更
enja config work-profile --provider openai

# プロファイルの model を変更
enja config work-profile --model gpt-4o-mini

# プロファイルの API キーを変更
enja config work-profile --api-key NEW_KEY

# プロファイルの API キーをリセット
enja config work-profile --unset api-key

# プロファイル全体をリセット
enja config work-profile --reset

# 複数の設定を同時に変更
enja config work-profile --provider openai --api-key NEW_KEY --model gpt-4o
```

### 設定ファイルの場所

- **Windows**: `%APPDATA%\enja-cli\config.json`
- **Linux/Mac**: `~/.config/enja-cli/config.json`

### 設定の優先順位

CLI オプション > プロファイル設定 > デフォルト値
