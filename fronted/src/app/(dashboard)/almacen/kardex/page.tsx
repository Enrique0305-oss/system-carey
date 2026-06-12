"use client";

import { useState, useEffect } from "react";
import { ArrowDownLeft, ArrowUpRight, Activity, Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function KardexPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de los filtros
  const [filterType, setFilterType] = useState<string>('TODOS');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Estado de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetch("http://localhost:4000/api/kardex")
      .then(res => res.json())
      .then(data => {
        setMovements(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching kardex:", err);
        setLoading(false);
      });
  }, []);

  // Resetear página a 1 cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, startDate, endDate, searchTerm]);

  // Lógica de filtrado
  const filteredMovements = movements.filter((mov) => {
    // 1. Filtro por Tipo
    if (filterType !== 'TODOS' && mov.type !== filterType) return false;

    // 2. Filtro por Rango de Fechas
    if (startDate || endDate) {
      const movDateStr = new Date(mov.date).toISOString().split('T')[0];
      if (startDate && movDateStr < startDate) return false;
      if (endDate && movDateStr > endDate) return false;
    }

    // 3. Filtro por Término de Búsqueda (Producto, Motivo, Documento)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const productMatch = mov.product?.description?.toLowerCase().includes(term);
      const skuMatch = mov.product?.sku?.toLowerCase().includes(term);
      const reasonMatch = mov.reason?.toLowerCase().includes(term);
      const referenceMatch = mov.reference?.toLowerCase().includes(term);
      
      if (!productMatch && !skuMatch && !reasonMatch && !referenceMatch) return false;
    }

    return true;
  });

  // Lógica de paginación
  const totalPages = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE);
  const paginatedMovements = filteredMovements.slice(
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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kardex de Movimientos</h1>
          <p className="text-gray-500 mt-1">Historial de entradas, salidas y ajustes de inventario.</p>
        </div>
      </div>

      <div className="mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Buscar
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Producto, Motivo o Documento..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-carey-red focus:border-transparent outline-none text-gray-900 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Tipo
          </label>
          <select
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-carey-red focus:border-transparent outline-none bg-white text-gray-900"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="TODOS">Todos los tipos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SALIDA">Salidas</option>
            <option value="AJUSTE">Ajustes</option>
          </select>
        </div>

        <div className="w-full md:w-40">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Desde
          </label>
          <input
            type="date"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-carey-red focus:border-transparent outline-none bg-white text-gray-900"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="w-full md:w-40">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Hasta
          </label>
          <input
            type="date"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-carey-red focus:border-transparent outline-none bg-white text-gray-900"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        
        {(filterType !== 'TODOS' || startDate !== '' || endDate !== '' || searchTerm !== '') && (
          <button
            onClick={() => { setFilterType('TODOS'); setStartDate(''); setEndDate(''); setSearchTerm(''); }}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors h-[42px] shrink-0"
          >
            Limpiar Filtros
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando movimientos...</div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Activity size={48} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Sin Movimientos Registrados</h3>
            <p className="text-gray-500 mt-1">
              Aún no hay entradas de órdenes de compra ni salidas por despacho. El historial comenzará a llenarse automáticamente cuando se operen dichos módulos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-100">
                  <th className="px-6 py-4 font-medium">Fecha y Hora</th>
                  <th className="px-6 py-4 font-medium">Tipo</th>
                  <th className="px-6 py-4 font-medium">Producto</th>
                  <th className="px-6 py-4 font-medium">Lote</th>
                  <th className="px-6 py-4 font-medium text-center">Cant.</th>
                  <th className="px-6 py-4 font-medium text-center">Saldo Ant.</th>
                  <th className="px-6 py-4 font-medium text-center">Nuevo Saldo</th>
                  <th className="px-6 py-4 font-medium">Motivo / Doc.</th>
                  <th className="px-6 py-4 font-medium">Responsable</th>
                </tr>
              </thead>
              <tbody>
                {paginatedMovements.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron movimientos que coincidan con los filtros.
                    </td>
                  </tr>
                ) : (
                  paginatedMovements.map((mov) => (
                  <tr key={mov.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(mov.date).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      {mov.type === 'ENTRADA' ? (
                        <span className="inline-flex items-center text-green-700 bg-green-50 px-2 py-1 rounded-md text-xs font-bold">
                          <ArrowDownLeft size={14} className="mr-1" /> ENTRADA
                        </span>
                      ) : mov.type === 'SALIDA' ? (
                        <span className="inline-flex items-center text-red-700 bg-red-50 px-2 py-1 rounded-md text-xs font-bold">
                          <ArrowUpRight size={14} className="mr-1" /> SALIDA
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-gray-700 bg-gray-100 px-2 py-1 rounded-md text-xs font-bold">
                          <Activity size={14} className="mr-1" /> AJUSTE
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">{mov.product.description}</div>
                      {mov.product.sku && <div className="text-[12px] text-gray-500 font-mono mt-0.5">{mov.product.sku}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {mov.lot ? mov.lot.lotCode : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${mov.type === 'ENTRADA' ? 'text-green-600' : mov.type === 'SALIDA' ? 'text-red-600' : 'text-gray-700'}`}>
                        {mov.type === 'ENTRADA' ? '+' : mov.type === 'SALIDA' ? '-' : ''}{Number(mov.quantity)} {mov.product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                      {mov.previousBalance != null ? `${Number(mov.previousBalance)} ${mov.product.unit}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-[#1F2937]">
                      {mov.newBalance != null ? `${Number(mov.newBalance)} ${mov.product.unit}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="text-gray-800 font-medium">{mov.reason}</div>
                      {mov.reference && <div className="text-gray-500 text-xs mt-0.5">{mov.reference}</div>}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {mov.createdBy || 'Sistema'}
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Controles de Paginación */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500">
            Mostrando <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>-
            <span className="font-medium">
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredMovements.length)}
            </span>{' '}
            de <span className="font-medium">{filteredMovements.length}</span> resultados
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
                    ? 'bg-blue-500 text-white border-blue-500'
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
  );
}
