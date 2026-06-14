"use client";

import { useEffect, useState } from "react";
import { Plus, Check, Eye, Search, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function ProduccionPage() {
  const [producciones, setProducciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);

  // Filters and Pagination
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Form State
  const [inputs, setInputs] = useState<{ productId: string, lotId: string, quantity: string }[]>([]);
  const [outputs, setOutputs] = useState<{ productId: string, quantity: string, expirationDate: string }[]>([]);
  
  const [currentInput, setCurrentInput] = useState({ warehouseId: "", productId: "", lotId: "", quantity: "" });
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
      setInputs([...inputs, { productId: currentInput.productId, lotId: currentInput.lotId, quantity: currentInput.quantity }]);
      setCurrentInput({ warehouseId: currentInput.warehouseId, productId: "", lotId: "", quantity: "" }); // keep warehouse selected for convenience
    }
  };

  const addOutput = () => {
    if (currentOutput.productId && currentOutput.quantity) {
      setOutputs([...outputs, currentOutput]);
      setCurrentOutput({ productId: "", quantity: "", expirationDate: "" });
    }
  };

  // Filtrado
  const baseProducciones = producciones.filter(prod => !prod.outputs.some((out: any) => out.product?.warehouse?.name === "Productos Terminados"));

  const filteredProducciones = baseProducciones.filter(prod => {
    // Buscar en código o en nombre del resultado
    const matchesSearch = prod.productionNumber?.toLowerCase().includes(search.toLowerCase()) || 
                          prod.outputs.some((out: any) => out.product?.description.toLowerCase().includes(search.toLowerCase()));

    let matchesDate = true;
    if (startDate || endDate) {
      const pDate = new Date(prod.date);
      pDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        if (pDate < sDate) matchesDate = false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(0, 0, 0, 0);
        if (pDate > eDate) matchesDate = false;
      }
    }
    return matchesSearch && matchesDate;
  });

  // Reset pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate]);

  const totalPages = Math.ceil(filteredProducciones.length / ITEMS_PER_PAGE);
  const paginatedProducciones = filteredProducciones.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const generatePagination = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
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
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Historial de Producciones</h2>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por código o resultado..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-carey-red focus:border-transparent transition-all text-gray-900"
              />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-500 font-medium">Desde:</span>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-carey-red"
              />
              <span className="text-sm text-gray-500 font-medium">Hasta:</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-carey-red"
              />
            </div>
            {(search || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1000px]">
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
              ) : paginatedProducciones.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <p className="mt-4 font-medium">No se encontraron producciones</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducciones.map((prod) => (
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
                              {inp.lot?.provider && (
                                <span className="text-gray-400 flex items-center gap-1">
                                  &bull; {inp.lot.provider.razonSocial}
                                </span>
                              )}
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
                              {out.lot.provider && (
                                <span className="text-gray-400 flex items-center gap-1">
                                  &bull; {out.lot.provider.razonSocial}
                                </span>
                              )}
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

        {/* Controles de Paginación */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Mostrando <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>-
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducciones.length)}
              </span>{' '}
              de <span className="font-medium">{filteredProducciones.length}</span> producciones
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-2 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              
              {generatePagination().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' ? setCurrentPage(page) : null}
                  disabled={page === '...'}
                  className={`px-3.5 py-2 border rounded-md text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-carey-red text-white border-carey-red'
                      : page === '...'
                      ? 'border-transparent text-gray-400 cursor-default'
                      : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-2 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
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
                  
                  {/* Extract unique warehouses for filter */}
                  {(() => {
                    const uniqueWarehouses = Array.from(new Set(productos.map(p => p.warehouse?.id)))
                      .map(id => productos.find(p => p.warehouse?.id === id)?.warehouse)
                      .filter(Boolean);
                    
                    const availableProducts = currentInput.warehouseId 
                      ? productos.filter(p => p.warehouse?.id === currentInput.warehouseId && p.status === 'ACTIVO')
                      : [];

                    return (
                      <div className="grid grid-cols-12 gap-3 mb-4">
                        <div className="col-span-3">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Almacén Origen</label>
                          <select 
                            value={currentInput.warehouseId}
                            onChange={(e) => setCurrentInput({...currentInput, warehouseId: e.target.value, productId: "", lotId: ""})}
                            className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-carey-red bg-white outline-none"
                          >
                            <option value="">Seleccione...</option>
                            {uniqueWarehouses.map((w: any) => (
                              <option key={w.id} value={w.id}>{w.name === "Productos Secos" ? "Insumos alimentarios" : w.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Producto</label>
                          <select 
                            value={currentInput.productId}
                            disabled={!currentInput.warehouseId}
                            onChange={(e) => setCurrentInput({...currentInput, productId: e.target.value, lotId: ""})}
                            className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-carey-red bg-white disabled:bg-gray-100 disabled:opacity-50 outline-none"
                          >
                            <option value="">Seleccione producto...</option>
                            {availableProducts.map(p => (
                              <option key={p.id} value={p.id}>{p.description} ({p.unit})</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Lote Origen</label>
                          <select 
                            value={currentInput.lotId}
                            onChange={(e) => setCurrentInput({...currentInput, lotId: e.target.value})}
                            className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-carey-red bg-white disabled:bg-gray-100 disabled:opacity-50 outline-none"
                            disabled={!currentInput.productId}
                          >
                            <option value="">Seleccione lote...</option>
                            {currentInput.productId && availableProducts.find(p => p.id === currentInput.productId)?.lots?.filter((l:any)=>l.status==='ACTIVO' && Number(l.quantity)>0).map((l: any) => (
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
                            className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-900 focus:ring-1 focus:ring-carey-red outline-none"
                          />
                        </div>
                        <div className="col-span-1 flex items-end pb-0.5">
                          <button 
                            type="button" onClick={addInput}
                            className="w-full h-[36px] bg-gray-900 text-white rounded-lg flex items-center justify-center hover:bg-gray-800 transition-colors"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}

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
                                <td className="px-3 py-2 text-gray-500">
                                  {l?.lotCode}
                                  {l?.provider && <div className="text-xs text-blue-600 font-medium truncate max-w-[120px]">{l.provider.razonSocial}</div>}
                                </td>
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
                          {(() => {
                            const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
                            let todayLotsCount = 0;
                            productos.forEach(p => {
                              p.lots?.forEach((l: any) => {
                                if (l.lotCode?.startsWith(`L-${dateStr}-`)) {
                                  todayLotsCount++;
                                }
                              });
                            });

                            return outputs.map((out, idx) => {
                              const p = productos.find(x => x.id === out.productId);
                              const inheritedProvider = inputs.map(inp => {
                                const prodInp = productos.find(x => x.id === inp.productId);
                                return prodInp?.lots?.find((x: any) => x.id === inp.lotId)?.provider;
                              }).find(prov => prov);
                              
                              const previewLotCode = `L-${dateStr}-${String(todayLotsCount + idx + 1).padStart(2, '0')}`;

                              return (
                                <tr key={idx}>
                                  <td className="px-3 py-2 font-medium text-gray-900">{p?.description}</td>
                                  <td className="px-3 py-2">
                                    <span className="text-gray-900 font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">{previewLotCode}</span>
                                    {inheritedProvider && <div className="text-xs text-blue-600 font-medium truncate max-w-[120px] mt-0.5">Prov: {inheritedProvider.razonSocial}</div>}
                                  </td>
                                  <td className="px-3 py-2 text-right font-bold text-green-600">+{out.quantity} {p?.unit}</td>
                                </tr>
                              );
                            });
                          })()}
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
