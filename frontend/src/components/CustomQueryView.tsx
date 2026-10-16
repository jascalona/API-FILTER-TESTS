import React, { useState, useMemo } from 'react';

export interface Rule {
  id: string;
  field: string;
  op: string;
  value: string;
}

export interface CustomFilterResponse {
  generated_condition: string;
  target_url: string;
  count_total: number;
  status_code: number;
  latency_ms: number;
  raw_response: any;
}

const AVAILABLE_FIELDS = [
  { value: 'status', label: 'Estado (status)' },
  { value: 'amt', label: 'Monto (amt)' },
  { value: 'transaction_id', label: 'ID Transacción (transaction_id)' },
  { value: 'rejected_code', label: 'Código Rechazo (rejected_code)' },
  { value: 'ref_ibp', label: 'Referencia IBP (ref_ibp)' },
];

const OPERATORS = [
  { value: 'eq', label: 'Igual (=)' },
  { value: 'btwn', label: 'Entre (btwn)' },
  { value: 'like', label: 'Contiene (like)' },
  { value: 'lte', label: 'Menor o igual (lte)' },
  { value: 'gte', label: 'Mayor o igual (gte)' },
];

export const CustomQueryView: React.FC = () => {
  const [rules, setRules] = useState<Rule[]>([
    { id: '1', field: 'status', op: 'eq', value: 'ACCP' },
    { id: '2', field: 'amt', op: 'btwn', value: '10|100' },
  ]);

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<CustomFilterResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const liveConditionPreview = useMemo(() => {
    const validRules = rules
      .filter((r) => r.field && r.op && r.value.trim() !== '')
      .map((r) => `${r.field}:${r.op}:${r.value}`);

    if (validRules.length === 0) return '';
    return `and(${validRules.join(',')})`;
  }, [rules]);

  const handleAddRule = () => {
    setRules((prev) => [
      ...prev,
      { id: Date.now().toString(), field: 'amt', op: 'eq', value: '' },
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
    setResponse(null);

    const payload = {
      operator: 'and',
      children: rules.map(({ field, op, value }) => ({ field, op, value })),
    };

    try {
      // Usamos la ruta relativa para apuntar al mismo puerto dinámico donde corre el binario
      const res = await fetch('/api/v1/custom-filter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data && (data.generated_condition || data.raw_response !== undefined)) {
        setResponse(data);
      } else {
        throw new Error(data.message || data.error || 'Error de comunicación con el servidor');
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar con la API interna');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header General */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Custom Request Builder</h1>
        <p className="text-xs text-slate-500">
          Construye y prueba filtros condicionales directos hacia la API de SyPago.
        </p>
      </div>

      {/* Contenedor Principal */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Sub-Header */}
        <div className="p-5 bg-slate-50/50 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Constructor de Reglas (Flujo X)</h2>
            <p className="text-[11px] text-slate-500">
              Agrega N cantidad de reglas dinámicas para formar tu query condicional en tiempo real.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-100">
            <span className="text-[11px] font-extrabold text-purple-700 tracking-wider">
              OPERADOR LÓGICO: AND
            </span>
          </div>
        </div>

        {/* Lista de Reglas Compacta */}
        <div className="p-6 space-y-3">
          {rules.map((rule, idx) => (
            <React.Fragment key={rule.id}>
              {idx > 0 && (
                <div className="flex items-center gap-2 my-1">
                  <div className="h-[1px] bg-slate-200 flex-1" />
                  <span className="text-[10px] font-mono font-bold uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-100">
                    AND
                  </span>
                  <div className="h-[1px] bg-slate-200 flex-1" />
                </div>
              )}

              <div className="group bg-slate-50/80 hover:bg-white hover:border-purple-300 p-3 rounded-xl border border-slate-200/80 transition-all shadow-none hover:shadow-sm grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Campo
                  </label>
                  <select
                    value={rule.field}
                    onChange={(e) => handleRuleChange(rule.id, 'field', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {AVAILABLE_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Operador
                  </label>
                  <select
                    value={rule.op}
                    onChange={(e) => handleRuleChange(rule.id, 'op', e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Valor
                  </label>
                  <input
                    type="text"
                    value={rule.value}
                    onChange={(e) => handleRuleChange(rule.id, 'value', e.target.value)}
                    placeholder="Ej. ACCP o 10|100"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="md:col-span-1 flex justify-center pt-3 md:pt-4">
                  {rules.length > 1 && (
                    <button
                      onClick={() => handleRemoveRule(rule.id)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 transition-colors rounded-lg hover:bg-rose-50"
                      title="Eliminar regla"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Previsualización en Tiempo Real */}
        <div className="mx-6 p-3 bg-slate-900 rounded-xl flex items-center justify-between gap-3 text-xs font-mono text-emerald-400 border border-slate-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <svg className="w-4 h-4 text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <span className="text-slate-400 font-sans text-[11px]">Sintaxis:</span>
            <span className="truncate">{liveConditionPreview || '...'}</span>
          </div>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-sans flex-shrink-0">
            {rules.length} Regla(s)
          </span>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-between items-center bg-slate-50/30">
          <button
            onClick={handleAddRule}
            className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-all border border-purple-200/60 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Agregar Regla
          </button>

          <button
            onClick={handleFilter}
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {loading ? 'Enviando Query...' : 'Filtrar'}
          </button>
        </div>
      </div>

      {/* Banner de Error Crítico (Red / Conectividad) */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-medium flex justify-between items-center">
          <span><strong>Error:</strong> {error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 font-bold hover:underline">Cerrar</button>
        </div>
      )}

      {/* Resultados / Errores de la API SyPago */}
      {response && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-in fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Resultado del Filtro</h3>
              <p className="text-xs text-slate-500">
                Respuesta devuelta por el entorno de SyPago
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-lg border border-purple-200 font-bold flex items-center gap-1">
                <span className="text-[10px] text-purple-600 font-semibold uppercase">Encontrados:</span>
                {response.count_total ?? 0}
              </span>

              <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-lg border border-slate-200 font-mono">
                {response.latency_ms} ms
              </span>

              <span className={`text-xs px-2.5 py-1 rounded-lg border font-bold ${response.status_code >= 200 && response.status_code < 300
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                HTTP {response.status_code}
              </span>
            </div>
          </div>

          {/* Banner con descripción del error devuelto por la API */}
          {response.status_code >= 400 && response.raw_response?.message && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <span className="font-mono font-bold bg-rose-200 px-2 py-0.5 rounded text-[10px]">
                {response.raw_response.code || 'ERROR'}
              </span>
              <span>{response.raw_response.message}</span>
            </div>
          )}

          {response.target_url && (
            <div className="p-3 bg-slate-900 rounded-xl font-mono text-xs text-emerald-400 break-all">
              <span className="text-purple-400 font-bold">TARGET URL:</span> {response.target_url}
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Payload de Respuesta (Raw Response)
            </h4>
            <div className={`p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-80 ${response.status_code >= 400 ? 'bg-slate-900 text-rose-300 border border-rose-950' : 'bg-slate-950 text-emerald-400'
              }`}>
              <pre>{JSON.stringify(response.raw_response, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};