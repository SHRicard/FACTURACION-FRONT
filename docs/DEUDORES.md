# Deudores

Pedido del front al backend: sumarle a **`GET /metricas/deudores`** lo mismo que
ya tiene morosos —el resumen de hoy y **cómo fue cambiando la plata en la
calle**—, para que Deudores sea su propia pantalla y no una pestaña de aquella.

- **Base:** `http://localhost:4000`
- **Auth:** igual que siempre, `Authorization: Bearer <token>` y una marca
- **Errores:** igual que siempre, `{ error, detalles? }`

> **Todo lo que se pide es ADITIVO.** La respuesta de hoy no cambia de forma:
> `resumen`, `datos`, `total`, `pagina`, `porPagina` y `paginas` quedan donde
> están. El front ya está publicado con los campos nuevos como opcionales: hoy
> anda sin ellos, y el día que lleguen aparece el gráfico solo, sin tocar nada.

---

## 1. Para qué

**Deudor = cliente con saldo, esté vencido o no. Moroso = el deudor cuya factura
ya venció.** Los morosos ya tienen su métrica ([METRICAS.md](METRICAS.md) §1);
Deudores responde otra pregunta:

> **¿Cuánta plata tengo en la calle, y está creciendo o bajando?**

Un negocio puede tener cero morosos y aun así estar fiando cada vez más. Eso no
se ve en morosos: se ve acá.

```
┌───────────────────────────────────────────────┐
│  $1.250.000 en la calle                       │  ← resumen
│  12 de tus 30 clientes deben                  │
│  ↑ la libreta creció $120.000 en el período   │
│  Vencido $477.000 (5 morosos) · Por vencer …  │
├───────────────────────────────────────────────┤
│  ▁▂▃▃▅▆  cómo fue cambiando                   │  ← evolucion
│  abr may jun jul ago sep                      │
├───────────────────────────────────────────────┤
│  1  Nicolás Álvarez   $54.000   [139 días]    │  ← deudores
│  2  Joaquín Díaz      $112.000  [sin vencer]  │    (la lista de hoy)
└───────────────────────────────────────────────┘
```

Tocar un renglón abre el **historial del cliente**
([HISTORIAL_CLIENTE.md](HISTORIAL_CLIENTE.md)), igual que en morosos.

---

## 2. El endpoint

`GET /metricas/deudores`

