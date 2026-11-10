# Decisiones — Rumi

Registro de las decisiones de producto y arquitectura. Si una decisión cambia, se edita aquí y se actualiza la fecha.

- **Última actualización:** 2026-11-09
- **Estado:** Etapa 1 (Rumi gratis) **implementada** (2026-11-10): grupos, rumis pendientes, invitaciones, gastos con evidencia, saldos, pagos entre rumis, edición y borrado, ajustes del grupo y Mi cuenta. Falta lo de "Pendiente antes de la beta". Etapas 2 y 3 con decisiones pendientes.
- **Modelo de datos:** [modelo-datos.md](modelo-datos.md)

---

## Etapa 1 — Rumi gratis

### Grupos e integrantes

1. **Grupo y hogar son la misma entidad.** Pro se activa por grupo.
2. **Un integrante puede existir sin usar la app.** Un admin agrega integrantes por nombre (al crear el grupo o después) y quedan *pendientes* hasta que aceptan su invitación. Un pendiente puede quedarse así para siempre (ej.: una abuela sin smartphone). El grupo funciona con quienes ya entraron; los pendientes no bloquean nada. *(Reemplaza la regla anterior "todo integrante activo usa la app", 2026-11-09.)*
3. **Hay tres tipos de integrante:**
   - *Registrado:* correo + código OTP.
   - *Sin cuenta:* sesión anónima de Supabase Auth, sin correo. Puede agregar su correo después y conserva el mismo usuario y sus grupos.
   - *Pendiente:* sin usuario vinculado y sin haber salido del grupo. Lo gestiona un admin.
4. **El dinero pertenece al integrante, no a la cuenta.** Gastos, participaciones y liquidaciones apuntan al integrante del grupo. Salir del grupo, eliminar la cuenta o perder el teléfono no borra saldos ni historial.
5. **Se puede salir de un grupo con saldo pendiente.** Antes de confirmar, la app muestra el monto pendiente. Quien sale pierde el acceso al grupo; su saldo sigue visible para el resto.
6. **Eliminar la cuenta anonimiza.** El integrante queda como "Ex-rumi" y su historial se conserva.

### Invitaciones

7. **Solo se entra a un grupo con una invitación generada por un admin**, por QR o link. El QR contiene el mismo link. Sirve también para quien ya tiene cuenta.
8. **Cada invitación es de un solo uso, vence a los 7 días y se puede revocar.**
9. **Una invitación puede re-vincular a un integrante existente** (teléfono perdido, alguien que vuelve). Al re-vincular, el teléfono anterior pierde el acceso.
9b. **Cada pendiente tiene su propia invitación**, compartible por WhatsApp o QR. Al aceptarla, la persona queda vinculada a ese integrante (conserva nombre, gastos y saldo); no se crea uno nuevo.
10. **Los links de invitación requieren un dominio propio** (universal links en iOS, app links en Android). Si la app no está instalada, el link muestra una página con los enlaces de descarga.
10b. **Un solo ingreso, y la cuenta decide el camino.** Todos entran igual (correo + código); no se pregunta si es nuevo ni qué rol tenía, porque el código que llega al correo es lo único que prueba quién es. Después de entrar:
   - *La cuenta tiene grupos:* va a Inicio con sus grupos. Así vuelve un admin o integrante que perdió el teléfono.
   - *La cuenta no tiene grupos:* "¿Qué quieres hacer?" (Crear un grupo / Me invitaron), con el aviso "¿Esperabas ver tus grupos?" por si entró con otro correo.
   - *Integrante que nunca registró correo:* pide al admin un nuevo link de invitación (regla 9); la pantalla de ingreso lo indica.
   - El alias no sirve para recuperar el acceso: no es secreto ni único.
10c. **Al aceptar una invitación:** pantalla "¡Te has unido a un grupo!" (nombre y descripción del grupo) y luego "Tus datos": foto de perfil (próximamente; cambia la regla 38), nombre puesto por el admin y **no editable**, **apodo** opcional y **correo opcional**. Si no deja correo, se le advierte y en Inicio queda el aviso "Agrega tu correo"; si lo deja, queda "Verifica tu correo" hasta confirmarlo. El correo es su forma de recuperar el lugar en el grupo.
10d. **Cómo funciona una invitación:** el admin toca "Invitar" en un rumi pendiente y obtiene un **código de 10 caracteres** (XXXXX-XXXXX, sin letras confusas), un **QR** con el link y un botón para compartir. Crear una invitación nueva anula la anterior de ese pendiente. Quien la recibe abre el link o escribe el código en "Me invitaron"; si no tiene sesión, entra **sin correo** (sesión anónima de Supabase, que hay que activar en el panel). Al aceptar queda vinculado a ese pendiente, siempre como integrante. En desarrollo el link es `exp://…` (Expo Go); en la app publicada será `https://` con dominio propio (regla 10).

