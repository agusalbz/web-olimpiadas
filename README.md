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

## 🎨 Sistema de Diseño UI/UX: Regla 60-30-10

La interfaz sigue una jerarquía visual armónica que balancea serenidad, confianza bancaria y estímulo de conversión:

| Rol de Color | Proporción | Modo Claro | Modo Oscuro | Propósito y Aplicación |
| :--- | :---: | :---: | :---: | :--- |
| **Dominante** | **60%** | `#F8FAFC`<br>*(Blanco Caliza)* | `#0F172A`<br>*(Azul Abisal)* | Lienzo principal, fondos de página y contenedores base. Brinda amplitud y limpieza visual. |
| **Marca & Confianza** | **30%** | `#0EA5E9`<br>*(Azul Océano/Cyan)* | `#38BDF8`<br>*(Cyan Brillante)* | Títulos principales, avatares, bordes sutiles, iconos estructurales de navegación y halos 3D. |
| **Acento & CTA** | **10%** | `#F97316`<br>*(Naranja Aventura)* | `#F97316`<br>*(Naranja Aventura)* | **Uso exclusivo de conversión:** Botones *"Reservar Ahora"*, *"Confirmar pago"*, precios destacados y tags *"Más vendido"*. |

### 🪞 Superficies Glassmorphism
- **Modo Claro:** `rgba(255, 255, 255, 0.7)` con `backdrop-filter: blur(12px)` y borde de `1px solid rgba(255, 255, 255, 0.6)`.
- **Modo Oscuro:** `rgba(30, 41, 59, 0.7)` con `backdrop-filter: blur(12px)` y borde sutil de `1px solid rgba(255, 255, 255, 0.1)`.

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
