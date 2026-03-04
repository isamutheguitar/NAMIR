import { useState, useEffect } from 'react';
import { BookOpen, X, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import type { CustomDictItem } from '../types';

interface DictionaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    token: string;
}

export const DictionaryModal = ({ isOpen, onClose, token }: DictionaryModalProps) => {
    const [items, setItems] = useState<CustomDictItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // New item draft
    const [newEntries, setNewEntries] = useState<{ category: string, keyword: string, name: string }[]>(
        Array(5).fill({ category: 'Amp', keyword: '', name: '' })
    );

    const updateEntry = (index: number, field: 'category' | 'keyword' | 'name', value: string) => {
        const newArr = [...newEntries];
        newArr[index] = { ...newArr[index], [field]: value };
        setNewEntries(newArr);
    };

    useEffect(() => {
        if (isOpen) {
            fetchDictionary();
        }
    }, [isOpen]);

    const fetchDictionary = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/dictionary', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data.items || []);
            }
        } catch (error) {
            console.error('Failed to fetch dictionary', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/dictionary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ items })
            });
            if (res.ok) {
                alert('Dictionary Saved successfully!');
                onClose();
            } else {
                alert('Failed to save. Check console.');
            }
        } catch (error) {
            console.error('Failed to save dictionary', error);
            alert('Failed to save. Check console.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleAddItem = () => {
        const validEntries = newEntries.filter(e => e.keyword.trim() && e.name.trim());
        if (validEntries.length === 0) return;

        const addedItems: CustomDictItem[] = validEntries.map(e => ({
            id: Date.now().toString() + Math.random().toString(),
            category: e.category,
            keyword: e.keyword.trim(),
            name: e.name.trim()
        }));

        setItems([...addedItems, ...items]);
        setNewEntries(Array(5).fill({ category: 'Amp', keyword: '', name: '' }));
    };

    const handleDeleteItem = (id?: string) => {
        setItems(items.filter(item => item.id !== id));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-neutral-900 border border-neutral-700/50 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-neutral-900/50">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                        <BookOpen className="w-6 h-6" /> Custom Dictionary
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
                    <p className="text-sm text-neutral-400 mb-6">
                        Define custom matching rules for file names. Example: [Category: Amp] [Keyword: friedman, be100] [Name: Friedman BE-100]
                    </p>

                    {/* Add New */}
                    <div className="bg-neutral-800/50 p-4 rounded-xl border border-neutral-700/50 mb-6 flex flex-col gap-3">
                        <div className="hidden sm:grid grid-cols-[140px_1fr_1fr] gap-3 mb-1 px-1">
                            <label className="text-[10px] uppercase font-bold text-neutral-500">Category</label>
                            <label className="text-[10px] uppercase font-bold text-neutral-500">Keywords (comma sep.)</label>
                            <label className="text-[10px] uppercase font-bold text-neutral-500">Mapped Name</label>
                        </div>

                        {newEntries.map((entry, i) => (
                            <div key={i} className="grid grid-cols-1 sm:grid-cols-[140px_1fr_1fr] gap-3 p-3 sm:p-0 bg-neutral-900/30 sm:bg-transparent rounded-lg border border-neutral-700/30 sm:border-none">
                                <div className="flex flex-col gap-1 sm:hidden">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Category</label>
                                </div>
                                <select
                                    value={entry.category}
                                    onChange={(e) => updateEntry(i, 'category', e.target.value)}
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none text-neutral-200"
                                >
                                    <option value="Amp">Amp</option>
                                    <option value="Model">Model</option>
                                    <option value="Cabinet">Cabinet</option>
                                    <option value="Mic">Mic</option>
                                </select>

                                <div className="flex flex-col gap-1 sm:hidden">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Keywords (comma sep.)</label>
                                </div>
                                <input
                                    type="text"
                                    value={entry.keyword}
                                    onChange={(e) => updateEntry(i, 'keyword', e.target.value)}
                                    placeholder={i === 0 ? "e.g., be100, friedman" : ""}
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none w-full text-neutral-200"
                                />

                                <div className="flex flex-col gap-1 sm:hidden">
                                    <label className="text-[10px] uppercase font-bold text-neutral-500">Mapped Name</label>
                                </div>
                                <input
                                    type="text"
                                    value={entry.name}
                                    onChange={(e) => updateEntry(i, 'name', e.target.value)}
                                    placeholder={i === 0 ? "e.g., Friedman BE-100" : ""}
                                    className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:border-indigo-500 outline-none w-full text-neutral-200"
                                />
                            </div>
                        ))}

                        <div className="flex justify-end mt-2">
                            <button
                                onClick={handleAddItem}
                                disabled={!newEntries.some(e => e.keyword.trim() && e.name.trim())}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg px-5 py-2 text-sm font-bold flex items-center justify-center gap-2 transition-colors h-[38px]"
                            >
                                <Plus className="w-4 h-4" /> Add Entries
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                        </div>
                    ) : items.length === 0 ? (
                        <div className="text-center p-8 text-neutral-500 border border-dashed border-neutral-700 rounded-xl">
                            No custom dictionary items yet.
                        </div>
                    ) : (
                        <div className="bg-neutral-800 border border-neutral-700 rounded-xl overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-neutral-900/80 text-neutral-400 text-xs uppercase font-bold w-full">
                                    <tr>
                                        <th className="px-4 py-3">Category</th>
                                        <th className="px-4 py-3">Keywords</th>
                                        <th className="px-4 py-3">Mapped Name</th>
                                        <th className="px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-700/50">
                                    {items.map(item => (
                                        <tr key={item.id} className="hover:bg-neutral-700/20 transition-colors">
                                            <td className="px-4 py-3">
                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                                    ${item.category === 'Amp' ? 'bg-indigo-500/20 text-indigo-300' :
                                                        item.category === 'Model' ? 'bg-orange-500/20 text-orange-300' :
                                                            item.category === 'Cabinet' ? 'bg-emerald-500/20 text-emerald-300' :
                                                                'bg-blue-500/20 text-blue-300'
                                                    }
                                                `}>
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-neutral-300 whitespace-pre-wrap">{item.keyword}</td>
                                            <td className="px-4 py-3 text-neutral-200">{item.name}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="p-1.5 hover:bg-red-500/20 text-neutral-500 hover:text-red-400 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-neutral-800 bg-neutral-900/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};
