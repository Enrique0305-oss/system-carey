"use client";

import { useEffect, useState, use } from "react";

import { usePathname } from "next/navigation";
import { Plus, Trash2, Eye, Pencil, Trash, Check } from "lucide-react";
import toast from "react-hot-toast";

// Mapeo de la URL al nombre real de la base de datos
const nameMapping: Record<string, string> = {
  "materia-prima": "Materia Prima",
  "productos-terminados": "Productos Terminados",
  "productos-secos": "Productos Secos",
  "envases": "Envases",
  "quimicos": "Químicos"
};

export default function AlmacenPage({ params }: { params: Promise<{ tipo: string }> }) {
  const resolvedParams = use(params);
  const [productos, setProductos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    category: "",
    unitPrice: "",
    minStock: ""
  });
  
  // Estado para Múltiples Lotes
  const [lots, setLots] = useState<{lotCode: string, expirationDate: string, quantity: string}[]>([]);
  const [currentLot, setCurrentLot] = useState({ lotCode: "", expirationDate: "", quantity: "" });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // View / Edit / Delete State
  const [productToView, setProductToView] = useState<any>(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({ description: "", category: "", unitPrice: "", minStock: "" });
  const [editLots, setEditLots] = useState<any[]>([]);
  const [editCurrentLot, setEditCurrentLot] = useState({ lotCode: "", expirationDate: "", quantity: "" });
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVO");

  const realName = nameMapping[resolvedParams.tipo] || "Almacén Desconocido";

  useEffect(() => {
    if (realName !== "Almacén Desconocido") {
      fetchProducts();
    } else {
      setLoading(false);
    }
  }, [realName, statusFilter]);

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

  const fetchProducts = () => {
    setLoading(true);
    fetch(`http://localhost:4000/api/products?warehouseName=${encodeURIComponent(realName)}&status=${statusFilter}`)
      .then((res) => res.json())
      .then((data) => setProductos(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:4000/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warehouseName: realName,
          description: formData.description,
          category: formData.category,
          unitPrice: formData.unitPrice,
          minStock: formData.minStock,
          lots: lots
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ description: "", category: "", unitPrice: "", minStock: "" });
        setLots([]);
        setCurrentLot({ lotCode: "", expirationDate: "", quantity: "" });
        fetchProducts(); // Recargar la tabla
        showSuccessToast("Producto creado");
      } else {
        toast.error("Error al crear producto");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de red al crear producto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch(`http://localhost:4000/api/products/${productToEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editFormData.description,
          category: editFormData.category,
          unitPrice: editFormData.unitPrice,
          minStock: editFormData.minStock,
          lots: editLots
        })
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchProducts();
        showSuccessToast("Producto actualizado");
      } else {
        toast.error("Error al actualizar producto");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de red al actualizar");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`http://localhost:4000/api/products/${productToDelete.id}`, { method: "DELETE" });
      if (res.ok) {
        setProductToDelete(null);
        fetchProducts();
        showSuccessToast("Producto eliminado");
      } else {
        toast.error("Error al eliminar producto");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de red al eliminar");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReactivateProduct = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVO" })
      });
      if (res.ok) {
        fetchProducts();
        showSuccessToast("Producto reactivado");
      } else {
        toast.error("Error al reactivar producto");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error de red al reactivar");
    }
  };

  const openEditModal = (prod: any) => {
    setProductToEdit(prod);
    setEditFormData({
      description: prod.description,
      category: prod.category,
      unitPrice: prod.unitPrice,
      minStock: prod.minStock !== undefined ? String(prod.minStock) : "0"
    });
    setEditLots(prod.lots || []);
    setIsEditModalOpen(true);
  };

  const filteredProducts = productos.filter(p => p.description.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            Almacén: <span className="text-carey-red">{realName}</span>
          </h1>
          <p className="text-gray-500 mt-1">Gestión de inventario y lotes.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-carey-red hover:bg-red-800 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-md shadow-red-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Inventario Actual</h2>
          
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] w-64 text-gray-900" 
            />
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#111827] text-gray-900 cursor-pointer font-medium"
            >
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
              <option value="TODOS">Todos</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                <th className="px-6 py-4 font-medium">Descripción</th>
                <th className="px-6 py-4 font-medium">Categoría</th>
                <th className="px-6 py-4 font-medium">Unidad</th>
                <th className="px-6 py-4 font-medium">Stock Total</th>
                <th className="px-6 py-4 font-medium">Precio Unitario</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="animate-pulse flex flex-col items-center gap-2">
                      <div className="h-6 w-6 border-2 border-carey-red border-t-transparent rounded-full animate-spin"></div>
                      Cargando inventario...
                    </div>
                  </td>
                </tr>
              ) : productos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No hay productos registrados en este almacén.
                  </td>
                </tr>
              ) : (
                productos.map((prod) => {
                  const totalStock = prod.lots?.reduce((sum: number, lot: any) => sum + Number(lot.quantity), 0) || 0;
                  const minStock = Number(prod.minStock) || 0;
                  
                  let rowClass = "hover:bg-gray-50/50 transition-colors border-b border-gray-50";
                  let badge = null;

                  if (minStock > 0) {
                    if (totalStock < minStock) {
                      rowClass = "bg-red-200 hover:bg-red-300 transition-colors border-b border-red-300";
                    } else if (totalStock === minStock) {
                      rowClass = "bg-yellow-200 hover:bg-yellow-300 transition-colors border-b border-yellow-300";
                    }
                  }

                  return (
                  <tr key={prod.id} className={rowClass}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{prod.description}</div>
                      {prod.sku && <div className="text-[12px] text-gray-500 font-mono mt-0.5">{prod.sku}</div>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="bg-white/60 border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
                        {prod.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium">{prod.unit}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{totalStock} {prod.unit}</span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium mt-0.5">Min: {minStock} {prod.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">S/ {Number(prod.unitPrice).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        prod.status === "ACTIVO" 
                          ? "text-green-600 bg-green-50 border border-green-100" 
                          : "text-red-600 bg-red-50 border border-red-100"
                      }`}>
                        {prod.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setProductToView(prod)}
                          className="p-1.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-all" 
                          title="Ver Detalles"
                        >
                          <Eye size={16} />
                        </button>
                        {prod.status === "ACTIVO" ? (
                          <>
                            <button 
                              onClick={() => openEditModal(prod)}
                              className="p-1.5 border border-[#e0e7ff] rounded-lg text-[#3b82f6] hover:bg-blue-50 transition-all" 
                              title="Editar"
                            >
                              <Pencil size={16} />
                            </button>
                            <button 
                              onClick={() => setProductToDelete(prod)}
                              className="p-1.5 border border-[#fee2e2] rounded-lg text-[#ef4444] hover:bg-red-50 transition-all" 
                              title="Eliminar"
                            >
                              <Trash size={16} />
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => handleReactivateProduct(prod.id)}
                            className="p-1.5 border border-[#dcfce7] rounded-lg text-[#16a34a] hover:bg-green-50 transition-all" 
                            title="Reactivar"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE NUEVO PRODUCTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">Registrar Nuevo Producto</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-white hover:bg-gray-100 p-2 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Producto *</label>
                <input 
                  required
                  type="text" 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-carey-red focus:border-transparent transition-all"
                  placeholder="Ej: Salchicha Huachana"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-carey-red focus:border-transparent transition-all"
                    placeholder="Ej: Embutidos"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario (S/)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-carey-red focus:border-transparent transition-all"
                    placeholder="Ej: 15.50"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Seguridad</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({...formData, minStock: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-carey-red focus:border-transparent transition-all"
                    placeholder="Ej: 10"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[15px] font-bold text-[#111827]">Gestión de Lotes</h3>
                  <button 
                    type="button"
                    onClick={() => {
                      if (currentLot.lotCode && currentLot.quantity) {
                        setLots([...lots, currentLot]);
                        setCurrentLot({ lotCode: "", expirationDate: "", quantity: "" });
                      }
                    }}
                    className="p-1 border border-gray-200 rounded-lg text-[#111827] hover:bg-gray-50 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Número de Lote</label>
                    <input 
                      type="text" 
                      value={currentLot.lotCode}
                      onChange={(e) => setCurrentLot({...currentLot, lotCode: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#111827] focus:border-[#111827] transition-all"
                      placeholder="Ej: L2026-001"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Fecha Vencimiento</label>
                    <input 
                      type="date" 
                      value={currentLot.expirationDate}
                      onChange={(e) => setCurrentLot({...currentLot, expirationDate: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#111827] focus:border-[#111827] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Cantidad</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={currentLot.quantity}
                      onChange={(e) => setCurrentLot({...currentLot, quantity: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-[#111827] focus:border-[#111827] transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className={`border border-gray-100 rounded-xl p-4 text-center text-sm ${lots.length === 0 ? 'bg-gray-50 text-gray-400' : 'bg-white'}`}>
                  {lots.length === 0 ? (
                    "Sin lotes agregados. Agrega al menos un lote para el producto."
                  ) : (
                    <div className="space-y-2 text-left">
                      {lots.map((lot, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                          <div className="flex gap-4">
                            <span className="font-medium text-[#111827]">{lot.lotCode}</span>
                            <span className="text-gray-500">{lot.expirationDate ? new Date(lot.expirationDate).toLocaleDateString() : 'Sin fecha'}</span>
                            <span className="text-gray-500 font-medium">{lot.quantity} KG</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setLots(lots.filter((_, i) => i !== index))}
                            className="text-red-400 hover:text-carey-red transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 mt-2 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 text-white bg-carey-red hover:bg-red-800 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    "Guardar Producto"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA (OJO) */}
      {productToView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">Detalles del Producto</h2>
              <button onClick={() => setProductToView(null)} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors">
                <Trash2 size={20} className="hidden" /> {/* Para mantener el espacio */}
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div><span className="block text-xs text-gray-500 font-semibold mb-1">SKU</span><span className="text-gray-800 font-bold font-mono text-[13px]">{productToView.sku}</span></div>
                <div><span className="block text-xs text-gray-500 font-semibold mb-1">Descripción</span><span className="text-gray-800 font-medium">{productToView.description}</span></div>
                <div><span className="block text-xs text-gray-500 font-semibold mb-1">Categoría</span><span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium border border-gray-200">{productToView.category}</span></div>
                <div><span className="block text-xs text-gray-500 font-semibold mb-1">Precio Unitario</span><span className="text-gray-800">S/ {Number(productToView.unitPrice).toFixed(2)}</span></div>
                <div><span className="block text-xs text-gray-500 font-semibold mb-1">Stock Seguridad</span><span className="text-gray-800 font-medium">{productToView.minStock || 0} {productToView.unit}</span></div>
                <div>
                  <span className="block text-xs text-gray-500 font-semibold mb-1">Estado</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                    productToView.status === "ACTIVO"
                      ? "text-green-600 bg-green-50 border border-green-100"
                      : "text-red-600 bg-red-50 border border-red-100"
                  }`}>
                    {productToView.status}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-[15px] font-bold text-[#111827] mb-3">Lotes Asociados</h3>
                {productToView.lots && productToView.lots.length > 0 ? (
                  <div className="overflow-x-auto border border-gray-100 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Lote</th>
                          <th className="px-4 py-3 font-medium">Fecha Ingreso</th>
                          <th className="px-4 py-3 font-medium">Vencimiento</th>
                          <th className="px-4 py-3 font-medium text-right">Stock Act.</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {productToView.lots.map((lot: any) => (
                          <tr key={lot.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-medium text-gray-800">{lot.lotCode}</td>
                            <td className="px-4 py-3 text-gray-600">{new Date(lot.entryDate).toLocaleDateString()}</td>
                            <td className="px-4 py-3 text-gray-600">{lot.expirationDate ? new Date(lot.expirationDate).toLocaleDateString() : 'N/A'}</td>
                            <td className="px-4 py-3 font-bold text-right text-gray-800">{lot.quantity} KG</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-100 text-gray-500 text-sm">
                    Este producto no tiene lotes registrados.
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button onClick={() => setProductToView(null)} className="px-6 py-2 bg-[#111827] text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN (LÁPIZ) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-800">Editar Producto</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 p-2 rounded-full transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleUpdateProduct} className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">SKU</label>
                  <input 
                    type="text" 
                    value={productToEdit.sku}
                    disabled
                    className="w-full border border-gray-200 bg-gray-50 rounded-lg px-4 py-2 text-gray-500 font-mono text-[13px] font-bold cursor-not-allowed"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Descripción del Producto *</label>
                  <input 
                    required
                    type="text" 
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría *</label>
                  <input 
                    required
                    type="text" 
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent transition-all"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Precio (S/) *</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0"
                    value={editFormData.unitPrice}
                    onChange={(e) => setEditFormData({...editFormData, unitPrice: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent transition-all"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Seguro</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    min="0"
                    value={editFormData.minStock}
                    onChange={(e) => setEditFormData({...editFormData, minStock: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#111827] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[15px] font-bold text-[#111827]">Gestión de Lotes</h3>
                  <button 
                    type="button"
                    onClick={() => {
                      if (editCurrentLot.lotCode && editCurrentLot.quantity) {
                        setEditLots([...editLots, editCurrentLot]);
                        setEditCurrentLot({ lotCode: "", expirationDate: "", quantity: "" });
                      }
                    }}
                    className="p-1 border border-gray-200 rounded-lg text-[#111827] hover:bg-gray-50 transition-colors"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="col-span-3">
                    <p className="text-xs text-blue-700 font-medium mb-2 flex items-center gap-1">
                      <Plus size={14}/> Puedes añadir Lotes Nuevos aquí:
                    </p>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Lote</label>
                    <input 
                      type="text" 
                      value={editCurrentLot.lotCode}
                      onChange={(e) => setEditCurrentLot({...editCurrentLot, lotCode: e.target.value})}
                      className="w-full border border-blue-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Nuevo Lote"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Vence</label>
                    <input 
                      type="date" 
                      value={editCurrentLot.expirationDate}
                      onChange={(e) => setEditCurrentLot({...editCurrentLot, expirationDate: e.target.value})}
                      className="w-full border border-blue-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">Cant.</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      value={editCurrentLot.quantity}
                      onChange={(e) => setEditCurrentLot({...editCurrentLot, quantity: e.target.value})}
                      className="w-full border border-blue-200 rounded-lg px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2 mt-2">
                  {editLots.map((lot, index) => (
                    <div key={index} className="grid grid-cols-3 gap-3 items-center bg-gray-50 p-2 rounded-lg border border-gray-200">
                      <div>
                         <label className="block text-[10px] text-gray-400">Lote</label>
                         <input 
                          type="text" 
                          value={lot.lotCode} 
                          onChange={(e) => {
                            const newLots = [...editLots];
                            newLots[index].lotCode = e.target.value;
                            setEditLots(newLots);
                          }}
                          className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-900" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400">Vence</label>
                         <input 
                          type="date" 
                          value={lot.expirationDate ? new Date(lot.expirationDate).toISOString().split('T')[0] : ''} 
                          onChange={(e) => {
                            const newLots = [...editLots];
                            newLots[index].expirationDate = e.target.value;
                            setEditLots(newLots);
                          }}
                          className="w-full bg-white border border-gray-200 rounded px-2 py-1 text-xs text-gray-900" 
                        />
                      </div>
                      <div className="relative">
                         <label className="block text-[10px] text-gray-400">Cantidad (Bloqueada)</label>
                         <input 
                          type="number" 
                          value={lot.quantity} 
                          disabled
                          className="w-full bg-gray-100 border border-gray-200 rounded px-2 py-1 text-xs text-gray-500 cursor-not-allowed font-medium" 
                        />
                        {!lot.id && (
                          <button 
                            type="button"
                            onClick={() => setEditLots(editLots.filter((_, i) => i !== index))}
                            className="absolute -right-2 top-4 text-red-400 hover:text-red-600 p-1 bg-white rounded-full shadow-sm"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" disabled={isUpdating} className="flex-1 px-4 py-2 text-white bg-[#111827] hover:bg-gray-800 rounded-lg font-medium transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                  {isUpdating ? "Actualizando..." : "Actualizar Producto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE ELIMINAR */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="p-6">
              <div className="mx-auto w-14 h-14 bg-red-50 border border-red-100 text-red-500 rounded-full flex items-center justify-center mb-5">
                <Trash2 size={28} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">¿Eliminar Producto?</h2>
              <p className="text-gray-500 text-sm">
                Estás a punto de eliminar <strong>{productToDelete.description}</strong>. Esta acción lo ocultará del inventario activo.
              </p>
            </div>
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-center">
              <button 
                onClick={() => setProductToDelete(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Eliminando...
                  </>
                ) : (
                  "Sí, Eliminar"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
