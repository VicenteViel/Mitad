# Modelo de datos — Etapa 1

Diseño conceptual aprobado el 2026-11-09 (actualizado el mismo día: integrantes pendientes y apariencia). No es SQL: describe tablas, reglas y cálculos para implementarlos después. Las decisiones de producto están en [decisiones.md](decisiones.md).

## Principios

1. **El dinero apunta a integrantes, nunca a usuarios.** Un integrante es la identidad de una persona dentro de un grupo; la cuenta es un enlace opcional.
2. **La app solo lee.** Ninguna tabla acepta escrituras directas: todo cambio pasa por una función del servidor que valida permisos y reglas en un solo lugar.
3. **Los saldos se calculan, nunca se guardan.**
4. **Montos en pesos, como enteros.** Sin columna de moneda y sin decimales.

## Relaciones

- Un **grupo** tiene integrantes, invitaciones, gastos y liquidaciones.
- Un **integrante** puede tener un usuario vinculado (registrado o sin cuenta). Su estado se deduce de dos campos, sin guardarlo aparte:
  - **Activo:** tiene `usuario_id`.
  - **Pendiente:** sin `usuario_id` y sin `salio_en`. Lo agregó un admin y aún no acepta su invitación (o nunca usará la app).
  - **Ex-integrante:** sin `usuario_id` y con `salio_en`.
- Un **gasto** lo pagó un integrante y se reparte en **participaciones**, una por integrante.
- Una **liquidación** va de un integrante a otro.
- Los usuarios viven en Supabase Auth. Si un usuario es registrado o sin cuenta se lee de ahí; no se copia a estas tablas.

## Tablas

### perfiles (no se creó)

Descartada al implementar (decisión 42): el nombre vive en `integrantes`, uno por grupo. El correo queda en Supabase Auth y nunca se muestra a otros integrantes.

### grupos

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `nombre` | text | Obligatorio |
| `descripcion` | text | Opcional |
| `creado_en` | timestamptz | |

### integrantes

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `grupo_id` | uuid → grupos | |
| `usuario_id` | uuid → usuario | Opcional. Vacío = pendiente o ex-integrante (ver Relaciones) |
| `nombre` | text | Nombre visible en este grupo |
| `rol` | text | `admin` o `integrante` |
| `avatar` | text | `hombre` o `mujer`. Ícono que se muestra |
| `color` | text | Lista fija de colores. Por defecto `azul` (hombre) o `rosado` (mujer) |
| `unido_en` | timestamptz | Define el orden de llegada. Para un pendiente, cuándo lo agregaron |
| `salio_en` | timestamptz | Opcional |

- Un usuario puede estar vinculado a un solo integrante por grupo.
- `avatar` y `color` son apariencia, no datos personales: el integrante activo los cambia desde su perfil; los de un pendiente los cambia un admin.
- Un pendiente nunca es admin.
- El nombre se guarda aquí y no en el perfil: se conserva si la persona sale, y anonimizar es cambiar solo este campo a "Ex-integrante".
- Re-vincular es cambiar `usuario_id`.
- Solo un integrante con usuario registrado puede ser admin.

### invitaciones

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `grupo_id` | uuid → grupos | |
| `token_hash` | text | Hash del token. El token solo existe en el link o QR |
| `integrante_id` | uuid → integrantes | Opcional. Si está, la invitación re-vincula a ese integrante |
| `creada_por` | uuid → integrantes | Admin que la generó |
| `creada_en` | timestamptz | |
| `expira_en` | timestamptz | `creada_en` + 7 días |
| `usada_en` | timestamptz | Opcional |
| `usada_por` | uuid → usuario | Opcional |
| `revocada_en` | timestamptz | Opcional |

- Es válida si no está usada, ni revocada, ni vencida.
- Solo se guarda el hash: quien lea la base de datos no obtiene links válidos. Por eso un QR no se puede volver a mostrar; se genera uno nuevo.
- `integrante_id` solo puede apuntar a integrantes pendientes, sin cuenta o ex-integrantes.
- Cada pendiente tiene su propia invitación con `integrante_id`. Al aceptarla, la persona queda vinculada a ese integrante con su nombre, gastos y saldo.

