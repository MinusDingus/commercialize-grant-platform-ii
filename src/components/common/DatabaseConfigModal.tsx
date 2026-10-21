import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  X,
  Server,
  KeyRound,
  FileCode2,
  Lock,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  getSupabaseConfig,
  getActiveSupabaseAnonKey,
  setCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
  testSupabaseConnection,
} from '../../services/supabase';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [inputAnonKey, setInputAnonKey] = useState<string>('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const config = getSupabaseConfig();
  const configured = isSupabaseConfigured();

  const currentAnonKey = getActiveSupabaseAnonKey();

  useEffect(() => {
    if (isOpen) {
      if (currentAnonKey) {
        setInputAnonKey(currentAnonKey);
      }
      if (configured) {
        handleTestConnection();
      }
    }
  }, [isOpen]);

  const envTemplate = `# 1. Supabase Client Keys (Vite Frontend & Vercel)
VITE_SUPABASE_URL="${config.url}"
VITE_SUPABASE_ANON_KEY="${currentAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-public-key'}"

# 2. Supabase Direct Postgres (Database tools / migrations)
DATABASE_URL="postgresql://postgres:ZhFaTLQOt8SRUwli@db.${config.projectRef}.supabase.co:5432/postgres"`;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection();
      setTestResult(res);
    } catch (e: unknown) {
      setTestResult({
        success: false,
        message: e instanceof Error ? e.message : 'Unknown connection error',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputAnonKey.trim()) return;

    setCustomSupabaseCredentials(inputAnonKey.trim());
    setSaveSuccessMsg('Anon key saved! Testing live connection...');
    setTimeout(() => setSaveSuccessMsg(null), 3500);

    // Trigger test immediately
    await handleTestConnection();
  };

  const handleClearKey = () => {
    clearCustomSupabaseCredentials();
    setInputAnonKey('');
    setTestResult(null);
    setSaveSuccessMsg('Anon key cleared. Operating in fallback mode.');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Supabase PostgreSQL Environment Configuration</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-normal">
                  Ref: {config.projectRef}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Connected to project <strong>db.{config.projectRef}.supabase.co</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto text-xs">
          {/* Status Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              configured
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            {configured ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="font-semibold text-sm">
                {configured
                  ? 'Supabase Cloud Database Ready'
                  : '1 Last Step: Enter your Supabase Anon (Public) Key'}
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                {configured
                  ? `Your project URL (${config.url}) and Anon public key are active. Your app queries the live Supabase PostgreSQL database!`
                  : `Your DATABASE_URL and Project URL are recognized. Web applications run in the browser and require the "anon" public key to communicate with Supabase via HTTPS.`}
              </p>
            </div>
          </div>

          {/* Quick Connect Anon Key Form */}
          <div className="p-4 rounded-xl border border-sky-200 bg-sky-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-sky-700" />
                <span className="font-bold text-sky-950 text-xs">
                  Connect Anon Key (Browser Client)
                </span>
              </div>
              <a
                href={`https://supabase.com/dashboard/project/${config.projectRef}/settings/api`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-700 hover:text-sky-900 font-medium inline-flex items-center gap-1 text-[11px] underline"
              >
                <span>Find key in Supabase API Settings</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              In Supabase dashboard, go to <strong>Project Settings &rarr; API &rarr; Project API keys</strong> and copy the <strong>anon (public)</strong> key (starts with <code>eyJhbGciOi...</code>).
            </p>

            <form onSubmit={handleSaveKey} className="space-y-2.5">
              <div className="flex gap-2">
                <input
                  type="password"
                  value={inputAnonKey}
                  onChange={(e) => setInputAnonKey(e.target.value)}
                  placeholder="Paste your anon public key here (eyJhbGciOi...)"
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="submit"
                  disabled={!inputAnonKey.trim() || testing}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {testing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  <span>Save & Connect</span>
                </button>
                {config.hasKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    title="Clear saved key"
                    className="p-2 text-slate-400 hover:text-rose-600 border border-slate-200 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {saveSuccessMsg && (
                <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{saveSuccessMsg}</span>
                </div>
              )}
            </form>
          </div>

          {/* Diagnostic Test Button */}
          {configured && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Live PostgreSQL Table Check</span>
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800 font-medium transition-colors flex items-center gap-1.5 disabled:opacity-50 text-[11px]"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Checking...' : 'Ping Database'}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded text-xs border ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>
          )}

          {/* Variable Breakdown */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Environment Variables Status
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {/* VITE_SUPABASE_URL */}
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-slate-800">
                    VITE_SUPABASE_URL
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Auto-Configured
                  </span>
                </div>
                <div className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-700 truncate">
                  {config.url}
                </div>
              </div>

              {/* DATABASE_URL */}
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-slate-800">
                    DATABASE_URL
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">
                    Direct PostgreSQL (Port 5432)
                  </span>
                </div>
                <div className="font-mono text-[11px] bg-white p-2 rounded border border-slate-200 text-slate-700 truncate">
                  postgresql://postgres:••••••••@db.{config.projectRef}.supabase.co:5432/postgres
                </div>
              </div>

              {/* VITE_SUPABASE_ANON_KEY */}
              <div className="p-3 border border-slate-200 rounded-lg bg-slate-50/50 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-slate-800">
                    VITE_SUPABASE_ANON_KEY
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      config.hasKey
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {config.hasKey ? 'Active' : 'Awaiting Anon Key'}
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  Required by Vite browser client. Stored securely and checked by Supabase RLS.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Copy .env Template */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <FileCode2 className="w-3.5 h-3.5 text-slate-600" />
                Copy Ready-to-Use .env Snippet
              </span>
              <button
                onClick={() => copyToClipboard(envTemplate, 'template')}
                className="flex items-center gap-1 text-sky-700 hover:text-sky-800 font-semibold transition-colors text-xs"
              >
                {copiedKey === 'template' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Snippet</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg font-mono text-[11px] overflow-x-auto select-all">
              {envTemplate}
            </pre>
          </div>

          {/* Vercel instructions */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <Server className="w-3.5 h-3.5 text-slate-700" />
              For Vercel Deployment:
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px] leading-relaxed">
              <li>
                In your Vercel Project, click <strong>Settings &rarr; Environment Variables</strong>.
              </li>
              <li>
                Add <code>VITE_SUPABASE_URL</code> with value <code>https://{config.projectRef}.supabase.co</code>.
              </li>
              <li>
                Add <code>VITE_SUPABASE_ANON_KEY</code> with your anon key.
              </li>
              <li>
                Add <code>DATABASE_URL</code> with your PostgreSQL connection string.
              </li>
              <li>Redeploy or push to GitHub — your production build will automatically connect!</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <a
            href={`https://supabase.com/dashboard/project/${config.projectRef}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sky-700 hover:text-sky-900 font-medium flex items-center gap-1"
          >
            <span>Open Supabase Project ({config.projectRef})</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
