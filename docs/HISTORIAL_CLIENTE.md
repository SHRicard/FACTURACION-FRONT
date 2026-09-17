# Historial del cliente

Pedido del front al backend: un servicio nuevo, **`GET /clientes/:id/historial`**,
con toda la información de un cliente en una sola respuesta: cuánto debe, qué
compró, cuándo pagó y cómo viene pagando.

- **Base:** `http://localhost:4000`
- **Auth:** igual que siempre, `Authorization: Bearer <token>` y una marca
- **Errores:** igual que siempre, `{ error, detalles? }`

---

## 1. Para qué

En **Más → Métricas → Morosos**, tocar un cliente abría su ficha, y la ficha
solo muestra la deuda de hoy y la factura en curso. Para decidir cómo cobrarle,
o si fiarle más, hace falta ver **toda su historia con la marca**: qué se
llevó, cuándo pagó, cuánto debió en cada momento y cómo cumplió cada factura.

**El front ya tiene la pantalla hecha y ya llama a este endpoint.** Mientras no
exista, el backend responde `404 Ruta no encontrada: GET /clientes/:id/historial`
y la pantalla muestra "El historial todavía no está disponible", con un botón a
la ficha. Cuando se publique el servicio, el front no hay que tocarlo.

Se abre desde dos lugares:

- **Métricas → Morosos →** tocar un cliente
- **Ficha del cliente →** "Ver historial completo"

```
┌───────────────────────────────────────────────┐
│  Nicolás Álvarez · DNI 26912062               │
│  Debe hoy $54.000   [Moroso · 139 días]       │  ← resumen
│  Compró $102.000 · Pagó $36.000 · 45%         │
├───────────────────────────────────────────────┤
│  Facturas                                     │  ← facturas
│  Factura en curso   vencida   debe $54.000    │
│  N° 0007            pagada    90%             │
├───────────────────────────────────────────────┤
│  Movimientos   [Todo] [Compras] [Pagos]       │  ← movimientos
│  Compra  04/04   Pantalón jean      $43.000   │    (paginado)
│  Pago    23/02   Efectivo           $36.000   │
│  …                                            │
└───────────────────────────────────────────────┘
```

---

## 2. El endpoint

`GET /clientes/:id/historial`

| Query | |
| --- | --- |
| `tipo` | `todos` (por defecto) \| `compras` \| `pagos`. **Filtra solo `movimientos`**: el resumen y las facturas siguen siendo de todo |
| `pagina`, `porPagina` | la lista de `movimientos`. `pagina` desde 1, `porPagina` hasta 100. El front pide de a 20 |

Igual que en `/metricas/morosos`: `cliente`, `resumen` y `facturas` vienen
**enteros en cada página**; lo único que se pagina es `movimientos`. El front
los lee de la primera página.

---

## 3. La respuesta

Un cliente con dos facturas: la `0007`, que ya pagó, y la activa, vencida.

