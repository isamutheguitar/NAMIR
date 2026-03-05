import type { NamMetadata } from '../../shared/types.js';

/**
 * ファイル名からアンプ名、モデル、作成者を推測する
 */
const guessFromFilename = (filename: string, customDict: any[] = []) => {
    const name = filename.replace(/\.(nam|wav|ir)$/i, '');

    // 1. アンプ辞書（より具体的に）
    const ampPatterns = [
        { id: 'JCM800', pattern: /jcm[\s-]*800/i },
        { id: '5150', pattern: /5150|evh/i },
        { id: 'Diezel', pattern: /diezel|vh4/i },
        { id: 'Mesa', pattern: /mesa|recto|dual[\s-]*rec/i },
        { id: 'Marshall', pattern: /marshall|plexi/i },
        { id: 'Ampeg SVT', pattern: /ampeg[\s-]*svt|svt[\s-]*cl|svt/i },
        { id: 'Ampeg B-15', pattern: /ampeg[\s-]*b15|b15|b-15/i },
        { id: 'Trace Elliot', pattern: /trace[\s-]*elliot|traceelliot|ah500/i },
        { id: 'Markbass', pattern: /markbass|mark[\s-]*bass|little[\s-]*mark/i },
        { id: 'Fender Bassman', pattern: /fender[\s-]*bassman|bassman/i },
        { id: 'Gallien-Krueger', pattern: /gallien[\s-]*krueger|gallienkrueger|gk[\s-]*800rb|800rb/i },
        { id: 'Darkglass Electronics', pattern: /darkglass|microtubes|alpha[\s-]*omega/i }
    ];

    // 2. ペダル辞書（マッピングテーブル）
    const pedalDictionary = [
        // --- アンプシミュレータ / プリアンプ系 ---
        { keywords: ['iridium', 'strymon iridium'], name: 'Strymon Iridium' },
        { keywords: ['mooer 005', 'brown sound 005', 'micro preamp 005'], name: 'Mooer Micro Preamp 005' },
        { keywords: ['black secret', 'blacksecret'], name: 'Mooer Black Secret' },

        // --- オーバードライブ / ブースター系 ---
        { keywords: ['bd-2', 'bd2', 'blues driver', 'bluesdriver'], name: 'BOSS BD-2 Blues Driver' },
        { keywords: ['od-3', 'od3'], name: 'BOSS OD-3 OverDrive' },
        { keywords: ['sd-1', 'sd1', 'super overdrive', 'superoverdrive'], name: 'BOSS SD-1 Super Overdrive' },
        { keywords: ['ts9', 'ts-9', 'tube screamer', 'tubescreamer'], name: 'Ibanez TS9 Tube Screamer' },
        { keywords: ['ts808', 'ts-808'], name: 'Ibanez TS808 Overdrive Pro' },
        { keywords: ['od808', 'od-808'], name: 'MAXON OD808 Overdrive' },
        { keywords: ['spark booster', 'sparkbooster', 'tc spark', 'tcspark'], name: 'TC Electronic Spark Booster' },
        { keywords: ['ep booster', 'epbooster'], name: 'Xotic EP Booster' },
        { keywords: ['rc booster', 'rcbooster'], name: 'Xotic RC Booster' },
        { keywords: ['bb preamp', 'bbpreamp'], name: 'Xotic BB Preamp' },
        { keywords: ['centavo'], name: 'WARM AUDIO Centavo' },
        { keywords: ['warmdrive', 'warm drive'], name: 'WARM AUDIO Warmdrive' },
        { keywords: ['micro amp', 'microamp'], name: 'MXR Micro Amp' },

        // --- ディストーション / ファズ系 ---
        { keywords: ['ds-1', 'ds1', 'distortion'], name: 'BOSS DS-1 Distortion' },
        { keywords: ['mt-2', 'mt2', 'metal zone', 'metalzone'], name: 'BOSS MT-2 Metal Zone' },
        { keywords: ['hm-2', 'hm2', 'heavy metal', 'heavymetal'], name: 'BOSS HM-2 Heavy Metal' },
        { keywords: ['rat', 'rat2', 'proco rat', 'procorat'], name: 'Proco RAT2' },
        { keywords: ['guvnor', 'guv\'nor'], name: 'Marshall The Guv\'nor' },
        { keywords: ['shredmaster', 'shred master', 'shredmaster'], name: 'Marshall ShredMaster' },
        { keywords: ['bluesbreaker', 'blues breaker'], name: 'Marshall Bluesbreaker' },
        { keywords: ['distortion+', 'dist+'], name: 'MXR Distortion+' },
        { keywords: ['5150 overdrive', '5150 od', 'mxr 5150', '5150overdrive', '5150od', 'mxr5150'], name: 'MXR 5150 Overdrive' },
        { keywords: ['big muff', 'bigmuff'], name: 'Electro-Harmonix Big Muff Pi' },
        { keywords: ['sf300', 'super fuzz', 'superfuzz'], name: 'Behringer SF300 Super Fuzz' },
        { keywords: ['to800', 'vintage tube overdrive', 'vintagetubeoverdrive'], name: 'Behringer TO800' },

        // --- ベース用プリアンプ ---
        { keywords: ['sansamp', 'bddi', 'bass driver', 'bassdriver', 'sabddi'], name: 'Tech21 SansAmp Bass Driver DI' },
        { keywords: ['b7k', 'darkglass b7k', 'microtubes b7k', 'darkglassb7k', 'microtubesb7k'], name: 'Darkglass Microtubes B7K' },
        { keywords: ['alpha omega', 'alphaomega'], name: 'Darkglass Alpha·Omega' },

        // --- その他 ---
        { keywords: ["klon", "centaur", "kloncentaur", "klone"], name: "Klon Centaur" },
        { keywords: ["ocd", "fulltoneocd"], name: "Fulltone OCD" },
        { keywords: ["timmy"], name: "Timmy Overdrive" },
        { keywords: ["precisiondrive", "horizondevices"], name: "Precision Drive" },
        { keywords: ["fuzzface"], name: "Fuzz Face" },
        { keywords: ["odb3", "bassoverdrive"], name: "BOSS ODB-3" },
        { keywords: ["bassbigmuff", "bassmuff"], name: "EHX Bass Big Muff" }
    ];

    // 2.5 マイク辞書（マッピングテーブル）
    const micDictionary = [
        ...customDict.filter(d => d.category.toLowerCase() === 'mic').map(d => ({
            keywords: d.keyword.split(',').map((k: string) => k.trim().toLowerCase()),
            name: d.name
        })),
        // Neumann（ノイマン）系
        { keywords: ["neumann84", "km84", "neumannkm84"], name: "Neumann KM84" },
        { keywords: ["u87", "neumannu87"], name: "Neumann U87" },
        { keywords: ["u47", "neumannu47"], name: "Neumann U47" },

        // Shure系
        { keywords: ["sm57", "57"], name: "Shure SM57" },
        { keywords: ["sm58", "58"], name: "Shure SM58" },
        { keywords: ["sm7b"], name: "Shure SM7B" },

        // Sennheiser系
        { keywords: ["md421", "421"], name: "Sennheiser MD421" },
        { keywords: ["md441", "md441u", "441"], name: "Sennheiser MD441" },
        { keywords: ["e609", "609"], name: "Sennheiser e609" },
        { keywords: ["e906", "906"], name: "Sennheiser e906" },

        // Royer系
        { keywords: ["r121", "121", "royer121"], name: "Royer R-121" },

        // AKG / Beyerdynamic系
        { keywords: ["c414", "akg414"], name: "AKG C414" },
        { keywords: ["m160", "beyerdynamicm160"], name: "Beyerdynamic M160" },

        // Audio-Technica系
        { keywords: ["at3035"], name: "Audio-Technica AT3035" }
    ];

    // 3. トーンタイプ（Clean, Crunchなど）
    const tonePatterns = [
        { id: 'Clean', pattern: /clean/i },
        { id: 'Crunch', pattern: /crunch/i },
        { id: 'Lead', pattern: /lead/i },
        { id: 'HighGain', pattern: /high[\s-]*gain/i }
    ];

    let amp = '';
    let model = '';
    let cab = '';
    let mic = '';
    let tone = '';

    // それぞれ抽出
    const customAmps = customDict.filter(d => d.category.toLowerCase() === 'amp');
    const nameWithSpaces = name.toLowerCase().replace(/[_\-]/g, ' ');
    const normalizedNameForDict = name.toLowerCase().replace(/[\s_\-]/g, '');

    for (const entry of customAmps) {
        const kws = entry.keyword.split(',').map((k: string) => k.trim().toLowerCase());
        if (kws.some((kw: string) => {
            const normalizedKw = kw.toLowerCase().replace(/[\s_\-]/g, '');
            return normalizedNameForDict.includes(normalizedKw) || nameWithSpaces.includes(kw);
        })) {
            amp = entry.name;
            break;
        }
    }
    if (!amp) {
        amp = ampPatterns.find(p => p.pattern.test(name))?.id || '';
    }



    // モデルの抽出 (カスタムModel -> ペダル辞書 -> モデラー検出)
    const customModels = customDict.filter(d => d.category.toLowerCase() === 'model');
    for (const entry of customModels) {
        const kws = entry.keyword.split(',').map((k: string) => k.trim().toLowerCase());
        if (kws.some((kw: string) => {
            const normalizedKw = kw.toLowerCase().replace(/[\s_\-]/g, '');
            return normalizedNameForDict.includes(normalizedKw) || nameWithSpaces.includes(kw);
        })) {
            model = entry.name;
            break;
        }
    }

    if (!model) {
        for (const entry of pedalDictionary) {
            if (entry.keywords.some((kw: string) => {
                const normalizedKw = kw.toLowerCase().replace(/[\s_\-]/g, '');
                if (normalizedKw === 'rat') {
                    return /\brat\b/i.test(nameWithSpaces);
                }
                return normalizedNameForDict.includes(normalizedKw) || nameWithSpaces.includes(kw.toLowerCase());
            })) {
                model = entry.name;
                break;
            }
        }
    }

    // キャビネット辞書ベース抽出（長いキーワード＝具体的なものから順に判定）
    const cabinetDictionary = [
        ...customDict.filter(d => d.category.toLowerCase() === 'cabinet').map(d => ({
            keywords: d.keyword.split(',').map((k: string) => k.trim().toLowerCase()),
            name: d.name
        })),
        // Mesa Boogie系
        { keywords: ["mesatrad4x12", "mesatraditional4x12", "rectotrad"], name: "Mesa Traditional 4x12" },
        { keywords: ["mesaos4x12", "mesaoversized4x12", "rectoos"], name: "Mesa Oversized 4x12" },
        { keywords: ["mesa4x12", "recto4x12", "dualrect412", "dualrect412", "dualrect", "dualrect", "rectifiercab", "rectifier4x12"], name: "Mesa Rectifier 4x12" },
        { keywords: ["mesa2x12", "recto2x12"], name: "Mesa Rectifier 2x12" },

        // Ampeg系 (Bass)
        { keywords: ["ampeg8x10", "ampeg810", "svt810", "8x10", "810"], name: "Ampeg 8x10" },
        { keywords: ["ampeg4x10", "ampeg410", "svt410"], name: "Ampeg 4x10" },

        // Markbass系
        { keywords: ["markbass4x10", "markbass104"], name: "Markbass 4x10" },

        // 5150/EVH系
        { keywords: ["5150cab", "51504x12"], name: "EVH 5150 4x12" },

        // Marshall系
        { keywords: ["1960bv"], name: "Marshall 1960BV" },
        { keywords: ["1960av"], name: "Marshall 1960AV" },
        { keywords: ["1960b"], name: "Marshall 1960B" },
        { keywords: ["1960a", "jcm800cab"], name: "Marshall 1960A" },
        { keywords: ["1960tv"], name: "Marshall 1960TV" },
        { keywords: ["1960", "marshall4x12"], name: "Marshall 1960" },
        { keywords: ["1936", "marshall2x12"], name: "Marshall 1936 2x12" },

        // その他定番ハイゲイン/モダン系
        { keywords: ["bogneruber", "uberkab"], name: "Bogner Uberkab 4x12" },
        { keywords: ["bogneros2x12", "bogner2x12"], name: "Bogner OS 2x12" },
        { keywords: ["orangeppc412", "orange4x12"], name: "Orange PPC412" },
        { keywords: ["orangeppc212", "orange2x12"], name: "Orange PPC212" },
        { keywords: ["v30412engl", "engl412v30", "englv304x12", "englv30"], name: "ENGL 4x12 V30" },
        { keywords: ["englpro4x12", "engl4x12"], name: "ENGL Pro 4x12" },
        { keywords: ["zillafatboy", "zilla2x12"], name: "Zilla Fatboy 2x12" },

        // V30汎用（Genericの直前に判定を置く）
        { keywords: ["v30412", "v304x12", "412v30", "4x12v30"], name: "Generic 4x12 V30" },
        { keywords: ["v30212", "v302x12", "212v30", "2x12v30"], name: "Generic 2x12 V30" },

        // 汎用フォールバック（一番最後に判定）
        { keywords: ["4x12", "412"], name: "Generic 4x12" },
        { keywords: ["2x12", "212"], name: "Generic 2x12" },
        { keywords: ["112", "112"], name: "Generic 1x12" },
        { keywords: ["1x15", "115"], name: "Generic 1x15" }
    ];

    for (const entry of cabinetDictionary) {
        if (entry.keywords.some((kw: string) => normalizedNameForDict.includes(kw))) {
            cab = entry.name;
            break;
        }
    }

    // ★ マイク誤爆防止：キャビネット名の中にマイクブランドが含まれている場合は誤認識とみなす
    const micBrands = ["sennheiser", "shure", "neumann", "royer", "akg", "audio-technica", "beyerdynamic"];
    if (cab && micBrands.some(brand => cab.toLowerCase().includes(brand))) {
        cab = '';
    }

    // マイクの抽出（複数対応）
    const foundMics: string[] = [];
    for (const entry of micDictionary) {
        const isMatched = entry.keywords.some((kw: string) => {
            if (kw === '57' || kw === '58' || kw === '421' || kw === '441' || kw === '121' || kw === '609' || kw === '906') {
                return new RegExp(`\\b${kw}\\b`, 'i').test(nameWithSpaces);
            }
            return normalizedNameForDict.includes(kw);
        });

        if (isMatched) {
            if (!foundMics.includes(entry.name)) {
                foundMics.push(entry.name);
            }
        }
    }
    mic = foundMics.join(' + ');

    console.log('Extracted Cabinet:', cab);

    tone = tonePatterns.find(p => p.pattern.test(name))?.id || '';


    // 5. モデラー検出 (Axe FX, Kemper など)
    if (!model) {
        const axeMatch = name.match(/axe[\s-]*fx(?:[\s-]*(ii|iii|2|3))?/i);
        if (axeMatch) {
            model = `Axe FX ${axeMatch[1] ? axeMatch[1].toUpperCase() : ''}`.trim();
        } else {
            const otherModelerMatch = name.match(/helix|quad[\s-]*cortex|qc\b|kemper|tonex/i);
            if (otherModelerMatch) {
                const m = otherModelerMatch[0].toLowerCase();
                if (m.includes('helix')) model = 'Helix';
                else if (m.includes('kemper')) model = 'Kemper';
                else if (m.includes('tonex')) model = 'Tonex';
                else model = 'Quad Cortex';
            }
        }
    }

    // 作成者の推測（[Author] や @Author）
    const authorMatch = name.match(/\[(.*?)\]/) || name.match(/@([^\s_-]+)/);
    const author = authorMatch ? authorMatch[1] : '';

    return {
        amp: amp || name.split(/[_\-\s+]+/)[0] || 'Unknown', // Keep simple amp
        fallbackAmp: name.split(/[_\-\s+]+/)[0] || 'Unknown',
        model,
        cab,
        mic,
        tone,
        author
    };
};

