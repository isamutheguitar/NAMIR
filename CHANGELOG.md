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
