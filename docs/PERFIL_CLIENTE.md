# Perfil del cliente

Pedido del front al backend: un servicio nuevo, **`GET /clientes/:id/perfil`**,
que responda una sola pregunta:

> **¿Cuánto vale este cliente, y qué tan confiable es?**

- **Base:** `http://localhost:4000`
- **Auth:** igual que siempre, `Authorization: Bearer <token>` y una marca
- **Errores:** igual que siempre, `{ error, detalles? }`

---

## 1. Para qué

En **Más → Métricas → Mejores clientes** se ve el ranking por cumplimiento.
Tocar uno abría su ficha, que no dice nada de por qué está en ese ranking. Ahora
abre su **perfil**: por qué es un buen cliente y qué se puede hacer con eso
(subirle el límite, avisarle cuando llega la mercadería que compra).

Es distinto del historial ([HISTORIAL_CLIENTE.md](HISTORIAL_CLIENTE.md)): el
historial es el registro movimiento por movimiento, para cobrar; el perfil es el
resumen de su valor, para decidir.

**El front ya tiene la pantalla y ya llama a este endpoint.** Mientras no exista,
el backend responde `404 Ruta no encontrada: GET /clientes/:id/perfil` y la
pantalla dice "El perfil todavía no está disponible", con un botón al historial.
Cuando se publique, el front no hay que tocarlo.

```
┌───────────────────────────────────────────────┐
│  Andrés Gómez · DNI 20.000.000                │
│  Cumplimiento 95%                             │  ← cumplimiento
│  [Top 3 de 30] [5 seguidas en fecha]          │
│  [Paga a los 3 días de vencer]                │
│  Cumple 95% en 8 facturas: podés subirle el   │  ← lo calcula el front
│  límite de $100.000 a $150.000  [Subir]       │
├───────────────────────────────────────────────┤
│  ▂▃▅▆▇█  cómo viene cumpliendo (mes a mes)    │  ← cumplimiento.porMes
├───────────────────────────────────────────────┤
│  Cuánto vale                                  │  ← valor
│  Compró $850.000 · 24 tickets · $35.416 c/u   │
│  8,4% de todo lo que vendiste                 │
├───────────────────────────────────────────────┤
│  Qué compra                                   │  ← especies
│  Pantalón  12 u  $240.000                     │
│  Camisa     8 u  $150.000                     │
└───────────────────────────────────────────────┘
```

---

## 2. El endpoint

`GET /clientes/:id/perfil`

| Query | |
| --- | --- |
| `desde`, `hasta` | **opcionales.** Sin mandar nada: **toda la historia del cliente**, igual que `/metricas/mejores-clientes`. Es lo que manda el front hoy (nada): el cumplimiento de un cliente se juzga con todas sus facturas, no con las de un período |

---

## 3. La respuesta

```json
{
  "cliente": {
    "_id": "…",
    "nombre": "Andrés Gómez",
    "dni": "20000000",
    "telefono": "1156094360",
    "email": "andres@mail.com",
    "direccion": "Mitre 1234",
    "limiteCredito": 100000,
    "ventanaPago": { "desdeDia": 1, "hastaDia": 10 },
    "createdAt": "2025-03-04T15:00:00.000Z"
  },
  "periodo": null,
  "cumplimiento": {
    "promedio": 95,
    "evaluadas": 8,
    "aTiempo": 7,
    "tarde": 1,
    "impagas": 0,
    "rachaEnFecha": 5,
    "diasPromedioDeAtraso": 3,
    "porMes": [
      { "mes": "2026-04", "cumplimientoPromedio": 90, "evaluadas": 1 },
      { "mes": "2026-05", "cumplimientoPromedio": null, "evaluadas": 0 },
      { "mes": "2026-06", "cumplimientoPromedio": 100, "evaluadas": 2 }
    ]
  },
  "ranking": { "posicion": 3, "clientes": 30 },
  "valor": {
    "comprado": 850000,
    "tickets": 24,
    "ticketPromedio": 35416,
    "fiado": 640000,
    "porcentajeFiado": 75.3,
    "saldo": 0,
    "primeraCompra": "2025-03-10T18:00:00.000Z",
    "ultimaCompra": { "fecha": "2026-09-04T20:00:00.000Z", "total": 43000 },
    "ultimoPago": { "fecha": "2026-09-10T23:00:00.000Z", "monto": 43000 },
    "diasEntreCompras": 12.5,
    "porcentajeDeLasVentas": 8.4
  },
  "especies": [
    { "especie": { "_id": "…", "nombre": "Pantalón" }, "unidades": 12, "monto": 240000, "porcentajeUnidades": 40, "porcentajeMonto": 38.1 },
    { "especie": { "_id": "…", "nombre": "Camisa" },   "unidades": 8,  "monto": 150000, "porcentajeUnidades": 26.7, "porcentajeMonto": 23.8 }
  ]
}
```