### gastos

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `grupo_id` | uuid → grupos | |
| `descripcion` | text | |
| `monto` | integer | Pesos, mayor que 0 |
| `categoria` | text | Lista fija: alimentación, arriendo, servicios básicos, transporte, limpieza, compras, otros |
| `fecha` | date | Día del gasto. Por defecto, hoy |
| `pagado_por` | uuid → integrantes | |
| `tipo_division` | text | `equitativa` o `personalizada` |
| `clave_idempotencia` | uuid | La genera la app. Única por grupo |
| `version` | integer | Sube en cada edición |
| `creado_por`, `creado_en` | integrante, timestamptz | |
| `editado_por`, `editado_en` | integrante, timestamptz | Opcionales |
| `borrado_por`, `borrado_en` | integrante, timestamptz | Opcionales. Borrado lógico |

### participaciones

| Campo | Tipo | Notas |
|---|---|---|
| `gasto_id` | uuid → gastos | |
| `integrante_id` | uuid → integrantes | |
| `monto` | integer | Mayor que 0 |

- Un integrante aparece una sola vez por gasto.
- La suma de las participaciones es igual al monto del gasto.
- Al editar un gasto, sus participaciones se reemplazan completas.

### liquidaciones

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `grupo_id` | uuid → grupos | |
| `de` | uuid → integrantes | Quien paga |
| `a` | uuid → integrantes | Quien recibe. Distinto de `de` |
| `monto` | integer | Pesos, mayor que 0 |
| `fecha` | date | |
| `declarada_por` | uuid → integrantes | Una de las partes, o un admin si la otra ya salió. Si una parte es pendiente, solo un admin |
| `clave_idempotencia` | uuid | Única por grupo |
| `version` | integer | Sube en cada edición |
| `creado_en` | timestamptz | |
| `editado_por`, `editado_en` | integrante, timestamptz | Opcionales |
| `borrado_por`, `borrado_en` | integrante, timestamptz | Opcionales. Borrado lógico |

### evidencias

| Campo | Tipo | Notas |
|---|---|---|
| `id` | uuid | |
| `grupo_id` | uuid → grupos | |
| `gasto_id` | uuid → gastos | Opcional |
| `liquidacion_id` | uuid → liquidaciones | Opcional. Exactamente uno de `gasto_id` o `liquidacion_id` |
| `ruta` | text | Única. Archivo en el bucket privado `evidencias`: `{grupo}/{gasto o pago}/{archivo}` |
| `subida_por` | uuid → integrantes | |
| `subida_en` | timestamptz | |

- Capturas de boletas o de transferencias. Son informativas: no cambian saldos.
- Se ven con URLs firmadas temporales. Las políticas de Storage exigen ser integrante activo del grupo de la ruta.
- Borra quien la subió o un admin.

## Cálculos

### División equitativa

La app envía quiénes participan y la función calcula los montos. La app solo muestra una vista previa con la misma regla.

1. `base` = monto ÷ cantidad de participantes (división entera). `resto` = monto − base × participantes.
2. Cada participante recibe `base`.
3. Si quien pagó participa, recibe además todo el `resto`.
4. Si no participa, el `resto` se reparte de a 1 peso entre los participantes, por orden de llegada al grupo.

Ejemplo: $10.000 entre 3 y pagó Diego, que participa → Diego $3.334, los demás $3.333.

### Saldos por par

Solo cuentan los gastos y liquidaciones no borrados.

1. Por cada gasto, cada participante distinto de quien pagó le debe su participación a quien pagó.
2. Por cada liquidación, `de` le pagó `monto` a `a`, lo que reduce lo que `de` le debe a `a`.
3. En cada par se compensan las deudas en ambas direcciones y queda una sola: quién le debe a quién y cuánto.

### Saldo por integrante

`neto = total pagado − total de sus participaciones + liquidaciones pagadas − liquidaciones recibidas`

Positivo: le deben. Negativo: debe.

### Invariantes (para tests)

