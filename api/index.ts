import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { analyzeFile } from './utils/analysis.js';
import { exec } from 'child_process';
import path from 'path';

dotenv.config();

const app = express();

// --- Middleware ---
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
    console.log(`[Tracer] ${req.method} ${req.url}`);
    next();
});

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const AUTHORIZED_EMAIL = (process.env.AUTHORIZED_EMAIL || '').trim();
const client = new OAuth2Client(CLIENT_ID);

// --- Auth Middleware ---
const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ error: 'Forbidden' });
        req.user = user;
        next();
    });
};

// Google Sheets Setup
const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

// --- Router Setup ---
const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));

// 1. Google Auth
router.post('/auth/google', async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) return res.status(400).json({ error: 'Invalid token' });

        const receivedEmail = payload.email.trim().toLowerCase();
        const authorizedEmail = AUTHORIZED_EMAIL.trim().toLowerCase();

        if (receivedEmail !== authorizedEmail) return res.status(403).json({ error: 'Access denied' });

        const token = jwt.sign(
            { email: payload.email, name: payload.name },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.json({ token, user: { email: payload.email, name: payload.name } });
    } catch (error: any) { res.status(401).json({ error: `Auth failed: ${error.message}` }); }
});

// 2. Get Library
// スプレッドシート列マッピング:
// A=date, B=originalName, C=suggestedName, D=amp, E=model, F=cabinet,
// G=author, H=tone, I=type, J=sourceUrl, K=captureInfo, L=userMemo,
// M=mic, N=rate, O=sampleRate, P=bitDepth, Q=lengthMs, R=lengthSamples, S=filePath
router.get('/get-library', authenticateToken, async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId!,
            range: 'Sheet1!A3:S',
        });
        const rows = response.data.values || [];
        const items = rows.map(row => ({
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
            rate: Number(row[13]) || 0,
            filePath: row[14] || '',
            sampleRate: row[15] ? Number(row[15]) : undefined,
            bitDepth: row[16] ? Number(row[16]) : undefined,
            lengthMs: row[17] ? Number(row[17]) : undefined,
            lengthSamples: row[18] ? Number(row[18]) : undefined,
        }));
        res.json({ items });
    } catch (error) { res.status(500).json({ error: 'Fetch failed' }); }
});

// 3. Analyze
router.post('/analyze', authenticateToken, async (req, res) => {
    try {
        const { files } = req.body;
        if (!files || !Array.isArray(files)) return res.status(400).json({ error: 'Invalid payload' });

        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        let existingRecordsMap = new Map();

        let customDict: any[] = [];

        if (spreadsheetId) {
            try {
                // Fetch existing records for pre-fill
                const existingData = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: 'Sheet1!B:S',
                });
                const rows = existingData.data.values || [];
                rows.forEach(row => {
                    if (row[0]) existingRecordsMap.set(row[0], {
                        amp: row[2] || '',
                        cab: row[4] || '',
                        type: row[7] || '',
                        sourceUrl: row[8] || '',
                        captureInfo: row[9] || '',
                        userMemo: row[10] || '',
                        mic: row[11] || '',
                        rate: row[12] || 0,
                        filePath: row[13] || '',
                        sampleRate: row[14] ? Number(row[14]) : undefined,
                        bitDepth: row[15] ? Number(row[15]) : undefined,
                        lengthMs: row[16] ? Number(row[16]) : undefined,
                        lengthSamples: row[17] ? Number(row[17]) : undefined,
                    });
                });

                // Fetch dictionary
                const dictMeta = await sheets.spreadsheets.get({ spreadsheetId });
                const hasDict = dictMeta.data.sheets?.some(s => s.properties?.title === 'Dictionary');
                if (hasDict) {
                    const dictData = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Dictionary!A2:C' });
                    customDict = (dictData.data.values || []).map(r => ({
                        category: r[0] || '',
                        keyword: r[1] || '',
                        name: r[2] || ''
                    }));
                }
            } catch (e) { console.warn('Pre-fill or dict fetch failed', e); }
        }

        const results = files.map((file: any) => {
            const result = analyzeFile(file.filename, file.content, 'NA', customDict);
            const existing = existingRecordsMap.get(file.filename);
            if (existing) {
                result.sourceUrl = existing.sourceUrl;
                result.captureInfo = existing.captureInfo;
                result.userMemo = existing.userMemo;
                result.rate = Number(existing.rate) || 0;
            }

            // WAVメタデータを解析結果に付加
            if (file.wavMeta && result.type === 'ir') {
                const { sampleRate, bitDepth, totalSamples } = file.wavMeta;
                (result as any).sampleRate = sampleRate || (existing?.sampleRate);
                (result as any).bitDepth = bitDepth || (existing?.bitDepth);
                if (sampleRate && totalSamples) {
                    (result as any).lengthMs = Math.round((totalSamples / sampleRate) * 1000);
                    (result as any).lengthSamples = totalSamples;
                } else {
                    (result as any).lengthMs = existing?.lengthMs;
                    (result as any).lengthSamples = existing?.lengthSamples;
                }
            }
            return result;
        });
        res.json({ results });
    } catch (error) { res.status(500).json({ error: 'Analysis failed' }); }
});

