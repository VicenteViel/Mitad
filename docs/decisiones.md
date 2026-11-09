# Decisiones — Mitad

Registro de las decisiones de producto y arquitectura. Si una decisión cambia, se edita aquí y se actualiza la fecha.

- **Última actualización:** 2026-11-09
- **Estado:** Etapa 1 (Mitad gratis) definida y con modelo de datos aprobado. Etapas 2 y 3 con decisiones pendientes.
- **Modelo de datos:** [modelo-datos.md](modelo-datos.md)

---

## Etapa 1 — Mitad gratis

### Grupos e integrantes

1. **Grupo y hogar son la misma entidad.** Pro se activa por grupo.
2. **Todo integrante activo usa la app.** No se puede agregar a alguien que nunca instala la app.
3. **Hay dos tipos de integrante:**
   - *Registrado:* correo + código OTP.
   - *Sin cuenta:* sesión anónima de Supabase Auth, sin correo. Puede agregar su correo después y conserva el mismo usuario y sus grupos.
4. **El dinero pertenece al integrante, no a la cuenta.** Gastos, participaciones y liquidaciones apuntan al integrante del grupo. Salir del grupo, eliminar la cuenta o perder el teléfono no borra saldos ni historial.
5. **Se puede salir de un grupo con saldo pendiente.** Antes de confirmar, la app muestra el monto pendiente. Quien sale pierde el acceso al grupo; su saldo sigue visible para el resto.
6. **Eliminar la cuenta anonimiza.** El integrante queda como "Ex-integrante" y su historial se conserva.

### Invitaciones

7. **Solo se entra a un grupo con una invitación generada por un admin**, por QR o link. El QR contiene el mismo link. Sirve también para quien ya tiene cuenta.
8. **Cada invitación es de un solo uso, vence a los 7 días y se puede revocar.**
9. **Una invitación puede re-vincular a un integrante existente** (teléfono perdido, alguien que vuelve). Al re-vincular, el teléfono anterior pierde el acceso.
10. **Los links de invitación requieren un dominio propio** (universal links en iOS, app links en Android). Si la app no está instalada, el link muestra una página con los enlaces de descarga.

### Permisos

11. **Puede haber varios admins por grupo.**
12. **Solo los usuarios registrados crean grupos y pueden ser admins.** Por qué: un admin sin cuenta que pierde el teléfono dejaría al grupo sin forma de invitar ni re-vincular.
13. **Si sale el último admin**, pasa a serlo el integrante registrado más antiguo.
14. **Todos los integrantes registran gastos; solo los admins editan o borran** gastos y liquidaciones.

### Dinero

15. **Pesos chilenos (CLP) en números enteros.** Sin multimoneda y sin punto flotante.
16. **División equitativa o personalizada.** La personalizada debe sumar exactamente el monto. Los pesos que sobran al dividir los absorbe quien pagó (ej.: $10.000 entre 3 → quien pagó $3.334, los demás $3.333).
17. **Deudas en pares directos**, compensadas dentro de cada par y sin simplificar. Ej.: Camila le debe $10.000 a Diego y Diego le debe $3.000 a Camila → una sola deuda: Camila → Diego $7.000. Simplificar deudas se puede agregar después sin migrar datos.
18. **Una liquidación la declara cualquiera de las dos partes, sin confirmación**, y se descuenta del saldo del par (no de gastos específicos). Si una de las partes ya no está en el grupo, la declara la otra o un admin.
19. **Borrado lógico** de gastos y liquidaciones, con registro de quién y cuándo.
20. **Los saldos se calculan, nunca se guardan.** Se derivan de gastos, participaciones y liquidaciones.
21. **Las operaciones de dinero son funciones de Postgres (RPC)**, atómicas y con clave de idempotencia para evitar duplicados por reintentos.

### App

22. **Un grupo activo global**, con selector en Inicio. Todas las pestañas muestran ese grupo.
23. **Se empieza con Expo Go.** Se pasa a development build al probar los links de invitación y antes de la beta (y más adelante para notificaciones y pagos).
24. **Sin Zustand** hasta que haga falta: TanStack Query + estado local.
25. **SMTP propio** para los correos OTP. El SMTP por defecto de Supabase es solo para desarrollo.

### Entorno e infraestructura

26. **Dos proyectos Supabase:** desarrollo y producción. La beta corre en producción.
27. **Beta cerrada** en TestFlight y en prueba cerrada de Google Play. Los datos de la beta son reales: las migraciones deben conservarlos.
28. **Desarrollo en Windows; pruebas de iOS en un iPhone físico con Expo Go.** Para la beta se necesita Apple Developer (99 USD/año).
29. **Repositorio:** `C:\Users\vicen\Desktop\Mitad`, fuera de OneDrive, un solo repo git (remoto `github.com/VicenteViel/Mitad`).

### Reglas surgidas del modelo de datos

Detalle de tablas, cálculos y funciones en [modelo-datos.md](modelo-datos.md).

30. **Si quien pagó no participa del gasto**, los pesos sobrantes de la división equitativa se reparten de a uno entre los participantes, por orden de llegada al grupo.
31. **Una liquidación puede superar la deuda**; en ese caso el saldo se invierte. La app sugiere el monto exacto.
32. **De cada edición se guarda quién y cuándo** ("editado por Diego"), no las versiones anteriores.
33. **Lo borrado aparece en el historial como "eliminado"** y no cuenta en los saldos.
34. **Los gastos nuevos solo incluyen integrantes activos.** Los antiguos conservan a quienes ya salieron.
35. **Todos los admins son iguales.** Uno puede quitarle el rol a otro, pero nunca al último admin. Quien sale del grupo pierde el rol.
36. **No hay "eliminar grupo" en la Etapa 1.** Si sale el último integrante activo, el grupo y sus datos se borran.
37. **Re-vincular solo aplica a integrantes sin cuenta o ex-integrantes** y nunca entrega el rol de admin. Un usuario registrado que cambia de teléfono inicia sesión con su correo.
38. **Sin fotos en la Etapa 1:** se usan iniciales con color.
39. **Sin preferencias guardadas en la base de datos:** el grupo activo se recuerda en el teléfono.
40. **Sin Realtime en la Etapa 1:** los datos se actualizan al abrir la app o al deslizar hacia abajo.
41. **Grupo sin integrantes registrados.** Si el último admin sale o elimina su cuenta y solo quedan integrantes sin cuenta, el grupo queda sin admin. Los gastos y liquidaciones siguen funcionando, y el primer integrante que agregue su correo puede tomar el rol de admin.

---

## Pendiente antes de la beta (no bloquea empezar)

- **¿Persona natural o empresa?** Define el vendedor que aparece en las tiendas. La regla de Google de 12 testers durante 14 días aplica a cuentas personales nuevas. Una cuenta de empresa requiere número D-U-N-S, que puede tardar días o semanas.
- **Nombre definitivo, dominio e identificador de la app** (tipo `cl.tuempresa.mitad`). El identificador no se puede cambiar después de subir la primera beta.
- **Política de privacidad.** La exigen las tiendas.
- **Plan de Supabase.** El plan gratis pausa un proyecto tras 7 días sin actividad. Para la beta conviene evaluar Pro (25 USD/mes).
- **Acceso demo para la revisión de Apple** (TestFlight externo), porque el login es por OTP.

## Pendiente para la Etapa 2 — Hoy Te Toca

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