- La suma de las participaciones de un gasto es igual a su monto.
- La suma de los netos de todos los integrantes de un grupo es 0.
- El neto de un integrante es igual a la suma de sus saldos por par.

### Historial

Gastos y liquidaciones del grupo, del más reciente al más antiguo (por `fecha` y luego por hora de creación). Lo borrado aparece como "eliminado" y no cuenta en los saldos.

## Salir del grupo y eliminar la cuenta

- **Salir:** el integrante queda sin usuario, se marca `salio_en` y pierde el rol de admin. Si era el último admin, pasa a serlo el integrante registrado más antiguo (si no queda ninguno, el grupo queda sin admin hasta que alguien agregue su correo; regla 41). Si era el último integrante activo, el grupo y sus datos se borran, aunque queden pendientes.
- **Eliminar la cuenta:** lo mismo en cada grupo del usuario; además el nombre pasa a "Ex-integrante" y se borra el usuario de Supabase Auth (función `anonimizar_usuario`, solo ejecutable por la Edge Function `eliminar-cuenta`).

## Seguridad

- **Lectura (RLS):** cada usuario ve solo los grupos donde es integrante activo, con sus integrantes, gastos, participaciones, liquidaciones y evidencias. Las invitaciones solo las ven los admins.
- **Escritura:** solo mediante funciones del servidor. Cada función valida quién llama, su rol y las reglas, y ejecuta todo en una sola transacción.
- **Eliminar la cuenta:** Edge Function, porque borrar un usuario de Supabase Auth requiere permisos de administrador.

## Funciones

| Área | Función | Quién puede |
|---|---|---|
| Grupos | Crear grupo | Usuarios registrados |
| | Editar grupo | Admins |
| | Cambiar rol | Admins (admin solo a registrados; nunca quitar el último admin) |
| | Agregar integrante pendiente (nombre, ícono, color) | Admins |
| | Cambiar apariencia (ícono y color) | El propio integrante activo; un admin para los pendientes |
| | Quitar integrante | Admins |
| | Salir del grupo | Cualquier integrante |
| | Tomar el rol de admin | Integrante registrado, solo si el grupo no tiene admin |
| Invitaciones | Crear y revocar | Admins |
| | Ver (muestra el grupo antes de unirse) | Quien tenga el link |
| | Aceptar (unirse o re-vincular) | Quien tenga el link |
| Gastos | Crear (participantes: activos y pendientes) | Cualquier integrante activo; si lo pagó un pendiente, solo admins |
| | Editar y borrar | Admins |
| Liquidaciones | Registrar | Una de las partes, o un admin si la otra ya salió; si una parte es pendiente, solo admins |
| | Editar y borrar | Admins |
| | Apodo en el grupo (`actualizar_alias`) | El propio integrante activo |
| Evidencias | Subir (gasto o pago) | Cualquier integrante activo |
| | Borrar | Quien la subió o un admin |
| Cuenta | Eliminar cuenta (Edge Function) | El propio usuario |
| Lecturas | Saldos (por par y por integrante) e historial | Integrantes activos |

## Protecciones

| Riesgo | Protección |
|---|---|
| Gasto o liquidación duplicados por reintento | `clave_idempotencia` única por grupo; la función devuelve el registro ya creado |
| Dos admins editando lo mismo a la vez | `version`: la segunda edición se rechaza ("otro admin lo modificó; recarga") |
| Invitación usada dos veces al mismo tiempo | La función bloquea la invitación al canjearla; solo un canje gana |
| Acceso a grupos ajenos | RLS en lectura y verificación de pertenencia en cada función |
| Escalamiento de privilegios | El rol solo cambia mediante una función que exige ser admin |
| Errores de cálculo | Enteros, cálculo en un solo lugar e invariantes cubiertos por tests |

## Fuera de la Etapa 1

- Moneda (todo es CLP).
- Fotos de perfil y de grupo (se usan ícono + color).
- Preferencias guardadas.
- Borrar del Storage los archivos de evidencia cuando se borra un grupo entero (quedan huérfanos; limpieza pendiente).
- Zona horaria del grupo (llega con Hoy Te Toca).
- Realtime.
- Suscripción Pro y tareas.