// 4. Save to Sheet
router.post('/save-to-sheet', authenticateToken, async (req, res) => {
    try {
        const { results } = req.body;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (!spreadsheetId) return res.status(500).json({ error: 'Sheet ID missing' });

        const currentData = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Sheet1!B:B' });
        const currentNames = (currentData.data.values || []).map(row => row[0]);

        const dataToUpdate: any[] = [];
        const dataToAppend: any[] = [];

        for (const item of results) {
            const date = item.date || new Date().toISOString().split('T')[0];
            const originalName = item.originalName;
            if (!originalName) continue;

            const row = [
                date, originalName, item.suggestedName || item.editedName || '',
                item.amp || '', item.model || '', item.cabinet || '',
                item.author || '', item.tone || '', (item.type || 'UNKNOWN').toUpperCase(),
                item.sourceUrl || '', item.captureInfo || '', item.userMemo || '',
                item.mic || '', item.rate || 0,
                // ファイルパス (列O)
                item.filePath || '',
                // WAVメタデータ (列P〜S)
                item.sampleRate || '',
                item.bitDepth || '',
                item.lengthMs || '',
                item.lengthSamples || '',
            ];

            const rowIndex = currentNames.indexOf(originalName);
            if (rowIndex !== -1) {
                dataToUpdate.push({ range: `Sheet1!A${rowIndex + 1}:S${rowIndex + 1}`, values: [row] });
            } else { dataToAppend.push(row); }
        }

        if (dataToUpdate.length > 0) {
            await sheets.spreadsheets.values.batchUpdate({
                spreadsheetId,
                requestBody: { valueInputOption: 'USER_ENTERED', data: dataToUpdate }
            });
        }
        if (dataToAppend.length > 0) {
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Sheet1!A:S',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: dataToAppend }
            });
        }
        res.json({ success: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// 5. Get Backups List
router.get('/backups', authenticateToken, async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId! });
        const sheetsList = meta.data.sheets || [];
        const backupSheets = sheetsList
            .map(s => s.properties?.title || '')
            .filter(title => title.startsWith('Backup_'))
            .sort((a, b) => b.localeCompare(a))
            .slice(0, 5);
        res.json({ backups: backupSheets });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// 6. Backup
router.post('/backup', authenticateToken, async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const response = await sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId!, range: 'Sheet1!A3:S' });
        const rows = response.data.values || [];
        const now = new Date();
        const jst = new Date(now.getTime() + (9 * 60 * 60 * 1000));
        const ts = jst.toISOString().replace(/T/, '_').replace(/[-:]/g, '').split('.')[0].slice(0, 13);
        const newSheetName = `Backup_${ts}`;

        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: spreadsheetId!,
            requestBody: { requests: [{ addSheet: { properties: { title: newSheetName } } }] }
        });

        if (rows.length > 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId!,
                range: `${newSheetName}!A1`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: rows }
            });
        }

        // --- Auto Cleanup Old Backups ---
        try {
            const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId! });
            const sheetsList = meta.data.sheets || [];

            const backupSheets = sheetsList
                .map(s => ({ id: s.properties?.sheetId, title: s.properties?.title || '' }))
                .filter(s => s.title.toLowerCase().startsWith('backup_'))
                .sort((a, b) => b.title.localeCompare(a.title));

            if (backupSheets.length > 5) {
                const sheetsToDelete = backupSheets.slice(5);
                const deleteRequests = sheetsToDelete.map(s => ({
                    deleteSheet: { sheetId: s.id }
                }));

                if (deleteRequests.length > 0) {
                    await sheets.spreadsheets.batchUpdate({
                        spreadsheetId: spreadsheetId!,
                        requestBody: { requests: deleteRequests }
                    });
                }
            }
        } catch (cleanupError) {
            console.error('Backup cleanup failed, but main backup succeeded:', cleanupError);
        }

        res.json({ success: true, message: newSheetName });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// 7. Restore