/**
 * Parses a .nam file content (JSON) and extracts relevant metadata.
 */
export const parseNamMetadata = (content: string, filename: string, customDict: any[] = []): NamMetadata => {
    try {
        const data = JSON.parse(content);
        const guess = guessFromFilename(filename, customDict);

        const raw_make = data.gear_make || data.metadata?.gear_make || '';
        const raw_model = data.gear_model || data.metadata?.gear_model || '';
        const raw_author = data.author || data.metadata?.author || data.metadata?.modeled_by || '';
        const gear_type = data.gear_type || data.metadata?.gear_type || '';
        const tone_type = data.tone_type || data.metadata?.tone_type || data.metadata?.mode || '';

        const isInvalid = (val: string) => {
            if (!val) return true;
            const low = val.toLowerCase().trim();
            // 長すぎるゴミデータも無効化する
            return ['tz-make', 'tz-model', 'unknown', 'na', 'n/a', 'none', 'default'].includes(low) || val.length > 30;
        };

        let capture_type: NamMetadata['capture_type'] = 'Other';
        const searchContext = (gear_type + filename + (guess.cab ? 'cab' : '')).toLowerCase();

        if (searchContext.includes('cab') || searchContext.includes('1960') || searchContext.includes('full') || searchContext.includes('rig')) {
            capture_type = 'Full Rig';
        } else if (searchContext.includes('pedal') && (searchContext.includes('amp') || searchContext.includes('preamp'))) {
            capture_type = 'Amp+Pedal';
        } else if (searchContext.includes('pedal')) {
            capture_type = 'Pedal Only';
        } else if (searchContext.includes('amp') || searchContext.includes('preamp')) {
            capture_type = 'Amp Only';
        }

        let finalMakeBase = guess.amp ? guess.amp : (!isInvalid(raw_make) ? raw_make : guess.fallbackAmp);
        if (capture_type === 'Pedal Only' && guess.model) {
            finalMakeBase = guess.model;
        }

        const finalMake = finalMakeBase !== 'Unknown' ? finalMakeBase : 'Unknown';

        const validRawModel = !isInvalid(raw_model) ? raw_model : '';
        const finalModel = guess.model || validRawModel || 'Unknown';

        const finalAuthor = !isInvalid(raw_author) ? raw_author : (guess.author || 'Unknown');
        const finalTone = !isInvalid(tone_type) ? tone_type : (guess.tone || 'Unknown');

        const parts = [finalMake];
        if (finalModel !== 'Unknown' && finalMake !== finalModel) parts.push(finalModel);
        if (guess.cab) parts.push(guess.cab);
        if (guess.mic) parts.push(guess.mic);
        if (finalAuthor !== 'Unknown') parts.push(finalAuthor);
        const suggestedName = parts.join('_').replace(/\s+/g, '_');

        return {
            gear_make: finalMake,
            gear_model: finalModel,
            author: finalAuthor,
            gear_type: gear_type || (capture_type === 'Full Rig' ? 'Full Rig' : 'Amp'),
            capture_type,
            tone_type: finalTone,
            sample_rate: data.sample_rate || 48000,
            suggestedName, // ★修正: コメントアウトを解除！これで画面に反映される
            cabinet: guess.cab || '', // ★キャビネット情報も返す
            mic: guess.mic || ''     // ★マイク情報も返す
        };

    } catch (error) {
        console.error('Error parsing .nam file:', error);
        return {
            capture_type: 'Other',
            gear_make: guessFromFilename(filename).amp || guessFromFilename(filename).fallbackAmp || 'Unknown'
        };
    }
};