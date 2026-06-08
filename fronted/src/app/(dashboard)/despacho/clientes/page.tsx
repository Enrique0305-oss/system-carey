"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, X, ChevronDown, AlertTriangle, Check } from "lucide-react";
import toast from "react-hot-toast";

export default function ClientesPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<any>(null);

  const initialForm = {
    razonSocial: "",
    ruc: "",
    direccion: "",
    estado: "ACTIVO",
    telefono: "",
    email: ""
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
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/clients");
      const data = await res.json();
      setClients(data);
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
        ? `http://localhost:4000/api/clients/${editingId}`
        : "http://localhost:4000/api/clients";
      
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
        fetchClients();
        showSuccessToast(editingId ? "Cliente actualizado correctamente" : "Cliente creado correctamente");
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || "Error al procesar la solicitud");
      }
    } catch (err) {
      console.error("Error saving client:", err);
      toast.error("Ocurrió un error inesperado");
    }
  };

  const handleEdit = (client: any) => {
    setFormData({
      razonSocial: client.razonSocial || "",
      ruc: client.ruc || "",
      direccion: client.direccion || "",
      estado: client.estado || "ACTIVO",
      telefono: client.telefono || "",
      email: client.email || ""
    });
    setEditingId(client.id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (client: any) => {
    setClientToDelete(client);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    try {
      const res = await fetch(`http://localhost:4000/api/clients/${clientToDelete.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "INACTIVO" }) // Soft delete
      });
      if (res.ok) {
        fetchClients();
        setClientToDelete(null);
        showSuccessToast("Cliente desactivado correctamente");
      } else {
        toast.error("Error al desactivar el cliente");
      }
    } catch (err) {
      console.error("Error deleting client:", err);
      toast.error("Ocurrió un error inesperado");
    }
  };

  const openNewModal = () => {
    setFormData(initialForm);
    setEditingId(null);
    setIsModalOpen(true);
  };

  const filteredClients = clients.filter(p => {
    const matchesSearch = p.razonSocial.toLowerCase().includes(search.toLowerCase()) || (p.ruc && p.ruc.includes(search));
    const matchesStatus = statusFilter === "Todos los estados" || 
                          (statusFilter === "Activo" && p.estado === "ACTIVO") || 
                          (statusFilter === "Inactivo" && p.estado === "INACTIVO");
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Gestión de Clientes</h1>
        <button 
          onClick={openNewModal}
          className="bg-carey-red hover:bg-red-800 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-md shadow-red-200"
        >
          <Plus size={18} className="mr-2" /> Nuevo Cliente
        </button>
      </div>

      <div className="bg-white p-4 rounded-t-xl border border-gray-200 border-b-0 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por Razón Social o RUC o DNI..." 
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
              <th className="px-6 py-4">CLIENTE</th>
              <th className="px-6 py-4">RUC / DNI</th>
              <th className="px-6 py-4">DIRECCIÓN</th>
              <th className="px-6 py-4">CONTACTO</th>
              <th className="px-6 py-4">ESTADO</th>
              <th className="px-6 py-4 text-center">ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Cargando clientes...</td></tr>
            ) : filteredClients.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">No se encontraron clientes</td></tr>
            ) : (
              filteredClients.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-bold text-gray-800">{p.razonSocial}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{p.ruc || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-[200px] truncate">{p.direccion || '—'}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="text-gray-700">{p.telefono || '—'}</div>
                    <div className="text-blue-600 text-xs">{p.email || ''}</div>
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
                      {p.estado === 'ACTIVO' && (
                        <button 
                          onClick={() => handleDeleteClick(p)}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          title="Desactivar"
                        >
                          <Trash2 size={16}/>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de Nuevo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <h2 className="text-2xl font-bold text-[#1F2937]">
                {editingId ? "Editar Cliente" : "Nuevo Cliente"}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="clientForm" onSubmit={handleCreate} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social / Nombres Completos *</label>
                    <input type="text" required value={formData.razonSocial} onChange={e => setFormData({...formData, razonSocial: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUC / DNI</label>
                    <input type="text" value={formData.ruc} onChange={e => setFormData({...formData, ruc: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" />
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] focus:border-transparent outline-none" />
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 sticky bottom-0 z-10">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors">
                Cancelar
              </button>
              <button type="submit" form="clientForm" className="px-6 py-2.5 bg-carey-red text-white rounded-lg hover:bg-red-800 font-medium transition-colors shadow-sm">
                {editingId ? "Guardar Cambios" : "Crear Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {clientToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col transform transition-all">
            <div className="p-6 pb-0 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">¿Desactivar Cliente?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Estás a punto de desactivar a <strong>{clientToDelete.razonSocial}</strong>. 
                El cliente no será eliminado del historial de despachos, pero pasará a estado Inactivo. ¿Deseas continuar?
              </p>
            </div>
            <div className="p-4 bg-gray-50 flex gap-3 justify-center">
              <button 
                onClick={() => setClientToDelete(null)} 
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