### `cliente`

La misma forma que `GET /clientes/:id`, sin `deuda` ni `facturaAbierta`: lo que
debe hoy está en `valor.saldo`.

### `periodo`

`null` cuando no se mandan `desde`/`hasta` (toda la historia). Si se mandan,
el rango que se usó, como en el resto de las métricas.

### `cumplimiento`

El mismo cálculo que ya usan `/metricas/mejores-clientes` y
`/metricas/pagos-a-tiempo`, aplicado a este cliente.

| Campo | Qué es |
| --- | --- |
| `promedio` | de 0 a 100. `null` si no tiene ninguna factura para juzgar |
| `evaluadas` | cuántas facturas se pudieron juzgar (saldadas, o vencidas con deuda) |
| `aTiempo`, `tarde`, `impagas` | saldadas al 100%, saldadas con menos, y vencidas que todavía deben |
| `rachaEnFecha` | **nuevo.** Cuántas facturas **seguidas** cumplieron 100%, contando desde la más nueva hacia atrás. Se corta con la primera que no llegó a 100 |
| `diasPromedioDeAtraso` | de las que pagó tarde, cuánto se pasó. `null` si nunca pagó tarde |
| `porMes` | **nuevo.** Una fila por mes, **de la primera factura juzgable hasta hoy** (o del período si se mandó), también los meses sin nada. El mes es el del **vencimiento original** de la factura, igual que en `/metricas/pagos-a-tiempo`. `cumplimientoPromedio` es `null` cuando `evaluadas` es 0 |

### `ranking`

| Campo | Qué es |
| --- | --- |
| `posicion` | en qué puesto queda ordenando **a todos los clientes con facturas evaluadas** por `cumplimiento.promedio`, de mayor a menor. Es el "Top 3" |
| `clientes` | contra cuántos compite: cuántos tienen al menos una factura evaluada. Es el "de 30" |

Si el cliente no tiene ninguna factura evaluada, `posicion: null` y el front
muestra "sin historial".

### `valor`

Todo de la historia del cliente (o del período, si se mandó). **Sin anulados.**

| Campo | Qué es |
| --- | --- |
| `comprado` | suma del total de sus tickets |
| `tickets` | cuántos tickets |
| `ticketPromedio` | `comprado ÷ tickets`. `null` si nunca compró |
| `fiado` | cuánto de eso quedó anotado (no lo pagó al comprar) |
| `porcentajeFiado` | `fiado ÷ comprado` |
| `saldo` | lo que debe hoy |
| `primeraCompra` | su primer ticket: el "cliente desde". `null` si nunca compró |
| `ultimaCompra`, `ultimoPago` | `{ fecha, total }` y `{ fecha, monto }`. `null` si no hay |
| `diasEntreCompras` | cada cuántos días vuelve, mismo criterio que `/metricas/frecuencia-compra`. `null` con menos de dos visitas |
| `porcentajeDeLasVentas` | **nuevo.** Qué parte de **todo lo que vendió la marca** (en el mismo rango) es de este cliente. Es el número que dice cuánto pesa |

### `especies`

