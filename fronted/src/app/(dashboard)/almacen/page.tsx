"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, ArrowRight, Package } from "lucide-react";
import Link from "next/link";
import styles from "./almacen.module.css";

export default function AlmacenDashboard() {
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:4000/api/dashboard/almacen/alerts")
      .then(res => res.json())
      .then(data => {
        setAlerts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching alerts:", err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Almacén</h1>
        <p className="text-gray-500 mt-1">Resumen general y estado de los inventarios.</p>
      </div>
      
      {loading ? (
        <div className="animate-pulse bg-gray-200 h-24 rounded-lg w-full mb-8"></div>
      ) : alerts && alerts.lowStockCount > 0 ? (
        <div className="bg-yellow-50/80 border border-yellow-200 p-4 rounded-xl shadow-sm mb-8 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4">
          <div className="flex items-start">
            <div className="bg-yellow-500 p-2.5 rounded-full mr-4 shrink-0 shadow-sm">
              <AlertTriangle className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-yellow-800 font-bold text-lg">Alerta de Stock Bajo</h3>
              <p className="text-yellow-700 mt-1">
                Tienes <span className="font-bold text-yellow-900">{alerts.lowStockCount} productos</span> con stock por debajo del nivel de seguridad. Revisa el inventario para reabastecer a tiempo.
              </p>
            </div>
          </div>
          <Link href="/almacen/materia-prima" className="bg-yellow-600 hover:bg-yellow-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center transition-colors shadow-sm whitespace-nowrap">
            Ir a Inventario <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      ) : (
        <div className="bg-green-50/80 border border-green-200 p-4 rounded-xl shadow-sm mb-8 flex items-center">
          <div className="bg-green-500 p-2.5 rounded-full mr-4 shrink-0 shadow-sm">
            <Package className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-green-800 font-bold text-lg">Inventario Óptimo</h3>
            <p className="text-green-700 mt-1">
              Todos tus productos tienen stock suficiente. No hay alertas críticas por el momento.
            </p>
          </div>
        </div>
      )}

      {/* Aquí podremos agregar más tarjetas en el futuro */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center h-32 text-gray-400">
          <p className="font-medium">Métricas Próximamente</p>
        </div>
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center h-32 text-gray-400">
          <p className="font-medium">Métricas Próximamente</p>
        </div>
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center h-32 text-gray-400">
          <p className="font-medium">Métricas Próximamente</p>
        </div>
      </div>
    </div>
  );
}
