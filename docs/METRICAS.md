# Métricas

Los números del negocio, para la sección **Más → Métricas**. Hay **una ruta por
métrica**, y cada una es una pantalla distinta.

```
Más
 └─ Métricas
     ├─ 1. Morosos              GET /metricas/morosos
     └─ 2. Ventas por especie   GET /metricas/ventas-por-especie
                                GET /metricas/ventas-por-especie/:especie   (detalle)
```

Las demás métricas se van sumando a esta guía a medida que se ajustan.

- **Base:** `http://localhost:4000`
- **Auth:** pide `Authorization: Bearer <token>` y una marca (igual que el resto del negocio)
- **Errores:** siempre `{ error, detalles? }`. Un parámetro mal escrito es un `400`
  con `detalles.campo` (y `detalles.validos` si es una lista cerrada).

---

## Lo que tienen en común

### Se calculan al pedirlas

No hay nada guardado ni que refrescar: cada pedido cuenta desde los tickets,
las facturas y los pagos de ese momento. Los **anulados no cuentan** nunca.

### El período: `desde` y `hasta`

`aaaa-mm-dd`, **los dos días incluidos**, en hora de Argentina.

| Sin mandar nada | El mes en curso y los 5 anteriores (hoy 15/09 → `2026-04-01` a `2026-09-15`) |
| --- | --- |
| Tope | 36 meses |
| Se devuelve | `periodo: { desde, hasta }`, para mostrar qué se está mirando |

Un selector simple alcanza: "Este mes", "Últimos 3 meses", "Últimos 6 meses",
"Este año". El front calcula las dos fechas.

### Paginación

Las listas vienen como los listados de clientes y facturas:

```json
{ "datos": [ ... ], "total": 42, "pagina": 1, "porPagina": 20, "paginas": 3 }
```

`pagina` desde 1, `porPagina` hasta 100.

### Porcentajes

Con un decimal (`41.7`). **`null` cuando no hay base** para calcularlo:
mostrá `—`, no `0%`.

### El cliente de cada renglón

```json
{ "_id": "…", "nombre": "Nicolás Álvarez", "dni": "26912062", "telefono": "1156094360" }
```

Con el `_id` se navega a su ficha (`GET /clientes/:id`).

---

## 1. Morosos

**Para qué:** ver si la morosidad crece o baja, y tener a mano a quién hay que
ir a cobrar.

**Moroso = cliente con su factura vencida y todavía con deuda.** Como cada
cliente tiene una sola factura activa, un moroso es una factura: la activa,
con `venceEl` pasado y `saldo > 0`. Toda su deuda está vencida, también lo que
se llevó después del vencimiento.

La pantalla tiene dos partes, y **las dos vienen en la misma respuesta**:

```
┌───────────────────────────────────────────────┐
│  5 morosos · $477.000 vencidos · 41,7% de los  │  ← resumen
│  clientes · +4 en el período                   │
├───────────────────────────────────────────────┤
│  ▁▁▁▃▂▂▂▅   cómo fueron cambiando              │  ← evolucion
│  abr may jun jul ago sep                       │
├───────────────────────────────────────────────┤
│  1  Nicolás Álvarez   $54.000   139 días       │  ← morosos
│  2  Joaquín Díaz      $112.000   99 días       │    (la lista de hoy)
│  …                                             │
└───────────────────────────────────────────────┘
```

### El endpoint

`GET /metricas/morosos`

