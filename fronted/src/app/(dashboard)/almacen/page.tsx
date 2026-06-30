"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, ArrowRight, Package, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { createChart, ColorType } from "lightweight-charts";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from "chart.js";

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, ChartTooltip, Legend);

export default function AlmacenDashboard() {
  const [alerts, setAlerts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getWarehouseLink = (wName: string) => {
    if (wName === 'Materia Prima') return '/almacen/materia-prima';
    if (wName === 'Productos Terminados') return '/almacen/productos-terminados';
    if (wName === 'Productos Secos') return '/almacen/productos-secos';
    if (wName.includes('Envase')) return '/almacen/envases';
    if (wName.includes('Químico') || wName.includes('Quimico') || wName.includes('Qumico')) return '/almacen/quimicos';
    return '/almacen/materia-prima';
  };

  const chartContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!alerts || !chartContainerRef.current || !alerts.ingresosSemana) return;

    // --- Lightweight Charts ---
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#6B7280',
      },
      grid: {
        vertLines: { color: '#F3F4F6' },
        horzLines: { color: '#F3F4F6' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    const seriesIngresos = chart.addAreaSeries({
      lineColor: '#10B981', // green
      topColor: 'rgba(16, 185, 129, 0.4)',
      bottomColor: 'rgba(16, 185, 129, 0.0)',
    });

    const ingresosData = alerts.ingresosSemana.map((d: any) => ({ time: d.time, value: d.value }));
    seriesIngresos.setData(ingresosData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [alerts]);

  // Datos Chart.js Top Insumos
  const insumosData = alerts && alerts.topInsumos ? {
    labels: alerts.topInsumos.map((i: any) => i.name),
    datasets: [{
      label: 'KG Consumidos',
      data: alerts.topInsumos.map((i: any) => i.quantity),
      backgroundColor: [
        'rgba(245, 158, 11, 0.8)',   // Amber
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(239, 68, 68, 0.8)',    // Red
        'rgba(139, 92, 246, 0.8)',   // Violet
        'rgba(16, 185, 129, 0.8)',   // Emerald
      ],
      borderRadius: 4,
    }]
  } : null;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Almacén</h1>
        <p className="text-gray-500 mt-1">Resumen general y estado de los inventarios.</p>
      </div>
      
      {loading ? (
        <div className="animate-pulse bg-gray-200 h-24 rounded-lg w-full mb-8"></div>
      ) : alerts && alerts.lowStockCount > 0 ? (
        <div className="bg-yellow-50/80 border border-yellow-200 p-5 rounded-xl shadow-sm mb-8 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2.5 rounded-full shadow-sm">
              <AlertTriangle className="text-white" size={20} />
            </div>
            <div>
              <h3 className="text-yellow-800 font-bold text-lg">Alertas de Reabastecimiento Crítico</h3>
              <p className="text-yellow-700 text-sm">
                Tienes <span className="font-bold">{alerts.lowStockCount} productos</span> por debajo del nivel de seguridad, distribuidos en los siguientes almacenes:
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
            {Object.entries(
              alerts.lowStockProducts.reduce((acc: any, prod: any) => {
                const wName = prod.warehouseName || 'Otros';
                acc[wName] = (acc[wName] || 0) + 1;
                return acc;
              }, {})
            ).map(([warehouseName, count]: any) => (
              <div key={warehouseName} className="bg-white/80 border border-yellow-200/60 p-3 rounded-lg flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow">
                <span className="font-bold text-yellow-800 text-sm truncate mb-2" title={warehouseName}>
                  {warehouseName === 'Productos Secos' 
                    ? 'Insumos alimentarios' 
                    : warehouseName.replace('Almacén de ', '').replace('Almacén ', '').replace('Almacn de ', '').replace('Almacn ', '')}
                </span>
                <div className="flex justify-between items-center">
                  <span className="bg-yellow-100 text-yellow-800 font-bold px-2 py-1 rounded text-xs shrink-0 border border-yellow-200">
                    {count} {count === 1 ? 'insumo' : 'insumos'}
                  </span>
                  <Link href={getWarehouseLink(warehouseName)} className="text-yellow-600 hover:text-yellow-800 transition-colors">
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
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
      {/* --- DASHBOARD ANALÍTICO ALMACÉN --- */}
      {alerts && (
        <div className="space-y-6 animate-in fade-in duration-500">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KPI Merma Mensual */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Mermas Reportadas (Mes)</p>
                <h3 className="text-3xl font-bold text-gray-800">{alerts.mermaMes || 0} <span className="text-lg text-gray-500 font-normal">KG</span></h3>
                {alerts.mermaMes > 0 && <p className="text-xs text-red-500 mt-2 flex items-center"><TrendingDown size={14} className="mr-1"/> Requiere supervisión</p>}
              </div>
              <div className="bg-red-50 p-4 rounded-2xl text-red-500">
                <AlertTriangle size={32} />
              </div>
            </div>

            {/* KPI Ingresos Rápidos */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Ingresos de Semana (Compras)</p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {alerts.ingresosSemana ? alerts.ingresosSemana.reduce((sum: number, d: any) => sum + d.value, 0) : 0} <span className="text-lg text-gray-500 font-normal">KG</span>
                </h3>
              </div>
              <div className="bg-green-50 p-4 rounded-2xl text-green-500">
                <TrendingUp size={32} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico Chart.js: Top Insumos */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Insumos Consumidos</h3>
              <div className="h-[250px]">
                {insumosData && (
                  <Bar 
                    data={insumosData} 
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { beginAtZero: true, grid: { color: '#F3F4F6' } },
                        x: { grid: { display: false } }
                      }
                    }} 
                  />
                )}
              </div>
            </div>

            {/* Gráfico Lightweight: Ingresos */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                 Curva de Ingresos (Últimos 7 días)
              </h3>
              <div ref={chartContainerRef} className="w-full relative [&_a]:!hidden [&_iframe]:!hidden" />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