router.post('/restore', authenticateToken, async (req, res) => {
    try {
        let { sheetName } = req.body;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        if (sheetName === 'latest') {
            const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId! });
            const backupSheets = (meta.data.sheets || [])
                .map(s => s.properties?.title || '')
                .filter(title => title.startsWith('Backup_'))
                .sort((a, b) => b.localeCompare(a));
            if (backupSheets.length === 0) throw new Error('No backups found.');
            sheetName = backupSheets[0];
        }
        if (!sheetName) throw new Error('Sheet name is missing.');

        const response = await sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId!, range: `${sheetName}!A1:S` });
        const rows = response.data.values || [];

        await sheets.spreadsheets.values.clear({ spreadsheetId: spreadsheetId!, range: 'Sheet1!A3:S' });

        if (rows.length > 0) {
            await sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId!,
                range: 'Sheet1!A3',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: rows }
            });
        }
        res.json({ success: true, message: `Restored from ${sheetName}` });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// 8. Get Dictionary
router.get('/dictionary', authenticateToken, async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId! });
        const hasDict = meta.data.sheets?.some(s => s.properties?.title === 'Dictionary');
        if (!hasDict) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: spreadsheetId!,
                requestBody: { requests: [{ addSheet: { properties: { title: 'Dictionary' } } }] }
            });
            await sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId!,
                range: 'Dictionary!A1:C1',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [['Category', 'Keyword', 'Name']] }
            });
            return res.json({ items: [] });
        }

        const response = await sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId!, range: 'Dictionary!A2:C' });
        const rows = response.data.values || [];
        const items = rows.map((row, i) => ({
            id: i.toString(),
            category: row[0] || '',
            keyword: row[1] || '',
            name: row[2] || ''
        })).filter(item => item.category && item.keyword && item.name);

        res.json({ items });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// 9. Save Dictionary
