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
}

export interface AnalysisResult {
    id: string;
    originalName: string;
    type: 'nam' | 'ir';
    metadata: NamMetadata | IrMetadata;
    suggestedName: string;
    editedName?: string;
    sourceUrl?: string;
    captureInfo?: string;
    userMemo?: string;
    rate?: number;
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
}
