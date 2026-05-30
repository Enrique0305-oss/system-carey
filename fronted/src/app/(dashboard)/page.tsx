import styles from "./dashboard.module.css";
import { PackageSearch, AlertTriangle, ArrowUpRight } from "lucide-react";

export default function Home() {
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Panel de Control Multidisciplinario</h1>
        <p className={styles.pageSubtitle}>Resumen general de operaciones y gestión de Carey.</p>
      </div>
      
      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <PackageSearch size={24} className="text-gray-400 mb-2" />
              <h3 className={styles.cardTitle}>Productos en Catálogo</h3>
            </div>
            <span className={`${styles.badge} ${styles.badgeSuccess}`}>Actual</span>
          </div>
          <p className={styles.cardValue}>110</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <AlertTriangle size={24} className="text-gray-400 mb-2" />
              <h3 className={styles.cardTitle}>Bajo Stock</h3>
            </div>
            <span className={`${styles.badge} ${styles.badgeDanger}`}>Atención</span>
          </div>
          <p className={styles.cardValue}>30</p>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <ArrowUpRight size={24} className="text-gray-400 mb-2" />
              <h3 className={styles.cardTitle}>Movimientos de Hoy</h3>
            </div>
            <span className={`${styles.badge} ${styles.badgeWarning}`}>Pendiente</span>
          </div>
          <p className={styles.cardValue}>5</p>
        </div>
      </div>
    </div>
  );
}
