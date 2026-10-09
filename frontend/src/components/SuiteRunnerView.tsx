import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import type { TestGroup, TestSuiteResponse, SuiteParams } from '../api/filterApi';

// icons Material UI
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

const PRELOADED_GROUPS: TestGroup[] = [
    { id: 'all', name: 'Suite Completa', description: 'Ejecuta todas las pruebas unitarias e integración del catálogo completo', count: 17 },
    { id: 'transaction_id', name: 'Grupo Transaction ID', description: 'Pruebas sobre transaction_id exacto y patrón tx_like', count: 3 },
    { id: 'status', name: 'Grupo Status', description: 'Certificación de códigos de estado (ACCP, REJT, PEND)', count: 3 },
    { id: 'rejected_code', name: 'Grupo Rejected Code', description: 'Pruebas sobre códigos de rechazo exactos y patrones rj_code_like', count: 3 },
    { id: 'ref_ibp', name: 'Grupo Ref IBP', description: 'Filtros por referencia IBP exacta y patrón ref_ibp_like', count: 3 },
    { id: 'amt', name: 'Grupo Montos (AMT)', description: 'Validación de operadores eq, btwn, lte, gte sobre montos', count: 4 },
    { id: 'users', name: 'Grupo Usuarios', description: 'Pruebas agrupadas sobre user_id y subuser_id', count: 2 },
    { id: 'date_filter', name: 'Grupo Fechas', description: 'Validación sobre operation_date y init_transaction_date', count: 3 },
];

const DEFAULT_PARAMS: SuiteParams = {
    transaction_id: 'A60427ED515C',
    tx_like: 'A604',
    status: 'ACCP',
    rejected_code: 'TKCM',
    rj_code_like: 'MD',
    ref_ibp: '02301098',
    ref_ibp_like: '1098',
    amount: '1',
    amount_like: '1000',
    amount_lte: '1000',
    amount_gte: '1000',
    amount_btwn: '10|100',
    user_id: '7066cf6f-5f6f-4d51-84f3-2684029b4f3a',
    subuser_id: '54c6ea4e-a373-4778-acab-c771bba703de',
    internal_id: 'ABC8AD2A7777',
    group_id: '5F444F803A86',
    init_transaction_date: '2026-10-05 20:39:18',
    operation_date: '2026-10-08',
    number: '30221960',
    bank_code: '0108',
    account_number: '04129854529'
};

