# 🌍 Horizonte Moderno — Plataforma Turística Prémium 3D

[![React 19](https://img.shields.io/badge/React-19.0.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.0-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-000000?logo=threedotjs&logoColor=white)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald-600.svg)](LICENSE)

**Horizonte Moderno** es una plataforma web completa de venta y reserva de paquetes turísticos prémium, inspirada en los estándares de clase mundial de la industria del turismo y la tecnología (Despegar, Airbnb Luxe, Booking). 

Diseñada con un estilo minimalista, limpio y moderno, implementa de forma rigurosa la regla de diseño **60-30-10**, superficies con efecto **Glassmorphism**, soporte completo para **Modo Claro / Modo Oscuro** y componentes interactivos **3D acelerados por GPU**.

---

## 🎨 Sistema de Diseño UI/UX: Paleta de Colores & Regla 60-30-10

La interfaz respeta la regla de proporción áurea **60-30-10**, optimizada para inspirar confianza bancaria y transmitir aventura con pleno soporte para accesibilidad **WCAG 2.1 (AA y AAA)**:

| Rol Funcional | Nombre Comercial | Proporción | HEX | RGB | HSL | Ratio WCAG | Aplicación en la Interfaz |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Dominante (Claro)** | *Blanco Caliza / Gris Niebla* | **60%** | `#F8FAFC` | `248, 250, 252` | `210°, 40%, 98%` | Base | Lienzo principal del modo claro, fondos de página y contenedores base. |
| **Dominante (Oscuro)** | *Azul Abisal / Medianoche* | **60%** | `#0F172A` | `15, 23, 42` | `222°, 47%, 11%` | Base | Lienzo del modo oscuro. Fondo cinematográfico que potencia los elementos 3D. |
| **Marca Base** | *Azul Océano Profundo / Cyan* | **30%** | `#0EA5E9` | `14, 165, 233` | `199°, 89%, 48%` | 4.6:1 (AA) | Logotipo, isotipo, títulos, iconos de navegación, partículas del globo 3D. |
| **Marca Hover** | *Azul Océano Intenso* | — | `#0284C7` | `2, 132, 199` | `201°, 96%, 39%` | 5.8:1 (AA) | Estados de foco y hover en enlaces interactivos y bordes activos. |
| **Marca Dark Glow** | *Cyan Cielo / Luminiscencia* | — | `#38BDF8` | `56, 189, 248` | `198°, 93%, 60%` | 7.9:1 (AAA) | Rutas geodésicas en Three.js y halos de luz en modo oscuro. |
| **Marca Soft Tint** | *Cyan Brisa Suave* | — | `#E0F2FE` | `224, 242, 254` | `204°, 100%, 94%` | 14.1:1 (AAA) | Fondos de pastillas de categoría activa y badges informativos. |
| **Acento CTA** | *Naranja Aventura / Atardecer* | **10%** | `#F97316` | `249, 115, 22` | `25°, 95%, 53%` | 3.5:1 (UI) | **Conversión pura:** Botones *"Reservar Ahora"*, *"Confirmar Pago"*, precios y pines. |
| **Acento Hover** | *Naranja Fuego / Terracota* | — | `#EA580C` | `234, 88, 12` | `21°, 90%, 48%` | 4.2:1 (AA) | Hover en botones de acción prioritaria. |
| **Acento Soft Tint** | *Naranja Resplandor Suave* | — | `#FFEDD5` | `255, 237, 213` | `34°, 100%, 92%` | 13.5:1 (AAA) | Badges de ofertas (*"Más Vendido"*, *"Oferta Limitada"*). |
| **Texto Principal** | *Gris Pizarra / Blanco Hielo* | — | `#1E293B` / `#F8FAFC` | — | — | >13:1 (AAA) | Lectura de alta jerarquía y contraste según el tema activo. |
| **Texto Muted** | *Gris Tormenta / Plata* | — | `#64748B` / `#94A3B8` | — | — | >4.5:1 (AA) | Párrafos descriptivos, cláusulas legales y subtítulos secundarios. |

### 🪞 Superficies Glassmorphism (`.glass-card`)
- **Modo Claro:** `rgba(255, 255, 255, 0.70)` con `backdrop-filter: blur(12px)`, borde `1px solid rgba(255, 255, 255, 0.60)` y sombra translúcida `rgba(14, 165, 233, 0.06)`.
- **Modo Oscuro:** `rgba(30, 41, 59, 0.70)` con `backdrop-filter: blur(12px)`, borde `1px solid rgba(255, 255, 255, 0.08)` y sombra profunda `rgba(0, 0, 0, 0.35)`.

---

## 🚀 Tecnologías Utilizadas

- **Frontend Core:** [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server:** [Vite](https://vitejs.dev/) con compilación Rolldown y Hot Module Replacement (HMR)
- **Motor de Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) utilizando `@tailwindcss/vite` y `@theme` tokens
- **Gráficos 3D & WebGL:** [Three.js](https://threejs.org/) (geometrías esféricas, partículas procedimentales, curvas geodésicas Bézier cuadráticas)
- **Audio Sintetizado:** Web Audio API nativo (osciladores senoidales, ruido rosa filtrado con LFO y fanfarrias)
- **Física de Partículas:** Motor Canvas 2D para explosión de confeti en celebraciones
- **Tipografías:** Google Fonts:
  - *Headings:* `Fraunces` (Serif display con elegancia editorial)
  - *Body & UI:* `Outfit` (Sans-serif geométrica de alta legibilidad)

---

## 🕹️ Funcionalidades y "Chiches" Destacados

### 1. 🌐 Globo Terráqueo 3D Interactivo (`ThreeGlobe`)
- Renderizado WebGL en tiempo real con esfera volumétrica y nube de 1.200 partículas de masa continental en Cyan `#0EA5E9`.
- Arco geodésico de rutas aéreas animadas en `#38BDF8` (`THREE.QuadraticBezierCurve3`).
- Pines 3D interactivos con ondas expansivas para cada destino turístico.
- Rotación automática continua con controles de aceleración y soporte de iluminación adaptativa según el tema claro u oscuro.

### 2. 💳 Tarjeta de Crédito 3D Volteable (`Card3D`)
- Perspectiva 3D (`perspective: 1500px`) y seguimiento giroscópico del mouse con física de inclinación (*tilt*).
- Cara frontal con acabado metálico, gradiente azul abisal, chip EMV dorado y relieve de dígitos.
- Giro realista de 180° en el eje Y que revela la banda magnética negra, panel de firma, CVV dinámico y sello holográfico de seguridad.

### 3. 🎫 Tarjeta de Embarque Isométrica 3D (`BoardingPass3D`)
- Tarjeta de abordaje en profundidad multicapa Z (`translateZ(40px)`).
- Sello de lámina holográfica irisada y código de barras electrónico verificado.
- Sello animado de impacto tras confirmación: `✓ STAMP: RESERVA CONFIRMADA · EMISIÓN 3D`.

### 4. 🌊 Motor de Sonido y Ambiente Inmersivo (Web Audio API)
- **Olas de Playa 3D:** Generador procedural de oleaje marino mediante osciladores senoidales y amortiguación LFO.
- Botón en Navbar con ecualizador de barras animadas en tiempo real (`eq-bar-1`, `eq-bar-2`, `eq-bar-3`).
- Efectos de sonido táctiles (*clics*, *woosh* al girar tarjetas y fanfarria triunfal al pagar).

### 5. 💱 Conversor de Divisas Dinámico
- Conmutador en tiempo real entre:
  - 🇺🇸 **USD ($)** — Dólares Estadounidenses
  - 🇪🇺 **EUR (€)** — Euros
  - 🇦🇷 **ARS ($)** — Pesos Argentinos
  - 🇲🇽 **MXN ($)** — Pesos Mexicanos
- Recalcula instantáneamente todos los precios, paquetes, cuotas e itinerarios.

### 6. ✨ Modal de Experiencia 3D, Clima en Vivo e Itinerario Día a Día
- **Widget de Clima Simulado:** Temperatura, porcentaje de humedad y velocidad de viento (ej. Cancún: 29°C ☀️, París: 21°C ⛅, Bali: 31°C 🌴).
- **Itinerario Interactivo Día a Día:** Pestañas navegables con actividades (traslados VIP, catamarán, cenas gourmet, arqueología privada).
- **Checklist de Inclusiones:** Hoteles 5★, traslados y asistencias.

### 7. 🛂 Pasaporte Digital Biométrico 3D (Dashboard)
- Libreta de pasaporte digital con textura de cuero y sello en **foil dorado** (*"REPÚBLICA DEL VIAJERO · HORIZONTE MODERNO"*).
- Ficha de identidad con avatar y estatus **★ SOCIO PLATINO 3D**.
- **Colección de Sellos de Inmigración Holográficos:** Cancún (México), París (Francia), Bali (Indonesia), Machu Picchu (Perú), Santorini (Grecia) y Dubai (EAU) con micro-giro 3D al posar el cursor.

### 8. 🎊 Cañón de Confeti de Partículas en Checkout
- Al completar una reserva, un cañón de 150 partículas multicolores con física de gravedad, resistencia de aire y rotación celebra la confirmación.

### 9. 🤖 Concierge de Viajes AI 3D (Widget Flotante)
- Asistente virtual flotante con pulso de radar (`animate-radar`).
- Sugerencias rápidas preconfiguradas y campo libre de preguntas con respuestas contextuales y enlaces a paquetes.

### 10. 📋 Página Completa de Términos y Condiciones
- 8 cláusulas estructuradas (Políticas 24h, Cancelaciones, Horizonte Care, Visas, Pagos 3D, GDPR).
- Buscador interactivo en vivo e índice lateral sticky con desplazamiento suave.
- Botón para imprimir o exportar como documento legal en PDF (`window.print()`).

---

## 📦 Estructura del Proyecto

```
viajaya/
├── dist/                     # Build de producción optimizado
├── node_modules/             # Dependencias npm
├── public/                   # Recursos estáticos
├── src/
│   ├── App.tsx               # Aplicación completa (Arquitectura Single-File con Vistas y 3D)
│   ├── index.css             # Directivas Tailwind v4, Glassmorphism y keyframes 3D
│   └── main.tsx              # Punto de entrada de React 19
├── index.html                # Plantilla HTML5 con viewport y Google Fonts
├── package.json              # Dependencias y scripts
├── tsconfig.json             # Configuración TypeScript
├── vite.config.ts            # Configuración de Vite con Tailwind v4
└── README.md                 # Documentación técnica oficial
```

---

## 🛠️ Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU_USUARIO/horizonte-moderno.git
   cd horizonte-moderno
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173/](http://localhost:5173/) en tu navegador.

4. **Compilar para producción:**
   ```bash
   npm run build
   ```

---

## 📄 Licencia

Este proyecto se encuentra bajo la licencia MIT. Diseñado con pasión por la excelencia estética, la innovación 3D y la experiencia de usuario.
