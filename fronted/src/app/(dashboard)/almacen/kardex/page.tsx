"use client";

import { useState, useEffect } from "react";
import { ArrowDownLeft, ArrowUpRight, Activity } from "lucide-react";

export default function KardexPage() {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kardex de Movimientos</h1>
          <p className="text-gray-500 mt-1">Historial de entradas, salidas y ajustes de inventario.</p>
        </div>
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
                {movements.map((mov) => (
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
                      {mov.createdBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
