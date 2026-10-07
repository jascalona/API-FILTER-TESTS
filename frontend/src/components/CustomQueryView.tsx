import React, { useState } from 'react';
import { Rule, CustomFilterResponse } from '../api/filterApi';

const AVAILABLE_FIELDS = [
  { value: 'status', label: 'Estado (status)' },
  { value: 'amount', label: 'Monto (amount)' },
  { value: 'transaction_id', label: 'ID Transacción' },
  { value: 'reference', label: 'Referencia' },
];

const OPERATORS = [
  { value: 'eq', label: 'Igual (=)' },
  { value: 'btwn', label: 'Entre (btwn)' },
  { value: 'like', label: 'Contiene (like)' },
];

export const CustomQueryView: React.FC = () => {
  const [logicalOperator, setLogicalOperator] = useState<'and' | 'or'>('and');
  const [rules, setRules] = useState<Rule[]>([
    { id: '1', field: 'status', operator: 'eq', value: 'ACCP' },
    { id: '2', field: 'amount', operator: 'btwn', value: '10|100' },
  ]);

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CustomFilterResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddRule = () => {
    setRules((prev) => [
      ...prev,
      { id: Date.now().toString(), field: 'amount', operator: 'eq', value: '' },
    ]);
  };

  const handleRemoveRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const handleRuleChange = (id: string, key: keyof Rule, val: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: val } : r)));
  };

  const handleFilter = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      logical_operator: logicalOperator,
      rules: rules.map(({ field, operator, value }) => ({ field, operator, value })),
    };

    try {
      const res = await fetch('/api/v1/transaction/filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error al ejecutar filtro');

      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta de Configuración de Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Custom Request (Flujo X)</h2>
            <p className="text-xs text-slate-500">
              Construye reglas avanzadas para probar el codificador de query params en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
            <span className="text-xs font-semibold text-slate-500 px-2">Operador Lógico:</span>
            <button
              onClick={() => setLogicalOperator('and')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                logicalOperator === 'and'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              AND
            </button>
            <button
              onClick={() => setLogicalOperator('or')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                logicalOperator === 'or'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              OR
            </button>
          </div>
        </div>

        {/* Lista de Reglas Dinámicas */}
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="flex flex-wrap items-center gap-3 bg-slate-50/70 p-3 rounded-xl border border-slate-200/80">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Campo</label>
                <select
                  value={rule.field}
                  onChange={(e) => handleRuleChange(rule.id, 'field', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {AVAILABLE_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              <div className="w-36">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Operador</label>
                <select
                  value={rule.operator}
                  onChange={(e) => handleRuleChange(rule.id, 'operator', e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 min-w-[180px]">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor</label>
                <input
                  type="text"
                  value={rule.value}
                  onChange={(e) => handleRuleChange(rule.id, 'value', e.target.value)}
                  placeholder="ej. 10|100 o ACCP"
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {rules.length > 1 && (
                <button
                  onClick={() => handleRemoveRule(rule.id)}
                  className="self-end mb-1 text-slate-400 hover:text-rose-600 p-1.5 transition-colors"
                  title="Eliminar regla"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={handleAddRule}
            className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 bg-purple-50 px-3 py-2 rounded-xl transition-colors"
          >
            + Agregar Regla
          </button>

          <button
            onClick={handleFilter}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Procesando Query...' : '🔍 Filtrar'}
          </button>
        </div>
      </div>

      {/* Alerta de Error */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-medium flex justify-between items-center">
          <span><strong>Error:</strong> {error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 font-bold hover:underline">Cerrar</button>
        </div>
      )}

      {/* Tarjeta de Metadatos y Resultados */}
      {response && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Condición Generada</span>
              <code className="text-xs font-mono font-bold text-purple-700 break-all mt-1 block">
                {response.condition_generated || 'N/A'}
              </code>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Código HTTP</span>
              <span className={`text-sm font-bold mt-1 inline-block ${response.status_code === 200 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {response.status_code}
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Latencia</span>
              <span className="text-sm font-bold text-slate-800 mt-1 inline-block">
                {response.latency_ms} ms
              </span>
            </div>
          </div>

          {/* Tabla de Petición SyPago */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Payload de Respuesta SyPago</h3>
            {Array.isArray(response.raw_response) && response.raw_response.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase text-[10px]">
                    <tr>
                      {Object.keys(response.raw_response[0]).map((key) => (
                        <th key={key} className="p-3">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {response.raw_response.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        {Object.values(row).map((val: any, i) => (
                          <td key={i} className="p-3 font-mono">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-slate-950 p-4 rounded-xl text-emerald-400 font-mono text-xs overflow-x-auto max-h-60">
                <pre>{JSON.stringify(response.raw_response, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};