import { useState, useEffect } from 'react';
import type { LibraryItem, GearSpec } from '../types';
import {
    Search, Database, Tag, SortAsc, Loader2, Star, X, Info, LayoutGrid, List, RotateCcw,
    CloudUpload, CloudDownload, RefreshCw, ChevronRight, Edit3, Save, CheckCircle2,
    Calendar, User, Speaker, Mic, ExternalLink, Globe, Zap, Waves, Cpu,
    AlertTriangle, Copy
} from 'lucide-react';
import { GearFilterModal, loadSavedGearIds } from './GearFilterModal';

interface LibraryViewProps { token: string; }

const TYPE_OPTIONS = ["Full Rig", "Amp Only", "Cab Only", "Pedal", "IR", "Unknown"];

export const LibraryView = ({ token }: LibraryViewProps) => {
    const [activeTab, setActiveTab] = useState<'nam' | 'ir'>('nam');
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
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
    const [showGearFilter, setShowGearFilter] = useState(false);
    const [selectedGearIds, setSelectedGearIds] = useState<string[]>(loadSavedGearIds);
    const [gearList, setGearList] = useState<GearSpec[]>([]);

    useEffect(() => { fetchLibrary(); }, []);

    useEffect(() => {
        if (activeTab === 'ir') fetchGearList();
    }, [activeTab]);

    const fetchLibrary = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/get-library', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.items) setItems(data.items);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
    };

    const fetchGearList = async () => {
        try {
            const res = await fetch('/api/gear-dictionary', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            setGearList(data.items || []);
        } catch (e) { console.error(e); }
    };

    const isNamItem = (item: LibraryItem) => item.originalName.toLowerCase().endsWith('.nam');

    const namItems = items.filter(isNamItem);
    const irItems = items.filter(item => !isNamItem(item));

    /** IR機材フィルタ用のスペック集約 */
    const activGearSpecs: GearSpec[] = gearList.filter(g => selectedGearIds.includes(g.id ?? ''));

    const irMatchesGear = (item: LibraryItem): boolean => {
        if (activGearSpecs.length === 0) return true;
        return activGearSpecs.some(g => {
            const srOk = !item.sampleRate || item.sampleRate === g.requireSampleRate;
            const bdOk = !item.bitDepth || item.bitDepth <= g.maxBitDepth;
            return srOk && bdOk;
        });
    };

    const irHasLengthWarning = (item: LibraryItem): { warn: boolean; gearName: string } => {
        if (activGearSpecs.length === 0 || !item.lengthMs) return { warn: false, gearName: '' };
        for (const g of activGearSpecs) {
            if (item.lengthMs > g.maxLengthMs) return { warn: true, gearName: g.name };
        }
        return { warn: false, gearName: '' };
    };

    const applyFilters = (list: LibraryItem[]) => list
        .filter(item => {
            const q = searchQuery.toLowerCase();
            return (
                item.amp.toLowerCase().includes(q) ||
                item.cabinet.toLowerCase().includes(q) ||
                item.mic.toLowerCase().includes(q) ||
                item.userMemo.toLowerCase().includes(q) ||
                item.author.toLowerCase().includes(q) ||
                item.originalName.toLowerCase().includes(q)
            );
        })
        .sort((a, b) => {
            const dir = sortConfig.direction === 'asc' ? 1 : -1;
            let fA: any, fB: any;
            switch (sortConfig.key) {
                case 'name': fA = a.amp || a.cabinet || ''; fB = b.amp || b.cabinet || ''; break;
                case 'filename': fA = a.originalName.toLowerCase(); fB = b.originalName.toLowerCase(); break;
                case 'date': fA = new Date(a.date).getTime(); fB = new Date(b.date).getTime(); break;
                case 'rate': fA = a.rate || 0; fB = b.rate || 0; break;
                default: fA = (a as any)[sortConfig.key] || ''; fB = (b as any)[sortConfig.key] || '';
            }
            return fA === fB ? 0 : (fA > fB ? 1 : -1) * dir;
        });

    const filteredNam = applyFilters(namItems);
    const filteredIr = applyFilters(irItems.filter(irMatchesGear));

    // ─── Handlers ───
    const handleStartEdit = () => { if (selectedItem) { setEditForm({ ...selectedItem }); setIsEditing(true); setSaveStatus('idle'); } };

    const handleSave = async () => {
        if (!editForm) return;
        setIsSaving(true); setSaveStatus('idle');
        try {
            const res = await fetch('/api/save-to-sheet', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ results: [editForm] })
            });
            if (res.ok) { setSaveStatus('success'); setTimeout(() => { setIsEditing(false); setSelectedItem(editForm); fetchLibrary(); }, 1000); }
            else setSaveStatus('error');
        } catch { setSaveStatus('error'); }
        finally { setIsSaving(false); }
    };

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            const res = await fetch('/api/backup', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok) alert(`✅ Backup Created: ${data.message}`); else alert(`❌ Backup Failed: ${data.error}`);
        } catch (e: any) { alert(e.message); }
        finally { setIsBackingUp(false); }
    };

    const openRestoreMenu = async () => {
        setIsLoadingBackups(true); setShowRestoreMenu(true);
        try {
            const res = await fetch('/api/backups', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json(); setBackups(data.backups || []);
        } catch (e) { console.error(e); }
        finally { setIsLoadingBackups(false); }
    };

    const handleRestore = async (sheetName: string) => {
        const displayName = sheetName === 'latest' ? 'Latest Backup' : sheetName;
        if (!confirm(`Warning: This will overwrite the current library with "${displayName}". Are you sure?`)) return;
        setIsRestoring(true); setShowRestoreMenu(false);
        try {
            const res = await fetch('/api/restore', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ sheetName })
            });
            if (res.ok) { alert('✅ Restore Successful!'); fetchLibrary(); }
            else { const d = await res.json(); alert(`❌ Restore Failed: ${d.error}`); }
        } catch (e: any) { alert(e.message); }
        finally { setIsRestoring(false); }
    };

    const handleDirectRateUpdate = async (item: LibraryItem, newRate: number) => {
        const updated = { ...item, rate: newRate };
        setItems(prev => prev.map(i => i.originalName === item.originalName ? updated : i));
        if (selectedItem?.originalName === item.originalName) setSelectedItem(updated);
        try {
            const res = await fetch('/api/save-to-sheet', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ results: [updated] })
            });
            if (!res.ok) fetchLibrary();
        } catch { fetchLibrary(); }
    };


    // ─── Render helpers ───
    const renderStars = (rate: number, size = "w-3 h-3", onSelect?: (r: number) => void) => (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(s => (
                <Star key={s}
                    onClick={e => { if (onSelect) { e.stopPropagation(); onSelect(s); } }}
                    className={`${size} ${s <= rate ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-600'} ${onSelect ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
                />
            ))}
        </div>
    );

    const cardTheme = (nam: boolean) => nam
        ? { border: 'border-indigo-500/20 hover:border-indigo-500/50', bg: 'bg-indigo-500/5 hover:bg-indigo-500/10', glow: 'hover:shadow-[0_0_20px_rgba(99,102,241,0.12)]', badge: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30', icon: <Zap className="w-3 h-3 text-indigo-400" />, accent: 'text-indigo-300' }
        : { border: 'border-emerald-500/20 hover:border-emerald-500/50', bg: 'bg-emerald-500/5 hover:bg-emerald-500/10', glow: 'hover:shadow-[0_0_20px_rgba(52,211,153,0.12)]', badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', icon: <Waves className="w-3 h-3 text-emerald-400" />, accent: 'text-emerald-300' };

    const SortBar = () => (
        <div className="flex items-center gap-1.5">
            <SortAsc className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
            <select value={`${sortConfig.key}-${sortConfig.direction}`}
                onChange={e => { const [k, d] = e.target.value.split('-'); setSortConfig({ key: k, direction: d as 'asc' | 'desc' }); }}
                className="bg-neutral-900 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-neutral-200 outline-none cursor-pointer">
                <option value="rate-desc">Rating ▼</option>
                <option value="date-desc">Newest</option>
                <option value="name-asc">Name A-Z</option>
                <option value="filename-asc">File Name A-Z</option>
            </select>
        </div>
    );

    const ActionButtons = () => (
        <>
            <button onClick={handleBackup} disabled={isBackingUp} title="Backup" className="p-2 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-all text-indigo-400 disabled:opacity-40">
                {isBackingUp ? <Loader2 className="animate-spin w-4 h-4" /> : <CloudUpload className="w-4 h-4" />}
            </button>
            <button onClick={openRestoreMenu} disabled={isRestoring} title="Restore" className="p-2 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-all text-rose-400 disabled:opacity-40">
                {isRestoring ? <Loader2 className="animate-spin w-4 h-4" /> : <CloudDownload className="w-4 h-4" />}
            </button>
            <button onClick={fetchLibrary} title="Refresh" className="p-2 bg-neutral-700/50 hover:bg-neutral-600 rounded-lg transition-all text-neutral-400">
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
        </>
    );

    const ViewToggle = () => (
        <div className="flex gap-1 ml-1 bg-neutral-900/60 p-1 rounded-lg border border-neutral-700/30">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:text-white'}`}><LayoutGrid className="w-3.5 h-3.5" /></button>
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-neutral-500 hover:text-white'}`}><List className="w-3.5 h-3.5" /></button>
        </div>
    );

    // ─── Modals ───
    const RestoreModal = () => showRestoreMenu ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md" onClick={() => setShowRestoreMenu(false)}>
            <div className="bg-neutral-900 border border-neutral-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-neutral-700 flex justify-between items-center">
                    <h3 className="text-white font-bold flex items-center gap-2 text-sm"><RotateCcw className="w-4 h-4 text-rose-400" /> Restore Library</h3>
                    <button onClick={() => setShowRestoreMenu(false)} className="text-neutral-500 hover:text-white p-1"><X className="w-4 h-4" /></button>
                </div>
                <div className="p-3 space-y-1.5">
                    <button onClick={() => handleRestore('latest')} className="w-full flex items-center justify-between p-4 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-xl border border-indigo-500/20 text-indigo-400 transition-all group">
                        <div><div className="font-bold text-sm">Latest (Auto)</div><div className="text-[10px] text-indigo-400/60 mt-0.5">Latest backup sheet</div></div>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="px-2 py-2 text-[9px] uppercase font-bold text-neutral-600 tracking-widest">Recent Backups</div>
                    {isLoadingBackups ? <div className="flex justify-center py-6"><Loader2 className="animate-spin text-neutral-600 w-5 h-5" /></div>
                        : backups.length === 0 ? <p className="text-xs text-neutral-600 text-center py-4">No backups found.</p>
                            : backups.map(b => (
                                <button key={b} onClick={() => handleRestore(b)} className="w-full flex items-center justify-between p-3 hover:bg-neutral-800 rounded-xl text-neutral-300 transition-all group border border-transparent hover:border-neutral-700">
                                    <span className="text-left font-mono text-xs">{b}</span>
                                    <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-white" />
                                </button>
                            ))}
                </div>
            </div>
        </div>
    ) : null;

    type DetailModalProps = { item: LibraryItem };
    const DetailModal = ({ item }: DetailModalProps) => {
        const nam = isNamItem(item);
        const { warn, gearName } = irHasLengthWarning(item);
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => { setSelectedItem(null); setIsEditing(false); }}>
                <div className="bg-neutral-800 border border-neutral-700 w-full max-w-2xl max-h-[95vh] rounded-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="px-6 pt-5 pb-4 border-b border-neutral-700 bg-neutral-800/80">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                {isEditing ? (
                                    <select value={editForm?.type || ''} onChange={e => editForm && setEditForm({ ...editForm, type: e.target.value })}
                                        className="bg-neutral-900 border border-neutral-600 rounded-lg px-2 py-1 text-[11px] font-bold text-white outline-none focus:border-indigo-500">
                                        {TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : (
                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase ${nam ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                        {nam ? <Zap className="w-3 h-3" /> : <Waves className="w-3 h-3" />}
                                        {item.type || (nam ? 'NAM' : 'IR')}
                                    </span>
                                )}
                                {renderStars(isEditing ? (editForm?.rate || 0) : item.rate, "w-4 h-4",
                                    isEditing ? s => editForm && setEditForm({ ...editForm, rate: s }) : s => handleDirectRateUpdate(item, s)
                                )}
                                {/* Length警告マーク */}
                                {!nam && warn && (
                                    <span title={`⚠️ ${gearName}: Exceeds max length — tail will be cut on hardware`}
                                        className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-400 text-[10px] font-bold animate-pulse">
                                        <AlertTriangle className="w-3 h-3" /> Length Limit Warning
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                {!isEditing
                                    ? <button onClick={handleStartEdit} className="p-2 hover:bg-neutral-700 rounded-full text-neutral-400 transition-colors"><Edit3 className="w-4 h-4" /></button>
                                    : <button onClick={() => setIsEditing(false)} className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-xs font-bold text-white">Cancel</button>
                                }
                                <button onClick={() => { setSelectedItem(null); setIsEditing(false); }} className="p-2 hover:bg-neutral-700 rounded-full text-neutral-400"><X className="w-4 h-4" /></button>
                            </div>
                        </div>
                        {isEditing
                            ? <input value={editForm?.amp || ''} placeholder="Amp / Main Name" onChange={e => editForm && setEditForm({ ...editForm, amp: e.target.value })}
                                className="text-xl font-bold bg-neutral-900 border border-neutral-600 rounded-lg px-3 py-1.5 text-white w-full outline-none focus:border-indigo-500 mb-2" />
                            : <h2 className="text-xl font-bold text-white leading-snug mb-2 break-words">{item.amp || item.originalName}</h2>
                        }
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                            <span className="text-neutral-600 font-mono break-all">{item.originalName}</span>
                            <div className="flex items-center gap-1 text-neutral-400"><User className="w-3 h-3 text-neutral-600" />{item.author || 'Unknown'}</div>
                            {item.sourceUrl && (
                                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-indigo-400 hover:underline">
                                    <Globe className="w-3 h-3" /> Source <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Gear Details */}
                            <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-700/50 space-y-2.5 text-sm">
                                <h3 className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest mb-3">Gear Details</h3>
                                {([
                                    { label: 'Amp', field: 'amp' as const },
                                    { label: 'Model', field: 'model' as const },
                                    { label: 'Cabinet', field: 'cabinet' as const },
                                    { label: 'Mic', field: 'mic' as const },
                                    { label: 'Author', field: 'author' as const },
                                ]).map(({ label, field }) => (
                                    <div key={field} className="flex justify-between items-center gap-2">
                                        <span className="text-neutral-500 shrink-0">{label}:</span>
                                        {isEditing
                                            ? <input value={editForm?.[field] || ''} onChange={e => editForm && setEditForm({ ...editForm, [field]: e.target.value })} className="bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-right text-neutral-200 w-2/3 text-xs outline-none focus:border-indigo-500" />
                                            : <span className="text-neutral-300 truncate text-right">{item[field] || '-'}</span>
                                        }
                                    </div>
                                ))}
                                <div className="flex justify-between items-center gap-2 pt-1 border-t border-neutral-700/30">
                                    <span className="text-neutral-500 shrink-0">Source:</span>
                                    {isEditing
                                        ? <input value={editForm?.sourceUrl || ''} onChange={e => editForm && setEditForm({ ...editForm, sourceUrl: e.target.value })} className="bg-neutral-800 border border-neutral-700 rounded px-2 py-0.5 text-right text-neutral-200 w-2/3 text-xs outline-none focus:border-indigo-500" />
                                        : item.sourceUrl
                                            ? <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline flex items-center gap-1 text-xs truncate max-w-[160px]">Link <ExternalLink className="w-3 h-3" /></a>
                                            : <span className="text-neutral-600">-</span>
                                    }
                                </div>
                                <div className="flex justify-between items-center gap-2 pt-1 border-t border-neutral-700/30">
                                    <span className="text-neutral-500 shrink-0">FilePath:</span>
                                    {isEditing
                                        ? <input value={editForm?.filePath || ''} onChange={e => editForm && setEditForm({ ...editForm, filePath: e.target.value })} className="bg-neutral-800 border border-amber-500/20 rounded px-2 py-0.5 text-right text-amber-200/70 w-2/3 text-xs outline-none focus:border-amber-500/50" />
                                        : item.filePath
                                            ? <div className="flex items-center gap-2 overflow-hidden flex-1 justify-end">
                                                <span className="text-neutral-300 truncate text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700" title={item.filePath}>{item.filePath}</span>
                                                <button onClick={() => { navigator.clipboard.writeText(item.filePath!); alert('Copied File Path to clipboard!'); }}
                                                    className="shrink-0 flex items-center gap-1 text-[10px] px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded text-amber-400 transition-colors font-bold whitespace-nowrap">
                                                    <Copy className="w-3 h-3" /> File Path Copy
                                                </button>
                                              </div>
                                            : <span className="text-neutral-600">-</span>
                                    }
                                </div>

                            </div>
                            {/* User Memo */}
                            <div className="bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/10 h-full flex flex-col">
                                <h3 className="text-[10px] uppercase font-bold text-yellow-500/70 mb-2 tracking-widest flex items-center gap-1.5"><Tag className="w-3 h-3" /> User Memo</h3>
                                {isEditing
                                    ? <textarea value={editForm?.userMemo || ''} onChange={e => editForm && setEditForm({ ...editForm, userMemo: e.target.value })} className="w-full h-28 bg-neutral-900 border border-neutral-700 rounded-lg p-2.5 text-sm text-neutral-200 resize-none outline-none focus:border-yellow-500/50" />
                                    : <p className="text-sm text-neutral-300 italic leading-relaxed">{item.userMemo || 'No notes.'}</p>
                                }
                                {/* IRのWAVメタデータ */}
                                {!nam && (item.sampleRate || item.bitDepth || item.lengthMs) && (
                                    <div className="mt-3 pt-3 border-t border-yellow-500/10 space-y-1">
                                        <p className="text-[9px] uppercase font-bold text-neutral-600 tracking-widest">WAV Info</p>
                                        <div className="flex flex-wrap gap-2">
                                            {item.sampleRate && <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-mono">{item.sampleRate / 1000}kHz</span>}
                                            {item.bitDepth && <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] text-emerald-400 font-mono">{item.bitDepth}bit</span>}
                                            {item.lengthMs && (
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${warn ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'}`}>
                                                    {warn && '⚠️ '}{item.lengthMs}ms
                                                </span>
                                            )}
                                            {item.lengthSamples && <span className="px-2 py-0.5 bg-neutral-700/50 border border-neutral-600/30 rounded text-[10px] text-neutral-400 font-mono">{item.lengthSamples.toLocaleString()} samples</span>}
                                        </div>
                                        {warn && <p className="text-[10px] text-amber-500/80 mt-1">⚠️ Length Limit Warning: Exceeds max length for {gearName}.</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Capture Info */}
                        <div className="bg-neutral-900 p-4 rounded-xl border border-neutral-700/60 shadow-inner">
                            <h3 className="text-[10px] uppercase font-bold text-neutral-500 mb-3 tracking-widest flex items-center gap-2"><Info className="w-3.5 h-3.5 text-indigo-400" /> Capture Info</h3>
                            {isEditing
                                ? <textarea value={editForm?.captureInfo || ''} onChange={e => editForm && setEditForm({ ...editForm, captureInfo: e.target.value })} className="w-full min-h-[120px] bg-neutral-950/60 border border-neutral-700 rounded-lg p-3 text-xs text-neutral-200 font-mono leading-relaxed resize-y outline-none focus:border-indigo-500/60 placeholder:text-neutral-600" placeholder="Paste capture settings, gear chain, or notes here..." />
                                : <div className="bg-neutral-950/60 p-3 rounded-lg border border-neutral-800 text-xs text-neutral-300 whitespace-pre-wrap font-mono leading-relaxed min-h-[48px]">
                                    {item.captureInfo || <span className="text-neutral-600 italic">No detailed info available.</span>}
                                </div>
                            }
                        </div>
                    </div>
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
        );
    };

    // ─── Grid / List renderers ───
    const renderGrid = (list: LibraryItem[]) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((item, i) => {
                const nam = isNamItem(item);
                const t = cardTheme(nam);
                const { warn } = irHasLengthWarning(item);
                return (
                    <div key={i} onClick={() => setSelectedItem(item)}
                        className={`border p-5 rounded-xl transition-all cursor-pointer group active:scale-[0.98] ${t.border} ${t.bg} ${t.glow}`}>
                        <div className="flex justify-between items-center mb-3">
                            <div className="flex items-center gap-1.5">
                                <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${t.badge}`}>
                                    {t.icon}{item.type || (nam ? 'NAM' : 'IR')}
                                </span>
                                {!nam && warn && <span title="Exceeds max length"><AlertTriangle className="w-3.5 h-3.5 text-amber-400" /></span>}
                            </div>
                            {renderStars(item.rate)}
                        </div>
                        <h3 className={`text-base font-bold text-white truncate mb-1 transition-colors`}>
                            {nam ? (item.amp || item.originalName) : (item.cabinet || item.amp || item.originalName)}
                        </h3>
                        {item.model && item.model.toLowerCase() !== 'unknown' && (
                            <p className="text-[11px] text-neutral-500 truncate mb-2 font-mono">{item.model}</p>
                        )}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-1 text-[10px] text-neutral-500"><Calendar className="w-3 h-3" />{item.date}</div>
                            <div className="flex items-center gap-1 text-[10px] text-neutral-500 truncate"><User className="w-3 h-3 text-neutral-600" />{item.author || 'Unknown'}</div>
                        </div>
                        {!nam && (item.sampleRate || item.lengthMs) && (
                            <div className="flex gap-1.5 mb-2">
                                {item.sampleRate && <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded text-[9px] text-emerald-500 font-mono">{item.sampleRate / 1000}kHz</span>}
                                {item.bitDepth && <span className="px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/15 rounded text-[9px] text-emerald-500 font-mono">{item.bitDepth}bit</span>}
                                {item.lengthMs && <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${warn ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-emerald-500/10 border border-emerald-500/15 text-emerald-500'}`}>{item.lengthMs}ms</span>}
                            </div>
                        )}
                        <div className="space-y-1.5 border-t border-white/5 pt-3">
                            <div className="flex items-center gap-2 text-[11px] text-neutral-400 truncate">
                                <Speaker className="w-3 h-3 text-indigo-400/70 shrink-0" /><span className="text-neutral-600 shrink-0">Cab:</span><span className="truncate">{item.cabinet || 'Direct'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-neutral-400 truncate">
                                <Mic className="w-3 h-3 text-emerald-400/70 shrink-0" /><span className="text-neutral-600 shrink-0">Mic:</span><span className="truncate">{item.mic || '—'}</span>
                            </div>
                        </div>
                        {item.userMemo && (
                            <div className="mt-3 px-2.5 py-2 bg-black/20 rounded-lg border border-white/5 group-hover:border-white/10 transition-colors">
                                <p className="text-[10px] text-neutral-500 italic line-clamp-2">"{item.userMemo}"</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );

    const renderList = (list: LibraryItem[]) => (
        <div className="overflow-x-auto rounded-xl border border-neutral-700/50 bg-neutral-800/20">
            <table className="w-full text-left text-sm min-w-[760px]">
                <thead className="bg-neutral-900/50 text-neutral-500 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                        <th className="px-4 py-3">Rate</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">File Name</th>
                        <th className="px-4 py-3 hidden md:table-cell">Author</th>
                        <th className="px-4 py-3 hidden lg:table-cell">Memo</th>
                        <th className="px-4 py-3">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {list.map((item, i) => {
                        const nam = isNamItem(item);
                        const { warn } = irHasLengthWarning(item);
                        return (
                            <tr key={i} onClick={() => setSelectedItem(item)} className="border-b border-neutral-700/20 hover:bg-neutral-700/20 cursor-pointer transition-colors group">
                                <td className="px-4 py-3">{renderStars(item.rate)}</td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1">
                                        <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg w-fit ${nam ? 'bg-indigo-500/15 text-indigo-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                                            {nam ? <Zap className="w-2.5 h-2.5" /> : <Waves className="w-2.5 h-2.5" />}
                                            {item.type || (nam ? 'NAM' : 'IR')}
                                        </span>
                                        {!nam && warn && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                                    </div>
                                </td>
                                <td className="px-4 py-3 font-semibold text-white group-hover:text-indigo-300 transition-colors max-w-[150px] truncate">
                                    {nam ? (item.amp || item.originalName) : (item.cabinet || item.amp || item.originalName)}
                                </td>
                                <td className="px-4 py-3 text-neutral-400 font-mono text-xs max-w-[250px] break-all whitespace-normal">{item.originalName}</td>
                                <td className="px-4 py-3 text-neutral-400 hidden md:table-cell max-w-[120px] truncate">{item.author || '—'}</td>
                                <td className="px-4 py-3 text-neutral-500 hidden lg:table-cell max-w-[200px]">
                                    {item.userMemo ? <span className="italic text-xs line-clamp-1">{item.userMemo}</span> : <span className="text-neutral-700">—</span>}
                                </td>
                                <td className="px-4 py-3 text-neutral-500 font-mono text-xs whitespace-nowrap">{item.date}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    const currentList = activeTab === 'nam' ? filteredNam : filteredIr;

    return (
        <div className="space-y-5">
            <RestoreModal />
            {selectedItem && <DetailModal item={selectedItem} />}
            <GearFilterModal
                token={token} isOpen={showGearFilter}
                onClose={() => { setShowGearFilter(false); fetchGearList(); }}
                selectedGearIds={selectedGearIds}
                onSelectionChange={setSelectedGearIds}
            />

            {/* ── NAM / IR Tab ── */}
            <div className="flex gap-2 bg-neutral-800/50 p-1.5 rounded-xl border border-neutral-700/50 w-fit">
                <button onClick={() => setActiveTab('nam')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'nam' ? 'bg-indigo-600 text-white shadow-[0_0_12px_rgba(79,70,229,0.4)]' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50'}`}>
                    <Zap className="w-4 h-4" /> NAM <span className="text-[10px] opacity-60">({namItems.length})</span>
                </button>
                <button onClick={() => setActiveTab('ir')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ir' ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(5,150,105,0.4)]' : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50'}`}>
                    <Waves className="w-4 h-4" /> IR <span className="text-[10px] opacity-60">({irItems.length})</span>
                </button>
            </div>

            {/* ── Controls ── */}
            <div className="flex flex-col gap-3 bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:border-indigo-500 transition-all placeholder:text-neutral-600" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* IR専用フィルタボタン */}
                    {activeTab === 'ir' && (
                        <button onClick={() => setShowGearFilter(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${selectedGearIds.length > 0 ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-neutral-700/50 border-neutral-600/40 text-neutral-400 hover:text-white hover:bg-neutral-600'}`}>
                            <Cpu className="w-3.5 h-3.5" />
                            Gear Settings
                            {selectedGearIds.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-amber-500/30 rounded-full text-[9px]">{selectedGearIds.length}</span>}
                        </button>
                    )}
                    <SortBar />
                    <div className="flex-1" />
                    <ActionButtons />
                    <ViewToggle />
                </div>
                <div className="text-[10px] text-neutral-600 font-mono">{currentList.length} items</div>
            </div>

            {/* ── Content ── */}
            {isLoading ? (
                <div className="flex justify-center py-24"><Loader2 className="animate-spin text-indigo-500 w-10 h-10" /></div>
            ) : currentList.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-neutral-700 rounded-2xl text-neutral-500 space-y-3">
                    <Database className="mx-auto w-10 h-10 text-neutral-700" />
                    <p className="text-sm">No items found.</p>
                </div>
            ) : viewMode === 'grid' ? renderGrid(currentList) : renderList(currentList)}
        </div>
    );
};