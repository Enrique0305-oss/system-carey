"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Lock, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      // Guardar token y datos en cookies por 12 horas
      Cookies.set("auth_token", data.token, { expires: 0.5 });
      Cookies.set("user_area", data.user.area, { expires: 0.5 });
      Cookies.set("user_name", data.user.name, { expires: 0.5 });
      Cookies.set("user_id", data.user.id, { expires: 0.5 });

      // Redirigir según el área
      if (data.user.area === "Despacho") {
        router.push("/despacho");
      } else {
        router.push("/almacen");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Contenedor principal con el fondo guinda corporativo base
    <div className="min-h-screen bg-[#1E070B] flex items-stretch overflow-hidden font-sans relative">
      
      {/* Fondo decorativo rojo difuminado detrás de todo para dar atmósfera */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#A02014]/15 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* ================= COLUMNA IZQUIERDA (LOGO SUAVIZADO) ================= */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden z-10">
        <img
          src="/images/logo.png"
          alt="Carey Fondo Izquierda"
          className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none filter brightness-90 contrast-105"
        />
        {/* Capa de degradado sutil para integrar el logo al fondo */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E070B]/50 to-[#1A050A]/80" />
      </div>

      {/* ================= COLUMNA CENTRAL (CRISTAL TRANSLÚCIDO CON TINTE ROJO) ================= */}
      <div className="flex-1 lg:max-w-[520px] flex flex-col justify-center items-center px-6 sm:px-12 bg-[#0F1319]/75 backdrop-blur-xl z-20 shadow-[0_0_50px_rgba(0,0,0,0.6)] border-x border-white/[0.04]">
        <div className="w-full max-w-md">
          
          {/* Encabezado del Sistema */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-white tracking-wider drop-shadow-md">
              CAREY <span style={{ color: '#A02014', textShadow: '0 0 15px rgba(160,32,20,0.3)' }}>ERP</span>
            </h2>
            <p className="mt-2 text-xs font-medium text-gray-400 uppercase tracking-widest">
              Gestión de Almacén y Despacho
            </p>
          </div>

          {/* Tarjeta del Formulario (Efecto Glassmorphism más integrado) */}
          <div className="bg-[#1D242E]/60 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-white/[0.06] relative overflow-hidden">
            {/* Pequeño destello interno guinda */}
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#A02014]/20 rounded-full blur-2xl pointer-events-none" />
            
            <form className="space-y-5 relative z-10" onSubmit={handleLogin}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm text-center font-medium">
                  {error}
                </div>
              )}

              {/* Input: Correo Electrónico */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative rounded-xl shadow-inner">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#11161E]/80 border border-white/[0.08] block w-full pl-11 pr-4 py-3 text-white text-sm rounded-xl outline-none focus:border-[#A02014] focus:ring-4 focus:ring-[#A02014]/10 transition-all duration-200"
                    placeholder="admin@carey.com"
                    style={{ WebkitBoxShadow: '0 0 0px 1000px #11161E inset', WebkitTextFillColor: 'white' }}
                  />
                </div>
              </div>

              {/* Input: Contraseña */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <div className="relative rounded-xl shadow-inner">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-[#11161E]/80 border border-white/[0.08] block w-full pl-11 pr-12 py-3 text-white text-sm rounded-xl outline-none focus:border-[#A02014] focus:ring-4 focus:ring-[#A02014]/10 transition-all duration-200"
                    placeholder="••••••"
                    style={{ WebkitBoxShadow: '0 0 0px 1000px #11161E inset', WebkitTextFillColor: 'white' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Botón de Envío */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white transition-all duration-200 active:scale-[0.99] disabled:opacity-50"
                  style={{ 
                    backgroundColor: '#A02014',
                    boxShadow: '0 4px 20px rgba(160, 32, 20, 0.25)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#C12719';
                    e.currentTarget.style.boxShadow = '0 4px 25px rgba(160, 32, 20, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#A02014';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(160, 32, 20, 0.25)';
                  }}
                >
                  {loading ? "Verificando..." : "Iniciar Sesión"}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500 tracking-wider">
            © 2026 Embutidos Carey · Calidad desde 1995
          </p>
        </div>
      </div>

      {/* ================= COLUMNA DERECHA (LOGO SUAVIZADO) ================= */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden z-10">
        <img
          src="/images/logo.png"
          alt="Carey Fondo Derecha"
          className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none filter brightness-90 contrast-105"
        />
        {/* Capa de degradado sutil inversa */}
        <div className="absolute inset-0 bg-gradient-to-l from-[#1E070B]/50 to-[#1A050A]/80" />
      </div>

      <footer className="absolute bottom-0 left-0 w-full bg-white/[0.02] backdrop-blur-md border-t border-white/[0.05] py-4 px-8 z-30 flex items-center justify-start shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        <span className="text-xs sm:text-sm text-gray-400 font-medium tracking-wider uppercase opacity-80">
          © 2026 KODEX PERÚ S.A.C · Todos los derechos reservados
        </span>
      </footer>
    </div>
  );
}