import React, { useState } from 'react';
import { ShieldAlert, Lock, User, Key, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { reliefApi } from '../services/reliefApi';

interface OperatorLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OperatorLoginModal: React.FC<OperatorLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [username, setUsername] = useState('operator');
  const [password, setPassword] = useState('reqnet-operator');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await reliefApi.loginOperator(username.trim(), password);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Invalid operator credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            aria-label="Close operator login"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-600/30 border border-red-500/50 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Rescue Operator Access</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Restricted to authorized emergency response coordinators
              </p>
            </div>
          </div>
        </div>

        {/* Content & Form */}
        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-3 mb-5 flex items-start gap-2.5 text-xs text-amber-900">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Private Operations Portal:</span> Incident dispatch,
              relief verification, flood telemetry, and resource allocation require field operator authorization.
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Operator Username / Call Sign
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                  placeholder="e.g. operator"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Security Passcode
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {/* Quick Demo Pre-fill hint */}
            <div className="p-2.5 bg-slate-100 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
              <span>Demo Credentials: <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-300 text-slate-800">operator</code> / <code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-300 text-slate-800">reqnet-operator</code></span>
              <button
                type="button"
                onClick={() => {
                  setUsername('operator');
                  setPassword('reqnet-operator');
                }}
                className="text-blue-600 hover:text-blue-800 font-bold ml-2 underline cursor-pointer"
              >
                Set
              </button>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Authorize & Enter</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