| Query | |
| --- | --- |
| `desde`, `hasta` | el período de la evolución (ver [arriba](#el-período-desde-y-hasta)) |
| `agrupar` | `mes` (por defecto) o `semana`: un punto del gráfico por mes o por semana (de lunes a domingo) |
| `orden` | la lista: `atraso` (por defecto, el más atrasado primero) o `saldo` (el que más debe primero) |
| `buscar` | texto en el nombre o el DNI. **Filtra solo la lista**: el resumen y la evolución siguen siendo de toda la marca |
| `pagina`, `porPagina` | la lista |

### La respuesta

```json
{
  "periodo": { "desde": "2026-04-01", "hasta": "2026-09-15" },
  "agrupar": "mes",
  "resumen": {
    "morosos": 5,
    "clientes": 12,
    "porcentajeDeClientes": 41.7,
    "montoVencido": 477000,
    "diasPromedioDeAtraso": 71.2,
    "alInicioDelPeriodo": 1,
    "variacionEnElPeriodo": 4
  },
  "evolucion": [
    { "etiqueta": "2026-04", "desde": "2026-04-01", "hasta": "2026-04-30", "morosos": 2, "nuevos": 2, "recuperados": 1, "montoVencido": 189500 },
    { "etiqueta": "2026-05", "desde": "2026-05-01", "hasta": "2026-05-31", "morosos": 1, "nuevos": 0, "recuperados": 1, "montoVencido": 54000 },
    { "etiqueta": "2026-06", "desde": "2026-06-01", "hasta": "2026-06-30", "morosos": 4, "nuevos": 3, "recuperados": 0, "montoVencido": 424500 },
    { "etiqueta": "2026-07", "desde": "2026-07-01", "hasta": "2026-07-31", "morosos": 3, "nuevos": 0, "recuperados": 1, "montoVencido": 275500 },
    { "etiqueta": "2026-08", "desde": "2026-08-01", "hasta": "2026-08-31", "morosos": 3, "nuevos": 0, "recuperados": 0, "montoVencido": 275500 },
    { "etiqueta": "2026-09", "desde": "2026-09-01", "hasta": "2026-09-15", "morosos": 5, "nuevos": 2, "recuperados": 0, "montoVencido": 477000 }
  ],
  "morosos": {
    "datos": [
      {
        "posicion": 1,
        "factura": "6aa96b63cecfb299041ad73d",
        "cliente": { "_id": "…", "nombre": "Nicolás Álvarez", "dni": "26912062", "telefono": "1156094360" },
        "saldo": 54000,
        "totalFiado": 54000,
        "totalPagos": 0,
        "cumplimiento": 0,
        "venceEl": "2026-04-30T02:59:59.999Z",
        "vencimientoOriginal": "2026-04-30T02:59:59.999Z",
        "reprogramada": false,
        "diasDeAtraso": 139,
        "ultimaCompra": { "fecha": "2026-04-04T20:00:00.000Z", "total": 43000 },
        "ultimoPago": { "fecha": "2026-02-23T23:00:00.000Z", "monto": 36000 },
        "diasSinPagar": 203
      }
    ],
    "total": 5, "pagina": 1, "porPagina": 20, "paginas": 1
  }
}
```

### `resumen`

| Campo | Qué es |
| --- | --- |
| `morosos` | cuántos morosos hay **hoy** |
| `clientes` | cuántos clientes tiene la marca |
| `porcentajeDeClientes` | `morosos ÷ clientes`: "el 41,7% de tus clientes está atrasado" |
| `montoVencido` | cuánta plata está vencida, sumando a todos |
| `diasPromedioDeAtraso` | cuánto hace, en promedio, que vencieron. `null` si no hay morosos |
| `alInicioDelPeriodo` | cuántos morosos había justo antes de `desde` |
| `variacionEnElPeriodo` | cuántos hay al final del período menos cuántos había al empezar. `+4` = hay 4 morosos más que al principio |

### `evolucion`

Un punto por mes (o por semana) del período, en orden. Cada punto es **la foto
al final de ese tramo**: cuántos morosos había ese último día. El tramo en
curso se corta en el momento de la consulta.

| Campo | Qué es |
| --- | --- |
| `etiqueta` | `"2026-04"` por mes; por semana, el lunes: `"2026-08-31"` |
| `desde`, `hasta` | los días que cubre. El primero y el último pueden quedar cortados por el período (una semana que empieza el lunes 30/03 arranca el 01/04 si el período arranca ahí) |
| `morosos` | cuántos morosos había al final del tramo |
| `nuevos` | los que **entraron** en este tramo: no eran morosos al final del anterior y ahora sí |
| `recuperados` | los que **salieron**: eran morosos al final del anterior y ahora no (pagaron, o se les reprogramó la fecha) |
| `montoVencido` | cuánta plata estaba vencida al final del tramo |

`morosos` de un punto = `morosos` del anterior + `nuevos` − `recuperados`. El
primer punto se compara contra `resumen.alInicioDelPeriodo`.

**Cómo se calcula:** para cada fecha de corte se reconstruye la deuda de cada
factura con sus tickets y pagos hasta ese día, y se mira si ya estaba vencida.
Por eso la evolución **incluye a los que fueron morosos y después pagaron**:
en la lista de hoy ya no aparecen, pero en el gráfico sí.

**Facturas reprogramadas:** antes de reprogramarla vale la fecha original, y
después la nueva. Si a un cliente se le dio una fecha nueva, deja de ser
moroso ese día y cuenta como `recuperado`. Si se reprogramó más de una vez, de
las fechas del medio no queda registro: vale la original hasta la última
reprogramación.

### `morosos` (la lista de hoy)

| Campo | Qué es |
| --- | --- |
| `posicion` | lugar en la lista, según `orden` |
| `factura` | `_id` de su factura activa: tocar el renglón puede abrir `GET /facturas/:id` |
| `saldo` | lo que debe. Todo está vencido |
| `totalFiado`, `totalPagos` | cuánto se llevó fiado en esta factura y cuánto ya pagó a cuenta |
| `cumplimiento` | el % de cumplimiento de la factura hasta hoy (ver FRONT-FIX.md) |
| `venceEl` | la fecha que venció |
| `vencimientoOriginal`, `reprogramada` | si se le cambió la fecha, la primera que se había acordado |
| `diasDeAtraso` | días desde `venceEl`. Vencida hace unas horas ya cuenta 1 |
| `ultimaCompra` | su último ticket, `{ fecha, total }`. Si es reciente, **sigue comprando con la cuenta vencida** |
| `ultimoPago` | su último pago a cuenta, `{ fecha, monto }`, de cualquier factura. `null` si nunca pagó a cuenta |
| `diasSinPagar` | días desde `ultimoPago`. `null` si nunca pagó |

Con `ultimaCompra` y `ultimoPago` se distinguen tres casos distintos:

| Caso | Cómo se ve | Ejemplo |
| --- | --- | --- |
| Desapareció | compra y pago viejos | Nicolás: no compra desde abril, no paga hace 203 días |
| Sigue comprando y paga de a poco | compra y pago recientes | Joaquín: compró hace 10 días, pagó hace 3 |
| Sigue comprando y no paga | compra reciente, pago viejo o `null` | — |

### La pantalla

**Arriba, el resumen:** el número grande es `resumen.morosos`, con
`montoVencido` y `porcentajeDeClientes` al lado. La variación como flecha:
`variacionEnElPeriodo > 0` en rojo ("+4 en el período"), `< 0` en verde.

**En el medio, el gráfico:** barras o línea con `evolucion[].morosos`, una por
`etiqueta`. Al tocar un punto: "Junio: 4 morosos · entraron 3 · salieron 0 ·
$424.500 vencidos". Un selector Mes / Semana cambia `agrupar`, y el selector
de período, `desde` y `hasta`.

**Abajo, la lista:** buscador, selector de orden (Más atrasados / Más deben) y
un renglón por moroso:

```
Nicolás Álvarez                        $54.000
139 días de atraso · no paga hace 203 días
Última compra 04/04                  [WhatsApp]
```

- chip con los días de atraso: hasta 30 ámbar, más de 30 rojo
- si `reprogramada`: "Reprogramada (antes: 01/09)"
- el botón de WhatsApp usa `cliente.telefono`, igual que en la ficha del cliente
- tocar el renglón abre la ficha del cliente o su factura (`factura`)

### Checklist

- [x] Entrada **Más → Métricas → Morosos**
- [x] Resumen: morosos, monto vencido, % de clientes, variación con color
- [x] Gráfico con `evolucion`, selector Mes / Semana y selector de período
- [x] Detalle del punto: morosos, nuevos, recuperados, monto
- [x] Lista paginada con buscador y orden (`atraso` / `saldo`)
- [x] Renglón: saldo, días de atraso, última compra, último pago, WhatsApp
- [x] `null` en `ultimoPago`, `diasSinPagar` o `diasPromedioDeAtraso` → "nunca" / `—`

> **Front (15/09/2026):** tocar el renglón abre el **historial del cliente**, que
> todavía falta en el backend: ver [HISTORIAL_CLIENTE.md](HISTORIAL_CLIENTE.md). El
> WhatsApp abre el chat vacío (sin mensaje escrito) y solo aparece si
> `cliente.telefono` se entiende como celular: se normaliza igual que
> `utils/whatsapp.ts` del backend.

---

## 2. Ventas por especie

**Para qué:** saber cuánto se vende de qué.

La especie es la etiqueta que agrupa lo que se escribe a mano en cada ticket
("pantalón de jean", "pantalon cargo"). Esta métrica suma todo lo de cada
especie en el período: **unidades y plata**. Cuenta todo lo que se llevaron,
se haya pagado o fiado. Sin tickets anulados.

Son dos pantallas:

```
Ventas por especie                        Media · detalle
┌──────────────────────────────┐          ┌──────────────────────────────┐
│ 199 unidades · $4.188.000    │          │ 35 unidades · $737.000       │
│ La más vendida: Media        │   tocar  │ 17,6% de todo lo vendido     │
├──────────────────────────────┤  ─────►  ├──────────────────────────────┤
│ 1 Media      35 u  $737.000  │          │ ▃▂█▂▄▁  mes a mes            │
│ 2 Buzo       28 u  $579.000  │          ├──────────────────────────────┤
│ 3 Camisa     22 u  $504.000  │          │ Talles: 1 · 9M · 6M · 8 …    │
│ …                            │          │ Artículos: Media estampado … │
└──────────────────────────────┘          └──────────────────────────────┘
```

### 2.1 El ranking

`GET /metricas/ventas-por-especie`

| Query | |
| --- | --- |
| `desde`, `hasta` | el período (ver [arriba](#el-período-desde-y-hasta)) |
| `orden` | `unidades` (por defecto: la que más cantidad vendió) o `monto` (la que más plata hizo) |

```json
{
  "periodo": { "desde": "2026-04-01", "hasta": "2026-09-15" },
  "orden": "unidades",
  "resumen": {
    "unidades": 199,
    "monto": 4188000,
    "especies": 10,
    "masVendida": { "_id": "…", "nombre": "Media", "unidades": 35, "monto": 737000 }
  },
  "especies": [
    { "posicion": 1, "especie": { "_id": "…", "nombre": "Media" },  "unidades": 35, "monto": 737000, "porcentajeUnidades": 17.6, "porcentajeMonto": 17.6 },
    { "posicion": 2, "especie": { "_id": "…", "nombre": "Buzo" },   "unidades": 28, "monto": 579000, "porcentajeUnidades": 14.1, "porcentajeMonto": 13.8 },
    { "posicion": 3, "especie": { "_id": "…", "nombre": "Camisa" }, "unidades": 22, "monto": 504000, "porcentajeUnidades": 11.1, "porcentajeMonto": 12 }
  ]
}
```

| Campo | Qué es |
| --- | --- |
| `resumen.unidades`, `resumen.monto` | todo lo vendido en el período |
| `resumen.especies` | cuántas especies tuvieron ventas |
| `resumen.masVendida` | la primera del ranking, según `orden`. `null` si no hubo ventas |
| `especies[].unidades` | cuántas prendas de esa especie se vendieron |
| `especies[].monto` | cuánta plata sumaron |
| `especies[].porcentajeUnidades` | qué parte de todas las unidades vendidas es de esta especie |
| `especies[].porcentajeMonto` | qué parte de toda la plata |

Solo aparecen las especies **que vendieron algo** en el período. El nombre es
el de hoy: si una especie se renombró, sus ventas viejas salen con el nombre
nuevo.

### 2.2 El detalle de una especie

`GET /metricas/ventas-por-especie/:especie`, con el `especie._id` del ranking y
el mismo `desde` / `hasta`.

```json
{
  "periodo": { "desde": "2026-04-01", "hasta": "2026-09-15" },
  "especie": { "_id": "…", "nombre": "Media" },
  "resumen": {
    "unidades": 35,
    "monto": 737000,
    "tickets": 24,
    "porcentajeUnidades": 17.6,
    "porcentajeMonto": 17.6
  },
  "porMes": [
    { "mes": "2026-04", "unidades": 5,  "monto": 123000 },
    { "mes": "2026-05", "unidades": 4,  "monto": 71000 },
    { "mes": "2026-06", "unidades": 13, "monto": 231000 },
    { "mes": "2026-07", "unidades": 4,  "monto": 101000 },
    { "mes": "2026-08", "unidades": 7,  "monto": 169000 },
    { "mes": "2026-09", "unidades": 2,  "monto": 42000 }
  ],
  "talles": [
    { "talle": "1",  "unidades": 6, "monto": 109000, "porcentaje": 17.1 },
    { "talle": "9M", "unidades": 5, "monto": 97000,  "porcentaje": 14.3 }
  ],
  "articulos": [
    { "nombre": "Media estampado",   "unidades": 8, "monto": 153000, "porcentaje": 22.9 },
    { "nombre": "Media con volados", "unidades": 5, "monto": 119000, "porcentaje": 14.3 }
  ]
}
```

| Campo | Qué es |
| --- | --- |
| `resumen.tickets` | en cuántos tickets apareció |
| `resumen.porcentajeUnidades` / `porcentajeMonto` | qué parte de **todo** lo vendido en el período es de esta especie |
| `porMes` | unidades y plata de cada mes del período. Vienen **todos** los meses, también los que no vendió (en 0) |
| `talles` | cuánto se vendió de cada talle, del que más al que menos. `talle: null` = los renglones que se cargaron sin talle. `"m"` y `"M"` cuentan como el mismo |
| `articulos` | cuánto se vendió de cada artículo, como se escribió en el ticket. `"Media estampado"` y `"media estampado "` cuentan como el mismo. Hasta 50 |
| `talles[].porcentaje`, `articulos[].porcentaje` | qué parte de las unidades **de esta especie** |

Si la especie no es de la marca o el id está mal: `404` `Especie no encontrada`.

**Ojo con los artículos:** se agrupan por lo que se escribió a mano. Si una
vez se escribió "Media rayada" y otra "Media a rayas", salen como dos
artículos distintos. Para eso está la especie, que es la que siempre suma bien.

### La pantalla

**Ranking:** el total del período arriba ("199 unidades · $4.188.000") y la
más vendida. Abajo, una barra horizontal por especie con sus unidades y su
plata. Un selector **Cantidad / Plata** cambia `orden`, y el selector de
período, `desde` y `hasta`.

**Detalle** (al tocar una especie):
- arriba, las unidades, la plata y qué parte del total es ("17,6% de todo lo vendido")
- un gráfico de barras con `porMes`
- **Talles:** una lista o barras con los que más salen: sirve para saber qué reponer
- **Artículos:** la lista de lo que más se vende dentro de la especie

### Checklist

- [x] Entrada **Más → Métricas → Ventas por especie**
- [x] Ranking con total, más vendida y barras por especie
- [x] Selector Cantidad / Plata (`orden`) y selector de período
- [x] Tocar una especie abre el detalle con el mismo período
- [x] Detalle: resumen, gráfico mes a mes, talles y artículos
- [x] `talle: null` → "Sin talle"; `masVendida: null` → "Sin ventas en el período"

> **Front (15/09/2026):** las ventas de ítems viejos cargados sin especie (`_id: null`)
> se muestran como "Sin especie" y no abren detalle.
