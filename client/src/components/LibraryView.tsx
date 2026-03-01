import { useState, useEffect } from 'react';
import type { LibraryItem } from '../types';
import { Search, Database, Calendar, Tag, Link as LinkIcon, SortAsc, Loader2, Star, X, Info, ExternalLink, LayoutGrid, List, ChevronUp, ChevronDown, Edit3, Save, RotateCcw, CheckCircle2, CloudUpload, CloudDownload, RefreshCw } from 'lucide-react';

export const LibraryView = () => {
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNam, setShowNam] = useState(true);
    const [showIr, setShowIr] = useState(true);
    const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'rate', direction: 'desc' });
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<LibraryItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);

    useEffect(() => {
        fetchLibrary();
    }, []);

    const fetchLibrary = async () => {
        setIsLoading(true);
        try {
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
            const response = await fetch(`${baseUrl}/api/get-library`);
            const data = await response.json();
            if (data.items) {
                setItems(data.items);
                // Update selectedItem if it exists to reflect changes
                if (selectedItem) {
                    const updated = data.items.find((i: LibraryItem) => i.originalName === selectedItem.originalName);
                    if (updated) setSelectedItem(updated);
                }
            }
        } catch (error) {
            console.error('Error fetching library:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartEdit = () => {
        if (selectedItem) {
            setEditForm({ ...selectedItem });
            setIsEditing(true);
            setSaveStatus('idle');
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditForm(null);
    };

    const handleSave = async () => {
        if (!editForm) return;
        setIsSaving(true);
        setSaveStatus('idle');
        setSaveError(null);
        try {
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
            const response = await fetch(`${baseUrl}/api/save-to-sheet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results: [editForm] })
            });

            const data = await response.json();

            if (response.ok) {
                setSaveStatus('success');
                setTimeout(() => {
                    setIsEditing(false);
                    fetchLibrary();
                }, 1500);
            } else {
                setSaveStatus('error');
                setSaveError(data.error || 'Failed to save changes');
            }
        } catch (error: any) {
            console.error('Error saving library item:', error);
            setSaveStatus('error');
            setSaveError(error.message || 'Network error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
            const response = await fetch(`${baseUrl}/api/backup`, { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                alert(`Backup Successful: ${data.message}`);
            } else {
                alert(`Backup Failed: ${data.error}`);
            }
        } catch (error: any) {
            alert(`Backup Error: ${error.message}`);
        } finally {
            setIsBackingUp(false);
        }
    };

    const handleRestore = async () => {
        if (!confirm('Warning: This will overwrite your current spreadsheet with the latest backup. Are you sure?')) {
            return;
        }
        setIsRestoring(true);
        try {
            const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:5000' : '';
            const response = await fetch(`${baseUrl}/api/restore`, { method: 'POST' });
            const data = await response.json();
            if (response.ok) {
                alert(`Restore Successful: ${data.message}`);
                fetchLibrary();
            } else {
                alert(`Restore Failed: ${data.error}`);
            }
        } catch (error: any) {
            alert(`Restore Error: ${error.message}`);
        } finally {
            setIsRestoring(false);
        }
    };

    const filteredItems = items
        .filter(item => {
            const query = searchQuery.toLowerCase();
            const isNam = item.originalName.toLowerCase().endsWith('.nam');
            const isIr = item.originalName.toLowerCase().endsWith('.wav') || item.originalName.toLowerCase().endsWith('.ir') || item.type.toUpperCase() === 'IR' || item.type.toUpperCase() === 'CAB ONLY';

            // Checkbox filtering
            if (!showNam && isNam) return false;
            if (!showIr && isIr) return false;

            return (
                item.amp.toLowerCase().includes(query) ||
                item.cabinet.toLowerCase().includes(query) ||
                item.mic.toLowerCase().includes(query) ||
                item.userMemo.toLowerCase().includes(query) ||
                item.originalName.toLowerCase().includes(query) ||
                item.author.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            const direction = sortConfig.direction === 'asc' ? 1 : -1;
            let fieldA: any;
            let fieldB: any;

            const isIrItem = (item: LibraryItem) => item.originalName.toLowerCase().endsWith('.wav') ||
                item.originalName.toLowerCase().endsWith('.ir') ||
                item.type.toUpperCase() === 'IR' ||
                item.type.toUpperCase() === 'CAB ONLY';

            const getName = (item: LibraryItem) => (isIrItem(item) && item.cabinet) ? item.cabinet : (item.amp || 'Unknown Amp');

            switch (sortConfig.key) {
                case 'name':
                case 'amp':
                    fieldA = getName(a);
                    fieldB = getName(b);
                    break;
                case 'date':
                    fieldA = new Date(a.date).getTime();
                    fieldB = new Date(b.date).getTime();
                    break;
                case 'rate':
                    fieldA = a.rate || 0;
                    fieldB = b.rate || 0;
                    break;
                case 'memo':
                    fieldA = (a.userMemo && a.userMemo.trim() !== '') ? 1 : 0;
                    fieldB = (b.userMemo && b.userMemo.trim() !== '') ? 1 : 0;
                    break;
                default:
                    fieldA = (a as any)[sortConfig.key] || '';
                    fieldB = (b as any)[sortConfig.key] || '';
            }

            if (fieldA === fieldB) {
                // Stabilize with newest first
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            }

            if (typeof fieldA === 'string' && typeof fieldB === 'string') {
                return fieldA.localeCompare(fieldB) * direction;
            }
            return (fieldA - fieldB) * direction;
        });

    const handleSort = (key: string) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const renderSortIcon = (key: string) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />;
    };

    const renderStars = (rate: number, size = "w-3 h-3", interactive = false) => {
        return (
            <div className={`flex gap-0.5 ${interactive ? 'cursor-pointer' : ''}`}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        onClick={() => interactive && editForm && setEditForm({ ...editForm, rate: star })}
                        className={`${size} ${star <= rate ? 'fill-yellow-500 text-yellow-500' : 'text-neutral-600'} ${interactive ? 'hover:scale-110 transition-transform' : ''}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Detail Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => {
                        setSelectedItem(null);
                        setIsEditing(false);
                    }}
                >
                    <div
                        className="bg-neutral-800 border border-neutral-700 w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b border-neutral-700 flex justify-between items-start bg-neutral-800/50">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    {isEditing && editForm ? (
                                        <select
                                            value={editForm.type}
                                            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                            className="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-[10px] font-bold text-indigo-400 uppercase outline-none focus:border-indigo-500/50"
                                        >
                                            <option value="Full Rig">Full Rig</option>
                                            <option value="Amp Only">Amp Only</option>
                                            <option value="Cab Only">Cab Only</option>
                                            <option value="Pedal">Pedal</option>
                                            <option value="IR">IR</option>
                                            <option value="Unknown">Unknown</option>
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${selectedItem.originalName.toLowerCase().endsWith('.nam') ? 'bg-indigo-500/20 text-indigo-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                            {selectedItem.type}
                                        </span>
                                    )}
                                    {isEditing && editForm ? (
                                        renderStars(editForm.rate, "w-5 h-5", true)
                                    ) : (
                                        renderStars(selectedItem.rate, "w-4 h-4")
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-white leading-tight">
                                    {isEditing && editForm ? (
                                        <input
                                            type="text"
                                            value={selectedItem.originalName.toLowerCase().endsWith('.nam') ? editForm.amp : (editForm.cabinet || editForm.amp)}
                                            onChange={(e) => {
                                                if (selectedItem.originalName.toLowerCase().endsWith('.nam')) {
                                                    setEditForm({ ...editForm, amp: e.target.value });
                                                } else {
                                                    setEditForm({ ...editForm, cabinet: e.target.value });
                                                }
                                            }}
                                            className="bg-neutral-900 border border-neutral-700 rounded px-3 py-1 text-xl text-white w-full outline-none focus:border-indigo-500/50 mt-1"
                                        />
                                    ) : (
                                        selectedItem.originalName.toLowerCase().endsWith('.nam') ? selectedItem.amp : (selectedItem.cabinet || selectedItem.amp)
                                    )}
                                </h2>
                                <p className="text-neutral-400 text-sm mt-1 font-mono">{selectedItem.originalName}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isEditing ? (
                                    <button
                                        onClick={handleStartEdit}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-bold rounded-lg transition-colors"
                                    >
                                        <Edit3 className="w-3.5 h-3.5" /> Edit
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleCancelEdit}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-white text-xs font-bold rounded-lg transition-colors"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" /> Cancel
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedItem(null);
                                        setIsEditing(false);
                                    }}
                                    className="p-2 hover:bg-neutral-700 rounded-full transition-colors text-neutral-400 hover:text-white"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-700/50">
                                        <h3 className="text-[10px] uppercase font-bold text-neutral-500 mb-2 tracking-widest">Gear Details</h3>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm gap-4">
                                                <span className="text-neutral-500 font-medium shrink-0">Amp:</span>
                                                {isEditing && editForm ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.amp}
                                                        onChange={e => setEditForm({ ...editForm, amp: e.target.value })}
                                                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-xs text-neutral-200 w-full text-right outline-none focus:border-indigo-500/50"
                                                    />
                                                ) : (
                                                    <span className="text-neutral-200">{selectedItem.amp || '-'}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-sm gap-4">
                                                <span className="text-neutral-500 font-medium shrink-0">Model:</span>
                                                {isEditing && editForm ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.model}
                                                        onChange={e => setEditForm({ ...editForm, model: e.target.value })}
                                                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-xs text-neutral-200 w-full text-right outline-none focus:border-indigo-500/50"
                                                    />
                                                ) : (
                                                    <span className="text-neutral-200">{selectedItem.model || '-'}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-sm gap-4">
                                                <span className="text-neutral-500 font-medium shrink-0">Cabinet:</span>
                                                {isEditing && editForm ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.cabinet}
                                                        onChange={e => setEditForm({ ...editForm, cabinet: e.target.value })}
                                                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-xs text-neutral-200 w-full text-right outline-none focus:border-indigo-500/50"
                                                    />
                                                ) : (
                                                    <span className="text-neutral-200">{selectedItem.cabinet || '-'}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-sm gap-4">
                                                <span className="text-neutral-500 font-medium shrink-0">Mic:</span>
                                                {isEditing && editForm ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.mic}
                                                        onChange={e => setEditForm({ ...editForm, mic: e.target.value })}
                                                        className="bg-neutral-900 border border-neutral-700 rounded px-2 py-0.5 text-xs text-neutral-200 w-full text-right outline-none focus:border-indigo-500/50"
                                                    />
                                                ) : (
                                                    <span className="text-neutral-300 font-medium">{selectedItem.mic || '-'}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-700/50 text-xs text-neutral-400">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span>Analyzed on {selectedItem.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tag className="w-3.5 h-3.5" />
                                            <span>Author: {selectedItem.author || 'Unknown'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/10">
                                        <h3 className="text-[10px] uppercase font-bold text-yellow-500/70 mb-2 tracking-widest flex items-center gap-1.5">
                                            <Tag className="w-3 h-3" /> User Memo
                                        </h3>
                                        {isEditing && editForm ? (
                                            <textarea
                                                value={editForm.userMemo}
                                                onChange={(e) => setEditForm({ ...editForm, userMemo: e.target.value })}
                                                placeholder="Enter your personal notes..."
                                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-sm text-neutral-200 outline-none focus:border-yellow-500/50 transition-all min-h-[80px] resize-none"
                                            />
                                        ) : (
                                            <p className="text-sm text-neutral-300 italic">
                                                {selectedItem.userMemo || 'No personal notes.'}
                                            </p>
                                        )}
                                    </div>

                                    <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
                                        <h3 className="text-[10px] uppercase font-bold text-indigo-400 mb-2 tracking-widest flex items-center gap-1.5">
                                            <LinkIcon className="w-3 h-3" /> Source URL
                                        </h3>
                                        {isEditing && editForm ? (
                                            <input
                                                type="text"
                                                value={editForm.sourceUrl}
                                                onChange={(e) => setEditForm({ ...editForm, sourceUrl: e.target.value })}
                                                placeholder="https://..."
                                                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg p-2 text-sm text-neutral-200 outline-none focus:border-indigo-500/50 transition-all"
                                            />
                                        ) : selectedItem.sourceUrl ? (
                                            <a
                                                href={selectedItem.sourceUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between group"
                                            >
                                                <span className="text-xs text-indigo-400 truncate max-w-[180px] group-hover:underline">
                                                    {selectedItem.sourceUrl}
                                                </span>
                                                <ExternalLink className="w-3.5 h-3.5 text-indigo-500" />
                                            </a>
                                        ) : (
                                            <p className="text-xs text-neutral-600">No source link.</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Capture Info */}
                            <div className="bg-neutral-900 p-5 rounded-2xl border border-neutral-700 shadow-inner">
                                <h3 className="text-[11px] uppercase font-bold text-neutral-400 mb-3 tracking-widest flex items-center gap-2">
                                    <Info className="w-4 h-4 text-indigo-400" /> Capture Info / Author Notes
                                </h3>
                                {isEditing && editForm ? (
                                    <textarea
                                        value={editForm.captureInfo}
                                        onChange={(e) => setEditForm({ ...editForm, captureInfo: e.target.value })}
                                        placeholder="Paste capture info or notes here..."
                                        className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-300 outline-none focus:border-indigo-500/50 transition-all min-h-[160px] font-mono"
                                    />
                                ) : (
                                    <div className="bg-neutral-950/50 p-4 rounded-xl border border-neutral-800 text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto custom-scrollbar font-mono">
                                        {selectedItem.captureInfo || 'No detailed capture info provided by author.'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-4 bg-neutral-900/30 border-t border-neutral-700 flex items-center justify-between">
                            <p className="text-[10px] text-neutral-600 font-mono">NAMIR Intelligence Engine</p>
                            {isEditing && (
                                <div className="flex items-center gap-3">
                                    {saveStatus === 'success' && (
                                        <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold animate-in fade-in slide-in-from-right-2">
                                            <CheckCircle2 className="w-4 h-4" /> Saved Successfully!
                                        </div>
                                    )}
                                    {saveStatus === 'error' && (
                                        <div className="text-rose-400 text-xs font-bold bg-rose-500/10 px-2 py-1 rounded max-w-[200px] truncate">
                                            {saveError || 'Error saving.'}
                                        </div>
                                    )}
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                <div className="flex flex-col md:flex-row gap-4 flex-grow w-full md:w-auto">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Search Amp, Cab, Mic, Memo..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>

                    <div className="flex items-center gap-4 bg-neutral-900/50 px-4 py-2 rounded-lg border border-neutral-700/30">
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-indigo-400 select-none">
                            <input
                                type="checkbox"
                                checked={showNam}
                                onChange={(e) => setShowNam(e.target.checked)}
                                className="w-4 h-4 rounded border-neutral-700 text-indigo-500 focus:ring-indigo-500 bg-neutral-900"
                            />
                            NAM
                        </label>
                        <div className="w-px h-4 bg-neutral-700" />
                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-emerald-400 select-none">
                            <input
                                type="checkbox"
                                checked={showIr}
                                onChange={(e) => setShowIr(e.target.checked)}
                                className="w-4 h-4 rounded border-neutral-700 text-emerald-500 focus:ring-emerald-500 bg-neutral-900"
                            />
                            IR
                        </label>
                    </div>
                    {/* View/Backup/Restore Controls */}
                    <div className="flex items-center gap-2 border-l border-neutral-700/50 pl-4">
                        <button
                            onClick={handleBackup}
                            disabled={isBackingUp || isRestoring}
                            title="Backup to Google Drive"
                            className="p-2 bg-neutral-700/50 hover:bg-neutral-600/70 text-neutral-300 hover:text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 text-xs font-bold"
                        >
                            {isBackingUp ? <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> : <CloudUpload className="w-4 h-4 text-indigo-400" />}
                            <span className="hidden lg:inline">Backup</span>
                        </button>
                        <button
                            onClick={handleRestore}
                            disabled={isBackingUp || isRestoring}
                            title="Restore Latest Backup"
                            className="p-2 bg-neutral-700/50 hover:bg-neutral-600/70 text-neutral-300 hover:text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 text-xs font-bold"
                        >
                            {isRestoring ? <Loader2 className="w-4 h-4 animate-spin text-rose-400" /> : <CloudDownload className="w-4 h-4 text-rose-400" />}
                            <span className="hidden lg:inline">Restore</span>
                        </button>
                        <div className="w-px h-6 bg-neutral-700/50 mx-1" />
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-neutral-700/50 text-neutral-400 hover:text-white'}`}
                            title="Grid View"
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-neutral-700/50 text-neutral-400 hover:text-white'}`}
                            title="List View"
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto shrink-0 md:border-l md:border-neutral-700/50 md:pl-4">
                        <div className="flex items-center gap-2 text-sm text-neutral-400 shrink-0">
                            <SortAsc className="w-4 h-4" />
                            <span>Sort:</span>
                        </div>
                        <select
                            value={`${sortConfig.key}-${sortConfig.direction}`}
                            onChange={(e) => {
                                const [key, direction] = e.target.value.split('-');
                                setSortConfig({ key, direction: direction as 'asc' | 'desc' });
                            }}
                            className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all text-neutral-200"
                        >
                            <option value="rate-desc">Rate (High to Low)</option>
                            <option value="date-desc">Date (Newest)</option>
                            <option value="amp-asc">Amp Name (A-Z)</option>
                            <option value="memo-desc">Memo (Has Memo First)</option>
                            <option value="type-asc">Type (A-Z)</option>
                        </select>

                        <button
                            onClick={fetchLibrary}
                            className="p-2 hover:bg-neutral-700 rounded-lg transition-all text-neutral-400 hover:text-white"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>
            {/* Library Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-neutral-400 animate-pulse">Loading Library...</p>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-20 bg-neutral-800/20 rounded-2xl border border-dashed border-neutral-700">
                    <Database className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
                    <p className="text-neutral-400">No items found in your library.</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map((item, index) => {
                        const isIr = item.originalName.toLowerCase().endsWith('.wav') ||
                            item.originalName.toLowerCase().endsWith('.ir') ||
                            item.type.toUpperCase() === 'IR' ||
                            item.type.toUpperCase() === 'CAB ONLY';
                        const displayTitle = (isIr && item.cabinet) ? item.cabinet : (item.amp || 'Unknown Amp');
                        const displaySubTitle = (isIr && item.cabinet) ? (item.amp || '') : (item.model || '');

                        return (
                            <div
                                key={index}
                                onClick={() => setSelectedItem(item)}
                                className="bg-neutral-800 border border-neutral-700/50 rounded-xl p-5 hover:bg-neutral-700 transition-all flex flex-col group hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-neutral-500 cursor-pointer transform hover:-translate-y-1 active:scale-[0.98]"
                            >
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-neutral-700/30">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${item.originalName.toLowerCase().endsWith('.nam') ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
                                        }`}>
                                        {item.type}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-neutral-500 text-[10px]">
                                        <Calendar className="w-3 h-3" />
                                        {item.date}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4 flex-grow">
                                    <div className="flex justify-between items-start gap-2">
                                        <div>
                                            <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors leading-tight">
                                                {displayTitle}
                                            </h3>
                                            {displaySubTitle && (
                                                <p className="text-xs text-neutral-500 mt-0.5">{displaySubTitle}</p>
                                            )}
                                        </div>
                                        {item.rate > 0 && renderStars(item.rate)}
                                    </div>

                                    <div className="space-y-1.5">
                                        {(isIr && item.cabinet) ? null : item.cabinet && (
                                            <div className="flex items-center gap-2 text-sm text-neutral-300">
                                                <div className="w-1 h-1 rounded-full bg-neutral-600" />
                                                <span className="text-neutral-500 font-medium shrink-0">Cab:</span>
                                                <span className="truncate">{item.cabinet}</span>
                                            </div>
                                        )}
                                        {item.mic && (
                                            <div className="flex items-center gap-2 text-sm text-emerald-400/90 font-medium">
                                                <div className="w-1 h-1 rounded-full bg-emerald-500/50" />
                                                <span className="text-neutral-500 font-medium shrink-0">Mic:</span>
                                                <span className="truncate">{item.mic}</span>
                                            </div>
                                        )}
                                        {item.author && (
                                            <div className="flex items-center gap-2 text-xs text-neutral-400">
                                                <span className="text-neutral-600 shrink-0 italic">by</span>
                                                <span className="truncate">{item.author}</span>
                                            </div>
                                        )}
                                    </div>

                                    {item.userMemo && (
                                        <div className="mt-3 p-2.5 bg-neutral-900/50 rounded-lg border border-neutral-700/30 flex gap-2">
                                            <Tag className="w-3.5 h-3.5 text-yellow-500/70 shrink-0 mt-0.5" />
                                            <p className="text-xs text-neutral-400 italic leading-relaxed line-clamp-2">
                                                {item.userMemo}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-3 border-t border-neutral-700/30 flex items-center justify-between">
                                    <p className="text-[10px] font-mono text-neutral-500 truncate max-w-[150px]" title={item.originalName}>
                                        {item.originalName}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        {item.sourceUrl && (
                                            <div className="p-1.5 bg-neutral-700/50 text-neutral-500 rounded-md">
                                                <LinkIcon className="w-3" />
                                            </div>
                                        )}
                                        <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Info className="w-3" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="overflow-x-auto bg-neutral-800/20 rounded-xl border border-neutral-700/50">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="border-b border-neutral-700/50 bg-neutral-900/30">
                                <th onClick={() => handleSort('rate')} className="p-4 text-[11px] uppercase font-bold text-neutral-500 tracking-widest cursor-pointer hover:text-white transition-colors">
                                    <div className="flex items-center gap-2">Rate {renderSortIcon('rate')}</div>
                                </th>
                                <th onClick={() => handleSort('date')} className="p-4 text-[11px] uppercase font-bold text-neutral-500 tracking-widest cursor-pointer hover:text-white transition-colors">
                                    <div className="flex items-center gap-2">Date {renderSortIcon('date')}</div>
                                </th>
                                <th onClick={() => handleSort('name')} className="p-4 text-[11px] uppercase font-bold text-neutral-500 tracking-widest cursor-pointer hover:text-white transition-colors">
                                    <div className="flex items-center gap-2">Name {renderSortIcon('name')}</div>
                                </th>
                                <th onClick={() => handleSort('type')} className="p-4 text-[11px] uppercase font-bold text-neutral-500 tracking-widest cursor-pointer hover:text-white transition-colors">
                                    <div className="flex items-center gap-2">Type {renderSortIcon('type')}</div>
                                </th>
                                <th onClick={() => handleSort('mic')} className="p-4 text-[11px] uppercase font-bold text-neutral-500 tracking-widest cursor-pointer hover:text-white transition-colors">
                                    <div className="flex items-center gap-2">Mic {renderSortIcon('mic')}</div>
                                </th>
                                <th onClick={() => handleSort('memo')} className="p-4 text-[11px] uppercase font-bold text-neutral-500 tracking-widest cursor-pointer hover:text-white transition-colors">
                                    <div className="flex items-center gap-2">Memo {renderSortIcon('memo')}</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item, index) => {
                                const isIr = item.originalName.toLowerCase().endsWith('.wav') ||
                                    item.originalName.toLowerCase().endsWith('.ir') ||
                                    item.type.toUpperCase() === 'IR' ||
                                    item.type.toUpperCase() === 'CAB ONLY';
                                const displayName = (isIr && item.cabinet) ? item.cabinet : (item.amp || 'Unknown Amp');
                                return (
                                    <tr
                                        key={index}
                                        onClick={() => setSelectedItem(item)}
                                        className="border-b border-neutral-700/30 hover:bg-neutral-700/30 transition-all cursor-pointer group"
                                    >
                                        <td className="p-4">{renderStars(item.rate)}</td>
                                        <td className="p-4 text-xs text-neutral-400 font-mono">{item.date}</td>
                                        <td className="p-4 text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">{displayName}</td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${item.originalName.toLowerCase().endsWith('.nam') ? 'bg-indigo-500/10 text-indigo-400' : 'bg-emerald-500/10 text-emerald-400'
                                                }`}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-xs text-emerald-400/80">{item.mic || '-'}</td>
                                        <td className="p-4 text-xs text-neutral-400 italic truncate max-w-[200px]">{item.userMemo || '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
