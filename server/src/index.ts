import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { analyzeFile } from './utils/analysis.js';
import { google } from 'googleapis';
import type { AnalysisResult, NamMetadata, IrMetadata } from '../../shared/types.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup Google Auth
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
    ],
});

const sheets = google.sheets({ version: 'v4', auth });

app.post('/api/analyze', async (req, res) => {
    try {
        const files = req.body.files;
        if (!files || !Array.isArray(files)) {
            res.status(400).json({ error: 'Invalid payload' });
            return;
        }

        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        let existingRecordsMap: Map<string, any> = new Map();

        if (spreadsheetId) {
            try {
                // Fetch B:N to get Original Name and extra info columns (D: Amp, F: Cab, I: Type, M: Mic, N: Rate)
                const existingData = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: 'Sheet1!B:N',
                });
                const rows = existingData.data.values || [];
                rows.forEach(row => {
                    const originalName = row[0];
                    if (originalName) {
                        existingRecordsMap.set(originalName, {
                            amp: row[2] || '',      // Column D is index 2
                            cab: row[4] || '',      // Column F is index 4
                            type: row[7] || '',     // Column I is index 7
                            sourceUrl: row[8] || '', // Column J is index 8
                            captureInfo: row[9] || '', // Column K is index 9
                            userMemo: row[10] || '',   // Column L is index 10
                            mic: row[11] || '',        // Column M is index 11
                            rate: row[12] || 0         // Column N is index 12
                        });
                    }
                });
            } catch (sheetError) {
                console.warn('Could not fetch existing records for pre-fill:', sheetError);
            }
        }

        const results = files.map(file => {
            const result = analyzeFile(file.filename, file.content, 'NA');
            const existing = existingRecordsMap.get(file.filename);
            if (existing) {
                // 既存レコードがある場合は、スプレッドシートの内容を最優先（マスターデータ化）
                result.sourceUrl = existing.sourceUrl;
                result.captureInfo = existing.captureInfo;
                result.userMemo = existing.userMemo;
                result.rate = Number(existing.rate) || 0;

                if (result.type === 'nam') {
                    const meta = result.metadata as NamMetadata;
                    if (existing.amp) meta.gear_make = existing.amp;
                    if (existing.cab) meta.cabinet = existing.cab;
                    if (existing.type) meta.capture_type = existing.type as any;
                    if (existing.mic) meta.mic = existing.mic;
                } else if (result.type === 'ir') {
                    const meta = result.metadata as IrMetadata;
                    if (existing.cab) meta.speaker = existing.cab;
                    if (existing.mic) meta.mic_model = existing.mic;
                }
            }
            return result;
        });

        res.json({ results });
    } catch (error) {
        console.error('Error analyzing files:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/save-to-sheet', async (req, res) => {
    try {
        const results: any[] = req.body.results;
        if (!results || !Array.isArray(results)) {
            res.status(400).json({ error: 'Invalid payload: "results" array is required' });
            return;
        }

        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (!spreadsheetId) {
            res.status(500).json({ error: 'Google Sheet ID is not configured' });
            return;
        }

        // 1. Fetch current Original Names (Column B) to find row indices
        const currentData = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!B:B',
        });
        const currentNames = (currentData.data.values || []).map(row => row[0]);

        // 2. Prepare data for Updates and Appends
        const dataToUpdate: any[] = [];
        const dataToAppend: any[] = [];

        for (const item of results) {
            const date = item.date || new Date().toISOString().split('T')[0];
            const originalName = item.originalName;

            if (!originalName) {
                console.error('Missing originalName for item:', item);
                continue; // Skip items without a search key
            }

            const suggestedName = item.editedName || item.suggestedName || '';

            // Default to flat properties (from LibraryItem)
            let amp = item.amp || '';
            let model = item.model || '';
            let cab = item.cabinet || '';
            let author = item.author || '';
            let tone = item.tone || '';
            let type = (item.type || 'UNKNOWN').toUpperCase();
            let mic = item.mic || '';

            // Override with metadata if present (from AnalysisResult)
            if (item.metadata) {
                if (item.type === 'nam') {
                    const meta = item.metadata as NamMetadata;
                    amp = meta.gear_make || amp;
                    model = meta.gear_model || model;
                    author = meta.author || author;
                    tone = meta.tone_type || tone;
                    type = (meta.capture_type || type).toUpperCase();
                    cab = meta.cabinet || cab;
                    mic = meta.mic || mic;
                } else if (item.type === 'ir') {
                    const meta = item.metadata as IrMetadata;
                    cab = meta.speaker || cab;
                    mic = meta.mic_model || mic;
                }
            }

            // URL: Priority to user provided sourceUrl
            let sourceUrl = item.sourceUrl || '';
            if (!sourceUrl) {
                const cleanName = originalName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, ' ');
                sourceUrl = `https://www.tone3000.com/search?q=${encodeURIComponent(cleanName)}`;
            }

            const captureInfo = item.captureInfo || '';
            const userMemo = item.userMemo || '';
            const rate = item.rate || 0;

            // Accurate Column Mapping (A to N)
            const row = [date, originalName, suggestedName, amp, model, cab, author, tone, type, sourceUrl, captureInfo, userMemo, mic, rate];

            const rowIndex = currentNames.indexOf(originalName);
            if (rowIndex !== -1) {
                // Update specific row (rowIndex is 0-based, row number is rowIndex + 1)
                dataToUpdate.push({
                    range: `Sheet1!A${rowIndex + 1}:N${rowIndex + 1}`,
                    values: [row]
                });
            } else {
                // Append as new row
                dataToAppend.push(row);
            }
        }

        // 3. Execute Updates
        if (dataToUpdate.length > 0) {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                requestBody: {
                    valueInputOption: 'USER_ENTERED',
                    data: dataToUpdate
                }
            });
        }

        // 4. Execute Appends
        if (dataToAppend.length > 0) {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Sheet1!A:N',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: dataToAppend
                }
            });
        }

        res.json({
            success: true,
            message: `Processed ${results.length} items. Updated: ${dataToUpdate.length}, Appended: ${dataToAppend.length}`
        });
    } catch (error: any) {
        console.error('Error saving to Google Sheets:', error);
        res.status(500).json({ error: error.message || 'Internal server error while saving to sheets' });
    }
});


