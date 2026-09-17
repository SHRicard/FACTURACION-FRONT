# Registrar un pago

El cliente pasa por el negocio y deja plata, sin llevarse nada. Esa plata se
**descuenta de lo que debe**: puede cubrir todo (pago completo) o una parte
(pago parcial). Acá está el ciclo completo: registrarlo, verlo en la factura y
anularlo si se cargó mal.

Para ver la factura con sus tickets, [FACTURAS.md](FACTURAS.md). Para el
ticket, [CREATE_TICK.md](CREATE_TICK.md).

- **Base:** `http://localhost:4000`
- **Auth:** pide `Authorization: Bearer <token>`
- **Errores:** siempre `{ error, detalles? }`

---

## Qué es un pago

**Plata que el cliente deja a cuenta.** "Martes: vino Ana y dejó $20.000."

No hay que confundirlo con lo que deja **en el momento de comprar**, que va en
el ticket (`ticket.pagado`) y ya descuenta del faltante de ese ticket. El pago
es aparte: no trae mercadería, solo baja la deuda.

```
factura de Ana
  se llevó              $50.000     totalMercaderia
  dejó al comprar     − $ 9.000     totalPagadoEnTickets
  ───────────────────────────
  quedó anotado         $41.000     totalFiado
  pagos a cuenta      − $20.000     totalPagos       ← esto es lo que registra esta guía
  ═══════════════════════════
  SALDO                 $21.000     saldo
```

### Completo o parcial

No hay que elegirlo: **sale del monto**. Si con lo que dejó el saldo queda en
cero es `completo`; si queda algo, `parcial`. El backend lo calcula y lo
devuelve en `tipo`.

| Debía | Dejó | Queda | `tipo` |
| --- | --- | --- | --- |
| $41.000 | $20.000 | $21.000 | `parcial` |
| $21.000 | $21.000 | $0 | `completo` |

**No se puede dejar más de lo que debe.** Si Ana debe $21.000 y deja $25.000,
es un `400`: el vuelto se da en el mostrador, no se anota como saldo a favor.

---

## Los 3 endpoints

| Método | Ruta | Para qué |
| --- | --- | --- |
| `POST` | `/clientes/:id/pagos` | "Dejó $20.000": **se reparte solo** entre lo que debe |
| `POST` | `/facturas/:id/pagos` | "Esto es para la de julio": **va a esa factura** |
| `DELETE` | `/pagos/:id` | Anular un pago cargado por error (**baja lógica**) |

### ¿Cuál uso?

**Casi siempre el del cliente.** Es lo que pasa en el mostrador: el cliente deja
una plata y no dice a qué período va. El backend la aplica desde la factura más
vieja, que es lo que cualquiera espera.

El de factura es para cuando el cliente **sí** dice a cuál va, o cuando el
administrador está parado en la pantalla de una factura puntual y toca "Pagar
esta factura".

Los dos devuelven **exactamente la misma forma** de respuesta, así el front
tiene un solo manejo.

---

## El body — igual en los dos

```jsonc
{
  "monto": 20000,                  // requerido. Número > 0
  "metodoPago": "transferencia",   // opcional, default "efectivo"
  "nota": "le pagaron el aguinaldo" // opcional, hasta 300 caracteres
}
```

| Campo | Requerido | Regla |
| --- | --- | --- |
| `monto` | sí | Número mayor a 0. Se redondea a centavos |
| `metodoPago` | no | `efectivo` · `transferencia` · `mercadopago` · `otro`. Vacío = `efectivo` |
| `nota` | no | Texto libre, hasta 300 caracteres. Se le hace trim |

La fecha no se manda: es el momento en que se registra.

---

## POST /facturas/:id/pagos — pagar una factura

Todo el monto va a esa factura. Sirve para un pago **parcial** o **completo**:

- Tiene que ser una factura `abierta` o `cerrada`, con saldo.
- El monto no puede pasar su saldo.

### La respuesta — `201`

Ana debía $41.000 en su factura y deja $20.000 por transferencia:

```jsonc
{
  "entrega": {
    "_id": "6aa2de6729e48d8e2cf2a54a",
    "fecha": "2026-09-10T16:44:23.941Z",
    "monto": 20000,
    "metodoPago": "transferencia",
    "nota": "le pagaron el aguinaldo",
    "saldoAnterior": 41000,         // lo que debía antes
    "saldoPosterior": 21000,        // lo que queda
    "tipo": "parcial",              // "completo" si saldoPosterior es 0
    "cantidadFacturas": 1
  },
  "pagos": [
    {
      "_id": "6aa2de6729e48d8e2cf2a54b",
      "factura": "6aa2de6729e48d8e2cf2a53b",
      "fecha": "2026-09-10T16:44:23.941Z",
      "monto": 20000,               // lo que descontó de ESTA factura
      "metodoPago": "transferencia",
      "nota": "le pagaron el aguinaldo",
      "entrega": "6aa2de6729e48d8e2cf2a54a",
      "montoEntrega": 20000,        // lo que dejó en total esa vez
      "saldoAnterior": 41000,
      "saldoPosterior": 21000,
      "tipo": "parcial",
      "anulado": false
    }
  ],
  "facturas": [
    {
      "_id": "6aa2de6729e48d8e2cf2a53b",
      "estado": "abierta",
      "estadoVisible": "abierta",
      "totalFiado": 41000,
      "totalPagos": 20000,
      "cantidadPagos": 1,
      "ultimoPagoEl": "2026-09-10T16:44:23.941Z",
      "porcentajeCobrado": 49,
      "saldo": 21000
      // ...el resto de la factura, igual que en FACTURAS.md
    }
  ],
  "deudaTotal": 21000               // lo que debe el cliente, sumando todas sus facturas
}
```

---

## POST /clientes/:id/pagos — la entrega que se reparte

El cliente deja una plata y el backend la aplica **de la factura más vieja a la
más nueva**. Si cubre una y sobra, el resto sigue con la siguiente.

```
Ana debe:  factura N° 0001 (cerrada)   $21.000   ← la más vieja, va primero
           factura en curso (abierta)  $30.000
                                       ───────
                                       $51.000

deja $40.000
   → N° 0001:     $21.000   completo   saldo $0       → pasa a PAGADA
   → en curso:    $19.000   parcial    saldo $11.000
```

Antes de repartir, **pone la cuenta al día**: si la factura abierta ya venció,
la cierra (igual que al cargar un ticket). No acepta más que la deuda total.

### La respuesta — `201`

Misma forma que la del pago a factura. La diferencia es que `pagos` y
`facturas` traen **un elemento por cada factura que tocó la plata**:

```jsonc
{
  "entrega": {
    "_id": "6aa2de6729e48d8e2cf2a566",
    "fecha": "2026-09-10T16:44:23.997Z",
    "monto": 40000,
    "metodoPago": "efectivo",
    "saldoAnterior": 51000,         // la deuda TOTAL antes
    "saldoPosterior": 11000,        // la deuda TOTAL después
    "tipo": "parcial",
    "cantidadFacturas": 2
  },
  "pagos": [
    { "_id": "6aa2de6729e48d8e2cf2a567", "factura": "6aa2de...53b",
      "monto": 21000, "montoEntrega": 40000,
      "saldoAnterior": 21000, "saldoPosterior": 0, "tipo": "completo",
      "entrega": "6aa2de6729e48d8e2cf2a566" },
    { "_id": "6aa2de6729e48d8e2cf2a568", "factura": "6aa2de...55a",
      "monto": 19000, "montoEntrega": 40000,
      "saldoAnterior": 30000, "saldoPosterior": 11000, "tipo": "parcial",
      "entrega": "6aa2de6729e48d8e2cf2a566" }
  ],
  "facturas": [
    { "_id": "6aa2de...53b", "numero": 1, "estado": "pagada",
      "pagadaEl": "2026-09-10T16:44:24.023Z", "saldo": 0, "porcentajeCobrado": 100 },
    { "_id": "6aa2de...55a", "estado": "abierta", "saldo": 11000, "porcentajeCobrado": 63 }
  ],
  "deudaTotal": 11000
}
```

### Qué es la "entrega"

La plata que el cliente dejó **esa vez**. Como un pago descuenta siempre de
**una** factura, una entrega que alcanza para dos se guarda como **dos pagos**
con el mismo `entrega`. Así:

- Cada factura muestra exactamente cuánto le tocó (`monto`).
- Se sabe cuánto dejó en total (`montoEntrega`).
- Se puede anular la entrega entera de una vez.

### `entrega` — el comprobante

Es lo que conviene mostrar después de guardar: "Dejó $40.000 · debía $51.000 ·
queda $11.000".

