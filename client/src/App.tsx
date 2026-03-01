import { useState } from 'react';
import { FileUploader } from './components/FileUploader';
import { AnalysisResultList } from './components/AnalysisResultList';
import { LibraryView } from './components/LibraryView';
import type { AnalysisResult } from './types';
import { PlusCircle, Database } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'library'>('analyzer');
  const [results, setResults] = useState<AnalysisResult[]>([]);

  const handleResultUpdate = (id: string, updates: Partial<AnalysisResult>) => {
    setResults(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans p-8 flex flex-col items-center">
      <header className="mb-12 text-center w-full max-w-4xl pt-10">
        <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400 mb-4 inline-block drop-shadow-lg">
          NAMIR
        </h1>
        <p className="text-xl text-neutral-400 font-light">
          Neural Amp Modeler & Impulse Response Manager
        </p>
      </header>

      <main className="w-full max-w-6xl flex flex-col gap-8">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-4">
          <div className="bg-neutral-800 p-1.5 rounded-xl border border-neutral-700/50 flex gap-2 shadow-lg">
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'analyzer'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50'
                }`}
            >
              <PlusCircle className="w-4 h-4" />
              Analyzer
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'library'
                ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(5,150,105,0.4)]'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50'
                }`}
            >
              <Database className="w-4 h-4" />
              Library
            </button>
          </div>
        </div>

        {activeTab === 'analyzer' ? (
          <div className="flex flex-col items-center gap-8 animate-in fade-in duration-500">
            <section className="w-full bg-neutral-800/50 p-6 rounded-2xl border border-neutral-700/50 shadow-2xl backdrop-blur-sm">
              <FileUploader onResults={(newResults) => setResults(prev => [...newResults, ...prev])} />
            </section>

            {results.length > 0 && (
              <section className="w-full mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-semibold border-b border-indigo-500/30 pb-2 flex-grow">
                    Parsed Metadata
                  </h2>
                  <button
                    onClick={() => setResults([])}
                    className="ml-4 px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors border border-red-500/20"
                  >
                    Clear All
                  </button>
                </div>
                <AnalysisResultList
                  results={results}
                  onUpdate={handleResultUpdate}
                />
              </section>
            )}
          </div>
        ) : (
          <div className="animate-in fade-in duration-500 overflow-visible">
            <section className="w-full max-w-6xl mx-auto">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <Database className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold text-white">Your Library</h2>
                  <p className="text-neutral-500 text-sm">Stored records from Google Spreadsheet</p>
                </div>
              </div>
              <LibraryView />
            </section>
          </div>
        )}
      </main>

      <footer className="mt-auto pt-16 pb-8 text-neutral-500 text-sm w-full text-center">
        Powered by ToneHunt & NAMIR Engine
      </footer>
    </div>
  );
}

export default App;
