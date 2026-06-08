"use client";

import styles from "./dashboard.module.css";
import { PackageSearch, AlertTriangle, ArrowUpRight } from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DashboardGerencia from "./DashboardGerencia";

export default function DashboardGeneral() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Redirección por Área si intentan entrar al Dashboard General
    const userArea = Cookies.get('user_area');
    if (userArea && userArea !== 'Gerencia' && userArea !== 'Administrador') {
      if (userArea === 'Almacen' || userArea === 'Almacén') {
        router.push("/almacen/kardex");
      } else if (userArea === 'Despacho') {
        router.push("/despacho/clientes");
      } else {
        router.push("/"); // fallback
      }
      return;
    }
    setChecking(false);
  }, [router]);

  if (checking) return null;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Panel de Control Multidisciplinario</h1>
        <p className={styles.pageSubtitle}>Resumen general de operaciones y gestión de Carey.</p>
      </div>
      
      <DashboardGerencia />
    </div>
  );
}
