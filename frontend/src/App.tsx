import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { CustomQueryView } from './components/CustomQueryView';
import { SuiteRunnerView } from './components/SuiteRunnerView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'custom' | 'suite'>('custom');

  return (
    <div className="flex min-h-screen bg-slate-100/70 text-slate-800 font-sans antialiased">
      {/* Sidebar Fijo */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Área de Contenido Principal (Main) */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        {/* Header Superior */}
        <header className="flex justify-between items-center border-b border-slate-200/80 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'custom' ? 'Custom Request Builder' : 'Suite de Certificación Automática'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {activeTab === 'custom'
                ? 'Construye y prueba filtros condicionales directos hacia la API de SyPago.'
                : 'Ejecuta baterías de prueba integradas con el catálogo maestro de Go.'}
            </p>
          </div>
        </header>

        {/* Renderizado Condicional según la opción del Sidebar */}
        {activeTab === 'custom' ? <CustomQueryView /> : <SuiteRunnerView />}
      </main>
    </div>
  );
};

export default App;