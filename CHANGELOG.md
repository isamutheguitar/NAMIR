## [1.1.0] - 2026-03-15
### ✨ New Features
* **Expanded Library View**: Separated the library into two distinct tabs ("NAM" and "IR") while retaining shared search, sorting, and spreadsheet synchronization capabilities.
* **Automatic WAV Metadata Extraction**: Dragging and dropping IR (.wav) files now automatically parses the WAV header to extract `Sample Rate (Hz)`, `Bit Depth (bit)`, and `Length (ms)` on the client side, logging the metadata directly to the database.
* **Gear Filter System (IR Library)**: Introduced a dynamic gear filtering pop-up.
  * **Spreadsheet Sync**: Pulls device specifications directly from the `Gear_Profiles` spreadsheet tab.
  * **Display Flagging**: Respects the `Display_Flag` column—only devices marked as `TRUE` will appear in the UI list.
  * **Caution Tooltips**: Reads the `Caution` column to display inline setup notes or specific limits on hover.
  * **Add Gear**: Users can now register new gear parameters (including Caution notes) directly from the UI to the database.
* **Length Limit Visual Warning**: When an IR file exceeds the maximum allowed length of the currently selected gear, it is no longer hidden. Instead, a targeted "Length Limit Warning (⚠️)" badge and warning text will appear inside the card to alert the user.

### 🔧 Changes/Improvements
* **Total UI English Localization**: All user-facing UI elements, labels, buttons, and system alerts have been translated from Japanese to English for a more uniform design and global usability.
* **Cloud Architecture Compliance**: Fully removed the local OS file explorer execution endpoint (`/open-explorer`) and direct file drop paths to adhere to strict browser security constraints. The application now uses manual copy-paste text fields for persistent file-path tracking. 
* **Dynamic Spreadsheet Column Mapping**: API endpoints reading/writing to `Gear_Profiles` now dynamically discover column positions. This safely prevents the backend from accidentally wiping out manual columns added arbitrarily by users.
* **Database Schema Update**: Reorganized the main library spreadsheet columns to distinctly separate `FilePath`, `SampleRate`, `BitDepth`, `SampleTimeMs`, and `SampleCount`.
* **Filter Persistence**: Gear filter selections are now safely stored and persist across app reloads.
* **UI Layout Tweaks**: Fixed a global alignment inheritance bug so that gear lists in the modal pop-up display text cleanly aligned to the left.

## [1.1.0] - 2026-03-15
### ✨ 新機能 (New Features)
* **ライブラリ画面の分離統合**: 「NAM」と「IR」の2タブ構成に再設計しました。検索やソート、スプレッドシート連携などの共通機能はそのままに、各フォーマットにより最適化されたUIを提供します。
* **WAVメタデータの自動解析**: IR (.wav) ファイルをドラッグ＆ドロップした際、自動的にWAVヘッダを解析します。「サンプルレート(Hz)」「ビット深度(bit)」「長さ(ms)」をブラウザ上で取得し、データベースへ直接記録します。
* **強力なIR機材フィルター (Gear Filter)**: 
  * **スプレッドシート連動**: `Gear_Profiles` シートから機材（ハードウェア）の要求スペックを読み込んで一覧表示します。
  * **表示フラグ制御**: `Display_Flag` 列が `TRUE` になっている機材のみがポップアップにリストアップされます。
  * **注意事項 (Caution) ツールチップ**: `Caution` 列を自動検知し、機材ごとの設定上の注意や制限をホバー時にインラインで表示します。
  * **機材の登録**: ユーザーが独自の機材やパラメーター、注意事項（Caution）をUI上から直接データベースへ簡単に追加できるようになりました。
* **長さ上限オーバー時の視覚的警告**: 選択中の機材の「上限Length」をIRファイルが超過していても非表示にはせず、かわりに「Length Limit Warning (⚠️)」の警告バッジとテキストを表示して、実機転送時に後部がカットされるリスクを明示します。

### 🔧 変更・改善点 (Changes & Improvements)
* **UIの完全英語化**: グローバルでの使用を想定し、ユーザーが見る画面上のすべてのテキスト、ラベル、ボタン、アラートメッセージを英語に統一してデザインを洗練させました。
* **クラウド対応・ブラウザセキュリティの厳守**: クラウド（Vercel）やブラウザのセキュリティ上の制約に従い、ローカルのOSエクスプローラーを直接起動する機能（`/open-explorer`）を完全に撤廃しました。代替として、クリップボード経由で手動管理できる専用のパス表示・コピペボタンを設置しています。
* **動的スプレッドシート連携**: `Gear_Profiles` やメインシートの読み書き時、APIが列（カラム）を名前で動的に探索するようになりました。これにより、ユーザーがメモ用の独自列を追加してもデータが上書き破損する事故を防止しています。
* **データベース・スキーマの刷新**: 主要なライブラリシートの構成を見直し、`FilePath`, `SampleRate`, `BitDepth`, `SampleTimeMs`, `SampleCount` を明確に分離して整理しました。
* **フィルター状態の永続化**: 選択したフィルタ対象の機材設定がローカルに保存され、アプリの再読み込み後も状態が維持されるようになりました。
* **UIレイアウトの微調整**: モーダル内の機材リストがグローバルの「中央揃え」に影響されてレイアウトが崩れる不具合を修正し、綺麗に左揃えで表示されるようにしました。

