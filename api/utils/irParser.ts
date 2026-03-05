import type { IrMetadata } from '../../shared/types.js';

/**
 * Estimates IR metadata (Mic, Position, Speaker) from the filename.
 * @param filename Only the filename (e.g., "V30_SM57_Cone_1in.wav")
 */
export const parseIrMetadata = (filename: string, customDict: any[] = []): IrMetadata => {
    const name = filename.replace(/\.(wav|ir)$/i, '');

    // Common Microphones (Expanded)
    const micDictionary = [
        ...customDict.filter(d => d.category.toLowerCase() === 'mic').map(d => ({
            keywords: d.keyword.split(',').map((k: string) => k.trim().toLowerCase()),
            name: d.name
        })),
        { keywords: ["neumann84", "km84", "neumannkm84"], name: "Neumann KM84" },
        { keywords: ["u87", "neumannu87"], name: "Neumann U87" },
        { keywords: ["u47", "neumannu47"], name: "Neumann U47" },
        { keywords: ["sm57", "57"], name: "Shure SM57" },
        { keywords: ["sm58", "58"], name: "Shure SM58" },
        { keywords: ["sm7b"], name: "Shure SM7B" },
        { keywords: ["md421", "421"], name: "Sennheiser MD421" },
        { keywords: ["md441", "md441u", "441"], name: "Sennheiser MD441" },
        { keywords: ["e609", "609"], name: "Sennheiser e609" },
        { keywords: ["e906", "906"], name: "Sennheiser e906" },
        { keywords: ["r121", "121", "royer121"], name: "Royer R-121" },
        { keywords: ["c414", "akg414"], name: "AKG C414" },
        { keywords: ["m160", "beyerdynamicm160"], name: "Beyerdynamic M160" },
        { keywords: ["at3035"], name: "Audio-Technica AT3035" }
    ];

    // Common Positions
    const positions = [
        { id: 'Cone', pattern: /cone|center/i },
        { id: 'Edge', pattern: /edge|cone[\s-]*edge/i },
        { id: 'Cap', pattern: /cap|dust[\s-]*cap/i },
        { id: 'Cap Edge', pattern: /cap[\s-]*edge/i },
        { id: 'Off-Axis', pattern: /off[\s-]*axis|offaxis|45[\s-]*deg/i },
        { id: 'Fredman', pattern: /fredman/i },
        { id: 'Rear', pattern: /rear|back/i },
        { id: 'Room', pattern: /room|ambient/i }
    ];

    // Common Distances
    const distances = [
        { id: '0in', pattern: /0[\s]*in|00[\s]*in/i },
        { id: '0.5in', pattern: /0\.?5[\s]*in/i },
        { id: '1in', pattern: /1[\s]*in|1\.0[\s]*in/i },
        { id: '2in', pattern: /2[\s]*in/i },
        { id: '3in', pattern: /3[\s]*in/i },
        { id: '6in', pattern: /6[\s]*in/i },
        { id: '12in', pattern: /12[\s]*in|1[\s]*ft/i }
    ];

    // Speakers/Cabinets (Expanded)
    const speakers = [
        { id: 'V30', pattern: /v[\s-]*30|vintage[\s-]*30/i },
        { id: 'Greenback', pattern: /greenback|gb|g12[\s-]*m/i },
        { id: 'Creamback', pattern: /creamback|cb|g12[\s-]*h/i },
        { id: 'Alnico Blue', pattern: /blue|alnico[\s-]*blue/i },
        { id: 'Mesa OS', pattern: /mesa[\s-]*os|mesa[\s-]*oversized/i },
        { id: 'Mesa', pattern: /mesa/i },
        { id: 'Marshall', pattern: /marshall|1960/i },
        { id: 'Orange', pattern: /orange/i },
        { id: 'Bogner', pattern: /bogner/i },
        { id: 'Diezel', pattern: /diezel/i },
        { id: '5150', pattern: /5150/i }, // Often used for cabs too
        { id: 'EVH', pattern: /evh/i },
        { id: 'Fender', pattern: /fender|twin|deluxe/i },
        { id: 'Zilla', pattern: /zilla/i }
    ];

    const metadata: IrMetadata = {};

    // Find Mic
    const nameWithSpaces = name.toLowerCase().replace(/[_\-]/g, ' ');
    const normalizedNameForDict = name.toLowerCase().replace(/[\s_\-]/g, '');

    for (const entry of micDictionary) {
        const isMatched = entry.keywords.some((kw: string) => {
            if (kw === '57' || kw === '58' || kw === '421' || kw === '441' || kw === '121' || kw === '609' || kw === '906') {
                return new RegExp(`\\b${kw}\\b`, 'i').test(nameWithSpaces);
            }
            return normalizedNameForDict.includes(kw);
        });

        if (isMatched) {
            metadata.mic_model = entry.name;
            break;
        }
    }

    // Find Position
    for (const pos of positions) {
        if (pos.pattern.test(name)) {
            metadata.position = pos.id;
            break;
        }
    }

    // Find Distance
    for (const dist of distances) {
        if (dist.pattern.test(name)) {
            metadata.distance = dist.id;
            break;
        }
    }

    // Find Speaker
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
        { keywords: ["1x12", "112"], name: "Generic 1x12" }
    ];

    // Pedals/Preamps (New)
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

    let foundSpeaker = false;

    for (const entry of cabinetDictionary) {
        const isMatched = entry.keywords.some((kw: string) => {
            const normalizedKw = kw.toLowerCase().replace(/[\s_\-]/g, '');
            return normalizedNameForDict.includes(normalizedKw) || nameWithSpaces.includes(kw.toLowerCase());
        });
        if (isMatched) {
            metadata.speaker = entry.name;
            foundSpeaker = true;
            break;
        }
    }

    // Find Model (Pedal)
    for (const entry of pedalDictionary) {
        const isMatched = entry.keywords.some((kw: string) => {
            const normalizedKw = kw.toLowerCase().replace(/[\s_\-]/g, '');
            if (normalizedKw === 'rat') {
                return /\brat\b/i.test(nameWithSpaces);
            }
            return normalizedNameForDict.includes(normalizedKw) || nameWithSpaces.includes(kw.toLowerCase());
        });
        if (isMatched) {
            metadata.model = entry.name;
            break;
        }
    }

    if (!foundSpeaker) {
        const normalizeSize = (s: string) => {
            if (!s) return '';
            if (/412/i.test(s)) return '4x12';
            if (/212/i.test(s)) return '2x12';
            if (/112/i.test(s)) return '1x12';
            return s.toLowerCase();
        };

        const normalizeBrandModel = (s: string) => {
            if (!s) return '';
            const low = s.toLowerCase();
            if (low.includes('dualrect') || low.includes('recto')) return 'DualRect';
            if (low.includes('mesa')) return 'Mesa';
            if (low.includes('marshall')) return 'Marshall';
            if (low.includes('orange')) return 'Orange';
            if (low.includes('bogner')) return 'Bogner';
            if (low.includes('fender')) return 'Fender';
            if (low.includes('5150')) return '5150';
            if (low.includes('diezel')) return 'Diezel';
            return s.charAt(0).toUpperCase() + s.slice(1);
        };

        const normalizeSubmodel = (s: string) => {
            if (!s) return '';
            const low = s.toLowerCase();
            if (low.includes('trad')) return 'Trad';
            if (low.includes('os') || low.includes('oversized')) return 'OS';
            return s.charAt(0).toUpperCase() + s.slice(1);
        };

        const normalizeSpeakerModel = (s: string) => {
            if (!s) return '';
            const low = s.toLowerCase();
            if (low.includes('v30') || low.includes('vintage')) return 'V30';
            if (low.includes('greenback') || low.includes('g12m') || low === 'gb') return 'Greenback';
            if (low.includes('creamback') || low.includes('g12h') || low === 'cb') return 'Creamback';
            if (low.includes('blue')) return 'Alnico Blue';
            return s.toUpperCase();
        };

        // 1. 動的なブランド名・モデル名＋キャビネットサイズの抽出 (例: Mesa Trad 4x12 V30, DualRect412)
        const advancedCabMatch = name.match(/(mesa|marshall|orange|bogner|fender|dual[\s-]*rect|recto|5150|diezel|evh)(?:[\s_\-]+(trad|traditional|os|oversized))?(?:[\s_\-]+(4x12|2x12|1x12|412|212|112))?(?:[\s_\-]+(v30|vintage[\s-]*30|greenback|gb|creamback|cb|g12m|g12h|alnico[\s-]*blue))?/i);

        if (advancedCabMatch && (advancedCabMatch[2] || advancedCabMatch[3] || advancedCabMatch[4] || speakers.find(s => s.pattern.test(advancedCabMatch[0])))) {
            const parts = [
                normalizeBrandModel(advancedCabMatch[1] || ''),
                normalizeSubmodel(advancedCabMatch[2] || ''),
                normalizeSize(advancedCabMatch[3] || ''),
                normalizeSpeakerModel(advancedCabMatch[4] || '')
            ].filter(Boolean); // 空の文字列を削除

            metadata.speaker = parts.join(' ');
        } else {
            // 2. 従来のフォールバック抽出
            for (const spk of speakers) {
                if (spk.pattern.test(name)) {
                    metadata.speaker = spk.id;
                    break;
                }
            }
        }
    }

    return metadata;
};