| Campo | Qué es |
| --- | --- |
| `monto` | Lo que dejó |
| `saldoAnterior` | Lo que debía. En el de cliente es **la deuda total**; en el de factura, **el saldo de esa factura** |
| `saldoPosterior` | Lo que queda debiendo, con el mismo criterio |
| `tipo` | `completo` si `saldoPosterior` es 0, si no `parcial` |
| `cantidadFacturas` | En cuántas facturas se repartió |

---

## Qué le pasa a la factura

| Antes | Con el pago queda | Pasa a |
| --- | --- | --- |
| `abierta` | con saldo | `abierta` |
| `abierta` | en cero | **sigue `abierta`** — `estadoVisible: "sin deuda"` |
| `cerrada` | con saldo | `cerrada` |
| `cerrada` | en cero | **`pagada`**, con `pagadaEl` |

**La abierta no pasa a pagada aunque quede en cero:** es el período en curso y
le pueden seguir llegando tickets. Cuando vence (o se cierra a mano con
`POST /facturas/:id/cerrar`) y sigue en cero, **nace directamente `pagada`**, con
número y todo, en vez de quedar como `cerrada` con saldo cero para siempre.

> **Usá siempre las `facturas` que devuelve la respuesta**, no las que tenías
> en pantalla: traen el saldo y el estado ya recalculados. Y `deudaTotal` es el
> número que va en la ficha del cliente.

---

## La sección de pagos en la factura

`GET /facturas/:id` y `GET /clientes/:id/factura-actual` traen los pagos de esa
factura, **ordenados por fecha**, con todo lo que va en el renglón:

```jsonc
{
  "cliente": { /* ... */ },
  "factura": {
    "_id": "6aa2de6729e48d8e2cf2a53b",
    "numero": 1,
    "estado": "pagada",
    "estadoVisible": "pagada",
    "totalMercaderia": 50000,
    "totalPagadoEnTickets": 9000,
    "totalFiado": 41000,
    "totalPagos": 41000,
    "cantidadPagos": 2,                            // ← nuevo
    "ultimoPagoEl": "2026-09-10T16:44:23.997Z",    // ← nuevo
    "porcentajeCobrado": 100,                      // ← nuevo
    "saldo": 0,
    "cerradaEl": "2026-09-10T16:44:23.961Z",
    "pagadaEl": "2026-09-10T16:44:24.023Z"
  },
  "tickets": [ /* ... */ ],
  "pagos": [
    {
      "_id": "6aa2de6729e48d8e2cf2a54b",
      "fecha": "2026-09-10T16:44:23.941Z",
      "monto": 20000,
      "metodoPago": "transferencia",
      "nota": "le pagaron el aguinaldo",
      "saldoAnterior": 41000,
      "saldoPosterior": 21000,
      "tipo": "parcial",
      "entrega": "6aa2de6729e48d8e2cf2a54a",
      "montoEntrega": 20000,
      "registradoPor": { "_id": "6aa2de...533", "nombre": "Ricardo" },  // ← con nombre
      "anulado": false
    },
    {
      "_id": "6aa2de6729e48d8e2cf2a567",
      "fecha": "2026-09-10T16:44:23.997Z",
      "monto": 21000,
      "metodoPago": "efectivo",
      "saldoAnterior": 21000,
      "saldoPosterior": 0,
      "tipo": "completo",
      "entrega": "6aa2de6729e48d8e2cf2a566",
      "montoEntrega": 40000,                       // dejó 40.000, a esta le tocaron 21.000
      "registradoPor": { "_id": "6aa2de...533", "nombre": "Ricardo" },
      "anulado": false
    }
  ]
}
```

### Los campos nuevos de la factura

| Campo | Qué es |
| --- | --- |
| `cantidadPagos` | Cuántos pagos recibió. **No cuenta los anulados** |
| `ultimoPagoEl` | Fecha del último pago no anulado. `null` si no tiene ninguno |
| `porcentajeCobrado` | `totalPagos / totalFiado`, de 0 a 100. Para la barra de progreso |

`cantidadPagos` y `ultimoPagoEl` se recalculan igual que el resto de los
totales: nunca se suman a mano, así que no pueden desfasarse.

### El renglón del pago — qué mostrar

