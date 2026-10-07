import React from 'react';

interface SidebarProps {
  activeTab: 'custom' | 'suite';
  setActiveTab: (tab: 'custom' | 'suite') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-screen flex flex-col justify-between p-4 sticky top-0 h-screen">
      <div className="space-y-8">
        {/* Logo / Branding */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-purple-200">
            S
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-base leading-tight">SyPago QA</h1>
            <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
              Filter Engine
            </span>
          </div>
        </div>

        {/* Menú Principal */}
        <nav className="space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
            Módulos de Prueba
          </span>

          <button
            onClick={() => setActiveTab('custom')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'custom'
                ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Custom Request (Flujo X)
          </button>

          <button
            onClick={() => setActiveTab('suite')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'suite'
                ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Test Cases Suite (Flujo Y)
          </button>
        </nav>
      </div>

      {/* Footer / Ajustes */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-2 text-xs text-slate-500 font-medium">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          Environment: <span className="font-bold text-slate-700">QA (SyPago)</span>
        </div>
      </div>
    </aside>
  );
};