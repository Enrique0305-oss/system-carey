"use client";

import { useEffect, useState } from "react";

export function TopBar() {
  const [userName, setUserName] = useState<string>("Cargando...");
  const [userArea, setUserArea] = useState<string>("");
  const [initials, setInitials] = useState<string>("");

  useEffect(() => {
    import('js-cookie').then((Cookies) => {
      const name = Cookies.default.get('user_name') || 'Usuario Desconocido';
      const area = Cookies.default.get('user_area') || 'Área Desconocida';
      setUserName(name);
      setUserArea(area);
      
      // Obtener iniciales (ej: "Juan Perez" -> "JP")
      const parts = name.split(' ');
      if (parts.length >= 2) {
        setInitials(parts[0][0].toUpperCase() + parts[1][0].toUpperCase());
      } else {
        setInitials(name.substring(0, 2).toUpperCase());
      }
    });
  }, []);

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shrink-0">
      <div className="flex-1">
        {/* Espacio para Breadcrumbs o Buscador */}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">{userName}</p>
          <p className="text-xs text-gray-500">{userArea}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-carey-red shadow-md shadow-red-200 text-white flex items-center justify-center font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}
