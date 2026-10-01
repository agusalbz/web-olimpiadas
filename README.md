# 🌍 Horizonte Moderno — Plataforma Comercial y Turística
### Olimpiadas de Informática / IPP – Instancia Escolar 6to Año (E.I.C.O. N° 1)

[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-000000?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald-600.svg)](LICENSE)

**Horizonte Moderno** es una solución web comercial integral desarrollada para la Instancia Escolar de las Olimpiadas IPP. Combina una experiencia de cliente fluida con un motor relacional en almacenamiento local (`DbStorageService`) y un panel de gestión administrativa interna para el **Jefe de Ventas**, cumpliendo rigurosamente los requerimientos del pliego oficial.

---

## 🎯 Cumplimiento de Requerimientos del Pliego (Olimpiadas IPP)

| Requisito Oficial | Módulo / Funcionalidad | Descripción |
| :---: | :--- | :--- |
| **Comisión Principal** | **Carrito de Compras Multi-Producto** | Selección simultánea de paquetes, pasajes aéreos, hoteles y alquiler de autos con cálculo en tiempo real y soporte multimoneda (USD, EUR, ARS). |
| **Punto 1.3.1** | **Catálogo Dual (Gráfico vs. Lista)** | Conmutador interactivo entre la cuadrícula visual de paquetes y la **tabla técnica en lista sin imágenes**, optimizada para alto rendimiento y consulta rápida. |
| **Punto 1.3.3** | **Estado "Pendiente de Entrega"** | Tras el pago en pasarela, la orden se registra en base de datos con estado `pendiente_entrega`, reservando cupos sin emitir vouchers hasta la validación de ventas. |
| **Punto 1.3.4** | **Gestión de Pedidos del Cliente** | Desde el Dashboard, el usuario puede inspeccionar sus órdenes pendientes, **modificar observaciones/requisitos** o **cancelar el pedido** con restitución automática de stock. |
| **Puntos 1.4.1 a 1.4.6** | **Panel de Ventas (Sector Interno)** | Suite administrativa para el Jefe de Ventas: Alta de productos (1.4.1), inventario (1.4.2), bandeja de pendientes (1.4.3), despacho y entrega formal a tabla histórica (1.4.4), estado de cuenta / libro de facturación (1.4.5) y anulación (1.4.6). |
| **Nota Pág. 2** | **Auditoría Dual de Correos** | Emisión automática de correos tras cada compra (copia al pasajero y aviso a ventas) registrados en la tabla `tbl_correos_audit` con visor modal. |

---

## 🔑 Credenciales para la Mesa Evaluadora

El sistema dispone de accesos de prueba preconfigurados con un solo clic desde la pantalla de **Iniciar Sesión**:

* **👤 Pasajera (Cliente):** `evaluador@ipp.edu.ar` (o botón de acceso rápido) — Permite armar carritos, comprar, ver órdenes pendientes y modificarlas.
* **👔 Jefe de Ventas (Administrador):** `admin@viajaya.com` (o botón *"Panel Ventas"* en la barra superior) — Acceso total a despacho, stock, libro contable de facturas y auditoría de emails.

---

## 🎨 Sistema de Diseño UI/UX: Paleta 60-30-10

La interfaz respeta la regla de proporción áurea **60-30-10**, optimizada para contraste, legibilidad técnica y confort visual con soporte nativo de **Modo Claro / Modo Oscuro**:

| Rol Funcional | Nombre Técnico | Proporción | HEX | Aplicación en la Interfaz |
| :--- | :--- | :---: | :---: | :--- |
| **Dominante (Claro)** | *Slate 50* | **60%** | `#F8FAFC` | Fondo general, lienzos y contenedores base. |
| **Dominante (Oscuro)** | *Slate 950* | **60%** | `#0B0F17` | Fondo nocturno sobrio que destaca datos y componentes. |
| **Marca y Confianza** | *Sky Blue / Cyan* | **30%** | `#0284C7` | Barras de navegación, cabeceras de tablas, insignias y botones primarios. |
| **Acento y Conversión** | *Orange Action* | **10%** | `#EA580C` | Exclusivo para llamados a la acción prioritarios: *"Pagar"*, *"Añadir al Carrito"*, totales y alertas. |

---

## 🛠️ Stack Tecnológico

* **Frontend Core:** [React 19](https://react.dev/) + [TypeScript 5.7](https://www.typescriptlang.org/)
* **Bundler & Tooling:** [Vite 8](https://vitejs.dev/) con compilador Rolldown
* **Motor de Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
* **Gráficos 3D:** [Three.js](https://threejs.org/) (Globo terráqueo interactivo con rutas geodésicas y partículas)
* **Persistencia:** `DbStorageService` emulando un motor relacional en `localStorage` con claves primarias, claves foráneas e integridad referencial (7 tablas).

---

## 📦 Estructura del Código Fuente

```
viajaya/
├── src/
│   ├── components/
│   │   ├── CartDrawer.tsx       # Carrito de compras lateral multi-producto
│   │   └── SalesAdminPanel.tsx  # Panel integral del Jefe de Ventas (1.4.1 a 1.4.6)
│   ├── services/
│   │   └── dbStorage.ts         # Motor relacional LocalStorage (clientes, pedidos, stock, facturas, emails)
│   ├── App.tsx                  # Navegación, vistas (Catálogo dual, Checkout, Dashboard, Términos)
│   ├── index.css                # Tokens de diseño, tipografía Inter y modo oscuro
│   └── main.tsx                 # Entrada React 19
├── package.json
└── vite.config.ts
```

---

## 🚀 Instalación y Puesta en Marcha

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/agusalbz/web-olimpiadas.git
   cd web-olimpiadas
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Acceder a `http://localhost:5173/` en el navegador.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

**Equipo de Desarrollo — 6to Año Informática — E.I.C.O. N° 1 "Gral. Enrique Mosconi"**  
*Caleta Olivia, Santa Cruz, Argentina*