### Permisos

11. **Puede haber varios admins por grupo.**
12. **Solo los usuarios registrados crean grupos y pueden ser admins.** Por qué: un admin sin cuenta que pierde el teléfono dejaría al grupo sin forma de invitar ni re-vincular.
13. **Si sale el último admin**, pasa a serlo el integrante registrado más antiguo.
14. **Todos los integrantes registran gastos; solo los admins editan o borran** gastos y liquidaciones.
14b. **Solo un admin registra el dinero de un pendiente:** los gastos que pagó y las liquidaciones en que participa (ej.: la abuela entrega su parte en efectivo).

### Dinero

15. **Pesos chilenos (CLP) en números enteros.** Sin multimoneda y sin punto flotante.
16. **División equitativa o personalizada.** La personalizada debe sumar exactamente el monto. Los pesos que sobran al dividir los absorbe quien pagó (ej.: $10.000 entre 3 → quien pagó $3.334, los demás $3.333).
17. **Deudas en pares directos**, compensadas dentro de cada par y sin simplificar. Ej.: Camila le debe $10.000 a Diego y Diego le debe $3.000 a Camila → una sola deuda: Camila → Diego $7.000. Simplificar deudas se puede agregar después sin migrar datos.
18. **Una liquidación la declara cualquiera de las dos partes, sin confirmación**, y se descuenta del saldo del par (no de gastos específicos). Si una de las partes ya no está en el grupo, la declara la otra o un admin. Si una de las partes es pendiente, solo la declara un admin (regla 14b).
19. **Borrado lógico** de gastos y liquidaciones, con registro de quién y cuándo.
19b. **Evidencia de un gasto o de un pago:** cada gasto (boletas) y cada pago entre rumis (capturas de la transferencia) puede tener **varias** capturas. Cualquier rumi activo del grupo puede subir; borra quien la subió o un admin. Se guardan en un bucket **privado** de Supabase Storage (`{grupo}/{gasto o pago}/{archivo}`, máximo 5 MB, JPG/PNG/HEIC/WEBP) y se muestran con enlaces temporales. La evidencia es informativa: no cambia saldos (eso lo hará una liquidación).
20. **Los saldos se calculan, nunca se guardan.** Se derivan de gastos, participaciones y liquidaciones.
21. **Las operaciones de dinero son funciones de Postgres (RPC)**, atómicas y con clave de idempotencia para evitar duplicados por reintentos.

### App

22. **Sin grupo activo global en la Etapa 1.** Inicio lista todos tus grupos y cada grupo abre su propia pantalla (saldos, gastos, pagos, ajustes). Con un solo módulo no hacen falta pestañas ni selector. Se revisa al llegar Hoy Te Toca, cuando haya dos módulos por grupo. *(Reemplaza "un grupo activo global con selector", 2026-11-10.)*
23. **Se empieza con Expo Go.** Se pasa a development build al probar los links de invitación y antes de la beta (y más adelante para notificaciones y pagos).
24. **Sin Zustand** hasta que haga falta: TanStack Query + estado local.
25. **SMTP propio** para los correos OTP. El SMTP por defecto de Supabase es solo para desarrollo.
25b. **En la app, los integrantes se llaman "rumis".** Viene de *roomie* (compañero de casa), escrito R-U-M-I. Los usuarios siempre ven "rumi" / "rumis" ("4 rumis", "+ Agregar rumi", "Rumi 1, Rumi 2…"), nunca "integrante". En el código, la base de datos y la documentación técnica se sigue usando "integrante".

### Entorno e infraestructura

26. **Dos proyectos Supabase:** desarrollo y producción. La beta corre en producción.
27. **Beta cerrada** en TestFlight y en prueba cerrada de Google Play. Los datos de la beta son reales: las migraciones deben conservarlos.
28. **Desarrollo en Windows; pruebas de iOS en un iPhone físico con Expo Go.** Para la beta se necesita Apple Developer (99 USD/año).
29. **Repositorio:** `C:\Users\vicen\Desktop\Rumi\Rumi`, fuera de OneDrive, un solo repo git (remoto `github.com/VicenteViel/Rumi`).

