import { useState, useEffect } from 'react';
import { FileUploader } from './components/FileUploader';
import { AnalysisResultList } from './components/AnalysisResultList';
import { LibraryView } from './components/LibraryView';
import { Login } from './components/Login';
import { DictionaryModal } from './components/DictionaryModal';
import type { AnalysisResult } from './types';
import { PlusCircle, Database, LogOut, User, Youtube, BookOpen } from 'lucide-react';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState<'analyzer' | 'library'>('analyzer');
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [token, setToken] = useState<string | null>(localStorage.getItem('namir_token'));
  const [user, setUser] = useState<any>(JSON.parse(localStorage.getItem('namir_user') || 'null'));
  const [isDictOpen, setIsDictOpen] = useState(false);

  useEffect(() => {
    if (token) {
      localStorage.setItem('namir_token', token);
    } else {
      localStorage.removeItem('namir_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('namir_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('namir_user');
    }
  }, [user]);

  const handleLogin = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('namir_token');
    localStorage.removeItem('namir_user');
  };

  const handleResultUpdate = (id: string, updates: Partial<AnalysisResult>) => {
    setResults(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans p-4 md:p-8 flex flex-col items-center">
        <header className="mb-12 md:mb-16 text-center w-full max-w-4xl pt-12 md:pt-20">
          <img
            src="/logo.png"
            alt="NAMIR"
            className="h-[120px] md:h-[144px] object-contain mx-auto mb-6 md:mb-8 drop-shadow-[0_0_24px_rgba(99,102,241,0.8)] transition-all duration-300"
          />
          <p className="text-lg md:text-xl text-neutral-400 font-light">
            Neural Amp Modeler & Impulse Response Manager
          </p>
        </header>
        <Login onLogin={handleLogin} />
        <footer className="mt-auto pt-16 pb-8 w-full text-center flex flex-col items-center gap-1.5">
          <p className="text-[11px] text-neutral-600 uppercase tracking-widest font-bold">Powered by NAMIR Engine</p>
          <p className="text-xs text-neutral-600">
            &copy; 2026{' '}
            <a
              href="https://www.youtube.com/@isamutheguitar"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-neutral-500 hover:text-indigo-400 hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all duration-300"
            >
              <Youtube className="w-3 h-3" />
              ISAMU the Guitar
            </a>
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 font-sans p-4 md:p-8 flex flex-col items-center">
      <header className="mb-10 md:mb-16 text-center w-full max-w-4xl pt-16 md:pt-24 relative flex flex-col items-center">
        <div className="absolute top-2 right-2 md:top-4 md:right-4 flex items-center gap-3 bg-neutral-800/50 p-2 rounded-2xl border border-neutral-700/30">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs font-bold text-white leading-none">{user?.name}</span>
            <span className="text-[10px] text-neutral-500">{user?.email}</span>
          </div>
          <button
            onClick={() => setIsDictOpen(true)}
            className="p-2 hover:bg-neutral-700/80 rounded-xl transition-colors text-indigo-400 hover:text-indigo-300 ml-2"
            title="Custom Dictionary"
          >
            <BookOpen className="w-5 h-5" />
          </button>
          <User className="w-8 h-8 p-1.5 bg-indigo-500/20 text-indigo-400 rounded-full ml-1" />
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-neutral-700 rounded-xl transition-colors text-rose-400 hover:text-rose-300"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <img
          src="/logo.png"
          alt="NAMIR"
          className="h-[120px] md:h-[144px] object-contain mx-auto mb-4 md:mb-6 drop-shadow-[0_0_24px_rgba(99,102,241,0.8)] transition-all duration-300 flex-shrink-0"
        />
        <p className="text-base md:text-xl text-neutral-400 font-light px-4">
          Neural Amp Modeler & Impulse Response Manager
        </p>
      </header>

      <main className="w-full max-w-6xl flex flex-col gap-8">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-4">
          <div className="bg-neutral-800 p-1.5 rounded-xl border border-neutral-700/50 flex gap-2 shadow-lg">
            <button
              onClick={() => setActiveTab('analyzer')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'analyzer'
                ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50'
                }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span className="md:inline">Analyzer</span>
            </button>
            <button
              onClick={() => setActiveTab('library')}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'library'
                ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(5,150,105,0.4)]'
                : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-700/50'
                }`}
            >
              <Database className="w-4 h-4" />
              <span className="md:inline">Library</span>
            </button>
          </div>
        </div>

        {activeTab === 'analyzer' ? (
          <div className="flex flex-col items-center gap-8 animate-in fade-in duration-500">
            <section className="w-full bg-neutral-800/50 p-6 rounded-2xl border border-neutral-700/50 shadow-2xl backdrop-blur-sm">
              <FileUploader token={token} onResults={(newResults) => setResults(prev => [...newResults, ...prev])} />
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
                  token={token}
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
              <LibraryView token={token} />
            </section>
          </div>
        )}
      </main>

      <footer className="mt-auto pt-16 pb-8 w-full text-center flex flex-col items-center gap-1.5">
        <p className="text-[11px] text-neutral-600 uppercase tracking-widest font-bold">Powered by NAMIR Engine</p>
        <p className="text-xs text-neutral-600">
          &copy; 2026{' '}
          <a
            href="https://www.youtube.com/@isamutheguitar"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-neutral-500 hover:text-indigo-400 hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all duration-300"
          >
            <Youtube className="w-3 h-3" />
            ISAMU the Guitar
          </a>
        </p>
      </footer>

      {/* Database Modal */}
      <DictionaryModal
        isOpen={isDictOpen}
        onClose={() => setIsDictOpen(false)}
        token={token}
      />
    </div>
  );
}

export default App;
