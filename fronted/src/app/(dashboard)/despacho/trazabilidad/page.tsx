"use client";

import { useState } from "react";
import { Search, Package, Factory, ShoppingCart, User, ArrowRight, ArrowDown } from "lucide-react";
import toast from "react-hot-toast";

export default function TrazabilidadPage() {
  const [lotCode, setLotCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [traceData, setTraceData] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lotCode.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`http://localhost:4000/api/traceability/${lotCode}`);
      if (!res.ok) {
        if (res.status === 404) toast.error("No se encontró ningún lote con ese código");
        else toast.error("Error al buscar la trazabilidad");
        setTraceData(null);
        return;
      }
      const data = await res.json();
      setTraceData(data);
    } catch (err) {
      console.error(err);
      toast.error("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* HEADER & BUSCADOR */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <Search className="text-carey-red" size={24} /> Trazabilidad de Lotes
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Ingresa un código de lote para descubrir su historial completo.</p>
        </div>

        <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
          <input 
            type="text" 
            placeholder="L-20260605-01..." 
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-carey-red text-gray-900 text-sm"
            value={lotCode}
            onChange={(e) => setLotCode(e.target.value)}
          />
          <button 
            type="submit" disabled={loading}
            className="bg-carey-red hover:bg-red-800 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md shadow-red-200 disabled:opacity-50 text-sm"
          >
            {loading ? "Buscando..." : "Rastrear"}
          </button>
        </form>
      </div>

      {/* RESULTADOS (ÁRBOL VISUAL) */}
      {traceData && (
        <div className="space-y-6">
          
          {/* NODO CENTRAL: EL LOTE BUSCADO */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-carey-red overflow-hidden">
            <div className="p-5 flex items-center gap-4">
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center shrink-0">
                <Package size={24} className="text-carey-red" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Lote Objetivo</div>
                <h2 className="text-xl font-bold text-gray-900">{traceData.targetLot.product.description}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded text-xs font-mono font-bold border border-gray-200">{traceData.targetLot.lotCode}</span>
                  <span className="bg-green-50 text-green-700 px-2.5 py-0.5 rounded text-xs font-bold border border-green-200">Stock Actual: {traceData.targetLot.quantity} {traceData.targetLot.product.unit}</span>
                  <span className="bg-gray-50 text-gray-500 px-2.5 py-0.5 rounded text-xs border border-gray-200">Creado: {new Date(traceData.targetLot.entryDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LADO IZQUIERDO: DE DÓNDE VINO (ORIGEN E INSUMOS) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                <ArrowDown size={18} className="text-carey-red" /> Origen del Lote
              </h3>

              {traceData.origin?.type === 'PRODUCCION' && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center shrink-0">
                      <Factory size={16} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Fabricación Propia</div>
                      <div className="text-sm font-bold text-gray-900">Orden: {traceData.origin.details.productionNumber}</div>
                    </div>
                    <div className="ml-auto text-xs text-gray-500">{new Date(traceData.origin.details.date).toLocaleDateString()}</div>
                  </div>

                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Insumos Utilizados</h4>
                    <div className="space-y-2">
                      {traceData.inputs.map((input: any, i: number) => (
                        <div key={i} className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 text-sm">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold text-gray-800 text-xs">{input.product.description}</span>
                            <span className="font-mono text-[10px] bg-white text-gray-800 px-1.5 py-0.5 rounded border border-gray-200">{input.lot.lotCode}</span>
                          </div>
                          <div className="text-xs text-gray-500 mb-2">Cantidad: <strong className="text-carey-red">{input.quantity} {input.product.unit || 'KG'}</strong></div>
                          
                          {/* Proveedor del Insumo */}
                          {input.providerInfo ? (
                            <div className="text-[10px] bg-gray-100 p-1.5 rounded text-gray-600 flex items-center gap-1.5">
                              <ShoppingCart size={10} />
                              Comprado a: <strong className="text-gray-800">{input.providerInfo.razonSocial}</strong>
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-400 italic">Origen anterior interno</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {traceData.origin?.type === 'COMPRA' && (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center shrink-0">
                      <ShoppingCart size={16} />
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 font-medium">Comprado a Proveedor</div>
                      <div className="text-sm font-bold text-gray-900">{traceData.origin.details.provider.razonSocial}</div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div><span className="text-gray-500 block mb-0.5">Orden de Compra</span> <span className="font-mono font-bold text-gray-800">{traceData.origin.details.orderNumber}</span></div>
                    <div><span className="text-gray-500 block mb-0.5">Fecha</span> <span className="font-medium text-gray-800">{new Date(traceData.origin.details.issueDate).toLocaleDateString()}</span></div>
                  </div>
                </div>
              )}
            </div>

            {/* LADO DERECHO: HACIA DÓNDE FUE (DESTINOS) */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wider">
                <ArrowRight size={18} className="text-carey-red" /> Destino del Lote
              </h3>

              {/* Ventas / Despachos */}
              {traceData.destinations.dispatches.length > 0 ? (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Despachado a Clientes</h4>
                  <div className="space-y-2">
                    {traceData.destinations.dispatches.map((d: any, i: number) => (
                      <div key={i} className="flex items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center shrink-0 mr-3">
                          <User size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-gray-800">{d.client}</div>
                          <div className="text-[10px] text-gray-500 font-mono">Guía: {d.dispatchNumber} • {new Date(d.date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-[10px] font-bold text-carey-red bg-red-50 px-2 py-1 rounded border border-red-100">Despachado: {d.quantity} {traceData.targetLot.product.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Usado en producciones */}
              {traceData.destinations.productions.length > 0 ? (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Consumido Internamente</h4>
                  <div className="space-y-2">
                    {traceData.destinations.productions.map((p: any, i: number) => (
                      <div key={i} className="flex items-center p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center shrink-0 mr-3">
                          <Factory size={14} />
                        </div>
                        <div className="flex-1">
                          <div className="text-[10px] text-gray-500 font-mono mb-0.5">{p.productionNumber} • {new Date(p.date).toLocaleDateString()}</div>
                          <div className="font-bold text-gray-800 text-xs">Convertido en: {p.resultProducts}</div>
                        </div>
                        <div className="text-[10px] font-bold text-carey-red bg-red-50 px-2 py-1 rounded border border-red-100">Consumido: {p.quantity} {traceData.targetLot.product.unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {traceData.destinations.dispatches.length === 0 && traceData.destinations.productions.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500 shadow-sm">
                  Este lote aún no ha sido despachado ni consumido. Todo el stock sigue almacenado.
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
