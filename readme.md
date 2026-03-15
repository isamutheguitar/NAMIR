<p align="center"><img src="public/images/NAMIR_readme_logo.png" width="600" alt="NAMIR Logo"></p>

# NAMIR
## Neural Amp Modeler & Impulse Response Manager

*日本語のドキュメントは画面の下方に記載されています。 (Japanese documentation is provided at the bottom of the page.)*


---

## English

**Manage your vast collection of NAM and IR files with a beautiful, intuitive interface. Build your own private sound library.**

### 🚀 Features
* **Boutique Pedal Inspired UI**: A sleek dark mode design with neon accents and card layouts.
* **Custom Dictionary**: Teach NAMIR your gear knowledge. Automatically recognize brands like Friedman, Suhr, or Hartke from file names.
* **Auto-Backup Cleanup**: Keeps your Google Drive tidy by automatically maintaining only the latest 5 backup sheets.
* **Reverse Lookup via TONE3000**: Easily organize information for downloaded NAM/IR files using TONE3000 reverse search.
* **Rating & Memo System**: Add star ratings and personal notes to your favorite tones.
* **Fully Responsive**: Optimized for PC, smartphones, and tablets. Access your library anywhere.
* **Google Sheets Integration**: Your database is a familiar spreadsheet, making backups and bulk editing a breeze.

### 🛠 How to Deploy
NAMIR is designed for complete private use. You deploy it to your own environment, ensuring your data remains private.

