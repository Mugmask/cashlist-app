# Diseño: balance por caja con tarjetas e importador de resúmenes

> Borrador para revisar · 2026-10-07 · nace de cargar a mano jul–oct 2026 desde los resúmenes de
> Santander y Mercado Pago (ver memoria `statement-importer-learnings`).

## El problema

1. **"Te quedan" no es la plata que tenés para gastar.** La app descuenta cada compra con tarjeta en el
   mes en que la hacés (cada cuota, en su mes). Pero la tarjeta se paga con el sueldo del mes
   siguiente: en octubre el sueldo pagó la tarjeta de septiembre. Hoy la app dice "te quedan 135k",
   pero en Santander hay 337k; los 202k de diferencia son la tarjeta de octubre, que va a pagar el
   sueldo de noviembre.
2. **Cargar a mano no da exacto.** Al compararlo con el banco aparecieron duplicados (gastos cargados
   dos veces, compras de la lista de súper que repetían un débito), gastos que nunca existieron, dólares
   a una cotización que no fue la cobrada, impuestos de la tarjeta sin cargar y movimientos entre
   cuentas propias contados como gasto. Hicieron falta seis rondas de correcciones para que cerrara al
   centavo.

Objetivo: **si cargás lo que dice el banco, la app da lo mismo que el banco.**

## Dos preguntas, dos criterios

| Pregunta                           | Criterio                                                                                                              | Dónde se ve                                |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| ¿Cuánto gasté en octubre? ¿En qué? | **Consumo**: la compra cuenta el día que la hacés; una compra en cuotas cuenta entera ese mes (como hoy en la lista). | Gastos, Análisis                           |
| ¿Cuánta plata me queda este mes?   | **Caja**: la tarjeta pesa en el mes en que **vence** su resumen; débito, efectivo y transferencias, el día que salen. | Inicio ("Te quedan"), arrastre entre meses |

El análisis de hábitos no cambia. Lo que cambia es el balance.

## Parte 1 — Tarjetas con cierre y vencimiento

### Modelo

- **Tabla nueva `cards`**: `id, name` ("Visa Santander", "Mercado Pago")
  y `deleted`, `updatedAt`. Sincronizada como el resto (migración en Supabase +
  versión de Dexie + `tables.ts`).
- **`expenses.cardId`** (opcional). `paymentMethod: 'card'` sin `cardId` significa la única tarjeta, o la
  primera. No hace falta migrar los gastos viejos.
- **Resúmenes (`card_statements`)**: la tabla vieja de Supabase guardaba solo "pagado" y se descartó
  (Dexie v16). Propongo reemplazarla por `card_statements` con
  `id, cardId, closesAt, dueAt, total?, foreignTotal?, source ('rule' | 'import' | 'manual')`.
  Hace falta porque **las fechas de cierre no son fijas**: Santander cerró el 30/7, el 27/8 y el 1/10.
  Cada resumen trae el "próximo cierre / próximo vencimiento", así que el importador los va
  completando. Sin resumen cargado, la fecha sale de la regla de la tarjeta.

### Las fechas cambian todos los meses: sin configuración fija

Fechas reales de Santander en 2026: cierres el 02/07, 30/07, 27/08, 01/10 y 29/10; vencimientos el 13/07,
07/08, 04/09, 09/10 y 11/11. Mercado Pago cierra siempre el 5 y vence entre el 10 y el 13.

