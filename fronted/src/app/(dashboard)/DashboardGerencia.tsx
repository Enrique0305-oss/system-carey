"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown, DollarSign, Package, Truck, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { createChart } from "lightweight-charts";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from "chart.js";

// Registrar componentes de Chart.js
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function DashboardGerencia() {
  const [data, setData] = useState<any>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/dashboard/gerencia");
      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error fetching gerencia stats", error);
    }
  };

  useEffect(() => {
    if (!data || !chartContainerRef.current) return;

    // --- Lightweight Charts ---
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#6B7280',
      },
      grid: {
        vertLines: { color: '#F3F4F6' },
        horzLines: { color: '#F3F4F6' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
    });

    const seriesDespachos = chart.addAreaSeries({
      lineColor: '#EF4444', // carey-red
      topColor: 'rgba(239, 68, 68, 0.4)',
      bottomColor: 'rgba(239, 68, 68, 0.0)',
    });
    
    const seriesProduccion = chart.addAreaSeries({
      lineColor: '#3B82F6', // blue
      topColor: 'rgba(59, 130, 246, 0.4)',
      bottomColor: 'rgba(59, 130, 246, 0.0)',
    });

    const despachosData = data.timeSeries.map((d: any) => ({ time: d.time, value: d.despachos }));
    const produccionData = data.timeSeries.map((d: any) => ({ time: d.time, value: d.produccion }));

    seriesDespachos.setData(despachosData);
    seriesProduccion.setData(produccionData);

    chart.timeScale().fitContent();

    const handleResize = () => {
      chart.applyOptions({ width: chartContainerRef.current?.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [data]);

  if (!data) return <div className="p-8 text-gray-500 animate-pulse">Cargando métricas de gerencia...</div>;

  // KPIs
  const { kpis, topClients, topProducts } = data;

  // Porcentajes de cambio
  const calcTrend = (current: number, last: number) => {
    if (last === 0) return current > 0 ? 100 : 0;
    return ((current - last) / last) * 100;
  };

  const trendInvertido = calcTrend(kpis.invertido.current, kpis.invertido.last);
  const trendProducido = calcTrend(kpis.producido.current, kpis.producido.last);
  const trendDespachado = calcTrend(kpis.despachado.current, kpis.despachado.last);

  // Datos para Chart.js
  const clientsData = {
    labels: topClients.map((c: any) => c.name),
    datasets: [{
      label: 'KG Despachados',
      data: topClients.map((c: any) => c.quantity),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',   // Blue
        'rgba(16, 185, 129, 0.8)',   // Emerald
        'rgba(245, 158, 11, 0.8)',   // Amber
        'rgba(139, 92, 246, 0.8)',   // Violet
        'rgba(236, 72, 153, 0.8)',   // Pink
      ],
      borderRadius: 4,
    }]
  };

  const productsData = {
    labels: topProducts.map((p: any) => p.name),
    datasets: [{
      data: topProducts.map((p: any) => p.quantity),
      backgroundColor: [
        '#3B82F6', // Blue
        '#10B981', // Emerald
        '#F59E0B', // Amber
        '#8B5CF6', // Violet
        '#EC4899', // Pink
      ],
      borderWidth: 0,
      hoverOffset: 4
    }]
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Inversión en Compras (Mes)</p>
              <h3 className="text-2xl font-bold text-gray-800">S/ {kpis.invertido.current.toLocaleString()}</h3>
            </div>
            <div className="p-3 bg-green-50 rounded-xl text-green-600">
              <DollarSign size={24} />
            </div>
          </div>
          <div className={`mt-4 flex items-center text-sm font-medium ${trendInvertido >= 0 ? 'text-green-600' : 'text-green-600'}`}>
            {trendInvertido >= 0 ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1 text-red-500" />}
            <span className={trendInvertido < 0 ? 'text-red-500' : ''}>{Math.abs(trendInvertido).toFixed(1)}% vs mes anterior</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Volumen Producido (Mes)</p>
              <h3 className="text-2xl font-bold text-gray-800">{kpis.producido.current.toLocaleString()} KG</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Package size={24} />
            </div>
          </div>
          <div className={`mt-4 flex items-center text-sm font-medium ${trendProducido >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trendProducido >= 0 ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
            {Math.abs(trendProducido).toFixed(1)}% vs mes anterior
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Volumen Despachado (Mes)</p>
              <h3 className="text-2xl font-bold text-gray-800">{kpis.despachado.current.toLocaleString()} KG</h3>
            </div>
            <div className="p-3 bg-red-50 rounded-xl text-carey-red">
              <Truck size={24} />
            </div>
          </div>
          <div className={`mt-4 flex items-center text-sm font-medium ${trendDespachado >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trendDespachado >= 0 ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
            {Math.abs(trendDespachado).toFixed(1)}% vs mes anterior
          </div>
        </div>
      </div>

      {/* Gráfico Lightweight Charts */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="text-carey-red" size={20} /> Curva de Producción vs Despachos (Últimos 30 días)
        </h3>
        <div className="flex items-center gap-6 mb-4 text-sm font-medium text-gray-700">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Producción (KG)</div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-carey-red"></div> Despachos (KG)</div>
        </div>
        <div ref={chartContainerRef} className="w-full relative [&_a]:!hidden [&_iframe]:!hidden" />
      </div>

      {/* Gráficos Chart.js */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Clientes</h3>
          <div className="h-[300px]">
            <Bar 
              data={clientsData} 
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
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Productos Estrella</h3>
          <div className="h-[300px] flex justify-center pb-4">
            <Doughnut 
              data={productsData} 
              options={{ 
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'right' }
                },
                cutout: '70%'
              }} 
            />
          </div>
        </div>
      </div>
      
    </div>
  );
}