app.get('/api/get-library', async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (!spreadsheetId) {
            res.status(500).json({ error: 'Google Sheet ID is not configured' });
            return;
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A3:N', // Range up to Rate (Column N)
        });

        const rows = response.data.values || [];
        const items = rows.map(row => {
            if (!row) return null;
            return {
                date: row[0] || '',
                originalName: row[1] || '',
                suggestedName: row[2] || '',
                amp: row[3] || '',
                model: row[4] || '',
                cabinet: row[5] || '',
                author: row[6] || '',
                tone: row[7] || '',
                type: row[8] || '',
                sourceUrl: row[9] || '',
                captureInfo: row[10] || '',
                userMemo: row[11] || '',
                mic: row[12] || '',
                rate: Number(row[13]) || 0 // Column N is index 13
            };
        }).filter(item => item !== null);

        res.json({ items });
    } catch (error) {
        console.error('Error fetching library:', error);
        res.status(500).json({ error: 'Internal server error while fetching library' });
    }
});

app.post('/api/backup', async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (!spreadsheetId) {
            res.status(500).json({ error: 'Google Sheet ID is not configured' });
            return;
        }

        // 1. Get current data from spreadsheet (A3:N)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A3:N',
        });
        const rows = response.data.values || [];

        // 2. Create timestamped sheet name
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') + '_' +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0');
        const sheetName = `Backup_${timestamp}`;

        // 3. Add a new sheet
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [
                    {
                        addSheet: {
                            properties: {
                                title: sheetName,
                            }
                        }
                    }
                ]
            }
        });

        // 4. Write data as JSON string to A1 of the new sheet
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${sheetName}!A1`,
            valueInputOption: 'RAW',
            requestBody: {
                values: [[JSON.stringify(rows)]]
            }
        });

        res.json({
            success: true,
            message: `Backup created in sheet: ${sheetName}`,
            sheetName
        });
    } catch (error: any) {
        console.error('Error during backup:', error);
        res.status(500).json({ error: error?.message || 'Backup failed' });
    }
});

app.post('/api/restore', async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (!spreadsheetId) {
            res.status(500).json({ error: 'Google Sheet ID is not configured' });
            return;
        }

        // 1. List all sheets and find the latest backup
        const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
        const backupSheets = (spreadsheet.data.sheets || [])
            .map(s => s.properties?.title || '')
            .filter(title => title.startsWith('Backup_'))
            .sort((a, b) => b.localeCompare(a)); // Sort descending to get latest

        if (backupSheets.length === 0) {
            res.status(404).json({ error: 'No backup sheets found' });
            return;
        }

        const latestBackupSheet = backupSheets[0];

        // 2. Read the JSON from A1 of that sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `${latestBackupSheet}!A1`,
        });

        const jsonString = response.data.values?.[0]?.[0];
        if (!jsonString) {
            res.status(404).json({ error: 'Backup data is empty or missing' });
            return;
        }

        const rows = JSON.parse(jsonString);
        if (!Array.isArray(rows)) {
            res.status(400).json({ error: 'Invalid backup format' });
            return;
        }

        // 3. Clear Sheet1!A3:N
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: 'Sheet1!A3:N',
        });

        // 4. Restore rows to Sheet1
        if (rows.length > 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Sheet1!A3',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: rows,
                },
            });
        }

        res.json({
            success: true,
            message: `Restore complete using backup sheet: ${latestBackupSheet}`,
            rowsRestored: rows.length,
        });
    } catch (error: any) {
        console.error('Error during restore:', error);
        res.status(500).json({ error: error?.message || 'Restore failed' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'NAMIR Server is running' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
