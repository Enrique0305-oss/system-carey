"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Truck, LogOut, Pin, PinOff, ChevronDown, ChevronRight, Box, User, Search, Settings, Users, X } from "lucide-react";

export function Sidebar() {
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isAlmacenOpen, setIsAlmacenOpen] = useState(false);
  const [isDespachoOpen, setIsDespachoOpen] = useState(false);
  const [isAjustesOpen, setIsAjustesOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userArea, setUserArea] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Importación dinámica de js-cookie solo en el cliente
    import('js-cookie').then((Cookies) => {
      setUserArea(Cookies.default.get('user_area') || null);
      setUserName(Cookies.default.get('user_name') || null);
    });
    
    // Escuchar evento para abrir sidebar en móvil
    const handleToggle = () => setIsMobileOpen(prev => !prev);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle);
  }, []);

  // Cerrar sidebar móvil cuando se cambia de ruta
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isExpanded = isPinned || isHovered || isMobileOpen;

  // Función para determinar si el enlace está activo
  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return pathname === path;
  };

  const menuSections = [
    {
      title: "PRINCIPAL",
      items: [
        { name: "Dashboard", path: "/almacen" },
        { name: "Kardex", path: "/almacen/kardex" },
        { name: "Proveedores", path: "/almacen/proveedores" },
      ]
    },
    {
      title: "INVENTARIOS",
      items: [
        { name: "Materia Prima", path: "/almacen/materia-prima" },
        { name: "Productos Terminados", path: "/almacen/productos-terminados" },
        { name: "Insumos alimentarios", path: "/almacen/productos-secos" },
        { name: "Envases y Suministros", path: "/almacen/envases" },
        { name: "Químicos y Suministros", path: "/almacen/quimicos" },
        { name: "Consumo Interno", path: "/almacen/consumo" },
      ]
    },
    {
      title: "PRODUCCIÓN",
      items: [
        { name: "Producción Interna", path: "/almacen/produccion" },
        { name: "Producción Terminados", path: "/almacen/produccion-terminados" },
      ]
    },
    {
      title: "OPERACIONES",
      items: [
        { name: "Órdenes de Compra", path: "/almacen/ordenes-compra" },
        { name: "Ajustes de Inventario", path: "/almacen/ajustes" },
      ]
    }
  ];

  return (
    <>
      {/* Fondo oscuro para móvil cuando está abierto */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside 
        className={`bg-[#1F2937] text-gray-300 flex flex-col h-screen shrink-0 transition-all duration-300 ease-in-out fixed lg:relative z-50 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isExpanded ? 'w-64' : 'w-20'}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-4 h-16 flex items-center justify-between bg-[#111827] overflow-hidden whitespace-nowrap">
          <div className="flex items-center justify-center w-full relative">
            {isExpanded ? (
              <div className="flex items-center gap-3">
                <img 
                  src="/images/logo.png" 
                  alt="Carey Logo" 
                  className="h-10 w-10 object-cover rounded-lg shadow-sm"
                />
                <h1 className="text-2xl font-bold tracking-wider text-white">CAREY</h1>
              </div>
            ) : (
              <img 
                src="/images/logo.png" 
                alt="Carey Logo" 
                className="h-8 w-8 object-cover rounded-lg shadow-sm transition-all duration-300"
              />
            )}
          </div>
          
          {/* Botón cerrar para móvil */}
          <button 
            onClick={() => setIsMobileOpen(false)} 
            className="lg:hidden text-gray-400 hover:text-white absolute right-4 p-1"
          >
            <X size={24} />
          </button>

          {isExpanded && (
            <button 
              onClick={() => setIsPinned(!isPinned)} 
              className="hidden lg:block text-gray-400 hover:text-white transition-colors absolute right-4"
              title={isPinned ? "Desfijar menú" : "Fijar menú"}
            >
              {isPinned ? <Pin size={18} className="fill-current" /> : <PinOff size={18} />}
            </button>
          )}
        </div>
      
      {/* --- BOTONES DEL MENÚ --- */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 relative">
        
        {/* --- DASHBOARD GENERAL (Solo Gerencia) --- */}
        {(userArea === 'Gerencia' || userArea === 'Administrador') && (
          <Link
            href="/"
            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300
              ${pathname === '/' ? 'bg-carey-red text-white shadow-md shadow-red-200' : 'hover:bg-[#1F2937] text-gray-400 hover:text-white'}
            `}
          >
            <LayoutDashboard size={20} className="shrink-0" />
            <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-300 ${isExpanded ? 'ml-3 opacity-100' : 'w-0 opacity-0 ml-0 overflow-hidden'}`}>
              Dashboard
            </span>
          </Link>
        )}
        
        {/* Menú Desplegable de Almacén - Solo para Gerencia y Almacen */}
        {(userArea === 'Gerencia' || userArea === 'Almacen') && (
          <div>
            <button 
              onClick={() => setIsAlmacenOpen(!isAlmacenOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap ${isActive('/almacen') ? 'bg-carey-red text-white shadow-md shadow-red-200' : 'hover:bg-[#1F2937] text-gray-400 hover:text-white'}`}
            >
            <div className="flex items-center">
              <Package size={20} className="shrink-0" />
              <span className={`font-medium transition-all duration-300 ${isExpanded ? 'ml-3 opacity-100' : 'w-0 opacity-0 ml-0 overflow-hidden'}`}>
                Almacén
              </span>
            </div>
            {isExpanded && (
              isAlmacenOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            )}
          </button>

          {/* Sub-menú agrupado */}
          {isAlmacenOpen && isExpanded && (
            <div className="mt-2 ml-4 border-l border-gray-700 pl-2 space-y-4 pb-2">
              {menuSections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-3 mb-1">
                    {section.title}
                  </div>
                  {section.items.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center px-3 py-1.5 rounded-lg transition-colors text-sm whitespace-nowrap ${pathname === item.path ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Box size={14} className="mr-2 shrink-0 opacity-50" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Menú Desplegable Despacho - Solo para Gerencia y Despacho */}
        {(userArea === 'Gerencia' || userArea === 'Despacho') && (
          <div>
            <button 
              onClick={() => setIsDespachoOpen(!isDespachoOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 whitespace-nowrap ${isActive('/despacho') ? 'bg-carey-red text-white shadow-md shadow-red-200' : 'hover:bg-[#1F2937] text-gray-400 hover:text-white'}`}
            >
              <div className="flex items-center">
                <Truck size={20} className="shrink-0" />
                <span className={`font-medium transition-all duration-300 ${isExpanded ? 'ml-3 opacity-100' : 'w-0 opacity-0 ml-0 overflow-hidden'}`}>
                  Despacho
                </span>
              </div>
              {isExpanded && (
                isDespachoOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>

            {isDespachoOpen && isExpanded && (
              <div className="mt-2 ml-4 border-l border-gray-700 pl-2 space-y-1 pb-2">
                <Link
                  href="/despacho/salidas"
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${pathname === '/despacho/salidas' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Box size={14} className="mr-2 shrink-0 opacity-50" />
                  <span>Salidas / Ventas</span>
                </Link>
                <Link
                  href="/despacho/clientes"
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${pathname === '/despacho/clientes' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <User size={14} className="mr-2 shrink-0 opacity-50" />
                  <span>Gestión de Clientes</span>
                </Link>
                <Link
                  href="/despacho/trazabilidad"
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${pathname === '/despacho/trazabilidad' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Search size={14} className="mr-2 shrink-0 opacity-50" />
                  <span>Trazabilidad de Lotes</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* --- AJUSTES (Solo Gerencia o Administrador) --- */}
        {(userArea === 'Gerencia' || userArea === 'Administrador') && (
          <div>
            <button 
              onClick={() => { setIsAjustesOpen(!isAjustesOpen); if(!isExpanded) setIsPinned(true); }}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300
                ${pathname.startsWith('/ajustes') ? 'bg-carey-red text-white shadow-md shadow-red-200' : 'hover:bg-[#1F2937] text-gray-400 hover:text-white'}
              `}
            >
              <Settings size={20} className="shrink-0" />
              <div className={`flex justify-between items-center w-full transition-all duration-300 ${isExpanded ? 'ml-3 opacity-100' : 'w-0 opacity-0 ml-0 overflow-hidden'}`}>
                <span className="font-semibold text-sm whitespace-nowrap">Ajustes</span>
                {isAjustesOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </div>
            </button>
            {isExpanded && isAjustesOpen && (
              <div className="ml-11 mt-2 space-y-1">
                <Link
                  href="/ajustes/usuarios"
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${pathname === '/ajustes/usuarios' ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Users size={14} className="mr-2 shrink-0 opacity-50" />
                  <span>Gestión de Usuarios</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      <div className="p-4 bg-[#111827] overflow-hidden border-t border-gray-800 flex flex-col gap-2">
        {userName && (
          <div className={`flex items-center px-4 py-2 text-sm text-gray-400 whitespace-nowrap`}>
            <User size={16} className="shrink-0" />
            <span className={`transition-all duration-300 ${isExpanded ? 'ml-3 opacity-100' : 'w-0 opacity-0 ml-0 overflow-hidden'}`}>
              {userName} <br/><span className="text-xs text-gray-500">({userArea})</span>
            </span>
          </div>
        )}
        <button 
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center px-4 py-2 w-full text-left rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm text-gray-400 whitespace-nowrap"
        >
          <LogOut size={20} className="shrink-0" />
          <span className={`transition-all duration-300 ${isExpanded ? 'ml-3 opacity-100' : 'w-0 opacity-0 ml-0 overflow-hidden'}`}>
            Cerrar Sesión
          </span>
        </button>
      </div>

    </aside>

      {/* --- MODAL CONFIRMAR CERRAR SESIÓN --- */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full max-w-sm m-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cerrar Sesión</h3>
            <p className="text-gray-500 mb-6">¿Estás seguro que deseas salir del sistema? Tendrás que volver a ingresar tus credenciales.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  import('js-cookie').then((Cookies) => {
                    Cookies.default.remove('auth_token');
                    Cookies.default.remove('user_area');
                    Cookies.default.remove('user_name');
                    router.push('/login');
                  });
                }}
                className="px-4 py-2 bg-carey-red hover:bg-red-700 text-white rounded-lg font-medium shadow-md shadow-red-200 transition-colors"
              >
                Sí, salir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