#### 1. Prepare the Database
1.  Copy the [Google Sheets Template](https://docs.google.com/spreadsheets/d/1c25qnGrxsQ5iDnAOwKYdZT4X6aK8keAV47cq2u7_VlQ/edit?usp=sharing) to your Google Drive and note the Spreadsheet ID from the URL.
2.  **Crucial**: Share your spreadsheet with the **Service Account email address** (generated in Step 2) with "Editor" permission.

#### 2. Setup Google Cloud API
Enable **Google Sheets API**, create a **Service Account** (generate a JSON key), and setup **OAuth 2.0 Client ID** in your Google Cloud Console.

#### 3. Deploy to Vercel
Click the "Deploy" button (coming soon) and enter the following **Environment Variables**:

| Variable | Description |
| :--- | :--- |
| `GOOGLE_SHEET_ID` | The ID of your copied Google Spreadsheet. |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | The email address of your Google Service Account. |
| `GOOGLE_PRIVATE_KEY` | The private key from your Service Account JSON file. |
| `GOOGLE_CLIENT_ID` | Your Google OAuth 2.0 Client ID. |
| `VITE_GOOGLE_CLIENT_ID` | **(Required)** Same as `GOOGLE_CLIENT_ID`. Required for the frontend login button. |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth 2.0 Client Secret. |
| `AUTHORIZED_EMAIL` | Your own Gmail address authorized to log in to this app. |
| `JWT_SECRET` | A long, random string (e.g., use `openssl rand -base64 32`). |

## Migration Guide (Upgrading to v1.1.0)

Version 1.1.0 introduces powerful new features like the Gear Filter and automatic WAV parsing. **To ensure your existing data works correctly with this update, you must make a few quick adjustments to your connected Google Spreadsheet.**

### Step 1: Create the Gear Profiles Sheet
You need a dedicated sheet to manage your target hardware devices.
1. Create a new sheet (tab) at the bottom of your spreadsheet and name it exactly: `Gear_Profiles`
2. In the first row (A1 to G1), type the following headers exactly as shown:
   * **A**: [Name](cci:1://file:///c:/Users/isamu/Desktop/Antigravity/NAMIR/client/src/components/AnalysisResultList.tsx:17:4-30:6)
   * **B**: `RequireSampleRate`
   * **C**: `MaxBitDepth`
   * **D**: `MaxLengthMs`
   * **E**: `Notes` *(Optional)*
   * **F**: `Display_Flag` *(Set to TRUE to show in UI)*
   * **G**: `Caution` *(Optional notes displayed as a tooltip)*

### Step 2: Update Your Main Library Columns
We have reorganized how file paths and WAV metadata are stored. You must add/rename the following columns in your main database sheet (`Sheet1`) starting from column O:
* **O**: `FilePath` (Stores the manual absolute path, e.g., C:\...)
* **P**: `SampleRate` (Hz)
* **Q**: `BitDepth` (bit)
* **R**: `SampleTimeMs` (Length in milliseconds)
* **S**: `SampleCount` (Total number of samples)

*Note: If you have existing file paths or data in the old R/S columns, please manually copy and paste them into their respective new columns.*

### 📄 License
Licensed under the **NAMIR Personal Use License**.
* **Personal Use Only**: Free for personal use.
* **No Redistribution**: Redistribution of source code or binaries is prohibited.
* **Disclaimer**: Provided "As-is". The author is not responsible for any damages.

### Support the Project ☕
If NAMIR helps you manage your tones better, consider buying me a coffee! Your support keeps this project alive and growing.

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Donate-orange?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/isamutheguitar)

---


## 日本語 (Japanese)

**膨大なNAMとIRを、美しく、直感的に管理する。自分だけのプライベート・サウンド・ライブラリを構築しよう。**

### 🚀 特徴 (Features)
* **高級エフェクター風の洗練されたUI**: ダークモードに映えるネオンカラーとカードデザインで、所有欲を満たすライブラリを実現。
* **カスタム辞書機能**: あなたの機材知識をNAMIRに同期。Friedman, Suhr, Hartke などのブランド名をファイル名から自動判別します。
* **バックアップ自動クリーンアップ**: 常に最新の5件のみを保持し、Googleドライブを自動的に整理整頓します。
* **ファイルの逆引き・詳細情報検索**: ダウンロード済みのNAMやIRファイルを「TONE3000」で逆引き検索。
* **独自のレーティングとメモ機能**: お気に入りのトーンに星評価を付けたり、セッティングのコツをメモしたりできます。
* **完全レスポンシブデザイン**: PC、スマホ、タブレットに対応。場所を選ばずアクセス可能。
* **Googleスプレッドシート連携**: 使い慣れたスプレッドシートをDBとして使用。データの管理も自由自在。

### 🛠 導入手順 (How to Deploy)
本ツールは「完全プライベート環境」での運用を前提としています。

#### 1. データベースの準備
1.  [Googleスプレッドシート・テンプレート](https://docs.google.com/spreadsheets/d/1c25qnGrxsQ5iDnAOwKYdZT4X6aK8keAV47cq2u7_VlQ/edit?usp=sharing)を「コピーを作成」して保存。スプレッドシートIDをメモします。
2.  **重要**: コピーしたシートの「共有」設定から、STEP 2で作成する**サービスアカウントのメールアドレス**を「編集者」として追加してください。

#### 2. Google Cloud APIの設定
Google Cloud Consoleにて、**Google Sheets API**の有効化、**サービスアカウント**の作成（JSONキー発行）、**OAuth 2.0 クライアントID**の設定を行います。

#### 3. Vercelへのデプロイ
「Deploy」ボタン（準備中）をクリックし、以下の**環境変数（Environment Variables）**を入力してデプロイします。

| 変数名 | 説明 |
| :--- | :--- |
| `GOOGLE_SHEET_ID` | STEP 1でコピーしたスプレッドシートのID。 |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | 作成したサービスアカウントのメールアドレス。 |
| `GOOGLE_PRIVATE_KEY` | サービスアカウントのJSONキーに含まれる秘密鍵（PRIVATE KEY）。 |
| `GOOGLE_CLIENT_ID` | Google CloudのOAuth 2.0 クライアントID。 |
| `VITE_GOOGLE_CLIENT_ID` | **(必須)** フロントエンドのログインボタン表示に必要です。`GOOGLE_CLIENT_ID`と同じ値を入力。 |
| `GOOGLE_CLIENT_SECRET` | Google CloudのOAuth 2.0 クライアントシークレット。 |
| `AUTHORIZED_EMAIL` | アプリへのログインを許可する自分自身のGmailアドレス。 |
| `JWT_SECRET` | セッション暗号化用の任意の長い文字列（例：ランダムな英数字）。 |

## マイグレーションガイド (v1.1.0 へのアップデート手順)

Version 1.1.0 では、機材ごとの強力なフィルター機能や、WAVファイルの自動解析機能など、大幅なアップデートが行われました。**既存のデータをこの新しいバージョンで正しく動作させるためには、連携している Google スプレッドシート側に簡単な手動設定が必要です。**

### ステップ 1: 機材プロファイル（Gear Profiles）シートの作成
お手持ちのハードウェア機材の要件を管理するための専用シートを作成します。
1. スプレッドシートの下部から「新しいシートを追加」し、シート名を半角英数字で正確に `Gear_Profiles` と変更してください。
2. そのシートの1行目（A1 から G1）に、以下のヘッダー（列名）名を入力してください（大文字小文字なども以下の通りにしてください）。
   * **A列**: [Name](cci:1://file:///c:/Users/isamu/Desktop/Antigravity/NAMIR/client/src/components/AnalysisResultList.tsx:17:4-30:6) （例：BOSS GT-1000）
   * **B列**: `RequireSampleRate` （例：96000）
   * **C列**: `MaxBitDepth` （例：32）
   * **D列**: `MaxLengthMs` （例：2048）
   * **E列**: `Notes` （※任意のメモ用列です）
   * **F列**: `Display_Flag` （UIのリストに表示させる場合は `TRUE` と入力）
   * **G列**: `Caution` （※機材固有の注意事項などがあれば入力。UI上にツールチップ表示されます）

### ステップ 2: メインライブラリ（Sheet1）の列マッピングの更新
ファイルパスや自動解析されたWAVのメタデータを格納するため、データベースの並び順が整理されました。メインのデータベース・シート（通常は `Sheet1`）の **O列以降** を、以下の並び順になるように追加または変更してください。
* **O列**: `FilePath` （クリップボードコピー用のフルパスを手動入力する欄。例: C:\...）
* **P列**: `SampleRate` （Hz）
* **Q列**: `BitDepth` （bit）
* **R列**: `SampleTimeMs` （ミリ秒単位の長さ）
* **S列**: `SampleCount` （サンプル数の合計）

*※注意点：旧バージョンをご利用中で、すでに昔のR列やS列に「ファイルパス」や「サンプル数」のデータが混在してしまっている場合は、大変お手数ですが列全体を正しく並べ直すか、該当データを新しい O列（FilePath）や S列（SampleCount）へコピー＆ペーストして手動で整理を行ってください。*


### 📄 ライセンス (License)
**NAMIR Personal Use License** に基づいて提供されます。
* **個人利用限定**: 個人の趣味、学習、研究の範囲において無償で使用できます。
* **二次配布の禁止**: 改変の有無を問わず、再配布、転載を禁止します。
* **免責事項**: 本ソフトウェアは「現状有姿」で提供されます。使用による損害について作者は一切の責任を負いません。

### プロジェクトを支援する ☕
NAMIRがお役に立てているなら、コーヒーを1杯ご馳走していただけませんか？ 皆様のご支援が、プロジェクトの継続と発展の支えになります。

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Donate-orange?style=for-the-badge&logo=buy-me-a-coffee&logoColor=white)](https://buymeacoffee.com/isamutheguitar)

---

### Author
**Isamu (Isamu The Guitar)**
* YouTube: [Isamu The Guitar](https://www.youtube.com/@isamutheguitar)