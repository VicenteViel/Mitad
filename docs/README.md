# Rumi
# Rumi

### Comparte gastos. Comparte responsabilidades.

**Rumi** es una aplicación móvil para Android e iOS diseñada para simplificar la administración de gastos compartidos y la organización de tareas del hogar.

Pensada para parejas, familias, amigos y compañeros de departamento, Rumi reúne en una sola plataforma las herramientas necesarias para gestionar la convivencia de manera sencilla, transparente y organizada.

El proyecto sigue un modelo **Freemium**: la administración de gastos es gratuita, mientras que la organización avanzada de responsabilidades domésticas forma parte de **Rumi Pro**.

> **Estado del proyecto:** En planificación y desarrollo inicial. Las funcionalidades descritas corresponden al alcance previsto y aún no están disponibles públicamente.

---

## Funcionalidades

### Rumi — Gestión de gastos (Gratis)

Permite llevar un control claro de los gastos realizados entre varias personas.

**Funcionalidades previstas:**

- Creación y administración de grupos compartidos.
- Invitaciones mediante enlaces o códigos.
- Registro de gastos con categorías.
- División equitativa o personalizada de gastos.
- Cálculo automático de balances individuales.
- Visualización de deudas entre integrantes.
- Registro manual de liquidaciones.
- Historial de gastos y movimientos.
- Sincronización de información entre integrantes.

El objetivo es que los usuarios puedan identificar fácilmente **quién pagó, cuánto corresponde aportar y quién le debe a quién**.

### Hoy Te Toca — Organización del hogar (Pro)

Módulo premium diseñado para distribuir y gestionar las responsabilidades domésticas.

**Funcionalidades previstas:**

- Creación y asignación de tareas.
- Tareas puntuales y recurrentes.
- Rotación automática de responsabilidades.
- Calendario compartido del hogar.
- Seguimiento de tareas completadas y pendientes.
- Recordatorios y notificaciones.
- Historial de cumplimiento.

**Modelo de suscripción propuesto:** $4.500 CLP mensuales por hogar.

Una única suscripción permitirá habilitar las funcionalidades premium para los integrantes del hogar correspondiente.

---

## Stack tecnológico

| Tecnología | Propósito |
|---|---|
| React Native | Desarrollo móvil multiplataforma |
| Expo | Herramientas de desarrollo y compilación |
| TypeScript | Tipado estático |
| Expo Router | Navegación |
| Supabase | Backend administrado |
| PostgreSQL | Base de datos relacional |
| Supabase Auth | Autenticación |
| TanStack Query | Gestión del estado remoto |
| Zustand | Estado global de interfaz, cuando sea necesario |
| React Hook Form + Zod | Formularios y validación |
| RevenueCat | Suscripciones y compras integradas |
| Expo Notifications | Notificaciones |
| GitHub Actions | Integración continua |

*El stack representa la arquitectura tecnológica prevista y puede ajustarse durante el desarrollo.*

---

## Arquitectura

El proyecto seguirá una arquitectura modular orientada a funcionalidades, priorizando:

- Separación de responsabilidades.
- Componentes reutilizables.
- Reglas de negocio independientes de la interfaz.
- Código mantenible y tipado.
- Validación de datos.
- Seguridad mediante Row Level Security (RLS).
- Operaciones consistentes y seguras.
- Pruebas automatizadas para funcionalidades críticas.

Se priorizará una arquitectura sencilla, preparada para evolucionar sin incorporar complejidad innecesaria.

---

## Roadmap

### Fase 1 — MVP gratuito

- [x] Configuración inicial del proyecto.
- [x] Arquitectura base y navegación.
- [x] Sistema de autenticación.
- [x] Creación y administración de grupos.
- [x] Invitaciones de integrantes.
- [x] Registro de gastos.
- [x] División de gastos.
- [x] Cálculo de balances.
- [x] Registro de liquidaciones.
- [x] Historial de movimientos.
- [x] Pruebas y validaciones (lógica de dinero y permisos con tests; CI en cada PR).

### Fase 2 — Hoy Te Toca

- [ ] Gestión de tareas domésticas.
- [ ] Asignación de responsables.
- [ ] Tareas recurrentes.
- [ ] Rotación automática.
- [ ] Calendario compartido.
- [ ] Registro de cumplimiento.
- [ ] Notificaciones.

### Fase 3 — Monetización y lanzamiento

- [ ] Integración con RevenueCat.
- [ ] Suscripciones por hogar.
- [ ] Gestión de acceso premium.
- [ ] Pruebas de compras y restauraciones.
- [ ] Optimización de rendimiento.
- [ ] Pruebas con usuarios reales.
- [ ] Publicación en Google Play Store.
- [ ] Publicación en Apple App Store.

---

## Seguridad y privacidad

La protección de la información de los usuarios será una prioridad del desarrollo.

El sistema está diseñado para contemplar:

- Autenticación segura.
- Aislamiento de datos entre grupos.
- Autorización mediante políticas RLS.
- Validación de operaciones sensibles.
- Protección frente a operaciones duplicadas.
- Integridad de los cálculos financieros.
- Gestión segura de suscripciones.

Rumi no tiene previsto acceder directamente a cuentas bancarias ni ejecutar transferencias de dinero.

---

## Plataformas

El proyecto está orientado a:

- **Android**
- **iOS**

Ambas versiones compartirán una base de código desarrollada con React Native y Expo.

---

## Desarrollo

Este proyecto se desarrolla de forma independiente, siguiendo un enfoque de aprendizaje práctico e ingeniería de software.

La implementación se realiza manualmente, utilizando herramientas de inteligencia artificial como apoyo para:

- Diseño de arquitectura.
- Revisión de código.
- Análisis técnico.
- Resolución de problemas.
- Aprendizaje de tecnologías.
- Identificación de casos extremos.
- Buenas prácticas de desarrollo.

El objetivo es construir un producto real, mantenible y preparado para su distribución comercial.

---

## Licencia

Licencia y condiciones de uso pendientes de definición.

---

**Rumi — Compartir es más fácil cuando todo está claro.**