"use client";

import { useEffect, useState } from "react";
import { Plus, Check, Search, Truck, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export default function DespachosPage() {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [userName, setUserName] = useState("Sistema");

  // Obtener fecha local (evitar que cambie de día por el UTC)
  const tzOffset = (new Date()).getTimezoneOffset() * 60000;
  const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];

  const [clientId, setClientId] = useState("");
  const [dispatchDate, setDispatchDate] = useState(localISOTime);
  
  // Estado para los ítems del carrito
  const [dispatchItems, setDispatchItems] = useState<any[]>([
    { warehouseId: "", productId: "", lotId: "", quantity: "" }
  ]);

  useEffect(() => {
    import('js-cookie').then((Cookies) => {
      setUserName(Cookies.default.get('user_name') || "Sistema");
    });
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resDis, resCli, resProd] = await Promise.all([
        fetch("http://localhost:4000/api/dispatches"),
        fetch("http://localhost:4000/api/clients"),
        fetch("http://localhost:4000/api/products?status=TODOS")
      ]);
      setDispatches(await resDis.json());
      setClients(await resCli.json());
      setProductos(await resProd.json());
    } catch (err) {
      console.error(err);
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
            <p className="text-[14px] font-semibold text-[#166534] pr-2">{message}</p>
          </div>
        </div>
        <div className="flex border-l border-green-100">
          <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-xl px-3 py-2 flex items-center justify-center text-sm font-medium text-green-600 hover:text-green-500 hover:bg-green-50 transition-colors">✕</button>
        </div>
      </div>
    ));
  };

  const resetForm = () => {
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().split('T')[0];
    
    setClientId("");
    setDispatchDate(localISOTime);
    setDispatchItems([{ warehouseId: "", productId: "", lotId: "", quantity: "" }]);
  };

  const handleAddItem = () => {
    setDispatchItems([...dispatchItems, { warehouseId: "", productId: "", lotId: "", quantity: "" }]);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...dispatchItems];
    newItems.splice(index, 1);
    setDispatchItems(newItems);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...dispatchItems];
    newItems[index][field] = value;
    if (field === "productId") {
      newItems[index].lotId = "";
    }
    setDispatchItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || dispatchItems.length === 0 || dispatchItems.some(i => !i.productId || !i.lotId || !i.quantity || Number(i.quantity) <= 0)) {
      toast.error("Por favor completa todos los campos correctamente.");
      return;
    }

    // Validación de stock
    for (const item of dispatchItems) {
      const p = productos.find(x => x.id === item.productId);
      const l = p?.lots?.find((x: any) => x.id === item.lotId);
      if (l && Number(item.quantity) > Number(l.quantity)) {
        toast.error(`Stock insuficiente para ${p.description}. Disponible: ${l.quantity}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:4000/api/dispatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          date: dispatchDate,
          createdBy: userName,
          items: dispatchItems.map(i => ({
            productId: i.productId,
            lotId: i.lotId,
            quantity: Number(i.quantity)
          }))
        })
      });

      if (res.ok) {
        showSuccessToast("Despacho registrado con éxito");
        setIsModalOpen(false);
        resetForm();
        fetchData(); // Recargar datos para actualizar stock e historial
      } else {
        const errData = await res.json();
        toast.error(errData.error || "Error al registrar despacho");
      }
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar despachos en base a búsqueda
  const filteredDispatches = dispatches.filter(d => 
    d.dispatchNumber.toLowerCase().includes(search.toLowerCase()) || 
    d.client?.razonSocial.toLowerCase().includes(search.toLowerCase())
  );

  // Extraer solo productos de Productos Terminados
  const termProducts = productos.filter(p => p.warehouse?.name === "Productos Terminados" && p.status === 'ACTIVO');

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <Truck className="text-carey-red" size={28} /> Salidas / Ventas
          </h1>
          <p className="text-gray-500 mt-1">Registra la salida de productos hacia tus clientes.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-carey-red hover:bg-red-800 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md shadow-red-200 flex items-center gap-2"
        >
          <Plus size={20} />
          Nuevo Despacho
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">Historial de Despachos</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar código o cliente..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-carey-red text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Código</th>
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Productos Despachados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">Cargando...</td></tr>
              ) : filteredDispatches.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-500">No hay despachos registrados.</td></tr>
              ) : (
                filteredDispatches.map(d => (
                  <tr key={d.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md">{d.dispatchNumber}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{new Date(d.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{d.client?.razonSocial}</td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {d.items?.map((item: any) => (
                          <div key={item.id} className="text-[13px] flex items-center justify-between bg-white border border-gray-100 px-2 py-1 rounded">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700">{item.product?.description}</span>
                              <span className="text-[10px] text-gray-400 font-mono">Lote: {item.lot?.lotCode}</span>
                            </div>
                            <span className="font-bold text-red-600">-{item.quantity} {item.product?.unit}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Truck className="text-carey-red" size={24} /> Registrar Despacho
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-white hover:bg-gray-100 p-2 rounded-full"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                
                <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200 grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Cliente *</label>
                    <select 
                      required
                      value={clientId}
                      onChange={e => setClientId(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-carey-red bg-white"
                    >
                      <option value="">Seleccione un cliente...</option>
                      {clients.filter(c => c.estado === "ACTIVO").map(c => (
                        <option key={c.id} value={c.id}>{c.razonSocial} {c.ruc ? `(${c.ruc})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha de Despacho *</label>
                    <input 
                      type="date" required
                      value={dispatchDate}
                      onChange={e => setDispatchDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-carey-red"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Productos a Despachar</h3>
                    <button 
                      type="button" onClick={handleAddItem}
                      className="text-sm text-carey-red font-medium hover:underline flex items-center gap-1"
                    >
                      <Plus size={16} /> Añadir Producto
                    </button>
                  </div>

                  {dispatchItems.map((item, index) => {
                    // Solo mostramos productos terminados
                    const availableProducts = termProducts;
                    
                    // Encontrar el producto seleccionado para obtener sus lotes
                    const selectedProduct = availableProducts.find(p => p.id === item.productId);
                    // Solo lotes activos con stock > 0
                    const availableLots = selectedProduct?.lots?.filter((l: any) => l.status === 'ACTIVO' && Number(l.quantity) > 0) || [];

                    const hasInsufficientStock = item.lotId && selectedProduct?.lots?.find((l: any) => l.id === item.lotId && Number(item.quantity) > Number(l.quantity));

                    return (
                      <div key={index} className="grid grid-cols-12 gap-3 items-end bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <div className="col-span-5">
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Producto Terminado</label>
                          <select 
                            required value={item.productId}
                            onChange={(e) => updateItem(index, 'productId', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white text-gray-900 focus:ring-1 focus:ring-carey-red outline-none"
                          >
                            <option value="">Seleccione Producto...</option>
                            {availableProducts.map(p => (
                              <option key={p.id} value={p.id}>{p.description}</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-4">
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Lote Específico</label>
                          <select 
                            required value={item.lotId}
                            disabled={!item.productId}
                            onChange={(e) => updateItem(index, 'lotId', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:opacity-50 focus:ring-1 focus:ring-carey-red outline-none"
                          >
                            <option value="">Seleccione Lote...</option>
                            {availableLots.map((l: any) => (
                              <option key={l.id} value={l.id}>{l.lotCode} (Disp: {l.quantity})</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[11px] font-semibold text-gray-500 mb-1">Cantidad a Vender</label>
                          <input 
                            type="number" step="0.01" min="0.01" required
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                            className={`w-full border rounded-lg px-2 py-2 text-sm text-gray-900 outline-none ${hasInsufficientStock ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300 focus:ring-1 focus:ring-carey-red'}`}
                          />
                          {hasInsufficientStock && (
                            <div className="text-[10px] text-red-600 mt-1 font-bold">¡Falta stock!</div>
                          )}
                        </div>

                        <div className="col-span-1 flex justify-center pb-1">
                          {dispatchItems.length > 1 && (
                            <button 
                              type="button" onClick={() => handleRemoveItem(index)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3 shrink-0">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" disabled={isSubmitting}
                  className="px-6 py-2.5 bg-carey-red text-white rounded-xl font-medium hover:bg-red-800 transition-colors disabled:opacity-50 shadow-md shadow-red-200"
                >
                  {isSubmitting ? 'Registrando...' : 'Confirmar Despacho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
