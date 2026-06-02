"use client";

import { useEffect, useState } from "react";
import { Plus, Check, Eye } from "lucide-react";
import toast from "react-hot-toast";

export default function ProduccionPage() {
  const [producciones, setProducciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);

  // Form State
  const [inputs, setInputs] = useState<{ productId: string, lotId: string, quantity: string }[]>([]);
  const [outputs, setOutputs] = useState<{ productId: string, quantity: string, expirationDate: string }[]>([]);
  
  const [currentInput, setCurrentInput] = useState({ productId: "", lotId: "", quantity: "" });
  const [currentOutput, setCurrentOutput] = useState({ productId: "", quantity: "", expirationDate: "" });

  const [userName, setUserName] = useState("Usuario");

  useEffect(() => {
    import('js-cookie').then((Cookies) => {
      setUserName(Cookies.default.get('user_name') || "Usuario");
    });
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, productsRes] = await Promise.all([
        fetch("http://localhost:4000/api/produccion"),
        fetch("http://localhost:4000/api/products?status=TODOS") // or create an endpoint to fetch all active products
      ]);
      const prodData = await prodRes.json();
      const productsData = await productsRes.json();
      
      setProducciones(prodData);
      setProductos(productsData);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const showSuccessToast = (message: string) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} w-auto min-w-[260px] bg-[#f0fdf4] shadow-md rounded-xl pointer-events-auto flex ring-1 ring-black/5`}>
        <div className="flex-1 p-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-[#dcfce7] rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="h-4 w-4 text-[#16a34a]" strokeWidth={3} />
            </div>
            <p className="text-[14px] font-semibold text-[#166534] pr-2">
              {message}
            </p>
          </div>
        </div>
        <div className="flex border-l border-green-100">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-xl px-3 py-2 flex items-center justify-center text-sm font-medium text-green-600 hover:text-green-500 hover:bg-green-50 focus:outline-none transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    ));
  };

  const handleCreateProduccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputs.length === 0 || outputs.length === 0) {
      toast.error("Debes agregar al menos un insumo y un resultado");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:4000/api/produccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          createdBy: userName,
          inputs,
          outputs
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setInputs([]);
        setOutputs([]);
        setCurrentInput({ productId: "", lotId: "", quantity: "" });
        setCurrentOutput({ productId: "", quantity: "", expirationDate: "" });
        fetchData();
        showSuccessToast("Producción registrada con éxito");
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al registrar producción");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de red al registrar producción");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addInput = () => {
    if (currentInput.productId && currentInput.lotId && currentInput.quantity) {
      setInputs([...inputs, currentInput]);
      setCurrentInput({ productId: "", lotId: "", quantity: "" });
    }
  };

  const addOutput = () => {
    if (currentOutput.productId && currentOutput.quantity) {
      setOutputs([...outputs, currentOutput]);
      setCurrentOutput({ productId: "", quantity: "", expirationDate: "" });
    }
  };

  return (
    <div className="space-y-6 p-2">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            Producción <span className="text-carey-red">Interna</span>
          </h1>
          <p className="text-gray-500 mt-1">Gestión de transformaciones y curado.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-carey-red hover:bg-red-800 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md shadow-red-200 flex items-center gap-2"
        >
          <Plus size={20} />
          Registrar Producción
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Historial de Producciones</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold w-32">Código</th>
                <th className="px-6 py-4 font-semibold w-40">Fecha</th>
                <th className="px-6 py-4 font-semibold">Responsable</th>
                <th className="px-6 py-4 font-semibold">Insumos</th>
                <th className="px-6 py-4 font-semibold">Resultados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">Cargando...</td>
                </tr>
              ) : producciones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <p className="mt-4 font-medium">No hay producciones registradas</p>
                    </div>
                  </td>
                </tr>
              ) : (
                producciones.map((prod) => (
                  <tr key={prod.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md">{prod.productionNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">
                      {new Date(prod.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {prod.createdBy}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <ul className="list-disc pl-4">
                        {prod.inputs.map((inp: any) => (
                          <li key={inp.id}>{inp.product.description} ({inp.quantity} {inp.product.unit})</li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <ul className="list-disc pl-4">
                        {prod.outputs.map((out: any) => (
                          <li key={out.id}>{out.product.description} ({out.quantity} {out.product.unit}) - Lote: {out.lot.lotCode}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE PRODUCCIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h2 className="text-xl font-bold text-gray-800">Registrar Producción Interna</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-white hover:bg-gray-100 p-2 rounded-full"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateProduccion} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                
                {/* LADO IZQUIERDO: INSUMOS */}
                <div className="bg-red-50/30 p-5 rounded-xl border border-red-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    1. Insumos Consumidos (Salidas)
                  </h3>
                  
                  <div className="grid grid-cols-12 gap-3 mb-4">
                    <div className="col-span-5">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Producto</label>
                      <select 
                        value={currentInput.productId}
                        onChange={(e) => setCurrentInput({...currentInput, productId: e.target.value, lotId: ""})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-carey-red bg-white"
                      >
                        <option value="">Seleccione producto...</option>
                        {productos.filter(p => p.status === 'ACTIVO').map(p => (
                          <option key={p.id} value={p.id}>{p.description} ({p.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-4">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Lote Origen</label>
                      <select 
                        value={currentInput.lotId}
                        onChange={(e) => setCurrentInput({...currentInput, lotId: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-carey-red bg-white"
                        disabled={!currentInput.productId}
                      >
                        <option value="">Seleccione lote...</option>
                        {currentInput.productId && productos.find(p => p.id === currentInput.productId)?.lots?.map((l: any) => (
                          <option key={l.id} value={l.id}>{l.lotCode} (Stock: {l.quantity})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Cantidad</label>
                      <input 
                        type="number" 
                        step="0.01" min="0"
                        value={currentInput.quantity}
                        onChange={(e) => setCurrentInput({...currentInput, quantity: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-carey-red"
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <button 
                        type="button" onClick={addInput}
                        className="w-full h-[38px] bg-gray-900 text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  {inputs.length > 0 && (
                    <div className="border border-red-200 rounded-lg bg-white overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-red-50 text-red-800">
                          <tr>
                            <th className="px-3 py-2">Producto</th>
                            <th className="px-3 py-2">Lote</th>
                            <th className="px-3 py-2 text-right">Cant.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {inputs.map((inp, idx) => {
                            const p = productos.find(x => x.id === inp.productId);
                            const l = p?.lots?.find((x: any) => x.id === inp.lotId);
                            return (
                              <tr key={idx}>
                                <td className="px-3 py-2 font-medium text-gray-900">{p?.description}</td>
                                <td className="px-3 py-2 text-gray-500">{l?.lotCode}</td>
                                <td className="px-3 py-2 text-right font-bold text-red-600">-{inp.quantity} {p?.unit}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* LADO DERECHO: RESULTADOS */}
                <div className="bg-green-50/30 p-5 rounded-xl border border-green-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    2. Productos Resultantes (Entradas)
                  </h3>
                  
                  <div className="grid grid-cols-12 gap-3 mb-4">
                    <div className="col-span-5">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Producto</label>
                      <select 
                        value={currentOutput.productId}
                        onChange={(e) => setCurrentOutput({...currentOutput, productId: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-green-500 bg-white"
                      >
                        <option value="">Seleccione producto...</option>
                        {productos.filter(p => p.status === 'ACTIVO').map(p => (
                          <option key={p.id} value={p.id}>{p.description} ({p.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Vencimiento</label>
                      <input 
                        type="date" 
                        value={currentOutput.expirationDate}
                        onChange={(e) => setCurrentOutput({...currentOutput, expirationDate: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Cantidad</label>
                      <input 
                        type="number" 
                        step="0.01" min="0"
                        value={currentOutput.quantity}
                        onChange={(e) => setCurrentOutput({...currentOutput, quantity: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <button 
                        type="button" onClick={addOutput}
                        className="w-full h-[38px] bg-gray-900 text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>

                  {outputs.length > 0 && (
                    <div className="border border-green-200 rounded-lg bg-white overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-green-50 text-green-800">
                          <tr>
                            <th className="px-3 py-2">Producto</th>
                            <th className="px-3 py-2">Lote</th>
                            <th className="px-3 py-2 text-right">Cant.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {outputs.map((out, idx) => {
                            const p = productos.find(x => x.id === out.productId);
                            return (
                              <tr key={idx}>
                                <td className="px-3 py-2 font-medium text-gray-900">{p?.description}</td>
                                <td className="px-3 py-2 text-gray-500 italic">Auto-generado</td>
                                <td className="px-3 py-2 text-right font-bold text-green-600">+{out.quantity} {p?.unit}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || inputs.length === 0 || outputs.length === 0}
                  className="px-6 py-2.5 bg-carey-red text-white rounded-xl font-medium hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-red-200"
                >
                  {isSubmitting ? 'Procesando...' : 'Confirmar Producción'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
