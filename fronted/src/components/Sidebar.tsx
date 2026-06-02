"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, Truck, LogOut, Pin, PinOff, ChevronDown, ChevronRight, Box, User } from "lucide-react";

export function Sidebar() {
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isAlmacenOpen, setIsAlmacenOpen] = useState(false);
  const [userArea, setUserArea] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Importación dinámica de js-cookie solo en el cliente
    import('js-cookie').then((Cookies) => {
      setUserArea(Cookies.default.get('user_area') || null);
      setUserName(Cookies.default.get('user_name') || null);
    });
  }, []);

  const isExpanded = isPinned || isHovered;

  // Función para determinar si el enlace está activo
  const isActive = (path: string) => {
    if (path === '/' && pathname !== '/') return false;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return pathname === path;
  };

  const almacenes = [
    { name: "Dashboard", path: "/almacen" },
    { name: "Kardex", path: "/almacen/kardex" },
    { name: "Proveedores", path: "/almacen/proveedores" },
    { name: "Materia Prima", path: "/almacen/materia-prima" },
    { name: "Productos Terminados", path: "/almacen/productos-terminados" },
    { name: "Productos Secos", path: "/almacen/productos-secos" },
    { name: "Almacén de Envases y Suministros", path: "/almacen/envases" },
    { name: "Almacén Químicos y Suministro", path: "/almacen/quimicos" },
    { name: "Producción Interna", path: "/almacen/produccion" },
  ];

  return (
    <aside 
      className={`bg-[#1F2937] text-gray-300 flex flex-col h-screen shrink-0 transition-all duration-300 ease-in-out relative ${isExpanded ? 'w-64' : 'w-20'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 h-16 flex items-center justify-between bg-[#111827] overflow-hidden whitespace-nowrap">
        <div className="flex items-center justify-center w-full">
          {isExpanded ? (
            <h1 className="text-2xl font-bold tracking-wider text-white transition-opacity duration-300">
              CAREY
            </h1>
          ) : (
            <h1 className="text-2xl font-bold tracking-wider text-white transition-opacity duration-300">
              C
            </h1>
          )}
        </div>
        
        {isExpanded && (
          <button 
            onClick={() => setIsPinned(!isPinned)} 
            className="text-gray-400 hover:text-white transition-colors absolute right-4"
            title={isPinned ? "Desfijar menú" : "Fijar menú"}
          >
            {isPinned ? <Pin size={18} className="fill-current" /> : <PinOff size={18} />}
          </button>
        )}
      </div>
      
      <nav className="flex-1 px-4 space-y-2 mt-6 overflow-x-hidden overflow-y-auto">
        <Link 
          href="/" 
          className={`flex items-center px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${isActive('/') ? 'bg-carey-red text-white' : 'hover:bg-white/5 hover:text-white'}`}
        >
          <LayoutDashboard size={20} className="shrink-0" />
          <span className={`font-medium transition-all duration-300 ${isExpanded ? 'ml-3 opacity-100' : 'w-0 opacity-0 ml-0 overflow-hidden'}`}>
            Dashboard
          </span>
        </Link>
        
        {/* Menú Desplegable de Almacén - Solo para Gerencia y Almacen */}
        {(userArea === 'Gerencia' || userArea === 'Almacen') && (
          <div>
            <button 
              onClick={() => setIsAlmacenOpen(!isAlmacenOpen)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${isActive('/almacen') ? 'bg-carey-red text-white' : 'hover:bg-white/5 hover:text-white'}`}
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

          {/* Sub-menú de los 5 almacenes */}
          {isAlmacenOpen && isExpanded && (
            <div className="mt-1 ml-4 space-y-1 border-l border-gray-600 pl-2">
              {almacenes.map((almacen) => (
                <Link
                  key={almacen.path}
                  href={almacen.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${pathname === almacen.path ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <Box size={14} className="mr-2 shrink-0" />
                  <span>{almacen.name}</span>
                </Link>
              ))}
              <Link 
                href="/almacen/ordenes-compra"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${pathname === "/almacen/ordenes-compra" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                Órdenes de Compra
              </Link>
              <Link 
                href="/almacen/ajustes"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${pathname === "/almacen/ajustes" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"}`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                Ajustes de Inventario
              </Link>
            </div>
          )}
        </div>
        )}

        {/* Menú Despacho - Solo para Gerencia y Despacho */}
        {(userArea === 'Gerencia' || userArea === 'Despacho') && (
          <Link 
            href="/despacho" 
            className={`flex items-center px-4 py-3 rounded-lg transition-colors whitespace-nowrap ${isActive('/despacho') ? 'bg-carey-red text-white' : 'hover:bg-white/5 hover:text-white'}`}
          >
            <Truck size={20} className="shrink-0" />
            <span className={`font-medium transition-all duration-300 ${isExpanded ? 'ml-3 opacity-100' : 'w-0 opacity-0 ml-0 overflow-hidden'}`}>
              Despacho
            </span>
          </Link>
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
          onClick={() => {
            import('js-cookie').then((Cookies) => {
              Cookies.default.remove('auth_token');
              Cookies.default.remove('user_area');
              Cookies.default.remove('user_name');
              router.push('/login');
            });
          }}
          className="flex items-center px-4 py-2 w-full text-left rounded-lg hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm text-gray-400 whitespace-nowrap"
        >
          <LogOut size={20} className="shrink-0" />
          <span className={`transition-all duration-300 ${isExpanded ? 'ml-3 opacity-100' : 'w-0 opacity-0 ml-0 overflow-hidden'}`}>
            Cerrar Sesión
          </span>
        </button>
      </div>
    </aside>
  );
}
