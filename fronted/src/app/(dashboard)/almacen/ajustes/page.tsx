"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, AlertCircle, ChevronLeft, ChevronRight, Camera, Image as ImageIcon, Download, X } from "lucide-react";
import Cookies from "js-cookie";
import imageCompression from 'browser-image-compression';
import { showSuccessToast, showErrorToast } from "@/components/Toast";

export default function AjustesPage() {
  const [ajustes, setAjustes] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const motivos = [
    "Conteo Físico",
    "Merma",
    "Regularización",
    "Devolución Interna",
    "Corrección Administrativa"
  ];

  const [formData, setFormData] = useState({
    productId: "",
    lotId: "",
    typeDirection: "SALIDA",
    quantity: 1,
    reason: motivos[0],
    reference: ""
  });

  useEffect(() => {
    fetchAjustes();
    fetchProductos();
  }, []);

  const fetchAjustes = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/ajustes");
      if (res.ok) {
        const data = await res.json();
        setAjustes(data);
      }
    } catch (error) {
      console.error("Error fetching ajustes", error);
    }
  };

  const fetchProductos = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/products");
      if (res.ok) {
        const data = await res.json();
        setProductos(data);
      }
    } catch (error) {
      console.error("Error fetching productos", error);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const options = {
        maxSizeMB: 0.2, // ~200kb
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      };
      try {
        const compressedFile = await imageCompression(file, options);
        setImageFile(compressedFile);
      } catch (error) {
        console.error("Error comprimiendo imagen", error);
        showErrorToast("No se pudo procesar la imagen");
      }
    }
  };

  const handleCreateAjuste = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const currentUserName = Cookies.get("user_name") || "Usuario Desconocido";
      
      const formPayload = new FormData();
      formPayload.append("productId", formData.productId);
      formPayload.append("lotId", formData.lotId);
      formPayload.append("typeDirection", formData.typeDirection);
      formPayload.append("quantity", formData.quantity.toString());
      formPayload.append("reason", formData.reason);
      formPayload.append("reference", formData.reference);
      formPayload.append("createdBy", currentUserName);
      
      if (imageFile) {
        formPayload.append("image", imageFile);
      }
      
      const res = await fetch("http://localhost:4000/api/ajustes", {
        method: "POST",
        body: formPayload
      });

      if (res.ok) {
        showSuccessToast("Ajuste registrado correctamente");
        setIsModalOpen(false);
        setFormData({
          productId: "",
          lotId: "",
          typeDirection: "SALIDA",
          quantity: 1,
          reason: motivos[0],
          reference: ""
        });
        setImageFile(null);
        fetchAjustes();
      } else {
        const data = await res.json();
        showErrorToast(data.error || "Error al registrar el ajuste");
      }
    } catch (error) {
      showErrorToast("Error de red al registrar el ajuste");
    } finally {
      setLoading(false);
    }
  };

  const filteredAjustes = ajustes.filter(a => {
    const matchesSearch = a.product?.description.toLowerCase().includes(search.toLowerCase()) ||
                          a.reason.toLowerCase().includes(search.toLowerCase()) ||
                          (a.reference && a.reference.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === "TODOS" || a.typeDirection === typeFilter;

    let matchesDate = true;
    if (startDate || endDate) {
      const aDate = new Date(a.date);
      aDate.setHours(0, 0, 0, 0);

      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0, 0, 0, 0);
        if (aDate < sDate) matchesDate = false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(0, 0, 0, 0);
        if (aDate > eDate) matchesDate = false;
      }
    }
    return matchesSearch && matchesType && matchesDate;
  });

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, startDate, endDate]);

  const totalPages = Math.ceil(filteredAjustes.length / ITEMS_PER_PAGE);
  const paginatedAjustes = filteredAjustes.slice(
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

  const selectedProduct = productos.find(p => p.id === formData.productId);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Ajustes de Inventario</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-carey-red hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" /> Nuevo Ajuste
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 bg-gray-50/50 items-center justify-between">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por producto, motivo o referencia..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-carey-red focus:border-transparent transition-all text-gray-900"
            />
          </div>
          <div className="flex flex-wrap gap-3 items-center">
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
            <div className="relative w-32">
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-carey-red text-gray-700 bg-white text-sm"
              >
                <option value="TODOS">Todos</option>
                <option value="INGRESO">Entrada</option>
                <option value="SALIDA">Salida</option>
              </select>
            </div>
            {(search || startDate || endDate || typeFilter !== "TODOS") && (
              <button
                onClick={() => {
                  setSearch('');
                  setStartDate('');
                  setEndDate('');
                  setTypeFilter('TODOS');
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-[#3b4b6b] font-bold text-[10px] uppercase bg-gray-50 border-b-2 border-gray-100">
              <tr>
                <th className="px-6 py-4">N° Ajuste</th>
                <th className="px-6 py-4">Fecha y Hora</th>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Lote</th>
                <th className="px-6 py-4 text-center">Variación</th>
                <th className="px-6 py-4">Motivo</th>
                <th className="px-6 py-4">Referencia</th>
                <th className="px-6 py-4">Responsable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedAjustes.map((ajuste) => (
                <tr key={ajuste.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-800 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">{ajuste.adjustmentNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-900 font-medium">
                      {new Date(ajuste.date).toLocaleDateString('es-PE')}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {new Date(ajuste.date).toLocaleTimeString('es-PE')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-gray-900">{ajuste.product?.description}</div>
                    <div className="text-xs text-gray-500">{ajuste.product?.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {ajuste.lot?.lotCode || 'S/L'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold px-2.5 py-1 rounded-md text-xs ${ajuste.typeDirection === 'INGRESO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {ajuste.typeDirection === 'INGRESO' ? '+' : '-'}{ajuste.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">
                    {ajuste.reason}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-xs">
                    <div className="flex items-center gap-2">
                      {ajuste.reference || '—'}
                      {ajuste.referenceImage && (
                        <button 
                          onClick={() => setPreviewImage(ajuste.referenceImage)}
                          className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded-md transition-colors"
                          title="Ver foto adjunta"
                        >
                          <ImageIcon size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {ajuste.createdBy}
                    </span>
                  </td>
                </tr>
              ))}
              {paginatedAjustes.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <AlertCircle className="w-10 h-10 text-gray-300 mb-3" />
                      <p className="text-sm font-medium">No se encontraron ajustes de inventario</p>
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
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredAjustes.length)}
              </span>{' '}
              de <span className="font-medium">{filteredAjustes.length}</span> ajustes
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
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-bold text-[#1F2937] flex items-center">
                <Edit2 size={20} className="mr-2 text-carey-red" />
                Registrar Nuevo Ajuste
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateAjuste} className="p-6 overflow-y-auto space-y-5">
              
              {/* Producto */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Producto *</label>
                <select 
                  required
                  value={formData.productId}
                  onChange={(e) => setFormData({...formData, productId: e.target.value, lotId: ""})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-carey-red focus:border-transparent text-gray-900"
                >
                  <option value="">Seleccione un producto</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.description}</option>
                  ))}
                </select>
              </div>

              {/* Lote */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Lote *</label>
                <select 
                  required
                  value={formData.lotId}
                  onChange={(e) => setFormData({...formData, lotId: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-carey-red focus:border-transparent disabled:bg-gray-100 text-gray-900"
                  disabled={!formData.productId || selectedProduct?.lots?.length === 0}
                >
                  <option value="">Seleccione un lote</option>
                  {selectedProduct?.lots?.map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.lotCode} (Stock actual: {l.quantity})
                    </option>
                  ))}
                </select>
                {selectedProduct && selectedProduct.lots?.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">Este producto no tiene lotes activos disponibles.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Tipo de Ajuste */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Tipo de Ajuste *</label>
                  <select 
                    required
                    value={formData.typeDirection}
                    onChange={(e) => setFormData({...formData, typeDirection: e.target.value as "SALIDA" | "INGRESO"})}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900"
                  >
                    <option value="SALIDA">SALIDA (-)</option>
                    <option value="INGRESO">INGRESO (+)</option>
                  </select>
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Cantidad *</label>
                  <input 
                    type="number" 
                    required
                    min="0.01"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseFloat(e.target.value)})}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-carey-red text-gray-900"
                  />
                </div>
              </div>

              {/* Motivo */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Motivo *</label>
                <select 
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-carey-red text-gray-900"
                >
                  {motivos.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Referencia y Foto */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Ref. Escrita</label>
                  <input 
                    type="text" 
                    value={formData.reference}
                    onChange={(e) => setFormData({...formData, reference: e.target.value})}
                    placeholder="Ej: Informe N° 005..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-carey-red text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Foto / Sustento</label>
                  <label className="flex items-center justify-center w-full h-[42px] px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                      <span className="flex items-center space-x-2">
                          <Camera className="w-5 h-5 text-gray-400" />
                          <span className="font-medium text-gray-600 text-sm">
                              {imageFile ? "1 foto lista" : "Tomar foto"}
                          </span>
                      </span>
                      <input type="file" accept="image/*" capture="environment" name="file_upload" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading || !formData.productId || !formData.lotId}
                  className="px-6 py-2 bg-carey-red hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50 text-sm"
                >
                  {loading ? 'Procesando...' : 'Confirmar Ajuste'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
      {/* Modal de Previsualización de Imagen */}
      {previewImage && (
        <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => setPreviewImage(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            
            {/* Header del Modal */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/80">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <ImageIcon size={18} className="text-carey-red" />
                Documento Adjunto
              </h3>
              <div className="flex items-center gap-2">
                <a 
                  href={`http://localhost:4000/uploads/ajustes/${previewImage}`}
                  download={previewImage?.includes('.') ? previewImage : `${previewImage}.jpg`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
                  title="Descargar imagen"
                >
                  <Download size={16} /> Descargar
                </a>
                <button 
                  onClick={() => setPreviewImage(null)} 
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Contenido de la Imagen */}
            <div className="p-4 overflow-auto flex items-center justify-center bg-gray-100/50">
              <img 
                src={`http://localhost:4000/uploads/ajustes/${previewImage}`} 
                alt="Sustento de Ajuste" 
                className="max-w-full max-h-[75vh] object-contain rounded border border-gray-200 shadow-sm"
              />
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