| Campo | Para qué |
| --- | --- |
| `fecha` | Cuándo lo dejó |
| `monto` | Lo que descontó de esta factura. **Es el número del renglón** |
| `metodoPago` | Efectivo, transferencia, Mercado Pago u otro |
| `tipo` | Chip `completo` / `parcial` |
| `saldoAnterior` → `saldoPosterior` | "debía $41.000 · quedó $21.000" |
| `montoEntrega` | Si es mayor que `monto`, la plata se repartió: "de una entrega de $40.000" |
| `nota` | Si hay |
| `registradoPor.nombre` | Quién lo cobró |
| `anulado`, `motivoAnulacion` | Tachado y en gris, con el motivo |

> **`saldoAnterior` y `saldoPosterior` son una foto del momento del pago.** Si
> después se le pega otro ticket a la factura abierta, el pago sigue diciendo lo
> que debía y lo que quedó **ese día** — igual que un recibo de papel. El saldo
> actual siempre está en `factura.saldo`.

**Los anulados vienen en la lista**, con `anulado: true`, pero no suman a
`totalPagos` ni a `cantidadPagos`. Igual que los tickets: se tachan, no
desaparecen.

---

## DELETE /pagos/:id — anular

**Es baja lógica.** El pago queda guardado con `anulado: true` y deja de
descontar.

```jsonc
// body opcional
{ "motivo": "eran 4000, no 40000" }
```

**Se anula la entrega entera**, no solo ese renglón. Si se tipeó $40.000 en vez
de $4.000, está mal en todas las facturas que tocó esa plata. Se puede mandar el
`_id` de cualquiera de los pagos de la entrega.

```jsonc
// 200
{
  "mensaje": "Pago anulado en 2 facturas",   // o "Pago anulado" si fue a una sola
  "pagos": [
    { "_id": "...567", "monto": 21000, "anulado": true,
      "anuladoEl": "2026-09-10T16:44:24.055Z", "motivoAnulacion": "eran 4000, no 40000" },
    { "_id": "...568", "monto": 19000, "anulado": true,
      "anuladoEl": "2026-09-10T16:44:24.055Z", "motivoAnulacion": "eran 4000, no 40000" }
  ],
  "facturas": [
    { "_id": "...53b", "estado": "cerrada", "saldo": 21000 },  // ← estaba pagada, vuelve a deber
    { "_id": "...55a", "estado": "abierta", "saldo": 30000 }
  ],
  "deudaTotal": 51000
}
```

**Una factura `pagada` gracias a ese pago vuelve a `cerrada`**, y pierde su
`pagadaEl`: vuelve a deber.

A diferencia del ticket, **el pago se puede anular aunque la factura esté
cerrada o pagada**. Un monto mal tipeado tiene que poder corregirse siempre; lo
único que no se puede es tocar una factura `anulada`.

> **No hay "desanular".** Si se anuló por error, se registra el pago de nuevo.

---

## Errores

Verificados uno por uno contra la API.

| Caso | Status | `error` |
| --- | --- | --- |
| `monto` ausente, 0, negativo o no numérico | 400 | `El monto del pago tiene que ser mayor a 0` |
| `metodoPago` que no existe | 400 | `Método de pago inválido. Los válidos son: efectivo, transferencia, mercadopago, otro` + `detalles: { metodoPago, validos }` |
| `nota` de más de 300 caracteres | 400 | `La nota puede tener hasta 300 caracteres` |
| **Cliente:** no debe nada | 400 | `Ana López no debe nada` + `detalles: { deuda: 0 }` |
| **Cliente:** deja más que la deuda total | 400 | `Está dejando más de lo que debe. La deuda es de $51000` + `detalles: { deuda, monto }` |
| **Factura:** pagada o anulada | 400 | `La factura está pagada, no recibe pagos` + `detalles: { estadoFactura }` |
| **Factura:** sin saldo | 400 | `La factura no tiene saldo pendiente` + `detalles: { saldo }` |
| **Factura:** deja más que su saldo | 400 | `Está dejando más de lo que debe esta factura. El saldo es de $21000` + `detalles: { saldo, monto }` |
| **Anular:** ya estaba anulado | 400 | `El pago ya está anulado` |
| **Anular:** la factura está anulada | 400 | `No se puede anular un pago de una factura anulada` |
| Cliente, factura o pago de otro negocio o inexistente | 404 | `Cliente no encontrado` · `Factura no encontrada` · `Pago no encontrado` |
| Id mal formado | 400 | `El valor de "_id" no es válido` |
| Sin token | 401 | `Token no proporcionado` |

