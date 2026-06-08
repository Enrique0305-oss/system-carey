"use client";

import { useEffect, useState } from "react";
import { Plus, Check, Search } from "lucide-react";
import toast from "react-hot-toast";

export default function ProduccionTerminadosPage() {
  const [producciones, setProducciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);

  // Recipe Production State
  const [targetProduct, setTargetProduct] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("");
  const [targetExpiration, setTargetExpiration] = useState("");
  
  const [isRecipeLoaded, setIsRecipeLoaded] = useState(false);
  const [recipeInputs, setRecipeInputs] = useState<{ productId: string, lotId: string, quantity: string, required: number }[]>([]);

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
        fetch("http://localhost:4000/api/products?status=TODOS")
      ]);
      const prodData = await prodRes.json();
      const productsData = await productsRes.json();
      
      setProducciones(prodData);
      setProductos(productsData);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const loadRecipe = async () => {
    if (!targetProduct || !targetQuantity || Number(targetQuantity) <= 0) {
      toast.error("Selecciona un producto y cantidad válida");
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/api/products/${targetProduct}/recipe`);
      const data = await res.json();
      
      if (!data || !data.items || data.items.length === 0) {
        toast.error("Este producto no tiene una receta configurada.");
        return;
      }

      const mult = Number(targetQuantity);
      const inputsCalc = data.items.map((item: any) => {
        const requiredQty = item.quantity * mult;
        return {
          productId: item.inputId,
          lotId: "",
          quantity: requiredQty.toFixed(2),
          required: requiredQty
        };
      });

      setRecipeInputs(inputsCalc);
      setIsRecipeLoaded(true);
      toast.success("Receta cargada y calculada exitosamente.");
    } catch (error) {
      toast.error("Error al cargar la receta.");
    }
  };

  const handleCreateProduccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRecipeLoaded || recipeInputs.some(i => !i.lotId || !i.quantity || Number(i.quantity) <= 0)) {
      toast.error("Por favor completa todos los lotes de los insumos");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Formato para el backend (inputs y outputs)
      const inputs = recipeInputs.map(i => ({
        productId: i.productId,
        lotId: i.lotId,
        quantity: i.quantity
      }));
      
      const outputs = [{
        productId: targetProduct,
        quantity: targetQuantity,
        expirationDate: targetExpiration
      }];

      const res = await fetch("http://localhost:4000/api/produccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          createdBy: userName,
          inputs,
          outputs,
          inheritProvider: false
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchData();
        toast.success("Producción de Terminado registrada con éxito");
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al registrar producción");
      }
    } catch (error) {
      toast.error("Error de red al registrar producción");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTargetProduct("");
    setTargetQuantity("");
    setTargetExpiration("");
    setIsRecipeLoaded(false);
    setRecipeInputs([]);
  };

  const terminados = productos.filter(p => p.warehouse?.name === "Productos Terminados");

  // Calcular Lote Preview y Proveedor Heredado
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  let todayLotsCount = 0;
  productos.forEach(p => {
    p.lots?.forEach((l: any) => {
      if (l.lotCode?.startsWith(`L-${dateStr}-`)) {
        todayLotsCount++;
      }
    });
  });
  const previewLotCode = `L-${dateStr}-${String(todayLotsCount + 1).padStart(2, '0')}`;

  const hasInsufficientStock = isRecipeLoaded && recipeInputs.some(inp => {
    if (!inp.lotId) return false;
    const p = productos.find(x => x.id === inp.productId);
    const selectedLot = p?.lots?.find((l: any) => l.id === inp.lotId);
    return selectedLot && Number(inp.quantity) > Number(selectedLot.quantity);
  });

  return (
    <div className="space-y-6 p-2">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            Producción Terminados
          </h1>
          <p className="text-gray-500 mt-1">Transformaciones basadas en Recetas Maestra.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-carey-red hover:bg-red-800 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md shadow-red-200 flex items-center gap-2"
        >
          <Plus size={20} />
          Nueva Producción
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
                <th className="px-6 py-4 font-semibold">Insumos (Receta)</th>
                <th className="px-6 py-4 font-semibold">Resultado Terminado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">Cargando...</td>
                </tr>
              ) : producciones.filter(prod => prod.outputs.some((out: any) => out.product?.warehouseId === terminados[0]?.warehouseId || out.product?.warehouse?.name === "Productos Terminados")).length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <p className="mt-4 font-medium">No hay producciones de terminados registradas</p>
                  </td>
                </tr>
              ) : (
                producciones.filter(prod => prod.outputs.some((out: any) => out.product?.warehouseId === terminados[0]?.warehouseId || out.product?.warehouse?.name === "Productos Terminados")).map((prod) => (
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
                      <ul className="list-none space-y-3">
                        {prod.inputs.map((inp: any) => (
                          <li key={inp.id}>
                            <div className="font-medium text-gray-800">{inp.product.description} <span className="text-gray-500 font-normal">({inp.quantity} {inp.product.unit})</span></div>
                            <div className="text-gray-500 text-xs flex items-center gap-2 mt-1">
                              <span className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded font-mono text-[11px]">{inp.lot?.lotCode}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      <ul className="list-none space-y-3">
                        {prod.outputs.map((out: any) => (
                          <li key={out.id}>
                            <div className="font-medium text-gray-800">{out.product.description} <span className="text-gray-500 font-normal">({out.quantity} {out.product.unit})</span></div>
                            <div className="text-gray-500 text-xs flex items-center gap-2 mt-1">
                              <span className="bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded font-mono text-[11px]">{out.lot.lotCode}</span>
                            </div>
                          </li>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">Nueva Producción por Receta</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 p-2 rounded-full">✕</button>
            </div>
            
            <form onSubmit={handleCreateProduccion} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-8 flex-1">
                
                {/* PASO 1 */}
                <div className="bg-gray-50/30 p-5 rounded-xl border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">Paso 1: ¿Qué vamos a producir?</h3>
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-5">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Producto Terminado</label>
                      <select 
                        value={targetProduct}
                        onChange={(e) => { setTargetProduct(e.target.value); setIsRecipeLoaded(false); }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-carey-red bg-white"
                      >
                        <option value="">Seleccione producto...</option>
                        {terminados.filter(p => p.status === 'ACTIVO').map(p => (
                          <option key={p.id} value={p.id}>{p.description} ({p.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Cantidad a Producir</label>
                      <input 
                        type="number" step="0.01" min="0"
                        value={targetQuantity}
                        onChange={(e) => { setTargetQuantity(e.target.value); setIsRecipeLoaded(false); }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-carey-red"
                      />
                    </div>
                    <div className="col-span-4">
                      <button 
                        type="button" 
                        onClick={loadRecipe}
                        disabled={!targetProduct || !targetQuantity}
                        className="w-full h-[38px] bg-gray-900 text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50"
                      >
                        Cargar Receta y Calcular
                      </button>
                    </div>
                  </div>
                </div>

                {/* PASO 2: RECETA CALCULADA */}
                {isRecipeLoaded && (
                  <div className="space-y-6">
                    <div className="bg-red-50/30 p-5 rounded-xl border border-red-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">Paso 2: Confirmar Insumos (Salidas)</h3>
                      <p className="text-sm text-gray-500 mb-4">El sistema ha calculado estas cantidades. Selecciona el lote para cada insumo (puedes ajustar la cantidad si fue diferente).</p>
                      
                      <div className="space-y-3">
                        {recipeInputs.map((inp, idx) => {
                          const p = productos.find(x => x.id === inp.productId);
                          return (
                            <div key={idx} className="flex gap-3 items-end bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                              <div className="w-1/3">
                                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Insumo Requerido</label>
                                <div className="px-3 py-2 bg-gray-50 rounded-lg text-sm text-gray-800 font-medium border border-gray-100">{p?.description}</div>
                              </div>
                              <div className="w-1/3">
                                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Lote Origen</label>
                                <select 
                                  value={inp.lotId}
                                  onChange={(e) => {
                                    const newInputs = [...recipeInputs];
                                    newInputs[idx].lotId = e.target.value;
                                    setRecipeInputs(newInputs);
                                  }}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
                                >
                                  <option value="">Seleccione lote...</option>
                                  {p?.lots?.map((l: any) => (
                                    <option key={l.id} value={l.id}>{l.lotCode} (Stock: {l.quantity})</option>
                                  ))}
                                </select>
                              </div>
                              <div className="w-1/3">
                                <label className="block text-[11px] font-semibold text-gray-500 mb-1">Cantidad Consumida ({p?.unit})</label>
                                <input 
                                  type="number" step="0.01" min="0"
                                  value={inp.quantity}
                                  onChange={(e) => {
                                    const newInputs = [...recipeInputs];
                                    newInputs[idx].quantity = e.target.value;
                                    setRecipeInputs(newInputs);
                                  }}
                                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                                />
                                {Number(inp.quantity) !== inp.required && (
                                  <div className="text-[10px] text-orange-600 mt-1 font-medium">Original: {inp.required.toFixed(2)}</div>
                                )}
                                {(() => {
                                  if (!inp.lotId) return null;
                                  const selectedLot = p?.lots?.find((l: any) => l.id === inp.lotId);
                                  if (selectedLot && Number(inp.quantity) > Number(selectedLot.quantity)) {
                                    return <div className="text-[10px] text-red-600 mt-1 font-bold">¡Falta stock! Disp: {selectedLot.quantity}</div>;
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-green-50/30 p-5 rounded-xl border border-green-100">
                      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">Paso 3: Resultado (Entrada)</h3>
                      <div className="flex gap-4">
                        <div className="flex-1 px-4 py-3 bg-white border border-green-200 rounded-lg">
                          <span className="text-sm text-gray-500 block mb-1">Se registrará en inventario:</span>
                          <span className="font-bold text-green-700 text-lg">+{targetQuantity} {productos.find(p=>p.id===targetProduct)?.unit} de {productos.find(p=>p.id===targetProduct)?.description}</span>
                          <div className="mt-2">
                            <span className="text-gray-900 font-mono text-sm bg-green-50 px-2 py-1 rounded border border-green-200">{previewLotCode}</span>
                          </div>
                        </div>
                        <div className="w-48">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Vencimiento (Opcional)</label>
                          <input 
                            type="date" 
                            value={targetExpiration}
                            onChange={(e) => setTargetExpiration(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-100">Cancelar</button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !isRecipeLoaded || hasInsufficientStock}
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
