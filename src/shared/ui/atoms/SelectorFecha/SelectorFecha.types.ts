export interface SelectorFechaProps {
  /** El dia elegido, en `aaaa-mm-dd`, o null si todavia no hay ninguno. */
  valor: string | null;
  onCambiar: (fecha: string) => void;
  /** El primer dia que se puede elegir, `aaaa-mm-dd`. Los anteriores se ven apagados. */
  minimo?: string;
  /** Que se esta eligiendo, para el lector de pantalla ("Fecha de vencimiento"). */
  accessibilityLabel?: string;
}