- **La tarjeta no tiene `closingDay` ni `dueDay` configurables.** Las fechas salen de los resúmenes.
  Cada resumen trae su cierre y vencimiento **y anuncia los próximos** ("Próximo cierre: 29/10,
  Próximo vencimiento: 11/11"). Importar uno deja cargado el siguiente con sus fechas reales, así
  que la app siempre las conoce con un mes de anticipación.
- **Sin un resumen que anuncie las fechas**, se estiman con el historial de esa tarjeta (el día
  típico de cierre y vencimiento). Para el balance por caja solo importa el mes en que se paga, y
  el vencimiento cae siempre en el mes siguiente al cierre. La duda real se reduce a las compras de
  la ventana de cierre posible (por ejemplo, del 27 al 2).
- **Las compras de esa ventana van al resumen más cercano**, que es el peor caso para "te quedan": si
  al final pasan al siguiente, te sobra en vez de faltarte. Se marcan como "puede entrar en este
  resumen o en el próximo" hasta que un resumen las confirme.
- **El tile de cada tarjeta** muestra "Cierra el 29/10 · vence el 11/11" y se corrige con un toque si
  el banco avisa otra fecha. Eso guarda un `card_statements` manual.

### Cálculo (funciones puras, con tests)

- `statementFor(card, statements, date)`: el resumen cuya ventana `(cierre anterior, cierre]`
  contiene la fecha.
- La **cuota i** de una compra cae en el resumen i−1 posterior al de la compra.
  Esto reemplaza al `chargeOn` actual, que asume mes calendario.
- `cashMonthOf(expense, cuota)`: el mes del **vencimiento** de ese resumen. Débito, efectivo y
  transferencias van al mes de su fecha.
- `monthBalance` pasa a sumar por caja: sueldo del perfil + ingresos del mes + arrastre (también por
  caja) − gastos de caja del mes − **resúmenes que vencen en el mes** − fijos pendientes.
- Si un resumen está importado, se usa su `total` (incluye impuestos e intereses y el dólar cobrado).
  La diferencia con la suma de las compras se muestra como "Impuestos y ajustes del resumen" en
  lugar de quedar escondida.

### Inicio

- **Hero "Te quedan en octubre"** por caja. Con los datos de hoy daría **337.729**, igual que Santander.
- Debajo: **"Tarjeta de noviembre: 202.069 ya comprometidos"**, un tile por tarjeta con cierre y
  vencimiento, así se ve que lo que comprás hoy te come el sueldo que viene.
- La línea "Gastaste" del hero pasa a "Pagaste" (caja). El consumo del mes se mantiene en Gastos.
- **Al cargar un gasto con tarjeta**, el formulario dice "Se paga en el resumen que vence el 5/11".

### Transición

- La caja y el consumo dan el mismo total en el tiempo; solo cambia en qué mes cae cada cosa. El primer
  mes con caja recibe los resúmenes que vencen en él, que salen de compras del mes anterior que ya
  están cargadas.
- Como el arrastre arranca en `firstTrackedPeriod`, un resumen que vence en el primer mes con compras
  de antes de ese mes entra igual. Es lo que pasa en la realidad: ese sueldo lo paga.
- Hay que actualizar los datos de ejemplo (`src/lib/demo`) con dos tarjetas.

## Parte 2 — Importador de resúmenes

### Principios

- **Todo se procesa en el navegador.** Los archivos del banco no salen del dispositivo; solo se
  sincronizan los gastos que confirmes. La pantalla se carga solo al abrirla (lazy), así que no suma
  al bundle inicial.
- **Nunca escribe sin revisión.** El flujo es subir → ver la propuesta → confirmar.
- **Se puede volver a importar.** Cada movimiento lleva un `importRef` estable
  (`fuente:fecha:importe:comprobante`): reimportar el mismo resumen, o el XLSX y después el PDF del
  mismo mes, no duplica nada.
- **Valida contra el banco.** Si la suma de lo extraído no cierra con el saldo corrido o el total
  del resumen, se avisa y no se importa a ciegas.

### Fuentes (en orden de valor)

1. **Resumen Santander PDF**: cuenta + Visa crédito + débito en un solo archivo. Es la fuente más rica.
2. **Movimientos Santander XLSX** ("Últimos movimientos"): sirve para el mes en curso, antes de que
   salga el resumen.
3. **Mercado Pago, cuenta (PDF)**: los movimientos de reservas ("Dinero reservado/retirado") separan
   lo que va al ahorro.
4. **Mercado Pago, tarjeta (PDF)**: cuotas de compras anteriores, pagos anticipados, sellos.

### Pipeline

```
archivo → detectar fuente → parser → Movimiento[] normalizado → validar → clasificar → conciliar → revisar → guardar
```

- **Movimiento normalizado**: `fecha, importe, descripción, comprobante, tipo` (compra, transferencia
  enviada o recibida, sueldo, pago de tarjeta, interno, impuesto, comisión, interés, reserva),
  `tarjeta?`, `cuota?: {n, de, fechaCompra}`, `usd?`.
- **Clasificar**: primero los movimientos internos, que no son gasto (pago de tarjeta, DEBIN a
  Mercado Libre = tarjeta MP, envío a MP propia, transferencia del mismo titular, extracciones,
  reservas). Después reglas por comercio (Pedidosya → Delivery, Shell/YPF/Puma → Transporte…). Por
  último **lo que ya aprendió de vos**: el nombre y la categoría que usaste antes para ese comercio o
  esa persona.
- **Conciliar con lo ya cargado**: mismo importe y fecha ±2 días, con el nombre como desempate.
  Además:
  - Una transferencia puede pagar **varios fijos juntos** (alquiler + expensas + gas al propietario):
    se busca la combinación que suma exacto.
  - Una compra de la **lista de súper** ("Compra de N productos") que coincide con uno o varios
    débitos se marca como el mismo gasto.
  - **Una cuota "02 de 03"** busca la compra original; si no está, se crea con la fecha de compra
    que trae el resumen y sus cuotas.
  - **Dólares**: se usa la cotización que salga del pago real del resumen.
- **Revisión**, en grupos: _Nuevos_ (con categoría propuesta y editable) · _Ya cargados_ (con
  el que coincide) · _Internos, no se cuentan_ · _Dudosos_ (por ejemplo, plata que sale del ahorro:
  ¿ingreso para gastar o no?). Una vez revisado, se confirma todo junto.
- **Saldo inicial**: en la primera importación se propone el ingreso "Saldo inicial" con el
  saldo del resumen menos la tarjeta pendiente, para que el arrastre arranque de plata real.

### Reglas de la cuenta

- **Cuentas aparte**: se marcan las cuentas que no se cuentan, como la reserva de MP. Lo que entra
  ahí sale del pozo; lo que sale de ahí para gastar se pregunta en la revisión.
- Las transferencias de personas se proponen como ingreso (reintegros). Si se repiten con la misma
  persona, se sugiere marcarlas como "gasto compartido" en lugar de ingreso. Esto queda como
  pendiente para una segunda vuelta.

### Decisiones técnicas (de la investigación)

- **PDF: `pdfjs-dist` 6.x**, importado con `import()` desde la pantalla del importador (`React.lazy`).
  - `getTextContent()` da cada texto con su posición: `transform[4]` es x, `transform[5]` es y.
    Las filas se arman agrupando por y (±1–2 pt) y las columnas, por rangos de x. Es más confiable que
    el texto "raw": el PDF de la cuenta de MP sale mezclado sin posiciones.
  - El worker se configura dentro del módulo lazy:
    `import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'`.
  - El worker pesa más de 1 MB. Hay que **excluirlo del precache** de Workbox (`globIgnores`) y
    cachearlo en runtime (CacheFirst): así el importador funciona offline después del primer uso
    y no agranda la instalación.
  - pdf.js usa top-level await: `build.target` ≥ `es2022`.
- **XLSX: `read-excel-file`**. El export "Últimos movimientos" de Santander es un `.xlsx` de verdad
  (lo verifiqué con el archivo real), y esta librería es chica y solo lee xlsx.
  - SheetJS solo si aparece un `.xls` que en realidad es HTML.
  - Nunca el paquete `xlsx` de npm: quedó en la 0.18.5, que tiene el CVE-2023-30533.
- **Mercado Pago, cuenta:** el sitio exporta **CSV/XLSX** ("Informes" → "Dinero en cuenta", rangos
  de hasta 62 días). Eso es preferible al PDF; el PDF queda como respaldo. La **tarjeta** de MP no
  tiene export tabular: va por PDF.
- **Deduplicado:**
  - `importRef = hash(fuente + cuenta + fecha + importe + descripción normalizada + n.º de
ocurrencia en el día)`. El número de ocurrencia distingue dos compras iguales el mismo día.
  - **Se guardan también los refs de lo que descartaste**, para que no vuelva a aparecer, como hace
    Firefly III.
  - Si un movimiento coincide con un gasto manual (mismo importe, fecha ±3 días o ±5 para tarjeta,
    y sin `importRef`), **se conserva el manual** con su nombre y categoría, y toma la fecha y el ref
    del banco. Es el criterio de Actual Budget.
- **Categorías aprendidas:** `merchantRules` (descripción normalizada → nombre y categoría). Se
  completa cuando corregís algo en la revisión y se siembra con lo que ya cargaste.
- **Prior art para mirar:** `Alechan/finance-analyzer` (MIT), que parsea PDFs de tarjeta Santander y
  Visa Prisma de Argentina con unos 50 resúmenes de prueba. Ninguna app conocida (YNAB, Monarch,
  Actual, Copilot) modela cierre y vencimiento por tarjeta ni cuotas: es la parte propia de este
  diseño.

## Fases

1. **Tarjetas y balance por caja**: `cards`, `card_statements`, `cardId`, cálculo, Inicio, formulario,
   datos de ejemplo y tests.
   Migraciones probadas con `pnpm db:reset` + `pnpm dev:sync`.
2. **Importador Santander PDF**: parser con validación del saldo corrido, clasificación, conciliación,
   revisión, `importRef`, y armado de resúmenes y cotización desde el PDF.
3. **Santander XLSX + Mercado Pago (cuenta y tarjeta)**, con las cuentas aparte.
4. **Aprendizaje de categorías y saldo inicial guiado.**

Cada fase va en su PR contra `develop`. Para los tests de los parsers, propongo **fixtures
anonimizadas** construidas a partir de los PDFs reales (nombres y CUITs cambiados): los PDFs reales no
se commitean, porque el repo es público.

## Decisiones abiertas

- Si el hero muestra **solo la caja**, o la caja con un toggle a consumo. Recomiendo solo caja, con
  el consumo en Gastos.
- Si un resumen importado **pisa** las compras (su total manda) o **se suma como ajuste**. Recomiendo
  que el total mande y que la diferencia se vea como línea de ajuste.
- Si el sueldo del perfil sigue siendo un monto fijo, o el importador carga el sueldo real
  (julio fueron 3M). Recomiendo mantener el del perfil y cargar la diferencia como ingreso.

## Estado de la fase 1 (rama `feature/card-statements-cash-balance`)

- **Modelo**: tablas `cards` y `card_cycles` (migración `20261007053153_cards.sql`), `expenses.card_id`,
  Dexie v18 y sync. La tabla vieja `card_statements` no se toca.
- **Cálculo** (`src/features/card/cycles.ts`): un ciclo por resumen, con las fechas reales cuando se
  conocen y estimadas cuando no (mismo día del mes siguiente, días hasta el vencimiento por mediana),
  y la ventana de ±3 días hacia el resumen más cercano. El balance y el arrastre ahora cuentan por
  caja (`cashParts`).
- **Pantallas**:
  - Inicio desglosa "Efectivo y débito" y cada resumen que vence en el mes.
  - Hay un tile por tarjeta con el resumen en curso, el cierre y el vencimiento, y un sheet para
    corregir las fechas.
  - El formulario de gasto tiene selector de tarjeta y la nota "Se paga con el resumen que vence el…".
  - Las tarjetas se gestionan en el perfil.
- **Verificado con los datos reales de Fran** (solo lectura): con sus ciclos de Santander y MP, el
  arrastre de septiembre da 83.158,07 (Santander al 30/9: 83.158,06) y lo que queda en octubre da
  337.729,53 (Santander hoy: 337.729,52).

### Release (cuando Fran lo pida)

1. `pnpm db:push:check` y `pnpm db:push`: la migración tiene que estar en producción **antes** del
   merge a `main`, porque la app nueva sube `card_id`.
2. Datos de Fran, con su OK:
   - Crear las tarjetas "Visa Santander" y "Mercado Pago".
   - Cargar sus ciclos (Santander: 02/07, 30/07, 27/08, 01/10 y 29/10; MP: el 5 de cada mes).
   - Asignar a Mercado Pago "Rack tv", "Cucherías para la casa" y los impuestos de la tarjeta MP; el
     resto de las compras con tarjeta va a Visa.
   - Pasar "Saldo inicial al 1/9 + lo usado del ahorro en sept." a **1.460.013,48**. Por caja, la
     tarjeta de agosto se paga en septiembre y ya no se descuenta del saldo inicial.

### Pendiente para revisar

- **"Podés gastar por día" (Análisis)** ahora es por caja: no descuenta lo que comprás con tarjeta este
  mes, porque eso lo paga el sueldo del mes que viene. ¿Mostramos también "comprometido para el mes
  que viene" ahí?
- **Datos de ejemplo**: el primer mes con datos no tiene resúmenes anteriores que pagar, así que
  "Te sobró" sale alto. Es un artefacto de la demo.
