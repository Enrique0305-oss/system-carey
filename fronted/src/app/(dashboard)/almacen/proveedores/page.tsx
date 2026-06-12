"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, ChevronDown, AlertTriangle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function ProveedoresPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<any>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const initialForm = {
    razonSocial: "",
    ruc: "",
    nombreComercial: "",
    direccion: "",
    estado: "ACTIVO",
    contactoNombre: "",
    telefono: "",
    email: "",
    banco: "",
    cuenta: "",
    cci: "",
    observaciones: ""
  };

  const [formData, setFormData] = useState(initialForm);

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

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/providers");
      const data = await res.json();
      setProviders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `http://localhost:4000/api/providers/${editingId}`
        : "http://localhost:4000/api/providers";
      
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData(initialForm);
        setEditingId(null);
        fetchProviders();
        showSuccessToast(editingId ? "Proveedor actualizado correctamente" : "Proveedor creado correctamente");
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Error al procesar la solicitud");
      }
    } catch (err) {
      console.error("Error saving provider:", err);
      toast.error("Ocurrió un error inesperado");
    }
  };

  const handleEdit = (provider: any) => {
    setFormData({
      razonSocial: provider.razonSocial || "",
      ruc: provider.ruc || "",
      nombreComercial: provider.nombreComercial || "",
      direccion: provider.direccion || "",
      estado: provider.estado || "ACTIVO",
      contactoNombre: provider.contactoNombre || "",
      telefono: provider.telefono || "",
      email: provider.email || "",
      banco: provider.banco || "",
      cuenta: provider.cuenta || "",
      cci: provider.cci || "",
      observaciones: provider.observaciones || ""
    });
    setEditingId(provider.id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (provider: any) => {
    setProviderToDelete(provider);
  };

  const confirmDelete = async () => {
    if (!providerToDelete) return;
    try {
      const res = await fetch(`http://localhost:4000/api/providers/${providerToDelete.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchProviders();
        setProviderToDelete(null);
        showSuccessToast("Proveedor desactivado correctamente");
      } else {
        toast.error("Error al desactivar el proveedor");
      }
    } catch (err) {
      console.error("Error deleting provider:", err);
      toast.error("Ocurrió un error inesperado");
    }
  };

  const openNewModal = () => {
    setFormData(initialForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.razonSocial.toLowerCase().includes(search.toLowerCase()) || (p.ruc && p.ruc.includes(search));
    const matchesStatus = statusFilter === "Todos los estados" || 
                          (statusFilter === "Activo" && p.estado === "ACTIVO") || 
                          (statusFilter === "Inactivo" && p.estado === "INACTIVO");
    return matchesSearch && matchesStatus;
  });

  // Resetear página a 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // Lógica de Paginación
  const totalPages = Math.ceil(filteredProviders.length / ITEMS_PER_PAGE);
  const paginatedProviders = filteredProviders.slice(
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Gestión de Proveedores</h1>
        <button 
          onClick={openNewModal}
          className="bg-[#1F2937] hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
        >
          <Plus size={18} className="mr-2" /> Nuevo Proveedor
        </button>
      </div>

      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por razón social o RUC..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative w-48">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none pl-4 pr-10 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 bg-white"
          >
            <option>Todos los estados</option>
            <option>Activo</option>
            <option>Inactivo</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-b-xl overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-[#1F2937] text-white text-xs uppercase font-semibold">
              <th className="px-6 py-4">PROVEEDOR</th>
              <th className="px-6 py-4">RUC</th>
              <th className="px-6 py-4">CONTACTO</th>
              <th className="px-6 py-4">TELÉFONO / EMAIL</th>
              <th className="px-6 py-4">BANCO / CUENTA</th>
              <th className="px-6 py-4">ESTADO</th>
              <th className="px-6 py-4 text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">Cargando proveedores...</td></tr>
            ) : paginatedProviders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-500">No se encontraron proveedores</td></tr>
            ) : (
              paginatedProviders.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-800">{p.razonSocial}</div>
                    <div className="text-xs text-gray-500">{p.nombreComercial || '-'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.ruc || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.contactoNombre || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="text-gray-700">{p.telefono || '—'}</div>
                    <div className="text-blue-600 text-xs">{p.email || ''}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-700">{p.banco || '—'}</div>
                    <div className="text-gray-500 text-xs">{p.cuenta || ''}</div>
                    {p.cci && <div className="text-gray-400 text-[10px]">CCI: {p.cci}</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${p.estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => handleEdit(p)}
                        className="p-1.5 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                        title="Editar"
                      >
                        <Edit size={16}/>
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(p)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                        title="Desactivar"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Controles de Paginación */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">
            Mostrando <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>-
            <span className="font-medium">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredProviders.length)}
            </span>{' '}
            de <span className="font-medium">{filteredProviders.length}</span> proveedores
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
                    ? 'bg-[#1F2937] text-white border-[#1F2937]'
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

      {/* Modal de Nuevo Proveedor */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-[#1F2937]">
                {editingId ? "Editar Proveedor" : "Nuevo Proveedor"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="providerForm" onSubmit={handleCreate} className="space-y-8">
                
                {/* DATOS DE LA EMPRESA */}
                <section>
                  <h3 className="text-sm font-bold text-gray-500 mb-4 tracking-wider uppercase">Datos de la Empresa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
                      <input type="text" required value={formData.razonSocial} onChange={e => setFormData({...formData, razonSocial: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
                      <input type="text" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" placeholder="20XXXXXXXXX" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
                      <input type="text" value={formData.nombreComercial} onChange={e => setFormData({...formData, nombreComercial: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                      <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none bg-white">
                        <option value="ACTIVO">Activo</option>
                        <option value="INACTIVO">Inactivo</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                      <input type="text" value={formData.direccion} onChange={e => setFormData({...formData, direccion: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" />
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* CONTACTO */}
                <section>
                  <h3 className="text-sm font-bold text-gray-500 mb-4 tracking-wider uppercase">Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Contacto</label>
                      <input type="text" value={formData.contactoNombre} onChange={e => setFormData({...formData, contactoNombre: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" />
                    </div>
                  </div>
                </section>

                <hr className="border-gray-100" />

                {/* DATOS BANCARIOS */}
                <section>
                  <h3 className="text-sm font-bold text-gray-500 mb-4 tracking-wider uppercase">Datos Bancarios</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                      <input type="text" value={formData.banco} onChange={e => setFormData({...formData, banco: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" placeholder="BCP, Interbank..." />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Número de Cuenta</label>
                      <input type="text" value={formData.cuenta} onChange={e => setFormData({...formData, cuenta: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CCI</label>
                      <input type="text" value={formData.cci} onChange={e => setFormData({...formData, cci: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" />
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                      <textarea rows={3} value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none resize-none"></textarea>
                    </div>
                  </div>
                </section>

              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0 z-10">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors">
                Cancelar
              </button>
              <button type="submit" form="providerForm" className="px-6 py-2.5 bg-[#1F2937] text-white rounded-lg hover:bg-gray-800 font-medium transition-colors shadow-sm">
                {editingId ? "Guardar Cambios" : "Crear Proveedor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {providerToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all">
            <div className="p-6 pb-0 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Desactivar Proveedor?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Estás a punto de desactivar a <strong>{providerToDelete.razonSocial}</strong>. 
                El proveedor no será eliminado del historial, pero pasará a estado Inactivo. ¿Deseas continuar?
              </p>
            </div>
            <div className="p-4 bg-gray-50 flex gap-3 justify-center">
              <button 
                onClick={() => setProviderToDelete(null)} 
                className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-sm"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