### Reglas surgidas del modelo de datos

Detalle de tablas, cálculos y funciones en [modelo-datos.md](modelo-datos.md).

30. **Si quien pagó no participa del gasto**, los pesos sobrantes de la división equitativa se reparten de a uno entre los participantes, por orden de llegada al grupo.
31. **Una liquidación puede superar la deuda**; en ese caso el saldo se invierte. La app sugiere el monto exacto.
32. **De cada edición se guarda quién y cuándo** ("editado por Diego"), no las versiones anteriores.
33. **Lo borrado aparece en el historial como "eliminado"** y no cuenta en los saldos.
34. **Los gastos nuevos incluyen a los integrantes activos y pendientes**, todos marcados por defecto; quien registra puede desmarcar a cualquiera. Los gastos antiguos conservan a quienes ya salieron.
35. **Todos los admins son iguales.** Uno puede quitarle el rol a otro, pero nunca al último admin. Quien sale del grupo pierde el rol.
36. **No hay "eliminar grupo" en la Etapa 1.** Si sale el último integrante con usuario vinculado, el grupo y sus datos se borran, aunque queden pendientes (nadie podría usarlo).
37. **Re-vincular solo aplica a integrantes pendientes, sin cuenta o ex-integrantes** y nunca entrega el rol de admin. Un usuario registrado que cambia de teléfono inicia sesión con su correo.
38. **Apariencia: ícono + color, sin fotos en la Etapa 1.** Cada integrante tiene un `avatar` (ícono `hombre` o `mujer`) y un `color`. Al agregarlo, el admin elige el ícono y el color parte en azul (hombre) o rosado (mujer). Una vez activo, cada integrante cambia su ícono y color desde su perfil, entre 8 colores (azul, rosado, morado, celeste, verde, amarillo, naranja, rojo). Se guarda como apariencia, no como sexo. **No se registran sexo ni orientación sexual** (datos sensibles sin uso en la app).
39. **Sin preferencias guardadas en la base de datos.**
40. **Sin Realtime en la Etapa 1:** los datos se actualizan al abrir la app o al deslizar hacia abajo.
41. **Grupo sin integrantes registrados.** Si el último admin sale o elimina su cuenta y solo quedan integrantes sin cuenta, el grupo queda sin admin. Los gastos y liquidaciones siguen funcionando, y el primer integrante que agregue su correo puede tomar el rol de admin.

### Reglas surgidas al implementar (2026-11-10)

42. **Sin tabla `perfiles`.** El nombre se define por grupo (lo pone el admin al agregar al rumi) y cada rumi puede ponerse un apodo en ese grupo. No hay "nombre global" que copiar, así que la tabla no aporta nada en la Etapa 1. El correo sigue solo en Supabase Auth.
43. **Quién registra un pago entre rumis:** cualquiera de las dos partes. Si una parte es pendiente, solo un admin. Si una parte ya salió del grupo, también un admin que no sea parte. La app sugiere el monto de la deuda.
44. **Editar o eliminar gastos y pagos: solo admins.** Al editar un gasto, los participantes se eligen entre los rumis actuales (activos y pendientes); quienes ya salieron no se pueden volver a agregar.
45. **Mi cuenta:** correo (agregar o confirmar), cerrar sesión y eliminar cuenta. Si la cuenta no tiene correo confirmado, cerrar sesión advierte que no podrá volver a entrar sin una invitación nueva.
46. **Eliminar la cuenta** saca al usuario de todos sus grupos (con sucesión de admin), cambia su nombre a "Ex-rumi" y borra el usuario de Supabase Auth. Los gastos, pagos y saldos se conservan para el resto. Lo hace una Edge Function (`eliminar-cuenta`).
47. **CI en GitHub Actions:** cada PR corre lint, TypeScript y tests (`npm run verificar` hace lo mismo en local).

### Fechas límite y gastos por cubrir (2026-11-10)