**Si algo no valida, no se guarda nada.** Todo se chequea antes de tocar la base.

> **Validá en el front antes de enviar.** El formulario ya conoce la deuda: si
> el monto la pasa, avisalo en el campo, mientras escribe. El mensaje del
> backend queda como red de seguridad.

---

## El modelo `Pago`

| Campo | Qué es |
| --- | --- |
| `factura` | A qué factura se descontó |
| `cliente` · `administrador` | De quién y de qué negocio |
| `fecha` | Cuándo se registró |
| `monto` | Lo que descontó de **esta** factura |
| `metodoPago` | `efectivo` · `transferencia` · `mercadopago` · `otro` |
| `nota` | Texto libre, opcional |
| `entrega` | Agrupa los pagos que salieron de la misma plata |
| `montoEntrega` | Lo que dejó en total esa vez |
| `saldoAnterior` · `saldoPosterior` | La foto del recibo: cuánto debía la factura y cuánto quedó |
| `tipo` | **Derivado, no se guarda.** `completo` / `parcial` según `saldoPosterior` |
| `registradoPor` | Quién lo cargó |
| `anulado` · `anuladoEl` · `motivoAnulacion` | La baja lógica |

> **Los pagos cargados antes de este cambio** no tienen `entrega`, `montoEntrega`
> ni los saldos: vienen con `tipo: null`. El front tiene que aguantarlo y mostrar
> el renglón sin el chip. Anularlos funciona igual (se anula solo ese).

---

## El servicio

Va sobre el `client.ts` de [README-FRONTEND.md](README-FRONTEND.md).

```ts
// src/api/pagos.service.ts
import { request } from "./client";
import type { Factura } from "./facturas.service";   // ver FACTURAS.md

export const METODOS_PAGO = ["efectivo", "transferencia", "mercadopago", "otro"] as const;
export type MetodoPago = (typeof METODOS_PAGO)[number];

export const NOMBRE_METODO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mercadopago: "Mercado Pago",
  otro: "Otro",
};

export interface PagoNuevo {
  monto: number;
  metodoPago?: MetodoPago;
  nota?: string;
}

export interface Pago {
  _id: string;
  factura: string;
  fecha: string;
  /** Lo que descontó de esta factura. */
  monto: number;
  metodoPago: MetodoPago;
  nota?: string;
  entrega?: string;
  /** Lo que dejó en total. Mayor que `monto` = la plata se repartió. */
  montoEntrega?: number;
  saldoAnterior?: number;
  saldoPosterior?: number;
  /** null en los pagos cargados antes de que existiera el recibo. */
  tipo: "completo" | "parcial" | null;
  /** En el detalle de la factura viene con nombre; en las respuestas, como id. */
  registradoPor: string | { _id: string; nombre: string };
  anulado: boolean;
  anuladoEl?: string;
  motivoAnulacion?: string;
}

/** El comprobante de lo que dejó. */
export interface Entrega {
  _id: string;
  fecha: string;
  monto: number;
  metodoPago: MetodoPago;
  nota?: string;
  saldoAnterior: number;
  saldoPosterior: number;
  tipo: "completo" | "parcial";
  cantidadFacturas: number;
}

/** Misma forma para las dos puertas. */
export interface RespuestaPago {
  entrega: Entrega;
  pagos: Pago[];
  /** Las facturas que tocó, ya recalculadas. */
  facturas: Factura[];
  /** Lo que debe el cliente ahora, sumando todas sus facturas. */
  deudaTotal: number;
}

export interface RespuestaAnulacionPago {
  mensaje: string;
  pagos: Pago[];
  facturas: Factura[];
  deudaTotal: number;
}

export const pagosService = {
  /** "Dejó $X": se reparte desde la factura más vieja. */
  delCliente(clienteId: string, pago: PagoNuevo) {
    return request<RespuestaPago>(`/clientes/${clienteId}/pagos`, { method: "POST", body: pago });
  },

  /** Todo a una factura puntual. */
  aFactura(facturaId: string, pago: PagoNuevo) {
    return request<RespuestaPago>(`/facturas/${facturaId}/pagos`, { method: "POST", body: pago });
  },

  /** Baja lógica de la entrega entera. */
  anular(pagoId: string, motivo?: string) {
    return request<RespuestaAnulacionPago>(`/pagos/${pagoId}`, {
      method: "DELETE",
      body: motivo ? { motivo } : undefined,
    });
  },
};

/** "debía $41.000 · quedó $21.000", o nada si es un pago viejo sin recibo. */
export function textoRecibo(p: Pago, pesos: (n: number) => string): string | null {
  if (p.saldoAnterior === undefined || p.saldoPosterior === undefined) return null;
  return `debía ${pesos(p.saldoAnterior)} · quedó ${pesos(p.saldoPosterior)}`;
}

/** Si la plata de este pago se repartió entre varias facturas. */
export const fueRepartido = (p: Pago): boolean =>
  p.montoEntrega !== undefined && p.montoEntrega > p.monto;
```

