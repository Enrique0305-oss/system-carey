"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import Cookies from "js-cookie";
import { showSuccessToast, showErrorToast } from "@/components/Toast";

export default function ConsumoInternoPage() {
  const [consumos, setConsumos] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const [formData, setFormData] = useState({
    warehouseId: "",
    productId: "",
    lotId: "",
    typeDirection: "SALIDA",
    quantity: 1,
    reason: "Consumo Interno",
    reference: ""
  });

  useEffect(() => {
    fetchConsumos();
    fetchProductos();
    fetchWarehouses();
  }, []);

  const fetchWarehouses = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/warehouses");
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data);
      }
    } catch (error) {
      console.error("Error fetching warehouses", error);
    }
  };

  const fetchConsumos = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/internal-consumptions");
      if (res.ok) {
        const data = await res.json();
        setConsumos(data);
      }
    } catch (error) {
      console.error("Error fetching consumos", error);
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/products?status=TODOS");
      if (res.ok) {
        const data = await res.json();
        setProductos(data);
      }
    } catch (error) {
      console.error("Error fetching productos", error);
    }
  };

  const handleCreateConsumo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const currentUserName = Cookies.get("user_name") || "Usuario Desconocido";
      
      const res = await fetch("http://localhost:4000/api/internal-consumptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: formData.reference, // La justificación la guardabamos en reference
          createdBy: currentUserName,
          items: [{
            productId: formData.productId,
            lotId: formData.lotId,
            quantity: formData.quantity
          }]
        })
      });

      if (res.ok) {
        showSuccessToast("Consumo registrado correctamente");
        setIsModalOpen(false);
        setFormData({
          warehouseId: formData.warehouseId,
          productId: "",
          lotId: "",
          typeDirection: "SALIDA",
          quantity: 1,
          reason: "Consumo Interno",
          reference: ""
        });
        fetchConsumos();
        fetchProductos();
      } else {
        const data = await res.json();
        showErrorToast(data.error || "Error al registrar el consumo");
      }
    } catch (error) {
      showErrorToast("Error de red al registrar el consumo");
    } finally {
      setLoading(false);
    }
  };

  const filteredConsumos = consumos.filter(c => {
    // Buscar en los items
    const matchesSearch = c.items?.some((item: any) => 
      item.product?.description.toLowerCase().includes(search.toLowerCase())
    ) || (c.reason && c.reason.toLowerCase().includes(search.toLowerCase())) || c.consumptionNumber.toLowerCase().includes(search.toLowerCase());
    
    let matchesDate = true;
    if (startDate || endDate) {
      const cDate = new Date(c.date);
      cDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        if (cDate < sDate) matchesDate = false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(0, 0, 0, 0);
        if (cDate > eDate) matchesDate = false;
      }
    }
    return matchesSearch && matchesDate;
  });

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, startDate, endDate]);

  const totalPages = Math.ceil(filteredConsumos.length / ITEMS_PER_PAGE);
  const paginatedConsumos = filteredConsumos.slice(
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

  // Extraemos los almacenes reales desde el endpoint para que siempre aparezcan, 
  // incluso si aún no hay productos registrados en ellos.
  const allowedWarehouses = warehouses.filter((w: any) => 
    w.name.toLowerCase().includes('suministro') || w.name.toLowerCase().includes('envase') || w.name.toLowerCase().includes('químico') || w.name.toLowerCase().includes('quimico')
  );

  const productosDisponibles = formData.warehouseId 
    ? productos.filter(p => p.status === 'ACTIVO' && p.warehouse?.id === formData.warehouseId)
    : [];

  const selectedProduct = productosDisponibles.find(p => p.id === formData.productId);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#1F2937] tracking-tight flex items-center gap-2">
            Consumo <span className="text-carey-red">Interno</span>
          </h1>
          <p className="text-gray-500 mt-1">Registra la salida de insumos y limpieza para el uso de la empresa.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-carey-red hover:bg-red-800 text-white px-6 py-3 rounded-xl font-medium flex items-center transition-all shadow-md shadow-red-200 gap-2"
        >
          <Plus size={20} /> Registrar Consumo
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 flex flex-wrap gap-4 bg-gray-50/50 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por producto o justificación..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-carey-red focus:border-transparent transition-all text-gray-900"
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
              Limpiar filtros
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-gray-500 font-bold text-[11px] uppercase bg-gray-50/80 border-b-2 border-gray-100">
              <tr>
                <th className="px-6 py-4">N° Consumo</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Producto Consumido</th>
                <th className="px-6 py-4 text-center">Cantidad</th>
                <th className="px-6 py-4">Justificación</th>
                <th className="px-6 py-4">Registrado Por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedConsumos.map((consumo) => (
                <tr key={consumo.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono font-bold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-md">{consumo.consumptionNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 font-medium">
                      {new Date(consumo.date).toLocaleDateString('es-PE')}
                    </div>
                    <div className="text-gray-500 text-[11px]">
                      {new Date(consumo.date).toLocaleTimeString('es-PE')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {consumo.items?.map((item: any, idx: number) => (
                        <div key={idx}>
                          <div className="font-bold text-gray-900">{item.product?.description}</div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono border border-blue-100">Lote: {item.lot?.lotCode || 'S/L'}</span>
                            <span>{item.product?.warehouse?.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="space-y-2">
                      {consumo.items?.map((item: any, idx: number) => (
                        <div key={idx}>
                          <span className="font-bold px-2.5 py-1 rounded-md text-xs bg-red-100 text-red-800">
                            -{item.quantity} {item.product?.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-[13px]">
                    {consumo.reason || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {consumo.createdBy}
                    </span>
                  </td>
                </tr>
              ))}
              {paginatedConsumos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-base font-medium">No se encontraron registros de consumo interno</p>
                      <p className="text-sm mt-1 text-gray-400">Registra un consumo para que aparezca aquí.</p>
                    </div>
                  </td>
                </tr>
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
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredConsumos.length)}
              </span>{' '}
              de <span className="font-medium">{filteredConsumos.length}</span> consumos
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                Registrar Consumo
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-white hover:bg-gray-100 p-2 rounded-full"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateConsumo} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 gap-5">
                {/* Almacén */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Almacén de Origen *</label>
                  <select 
                    required
                    value={formData.warehouseId}
                    onChange={(e) => setFormData({...formData, warehouseId: e.target.value, productId: "", lotId: ""})}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-carey-red focus:border-carey-red text-gray-900 bg-white"
                  >
                    <option value="">Seleccione un almacén...</option>
                    {allowedWarehouses.map((w: any) => (
                      <option key={w.id} value={w.id}>
                        {w.name.replace('Almacén de ', '').replace('Almacén ', '').replace('Almacn de ', '').replace('Almacn ', '')}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Producto */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Insumo / Suministro *</label>
                  <select 
                    required
                    value={formData.productId}
                    disabled={!formData.warehouseId}
                    onChange={(e) => setFormData({...formData, productId: e.target.value, lotId: ""})}
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-carey-red focus:border-carey-red text-gray-900 bg-white disabled:bg-gray-100 disabled:opacity-60"
                  >
                    <option value="">Seleccione un suministro...</option>
                    {productosDisponibles.map(p => (
                      <option key={p.id} value={p.id}>{p.description}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Lote */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Lote de Origen *</label>
                    <select 
                      required
                      value={formData.lotId}
                      onChange={(e) => setFormData({...formData, lotId: e.target.value})}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-carey-red disabled:bg-gray-100 disabled:opacity-60 text-gray-900 bg-white"
                      disabled={!formData.productId || !selectedProduct?.lots || selectedProduct?.lots.length === 0}
                    >
                      <option value="">Seleccione un lote...</option>
                      {selectedProduct?.lots?.filter((l:any) => l.status==='ACTIVO' && Number(l.quantity) > 0).map((l: any) => (
                        <option key={l.id} value={l.id}>
                          {l.lotCode} (Disp: {l.quantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Cantidad a Extraer *</label>
                    <input 
                      type="number" 
                      required
                      min="0.01"
                      step="0.01"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-carey-red text-gray-900"
                    />
                  </div>
                </div>

                {/* Justificación */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">Justificación (Opcional)</label>
                  <input 
                    type="text" 
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    placeholder="Ej: Para los baños del primer piso, Para oficina..."
                    className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-1 focus:ring-carey-red text-gray-900"
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading || !formData.productId || !formData.lotId}
                  className="px-6 py-2.5 bg-carey-red hover:bg-red-800 text-white rounded-xl font-medium transition-colors shadow-md shadow-red-200 disabled:opacity-50 text-sm"
                >
                  {loading ? 'Procesando...' : 'Confirmar Salida'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
