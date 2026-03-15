export interface NamMetadata {
    gear_make?: string;
    gear_model?: string;
    author?: string;
    gear_type?: string;
    capture_type: 'Amp Only' | 'Pedal Only' | 'Amp+Pedal' | 'Full Rig' | 'Other';
    tone_type?: string;
    sample_rate?: number;
    suggestedName?: string;
    cabinet?: string;
    mic?: string;
}

export interface IrMetadata {
    mic_model?: string;
    position?: string;
    distance?: string;
    speaker?: string;
    model?: string;
}


export interface AnalysisResult {
    id: string;
    originalName: string;
    type: 'nam' | 'ir';
    suggestedName: string;
    amp?: string;
    model?: string;
    cabinet?: string;
    author?: string;
    mic?: string;
    tone?: string;
    sourceUrl?: string;
    captureInfo?: string;
    userMemo?: string;
    rate?: number;
    metadata?: any;
    filePath?: string;
}

export interface LibraryItem {
    date: string;
    originalName: string;
    suggestedName: string;
    amp: string;
    model: string;
    cabinet: string;
    author: string;
    tone: string;
    type: string;
    sourceUrl: string;
    captureInfo: string;
    userMemo: string;
    mic: string;
    rate: number;
    // IR WAV metadata
    sampleRate?: number;
    bitDepth?: number;
    lengthMs?: number;
    lengthSamples?: number;
    // Optional file path for Explorer integration
    filePath?: string;
}

export interface CustomDictItem {
    id?: string;
    category: string;
    keyword: string;
    name: string;
}

/** 機材辞書エントリ（GearDictionaryシート用） */
export interface GearSpec {
    id?: string;
    name: string;           // 機材名
    requireSampleRate: number;  // 要求サンプルレート (Hz)
    maxBitDepth: number;        // 上限ビット深度 (bit)
    maxLengthMs: number;
    displayFlag?: boolean;
    caution?: string;
}
