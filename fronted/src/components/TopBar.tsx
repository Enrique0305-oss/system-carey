export function TopBar() {
  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-8 shrink-0">
      <div className="flex-1">
        {/* Placeholder for Breadcrumbs or Search */}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">Soporte Tecnico</p>
          <p className="text-xs text-gray-500">Administrador</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
          ST
        </div>
      </div>
    </header>
  );
}
