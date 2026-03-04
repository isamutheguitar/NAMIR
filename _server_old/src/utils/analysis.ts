import type { AnalysisResult, NamMetadata, IrMetadata } from '../../../shared/types.js';
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
    sourceAbbr: string = 'NA'
): AnalysisResult => {
    const isNam = filename.toLowerCase().endsWith('.nam');
    const id = randomUUID();
    if (isNam && content) {
        const metadata = parseNamMetadata(content, filename);

        // Suggest name: [Amp]_[Pedal]_[Author]_[SourceAbbr].nam
        const fallbackAmp = getFallbackKeyword(filename, 0);
        const amp = sanitize(metadata.gear_make || metadata.gear_model, fallbackAmp);
        const pedal = metadata.capture_type === 'Amp+Pedal' ? 'Pedal' : 'Clean';
        const fallbackAuthor = getFallbackKeyword(filename, 1);
        const author = sanitize(metadata.author, fallbackAuthor);
        const suggestedName = `${amp}_${pedal}_${author}_${sourceAbbr}.nam`;

        return {
            id,
            originalName: filename,
            type: 'nam',
            metadata,
            suggestedName
        };
    } else {
        const metadata = parseIrMetadata(filename);

        // Suggest name: [Cab]_[Mic]_[Pos]_[SourceAbbr].wav
        const cab = sanitize(metadata.speaker, getFallbackKeyword(filename, 0));
        const mic = sanitize(metadata.mic_model, getFallbackKeyword(filename, 1));
        const pos = sanitize(metadata.position, getFallbackKeyword(filename, 2));
        const suggestedName = `${cab}_${mic}_${pos}_${sourceAbbr}.wav`;

        return {
            id,
            originalName: filename,
            type: 'ir',
            metadata,
            suggestedName
        };
    }
};
