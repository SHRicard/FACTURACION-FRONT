# Dashboard y métricas

Los números del negocio: el **Inicio** (§4), que es lo primero que se ve al
entrar, y la sección **Más → Métricas**, con **una ruta por métrica** y una
pantalla distinta para cada una.

```
Más
 └─ Métricas
     ├─ 1. Morosos              GET /metricas/morosos
     ├─ 2. Ventas por especie   GET /metricas/ventas-por-especie
     │                          GET /metricas/ventas-por-especie/:especie   (detalle)
     └─ 3. Deudores             GET /metricas/deudores

Inicio (el dashboard)          GET /metricas/resumen        ← ver §4
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

- [ ] Entrada **Más → Métricas → Morosos**
- [ ] Resumen: morosos, monto vencido, % de clientes, variación con color
- [ ] Gráfico con `evolucion`, selector Mes / Semana y selector de período
- [ ] Detalle del punto: morosos, nuevos, recuperados, monto
- [ ] Lista paginada con buscador y orden (`atraso` / `saldo`)
- [ ] Renglón: saldo, días de atraso, última compra, último pago, WhatsApp
- [ ] `null` en `ultimoPago`, `diasSinPagar` o `diasPromedioDeAtraso` → "nunca" / `—`

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

- [ ] Entrada **Más → Métricas → Ventas por especie**
- [ ] Ranking con total, más vendida y barras por especie
- [ ] Selector Cantidad / Plata (`orden`) y selector de período
- [ ] Tocar una especie abre el detalle con el mismo período
- [ ] Detalle: resumen, gráfico mes a mes, talles y artículos
- [ ] `talle: null` → "Sin talle"; `masVendida: null` → "Sin ventas en el período"

---

## 3. Deudores

**Para qué:** cuánta plata hay en la calle, y si está creciendo o bajando.

**Deudor = cliente con saldo, esté vencido o no. Moroso = el deudor cuya
factura ya venció.** Son dos preguntas distintas: un negocio puede tener cero
morosos y aun así estar fiando cada vez más. Eso no se ve en
[Morosos](#1-morosos), se ve acá. En cualquier corte, los deudores son siempre
tantos o más que los morosos.

```
┌───────────────────────────────────────────────┐
│  $968.000 en la calle                         │  ← resumen
│  12 de tus 12 clientes deben                  │
│  ↑ la libreta creció $401.500 en el período   │
│  Vencido $477.000 (5 morosos) · resto al día  │
├───────────────────────────────────────────────┤
│  ▃▂▅▁▄▆  cómo fue cambiando                   │  ← evolucion
│  abr may jun jul ago sep                      │
├───────────────────────────────────────────────┤
│  1  Tomás Castro     $170.000  [sin vencer]   │  ← datos
│  2  Camila Torres    $141.500  [93 días]      │    (la lista de hoy)
└───────────────────────────────────────────────┘
```

Tocar un renglón abre el historial del cliente (ver `doc/HISTORIAL_CLIENTE.md`).

### El endpoint

`GET /metricas/deudores`

| Query | |
| --- | --- |
| `desde`, `hasta` | el período de la evolución (ver [arriba](#el-período-desde-y-hasta)) |
| `agrupar` | `mes` (por defecto) o `semana`, igual que en morosos |
| `orden` | la lista: `saldo` (por defecto, el que más debe) o `atraso` (el más atrasado) |
| `buscar` | texto en el nombre o el DNI, sin importar tildes ni mayúsculas ("alvarez" encuentra "Álvarez"). **Filtra solo la lista** |
| `pagina`, `porPagina` | la lista |

### La respuesta

```json
{
  "periodo": { "desde": "2026-04-01", "hasta": "2026-09-16" },
  "agrupar": "mes",
  "resumen": {
    "deudores": 12,
    "morosos": 5,
    "deudaTotal": 968000,
    "deudaVencida": 477000,
    "porcentajeVencida": 49.3,
    "clientes": 12,
    "porcentajeDeClientes": 100,
    "deudoresAlInicioDelPeriodo": 7,
    "variacionDeDeudores": 5,
    "deudaAlInicioDelPeriodo": 566500,
    "variacionDeDeuda": 401500
  },
  "evolucion": [
    { "etiqueta": "2026-04", "desde": "2026-04-01", "hasta": "2026-04-30", "deudores": 9,  "nuevos": 2, "saldaron": 0, "deudaTotal": 583000, "deudaVencida": 189500 },
    { "etiqueta": "2026-05", "desde": "2026-05-01", "hasta": "2026-05-31", "deudores": 8,  "nuevos": 1, "saldaron": 2, "deudaTotal": 430000, "deudaVencida": 54000 },
    { "etiqueta": "2026-09", "desde": "2026-09-01", "hasta": "2026-09-16", "deudores": 12, "nuevos": 3, "saldaron": 0, "deudaTotal": 968000, "deudaVencida": 477000 }
  ],
  "datos": [
    {
      "posicion": 1,
      "cliente": { "_id": "…", "nombre": "Tomás Castro", "dni": "26506255", "telefono": "1168260210" },
      "saldo": 170000,
      "saldoVencido": 0,
      "facturas": 1,
      "facturasVencidas": 0,
      "vencimientoMasViejo": null,
      "diasDeAtraso": 0,
      "moroso": false,
      "ultimaCompra": { "fecha": "2026-09-10T16:00:00.000Z", "total": 104000 },
      "ultimoPago": null,
      "diasSinPagar": null
    }
  ],
  "total": 12,
  "pagina": 1,
  "porPagina": 20,
  "paginas": 1
}
```

La lista y el paginado van **en la raíz** (`datos`, `total`, `pagina`,
`porPagina`, `paginas`), no adentro de un objeto como en morosos.

### `resumen`

| Campo | Qué es |
| --- | --- |
| `deudores` | cuántos clientes deben algo hoy |
| `morosos` | de esos, cuántos tienen la factura vencida |
| `deudaTotal` | toda la plata en la calle |
| `deudaVencida` | de esa plata, cuánta está vencida. Lo que falta para `deudaTotal` todavía no venció |
| `porcentajeVencida` | qué parte de la deuda está vencida. `null` si no se debe nada |
| `clientes` | cuántos clientes tiene la marca. Es el "de tus 12 clientes" |
| `porcentajeDeClientes` | `deudores ÷ clientes` |
| `deudoresAlInicioDelPeriodo` | cuántos debían justo antes de `desde` |
| `variacionDeDeudores` | los del final del período menos los del principio |
| `deudaAlInicioDelPeriodo` | cuánta plata había en la calle justo antes de `desde` |
| `variacionDeDeuda` | **el número que dice si la libreta crece o se achica.** Positivo: se fió más de lo que se cobró |

### `evolucion`

Un punto por mes (o por semana), en orden. Cada punto es la foto al final de
ese tramo; el tramo en curso se corta en el momento de la consulta. Mismos
`etiqueta`, `desde` y `hasta` que en morosos.

| Campo | Qué es |
| --- | --- |
| `deudores` | cuántos clientes debían algo al final del tramo |
| `nuevos` | los que **empezaron** a deber en este tramo |
| `saldaron` | los que **terminaron** de pagar: debían al final del anterior y ya no |
| `deudaTotal` | cuánta plata había en la calle al final del tramo |
| `deudaVencida` | de esa plata, cuánta ya estaba vencida (es el `montoVencido` de morosos) |

`deudores` de un punto = `deudores` del anterior + `nuevos` − `saldaron`. El
primero se compara contra `resumen.deudoresAlInicioDelPeriodo`.

**Cómo se calcula:** igual que en morosos, se reconstruye la deuda de cada
factura con sus tickets y pagos hasta cada fecha de corte. La diferencia es que
acá el cliente entra apenas debe; el vencimiento solo se mira para separar
`deudaVencida`, con el mismo criterio de fecha reprogramada.

### `datos` (la lista de hoy)

| Campo | Qué es |
| --- | --- |
| `posicion` | lugar en la lista, según `orden` |
| `saldo` | lo que debe |
| `saldoVencido` | de eso, cuánto está vencido. `0` si todavía no venció |
| `facturas`, `facturasVencidas` | con una sola factura activa por cliente, valen como mucho `1` |
| `vencimientoMasViejo` | la fecha vencida más vieja que sigue impaga. `null` si no tiene ninguna |
| `diasDeAtraso` | días desde `vencimientoMasViejo`. `0` si no está vencido |
| `moroso` | `true` si tiene algo vencido |
| `ultimaCompra` | su último ticket, `{ fecha, total }`. `null` si nunca compró |
| `ultimoPago` | su último pago a cuenta, `{ fecha, monto }`. `null` si nunca pagó a cuenta |
| `diasSinPagar` | días desde `ultimoPago`. `null` si nunca pagó |

### La pantalla

**Arriba:** `deudaTotal` en grande, con `porcentajeDeClientes` ("12 de tus 12
clientes deben") y `variacionDeDeuda` como flecha: positivo en rojo ("la
libreta creció $401.500"), negativo en verde. Al lado, `deudaVencida` con
`morosos`, que linkea a la pantalla de morosos.

**En el medio:** línea o barras con `evolucion[].deudaTotal`, y la parte
vencida en otro color. Al tocar un punto: "Mayo: 8 deudores · 1 nuevo · 2
saldaron · $430.000 en la calle".

**Abajo:** la lista, con buscador y selector de orden (Más deben / Más
atrasados). Chip rojo con los días a los morosos, y "sin vencer" al resto.

### Checklist

- [ ] Entrada **Más → Métricas → Deudores**
- [ ] Resumen: deuda total, % de clientes, variación con color, vencido con link a morosos
- [ ] Gráfico con `evolucion`, selector Mes / Semana y selector de período
- [ ] Lista paginada con buscador y orden (`saldo` / `atraso`)
- [ ] Renglón: saldo, vencido o no, última compra, último pago
- [ ] Tocar un renglón abre el historial del cliente
- [ ] `null` en `porcentajeVencida`, `ultimoPago` o `diasSinPagar` → `—` / "nunca"

---

## 4. Resumen del dashboard

**Para qué:** lo que ve el administrador al entrar. Responde tres preguntas:
**a quién le cobro**, **cómo viene el mes** y **qué pasó último**.

`GET /metricas/resumen`

Viene **todo junto a propósito**: es la primera pantalla que se abre, y seis
llamadas separadas la harían tardar seis veces más.

> **Por qué no hay tarjeta de "hoy".** Este negocio hace unos pocos tickets por
> semana (13 en el último mes). Una tarjeta "ventas de hoy" mostraría `$0` casi
> todos los días y parecería rota. La ventana corta es **la semana** y la
> comparación es **mensual**.

| Query | Por defecto | |
| --- | --- | --- |
| `dias` | `7` | la ventana corta ("la semana"), de 1 a 90 |
| `venceEnDias` | `7` | con cuánta anticipación avisar lo que vence, de 1 a 90 |
| `diasInactivo` | `60` | cuántos días sin comprar para contar como que se fue debiendo |
| `meses` | `6` | cuántos meses de curva de deuda, de 1 a 24 |
| `limite` | `3` | cuántos renglones trae cada lista corta, de 1 a 10. La actividad trae el doble |

### La respuesta

```json
{
  "generadoEl": "2026-09-16T22:41:03.120Z",
  "cobranza": {
    "vencido": {
      "clientes": 5,
      "monto": 477000,
      "top": [
        { "factura": "…", "cliente": { "_id": "…", "nombre": "Camila Torres", "dni": "…", "telefono": "…" }, "saldo": 141500, "venceEl": "2026-06-15T02:59:59.999Z", "dias": 93 }
      ]
    },
    "porVencer": { "dias": 7, "clientes": 0, "monto": 0, "top": [] },
    "seFueronDebiendo": {
      "dias": 60,
      "clientes": 1,
      "monto": 54000,
      "top": [ { "cliente": { "nombre": "Nicolás Álvarez", "…": "…" }, "saldo": 54000, "ultimaCompra": { "fecha": "2026-04-04T20:00:00.000Z", "total": 43000 }, "diasSinComprar": 165 } ]
    },
    "pasaronElLimite": {
      "clientes": 1,
      "monto": 170000,
      "top": [ { "cliente": { "nombre": "Tomás Castro", "…": "…" }, "saldo": 170000, "limiteCredito": 150000, "excedido": 20000 } ]
    }
  },
  "negocio": {
    "mes":         { "desde": "2026-09-01", "hasta": "2026-09-16", "vendido": 463000, "fiado": 381000, "cobrado": 334500, "tickets": 8,  "clientes": 6 },
    "mesAnterior": { "desde": "2026-08-01", "hasta": "2026-08-16", "vendido": 604000, "fiado": 462500, "cobrado": 299000, "tickets": 10, "clientes": 5 },
    "variacion": { "vendido": -23.3, "cobrado": 11.9 },
    "semana": { "dias": 7, "desde": "2026-09-10", "hasta": "2026-09-16", "vendido": 127000, "fiado": 127000, "cobrado": 107500, "tickets": 2, "clientes": 2 },
    "deuda": {
      "total": 968000,
      "vencida": 477000,
      "alInicioDeLaCurva": 566500,
      "variacion": 401500,
      "porMes": [
        { "mes": "2026-04", "deudaTotal": 583000, "deudaVencida": 189500, "deudores": 9 },
        { "mes": "2026-09", "deudaTotal": 968000, "deudaVencida": 477000, "deudores": 12 }
      ]
    }
  },
  "masVendido": [
    { "especie": { "_id": "…", "nombre": "Camisa" }, "unidades": 4, "monto": 92000, "porcentajeMonto": 19.9 }
  ],
  "mejoresClientes": [
    { "posicion": 1, "cliente": { "nombre": "Sofía Benítez", "…": "…" }, "cumplimiento": 100, "evaluadas": 8, "comprado": 1229000 }
  ],
  "actividad": [
    { "tipo": "pago", "_id": "…", "fecha": "2026-09-14T23:00:00.000Z", "cliente": { "nombre": "Sofía Benítez", "…": "…" }, "monto": 27000, "metodoPago": "efectivo", "registradoPor": { "_id": "…", "nombre": "Ricardo Ramirez" } }
  ]
}
```

### `cobranza` — "qué tengo que hacer"

Las cuatro traen la misma forma: `clientes`, `monto` y `top` (los peores, según
`limite`). **Si `clientes` es 0, no muestres la tarjeta.**

| Bloque | Qué es | Toca y va a |
| --- | --- | --- |
| `vencido` | lo que ya venció y sigue impago. Es lo mismo que el resumen de [Morosos](#1-morosos) | Métricas → Morosos |
| `porVencer` | lo que vence en los próximos `venceEnDias`: para avisar **antes** de que se atrase | la factura |
| `seFueronDebiendo` | deben y hace más de `diasInactivo` que no compran. La plata que más fácil se pierde | el historial del cliente |
| `pasaronElLimite` | ya deben más que su límite de crédito. `excedido` es por cuánto | el perfil del cliente |

En `vencido` y `porVencer`, **`dias` es positivo si ya venció** y negativo si
todavía falta.

### `negocio` — "cómo viene"

`mes` es del 1 hasta hoy. `mesAnterior` es **el mismo tramo** del mes pasado
(del 1 al mismo día): comparar 16 días contra 31 haría ver siempre peor al mes
en curso.

| Campo | Qué es |
| --- | --- |
| `vendido` | todo lo que salió por la puerta |
| `fiado` | de eso, cuánto quedó anotado |
| `cobrado` | **todo lo que entró**: lo que dejaron en el mostrador más los pagos a cuenta |
| `tickets`, `clientes` | cuántas compras y cuántas personas distintas |
| `variacion` | cuánto cambió contra el mes anterior, en %. `null` si el mes anterior fue 0 |
| `semana` | lo mismo para los últimos `dias` días |
| `deuda.total` / `vencida` | la plata en la calle hoy, y cuánta está vencida |
| `deuda.variacion` | cuánto creció (+) o bajó (−) desde el principio de la curva |
| `deuda.porMes` | un punto por mes para el gráfico: `deudaTotal`, `deudaVencida` y `deudores` |

**El número que más importa es `variacion.cobrado`.** Se puede vender igual que
siempre y estar cobrando la mitad: ahí es donde se ve.

### `masVendido`, `mejoresClientes` y `actividad`

- **`masVendido`**: las especies del mes con más plata, hasta `limite`. Igual que [Ventas por especie](#2-ventas-por-especie).
- **`mejoresClientes`**: los de mejor cumplimiento de toda su historia, hasta `limite`. Toca y va al perfil.
- **`actividad`**: los últimos movimientos de la marca (compras y pagos mezclados, sin anulados), hasta `limite * 2`. Con dos dueños sirve para ver qué cargó el otro. `metodoPago` viene `null` en las compras.

### La pantalla

```
┌─────────────────────────────────────────────┐
│ A cobrar        $477.000 · 5 clientes    →   │  cobranza.vencido
│ Se fue debiendo $54.000 · Nicolás        →   │  seFueronDebiendo
│ Pasó su límite  Tomás, $20.000 de más    →   │  pasaronElLimite
├─────────────────────────────────────────────┤
│ Este mes    vendiste $463.000   ↓23%         │  negocio.mes + variacion
│             cobraste $334.500   ↑12%         │
│ Semana      2 tickets · $127.000             │  negocio.semana
├─────────────────────────────────────────────┤
│ En la calle $968.000  ▁▂▅▁▄█   ↑$401.500     │  negocio.deuda
├─────────────────────────────────────────────┤
│ [Cargar ticket] [Registrar pago] [+ Cliente] │  solo front
├─────────────────────────────────────────────┤
│ Lo más vendido · Mejores clientes            │  masVendido / mejoresClientes
│ Última actividad                             │  actividad
└─────────────────────────────────────────────┘
```

Arriba lo accionable, en el medio los números, abajo el contexto. Los botones
de la tercera franja son del front: no necesitan backend.

### Checklist

- [x] Entrada **Inicio** con una sola llamada a `/metricas/resumen`
- [x] Las tarjetas de `cobranza` se ocultan cuando `clientes` es 0
- [x] Variación con color: vender menos o cobrar menos en rojo, más en verde
- [x] `variacion` en `null` (mes anterior en 0) → `—`, no "0%"
- [x] Curva de deuda con `deuda.porMes`
- [x] Cada renglón navega: morosos, historial o perfil del cliente
- [x] Botones de acción rápida
- [x] Actividad con quién cargó cada cosa

> **Front (16/09/2026):** los parámetros (`dias`, `venceEnDias`, `diasInactivo`,
> `meses`, `limite`) no viajan: usamos los valores por defecto del backend.
> "Cargar ticket" y "Registrar pago" abren el listado de clientes, porque las dos
> cosas arrancan eligiendo a quién. Cuando las cuatro listas de `cobranza` están
> en 0, en vez de esconder la franja entera se dice "nada pendiente": el vacío
> también es información.