```json
{
  "cliente": {
    "_id": "…",
    "nombre": "Nicolás Álvarez",
    "dni": "26912062",
    "telefono": "1156094360",
    "email": "nicolas@mail.com",
    "direccion": "Av. Siempreviva 742",
    "limiteCredito": 100000,
    "ventanaPago": { "desdeDia": 1, "hastaDia": 10 },
    "createdAt": "2025-12-01T15:00:00.000Z"
  },
  "resumen": {
    "deuda": 54000,
    "moroso": true,
    "diasDeAtraso": 139,
    "totalComprado": 102000,
    "totalPagadoAlComprar": 12000,
    "totalFiado": 90000,
    "totalPagos": 36000,
    "cantidadTickets": 3,
    "cantidadPagos": 1,
    "ticketPromedio": 34000,
    "primeraCompra": "2025-12-10T18:00:00.000Z",
    "ultimaCompra": { "fecha": "2026-04-04T20:00:00.000Z", "total": 43000 },
    "ultimoPago": { "fecha": "2026-02-23T23:00:00.000Z", "monto": 36000 },
    "diasSinPagar": 203,
    "diasEntreCompras": 57.5,
    "cumplimiento": {
      "evaluadas": 2,
      "cumplimientoPromedio": 45,
      "aTiempo": 0,
      "tarde": 1,
      "impagas": 1
    }
  },
  "facturas": [
    {
      "_id": "…",
      "numero": null,
      "estado": "abierta",
      "estadoVisible": "vencida",
      "desde": "2026-03-28T19:00:00.000Z",
      "venceEl": "2026-04-30T02:59:59.999Z",
      "vencimientoOriginal": "2026-04-30T02:59:59.999Z",
      "reprogramada": false,
      "pagadaEl": null,
      "vencida": true,
      "cantidadTickets": 2,
      "totalFiado": 54000,
      "totalPagos": 0,
      "saldo": 54000,
      "cumplimiento": 0
    },
    {
      "_id": "…",
      "numero": 7,
      "estado": "pagada",
      "estadoVisible": "pagada",
      "desde": "2025-12-10T18:00:00.000Z",
      "venceEl": "2026-02-19T02:59:59.999Z",
      "vencimientoOriginal": "2026-02-19T02:59:59.999Z",
      "reprogramada": false,
      "pagadaEl": "2026-02-23T23:00:00.000Z",
      "vencida": false,
      "cantidadTickets": 1,
      "totalFiado": 36000,
      "totalPagos": 36000,
      "saldo": 0,
      "cumplimiento": 90
    }
  ],
  "movimientos": {
    "datos": [
      {
        "tipo": "compra",
        "_id": "…",
        "fecha": "2026-04-04T20:00:00.000Z",
        "factura": { "_id": "…", "numero": null },
        "items": [
          { "nombre": "Pantalón jean", "talle": "42", "especieNombre": "Pantalón", "cantidad": 1, "precioUnitario": 43000, "subtotal": 43000 }
        ],
        "total": 43000,
        "pagado": 0,
        "faltante": 43000,
        "registradoPor": { "_id": "…", "nombre": "Ana" },
        "anulado": false,
        "anuladoEl": null,
        "motivoAnulacion": null,
        "saldoPosterior": 54000
      },
      {
        "tipo": "pago",
        "_id": "…",
        "fecha": "2026-02-23T23:00:00.000Z",
        "factura": { "_id": "…", "numero": 7 },
        "monto": 36000,
        "metodoPago": "efectivo",
        "nota": "Le pagaron el aguinaldo",
        "registradoPor": { "_id": "…", "nombre": "Ana" },
        "anulado": false,
        "anuladoEl": null,
        "motivoAnulacion": null,
        "saldoPosterior": 0
      }
    ],
    "total": 4,
    "pagina": 1,
    "porPagina": 20,
    "paginas": 1
  }
}
```

### `cliente`

La misma forma que `GET /clientes/:id`, **sin** `deuda` ni `facturaAbierta`: acá
esos datos están en `resumen` y en `facturas`.

### `resumen`

Todo sobre **toda la historia** del cliente. **Los anulados no cuentan** en
ningún número.