router.post('/dictionary', authenticateToken, async (req, res) => {
    try {
        const { items } = req.body;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId! });
        const hasDict = meta.data.sheets?.some(s => s.properties?.title === 'Dictionary');
        if (!hasDict) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: spreadsheetId!,
                requestBody: { requests: [{ addSheet: { properties: { title: 'Dictionary' } } }] }
            });
        }

        await sheets.spreadsheets.values.clear({ spreadsheetId: spreadsheetId!, range: 'Dictionary!A:C' });

        const rows = [['Category', 'Keyword', 'Name']];
        (items || []).forEach((item: any) => {
            rows.push([item.category, item.keyword, item.name]);
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId!,
            range: 'Dictionary!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: rows }
        });

        res.json({ success: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// 10. Get Gear Profiles
router.get('/gear-dictionary', authenticateToken, async (req, res) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId! });
        const hasGearDict = meta.data.sheets?.some(s => s.properties?.title === 'Gear_Profiles');

        if (!hasGearDict) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: spreadsheetId!,
                requestBody: { requests: [{ addSheet: { properties: { title: 'Gear_Profiles' } } }] }
            });
            await sheets.spreadsheets.values.update({
                spreadsheetId: spreadsheetId!,
                range: 'Gear_Profiles!A1:E1',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: [['Name', 'RequireSampleRate', 'MaxBitDepth', 'MaxLengthMs', 'Display_Flag']] }
            });
            return res.json({ items: [] });
        }

        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId!,
            range: 'Gear_Profiles!A1:Z'
        });
        const rows = response.data.values || [];
        if (rows.length === 0) return res.json({ items: [] });

        const headers = rows[0].map((h: any) => String(h).toUpperCase().trim());
        const displayIdx = headers.indexOf('DISPLAY_FLAG');
        const cautionIdx = headers.indexOf('CAUTION');

        const items = rows.slice(1).map((row, i) => {
            const isFalse = displayIdx !== -1 && row[displayIdx] ? String(row[displayIdx]).toUpperCase().trim() === 'FALSE' : false;
            return {
                id: i.toString(),
                name: row[0] || '',
                requireSampleRate: Number(row[1]) || 0,
                maxBitDepth: Number(row[2]) || 0,
                maxLengthMs: Number(row[3]) || 0,
                displayFlag: !isFalse,
                caution: cautionIdx !== -1 && row[cautionIdx] ? String(row[cautionIdx]) : '',
            };
        }).filter(item => item.name);

        res.json({ items });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});

// 11. Save Gear Profiles
router.post('/gear-dictionary', authenticateToken, async (req, res) => {
    try {
        const { items } = req.body;
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;

        const meta = await sheets.spreadsheets.get({ spreadsheetId: spreadsheetId! });
        const hasGearDict = meta.data.sheets?.some(s => s.properties?.title === 'Gear_Profiles');
        if (!hasGearDict) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: spreadsheetId!,
                requestBody: { requests: [{ addSheet: { properties: { title: 'Gear_Profiles' } } }] }
            });
        }

        const existingData = await sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId!, range: 'Gear_Profiles!A1:Z' });
        const existingRows = existingData.data.values || [['Name', 'RequireSampleRate', 'MaxBitDepth', 'MaxLengthMs', 'Remarks', 'Display_Flag']];
        const headers = existingRows[0];
        const displayIdx = headers.findIndex(h => String(h).toUpperCase().trim() === 'DISPLAY_FLAG');
        const dispCol = displayIdx >= 0 ? displayIdx : headers.length;
        if (displayIdx < 0) headers[dispCol] = 'Display_Flag';

        const cautionIdx = headers.findIndex(h => String(h).toUpperCase().trim() === 'CAUTION');
        const cautCol = cautionIdx >= 0 ? cautionIdx : headers.length;
        if (cautionIdx < 0) headers[cautCol] = 'Caution';

        await sheets.spreadsheets.values.clear({ spreadsheetId: spreadsheetId!, range: 'Gear_Profiles!A:Z' });

        const rows: any[][] = [headers];
        (items || []).forEach((item: any) => {
            const matchRow = existingRows.slice(1).find(r => r[0] === item.name);
            const r = matchRow ? [...matchRow] : [item.name, item.requireSampleRate, item.maxBitDepth, item.maxLengthMs];
            while (r.length <= Math.max(dispCol, cautCol)) r.push('');
            r[0] = item.name;
            r[1] = item.requireSampleRate;
            r[2] = item.maxBitDepth;
            r[3] = item.maxLengthMs;
            r[dispCol] = item.displayFlag !== false ? 'TRUE' : 'FALSE';
            r[cautCol] = item.caution || '';
            rows.push(r);
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId: spreadsheetId!,
            range: 'Gear_Profiles!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: rows }
        });

        res.json({ success: true });
    } catch (error: any) { res.status(500).json({ error: error.message }); }
});



app.use('/api', router);
app.use('/', router);

export default app;