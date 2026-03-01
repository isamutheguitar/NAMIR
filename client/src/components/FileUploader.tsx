import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileAudio, Settings, Loader2 } from 'lucide-react';
import type { AnalysisResult } from '../types';

interface FileUploaderProps {
    onResults: (results: AnalysisResult[]) => void;
}

export const FileUploader = ({ onResults }: FileUploaderProps) => {
    const [isLoading, setIsLoading] = useState(false);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;
        setIsLoading(true);

        try {
            const filesPayload = await Promise.all(
                acceptedFiles.map(async (file) => {
                    let content = '';
                    // Only read content for .nam files since IR analysis uses just the filename
                    if (file.name.toLowerCase().endsWith('.nam')) {
                        content = await file.text();
                    }
                    return {
                        filename: file.name,
                        content,
                    };
                })
            );

            const response = await fetch('http://localhost:5000/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
