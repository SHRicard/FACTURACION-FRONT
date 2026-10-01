# FRONT-FIX: una sola factura activa por cliente

Lo que tiene que cambiar en el front después del cambio de la factura en el
backend. Todo lo de acá ya está aplicado en la API.

- **Base:** `http://localhost:4000`
- **Auth:** igual que siempre, `Authorization: Bearer <token>`
- **Errores:** igual que siempre, `{ error, detalles? }`

---

## 1. Qué cambió

**Antes** la factura era por período: cuando vencía, se cerraba sola y la
próxima compra iba a una factura nueva, aunque el cliente siguiera debiendo.

**Ahora** el cliente tiene **una sola factura activa**, y se cierra únicamente
cuando la termina de pagar:

```
Enero      Andrés saca $500.000, acuerda pagar el 10/04 ──► factura abierta
15/04      deja $300.000 (tarde) y saca algo más        ──► MISMA factura, sigue abierta
20/04      paga todo lo que debe                        ──► factura PAGADA (registro)
25/04      vuelve a comprar                             ──► recién ahora: factura NUEVA
```

| Regla | Qué significa en pantalla |
| --- | --- |
| Vencer **no cierra** la factura | Una factura vencida sigue recibiendo tickets. Se muestra "vencida", pero se le puede cargar |
| Se cierra cuando **un pago la deja en $0** | El pago que salda muestra "Factura saldada" y su cumplimiento |
| Factura nueva **solo sin deuda** | Nunca hay dos facturas con deuda del mismo cliente |
| Cada factura tiene su **% de cumplimiento** | Qué tan bien pagó: ver [sección 5](#5-el-cumplimiento) |

---

## 2. Estados de la factura

| `estado` | Antes | Ahora |
| --- | --- | --- |
| `abierta` | período en curso | **la factura activa**: recibe tickets y pagos, esté vencida o no |
| `cerrada` | venció, esperando el pago | **❌ ya no existe** |
| `pagada` | saldada | saldada: queda como registro, con número y cumplimiento |
| `anulada` | anulada | sin cambios |

`estadoVisible` (el chip) puede ser: `abierta`, `vencida`, `sin deuda`,
`pagada`, `anulada`. **Ya no aparece `cerrada`.**

**Sacar `cerrada` de:**
- [x] el filtro de estado del listado (`GET /facturas?estado=`). Los válidos ahora son `abierta | pagada | anulada`
- [x] los chips, colores y textos por estado
- [x] cualquier `if (factura.estado === "cerrada")`

---

## 3. Campos de la factura

```json
{
  "_id": "…",
  "numero": null,
  "estado": "abierta",
  "estadoVisible": "vencida",
  "desde": "2026-01-15T…",
  "venceEl": "2026-04-11T02:59:59.999Z",
  "vencimientoOriginal": "2026-04-11T02:59:59.999Z",
  "reprogramada": false,
  "pagadaEl": null,
  "totalFiado": 600000,
  "totalPagos": 300000,
  "saldo": 300000,
  "cumplimiento": 45,
  "vencida": true,
  "diasParaVencer": -157,
  "porcentajeCobrado": 50
}
```

| Campo | |
| --- | --- |
| `vencimientoOriginal` | **nuevo.** La fecha que se fijó con el primer ticket. No cambia al reprogramar |
| `reprogramada` | **nuevo.** `true` si `venceEl` se cambió después. Mostrá "Reprogramada (antes: 10/04)" |
| `cumplimiento` | **nuevo.** De 0 a 100, o `null` si no hubo nada fiado. En la abierta va cambiando con cada pago; en la pagada queda fijo |
| `cerradaEl` | **❌ eliminado.** Usá `pagadaEl` |
| `numero` | se asigna **al saldarla**. La factura activa no tiene número |

---

## 4. Pantallas y endpoints

### 4.1 Cargar un ticket: la fecha de vencimiento

`POST /clientes/:id/tickets` acepta un campo nuevo, **opcional**:

```json
{
  "items": [ … ],
  "pagado": 0,
  "venceEl": "2026-04-10"
}
```

- `venceEl` es la fecha que el administrador **acordó con el cliente** ("vuelvo el 10 de abril"), en `aaaa-mm-dd`. Vence al final de ese día.
- **Solo vale en el primer ticket de la factura.** Después se ignora (para cambiarla está [4.2](#42-reprogramar-el-vencimiento)).
- Si no se manda, sale de la ventana de pago del cliente, como antes.

**En el formulario:** pedí `GET /clientes/:id/factura-actual` y mostrá el
selector de fecha **solo si `factura.cantidadTickets === 0`**. Si ya tiene
tickets, mostrá la fecha actual como texto ("Vence el 10/04").

| Error `400` | Cuándo |
| --- | --- |
| `El vencimiento tiene que ser una fecha aaaa-mm-dd, como 2026-04-10` | formato mal, o un día que no existe (`2026-02-31`). `detalles.campo = "venceEl"` |
| `El vencimiento no puede ser un día que ya pasó` | fecha anterior a hoy |

**Cambio de comportamiento:** a una factura **vencida** se le pueden seguir
cargando tickets y **se suman a la misma**. Antes el ticket iba a una factura
nueva. Si la pantalla mostraba un aviso tipo "se abrió un nuevo período",
sacalo.

### 4.2 Reprogramar el vencimiento

**Nuevo:** `PUT /facturas/:id/vencimiento`

```json
{ "venceEl": "2026-04-30" }
```

"Te pago el 30": cambia `venceEl` y la factura deja de figurar vencida hasta
esa fecha. **El cumplimiento no cambia**: se sigue midiendo contra
`vencimientoOriginal`, así reprogramar no borra el atraso.

Responde la factura serializada, con `reprogramada: true`.

| Error `400` | Cuándo |
| --- | --- |
| `La factura está pagada: ya no se le cambia el vencimiento` | no está abierta |
| `La factura todavía no tiene compras: …` | sin tickets (la fecha se elige con el primero) |
| los de formato y fecha pasada de [4.1](#41-cargar-un-ticket-la-fecha-de-vencimiento) | |

**En la pantalla de la factura:** un botón "Cambiar fecha" cuando
`estado === "abierta"` y `cantidadTickets > 0`.

### 4.3 Cerrar la factura

| Endpoint | Antes | Ahora |
| --- | --- | --- |
| `POST /facturas/:id/cerrar` | cerraba antes de vencer | **❌ eliminado** (`404`). Sacá el botón |
| `PUT /facturas/:id/pagada` | la marcaba pagada | solo si **ya no debe nada** y tiene tickets |

No hace falta cerrar a mano: **el pago que deja la factura en $0 la cierra
solo**. `PUT /pagada` queda para un caso raro: una factura en $0 **sin pagos a
cuenta** (todo se pagó en el mostrador), que si no se cierra sigue recibiendo
las próximas compras. Mostrá "Cerrar factura" solo cuando
`estadoVisible === "sin deuda"`.

Con deuda responde `400`: `Todavía queda saldo. Registrá un pago de $… para saldarla.`

### 4.4 Registrar un pago

Los endpoints y la respuesta **no cambian de forma**. Lo que cambia:

- **Ya no se reparte** entre varias facturas: el cliente tiene una sola con deuda. `POST /clientes/:id/pagos` y `POST /facturas/:id/pagos` terminan en la misma factura, y `entrega.cantidadFacturas` es siempre `1`. Si había un texto "se repartió en N facturas", sacalo.
- **Si el pago la deja en $0**, la factura vuelve **cerrada**:

```json
{
  "entrega": { "monto": 500000, "tipo": "completo", "saldoPosterior": 0, "cantidadFacturas": 1 },
  "facturas": [
    { "_id": "…", "estado": "pagada", "numero": 1, "saldo": 0, "cumplimiento": 90, "pagadaEl": "2026-04-15T…" }
  ],
  "deudaTotal": 0
}
```

**Después del pago:** si `facturas[0].estado === "pagada"`, mostrá "Factura N°
0001 saldada · 90% de cumplimiento". La próxima compra del cliente abre una
factura nueva.

### 4.5 Anular un pago

`DELETE /pagos/:id` igual que antes. Si el pago había saldado la factura, al
anularlo **vuelve a `abierta`** (vuelve a deber). Caso nuevo de error:

| Error `400` | Cuándo |
| --- | --- |
| `No se puede: esta factura ya estaba saldada y el cliente tiene una factura nueva con compras. …` | se anula el pago de una factura pagada, pero el cliente ya compró en una factura nueva. Mostrá el mensaje tal cual |

### 4.6 La factura actual y el historial

- `GET /clientes/:id/factura-actual` devuelve **la factura activa**. Apenas se salda, devuelve una **nueva y vacía** (`cantidadTickets: 0`): la pagada ya no aparece ahí. Sirve para saber si mostrar el selector de fecha de [4.1](#41-cargar-un-ticket-la-fecha-de-vencimiento).
- Las saldadas están en el historial: `GET /clientes/:id/facturas` (sin cambios).
- `GET /facturas/vencidas` y `GET /facturas?vencidas=true`: sin cambios de forma.

### 4.7 Textos

| Antes | Ahora |
| --- | --- |
| "Período en curso" | **"Factura en curso"** (el título de la activa, que todavía no tiene número) |
| "cerrada el 10/04" | **"saldada el 20/04"** |
| "Todavía no hay compras ni pagos en este período" | "…en esta factura" |

El PDF, el mail y el mensaje de WhatsApp ya salen con los textos nuevos desde
el backend. Revisá solo los textos que arma el front.

---

## 5. El cumplimiento

Qué tan bien pagó el cliente una factura, de 0 a 100. Lo calcula el backend:

```
cada peso pagado hasta el vencimiento original  → vale 100%
cada peso pagado tarde                          → pierde 2% por día de atraso (a los 50 días, 0)
lo que todavía no pagó                          → 0

cumplimiento = Σ (pago × lo que vale) ÷ total fiado
```

| Andrés: $500.000, vence el 10/04 | cumplimiento |
| --- | --- |
| Paga todo el 10/04 | **100%** |
| Paga todo el 15/04 (5 días tarde) | **90%** |
| Deja $300.000 el 15/04 | **54%** (sube a medida que paga el resto) |

**Sugerencia de chip:** `≥ 90` verde, `60–89` ámbar, `< 60` rojo, `null` → `—`.

**Cuándo mostrarlo:** solo si `estado === "pagada"` o `vencida === true`. Una
factura abierta que todavía no venció trae `cumplimiento: 0` porque todavía no
pagó nada, pero todavía está a tiempo: ahí mostrá `—` o "a tiempo".

Dónde mostrarlo:
- [x] detalle de la factura (vencida: "va 54%"; pagada: "90%")
- [x] historial del cliente, un chip por factura
- [ ] ficha del cliente: su promedio (sale de `GET /metricas/mejores-clientes`, ver abajo)

---

## 6. Métricas

Las rutas no cambian. Cambian dos respuestas:

### `GET /metricas/pagos-a-tiempo`

Ahora se basa en el cumplimiento. El período mira el **vencimiento original**.
`resumen` y cada fila de `porMes` suman `cumplimientoPromedio`:

```json
"resumen": {
  "evaluadas": 2,
  "cumplimientoPromedio": 67.5,
  "aTiempo": 0,
  "tarde": 1,
  "impagas": 1,
  "porcentajeATiempo": 0,
  "diasPromedioDeAtraso": 5,
  "saldoImpago": 300000
}
```

- `aTiempo`: saldadas con 100%
- `tarde`: saldadas con menos de 100%
- `impagas`: vencidas que todavía deben

**En la pantalla:** el número grande pasa a ser `cumplimientoPromedio`, y
`porcentajeATiempo` va como dato secundario.

### `GET /metricas/mejores-clientes`

**El mejor cliente es el de mejor promedio de cumplimiento de todas sus facturas.**

| Query | Antes | Ahora |
| --- | --- | --- |
| `orden` | `compras` (defecto) \| `puntualidad` | **`cumplimiento` (defecto)** \| `compras` |
| `desde` / `hasta` | sin mandar = últimos 6 meses | **sin mandar = toda la historia** |

```json
{
  "periodo": null,
  "orden": "cumplimiento",
  "clientes": [
    {
      "posicion": 1,
      "cliente": { "_id": "…", "nombre": "Andrés", "dni": "20000000" },
      "cumplimiento": {
        "evaluadas": 1,
        "cumplimientoPromedio": 100,
        "aTiempo": 1, "tarde": 0, "impagas": 0,
        "porcentajeATiempo": 100, "diasPromedioDeAtraso": null, "saldoImpago": 0
      },
      "comprado": 501000,
      "tickets": 2,
      "ticketPromedio": 250500,
      "fiado": 501000,
      "porcentajeFiado": 100,
      "saldo": 1000
    }
  ]
}
```

- [x] el campo `puntualidad` se llama ahora **`cumplimiento`** y suma `cumplimientoPromedio`
- [x] `periodo` puede venir `null` (toda la historia)
- [x] `ticketPromedio` puede venir `null` (un cliente con facturas evaluadas pero sin compras en el período)
- [x] las pestañas pasan a "Mejor cumplimiento" (defecto) / "Más compran"
- [x] los que no tienen ninguna factura para juzgar (`evaluadas: 0`, `cumplimientoPromedio: null`) van al final: mostrá "sin historial"

### Las demás

Antigüedad, tasa de cobranza, deudores, inactivos, frecuencia y ventas por
especie no cambian de forma. En deudores, `facturas` y `facturasVencidas`
ahora valen como mucho `1`.

---

## 7. Checklist

- [x] Sacar el estado `cerrada` (filtros, chips, condiciones)
- [x] Sacar el botón "Cerrar factura" que llamaba a `POST /facturas/:id/cerrar`
- [x] "Cerrar factura" (`PUT /pagada`) solo con `estadoVisible === "sin deuda"`
- [x] Selector de fecha en el primer ticket (`venceEl`, solo si `cantidadTickets === 0`)
- [x] Botón "Cambiar fecha" → `PUT /facturas/:id/vencimiento`
- [x] Mostrar "Reprogramada" cuando `reprogramada: true`
- [x] Chip de cumplimiento en el detalle y en el historial
- [x] Después de un pago que salda: "Factura saldada · X% de cumplimiento"
- [x] Sacar textos de "reparto en N facturas" y de "nuevo período"
- [x] `cerradaEl` → `pagadaEl`
- [x] "Período en curso" → "Factura en curso"
- [x] Métricas: `pagos-a-tiempo` muestra `cumplimientoPromedio`
- [x] Métricas: `mejores-clientes` con `orden=cumplimiento`, campo `cumplimiento`, `periodo` nullable

> **Front (15/09/2026):** aplicado todo lo de arriba. Dos decisiones:
> - El selector de fecha del ticket no pide `GET /clientes/:id/factura-actual`: usa la
>   `facturaAbierta` que ya trae la ficha del cliente (`cantidadTickets` incluido).
> - El "historial" es el listado de Facturación (filtro Pagadas): el front no tiene
>   otra pantalla que liste las facturas de un cliente.
>
> Queda afuera el promedio en la ficha del cliente (sección 5): `mejores-clientes` es un
> ranking corto, así que un cliente fuera del top no aparece. Hace falta un endpoint por
> cliente.