### Validar antes de enviar

```ts
export function validarPago(monto: number, deuda: number): string | null {
  if (!(monto > 0)) return "Poné cuánto deja";
  if (deuda <= 0) return "No debe nada";
  if (monto > deuda) return `Debe ${pesos(deuda)}, no puede dejar más`;
  return null;
}
```

Para el pago del cliente `deuda` es la de la ficha (`GET /clientes/:id` →
`deuda`); para el de factura, `factura.saldo`.

### Guardar

```ts
async function guardar() {
  const error = validarPago(monto, deuda);
  if (error) return setErrorMonto(error);

  setGuardando(true);                        // dos toques = dos pagos
  try {
    const { entrega, facturas, deudaTotal } = facturaId
      ? await pagosService.aFactura(facturaId, { monto, metodoPago, nota })
      : await pagosService.delCliente(clienteId, { monto, metodoPago, nota });

    actualizarFacturas(facturas);            // ya vienen recalculadas
    setDeuda(deudaTotal);
    mostrarComprobante(entrega);             // "Dejó $40.000 · queda $11.000"
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    setErrorGeneral(e.message);              // ya viene redactado
  } finally {
    setGuardando(false);
  }
}
```

---

## La pantalla

### Registrar el pago

Se abre desde la ficha del cliente ("Registrar pago") o desde una factura
("Pagar esta factura"). Es el mismo formulario; lo único que cambia es a qué
endpoint va.

```
┌────────────────────────────────────────────────┐
│  Pago de Ana López                             │
│  Debe $51.000 · 2 facturas                     │
├────────────────────────────────────────────────┤
│  Deja          [     40000 ]   [ Todo ]        │
│                                                │
│  ( Efectivo ) ( Transferencia ) ( Mercado Pago )│
│  ( Otro )                                      │
│                                                │
│  Nota          [                           ]   │
├────────────────────────────────────────────────┤
│  Se aplica a                                   │
│    N° 0001  vencida       $21.000  → salda     │
│    En curso               $19.000  → queda 11.000
│  ──────────────────────────────────────────    │
│  Queda debiendo                    $11.000     │
├────────────────────────────────────────────────┤
│           [ Cancelar ]  [ Registrar pago ]     │
└────────────────────────────────────────────────┘
```

La vista previa de "Se aplica a" se arma en el front con las facturas del
cliente (`GET /clientes/:id/facturas`, las que tienen `saldo > 0`, ordenadas por
`venceEl`): es el mismo reparto que hace el backend.

### La sección de pagos en el detalle de la factura

Va **debajo de los tickets y arriba de los totales**:

```
├──────────────────────────────────────────────────────────┤
│  PAGOS                                   2 · 100% cobrado │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                                          │
│  10/09  Transferencia   ● parcial              $20.000   │
│         debía $41.000 · quedó $21.000                    │
│         "le pagaron el aguinaldo" · cobró Ricardo        │
│                                                          │
│  10/09  Efectivo        ● completo             $21.000   │
│         debía $21.000 · quedó $0                         │
│         de una entrega de $40.000 · cobró Ricardo        │
│                                                          │
│  ̶0̶9̶/̶0̶9̶  ̶E̶f̶e̶c̶t̶i̶v̶o̶                               ̶$̶4̶0̶.̶0̶0̶0̶   │
│         anulado: "eran 4000, no 40000"                   │
├──────────────────────────────────────────────────────────┤
│  Mercadería                                     $50.000  │
│  Dejó en el momento                           − $ 9.000  │
│  Pagos a cuenta                               − $41.000  │
│  ══════════════════════════════════════════════════════  │
│  SALDO                                          $     0  │
├──────────────────────────────────────────────────────────┤
│         [ Cargar ticket ]   [ Pagar esta factura ]       │
└──────────────────────────────────────────────────────────┘
```

### Checklist

