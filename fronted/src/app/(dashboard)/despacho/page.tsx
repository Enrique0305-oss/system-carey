import styles from "./despacho.module.css";

export default function DespachoPage() {
  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Despacho</h1>
          <p className="text-sm text-gray-500 mt-1">Gestión de envíos y salidas.</p>
        </div>
        <button className={styles.btnPrimary}>
          + Nuevo Despacho
        </button>
      </div>
      
      <div className={styles.contentCard}>
        El contenido de la tabla de despachos irá aquí.
      </div>
    </div>
  );
}
