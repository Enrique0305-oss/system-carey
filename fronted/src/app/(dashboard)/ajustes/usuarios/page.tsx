"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Search, Edit, Trash2, Key, Shield, UserX, UserCheck, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

export default function GestionUsuariosPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVO");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, type: 'ACTIVATE' | 'DEACTIVATE' | null, user: any | null }>({ isOpen: false, type: null, user: null });
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [areaId, setAreaId] = useState("");
  const [status, setStatus] = useState("ACTIVO");

  useEffect(() => {
    // Protección de Ruta
    const userArea = Cookies.get('user_area');
    if (userArea !== 'Gerencia' && userArea !== 'Administrador') {
      toast.error("Acceso denegado. Solo Gerencia puede ver esta sección.");
      router.push("/");
      return;
    }

    fetchUsers();
    fetchAreas();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const fetchAreas = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/users/areas");
      const data = await res.json();
      setAreas(data);
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (user?: any) => {
    if (user) {
      setEditingUser(user);
      setName(user.name);
      setEmail(user.email);
      setAreaId(user.areaId);
      setStatus(user.status);
      setPassword(""); // Blank for editing unless changing
    } else {
      setEditingUser(null);
      setName("");
      setEmail("");
      setAreaId("");
      setStatus("ACTIVO");
      setPassword("");
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !areaId) {
      toast.error("Nombre, correo y área son obligatorios");
      return;
    }

    const payload: any = { name, email, areaId, status };
    if (password) payload.password = password;
    if (editingUser && password) payload.newPassword = password;

    try {
      const url = editingUser 
        ? `http://localhost:4000/api/users/${editingUser.id}` 
        : `http://localhost:4000/api/users`;
      
      const method = editingUser ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al guardar");
      }

      toast.success(editingUser ? "Usuario actualizado" : "Usuario creado");
      closeModal();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:4000/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al desactivar");
      toast.success("Usuario desactivado");
      fetchUsers();
    } catch (error) {
      toast.error("Error al desactivar");
    } finally {
      setConfirmModal({ isOpen: false, type: null, user: null });
    }
  };

  const handleActivate = async (user: any) => {
    try {
      const payload = {
        name: user.name,
        email: user.email,
        areaId: user.areaId,
        status: 'ACTIVO'
      };
      const res = await fetch(`http://localhost:4000/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Error al reactivar");
      toast.success("Usuario reactivado con éxito");
      fetchUsers();
    } catch (error) {
      toast.error("Error al reactivar");
    } finally {
      setConfirmModal({ isOpen: false, type: null, user: null });
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.email.toLowerCase().includes(search.toLowerCase()) ||
                          u.area.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "TODOS" || u.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
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

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando usuarios...</div>;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
            <Users className="text-carey-red" size={24} /> Gestión de Usuarios
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Administra los accesos al sistema y asigna roles por área.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto items-center">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, email o área..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-carey-red focus:outline-none text-sm text-gray-900 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative w-36">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-carey-red text-gray-700 bg-white text-sm"
            >
              <option value="TODOS">Todos</option>
              <option value="ACTIVO">Activos</option>
              <option value="INACTIVO">Inactivos</option>
            </select>
          </div>
          {(search || statusFilter !== "ACTIVO") && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('ACTIVO');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline hidden sm:block"
            >
              Limpiar
            </button>
          )}
          <button 
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-carey-red hover:bg-red-800 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap shadow-sm shadow-red-200"
          >
            <Plus size={18} /> Nuevo Usuario
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium">Nombre / Email</th>
              <th className="px-6 py-4 font-medium">Área</th>
              <th className="px-6 py-4 font-medium">Estado</th>
              <th className="px-6 py-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-800 flex items-center gap-2">
                    {user.name}
                    {user.area.name.includes("Gerencia") && <Shield size={14} className="text-blue-500" />}
                  </div>
                  <div className="text-gray-500 text-xs">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium border border-gray-200">
                    {user.area.name}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {user.status === 'ACTIVO' ? (
                    <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2.5 py-1 rounded-md w-fit text-xs font-bold">
                      <UserCheck size={14} /> Activo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600 bg-red-50 px-2.5 py-1 rounded-md w-fit text-xs font-bold">
                      <UserX size={14} /> Inactivo
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => openModal(user)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar o cambiar contraseña"
                    >
                      <Edit size={16} />
                    </button>
                    {user.status === 'ACTIVO' && (
                      <button 
                        onClick={() => setConfirmModal({ isOpen: true, type: 'DEACTIVATE', user })}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Desactivar"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    {user.status === 'INACTIVO' && (
                      <button 
                        onClick={() => setConfirmModal({ isOpen: true, type: 'ACTIVATE', user })}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Reactivar"
                      >
                        <UserCheck size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No se encontraron usuarios</td>
              </tr>
            )}
          </tbody>
        </table>
        
        {/* Controles de Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white px-6 py-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Mostrando <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>-
              <span className="font-medium">
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}
              </span>{' '}
              de <span className="font-medium">{filteredUsers.length}</span> usuarios
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {editingUser ? <Edit size={20} className="text-carey-red" /> : <Plus size={20} className="text-carey-red" />}
                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input 
                  type="text" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-carey-red focus:outline-none text-gray-900"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico (Usuario)</label>
                <input 
                  type="email" required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-carey-red focus:outline-none text-gray-900"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                  <Key size={14} /> {editingUser ? "Nueva Contraseña (Opcional)" : "Contraseña"}
                </label>
                <input 
                  type="password"
                  placeholder={editingUser ? "Dejar en blanco para mantener la actual" : "carey123"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-carey-red focus:outline-none text-gray-900"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                {!editingUser && !password && <p className="text-[10px] text-gray-500 mt-1">Si dejas en blanco, la contraseña será 'carey123'</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Área / Rol</label>
                <select 
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-carey-red focus:outline-none text-gray-900"
                  value={areaId} onChange={(e) => setAreaId(e.target.value)}
                >
                  <option value="">-- Seleccionar Área --</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              {editingUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select 
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-carey-red focus:outline-none text-gray-900"
                    value={status} onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  type="button" onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-carey-red hover:bg-red-800 text-white rounded-lg font-medium transition-colors shadow-sm shadow-red-200"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Activar/Desactivar */}
      {confirmModal.isOpen && confirmModal.user && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className={`p-5 flex items-center gap-4 border-b ${confirmModal.type === 'ACTIVATE' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${confirmModal.type === 'ACTIVATE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                {confirmModal.type === 'ACTIVATE' ? <UserCheck size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                <h3 className="font-bold text-gray-900">
                  {confirmModal.type === 'ACTIVATE' ? 'Reactivar Usuario' : 'Desactivar Usuario'}
                </h3>
                <p className="text-sm text-gray-500">
                  {confirmModal.user.name}
                </p>
              </div>
            </div>
            
            <div className="p-5">
              <p className="text-gray-600 text-sm">
                {confirmModal.type === 'ACTIVATE' 
                  ? 'Este usuario recuperará su acceso al sistema de inmediato. ¿Deseas continuar?' 
                  : 'Este usuario perderá su acceso al sistema, pero mantendrás su historial. ¿Estás seguro?'}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button 
                onClick={() => setConfirmModal({ isOpen: false, type: null, user: null })}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={() => confirmModal.type === 'ACTIVATE' ? handleActivate(confirmModal.user) : handleDelete(confirmModal.user.id)}
                className={`px-4 py-2 text-white font-medium rounded-lg transition-colors text-sm shadow-sm ${
                  confirmModal.type === 'ACTIVATE' 
                    ? 'bg-green-600 hover:bg-green-700 shadow-green-200' 
                    : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                }`}
              >
                {confirmModal.type === 'ACTIVATE' ? 'Sí, reactivar' : 'Sí, desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