**El formulario**
- [ ] Deuda a la vista arriba: la del cliente, o el saldo de la factura
- [ ] Teclado numérico en el monto, con el foco puesto ahí
- [ ] Botón "Todo" que iguala el monto a la deuda (el pago completo en un toque)
- [ ] Método como chips, con `efectivo` elegido de entrada
- [ ] Nota opcional, una línea alcanza
- [ ] Vista previa de a qué facturas va y cuánto queda debiendo
- [ ] Monto mayor a la deuda → error en el campo, sin enviar
- [ ] Si no debe nada, el botón "Registrar pago" no aparece

**Al guardar**
- [ ] Bloquear el botón mientras va el request (dos toques = dos pagos)
- [ ] Mostrar el comprobante con `entrega`: dejó, debía, queda, `completo`/`parcial`
- [ ] Actualizar la ficha con `deudaTotal` y las facturas con `facturas`
- [ ] Si alguna factura pasó a `pagada`, avisarlo ("Saldó la N° 0001")

**La sección de pagos en la factura**
- [ ] Un renglón por pago, ordenados por fecha (ya vienen así)
- [ ] Fecha, método, monto destacado, chip `completo`/`parcial`
- [ ] "debía $X · quedó $Y" con `saldoAnterior` / `saldoPosterior`
- [ ] "de una entrega de $X" si `montoEntrega > monto`
- [ ] Nota y quién lo cobró (`registradoPor.nombre`)
- [ ] Anulados tachados y en gris, con el motivo
- [ ] Pagos viejos sin recibo (`tipo: null`): el renglón sin chip ni saldos
- [ ] Cabecera con `cantidadPagos` y barra con `porcentajeCobrado`
- [ ] Estado vacío: "todavía no dejó nada este período"
- [ ] Botón "Pagar esta factura" solo si `estado` es `abierta` o `cerrada` y `saldo > 0`

**Anular**
- [ ] Confirmación con el monto a la vista
- [ ] Si `fueRepartido`, avisar que se anula la entrega entera ("se anula en 2 facturas")
- [ ] Pedir el motivo, opcional
- [ ] Actualizar facturas y deuda con la respuesta
- [ ] No hay deshacer: si se anuló por error, se registra de nuevo

---

## Decisiones y límites

**No hay saldo a favor.** Dejar más de lo que debe es un `400`. Antes el backend
lo aceptaba y la factura quedaba con saldo negativo, que después nadie sabía
cómo leer. Si en la práctica hace falta "dejar a cuenta de lo próximo", se
agrega aparte.

**Cambió el comportamiento de `POST /clientes/:id/pagos`.** Antes mandaba todo
el monto a la factura más vieja aunque le sobrara; ahora reparte. Y antes
aceptaba pagos de un cliente que no debía nada; ahora es un `400`.

**La fecha es la del registro.** No se puede cargar un pago "de ayer". Si hace
falta para pasar la libreta de papel al sistema, se agrega un `fecha` opcional.

**Sin transacciones.** La base es un MongoDB sin replica set, así que una
entrega repartida se guarda con un solo `insertMany` y después se recalculan
las facturas. Si el server se cae justo en el medio, los totales se corrigen
solos la próxima vez que se toque la factura (el recálculo sale siempre de los
pagos guardados).

**Dos cobros al mismo tiempo** sobre la misma factura podrían pasar los dos la
validación del saldo y dejarla en negativo. Con una sola persona en el
mostrador no pasa; si el negocio suma cajeros, hay que resolverlo.

---

## Probarlo por consola

```bash
TOKEN=...        # el que devuelve POST /auth/login
CLIENTE=6aa2de6729e48d8e2cf2a539
FACTURA=6aa2de6729e48d8e2cf2a53b

# parcial, a una factura puntual
curl -X POST http://localhost:4000/facturas/$FACTURA/pagos \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"monto":20000,"metodoPago":"transferencia","nota":"le pagaron el aguinaldo"}'

# "dejó 40.000": se reparte desde la factura más vieja
curl -X POST http://localhost:4000/clientes/$CLIENTE/pagos \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"monto":40000}'

# la factura con su sección de pagos
curl http://localhost:4000/facturas/$FACTURA -H "Authorization: Bearer $TOKEN"

# anular (la entrega entera)
curl -X DELETE http://localhost:4000/pagos/$PAGO \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"motivo":"eran 4000, no 40000"}'
```
