"use client";

import { useState, useEffect } from "react";
import { Download, Plus, Search, Eye, Filter, CheckCircle, XCircle, FileText, Trash2, Calendar, DollarSign, Package, Edit, ShoppingCart, Clock, CheckCircle2, Check, X } from "lucide-react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import Link from "next/link";

export default function OrdenesCompraPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalOrders: 0, pendingOrders: 0, totalSpent: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos los estados");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    providerId: "",
    issueDate: new Date().toISOString().split('T')[0],
    expectedDate: "",
    quoteNumber: "",
    invoiceNumber: "",
    includeIgv: false,
    shippingCost: 0,
    notes: "",
    items: [] as any[]
  });
  const [newItem, setNewItem] = useState({ 
    productId: "", 
    quantity: 1, 
    unitPrice: 0,
    lotOption: "existente",
    lotId: "",
    lotCode: "",
    expirationDate: ""
  });

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
    fetchOrders();
    fetchStats();
    fetchProvidersAndProducts();
  }, []);

  const fetchProvidersAndProducts = async () => {
    try {
      const [provRes, prodRes] = await Promise.all([
        fetch("http://localhost:4000/api/providers"),
        fetch("http://localhost:4000/api/products")
      ]);
      const provData = await provRes.json();
      const prodData = await prodRes.json();
      setProviders(provData.filter((p: any) => p.estado === "ACTIVO"));
      setProducts(prodData.filter((p: any) => p.status === "ACTIVO"));
    } catch (error) {
      console.error("Error fetching providers/products:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/purchase-orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch("http://localhost:4000/api/purchase-orders/stats");
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
    const tax = formData.includeIgv ? subtotal * 0.18 : 0;
    const shipping = Number(formData.shippingCost) || 0;
    const total = subtotal + tax + shipping;
    return { subtotal, tax, total, shipping };
  };

  const handleAddItem = () => {
    if (!newItem.productId || newItem.quantity <= 0 || newItem.unitPrice < 0) {
      toast.error("Datos del producto inválidos");
      return;
    }
    
    if (newItem.lotOption === "existente" && !newItem.lotId) {
      toast.error("Debe seleccionar un lote existente");
      return;
    }

    if (newItem.lotOption === "nuevo" && !newItem.lotCode) {
      toast.error("Debe ingresar el N° de Lote nuevo");
      return;
    }

    const product = products.find(p => p.id === newItem.productId);
    if (!product) return;

    let lotDisplay = "";
    if (newItem.lotOption === "existente") {
      const lot = product.lots?.find((l:any) => l.id === newItem.lotId);
      lotDisplay = lot ? lot.lotCode : "";
    } else {
      lotDisplay = `${newItem.lotCode} (Nuevo)`;
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, {
        productId: product.id,
        name: product.description,
        isNewLot: newItem.lotOption === "nuevo",
        lotId: newItem.lotOption === "existente" ? newItem.lotId : undefined,
        lotCode: newItem.lotOption === "nuevo" ? newItem.lotCode : undefined,
        expirationDate: newItem.lotOption === "nuevo" ? newItem.expirationDate : undefined,
        lotDisplay,
        quantity: Number(newItem.quantity),
        unitPrice: Number(newItem.unitPrice),
        totalPrice: Number(newItem.quantity) * Number(newItem.unitPrice)
      }]
    }));
    setNewItem({ productId: "", quantity: 1, unitPrice: 0, lotOption: "existente", lotId: "", lotCode: "", expirationDate: "" });
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.items.length === 0) {
      toast.error("Debe agregar al menos un producto");
      return;
    }
    
    const { subtotal, tax, total } = calculateTotals();
    
    try {
      const res = await fetch("http://localhost:4000/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          userId: Cookies.get("user_id"),
          subtotal,
          tax,
          total
        })
      });

      if (res.ok) {
        setIsModalOpen(false);
        setFormData({
          providerId: "", issueDate: new Date().toISOString().split('T')[0], expectedDate: "", quoteNumber: "", invoiceNumber: "", includeIgv: false, shippingCost: 0, notes: "", items: []
        });
        fetchOrders();
        fetchStats();
        showSuccessToast("Orden de compra creada correctamente");
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al crear la orden");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Ocurrió un error inesperado");
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "EN_REVISION": return "bg-orange-100 text-orange-700";
      case "PENDIENTE": return "bg-blue-100 text-blue-700";
      case "RECIBIDA": return "bg-green-100 text-green-700";
      case "CANCELADA": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch(status) {
      case "EN_REVISION": return "En Revisión";
      case "PENDIENTE": return "Pendiente (Aprobada)";
      case "RECIBIDA": return "Recibida";
      case "CANCELADA": return "Anulada";
      default: return status;
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const bodyData: any = { status: newStatus };
      const currentUserName = Cookies.get("user_name") || "Usuario Desconocido";
      
      if (newStatus === 'RECIBIDA') {
        bodyData.receivedBy = currentUserName;
      }
      if (newStatus === 'PENDIENTE') {
        bodyData.approvedBy = currentUserName;
      }

      const res = await fetch(`http://localhost:4000/api/purchase-orders/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData)
      });
      if (res.ok) {
        showSuccessToast(`Orden actualizada a ${getStatusText(newStatus)}`);
        fetchOrders();
        fetchStats();
        setSelectedOrder(null); // Cerrar detalle si está abierto
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al actualizar estado");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.orderNumber.toLowerCase().includes(search.toLowerCase()) || 
                          (o.provider?.razonSocial?.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = statusFilter === "Todos los estados" || 
                          (statusFilter === "Pendiente" && o.status === "PENDIENTE") ||
                          (statusFilter === "Completada" && o.status === "COMPLETADA") ||
                          (statusFilter === "Cancelada" && o.status === "CANCELADA");
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Ordenar de mayor a menor según el N° de Orden (Ej: OC-00005 va antes que OC-00002)
    if (a.orderNumber < b.orderNumber) return 1;
    if (a.orderNumber > b.orderNumber) return -1;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Órdenes de Compra</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#1F2937] hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-sm"
        >
          <Plus size={18} className="mr-2" /> Nueva Orden
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Total de Órdenes</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalOrders}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <ShoppingCart size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Pendientes</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</h3>
          </div>
          <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center">
            <Clock size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Monto Total Invertido</p>
            <h3 className="text-2xl font-bold text-gray-900">
              S/ {Number(stats.totalSpent).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por N° Orden o Proveedor..." 
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
            <option>Pendiente</option>
            <option>Completada</option>
            <option>Cancelada</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">N° Orden</th>
                <th className="px-6 py-4 font-medium">Proveedor</th>
                <th className="px-6 py-4 font-medium text-center">Fecha Emisión</th>
                <th className="px-6 py-4 font-medium text-right">Total</th>
                <th className="px-6 py-4 font-medium text-center">Estado</th>
                <th className="px-6 py-4 font-medium text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Cargando órdenes...</td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No se encontraron órdenes de compra.</td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{order.orderNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{order.provider.razonSocial}</div>
                      <div className="text-sm text-gray-500">RUC: {order.provider.ruc}</div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">
                      {new Date(order.issueDate).toLocaleDateString('es-PE')}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      S/ {Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-2">
                        <button onClick={() => setSelectedOrder(order)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors" title="Ver Detalle">
                          <Eye size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Orden */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 rounded-t-3xl">
              <h2 className="text-2xl font-bold text-[#1F2937]">Nueva Orden de Compra</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="poForm" onSubmit={handleCreateOrder} className="space-y-6">
                
                {/* Cabecera */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
                    <select 
                      required 
                      value={formData.providerId} 
                      onChange={e => setFormData({...formData, providerId: e.target.value})} 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] outline-none"
                    >
                      <option value="">Seleccione un proveedor</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.id}>{p.razonSocial} {p.ruc ? `(${p.ruc})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Emisión *</label>
                      <input 
                        type="date" 
                        required 
                        value={formData.issueDate} 
                        onChange={e => setFormData({...formData, issueDate: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">N° Cotización</label>
                      <input 
                        type="text" 
                        placeholder="Ej. COT-123"
                        value={formData.quoteNumber} 
                        onChange={e => setFormData({...formData, quoteNumber: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] outline-none" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">N° Factura</label>
                      <input 
                        type="text" 
                        placeholder="Ej. F001-234"
                        value={formData.invoiceNumber} 
                        onChange={e => setFormData({...formData, invoiceNumber: e.target.value})} 
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] outline-none" 
                      />
                    </div>
                  </div>
                </div>

                {/* Agregar Productos */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Agregar Productos</h3>
                  <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Producto</label>
                      <select 
                        value={newItem.productId} 
                        onChange={e => {
                          const p = products.find(prod => prod.id === e.target.value);
                          setNewItem({...newItem, productId: e.target.value, unitPrice: p ? p.unitPrice : 0, lotId: ""})
                        }} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] outline-none"
                      >
                        <option value="">Seleccione...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.description}</option>
                        ))}
                      </select>
                    </div>

                    {/* Selector de Lote */}
                    {newItem.productId && (
                      <div className="w-56 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex gap-3 mb-2 text-xs">
                           <label className="flex items-center text-gray-700 cursor-pointer">
                              <input type="radio" name="lotOption" value="existente" checked={newItem.lotOption === 'existente'} onChange={() => setNewItem({...newItem, lotOption: 'existente'})} className="mr-1 accent-blue-600" />
                              Existente
                           </label>
                           <label className="flex items-center text-gray-700 cursor-pointer">
                              <input 
                                type="radio" 
                                name="lotOption" 
                                value="nuevo" 
                                checked={newItem.lotOption === 'nuevo'} 
                                onChange={() => {
                                  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
                                  const randomSuffix = Math.floor(100 + Math.random() * 900);
                                  setNewItem({...newItem, lotOption: 'nuevo', lotCode: `L-${dateStr}-${randomSuffix}`});
                                }} 
                                className="mr-1 accent-blue-600" 
                              />
                              Nuevo
                           </label>
                        </div>
                        {newItem.lotOption === 'existente' ? (
                           <select value={newItem.lotId} onChange={e => setNewItem({...newItem, lotId: e.target.value})} className="w-full border border-gray-300 rounded text-xs px-2 py-1.5 outline-none text-gray-900 focus:ring-1 focus:ring-blue-500">
                             <option value="">Seleccionar lote...</option>
                             {products.find(p => p.id === newItem.productId)?.lots?.map((l: any) => (
                               <option key={l.id} value={l.id}>{l.lotCode} ({l.quantity} u.)</option>
                             ))}
                           </select>
                        ) : (
                           <div className="space-y-1.5">
                             <input 
                               type="text" 
                               placeholder="Lote Auto-generado" 
                               value={newItem.lotCode} 
                               readOnly
                               className="w-full border border-gray-300 rounded text-xs px-2 py-1.5 outline-none text-gray-500 bg-gray-100 cursor-not-allowed" 
                             />
                             <input type="date" value={newItem.expirationDate} onChange={e => setNewItem({...newItem, expirationDate: e.target.value})} className="w-full border border-gray-300 rounded text-xs px-2 py-1.5 outline-none text-gray-900 focus:ring-1 focus:ring-blue-500" />
                           </div>
                        )}
                      </div>
                    )}

                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                      <input 
                        type="number" 
                        min="1" step="0.01" 
                        value={newItem.quantity} 
                        onChange={e => setNewItem({...newItem, quantity: parseFloat(e.target.value)})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] outline-none" 
                      />
                    </div>
                    <div className="w-32">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Precio Unit.</label>
                      <input 
                        type="number" 
                        min="0" step="0.01" 
                        value={newItem.unitPrice} 
                        onChange={e => setNewItem({...newItem, unitPrice: parseFloat(e.target.value)})} 
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] outline-none" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={handleAddItem}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Añadir
                    </button>
                  </div>
                </div>

                {/* Tabla de Items */}
                {formData.items.length > 0 && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-100 text-gray-700 font-medium">
                        <tr>
                          <th className="px-4 py-2">PRODUCTO</th>
                          <th className="px-4 py-2">LOTE</th>
                          <th className="px-4 py-2 text-right">CANT.</th>
                          <th className="px-4 py-2 text-right">PRECIO U.</th>
                          <th className="px-4 py-2 text-right">SUBTOTAL</th>
                          <th className="px-4 py-2 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {formData.items.map((item, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="px-4 py-2 font-medium text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-gray-600">
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
                                {item.lotDisplay}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900">{item.quantity}</td>
                            <td className="px-4 py-2 text-right text-gray-900">S/ {item.unitPrice.toFixed(2)}</td>
                            <td className="px-4 py-2 text-right font-bold text-[#1F2937]">S/ {item.totalPrice.toFixed(2)}</td>
                            <td className="px-4 py-2 text-center">
                              <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Totales y Opciones */}
                <div className="flex flex-col md:flex-row justify-between gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notas / Observaciones</label>
                    <textarea 
                      rows={2} 
                      value={formData.notes} 
                      onChange={e => setFormData({...formData, notes: e.target.value})} 
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-900 focus:ring-2 focus:ring-[#1F2937] outline-none resize-none" 
                    />
                  </div>
                  <div className="w-full md:w-64 space-y-2">
                    <div className="flex items-center mb-3">
                      <input 
                        type="checkbox" 
                        id="igv" 
                        checked={formData.includeIgv} 
                        onChange={e => setFormData({...formData, includeIgv: e.target.checked})} 
                        className="w-4 h-4 text-[#1F2937] rounded border-gray-300 focus:ring-[#1F2937]"
                      />
                      <label htmlFor="igv" className="ml-2 text-sm font-medium text-gray-700">
                        Aplicar IGV (18%) al final
                      </label>
                    </div>
                    <div className="flex items-center justify-between mb-3 border-b border-gray-200 pb-3">
                      <label className="text-sm font-medium text-gray-700">Costo de Envío:</label>
                      <div className="flex items-center w-24">
                        <span className="text-gray-500 mr-2 text-sm">S/</span>
                        <input 
                          type="number" 
                          min="0" step="0.01"
                          value={formData.shippingCost} 
                          onChange={e => setFormData({...formData, shippingCost: parseFloat(e.target.value) || 0})} 
                          className="w-full border border-gray-300 rounded px-2 py-1 text-gray-900 text-right focus:ring-2 focus:ring-[#1F2937] outline-none text-sm" 
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold text-gray-900">S/ {calculateTotals().subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">IGV (18%):</span>
                      <span className="font-semibold text-gray-900">S/ {calculateTotals().tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Envío:</span>
                      <span className="font-semibold text-gray-900">S/ {calculateTotals().shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg border-t border-gray-200 pt-2 mt-2">
                      <span className="font-bold text-[#1F2937]">TOTAL:</span>
                      <span className="font-bold text-[#1F2937]">S/ {calculateTotals().total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-3xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors">
                Cancelar
              </button>
              <button type="submit" form="poForm" className="px-6 py-2.5 bg-[#1F2937] text-white rounded-lg hover:bg-gray-800 font-medium transition-colors shadow-sm">
                Emitir Orden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle de Orden */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white shrink-0 rounded-t-3xl">
              <h2 className="text-xl font-bold text-[#1F2937]">
                Orden {selectedOrder.orderNumber}
              </h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-4 bg-gray-50">
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                {/* Información General */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Información General</h3>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-[#1F2937]">N° OC:</span>
                      <span className="col-span-2 text-gray-600">{selectedOrder.orderNumber}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-[#1F2937]">N° Cotiz. Prov:</span>
                      <span className="col-span-2 text-gray-600">{selectedOrder.quoteNumber || '—'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-[#1F2937]">N° Factura:</span>
                      <span className="col-span-2 text-gray-600">{selectedOrder.invoiceNumber || '—'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 items-center">
                      <span className="font-semibold text-[#1F2937]">Estado:</span>
                      <div className="col-span-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${getStatusColor(selectedOrder.status)}`}>
                          {getStatusText(selectedOrder.status)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-[#1F2937]">Fecha Compra:</span>
                      <span className="col-span-2 text-gray-600">{new Date(selectedOrder.issueDate).toLocaleDateString('es-PE')}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-[#1F2937]">Fecha Recepción:</span>
                      <span className="col-span-2 text-gray-600">
                        {selectedOrder.status === 'RECIBIDA' ? new Date(selectedOrder.updatedAt).toLocaleDateString('es-PE') : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Proveedor */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Proveedor</h3>
                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-[#1F2937]">Razón Social:</span>
                      <span className="col-span-2 text-gray-600 uppercase">{selectedOrder.provider.razonSocial}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-[#1F2937]">RUC:</span>
                      <span className="col-span-2 text-gray-600">{selectedOrder.provider.ruc || '—'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-[#1F2937]">Contacto:</span>
                      <span className="col-span-2 text-gray-600">{selectedOrder.provider.contactoNombre || '—'}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="font-semibold text-[#1F2937]">Teléfono:</span>
                      <span className="col-span-2 text-gray-600">{selectedOrder.provider.telefono || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Trazabilidad */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Trazabilidad</h3>
                  <div className="space-y-3 text-xs mt-4">
                    <div>
                      <span className="block font-semibold text-[#1F2937] mb-1">Emitido por:</span>
                      <span className="text-gray-600">{selectedOrder.user?.name || '—'}</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-[#1F2937] mb-1">Aprobado por:</span>
                      <span className="text-gray-600">{selectedOrder.approvedBy || '—'}</span>
                    </div>
                    <div>
                      <span className="block font-semibold text-[#1F2937] mb-1">Recibido por:</span>
                      <span className="text-gray-600">{selectedOrder.receivedBy || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Productos */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Productos</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[#3b4b6b] font-bold text-[10px] uppercase border-b-2 border-gray-100">
                      <tr>
                        <th className="px-3 py-2">PRODUCTO</th>
                        <th className="px-3 py-2">LOTE</th>
                        <th className="px-3 py-2 text-center">CANT.</th>
                        <th className="px-3 py-2 text-right">PRECIO UNIT.</th>
                        <th className="px-3 py-2 text-right">SUBTOTAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50 text-gray-800">
                          <td className="px-3 py-2 font-medium uppercase">{item.product?.description}</td>
                          <td className="px-3 py-2">
                            {item.lot ? (
                              <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
                                {item.lot.lotCode}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="px-3 py-2 text-center">{Number(item.quantity)}</td>
                          <td className="px-3 py-2 text-right">S/ {Number(item.unitPrice).toFixed(2)}</td>
                          <td className="px-3 py-2 text-right font-medium">S/ {Number(item.totalPrice).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="border-t border-gray-200">
                      <tr>
                        <td colSpan={3}></td>
                        <td className="px-3 py-2 text-right font-bold text-[#1F2937]">Subtotal:</td>
                        <td className="px-3 py-2 text-right font-bold text-[#1F2937]">S/ {Number(selectedOrder.subtotal).toFixed(2)}</td>
                      </tr>
                      {Number(selectedOrder.tax) > 0 && (
                        <tr>
                          <td colSpan={3}></td>
                          <td className="px-3 py-1.5 text-right font-bold text-[#1F2937]">IGV (18%):</td>
                          <td className="px-3 py-1.5 text-right font-bold text-[#1F2937]">S/ {Number(selectedOrder.tax).toFixed(2)}</td>
                        </tr>
                      )}
                      {Number(selectedOrder.shippingCost) > 0 && (
                        <tr>
                          <td colSpan={3}></td>
                          <td className="px-3 py-1.5 text-right font-bold text-[#1F2937]">Envío:</td>
                          <td className="px-3 py-1.5 text-right font-bold text-[#1F2937]">S/ {Number(selectedOrder.shippingCost).toFixed(2)}</td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan={3}></td>
                        <td className="px-3 py-3 text-right font-bold text-[#1F2937] text-sm">TOTAL:</td>
                        <td className="px-3 py-3 text-right font-bold text-blue-700 text-base">S/ {Number(selectedOrder.total).toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-white flex justify-between items-center shrink-0 rounded-b-3xl">
              <div>
                {selectedOrder.status === 'EN_REVISION' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleStatusChange(selectedOrder.id, 'PENDIENTE')} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm">
                      <CheckCircle2 size={18} className="mr-2" /> Aprobar Orden
                    </button>
                    <button onClick={() => handleStatusChange(selectedOrder.id, 'CANCELADA')} className="flex items-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors">
                      <X size={18} className="mr-2" /> Anular
                    </button>
                  </div>
                )}
                {selectedOrder.status === 'PENDIENTE' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleStatusChange(selectedOrder.id, 'RECIBIDA')} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors shadow-sm">
                      <Check size={18} className="mr-2" /> Confirmar Recepción
                    </button>
                    <button onClick={() => handleStatusChange(selectedOrder.id, 'CANCELADA')} className="flex items-center px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-medium transition-colors">
                      <X size={18} className="mr-2" /> Anular
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedOrder(null)} className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