48. **Fecha límite opcional** en cualquier gasto. Se elige en un calendario al crear o editar.
49. **Gasto por cubrir:** un gasto que nadie ha pagado aún (ej. el arriendo que se le paga al arrendador). No tiene "quién pagó": cada rumi paga su parte por fuera y la marca como pagada (él mismo, o un admin por él). No crea deudas entre rumis ni cambia los saldos. Solo lo crean admins.
50. **Gasto mensual:** el admin lo crea una vez ("vence el día N de cada mes") y Rumi genera solo el gasto de cada mes, con el mismo monto, división y participantes. Se genera al abrir el grupo, sin tareas programadas, y nunca se duplica. Para cambiar el monto, se detiene y se crea uno nuevo; el gasto de un mes también se puede editar. Solo admins.
51. **Cuándo está vencido** (pasada la fecha límite, sin contar ese mismo día):
    - en un gasto por cubrir, para quien no marcó su parte como pagada;
    - en un gasto pagado, para quien todavía le debe a quien pagó, según el saldo del par: si ya le pagó o la deuda se compensó, no hay aviso. El monto avisado nunca supera la deuda actual.
52. **Aviso dentro de la app**, sin notificaciones push (llegan con la Etapa 2): un bloque rojo en la pantalla del grupo, con "Pagar" (abre Registrar pago con el monto) o "Ya pagué" (abre el gasto para marcar la parte), y una etiqueta "⏰ N pagos vencidos" en la tarjeta del grupo en Inicio.
53. **Sin dependencia nueva para elegir fechas:** un calendario propio, igual en iOS y Android.

### Historial (2026-11-10)

54. **Historial completo en su propia pantalla.** La pantalla del grupo muestra solo los últimos 5 movimientos y el botón "Ver historial completo". El historial se agrupa por día y se filtra por Todos, Gastos, Pagos o Míos. Cada movimiento muestra la hora exacta, quién lo registró, quién pagó, cuánto cambió **tu saldo** ("+" a tu favor, "−" lo que pasas a deber) y sus etiquetas (eliminado, editado, mensual, por cubrir, vence). Al tocarlo se despliega: la división por rumi, las ediciones con hora, quién lo eliminó y un **código** de 6 caracteres para nombrar el movimiento sin confusiones. La suma de los efectos de todos los movimientos es igual a tu saldo (cubierto por un test).



---

## Pendiente antes de la beta (no bloquea empezar)

- **¿Persona natural o empresa?** Define el vendedor que aparece en las tiendas. La regla de Google de 12 testers durante 14 días aplica a cuentas personales nuevas. Una cuenta de empresa requiere número D-U-N-S, que puede tardar días o semanas.
- **Nombre definitivo, dominio e identificador de la app** (tipo `cl.tuempresa.rumi`). El identificador no se puede cambiar después de subir la primera beta.
- **Política de privacidad.** La exigen las tiendas.
- **Plan de Supabase.** El plan gratis pausa un proyecto tras 7 días sin actividad. Para la beta conviene evaluar Pro (25 USD/mes).
- **Acceso demo para la revisión de Apple** (TestFlight externo), porque el login es por OTP.

## Pendiente para la Etapa 2 — Hoy Te Toca

Decidido:

- Los integrantes pendientes también pueden ser responsables de tareas (ej.: la abuela sin smartphone hace labores del hogar).

Propuestas iniciales, sin decidir:

- Separar la definición de la tarea de sus ocurrencias; generar ocurrencias con anticipación (ej. 2 semanas) con `pg_cron`.
- Rotación: si entra o sale alguien, se recalcula desde la próxima ocurrencia, sin tocar el pasado.
- Tarea no cumplida: ¿la rotación avanza igual o queda pendiente con el mismo responsable?
- Una zona horaria por grupo (`America/Santiago`).
- Si se cancela Pro: tareas en solo lectura, sin nuevas ocurrencias, historial conservado.

## Pendiente para la Etapa 3 — Monetización

- Una cuenta de tienda no puede tener dos suscripciones activas al mismo producto. Regla propuesta: un usuario paga Pro para un solo grupo.
- La compra se asocia a un grupo en el backend (webhook de RevenueCat → Edge Function). Los permisos premium nunca dependen de un valor enviado por la app.
- ¿Qué pasa con Pro si sale quien lo paga?
- ¿Puede un integrante sin cuenta pagar Pro? Recomendación: no.
- La prueba gratis es por cuenta de tienda, no por grupo.
- Verificar las reglas actuales de Apple sobre desbloquear Pro a integrantes que no pagaron, y que exista el precio de $4.500 CLP en las tiendas.
