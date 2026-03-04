import type { AnalysisResult, NamMetadata, IrMetadata } from '../../shared/types.js';
import { parseNamMetadata } from './namParser.js';
import { parseIrMetadata } from './irParser.js';
import { randomUUID } from 'crypto';
/**
 * Normalizes strings by removing special characters and limiting length.
 */
const sanitize = (str?: string, fallback?: string): string => {
    if (!str || str.toLowerCase() === 'unknown') {
        return fallback ? fallback.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15) : 'Unknown';
    }
    return str
        .replace(/[^a-zA-Z0-9]/g, '') // Remove non-alphanumeric
        .substring(0, 15);           // Limit length
};

/**
 * Extracts a fallback keyword from a filename based on position context
 */
const getFallbackKeyword = (filename: string, partIndex: number): string => {
    const baseName = filename.replace(/\.(wav|ir|nam)$/i, '');
    const parts = baseName.split(/[_\-\s+]+/);
    return parts[partIndex] || 'Unknown';
};

/**
 * Main analysis function that handles both .nam and .wav files.
 */
export const analyzeFile = (
    filename: string,
    content?: string,
    sourceAbbr: string = 'NA',
    customDict: any[] = []
): AnalysisResult => {
    const isNam = filename.toLowerCase().endsWith('.nam');
    const id = randomUUID();
    if (isNam && content) {
        const metadata = parseNamMetadata(content, filename, customDict);

        // Extract flat fields
        const amp = metadata.gear_make || getFallbackKeyword(filename, 0);
        const model = metadata.gear_model || getFallbackKeyword(filename, 1);
        const author = metadata.author || getFallbackKeyword(filename, 2);
        const tone = metadata.tone_type || 'Unknown';
        const cabinet = metadata.cabinet || 'Direct';

        // Suggest name: [Amp]_[Pedal]_[Author]_[SourceAbbr].nam
        const sAmp = sanitize(amp, 'Amp');
        const sPedal = metadata.capture_type?.includes('Pedal') ? 'Pedal' : 'Clean';
        const sAuthor = sanitize(author, 'Author');
        const suggestedName = `${sAmp}_${sPedal}_${sAuthor}_${sourceAbbr}.nam`;

        return {
            id,
            originalName: filename,
            type: 'nam',
            suggestedName,
            amp,
            model,
            author,
            tone,
            cabinet,
            metadata
        };
    } else {
        const metadata = parseIrMetadata(filename, customDict);

        // Extract flat fields
        const cabinet = metadata.speaker || getFallbackKeyword(filename, 0);
        const mic = metadata.mic_model || getFallbackKeyword(filename, 1);
        const pos = metadata.position || getFallbackKeyword(filename, 2);

        // Suggest name: [Cab]_[Mic]_[Pos]_[SourceAbbr].wav
        const sCab = sanitize(cabinet, 'Cab');
        const sMic = sanitize(mic, 'Mic');
        const sPos = sanitize(pos, 'Pos');
        const suggestedName = `${sCab}_${sMic}_${sPos}_${sourceAbbr}.wav`;

        return {
            id,
            originalName: filename,
            type: 'ir',
            suggestedName,
            cabinet,
            mic,
            tone: 'IR',
            metadata
        };
    }
};
