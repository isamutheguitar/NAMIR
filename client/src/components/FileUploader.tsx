import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileAudio, Settings, Loader2 } from 'lucide-react';
import type { AnalysisResult } from '../types';

interface FileUploaderProps {
    onResults: (results: AnalysisResult[]) => void;
    token: string;
}

export const FileUploader = ({ onResults, token }: FileUploaderProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        setIsLoading(true);

        try {
            const filesPayload = await Promise.all(
                acceptedFiles.map(async (file) => {
                    let content = '';
                    let wavMeta: { sampleRate?: number; bitDepth?: number; totalSamples?: number } = {};

                    // Only read content for .nam files since IR analysis uses just the filename
                    if (file.name.toLowerCase().endsWith('.nam')) {
                        content = await file.text();
                    } else if (file.name.toLowerCase().endsWith('.wav')) {
                        // WAVヘッダ解析（RIFFフォーマット）
                        try {
                            const arrayBuffer = await file.arrayBuffer();
                            const view = new DataView(arrayBuffer);
                            // RIFF チェック
                            const riff = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
                            if (riff === 'RIFF') {
                                // fmt チャンクを検索
                                let offset = 12;
                                while (offset < Math.min(arrayBuffer.byteLength - 8, 4096)) {
                                    const chunkId = String.fromCharCode(
                                        view.getUint8(offset), view.getUint8(offset + 1),
                                        view.getUint8(offset + 2), view.getUint8(offset + 3)
                                    );
                                    const chunkSize = view.getUint32(offset + 4, true);
                                    if (chunkId === 'fmt ') {
                                        // audioFormat(2) + numChannels(2) + sampleRate(4) + byteRate(4) + blockAlign(2) + bitsPerSample(2)
                                        const numChannels = view.getUint16(offset + 10, true);
                                        const sampleRate = view.getUint32(offset + 12, true);
                                        const bitDepth = view.getUint16(offset + 22, true);
                                        // dataチャンクを検索してサンプル数を計算
                                        let dataOffset = offset + 8 + chunkSize;
                                        let totalSamples: number | undefined;
                                        while (dataOffset < Math.min(arrayBuffer.byteLength - 8, 8192)) {
                                            const dataChunkId = String.fromCharCode(
                                                view.getUint8(dataOffset), view.getUint8(dataOffset + 1),
                                                view.getUint8(dataOffset + 2), view.getUint8(dataOffset + 3)
                                            );
                                            const dataChunkSize = view.getUint32(dataOffset + 4, true);
                                            if (dataChunkId === 'data') {
                                                const bytesPerSample = bitDepth / 8;
                                                totalSamples = Math.floor(dataChunkSize / (bytesPerSample * numChannels));
                                                break;
                                            }
                                            dataOffset += 8 + dataChunkSize;
                                        }
                                        wavMeta = { sampleRate, bitDepth, totalSamples };
                                        break;
                                    }
                                    offset += 8 + chunkSize;
                                }
                            }
                        } catch (e) {
                            console.warn('WAV header parse failed:', e);
                        }
                    }
                    return {
                        filename: file.name,
                        content,
                        wavMeta,
                    };
                })
            );

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ files: filesPayload }),
            });

            if (!response.ok) {
                throw new Error('Failed to analyze files');
            }

            const data = await response.json();
            onResults(data.results);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Error analyzing files. Check console.');
        } finally {
            setIsLoading(false);
        }
    }, [onResults]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/octet-stream': ['.nam'],
            'audio/wav': ['.wav'],
            'audio/x-wav': ['.wav']
        }
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ease-in-out
        ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-600 hover:border-indigo-400 hover:bg-neutral-800/50'}
      `}
        >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center justify-center space-y-4">
                {isLoading ? (
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                ) : (
                    <UploadCloud className={`w-16 h-16 ${isDragActive ? 'text-indigo-500' : 'text-neutral-400'}`} />
                )}
                <div>
                    <h3 className="text-xl font-bold text-neutral-200">
                        {isLoading ? 'Analyzing files...' : 'Drag & Drop files here'}
                    </h3>
                    <p className="text-neutral-400 mt-2">
                        Supports .nam (Neural Amp Modeler) and .wav (IR) files
                    </p>
                </div>
                <div className="flex gap-4 mt-4 text-sm text-neutral-500">
                    <div className="flex items-center gap-1">
                        <Settings className="w-4 h-4" /> NAM
                    </div>
                    <div className="flex items-center gap-1">
                        <FileAudio className="w-4 h-4" /> IR
                    </div>
                </div>
            </div>
        </div>
    );
};