Qué compra este cliente: lo mismo que `/metricas/ventas-por-especie` pero
filtrado a él. **Hasta 10**, de la que más unidades le vendió a la que menos.
Los porcentajes son sobre lo que compró **él**, no sobre el total de la marca.
Un ítem viejo cargado sin especie llega con `especie: { _id: null, nombre: null }`
y el front lo muestra como "Sin especie".

---

## 4. Reglas

- **Los anulados no cuentan** nunca: ni tickets, ni pagos, ni facturas.
- **`rachaEnFecha`** se calcula solo con facturas **saldadas**, ordenadas por
  `pagadaEl` descendente. Una vencida con deuda corta la racha.
- **`porMes`** no puede tener huecos: si en mayo no venció ninguna, va igual con
  `evaluadas: 0` y `cumplimientoPromedio: null`.
- **`ranking.posicion`** se calcula sobre todos los clientes de la marca con
  `evaluadas > 0`. Empate: el de más facturas evaluadas va primero.
- **Cliente sin nada:** responde igual, con `cumplimiento.promedio: null`,
  `evaluadas: 0`, `ranking.posicion: null`, los totales en 0 y `especies: []`.

---

## 5. Lo que NO pedimos

La **sugerencia de límite** ("podés subirle el límite a $150.000") la calcula el
front con lo que ya viene acá: cumplimiento, facturas evaluadas, ticket promedio
y el límite actual del cliente. Si algún día la regla se decide en el backend,
avisen y la sacamos del front.

---

## 6. Errores

| Status | `error` | Cuándo |
| --- | --- | --- |
| `404` | `Cliente no encontrado` | el id no es válido, o el cliente es de otra marca |
| `400` | el de siempre | `desde`/`hasta` mal, o un rango de más de 36 meses |

> ⚠️ El front distingue "el servicio todavía no existe" de "el cliente no
> existe" **por el mensaje**: `Ruta no encontrada: …` contra
> `Cliente no encontrado`. Mantengan ese texto.

---

## 7. Cómo armarlo con lo que ya hay

- **`cumplimiento`:** es lo que ya calcula `mejoresClientes` para cada cliente,
  filtrado a uno. `porMes` es lo de `pagosATiempo`, agrupado por mes del
  vencimiento original.
- **`ranking`:** el mismo ranking de `mejoresClientes` sin `limite`, buscando la
  posición del cliente.
- **`valor`:** los totales de sus tickets y pagos; `porcentajeDeLasVentas` sale
  de dividir su `comprado` por el total vendido de la marca en el mismo rango.
- **`especies`:** `ventasPorEspecie` con un `$match` más por `cliente` en
  `filtroTickets`, y `$limit: 10`.

---

## 8. Cómo verificarlo

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/clientes/<id>/perfil"
```

1. `cumplimiento.promedio` tiene que dar igual que el `cumplimientoPromedio` de
   ese cliente en `/metricas/mejores-clientes?orden=cumplimiento`.
2. `ranking.posicion` 1 para el primero de ese ranking.
3. La suma de `especies[].monto` no puede pasar `valor.comprado`.
4. Un cliente recién creado: todo en 0 o `null`, sin romper.
5. En la app: **Métricas → Mejores clientes →** tocar uno. Tiene que abrir el
   perfil en vez del cartel de "todavía no está disponible".

---

## 9. Checklist (backend)

- [ ] `GET /clientes/:id/perfil`, con `requireAuth` y `requireMarca`
- [ ] `desde`/`hasta` opcionales; sin ellos, toda la historia y `periodo: null`
- [ ] `cumplimiento` con `rachaEnFecha` y `porMes` sin huecos
- [ ] `ranking` con `posicion` (o `null`) y `clientes`
- [ ] `valor` con `porcentajeDeLasVentas`
- [ ] `especies`: hasta 10, ordenadas por unidades, con sus porcentajes
- [ ] `404 Cliente no encontrado` para un id ajeno o inválido
- [ ] Probado con un cliente sin compras