| Query | |
| --- | --- |
| `desde`, `hasta` | **nuevo.** El período de la evolución. Mismo criterio que el resto ([METRICAS.md](METRICAS.md#el-período-desde-y-hasta)) |
| `agrupar` | **nuevo.** `mes` (por defecto) o `semana`: un punto por mes o por semana, igual que en morosos |
| `orden` | como hoy: `saldo` (por defecto, el que más debe primero) o `atraso` |
| `buscar` | como hoy: texto en el nombre o el DNI. **Filtra solo la lista** |
| `pagina`, `porPagina` | como hoy |
| `morosos` | **ya no se usa:** morosos tiene su propia ruta. El front dejó de mandarlo; se puede sacar o dejar, da igual |

---

## 3. La respuesta

Lo que hay hoy, más lo marcado como **nuevo**:

```json
{
  "periodo": { "desde": "2026-04-01", "hasta": "2026-09-15" },
  "agrupar": "mes",
  "resumen": {
    "deudores": 12,
    "morosos": 5,
    "deudaTotal": 1250000,
    "deudaVencida": 477000,
    "porcentajeVencida": 38.2,

    "clientes": 30,
    "porcentajeDeClientes": 40,
    "deudoresAlInicioDelPeriodo": 8,
    "variacionDeDeudores": 4,
    "deudaAlInicioDelPeriodo": 1130000,
    "variacionDeDeuda": 120000
  },
  "evolucion": [
    { "etiqueta": "2026-04", "desde": "2026-04-01", "hasta": "2026-04-30", "deudores": 8,  "nuevos": 3, "saldaron": 1, "deudaTotal": 1130000, "deudaVencida": 189500 },
    { "etiqueta": "2026-09", "desde": "2026-09-01", "hasta": "2026-09-15", "deudores": 12, "nuevos": 2, "saldaron": 0, "deudaTotal": 1250000, "deudaVencida": 477000 }
  ],
  "datos": [
    {
      "posicion": 1,
      "cliente": { "_id": "…", "nombre": "Nicolás Álvarez", "dni": "26912062", "telefono": "1156094360" },
      "saldo": 54000,
      "saldoVencido": 54000,
      "facturas": 1,
      "facturasVencidas": 1,
      "vencimientoMasViejo": "2026-04-30T02:59:59.999Z",
      "diasDeAtraso": 139,
      "moroso": true,

      "ultimaCompra": { "fecha": "2026-04-04T20:00:00.000Z", "total": 43000 },
      "ultimoPago": { "fecha": "2026-02-23T23:00:00.000Z", "monto": 36000 },
      "diasSinPagar": 203
    }
  ],
  "total": 12,
  "pagina": 1,
  "porPagina": 20,
  "paginas": 1
}
```

### `resumen`: lo que se agrega

| Campo | Qué es |
| --- | --- |
| `clientes` | cuántos clientes tiene la marca. Es el "de tus 30 clientes" |
| `porcentajeDeClientes` | `deudores ÷ clientes`: "el 40% de tus clientes debe algo" |
| `deudoresAlInicioDelPeriodo` | cuántos debían justo antes de `desde` |
| `variacionDeDeudores` | los del final del período menos los del principio. `+4` = hay 4 deudores más |
| `deudaAlInicioDelPeriodo` | cuánta plata había en la calle justo antes de `desde` |
| `variacionDeDeuda` | la deuda del final menos la del principio. **Es el número que dice si la libreta crece o se achica** |

Lo de hoy (`deudores`, `morosos`, `deudaTotal`, `deudaVencida`,
`porcentajeVencida`) queda igual. Lo que no está vencido el front lo calcula
solo: `deudaTotal - deudaVencida`.

### `evolucion`: nuevo

Un punto por mes (o por semana) del período, en orden. Cada punto es **la foto al
final de ese tramo**; el tramo en curso se corta en el momento de la consulta.
Mismo criterio y mismos `etiqueta`/`desde`/`hasta` que la evolución de morosos.

| Campo | Qué es |
| --- | --- |
| `etiqueta` | `"2026-04"` por mes; por semana, el lunes: `"2026-08-31"` |
| `desde`, `hasta` | los días que cubre, recortados por el período |
| `deudores` | cuántos clientes debían algo al final del tramo |
| `nuevos` | los que **empezaron** a deber en este tramo |
| `saldaron` | los que **terminaron** de pagar: debían al final del anterior y ya no |
| `deudaTotal` | cuánta plata había en la calle al final del tramo |
| `deudaVencida` | de esa plata, cuánta ya estaba vencida |

`deudores` de un punto = `deudores` del anterior + `nuevos` − `saldaron`. El
primero se compara contra `resumen.deudoresAlInicioDelPeriodo`.

**Diferencia con morosos:** allá un cliente entra cuando su factura **vence** y
sigue debiendo; acá entra apenas **debe**, haya vencido o no. Por eso `deudores`
es siempre mayor o igual que `morosos` en el mismo corte.

### Cada renglón: lo que se agrega

| Campo | Qué es |
| --- | --- |
| `ultimaCompra` | su último ticket, `{ fecha, total }`. `null` si nunca compró |
| `ultimoPago` | su último pago a cuenta, `{ fecha, monto }`. `null` si nunca pagó a cuenta |
| `diasSinPagar` | días desde `ultimoPago`. `null` si nunca pagó |

Son los mismos tres que ya devuelve morosos, y sirven para lo mismo: distinguir
al que sigue comprando y pagando del que desapareció.

---

## 4. Reglas

- **Quién entra:** cliente con `saldo > 0`, esté vencido o no. Lo de hoy.
- **Los anulados no cuentan** nunca, ni en la lista ni en la evolución.
- **`buscar` filtra solo `datos`:** el resumen y la evolución son de toda la
  marca, se busque lo que se busque. Igual que hoy.
- **Evolución:** para cada fecha de corte se reconstruye la deuda de cada factura
  con sus tickets y sus pagos hasta ese día, como ya se hace en
  `services/metricas/morosos.ts`. La diferencia es que acá **no hace falta mirar
  el vencimiento** para contar al cliente: alcanza con que deba. Sí se mira para
  `deudaVencida`, con el mismo criterio de fecha reprogramada que morosos.
- **Un cliente, una factura activa:** hoy `facturas` y `facturasVencidas` valen
  como mucho 1. Quedan igual, no molestan.

---

## 5. Errores

| Status | Cuándo |
| --- | --- |
| `400` | `agrupar` u `orden` que no existen: el de siempre, con `detalles.campo` y `detalles.validos` |
| `400` | `desde`/`hasta` mal, o un período de más de 36 meses: el de siempre |

---

## 6. Cómo verificarlo

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:4000/metricas/deudores?agrupar=mes&orden=saldo&porPagina=20"
```

1. El último punto de `evolucion` tiene que dar igual que el resumen de hoy:
   `deudores` y `deudaTotal` iguales a `resumen.deudores` y `resumen.deudaTotal`.
2. `resumen.variacionDeDeuda` = `deudaTotal` del último punto −
   `resumen.deudaAlInicioDelPeriodo`.
3. En cualquier corte, `deudores` ≥ los `morosos` de `/metricas/morosos` con el
   mismo período y agrupación.
4. `?buscar=alvarez`: cambia `datos` y `total`, no cambian `resumen` ni `evolucion`.
5. En la app: **Más → Métricas → Deudores**. Sin los campos nuevos la pantalla
   anda igual, pero sin gráfico; con ellos aparece el gráfico y la variación.

---

## 7. Checklist (backend)

- [ ] `desde`, `hasta` y `agrupar` en la query, con el mismo criterio que morosos
- [ ] `periodo` y `agrupar` en la respuesta
- [ ] `resumen`: `clientes`, `porcentajeDeClientes`, `deudoresAlInicioDelPeriodo`,
      `variacionDeDeudores`, `deudaAlInicioDelPeriodo`, `variacionDeDeuda`
- [ ] `evolucion` con `deudores`, `nuevos`, `saldaron`, `deudaTotal` y `deudaVencida`
- [ ] En cada renglón: `ultimaCompra`, `ultimoPago` y `diasSinPagar`
- [ ] La forma de hoy intacta: `datos` y el paginado siguen en la raíz
- [ ] Probado con una marca sin deudores (todo en 0, `evolucion` con los puntos en 0)
