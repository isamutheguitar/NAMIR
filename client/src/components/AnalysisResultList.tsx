import { useState } from 'react';
import type { AnalysisResult } from '../types';
import { Settings, FileAudio, CheckCircle2, Edit3, Search, Database, Loader2, Link as LinkIcon, FileText, Tag } from 'lucide-react';


interface AnalysisResultListProps {
    results: AnalysisResult[];
    onUpdate: (id: string, updates: Partial<AnalysisResult>) => void;
    token: string;
}

export const AnalysisResultList = ({ results, onUpdate, token }: AnalysisResultListProps) => {
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    if (!results || results.length === 0) return null;

    // ★ Suggested Nameをリアルタイムに生成するヘルパー
    const generateSuggestedName = (item: AnalysisResult): string => {
        const parts: string[] = [];
        if (item.type === 'nam') {
            if (item.amp && item.amp !== 'Unknown') parts.push(item.amp);
            if (item.cabinet && item.cabinet !== 'Unknown') parts.push(item.cabinet);
            if (item.mic && item.mic !== 'Unknown') parts.push(item.mic);
            if (item.author && item.author !== 'Unknown') parts.push(item.author);
        } else {
            if (item.cabinet && item.cabinet !== 'Unknown') parts.push(item.cabinet);
            if (item.mic && item.mic !== 'Unknown') parts.push(item.mic);
        }
        return parts.join('_').replace(/\s+/g, '_');
    };

    // ★ サム考案：最強の「元ファイル名」直撃ロジック
    const getSearchUrl = (item: AnalysisResult) => {
        // 1. 拡張子（.nam や .wav）を取り除く
        // 2. ファイル名のアンダースコア(_)やハイフン(-)をスペースに変換して、検索エンジンが引っかかりやすくする
        const cleanName = item.originalName
            .replace(/\.[^/.]+$/, "")
            .replace(/[_-]/g, ' ');

        // ★ TONE3000の検索窓に直接叩き込む！
        return `https://www.tone3000.com/search?q=${encodeURIComponent(cleanName)}`;
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        try {
            const response = await fetch('/api/save-to-sheet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ results }),
            });

            if (response.ok) {
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } else {
                console.error('Failed to save to sheet');
            }
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 mt-8 w-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Analysis Results ({results.length})
                </h2>
                <button
                    onClick={handleSave}
                    disabled={isSaving || saveSuccess}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${saveSuccess
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] disabled:hover:shadow-none'
                        }`}
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Database className="w-4 h-4" />
                    )}
                    {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save to Spreadsheet'}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full box-border overflow-hidden p-1">
                {results.map((item) => {
                    const currentSuggestedName = generateSuggestedName(item);
                    const bestSuggestedName = item.editedName || currentSuggestedName;
                    const isEdited = item.editedName !== undefined && item.editedName !== currentSuggestedName;

                    return (
                        <div
                            key={item.id}
                            className={`bg-neutral-800 border rounded-xl p-4 sm:p-5 hover:bg-neutral-800/80 transition-all flex flex-col ${isEdited
                                ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                                : 'border-neutral-700 hover:border-indigo-500/50'
                                }`}
                        >
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-neutral-700/50">
                                {item.type === 'nam' ? (
                                    <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0">
                                        <Settings className="w-5 h-5 text-indigo-400" />
                                    </div>
                                ) : (
                                    <div className="p-2 bg-emerald-500/20 rounded-lg shrink-0">
                                        <FileAudio className="w-5 h-5 text-emerald-400" />
                                    </div>
                                )}
                                <div className="truncate w-full relative group min-w-0 flex-grow">
                                    <span className="text-sm font-mono text-neutral-400 truncate w-full block break-all">
                                        {item.originalName}
                                    </span>
                                    {/* Tooltip for long filenames */}
                                    <div className="absolute hidden group-hover:block bg-neutral-900 text-xs p-2 rounded -top-8 left-0 z-10 whitespace-nowrap shadow-xl border border-neutral-700">
                                        {item.originalName}
                                    </div>
                                </div>

                                {/* ★ ココがTONE3000直撃ボタンだ！ */}
                                <a
                                    href={getSearchUrl(item)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto shrink-0 flex items-center justify-center w-10 h-10 sm:w-auto sm:px-3 sm:py-1.5 bg-neutral-700/50 hover:bg-indigo-500/20 text-neutral-300 hover:text-indigo-300 text-xs font-medium rounded-md transition-colors border border-neutral-600 hover:border-indigo-500/30"
                                    title="Search directly on TONE3000"
                                >
                                    <Search className="w-4 h-4" />
                                    <span className="hidden sm:inline">Find</span>
                                </a>
                            </div>

                            <div className="flex-grow text-sm space-y-4 mb-4">
                                {item.type === 'nam' ? (
                                    <div className="space-y-3">
                                        {/* Amp Editor */}
                                        <div>
                                            <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Amp / Pedal</label>
                                            <input
                                                type="text"
                                                value={item.amp || ''}
                                                onChange={(e) => onUpdate(item.id, { amp: e.target.value })}
                                                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 focus:border-indigo-500 outline-none"
                                            />
                                        </div>

                                        {/* Model Editor */}
                                        <div>
                                            <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Model (Kemper, Tonex, etc.)</label>
                                            <input
                                                type="text"
                                                value={item.model || ''}
                                                onChange={(e) => onUpdate(item.id, { model: e.target.value })}
                                                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 focus:border-indigo-500 outline-none"
                                                placeholder="Kemper"
                                            />
                                        </div>

                                        {/* Type Selector */}
                                        <div>
                                            <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Capture Type</label>
                                            <select
                                                value={item.tone || 'Full Rig'}
                                                onChange={(e) => onUpdate(item.id, { tone: e.target.value })}
                                                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 focus:border-indigo-500 outline-none text-indigo-300"
                                            >
                                                <option value="Full Rig">Full Rig</option>
                                                <option value="Amp Only">Amp Only</option>
                                                <option value="Amp+Pedal">Amp+Pedal</option>
                                                <option value="Pedal Only">Pedal Only</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>

                                        {/* Cab Editor */}
                                        <div>
                                            <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Cabinet</label>
                                            <input
                                                type="text"
                                                value={item.cabinet || ''}
                                                onChange={(e) => onUpdate(item.id, { cabinet: e.target.value })}
                                                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 focus:border-indigo-500 outline-none"
                                                placeholder="Unknown"
                                            />
                                        </div>

                                        {/* Mic Editor */}
                                        <div>
                                            <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Microphone</label>
                                            <input
                                                type="text"
                                                value={item.mic || ''}
                                                onChange={(e) => onUpdate(item.id, { mic: e.target.value })}
                                                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 focus:border-indigo-500 outline-none text-emerald-300"
                                                placeholder="Unknown"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* IR Speaker Editor */}
                                        <div>
                                            <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Speaker / Cabinet</label>
                                            <input
                                                type="text"
                                                value={item.cabinet || ''}
                                                onChange={(e) => onUpdate(item.id, { cabinet: e.target.value })}
                                                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 focus:border-indigo-500 outline-none"
                                            />
                                        </div>

                                        {/* IR Mic Editor */}
                                        <div>
                                            <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Microphone</label>
                                            <input
                                                type="text"
                                                value={item.mic || ''}
                                                onChange={(e) => onUpdate(item.id, { mic: e.target.value })}
                                                className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 focus:border-indigo-500 outline-none text-emerald-300"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 pt-2 border-t border-neutral-700/30">
                                    {/* Author Editor */}
                                    <div>
                                        <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Author / Creator</label>
                                        <input
                                            type="text"
                                            value={item.author || ''}
                                            onChange={(e) => onUpdate(item.id, { author: e.target.value })}
                                            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 focus:border-indigo-500 outline-none"
                                            placeholder="Unknown"
                                        />
                                    </div>

                                    {/* Rate Selector */}
                                    <div>
                                        <label className="text-[10px] text-neutral-500 uppercase font-bold mb-1 block">Rate / Evaluation</label>
                                        <select
                                            value={item.rate || 0}
                                            onChange={(e) => onUpdate(item.id, { rate: Number(e.target.value) })}
                                            className="w-full bg-neutral-900 border border-neutral-700 rounded px-2 py-1.5 focus:border-indigo-500 outline-none text-yellow-500 font-bold"
                                        >
                                            <option value="0">☆☆☆☆☆ (None)</option>
                                            <option value="5">★★★★★ (Excellent)</option>
                                            <option value="4">★★★★☆ (Very Good)</option>
                                            <option value="3">★★★☆☆ (Good)</option>
                                            <option value="2">★★☆☆☆ (Fair)</option>
                                            <option value="1">★☆☆☆☆ (Poor)</option>
                                        </select>
                                    </div>

                                    {/* Pre-fill status badge */}
                                    {(item.sourceUrl || item.captureInfo || item.userMemo || (item.rate && item.rate > 0)) && (
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-wider border border-emerald-500/20">
                                            <CheckCircle2 className="w-2.5 h-2.5" /> Existing Record Loaded
                                        </div>
                                    )}
                                    {/* Source URL */}
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider text-neutral-500 flex items-center gap-1 mb-1 font-bold">
                                            <LinkIcon className="w-3 h-3" /> Source URL
                                        </label>
                                        <input
                                            type="text"
                                            value={item.sourceUrl || ''}
                                            onChange={(e) => onUpdate(item.id, { sourceUrl: e.target.value })}
                                            className="w-full bg-neutral-900/50 border border-neutral-700 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-indigo-500/50"
                                            placeholder="https://tone3000.com/..."
                                        />
                                    </div>

                                    {/* Capture Info */}
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider text-neutral-500 flex items-center gap-1 mb-1 font-bold">
                                            <FileText className="w-3 h-3" /> Capture Info / Author Notes
                                        </label>
                                        <textarea
                                            value={item.captureInfo || ''}
                                            onChange={(e) => onUpdate(item.id, { captureInfo: e.target.value })}
                                            className="w-full bg-neutral-900/50 border border-neutral-700 rounded-md px-2 py-1 text-xs h-16 resize-none focus:outline-none focus:border-indigo-500/50"
                                            placeholder="Paste setting notes here..."
                                        />
                                    </div>

                                    {/* User Memo */}
                                    <div>
                                        <label className="text-[10px] uppercase tracking-wider text-neutral-500 flex items-center gap-1 mb-1 font-bold">
                                            <Tag className="w-3 h-3" /> My Memo / Tags
                                        </label>
                                        <input
                                            type="text"
                                            value={item.userMemo || ''}
                                            onChange={(e) => onUpdate(item.id, { userMemo: e.target.value })}
                                            className="w-full bg-neutral-900/50 border border-neutral-700 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-indigo-500/50"
                                            placeholder="High gain masterpiece, etc."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto pt-3 border-t border-neutral-700/50">
                                <label className="text-xs flex items-center gap-1 mb-1.5 font-medium transition-colors">
                                    <Edit3 className={`w-3 h-3 ${isEdited ? 'text-yellow-500' : 'text-neutral-500'}`} />
                                    <span className={isEdited ? 'text-yellow-500' : 'text-neutral-500'}>
                                        {isEdited ? 'Final Filename (Edited):' : 'Final Filename:'}
                                    </span>
                                </label>
                                <input
                                    type="text"
                                    value={item.editedName !== undefined ? item.editedName : bestSuggestedName}
                                    onChange={(e) => onUpdate(item.id, { editedName: e.target.value })}
                                    className={`w-full bg-neutral-900 border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none transition-all ${isEdited
                                        ? 'border-yellow-500/50 text-yellow-100 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400'
                                        : 'border-neutral-700 text-indigo-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
                                        }`}
                                    placeholder="Enter final filename"
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
};