| Campo | Qué es |
| --- | --- |
| `deuda` | lo que debe hoy: el saldo de su factura activa (lo mismo que `deuda` en `GET /clientes/:id`) |
| `moroso` | `true` si su factura activa está vencida y con saldo. Mismo criterio que `/metricas/morosos` |
| `diasDeAtraso` | días desde el `venceEl` de la activa, como en `/metricas/morosos`. `null` si no está vencida |
| `totalComprado` | suma del `total` de todos sus tickets |
| `totalPagadoAlComprar` | suma del `pagado` de sus tickets: lo que dejó en el momento |
| `totalFiado` | suma del faltante de sus tickets (`totalComprado - totalPagadoAlComprar`) |
| `totalPagos` | suma de sus pagos a cuenta |
| `cantidadTickets`, `cantidadPagos` | cuántos hay, sin anulados |
| `ticketPromedio` | `totalComprado ÷ cantidadTickets`. `null` si nunca compró |
| `primeraCompra` | fecha de su primer ticket: el "cliente desde". `null` si nunca compró |
| `ultimaCompra` | su último ticket, `{ fecha, total }`. `null` si nunca compró |
| `ultimoPago` | su último pago a cuenta, `{ fecha, monto }`. `null` si nunca pagó a cuenta |
| `diasSinPagar` | días desde `ultimoPago`. `null` si nunca pagó |
| `diasEntreCompras` | cada cuántos días vuelve, en promedio. Mismo criterio que `/metricas/frecuencia-compra` (dos tickets el mismo día son una visita). `null` con menos de dos visitas |
| `cumplimiento` | de todas sus facturas, el mismo cálculo que `cumplimiento` en `/metricas/mejores-clientes`: `evaluadas`, `cumplimientoPromedio` (`null` si no hay ninguna para juzgar), `aTiempo`, `tarde`, `impagas` |

### `facturas`

**Todas** las facturas del cliente (la activa, las pagadas y las anuladas), **la
más nueva primero**, serializadas con `serializarFactura`: la misma forma que
`factura` en `GET /facturas/:id`. El front usa estos campos:

`_id`, `numero`, `estado`, `estadoVisible`, `desde`, `venceEl`,
`vencimientoOriginal`, `reprogramada`, `pagadaEl`, `vencida`, `cantidadTickets`,
`totalFiado`, `totalPagos`, `saldo`, `cumplimiento`.

Si vienen más campos, se ignoran.

### `movimientos`

Las compras (tickets) y los pagos a cuenta del cliente, **de todas sus
facturas**, mezclados en una sola lista **del más nuevo al más viejo**.

Campos de los dos:

| Campo | Qué es |
| --- | --- |
| `tipo` | `"compra"` o `"pago"` |
| `_id` | el del ticket o el del pago |
| `fecha` | la del ticket o la del pago |
| `factura` | `{ _id, numero }` de la factura a la que se pegó. `numero: null` si es la activa |
| `registradoPor` | `{ _id, nombre }` de quien lo cargó o lo cobró (populado, como en `GET /facturas/:id`). `null` si no hay |
| `anulado`, `anuladoEl`, `motivoAnulacion` | la baja lógica. **Los anulados vienen igual**: el front los muestra tachados, con el motivo |
| `saldoPosterior` | cuánto debía el cliente **en total** justo después de este movimiento. Ver [reglas](#4-reglas). `null` en los anulados |

Solo de `"compra"`:

| Campo | Qué es |
| --- | --- |
| `items` | los renglones como están en el ticket: `nombre`, `talle`, `especieNombre`, `cantidad`, `precioUnitario`, `subtotal` |
| `total`, `pagado`, `faltante` | como en el ticket (`faltante` = `faltanteDe(ticket)`) |

Solo de `"pago"`:

| Campo | Qué es |
| --- | --- |
| `monto` | lo que descontó |
| `metodoPago` | como en el pago: `efectivo`, `transferencia`, `mercadopago`, `otro` |
| `nota` | la nota del pago, o `null` |

Y el envoltorio de siempre: `{ datos, total, pagina, porPagina, paginas }`. `total`
es cuántos movimientos hay **con el `tipo` pedido**.

---

## 4. Reglas

- **Orden:** por `fecha`, del más nuevo al más viejo. Si dos movimientos tienen
  la misma fecha, desempata el `_id`, también descendente, así una página no
  repite ni saltea renglones.
- **Anulados:** vienen en `movimientos` con `anulado: true`, pero **no suman** en
  `resumen` ni en `saldoPosterior`. Tampoco cuentan en `cantidadTickets` ni en
  `cantidadPagos`.
- **`saldoPosterior`:** se recorren los movimientos no anulados **del más viejo al
  más nuevo**, empezando en 0. Cada compra suma su `faltante` y cada pago resta
  su `monto`. El valor después de cada uno es su `saldoPosterior`. El último
  tiene que dar igual a `resumen.deuda`: sirve de control.
  > Si complica, puede venir `null` en todos: el front no lo muestra y listo.
- **Pagos viejos repartidos:** antes de la factura única, una entrega se guardaba
  como varios pagos, uno por factura, con el mismo `entrega`. Cada pago es un
  movimiento: **no hace falta juntarlos**.
- **Cliente sin nada:** un cliente recién creado responde igual, con los totales
  en 0, las fechas en `null`, `cumplimiento.evaluadas: 0` y `movimientos.datos: []`.
  Las `facturas` traen solo la que se abre sola al darlo de alta.

---

## 5. Errores

| Status | `error` | Cuándo |
| --- | --- | --- |
| `404` | `Cliente no encontrado` | el id no es válido, o el cliente es de otra marca |
| `400` | el de siempre, con `detalles.campo = "tipo"` y `detalles.validos` | `tipo` que no es `todos`, `compras` ni `pagos` |
| `400` | el de siempre de `leerPaginacion` | `pagina` o `porPagina` fuera de rango |

> ⚠️ El front distingue los dos 404 **por el mensaje**: `Ruta no encontrada: …`
> quiere decir que el servicio todavía no existe, y `Cliente no encontrado`, que
> el cliente no existe. Mantengan ese texto.

---

## 6. Cómo armarlo con lo que ya hay

Es una sugerencia, no una obligación:

- **`facturas`:** `Factura.find({ cliente, marca }).sort({ desde: -1 })` y
  `serializarFactura` a cada una.
- **Tickets y pagos:** `Ticket.find({ cliente, marca })` y
  `Pago.find({ cliente, marca })`, con `registradoPor` populado con `nombre`.
  `Pago` ya tiene índice `{ cliente: 1, fecha: -1 }`. Si `Ticket` no tiene uno por
  cliente, conviene sumar `{ cliente: 1, fecha: -1 }`.
- **Paginar la mezcla:** un cliente tiene cientos de movimientos, no miles. Alcanza
  con traer los dos, mezclarlos en memoria, calcular `saldoPosterior` en orden
  cronológico, filtrar por `tipo` y cortar la página. Si algún día pesa,
  `$unionWith` en un aggregate.
- **`cumplimiento`:** lo mismo que calcula `mejoresClientes`, filtrado a este cliente.
- **`diasEntreCompras`:** lo mismo que calcula `frecuenciaCompra` para un cliente.

---

## 7. Cómo verificarlo

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/clientes/<id>/historial?tipo=todos&porPagina=20"
```

1. Un cliente con compras y pagos: `resumen.deuda` es igual al `saldoPosterior`
   del movimiento más nuevo no anulado.
2. `?tipo=pagos`: `movimientos` trae solo pagos, y `resumen` y `facturas` no
   cambian.
3. Un cliente de otra marca: `404 Cliente no encontrado`.
4. En la app: **Métricas → Morosos →** tocar un cliente. Tiene que abrir el
   historial en vez del cartel de "todavía no está disponible".

---

## 8. Checklist (backend)

- [ ] `GET /clientes/:id/historial`, con `requireAuth` y `requireMarca`
- [ ] `cliente`, `resumen` y `facturas` enteros en cada página
- [ ] `movimientos` paginado, del más nuevo al más viejo, con desempate por `_id`
- [ ] `tipo` = `todos` \| `compras` \| `pagos`, con `400` si no
- [ ] Anulados incluidos en `movimientos` y sin sumar en ningún número
- [ ] `saldoPosterior` (o `null` en todos si complica)
- [ ] `registradoPor` con `nombre` (o `null`)
- [ ] `404 Cliente no encontrado` para un id ajeno o inválido
- [ ] Probado con un cliente sin compras