export const SuiteRunnerView: React.FC = () => {
    const [selectedGroup, setSelectedGroup] = useState<TestGroup | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<SuiteParams>(DEFAULT_PARAMS);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [suiteResponse, setSuiteResponse] = useState<TestSuiteResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

    const handleOpenModal = (group: TestGroup) => {
        setSelectedGroup(group);
        setIsModalOpen(true);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const toggleRow = (id: string) => {
        setExpandedRowId((prev) => (prev === id ? null : id));
    };

    const handleRunSuite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedGroup) return;

        const currentGroup = selectedGroup;
        setIsModalOpen(false);
        setLoading(true);
        setError(null);
        setExpandedRowId(null);
        setNotification(`La suite de pruebas para el grupo "${currentGroup.name}" (${currentGroup.id}) ha sido enviada...`);

        const payload = {
            group: currentGroup.id,
            ...formData,
        };

        try {
            const res = await fetch('http://localhost:8050/api/v1/test-suites/run?group=' + currentGroup.id, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al ejecutar la suite');

            setSuiteResponse(data);
            setNotification(null);
        } catch (err: any) {
            setError(err.message || 'Error en la comunicación con el servidor (Verifica CORS/Conectividad)');
            setNotification(null);
        } finally {
            setLoading(false);
        }
    };

    // Helper para renderizar el contenido dinámico de raw_response
    const renderRawResponse = (rawResponse: any) => {
        if (!rawResponse) {
            return (
                <div className="text-slate-400 text-xs italic p-3 text-center bg-slate-50 rounded-lg">
                    No se recibió respuesta en `raw_response`.
                </div>
            );
        }

        // CASO A: Es un arreglo de elementos (Respuesta exitosa de lista)
        if (Array.isArray(rawResponse)) {
            if (rawResponse.length === 0) {
                return (
                    <div className="text-slate-400 text-xs italic p-3 text-center bg-slate-50 rounded-lg">
                        Arreglo de respuesta vacío.
                    </div>
                );
            }

            return rawResponse.map((raw: any, idx: number) => (
                <div key={raw.internal_id || idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Transaction ID</span>
                            <span className="font-mono font-bold text-slate-800">{raw.transaction_id || '-'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Ref IBP</span>
                            <span className="font-mono text-slate-800">{raw.ref_ibp || '-'}</span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Estado</span>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                raw.status === 'ACCP' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                                {raw.status || 'N/A'} {raw.rejected_code ? `(${raw.rejected_code})` : ''}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Fecha Operación</span>
                            <span className="text-slate-700">{raw.operation_date || '-'}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200/60">
                        {raw.amount && (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                                <span className="text-purple-700 font-bold block text-[11px]">Información de Monto</span>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Monto:</span>
                                    <span className="font-bold text-slate-800">{raw.amount.pay_amt} {raw.amount.currency}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Tasa (Rate):</span>
                                    <span className="font-mono text-slate-700">{raw.amount.rate}</span>
                                </div>
                            </div>
                        )}

                        {raw.receiving_user && (
                            <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                                <span className="text-purple-700 font-bold block text-[11px]">Usuario Receptor</span>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Nombre:</span>
                                    <span className="font-bold text-slate-800">{raw.receiving_user.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Documento:</span>
                                    <span className="font-mono text-slate-700">
                                        {raw.receiving_user.document_info?.type}-{raw.receiving_user.document_info?.number}
                                    </span>
                                </div>
                                {raw.receiving_user.account && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Cuenta Banco:</span>
                                        <span className="font-mono text-slate-700">
                                            {raw.receiving_user.account.bank_code} ({raw.receiving_user.account.number})
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <details className="pt-1">
                        <summary className="cursor-pointer text-[11px] font-semibold text-purple-600 hover:text-purple-800 select-none">
                            Ver Raw JSON del item
                        </summary>
                        <pre className="mt-2 p-3 bg-slate-900 text-emerald-400 rounded-lg text-[10px] font-mono overflow-x-auto max-h-60 leading-tight">
                            {JSON.stringify(raw, null, 2)}
                        </pre>
                    </details>
                </div>
            ));
        }

        // CASO B: Es un Objeto JSON (Error o respuesta directa de la API de filtro)
        return (
            <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-4 space-y-3">
                {rawResponse.message && (
                    <div className="flex items-center gap-2 text-rose-800 text-xs font-semibold">
                        <span className="px-2 py-0.5 bg-rose-200 text-rose-900 rounded font-mono text-[10px]">
                            {rawResponse.code || 'ERROR'}
                        </span>
                        <span>{rawResponse.message}</span>
                    </div>
                )}

                <details open className="pt-1">
                    <summary className="cursor-pointer text-[11px] font-semibold text-rose-700 hover:text-rose-900 select-none mb-2">
                        Respuesta Raw Devuelta por la API:
                    </summary>
                    <pre className="p-3 bg-slate-900 text-rose-300 rounded-lg text-[10px] font-mono overflow-x-auto max-h-60 leading-tight">
                        {JSON.stringify(rawResponse, null, 2)}
                    </pre>
                </details>
            </div>
        );
    };

    return (
        <div className="space-y-6">

            {/* Catálogo de Grupos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-800">Catálogo de Pruebas Precargadas</h2>
                    <p className="text-xs text-slate-500">Selecciona un grupo específico o ejecuta el catálogo completo.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                    {PRELOADED_GROUPS.map((group) => (
                        <div
                            key={group.id}
                            className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:border-purple-300 transition-all flex flex-col justify-between space-y-3"
                        >
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-xs text-slate-800">{group.name}</span>
                                    <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                                        ID: {group.id}
                                    </span>
                                </div>
                                <p className="text-[11px] text-slate-500 leading-relaxed">{group.description}</p>
                            </div>

                            <button
                                onClick={() => handleOpenModal(group)}
                                disabled={loading}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
                            >
                                <PlayArrowIcon /> Configurar y Ejecutar ({group.id})
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Alerta de Request Enviado / Procesando */}
            {notification && (
                <div className="bg-purple-50 border border-purple-200 text-purple-800 p-4 rounded-2xl text-xs font-medium flex justify-between items-center animate-in fade-in">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-600 animate-ping" />
                        <span>{notification}</span>
                    </div>
                </div>
            )}

            {/* Error Banner */}
            {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl text-xs font-medium flex justify-between items-center">
                    <span><strong>Error:</strong> {error}</span>
                    <button onClick={() => setError(null)} className="text-rose-500 font-bold hover:underline">Cerrar</button>
                </div>
            )}

            {/* MODAL CON PORTAL */}
            {isModalOpen && selectedGroup && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">

                        {/* Header del Modal */}
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800">Parámetros de Ejecución</h3>
                                <p className="text-xs text-slate-500">
                                    Grupo a enviar: <span className="font-mono font-bold text-purple-600">{selectedGroup.id}</span> ({selectedGroup.name})
                                </p>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 text-lg font-bold w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Formulario */}
                        <form onSubmit={handleRunSuite} className="p-6 space-y-5 overflow-y-auto">
                            <div className="bg-purple-50/60 p-3 rounded-xl border border-purple-100 text-[11px] text-purple-800">
                                Se enviará <code className="font-bold font-mono text-purple-900">"group": "{selectedGroup.id}"</code> en el payload JSON hacia la API.
                            </div>

                            {/* Sección 1: Identificadores y Transacciones */}
                            <div className="space-y-2">
                                <h4 className="text-[11px] font-bold uppercase text-purple-700 tracking-wider">Identificadores / Transacción</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">transaction_id</label>
                                        <input type="text" name="transaction_id" value={formData.transaction_id} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">tx_like</label>
                                        <input type="text" name="tx_like" value={formData.tx_like} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">internal_id</label>
                                        <input type="text" name="internal_id" value={formData.internal_id} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">group_id</label>
                                        <input type="text" name="group_id" value={formData.group_id} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">ref_ibp</label>
                                        <input type="text" name="ref_ibp" value={formData.ref_ibp} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">ref_ibp_like</label>
                                        <input type="text" name="ref_ibp_like" value={formData.ref_ibp_like} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Sección 2: Grupo de Usuarios */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <h4 className="text-[11px] font-bold uppercase text-purple-700 tracking-wider">Grupo Usuarios</h4>
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">user_id</label>
                                        <input type="text" name="user_id" value={formData.user_id} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">subuser_id</label>
                                        <input type="text" name="subuser_id" value={formData.subuser_id} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Sección 3: Grupo de Fechas */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <h4 className="text-[11px] font-bold uppercase text-purple-700 tracking-wider">Grupo Fechas</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">init_transaction_date</label>
                                        <input type="text" name="init_transaction_date" value={formData.init_transaction_date} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">operation_date</label>
                                        <input type="text" name="operation_date" value={formData.operation_date} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Sección 4: Estados y Rechazos */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <h4 className="text-[11px] font-bold uppercase text-purple-700 tracking-wider">Estado y Código Rechazo</h4>
                                <div className="grid grid-cols-3 gap-3 text-xs">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">status</label>
                                        <input type="text" name="status" value={formData.status} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">rejected_code</label>
                                        <input type="text" name="rejected_code" value={formData.rejected_code} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">rj_code_like</label>
                                        <input type="text" name="rj_code_like" value={formData.rj_code_like} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Sección 5: Montos */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <h4 className="text-[11px] font-bold uppercase text-purple-700 tracking-wider">Montos (AMT)</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">amount</label>
                                        <input type="text" name="amount" value={formData.amount} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">amount_like</label>
                                        <input type="text" name="amount_like" value={formData.amount_like} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">amount_lte</label>
                                        <input type="text" name="amount_lte" value={formData.amount_lte} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">amount_gte</label>
                                        <input type="text" name="amount_gte" value={formData.amount_gte} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">amount_btwn</label>
                                        <input type="text" name="amount_btwn" value={formData.amount_btwn} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Sección 6: Datos Bancarios / Teléfono */}
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                                <h4 className="text-[11px] font-bold uppercase text-purple-700 tracking-wider">Datos Bancarios y Teléfono</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">number</label>
                                        <input type="text" name="number" value={formData.number} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">bank_code</label>
                                        <input type="text" name="bank_code" value={formData.bank_code} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">account_number</label>
                                        <input type="text" name="account_number" value={formData.account_number} onChange={handleChange} className="w-full border border-slate-200 rounded-lg p-2 font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                                >
                                    Ejecutar Grupo '{selectedGroup.id}'
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Tabla de Resultados */}
            {suiteResponse && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Resultados de la Ejecución</h3>
                            <p className="text-xs text-slate-500">
                                Se procesaron {suiteResponse.total ?? 0} casos de prueba para el grupo. Haz clic en una fila para ver el detalle.
                            </p>
                        </div>

                        {/* Protección agregada aquí con (suiteResponse.results || []) */}
                        <div className="flex gap-2">
                            <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-lg border border-emerald-200 font-bold">
                                Exitosos: {(suiteResponse.results || []).filter((r) => r.passed).length}
                            </span>
                            <span className="bg-rose-50 text-rose-700 text-xs px-2.5 py-1 rounded-lg border border-rose-200 font-bold">
                                Fallidos: {(suiteResponse.results || []).filter((r) => !r.passed).length}
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700 uppercase text-[10px]">
                                <tr>
                                    <th className="p-3 w-8"></th>
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Nombre Pruebas</th>
                                    <th className="p-3">Condición Generada</th>
                                    <th className="p-3">HTTP Status</th>
                                    <th className="p-3">Latencia</th>
                                    <th className="p-3">Resultado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {/* Validación de existencia de resultados para evitar pantalla en blanco */}
                                {(suiteResponse.results || []).length > 0 ? (
                                    (suiteResponse.results || []).map((item: any) => {
                                        const isExpanded = expandedRowId === item.id;
                                        const caseName = item.test_case_name || item.name;

                                        return (
                                            <React.Fragment key={item.id}>
                                                <tr
                                                    onClick={() => toggleRow(item.id)}
                                                    className={`cursor-pointer transition-colors ${
                                                        isExpanded ? 'bg-purple-50/50' : 'hover:bg-slate-50/80'
                                                    }`}
                                                >
                                                    <td className="p-3 text-center text-slate-400 font-bold">
                                                        {isExpanded ? '▼' : '►'}
                                                    </td>
                                                    <td className="p-3 font-mono font-bold text-slate-700">{item.id}</td>
                                                    <td className="p-3 font-semibold text-slate-800">{caseName}</td>
                                                    <td className="p-3 font-mono text-purple-700">{item.condition}</td>
                                                    <td className="p-3 font-mono font-bold">{item.status_code}</td>
                                                    <td className="p-3 text-slate-600">{item.latency_ms} ms</td>
                                                    <td className="p-3">
                                                        {item.passed ? (
                                                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-md border border-emerald-200">
                                                                ✓ PASSED
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 font-bold text-[10px] px-2 py-0.5 rounded-md border border-rose-200" title={item.error}>
                                                                ✕ FAILED
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>

                                                {/* Detalle desplegable */}
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/60">
                                                        <td colSpan={7} className="p-4 border-b border-slate-200">
                                                            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-inner">
                                                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                                                    <h4 className="text-xs font-bold text-slate-800">
                                                                        Detalles de Respuesta para: <span className="text-purple-600">{caseName} ({item.id})</span>
                                                                    </h4>
                                                                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                                                        Expected: {item.expected_code || 200} | Received: {item.status_code}
                                                                    </span>
                                                                </div>

                                                                {renderRawResponse(item.raw_response)}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-4 text-center text-slate-400 text-xs italic">
                                            No se devolvieron resultados dentro del arreglo `results` para este grupo de pruebas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};