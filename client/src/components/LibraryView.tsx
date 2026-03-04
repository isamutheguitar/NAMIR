import { useState, useEffect } from 'react';
import type { LibraryItem } from '../types';
import {
    Search, Database, Tag, SortAsc, Loader2, Star, X, Info, LayoutGrid, List, RotateCcw,
    CloudUpload, CloudDownload, RefreshCw, ChevronRight, Edit3, Save, CheckCircle2,
    Calendar, User, Speaker, Mic, ExternalLink, Globe, Zap, Waves
} from 'lucide-react';

interface LibraryViewProps {
    token: string;
}

const TYPE_OPTIONS = ["Full Rig", "Amp Only", "Cab Only", "Pedal", "IR", "Unknown"];

export const LibraryView = ({ token }: LibraryViewProps) => {
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showNam, setShowNam] = useState(true);
    const [showIr, setShowIr] = useState(true);
    const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'rate', direction: 'desc' });
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<LibraryItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [showRestoreMenu, setShowRestoreMenu] = useState(false);
    const [backups, setBackups] = useState<string[]>([]);
    const [isLoadingBackups, setIsLoadingBackups] = useState(false);

    useEffect(() => { fetchLibrary(); }, []);

    const fetchLibrary = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/get-library', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.items) setItems(data.items);
        } catch (e) { console.error('Fetch Library Error:', e); }
        finally { setIsLoading(false); }
    };

    const handleStartEdit = () => {
        if (selectedItem) { setEditForm({ ...selectedItem }); setIsEditing(true); setSaveStatus('idle'); }
    };

    const handleSave = async () => {
        if (!editForm) return;
        setIsSaving(true); setSaveStatus('idle');
        try {
            const res = await fetch('/api/save-to-sheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ results: [editForm] })
            });
            if (res.ok) {
                setSaveStatus('success');
                setTimeout(() => { setIsEditing(false); setSelectedItem(editForm); fetchLibrary(); }, 1000);
            } else { setSaveStatus('error'); }
        } catch { setSaveStatus('error'); }
        finally { setIsSaving(false); }
    };

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            const res = await fetch('/api/backup', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) alert(`✅ Backup Created: ${data.message}`);
            else alert(`❌ Backup Failed: ${data.error}`);
        } catch (e: any) { alert(e.message); }
        finally { setIsBackingUp(false); }
    };

    const openRestoreMenu = async () => {
        setIsLoadingBackups(true); setShowRestoreMenu(true);
        try {
            const res = await fetch('/api/backups', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setBackups(data.backups || []);
        } catch (e) { console.error(e); }
        finally { setIsLoadingBackups(false); }
    };

    const handleRestore = async (sheetName: string) => {
        const displayName = sheetName === 'latest' ? '最新のバックアップ' : sheetName;
        if (!confirm(`警告：現在のライブラリを「${displayName}」で上書きします。よろしいですか？`)) return;
        setIsRestoring(true); setShowRestoreMenu(false);
        try {
            const res = await fetch('/api/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ sheetName })
            });
            if (res.ok) { alert('✅ Restore Successful!'); fetchLibrary(); }
            else { const d = await res.json(); alert(`❌ Restore Failed: ${d.error}`); }
        } catch (e: any) { alert(e.message); }
        finally { setIsRestoring(false); }
    };

    const isNamItem = (item: LibraryItem) => item.originalName.toLowerCase().endsWith('.nam');

    const filteredItems = items
        .filter(item => {
            const query = searchQuery.toLowerCase();
            const nam = isNamItem(item);
            const ir = !nam;
            if (!showNam && nam) return false;
            if (!showIr && ir) return false;
            return (
                item.amp.toLowerCase().includes(query) ||
                item.cabinet.toLowerCase().includes(query) ||
                item.mic.toLowerCase().includes(query) ||
                item.userMemo.toLowerCase().includes(query) ||
                item.author.toLowerCase().includes(query) ||
                item.originalName.toLowerCase().includes(query)
            );
        })
        .sort((a, b) => {
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            let fA: any, fB: any;
            const getName = (i: LibraryItem) => isNamItem(i) ? (i.amp || 'Unknown') : (i.cabinet || 'Unknown');
            switch (sortConfig.key) {
                case 'name': fA = getName(a); fB = getName(b); break;
                case 'date': fA = new Date(a.date).getTime(); fB = new Date(b.date).getTime(); break;
                case 'rate': fA = a.rate || 0; fB = b.rate || 0; break;
                case 'author': fA = (a.author || '').toLowerCase(); fB = (b.author || '').toLowerCase(); break;
                default: fA = (a as any)[sortConfig.key] || ''; fB = (b as any)[sortConfig.key] || '';
            }
            if (fA === fB) return 0;
            return (fA > fB ? 1 : -1) * dir;
        });

    const renderStars = (rate: number, size = "w-3 h-3", interactive = false) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s}
                    onClick={() => interactive && editForm && setEditForm({ ...editForm, rate: s })}
                    className={`${size} ${s <= rate ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-600'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                />
            ))}
        </div>
    );

    // NAM/IR card theme
    const cardTheme = (nam: boolean) => nam
        ? {
            border: 'border-indigo-500/20 hover:border-indigo-500/50',
            bg: 'bg-indigo-500/5 hover:bg-indigo-500/10',
            glow: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.12)]',
            badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
            icon: <Zap className="w-3 h-3 text-indigo-400" />,
            accent: 'text-indigo-300',
        }
        : {
            border: 'border-emerald-500/20 hover:border-emerald-500/50',
            bg: 'bg-emerald-500/5 hover:bg-emerald-500/10',
            glow: 'hover:shadow-[0_0_20px_rgba(52,211,153,0.12)]',
            badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
            icon: <Waves className="w-3 h-3 text-emerald-400" />,
            accent: 'text-emerald-300',
        };

    return (
        <div className="space-y-5">

            {/* ── Restore Modal ── */}
            {showRestoreMenu && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowRestoreMenu(false)}>
                    <div className="bg-neutral-900 border border-neutral-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
                            <h3 className="text-white font-bold flex items-center gap-2 text-sm">
                                <RotateCcw className="w-4 h-4 text-rose-400" /> Restore Library
                            </h3>
                            <button onClick={() => setShowRestoreMenu(false)} className="text-neutral-500 hover:text-white p-1"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-3 space-y-1.5">
                            <button onClick={() => handleRestore('latest')}
                                className="w-full flex items-center justify-between p-4 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl border border-indigo-500/20 text-indigo-400 transition-all group">
                                <div>
                                    <div className="font-bold text-sm">最新のもの（自動）</div>
                                    <div className="text-[10px] text-indigo-400/60 mt-0.5">Latest backup sheet</div>
                                </div>
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                            <div className="px-2 py-2 text-[9px] uppercase font-bold text-neutral-600 tracking-widest">Recent Backups</div>
                            {isLoadingBackups
                                ? <div className="flex justify-center py-6"><Loader2 className="animate-spin text-neutral-600 w-5 h-5" /></div>
                                : backups.length === 0
                                    ? <p className="text-xs text-neutral-600 text-center py-4">No backups found.</p>
                                    : backups.map(b => (
                                        <button key={b} onClick={() => handleRestore(b)}
                                            className="w-full flex items-center justify-between p-3 hover:bg-neutral-800 rounded-xl text-neutral-300 transition-all group border border-transparent hover:border-neutral-700">
                                            <span className="text-left font-mono text-xs">{b}</span>
                                            <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white" />
                                        </button>
                                    ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* ── Detail Modal ── */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => { setSelectedItem(null); setIsEditing(false); }}>
                    <div className="bg-neutral-800 border border-neutral-700 w-full max-w-2xl max-h-[95vh] rounded-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

                        {/* Modal Header — restructured per spec */}
                        <div className="px-6 pt-5 pb-4 border-b border-neutral-700 bg-neutral-800/80">
                            {/* Row 1: Type badge + Stars | Edit + Close */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    {isEditing ? (
                                        <select
                                            value={TYPE_OPTIONS.find(o => o.toUpperCase() === (editForm?.type || '').toUpperCase()) || editForm?.type || ''}
                                            onChange={e => editForm && setEditForm({ ...editForm, type: e.target.value })}
                                            className="bg-neutral-900 border border-neutral-600 rounded-lg px-2 py-1 text-[11px] font-bold text-white outline-none focus:border-indigo-500"
                                        >
                                            {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                        </select>
                                    ) : (
                                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${isNamItem(selectedItem) ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                            {isNamItem(selectedItem) ? <Zap className="w-3 h-3" /> : <Waves className="w-3 h-3" />}
                                            {selectedItem.type || (isNamItem(selectedItem) ? 'NAM' : 'IR')}
                                        </span>
                                    )}
                                    {renderStars(isEditing ? (editForm?.rate || 0) : selectedItem.rate, "w-4 h-4", isEditing)}
                                </div>
                                <div className="flex items-center gap-1">
                                    {!isEditing
                                        ? <button onClick={handleStartEdit} className="p-2 hover:bg-neutral-700 rounded-full text-neutral-400 transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                                        : <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-xs font-bold text-white transition-all">Cancel</button>
                                    }
                                    <button onClick={() => { setSelectedItem(null); setIsEditing(false); }} className="p-2 hover:bg-neutral-700 rounded-full text-neutral-400 transition-colors"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                            {/* Row 2: Title full-width */}
                            {isEditing ? (
                                <input
                                    value={editForm?.amp || ''}
                                    placeholder="Amp / Main Name"
                                    onChange={e => editForm && setEditForm({ ...editForm, amp: e.target.value })}
                                    className="text-xl font-bold bg-neutral-900 border border-neutral-600 rounded-lg px-3 py-1.5 text-white w-full outline-none focus:border-indigo-500 mb-2"
                                />
                            ) : (
                                <h2 className="text-xl font-bold text-white leading-snug mb-2 break-words">
                                    {selectedItem.amp || selectedItem.originalName}
                                </h2>
                            )}
                            {/* Row 3: Filename, Author, Source */}
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                                <span className="text-neutral-600 font-mono truncate max-w-[200px]">{selectedItem.originalName}</span>
                                <div className="flex items-center gap-1 text-neutral-400">
                                    <User className="w-3 h-3 text-neutral-600" />
                                    {selectedItem.author || 'Unknown Author'}
                                </div>
                                {selectedItem.sourceUrl && (
                                    <a href={selectedItem.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400 hover:underline">
                                        <Globe className="w-3 h-3" /> Source <ExternalLink className="w-2.5 h-2.5" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Gear Details */}
                                <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-700/50 space-y-2.5 text-sm">
                                    <h3 className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest mb-3">Gear Details</h3>
                                    {[
                                        { label: 'Amp', field: 'amp' as const },
                                        { label: 'Model', field: 'model' as const },
                                        { label: 'Cabinet', field: 'cabinet' as const },
                                        { label: 'Mic', field: 'mic' as const },
                                        { label: 'Author', field: 'author' as const },
                                    ].map(({ label, field }) => (
                                        <div key={field} className="flex justify-between items-center gap-2">
                                            <span className="text-neutral-500 shrink-0">{label}:</span>
                                            {isEditing
                                                ? <input value={editForm?.[field] || ''} onChange={e => editForm && setEditForm({ ...editForm, [field]: e.target.value })} className="bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-right text-neutral-200 w-2/3 text-xs outline-none focus:border-indigo-500" />
                                                : <span className="text-neutral-300 truncate text-right">{selectedItem[field] || '-'}</span>
                                            }
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center gap-2 pt-1 border-t border-neutral-700/30">
                                        <span className="text-neutral-500 shrink-0">Source:</span>
                                        {isEditing
                                            ? <input value={editForm?.sourceUrl || ''} onChange={e => editForm && setEditForm({ ...editForm, sourceUrl: e.target.value })} className="bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-right text-neutral-200 w-2/3 text-xs outline-none focus:border-indigo-500" />
                                            : selectedItem.sourceUrl
                                                ? <a href={selectedItem.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1 text-xs truncate max-w-[160px]">Link <ExternalLink className="w-3 h-3" /></a>
                                                : <span className="text-neutral-600">-</span>
                                        }
                                    </div>
                                </div>
                                {/* User Memo */}
                                <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/10 h-full">
                                    <h3 className="text-[10px] uppercase font-bold text-yellow-500/70 mb-2 tracking-widest flex items-center gap-1.5"><Tag className="w-3 h-3" /> User Memo</h3>
                                    {isEditing
                                        ? <textarea value={editForm?.userMemo || ''} onChange={e => editForm && setEditForm({ ...editForm, userMemo: e.target.value })} className="w-full h-28 bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-sm text-neutral-200 resize-none outline-none focus:border-yellow-500/50" />
                                        : <p className="text-sm text-neutral-300 italic leading-relaxed">{selectedItem.userMemo || 'No notes.'}</p>
                                    }
                                </div>
                            </div>
                            {/* Capture Info */}
                            <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-700/60 shadow-inner">
                                <h3 className="text-[10px] uppercase font-bold text-neutral-500 mb-3 tracking-widest flex items-center gap-2"><Info className="w-3.5 h-3.5 text-indigo-400" /> Capture Info</h3>
                                {isEditing ? (
                                    <textarea
                                        value={editForm?.captureInfo || ''}
                                        onChange={e => editForm && setEditForm({ ...editForm, captureInfo: e.target.value })}
                                        className="w-full min-h-[120px] bg-neutral-950/60 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-200 font-mono leading-relaxed resize-y outline-none focus:border-indigo-500/60 placeholder:text-neutral-600"
                                        placeholder="Paste capture settings, gear chain, or notes here..."
                                    />
                                ) : (
                                    <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800 text-xs text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed min-h-[48px]">
                                        {selectedItem.captureInfo || <span className="text-neutral-600 italic">No detailed info available.</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        {isEditing && (
                            <div className="px-6 py-4 border-t border-neutral-700 bg-neutral-900/50 flex justify-end">
                                <button onClick={handleSave} disabled={isSaving}
                                    className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-sm transition-all shadow-lg ${saveStatus === 'success' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95'}`}>
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saveStatus === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                                    {saveStatus === 'success' ? 'Saved!' : 'Save Changes'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Main Controls ── */}
            <div className="flex flex-col gap-3 bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                {/* Row 1: Search bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input type="text" placeholder="Search amps, cabs, authors, memos..." value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-500 transition-all placeholder:text-neutral-600" />
                </div>

                {/* Row 2: Filters + Sort + Actions + View toggle — all in one flex-wrap row */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* NAM/IR toggles */}
                    <div className="flex items-center gap-3 bg-neutral-900/60 px-3 py-1.5 rounded-lg border border-neutral-700/30">
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-indigo-400 select-none">
                            <input type="checkbox" checked={showNam} onChange={e => setShowNam(e.target.checked)} className="accent-indigo-500" /> NAM
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-emerald-400 select-none">
                            <input type="checkbox" checked={showIr} onChange={e => setShowIr(e.target.checked)} className="accent-emerald-500" /> IR
                        </label>
                    </div>

                    {/* Sort */}
                    <div className="flex items-center gap-1.5">
                        <SortAsc className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                        <select value={`${sortConfig.key}-${sortConfig.direction}`}
                            onChange={e => { const [k, d] = e.target.value.split('-'); setSortConfig({ key: k, direction: d as 'asc' | 'desc' }); }}
                            className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-neutral-200 outline-none cursor-pointer">
                            <option value="rate-desc">Rating ▼</option>
                            <option value="date-desc">Newest</option>
                            <option value="name-asc">Name A-Z</option>
                            <option value="author-asc">Author A-Z</option>
                        </select>
                    </div>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Backup / Restore / Refresh */}
                    <button onClick={handleBackup} disabled={isBackingUp} title="Backup" className="p-2 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-all text-indigo-400 disabled:opacity-40">
                        {isBackingUp ? <Loader2 className="animate-spin w-4 h-4" /> : <CloudUpload className="w-4 h-4" />}
                    </button>
                    <button onClick={openRestoreMenu} disabled={isRestoring} title="Restore" className="p-2 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-all text-rose-400 disabled:opacity-40">
                        {isRestoring ? <Loader2 className="animate-spin w-4 h-4" /> : <CloudDownload className="w-4 h-4" />}
                    </button>
                    <button onClick={fetchLibrary} title="Refresh" className="p-2 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-all text-neutral-400">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* View mode */}
                    <div className="flex gap-1 ml-1 bg-neutral-900/60 p-1 rounded-lg border border-neutral-700/30">
                        <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:text-white'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:text-white'}`}><List className="w-3.5 h-3.5" /></button>
                    </div>
                </div>

                {/* Item count */}
                <div className="text-[10px] text-neutral-600 font-mono">{filteredItems.length} items</div>
            </div>

            {/* ── Content ── */}
            {isLoading ? (
                <div className="flex justify-center py-24"><Loader2 className="animate-spin text-indigo-500 w-10 h-10" /></div>
            ) : filteredItems.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-neutral-700 rounded-2xl text-neutral-500 space-y-3">
                    <Database className="mx-auto w-10 h-10 text-neutral-700" />
                    <p className="text-sm">No items found.</p>
                </div>
            ) : viewMode === 'grid' ? (
                /* ── Grid ── */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredItems.map((item, i) => {
                        const nam = isNamItem(item);
                        const t = cardTheme(nam);
                        return (
                            <div key={i} onClick={() => setSelectedItem(item)}
                                className={`border p-5 rounded-xl transition-all cursor-pointer group active:scale-[0.98] ${t.border} ${t.bg} ${t.glow}`}>
                                {/* Card Header */}
                                <div className="flex justify-between items-center mb-3">
                                    <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${t.badge}`}>
                                        {t.icon}
                                        {item.type || (nam ? 'NAM' : 'IR')}
                                    </span>
                                    {renderStars(item.rate)}
                                </div>
                                {/* Title */}
                                <h3 className={`text-base font-bold text-white group-hover:${t.accent} truncate mb-1 transition-colors`}>
                                    {nam ? (item.amp || item.originalName) : (item.cabinet || item.amp || item.originalName)}
                                </h3>
                                {/* Model — only when meaningful */}
                                {item.model && item.model.toLowerCase() !== 'unknown' && (
                                    <p className="text-[11px] text-neutral-500 truncate mb-2 font-mono">{item.model}</p>
                                )}
                                {/* Date + Author */}
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="flex items-center gap-1 text-[10px] text-neutral-500">
                                        <Calendar className="w-3 h-3" /> {item.date}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-neutral-500 truncate">
                                        <User className="w-3 h-3 text-neutral-600" /> {item.author || 'Unknown'}
                                    </div>
                                </div>
                                {/* Cab + Mic */}
                                <div className="space-y-1.5 border-t border-white/5 pt-3">
                                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 truncate">
                                        <Speaker className="w-3 h-3 text-indigo-400/70 shrink-0" />
                                        <span className="text-neutral-600 shrink-0">Cab:</span>
                                        <span className="truncate">{item.cabinet || 'Direct'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 truncate">
                                        <Mic className="w-3 h-3 text-emerald-400/70 shrink-0" />
                                        <span className="text-neutral-600 shrink-0">Mic:</span>
                                        <span className="truncate">{item.mic || '—'}</span>
                                    </div>
                                </div>
                                {/* Memo preview */}
                                {item.userMemo && (
                                    <div className="mt-3 px-2.5 py-2 bg-black/20 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                                        <p className="text-[10px] text-neutral-500 italic line-clamp-2 leading-relaxed">"{item.userMemo}"</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* ── List / Table (enhanced) ── */
                <div className="overflow-x-auto rounded-xl border border-neutral-700/50 bg-neutral-800/20">
                    <table className="w-full text-left text-sm min-w-[760px]">
                        <thead className="bg-neutral-900/50 text-neutral-500 uppercase text-[10px] font-bold tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Rate</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Name</th>
                                <th className="px-4 py-3 hidden md:table-cell">Author</th>
                                <th className="px-4 py-3 hidden lg:table-cell">Memo</th>
                                <th className="px-4 py-3">Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item, i) => {
                                const nam = isNamItem(item);
                                return (
                                    <tr key={i} onClick={() => setSelectedItem(item)}
                                        className="border-b border-neutral-700/20 hover:bg-neutral-700/20 cursor-pointer transition-colors group">
                                        <td className="px-4 py-3">{renderStars(item.rate)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg w-fit ${nam ? 'bg-indigo-500/15 text-indigo-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                                                {nam ? <Zap className="w-2.5 h-2.5" /> : <Waves className="w-2.5 h-2.5" />}
                                                {item.type || (nam ? 'NAM' : 'IR')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-white group-hover:text-indigo-300 transition-colors max-w-[180px] truncate">
                                            {nam ? (item.amp || item.originalName) : (item.cabinet || item.amp || item.originalName)}
                                        </td>
                                        <td className="px-4 py-3 text-neutral-400 hidden md:table-cell max-w-[120px] truncate">{item.author || '—'}</td>
                                        <td className="px-4 py-3 text-neutral-500 hidden lg:table-cell max-w-[200px]">
                                            {item.userMemo
                                                ? <span className="italic text-xs line-clamp-1">{item.userMemo}</span>
                                                : <span className="text-neutral-700">—</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-neutral-500 font-mono text-xs whitespace-nowrap">{item.date}</td>
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