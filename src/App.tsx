import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  DbStorageService,
  type ProductItem,
  type Order
} from './services/dbStorage';
import { CartDrawer, type CartItem } from './components/CartDrawer';
import { SalesAdminPanel } from './components/SalesAdminPanel';

// --- TYPES & INTERFACES ---
export interface Package {
  id: string;
  title: string;
  destination: string;
  country: string;
  nights: number;
  price: number; // Unit price USD
  rating: number;
  reviewsCount: number;
  tag: 'Más vendido' | 'Oferta' | 'Exclusivo' | 'Aventura' | 'Romántico' | 'Lujo';
  tagColor: string;
  image: string;
  includes: string[];
  description: string;
  highlight: string;
  lat: number;
  lon: number;
  weather: { temp: string; condition: string; humidity: string; wind: string };
  itinerary: Array<{ day: number; title: string; desc: string; icon: string }>;
}

export interface Trip {
  id: string;
  packageId: string;
  title: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  nights: number;
  passengers: number;
  bookingCode: string;
  totalPrice: number;
  status: 'upcoming' | 'completed' | 'cancelled';
  image: string;
}

export interface User {
  name: string;
  lastName: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  birthDate: string;
  passport: string;
  verified: boolean;
  avatarInitials: string;
  preferences: string[];
  points: number;
  role?: 'cliente' | 'jefe_ventas';
}

export type PageType = 'home' | 'login' | 'register' | 'dashboard' | 'profile' | 'checkout' | 'terms' | 'sales_admin';


// ==========================================
// ==========================================
// PRECIOS: EXCLUSIVAMENTE EN PESOS ARGENTINOS (ARS)
// ==========================================
export type CurrencyType = 'ARS';

const ARS_EXCHANGE_RATE = 1350;

export const formatPriceCustom = (priceUSD: number, _cur?: CurrencyType): string => {
  const converted = Math.round(priceUSD * ARS_EXCHANGE_RATE);
  return `$ ${converted.toLocaleString('es-AR')}`;
};

// No-op para llamadas sonoras residuales (sin AudioContext ni sobrecarga)
const soundFx = {
  playClick: () => {},
  playWoosh: () => {},
  playCelebration: () => {},
  toggleOceanWaves: (_enable: boolean) => {}
};

const MOCK_PACKAGES: Package[] = [
  {
    id: 'cancun-7n',
    title: 'Cancún Todo Incluido & Playas Turquesa',
    destination: 'Cancún',
    country: 'México',
    nights: 7,
    price: 1299,
    rating: 4.9,
    reviewsCount: 1420,
    tag: 'Más vendido',
    tagColor: 'bg-[#F97316] text-white shadow-sm',
    image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1200&q=80',
    includes: ['Vuelo directo', 'Resort 5★ All-Inclusive', 'Traslados in/out', 'Asistencia al viajero'],
    description: 'Disfruta de las aguas cristalinas del Caribe mexicano, fiesta, gastronomía maya y descanso total en hoteles de primera categoría frente al mar.',
    highlight: 'Cena gourmet en catamarán incluida',
    lat: 21.1619,
    lon: -86.8515,
    weather: { temp: '29°C', condition: 'Soleado Caribeño ☀️', humidity: '64%', wind: '14 km/h' },
    itinerary: [
      { day: 1, title: 'Bienvenida VIP en el Caribe', desc: 'Vuelo directo prioritario, traslado privado en SUV y check-in con cóctel en resort 5★ All-Inclusive frente al mar turquesa.', icon: '🥂' },
      { day: 2, title: 'Catamarán & Snorkel en Isla Mujeres', desc: 'Navegación exclusiva en catamarán de vela con barra libre premium y nado entre arrecifes de coral protegidos.', icon: '⛵' },
      { day: 3, title: 'Tesoros Mayas & Cenote Sagrado', desc: 'Excursión arqueológica a Tulum guiada por historiador maya y baño relajante en aguas subterráneas cristalinas.', icon: '🏛️' },
      { day: 4, title: 'Cena Gourmet & Fiesta Marina', desc: 'Cena de 5 tiempos a cargo de chef galardonado con maridaje de tequilas y noche de relax en playa privada.', icon: '🍽️' }
    ]
  },
  {
    id: 'paris-10n',
    title: 'París Soñado: Arte, Romance y Alta Cocina',
    destination: 'París',
    country: 'Francia',
    nights: 10,
    price: 2450,
    rating: 4.8,
    reviewsCount: 980,
    tag: 'Romántico',
    tagColor: 'bg-rose-500 text-white dark:bg-rose-600',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    includes: ['Vuelos internacionales', 'Hotel boutique céntrico', 'Crucero nocturno por el Sena', 'Desayunos buffet'],
    description: 'Pasea por Montmartre, contempla la Torre Eiffel iluminada y descubre las maravillas del Museo del Louvre con accesos prioritarios sin filas.',
    highlight: 'Paseo en barco con copa de champagne',
    lat: 48.8566,
    lon: 2.3522,
    weather: { temp: '21°C', condition: 'Templado & Luminoso ⛅', humidity: '52%', wind: '9 km/h' },
    itinerary: [
      { day: 1, title: 'Arribo a la Ciudad Luz', desc: 'Vuelo internacional nocturno, recepción con chófer privado hacia hotel boutique con vista a los tejados de París.', icon: '🗼' },
      { day: 2, title: 'Louvre Secreto & Montmartre', desc: 'Acceso VIP sin filas a la Mona Lisa y recorrido bohemio por la Plaza de los Pintores y Sacré-Cœur.', icon: '🎨' },
      { day: 3, title: 'Crucero Nocturno por el Sena', desc: 'Navegación bajo los puentes históricos con copa de champagne Moët y cena a la luz de las velas frente a la Torre Eiffel.', icon: '🍾' },
      { day: 4, title: 'Alta Gastronomía & Versalles', desc: 'Excursión exclusiva a los jardines reales de Luis XIV y degustación de pastelería fina francesa.', icon: '🏰' }
    ]
  },
  {
    id: 'bali-8n',
    title: 'Bali Místico: Templos, Selva y Playas',
    destination: 'Bali',
    country: 'Indonesia',
    nights: 8,
    price: 1890,
    rating: 4.9,
    reviewsCount: 830,
    tag: 'Aventura',
    tagColor: 'bg-amber-600 text-white dark:bg-amber-700',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    includes: ['Vuelos con escalas cortas', 'Villa privada con piscina', 'Tours guiados a cascadas', 'Guía en español'],
    description: 'Una experiencia transformadora entre arrozales escalonados de Ubud, templos ancestrales sobre el mar y las mejores olas de Uluwatu.',
    highlight: 'Sesión de yoga y masaje balinés tradicional',
    lat: -8.4095,
    lon: 115.1889,
    weather: { temp: '31°C', condition: 'Brisa Tropical 🌴', humidity: '74%', wind: '11 km/h' },
    itinerary: [
      { day: 1, title: 'Refugio entre Arrozales de Ubud', desc: 'Check-in en villa de bambú con piscina infinity privada y ceremonia balinesa de bienvenida.', icon: '🌺' },
      { day: 2, title: 'Templos Sagrados & Yoga al Amanecer', desc: 'Sesión de meditación matutina y visita espiritual a los templos sobre el agua de Tanah Lot y Tirta Empul.', icon: '🧘' },
      { day: 3, title: 'Cascadas Ocultas & Terrazas de Tegalalang', desc: 'Ruta en jeep 4x4 por selvas vírgenes con parada en columpio panorámico y almuerzo orgánico.', icon: '🌿' },
      { day: 4, title: 'Masaje Balinés & Playa de Uluwatu', desc: 'Spa de 2 horas con aceites esenciales y atardecer con danzas de fuego Kecak sobre los acantilados.', icon: '🌊' }
    ]
  },
  {
    id: 'machu-picchu-6n',
    title: 'Machu Picchu Mágico & Tesoros Incas',
    destination: 'Machu Picchu',
    country: 'Perú',
    nights: 6,
    price: 1650,
    rating: 4.9,
    reviewsCount: 1150,
    tag: 'Exclusivo',
    tagColor: 'bg-[#0EA5E9] text-white shadow-sm',
    image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&w=1200&q=80',
    includes: ['Vuelo + Tren Vistadome 360°', 'Hoteles en Cusco & Valle', 'Entradas oficiales al santuario', 'Guía arqueológico privado'],
    description: 'Conéctate con la energía mística de los Andes, el Valle Sagrado de los Incas y la maravilla del mundo moderno con transporte VIP panorámico.',
    highlight: 'Boleto tren panorámico de lujo con show en vivo',
    lat: -13.1631,
    lon: -72.545,
    weather: { temp: '19°C', condition: 'Despejado de Altura ⛰️', humidity: '44%', wind: '6 km/h' },
    itinerary: [
      { day: 1, title: 'Cusco Histórico & Climatización', desc: 'Llegada a la capital del Imperio Inca, alojamiento en monasterio colonial y merienda con té de coca.', icon: '🏔️' },
      { day: 2, title: 'Tren Panorámico Vistadome 360°', desc: 'Viaje a través del cañón del río Urubamba con show de danza tradicional a bordo y vistas increíbles.', icon: '🚂' },
      { day: 3, title: 'Santuario de Machu Picchu en Privado', desc: 'Entrada prioritaria al amanecer con arqueólogo exclusivo, contemplando el Huayna Picchu sin multitudes.', icon: '☀️' },
      { day: 4, title: 'Gastronomía Andina & Valle Sagrado', desc: 'Cata de cocina novoandina de altura y visita a los telares milenarios de Chinchero.', icon: '🌽' }
    ]
  },
  {
    id: 'santorini-9n',
    title: 'Santorini & Islas Griegas de Ensueño',
    destination: 'Santorini',
    country: 'Grecia',
    nights: 9,
    price: 2890,
    rating: 5.0,
    reviewsCount: 640,
    tag: 'Lujo',
    tagColor: 'bg-[#0EA5E9] text-white shadow-sm',
    image: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
    includes: ['Vuelo + Ferry de alta velocidad', 'Suite con vista a la Caldera', 'Tour privado en catamarán', 'Cata de vinos al atardecer'],
    description: 'Cúpulas azules, atardeceres legendarios en Oia y gastronomía mediterránea inolvidable en el destino más exclusivo del Mar Egeo.',
    highlight: 'Degustación privada en viñedo volcánico',
    lat: 36.3932,
    lon: 25.4615,
    weather: { temp: '26°C', condition: 'Cielos Celestes ☀️', humidity: '50%', wind: '15 km/h' },
    itinerary: [
      { day: 1, title: 'Oia & Cúpulas Azules', desc: 'Instalación en suite cueva excavada en el acantilado con jacuzzi infinito mirando a la Caldera volcánica.', icon: '🇬🇷' },
      { day: 2, title: 'Travesía en Yate & Aguas Termales', desc: 'Baño en fuentes termales submarinas del volcán y barbacoa marina de pescado fresco a bordo.', icon: '⛵' },
      { day: 3, title: 'Viñedos Volcánicos & Atardecer', desc: 'Degustación privada de vino blanco Assyrtiko en terraza panorámica durante el atardecer más famoso del mundo.', icon: '🍷' },
      { day: 4, title: 'Pueblos de Pescadores de Ammoudi', desc: 'Descenso a la caleta de Ammoudi para saborear pulpo a las brasas y tiempo libre para compras boutique.', icon: '🐙' }
    ]
  },
  {
    id: 'dubai-7n',
    title: 'Dubai Futurista: Rascacielos y Desierto',
    destination: 'Dubai',
    country: 'Emiratos Árabes',
    nights: 7,
    price: 3100,
    rating: 4.8,
    reviewsCount: 510,
    tag: 'Oferta',
    tagColor: 'bg-[#F97316] text-white shadow-sm',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    includes: ['Vuelo con Emirates', 'Hotel 5★ en Dubai Marina', 'Safari 4x4 en dunas con cena', 'Entrada al Burj Khalifa nivel 124'],
    description: 'Asómbrate con la arquitectura más audaz del planeta, compras de primer nivel mundial y la magia de una noche estrellada en el desierto árabe.',
    highlight: 'Cena beduina con espectáculo bajo las estrellas',
    lat: 25.2048,
    lon: 55.2708,
    weather: { temp: '34°C', condition: 'Calor Sofisticado ☀️', humidity: '36%', wind: '12 km/h' },
    itinerary: [
      { day: 1, title: 'Rascacielos & Superlujo', desc: 'Llegada con servicio Fast-Track en aeropuerto y check-in en resort 5★ sobre la marina futurista.', icon: '🏙️' },
      { day: 2, title: 'Burj Khalifa Nivel 124 & Fuentes', desc: 'Vistas panorámicas desde el edificio más alto del planeta y espectáculo de aguas danzantes con luces LED.', icon: '✨' },
      { day: 3, title: 'Safari en Dunas & Campamento Beduino', desc: 'Conducción en 4x4 sobre las arenas rojas, cetrería tradicional y cena bajo las estrellas con música árabe.', icon: '🐪' },
      { day: 4, title: 'Yate Privado por Palm Jumeirah', desc: 'Navegación alrededor de la famosa isla palmera admirando el Atlantis The Royal.', icon: '🛥️' }
    ]
  }
];

const INITIAL_USER: User = {
  name: 'María',
  lastName: 'González',
  email: 'maria.gonzalez@horizontemoderno.com',
  phone: '+54 9 11 4829-1928',
  country: 'Argentina',
  city: 'Buenos Aires',
  birthDate: '1994-08-15',
  passport: 'PAS-982341',
  verified: true,
  avatarInitials: 'MG',
  preferences: ['Playa', 'Ciudad', 'Cultural', 'Gastronomía'],
  points: 14850,
  role: 'cliente'
};

const SALES_MANAGER_USER: User = {
  name: 'Carlos',
  lastName: 'Méndez',
  email: 'jefeventas@horizontemoderno.com',
  phone: '+54 9 11 9876-5432',
  country: 'Argentina',
  city: 'Buenos Aires',
  birthDate: '1985-03-22',
  passport: 'ARG-5544332',
  verified: true,
  avatarInitials: 'CM',
  preferences: ['Gestión Comercial', 'Ventas', 'Operaciones'],
  points: 0,
  role: 'jefe_ventas'
};

const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip-1',
    packageId: 'cancun-7n',
    title: 'Cancún Todo Incluido & Playas Turquesa',
    destination: 'Cancún, México',
    departureDate: '15 Nov, 2026',
    returnDate: '22 Nov, 2026',
    nights: 7,
    passengers: 2,
    bookingCode: 'VY-98241',
    totalPrice: 2598,
    status: 'upcoming',
    image: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'trip-2',
    packageId: 'paris-10n',
    title: 'París Soñado: Arte, Romance y Alta Cocina',
    destination: 'París, Francia',
    departureDate: '10 May, 2026',
    returnDate: '20 May, 2026',
    nights: 10,
    passengers: 2,
    bookingCode: 'VY-77192',
    totalPrice: 4900,
    status: 'completed',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'trip-3',
    packageId: 'bali-8n',
    title: 'Bali Místico: Templos, Selva y Playas',
    destination: 'Bali, Indonesia',
    departureDate: '14 Sep, 2025',
    returnDate: '22 Sep, 2025',
    nights: 8,
    passengers: 2,
    bookingCode: 'VY-55209',
    totalPrice: 3780,
    status: 'completed',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80'
  }
];

// =========================================================
// 🚀 COMPONENTE 3D: INTERACTIVE 3D TILT CONTAINER
// =========================================================
interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
}

function TiltCard({ children, className = '' }: TiltCardProps) {
  return (
    <div className={`transition-all duration-200 ${className}`}>
      {children}
    </div>
  );
}

// =========================================================
// 🌍 COMPONENTE 3D: THREE.JS INTERACTIVE GLOBE
// =========================================================
interface ThreeGlobeProps {
  isDarkMode: boolean;
  onSelectDestination?: (pkg: Package) => void;
  packages: Package[];
}

function ThreeGlobe({ isDarkMode, onSelectDestination, packages }: ThreeGlobeProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activePin, setActivePin] = useState<Package | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 400;

    // SCENE, CAMERA, RENDERER
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 210;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // COLORS FROM USER PALETTES
    const primaryGlow = isDarkMode ? 0x0ea5e9 : 0x0284c7;
    const surfaceColor = isDarkMode ? 0x0f172a : 0xf1f5f9;
    const pinColorHex = 0xf97316; // Accent Orange

    // 1. MAIN GLOBE SPHERE
    const globeRadius = 65;
    const sphereGeo = new THREE.SphereGeometry(globeRadius, 40, 40);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: surfaceColor,
      transparent: true,
      opacity: isDarkMode ? 0.35 : 0.45,
      wireframe: true
    });
    const globe = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(globe);

    // 2. INNER GLOWING CORE
    const innerGeo = new THREE.SphereGeometry(globeRadius * 0.98, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: isDarkMode ? 0x0f172a : 0xf8fafc,
      transparent: true,
      opacity: 0.85
    });
    const innerCore = new THREE.Mesh(innerGeo, innerMat);
    scene.add(innerCore);

    // 3. ATMOSPHERIC HALO
    const haloGeo = new THREE.SphereGeometry(globeRadius * 1.15, 32, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: primaryGlow,
      transparent: true,
      opacity: isDarkMode ? 0.12 : 0.08,
      side: THREE.BackSide
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    scene.add(halo);

    // 4. PROCEDURAL DOT MATRIX (LANDMASS SIMULATION)
    const dotsCount = 1200;
    const dotPositions = new Float32Array(dotsCount * 3);
    for (let i = 0; i < dotsCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / dotsCount);
      const theta = Math.sqrt(dotsCount * Math.PI) * phi;
      const r = globeRadius * 1.01;

      dotPositions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
      dotPositions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
      dotPositions[i * 3 + 2] = r * Math.cos(phi);
    }
    const dotsGeo = new THREE.BufferGeometry();
    dotsGeo.setAttribute('position', new THREE.BufferAttribute(dotPositions, 3));
    const dotsMat = new THREE.PointsMaterial({
      color: primaryGlow,
      size: isDarkMode ? 1.4 : 1.2,
      transparent: true,
      opacity: 0.65
    });
    const dotCloud = new THREE.Points(dotsGeo, dotsMat);
    globe.add(dotCloud);

    // CONVERT LAT / LON TO 3D CARTESIAN
    const latLonToVec3 = (lat: number, lon: number, radius: number): THREE.Vector3 => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    // 5. DESTINATION 3D PINS & PULSING RINGS
    const pinsGroup = new THREE.Group();
    const pinRings: THREE.Mesh[] = [];

    packages.forEach((pkg) => {
      const pos = latLonToVec3(pkg.lat, pkg.lon, globeRadius * 1.02);

      // Pin Head (Sphere)
      const pinGeo = new THREE.SphereGeometry(2.2, 16, 16);
      const pinMat = new THREE.MeshBasicMaterial({ color: pinColorHex });
      const pinMesh = new THREE.Mesh(pinGeo, pinMat);
      pinMesh.position.copy(pos);
      pinsGroup.add(pinMesh);

      // Pin Base Ring
      const ringGeo = new THREE.RingGeometry(2.5, 4, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: pinColorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(new THREE.Vector3(0, 0, 0));
      pinsGroup.add(ringMesh);
      pinRings.push(ringMesh);
    });

    globe.add(pinsGroup);

    // 6. 3D FLIGHT ARCS (CURVAS DE VUELO EN 3D)
    const arcGroup = new THREE.Group();
    for (let i = 0; i < packages.length; i++) {
      const p1 = packages[i];
      const p2 = packages[(i + 1) % packages.length];

      const v1 = latLonToVec3(p1.lat, p1.lon, globeRadius);
      const v2 = latLonToVec3(p2.lat, p2.lon, globeRadius);

      const mid = v1.clone().add(v2).multiplyScalar(0.5);
      const dist = v1.distanceTo(v2);
      mid.normalize().multiplyScalar(globeRadius + dist * 0.28);

      const curve = new THREE.QuadraticBezierCurve3(v1, mid, v2);
      const points = curve.getPoints(36);
      const arcGeo = new THREE.BufferGeometry().setFromPoints(points);
      const arcMat = new THREE.LineBasicMaterial({
        color: isDarkMode ? 0x38bdf8 : 0x0ea5e9,
        transparent: true,
        opacity: 0.55
      });
      const arcLine = new THREE.Line(arcGeo, arcMat);
      arcGroup.add(arcLine);
    }
    globe.add(arcGroup);

    // 7. INTERACTION: MOUSE DRAG & ORBIT
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let rotSpeed = { x: 0.002, y: 0.001 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMousePos.x;
      const deltaY = e.clientY - prevMousePos.y;

      globe.rotation.y += deltaX * 0.005;
      globe.rotation.x += deltaY * 0.005;

      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const domEl = renderer.domElement;
    domEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // ANIMATION LOOP
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Auto rotation
      if (!isDragging) {
        globe.rotation.y += rotSpeed.y;
        globe.rotation.x += Math.sin(elapsed * 0.5) * 0.0003;
      }

      // Pulsing rings
      pinRings.forEach((r, idx) => {
        const s = 1 + 0.3 * Math.sin(elapsed * 4 + idx);
        r.scale.set(s, s, s);
      });

      renderer.render(scene, camera);
    };

    animate();

    // RESIZE LISTENER
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      domEl.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.innerHTML = '';
      }
    };
  }, [isDarkMode, packages]);

  return (
    <div className="relative w-full h-[360px] sm:h-[440px] flex items-center justify-center select-none">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D HUD Indicators */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-[#1E293B]/80 backdrop-blur-md border border-[#E2E8F0] dark:border-[#334155] text-[11px] font-semibold text-[#1E293B] dark:text-[#E2E8F0] shadow-md pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-[#F97316] animate-ping" />
        <span>Globo 3D Interactivo · Arrastra para girar</span>
      </div>

      {/* Destination Quick Selector Chips */}
      <div className="absolute bottom-2 inset-x-2 z-10 flex items-center justify-center gap-1.5 flex-wrap pointer-events-auto">
        {packages.map((pkg) => (
          <button
            key={pkg.id}
            onClick={() => {
              setActivePin(pkg);
              if (onSelectDestination) onSelectDestination(pkg);
            }}
            className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer shadow-xs border bg-white/85 hover:bg-[#F1F5F9] text-[#1E293B] border-[#E2E8F0] dark:bg-[#0F172A]/85 dark:hover:bg-[#1E293B] dark:text-[#E2E8F0] dark:border-[#334155] hover:scale-105 active:scale-95"
          >
            📍 {pkg.destination}
          </button>
        ))}
      </div>

      {/* Tooltip if clicked pin */}
      {activePin && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border border-[#E2E8F0] dark:border-[#334155] p-3 rounded-2xl shadow-2xl text-center space-y-1 animate-scaleIn pointer-events-auto">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#F97316]">
            Destino Seleccionado en 3D
          </span>
          <h4 className="text-sm font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0]">
            {activePin.destination}, {activePin.country}
          </h4>
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
            Desde ${activePin.price} USD · {activePin.nights} noches
          </p>
          <button
            onClick={() => setActivePin(null)}
            className="mt-1 px-3 py-0.5 rounded-md text-[10px] font-bold bg-[#0EA5E9] dark:bg-[#334155] text-white"
          >
            Cerrar
          </button>
        </div>
      )}
    </div>
  );
}

// =========================================================
// 💳 COMPONENTE 3D: FLIPPABLE CREDIT CARD EN 3D
// =========================================================
interface Card3DProps {
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
  isFlipped: boolean;
  onFlipToggle: () => void;
}

function Card3D({ cardNumber, cardHolder, expiry, cvv, isFlipped, onFlipToggle }: Card3DProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-full max-w-sm h-52 perspective-1000 cursor-pointer select-none"
        onClick={onFlipToggle}
        title="Haz clic para voltear la tarjeta"
      >
        <div
          style={{
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.5s ease-out'
          }}
          className="relative w-full h-full preserve-3d rounded-xl shadow-md"
        >
          {/* FRONT FACE OF CARD */}
          <div className="absolute inset-0 backface-hidden rounded-xl bg-slate-900 p-6 text-white flex flex-col justify-between overflow-hidden border border-slate-700">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                {/* Clean EMV Chip */}
                <div className="w-10 h-7 rounded-sm bg-amber-400/90 p-1 flex items-center justify-center border border-amber-600/40">
                  <div className="w-full h-full border border-amber-900/30 rounded-2xs flex flex-col justify-between">
                    <div className="border-b border-amber-900/30 h-1/2" />
                  </div>
                </div>
                <span className="text-[11px] tracking-wider text-slate-400 uppercase font-medium">
                  Horizonte Pay
                </span>
              </div>
              <span className="text-lg font-bold tracking-wider text-white">VISA</span>
            </div>

            <div className="relative z-10">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                Número de tarjeta
              </span>
              <p className="text-lg font-mono tracking-widest text-white font-medium">
                {cardNumber || '•••• •••• •••• ••••'}
              </p>
            </div>

            <div className="flex items-center justify-between relative z-10 text-xs">
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Titular</span>
                <p className="font-semibold tracking-wide truncate max-w-[180px] text-slate-100">
                  {cardHolder || 'NOMBRE APELLIDO'}
                </p>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Vence</span>
                <p className="font-mono font-semibold text-slate-100">{expiry || 'MM/AA'}</p>
              </div>
            </div>
          </div>

          {/* BACK FACE OF CARD */}
          <div
            style={{ transform: 'rotateY(180deg)' }}
            className="absolute inset-0 backface-hidden rounded-xl bg-slate-900 py-5 text-white flex flex-col justify-between overflow-hidden border border-slate-700"
          >
            {/* Magnetic Stripe */}
            <div className="w-full h-10 bg-black/90" />

            {/* Signature & CVV Panel */}
            <div className="px-6 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-8 bg-slate-100 rounded-xs flex items-center justify-end px-3">
                  <span className="font-mono font-bold text-slate-900 text-xs tracking-wider">
                    {cvv ? `CVV: ${cvv}` : 'CVV: •••'}
                  </span>
                </div>
              </div>

              <p className="text-[9px] text-slate-400 leading-tight">
                Transacción segura encriptada. No compartas tu código CVV.
              </p>
            </div>

            <div className="px-6 flex justify-between items-center text-[10px] text-slate-400">
              <span>Soporte: 0800-HORIZONTE</span>
              <span className="font-mono font-medium">EMV</span>
            </div>
          </div>
        </div>
      </div>

      {/* Button to flip card */}
      <button
        type="button"
        onClick={onFlipToggle}
        className="px-3 py-1 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer flex items-center gap-1.5"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{isFlipped ? 'Ver frente' : 'Girar para ver reverso (CVV)'}</span>
      </button>
    </div>
  );
}

// =========================================================
// 🎫 COMPONENTE 3D: BOARDING PASS ISOMÉTRICO EN 3D
// =========================================================
function BoardingPass3D({ trip, user }: { trip: Trip; user: User }) {
  return (
    <div className="w-full">
      <div className="relative rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-[#0284C7] dark:text-sky-400 flex items-center justify-center font-bold text-sm border border-sky-100 dark:border-sky-900/40">
              ✈
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                Vuelo Internacional Confirmado
              </span>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {trip.title}
              </h3>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-mono font-semibold">
            TARJETA DE EMBARQUE
          </span>
        </div>

        <div className="space-y-5">
          {/* Route Graphic */}
          <div className="flex items-center justify-between py-3 border-y border-dashed border-slate-200 dark:border-slate-800">
            <div className="text-left">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">ORIG</span>
              <p className="text-xs text-slate-500">Salida</p>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">{trip.departureDate}</p>
            </div>

            <div className="flex-1 flex flex-col items-center px-4">
              <div className="w-full flex items-center justify-center gap-2 text-xs text-slate-500">
                <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
                <span className="font-medium text-[11px] text-[#0284C7] dark:text-sky-400">✈ {trip.nights} Noches</span>
                <div className="flex-1 border-t border-slate-200 dark:border-slate-700" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 font-mono uppercase">Directo · Clase Turista</span>
            </div>

            <div className="text-right">
              <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">DEST</span>
              <p className="text-xs text-slate-500">{trip.destination}</p>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 mt-0.5">{trip.returnDate}</p>
            </div>
          </div>

          {/* Passenger & Booking Code */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-medium">Pasajero</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{user.name} {user.lastName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-medium">Pasaporte</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{user.passport}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-medium">Reserva</span>
              <span className="font-mono font-bold text-[#EA580C]">#{trip.bookingCode}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-slate-400 block font-medium">Asiento / Puerta</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">12A · Puerta 4B</span>
            </div>
          </div>

          {/* Barcode Strip */}
          <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <div className="flex gap-1 h-7 items-center opacity-70">
              <div className="w-1 h-full bg-slate-800 dark:bg-slate-300" />
              <div className="w-2 h-full bg-slate-800 dark:bg-slate-300" />
              <div className="w-0.5 h-full bg-slate-800 dark:bg-slate-300" />
              <div className="w-1.5 h-full bg-slate-800 dark:bg-slate-300" />
              <div className="w-3 h-full bg-slate-800 dark:bg-slate-300" />
              <div className="w-1 h-full bg-slate-800 dark:bg-slate-300" />
              <div className="w-0.5 h-full bg-slate-800 dark:bg-slate-300" />
              <div className="w-2 h-full bg-slate-800 dark:bg-slate-300" />
              <div className="w-1.5 h-full bg-slate-800 dark:bg-slate-300" />
              <div className="w-0.5 h-full bg-slate-800 dark:bg-slate-300" />
              <div className="w-2 h-full bg-slate-800 dark:bg-slate-300" />
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              VERIFICADO ELECTRÓNICAMENTE · HORIZONTE MODERNO
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// 🚀 MAIN APP COMPONENT
// =========================================================
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('horizontemoderno_theme');
      if (savedTheme) return savedTheme === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const currency: CurrencyType = 'ARS';
  const [detailPackage, setDetailPackage] = useState<Package | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('horizontemoderno_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('horizontemoderno_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Navigation State
  const [page, setPage] = useState<PageType>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // User & Booking State
  const [user, setUser] = useState<User | null>(INITIAL_USER);
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(MOCK_PACKAGES[0]);
  const [paymentDone, setPaymentDone] = useState<boolean>(false);
  const [lastBookingCode, setLastBookingCode] = useState<string>('VY-83921');

  // Carrito de Compras (Encargo Principal Olimpiadas IPP)
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('hm_cart');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('hm_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Persistencia de Órdenes y Base de Datos Local
  const [dbOrders, setDbOrders] = useState<Order[]>(() => DbStorageService.getOrders());
  const refreshDbOrders = () => {
    setDbOrders(DbStorageService.getOrders());
  };

  useEffect(() => {
    DbStorageService.initDatabase();
    refreshDbOrders();
  }, []);

  const handleAddToCart = (item: ProductItem | Package, quantity: number = 1) => {
    soundFx.playClick();
    let product: ProductItem;
    if ('codigo' in item) {
      product = item;
    } else {
      product = {
        codigo: item.id.toUpperCase(),
        nombre: item.title,
        descripcion: item.description,
        categoria: 'paquete',
        precioUnitario: item.price,
        stock: 12,
        imagen: item.image,
        noches: item.nights,
        incluye: item.includes,
        rating: item.rating,
        highlight: item.highlight
      };
    }

    setCartItems((prev) => {
      const existing = prev.find((ci) => ci.producto.codigo === product.codigo);
      if (existing) {
        return prev.map((ci) =>
          ci.producto.codigo === product.codigo
            ? { ...ci, cantidad: ci.cantidad + quantity, subtotal: (ci.cantidad + quantity) * ci.producto.precioUnitario }
            : ci
        );
      } else {
        return [...prev, { producto: product, cantidad: quantity, subtotal: quantity * product.precioUnitario }];
      }
    });

    showToast(`🛒 "${product.nombre}" agregado al carrito`);
  };

  const handleUpdateCartQuantity = (codigo: string, delta: number) => {
    soundFx.playClick();
    setCartItems((prev) =>
      prev
        .map((ci) => {
          if (ci.producto.codigo === codigo) {
            const newQty = ci.cantidad + delta;
            if (newQty <= 0) return null;
            return { ...ci, cantidad: newQty, subtotal: newQty * ci.producto.precioUnitario };
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveFromCart = (codigo: string) => {
    soundFx.playClick();
    setCartItems((prev) => prev.filter((ci) => ci.producto.codigo !== codigo));
    showToast('Servicio quitado del carrito');
  };

  const handleClearCart = () => {
    if (window.confirm('¿Seguro que deseas vaciar todos los servicios del carrito?')) {
      setCartItems([]);
      showToast('Carrito vaciado');
    }
  };

  const handleCheckoutCart = () => {
    if (cartItems.length === 0) {
      showToast('Tu carrito está vacío. Agrega algún paquete o servicio primero.');
      return;
    }
    setPaymentDone(false);
    if (!user) {
      showToast('Por favor, inicia sesión para continuar con el cobro.');
      navigateTo('login');
    } else {
      navigateTo('checkout');
    }
  };

  // Search filter state in Home
  const [searchDestination, setSearchDestination] = useState<string>('');
  const [searchDates, setSearchDates] = useState<string>('2026-11-15');
  const [searchPassengers, setSearchPassengers] = useState<number>(2);
  const [activeFilterTag, setActiveFilterTag] = useState<string>('Todos');

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const navigateTo = (targetPage: PageType) => {
    setPage(targetPage);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookNow = (pkg: Package) => {
    setSelectedPackage(pkg);
    setPaymentDone(false);
    if (!user) {
      showToast('Por favor, inicia sesión para continuar con tu reserva.');
      navigateTo('login');
    } else {
      navigateTo('checkout');
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-outfit antialiased transition-colors duration-300 ${
        isDarkMode ? 'dark bg-[#0F172A] text-[#E2E8F0]' : 'bg-[#F8FAFC] text-[#1E293B]'
      } selection:bg-[#F97316]/25 selection:text-[#F97316]`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-[#E2E8F0] dark:bg-[#1E293B] dark:border-[#334155] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-[#334155] animate-bounce">
          <svg className="w-5 h-5 text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2.5 text-left cursor-pointer focus:outline-hidden"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0284C7] flex items-center justify-center text-white font-bold shadow-xs">
              <svg className="w-4 h-4 transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Horizonte<span className="text-[#0284C7] ml-0.5">Moderno</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Plataforma Turística
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links & Controls */}
          <div className="hidden md:flex items-center gap-3">
            <nav className="flex items-center gap-4 mr-2">
              <button
                onClick={() => navigateTo('home')}
                className={`text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  page === 'home'
                    ? 'text-[#0284C7] dark:text-sky-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Catálogo
              </button>

              {user && (
                <button
                  onClick={() => navigateTo('dashboard')}
                  className={`text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    page === 'dashboard'
                      ? 'text-[#0284C7] dark:text-sky-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Mis Viajes
                </button>
              )}
            </nav>

            {/* THEME TOGGLE */}
            <button
              onClick={toggleTheme}
              aria-label="Cambiar tema de color"
              className="p-1.5 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer text-xs font-medium flex items-center gap-1.5"
              title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              <span>{isDarkMode ? '☀️' : '🌙'}</span>
              <span className="hidden lg:inline">{isDarkMode ? 'Claro' : 'Oscuro'}</span>
            </button>

            {/* 🛒 BOTÓN CARRITO DE COMPRAS */}
            <button
              onClick={() => {
                soundFx.playClick();
                setIsCartOpen(true);
              }}
              className="relative p-1.5 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:border-[#0284C7] transition cursor-pointer flex items-center gap-1.5"
              title="Carrito de compras"
            >
              <svg className="w-4 h-4 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="text-xs font-semibold">Carrito</span>
              {cartItems.reduce((acc, it) => acc + it.cantidad, 0) > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#EA580C] text-white text-[10px] font-bold">
                  {cartItems.reduce((acc, it) => acc + it.cantidad, 0)}
                </span>
              )}
            </button>

            {/* 👔 ACCESO AL PANEL DE VENTAS */}
            <button
              onClick={() => {
                soundFx.playClick();
                navigateTo('sales_admin');
              }}
              className={`p-1.5 px-2.5 rounded-md border text-xs font-medium transition flex items-center gap-1.5 cursor-pointer ${
                page === 'sales_admin'
                  ? 'bg-[#0284C7] text-white border-[#0284C7]'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#0284C7]'
              }`}
              title="Panel del Jefe de Ventas (Punto 1.4)"
            >
              <span>Ventas</span>
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            {user ? (
              <div className="flex items-center gap-2">
                {/* Profile Button */}
                <button
                  onClick={() => navigateTo('profile')}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-slate-200 dark:border-slate-700 cursor-pointer"
                  title="Mi Perfil"
                >
                  <div className="w-5 h-5 rounded-full bg-slate-800 text-white text-[10px] font-semibold flex items-center justify-center">
                    {user.avatarInitials}
                  </div>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
                    {user.name}
                  </span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setUser(null);
                    showToast('Has cerrado sesión correctamente');
                    navigateTo('home');
                  }}
                  className="text-xs text-slate-500 hover:text-red-500 transition cursor-pointer p-1.5"
                  title="Cerrar sesión"
                >
                  Salir
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateTo('login')}
                  className="text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-[#0284C7] transition cursor-pointer px-2 py-1"
                >
                  Ingresar
                </button>
                <button
                  onClick={() => navigateTo('register')}
                  className="px-3 py-1.5 rounded-md bg-[#EA580C] hover:bg-[#C2410C] text-white font-medium text-xs transition-colors cursor-pointer"
                >
                  Registrarse
                </button>
              </div>
            )}
          </div>

          {/* Mobile Actions Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => {
                soundFx.playClick();
                setIsCartOpen(true);
              }}
              className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 relative"
            >
              <svg className="w-4 h-4 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItems.reduce((acc, it) => acc + it.cantidad, 0) > 0 && (
                <span className="absolute -top-1 -right-1 px-1 rounded-full bg-[#EA580C] text-white text-[9px] font-bold">
                  {cartItems.reduce((acc, it) => acc + it.cantidad, 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] px-4 pt-3 pb-6 space-y-3 shadow-xl">
            <button
              onClick={() => navigateTo('home')}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-[#1E293B] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] font-medium"
            >
              Explorar Paquetes
            </button>

            <button
              onClick={() => {
                setIsCartOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 rounded-lg text-[#1E293B] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] font-bold flex items-center justify-between"
            >
              <span>🛒 Carrito de Compras</span>
              {cartItems.reduce((acc, it) => acc + it.cantidad, 0) > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#F97316] text-white text-xs font-bold">
                  {cartItems.reduce((acc, it) => acc + it.cantidad, 0)}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                navigateTo('sales_admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 rounded-lg text-[#0EA5E9] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] font-bold flex items-center gap-2"
            >
              <span>👔 Panel del Jefe de Ventas</span>
            </button>


            {user ? (
              <>
                <button
                  onClick={() => navigateTo('dashboard')}
                  className="block w-full text-left py-2.5 px-3 rounded-lg text-[#1E293B] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] font-medium"
                >
                  Mis Viajes
                </button>
                <button
                  onClick={() => navigateTo('profile')}
                  className="block w-full text-left py-2.5 px-3 rounded-lg text-[#1E293B] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] font-medium"
                >
                  Mi Perfil ({user.name} {user.lastName})
                </button>
                <button
                  onClick={() => {
                    setUser(null);
                    setMobileMenuOpen(false);
                    showToast('Has cerrado sesión correctamente');
                    navigateTo('home');
                  }}
                  className="block w-full text-left py-2.5 px-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold"
                >
                  Cerrar Sesión
                </button>
              </>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => navigateTo('login')}
                  className="w-full py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] font-semibold text-[#1E293B] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] text-center"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => navigateTo('register')}
                  className="w-full py-2.5 rounded-xl bg-[#F97316] text-white font-semibold text-center shadow-sm"
                >
                  Crear Cuenta Gratis
                </button>
              </div>
            )}
          </div>
        )}
      </header>


      {/* MAIN VIEW CONTENT */}
      <main className="flex-1">
        {page === 'home' && (
          <HomePage
            packages={MOCK_PACKAGES}
            onBookNow={handleBookNow}
            onAddToCart={handleAddToCart}
            onNavigateRegister={() => navigateTo('register')}
            isLoggedIn={!!user}
            searchDestination={searchDestination}
            setSearchDestination={setSearchDestination}
            searchDates={searchDates}
            setSearchDates={setSearchDates}
            searchPassengers={searchPassengers}
            setSearchPassengers={setSearchPassengers}
            activeFilterTag={activeFilterTag}
            setActiveFilterTag={setActiveFilterTag}
            isDarkMode={isDarkMode}
            currency={currency}
            onExplore3D={(p) => setDetailPackage(p)}
          />
        )}

        {page === 'login' && (
          <LoginPage
            onLoginSuccess={(email) => {
              if (email === 'jefeventas@horizontemoderno.com') {
                setUser(SALES_MANAGER_USER);
                showToast('¡Sesión iniciada como Jefe de Ventas!');
                navigateTo('sales_admin');
                return;
              }
              if (!user) {
                setUser({
                  ...INITIAL_USER,
                  email: email || INITIAL_USER.email
                });
              }
              showToast(`¡Bienvenido de nuevo!`);
              if (cartItems.length > 0 || selectedPackage) {
                navigateTo('checkout');
              } else {
                navigateTo('dashboard');
              }
            }}
            onLoginAsSalesAdmin={() => {
              setUser(SALES_MANAGER_USER);
              showToast('Sesión iniciada como Jefe de Ventas (Credenciales de Prueba)');
              navigateTo('sales_admin');
            }}
            onNavigateRegister={() => navigateTo('register')}
          />
        )}

        {page === 'register' && (
          <RegisterPage
            onNavigateTerms={() => navigateTo('terms')}
            onRegisterSuccess={(newUser) => {
              setUser(newUser);
              showToast('¡Cuenta creada exitosamente!');
              if (cartItems.length > 0 || (selectedPackage && !paymentDone)) {
                navigateTo('checkout');
              } else {
                navigateTo('dashboard');
              }
            }}
            onNavigateLogin={() => navigateTo('login')}
          />
        )}

        {page === 'dashboard' && user && (
          <DashboardPage
            user={user}
            trips={trips}
            orders={dbOrders}
            onRefreshOrders={refreshDbOrders}
            onNewBooking={() => navigateTo('home')}
            onViewPackage={(packageId) => {
              const pkg = MOCK_PACKAGES.find((p) => p.id === packageId);
              if (pkg) handleBookNow(pkg);
            }}
          />
        )}

        {page === 'profile' && user && (
          <ProfilePage
            user={user}
            onUpdateUser={(updated) => {
              setUser(updated);
              showToast('Perfil actualizado correctamente');
            }}
            onNavigateDashboard={() => navigateTo('dashboard')}
          />
        )}

        {page === 'checkout' && (
          <CheckoutPage
            user={user}
            pkg={selectedPackage || MOCK_PACKAGES[0]}
            cartItems={cartItems}
            onClearCart={() => setCartItems([])}
            currency={currency}
            formatPrice={(val: number) => formatPriceCustom(val, currency)}
            passengersCount={searchPassengers || 2}
            paymentDone={paymentDone}
            bookingCode={lastBookingCode}
            onConfirmPayment={(newBookingCode, createdTrip) => {
              setLastBookingCode(newBookingCode);
              setPaymentDone(true);
              setTrips([createdTrip, ...trips]);
              setCartItems([]);
              refreshDbOrders();
              showToast('¡Pago procesado y registrado como Pendiente de Entrega!');
            }}
            onGoToDashboard={() => navigateTo('dashboard')}
            onExploreMore={() => navigateTo('home')}
          />
        )}

        {page === 'terms' && (
          <TermsPage onNavigate={navigateTo} />
        )}

        {page === 'sales_admin' && (
          <SalesAdminPanel
            onBackToClient={() => navigateTo('home')}
            formatPrice={(val) => formatPriceCustom(val, currency)}
          />
        )}
      </main>

      {/* 🛒 DRAWER CARRITO DE COMPRAS MULTI-PRODUCTO */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onCheckout={() => {
          setIsCartOpen(false);
          handleCheckoutCart();
        }}
        currency={currency}
        formatPrice={(val) => formatPriceCustom(val, currency)}
      />

      {/* 3D PACKAGE DETAIL & ITINERARY MODAL */}
      <PackageDetailModal
        pkg={detailPackage}
        currency={currency}
        onClose={() => setDetailPackage(null)}
        onBookNow={(p) => handleBookNow(p)}
      />


      {/* FOOTER */}
      <Footer onNavigate={navigateTo} />
    </div>
  );
}

// ==========================================
// 1. HOME COMPONENT CON 3D GLOBE & 3D TILT
// ==========================================
interface HomePageProps {
  packages: Package[];
  onBookNow: (pkg: Package) => void;
  onAddToCart: (item: ProductItem | Package) => void;
  onNavigateRegister: () => void;
  isLoggedIn: boolean;
  searchDestination: string;
  setSearchDestination: (val: string) => void;
  searchDates: string;
  setSearchDates: (val: string) => void;
  searchPassengers: number;
  setSearchPassengers: (val: number) => void;
  activeFilterTag: string;
  setActiveFilterTag: (val: string) => void;
  isDarkMode: boolean;
  currency: CurrencyType;
  onExplore3D: (pkg: Package) => void;
}




// ==========================================
// 🏨 COMPONENTE 3D: DETALLE DE PAQUETE & ITINERARIO
// ==========================================
interface PackageDetailModalProps {
  pkg: Package | null;
  currency: CurrencyType;
  onClose: () => void;
  onBookNow: (pkg: Package) => void;
}

function PackageDetailModal({ pkg, currency, onClose, onBookNow }: PackageDetailModalProps) {
  const [activeDay, setActiveDay] = useState<number>(1);
  if (!pkg) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 text-[#1E293B] dark:text-[#E2E8F0] my-8 animate-scaleIn">
        {/* Close Button */}
        <button
          onClick={() => {
            soundFx.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer transition z-20"
        >
          ✕
        </button>

        {/* Hero Banner with 3D Depth */}
        <div className="relative h-64 sm:h-80 rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-white/10">
          <img src={pkg.image} alt={pkg.destination} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${pkg.tagColor}`}>
              {pkg.tag}
            </span>
            <span className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-xs font-semibold border border-white/20">
              ✈️ Vuelo Directo VIP
            </span>
          </div>

          <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#38BDF8] font-bold">Experiencia 3D Inmersiva</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-fraunces drop-shadow-md">
                {pkg.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 flex items-center gap-2">
                <span>📍 {pkg.destination}, {pkg.country}</span>
                <span>•</span>
                <span>⭐ {pkg.rating} ({pkg.reviewsCount} reseñas)</span>
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs uppercase tracking-wider text-slate-300 block">Tarifa por persona</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-[#F97316] font-fraunces">
                {formatPriceCustom(pkg.price, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Clean Travel Info Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold block">Duración</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{pkg.nights} Noches / {pkg.nights + 1} Días</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold block">Alojamiento</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Hotel 4★ / 5★ Sup</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold block">Régimen</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">Desayuno / All-Inc</span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-semibold block">Asistencia</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Incluida 24/7</span>
          </div>
        </div>

        {/* Itinerary Day-by-Day Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0EA5E9]">
              Itinerario Día a Día ({pkg.nights} Noches)
            </span>
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Programa oficial exclusivo
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {pkg.itinerary?.map((item) => (
              <button
                key={item.day}
                onClick={() => {
                  soundFx.playClick();
                  setActiveDay(item.day);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeDay === item.day
                    ? 'bg-[#0EA5E9] text-white shadow-md shadow-sky-500/25 scale-102'
                    : 'bg-white dark:bg-slate-800 text-[#64748B] dark:text-[#94A3B8] border border-slate-200 dark:border-white/10 hover:border-[#0EA5E9]'
                }`}
              >
                <span>{item.icon}</span>
                <span>Día {item.day}</span>
              </button>
            ))}
          </div>

          {/* Active Day Card */}
          {(() => {
            const current = pkg.itinerary?.find((d) => d.day === activeDay) || pkg.itinerary?.[0];
            if (!current) return null;
            return (
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-xs space-y-2 animate-fadeIn">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{current.icon}</span>
                  <div>
                    <span className="text-[10px] font-mono text-[#0EA5E9] dark:text-[#38BDF8] font-bold uppercase">
                      Día {current.day} · Destacado del Programa
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-[#1E293B] dark:text-[#E2E8F0]">
                      {current.title}
                    </h4>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed pl-11">
                  {current.desc}
                </p>
              </div>
            );
          })()}
        </div>

        {/* What is Included Grid */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0EA5E9]">
            Servicios Incluidos en tu Paquete
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {pkg.includes.map((inc, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-white/10">
                <span className="text-emerald-500 font-bold">✓</span>
                <span className="text-[#1E293B] dark:text-[#E2E8F0] font-medium">{inc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
            <span className="text-emerald-500 font-bold">🛡️</span>
            <span>Respaldo 100% Protegido por Horizonte Care</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="px-5 py-3 rounded-xl border border-slate-300 dark:border-white/20 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={() => {
                soundFx.playCelebration();
                onClose();
                onBookNow(pkg);
              }}
              className="flex-1 sm:flex-initial px-8 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-extrabold shadow-lg shadow-orange-500/25 transition cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Reservar Ahora ({formatPriceCustom(pkg.price, currency)})</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 🛂 COMPONENTE 3D: PASAPORTE GAMIFICADO
// ==========================================
function Passport3D({ user }: { user: User }) {
  const stamps = [
    { country: 'Cancún, México', date: '15 NOV 2025', code: 'CUN-ARR-01', color: 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300', icon: '🇲🇽', seal: 'CARIBE MAYA' },
    { country: 'París, Francia', date: '20 MAY 2025', code: 'CDG-VIP-88', color: 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300', icon: '🇫🇷', seal: 'DOUANE ROISSY' },
    { country: 'Bali, Indonesia', date: '14 SEP 2024', code: 'DPS-IMM-32', color: 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300', icon: '🇮🇩', seal: 'BALI PARADISE' },
    { country: 'Machu Picchu, Perú', date: '04 FEB 2024', code: 'CUZ-VIP-77', color: 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300', icon: '🇵🇪', seal: 'SANTUARIO INCA' },
    { country: 'Santorini, Grecia', date: '19 AGO 2023', code: 'JTR-PORT-11', color: 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300', icon: '🇬🇷', seal: 'AEGEAN ENTRY' },
    { country: 'Dubai, EAU', date: '08 DIC 2022', code: 'DXB-FAST-99', color: 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300', icon: '🇦🇪', seal: 'DESERT LUXURY' },
  ];

  return (
    <div className="w-full">
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-[#0284C7] dark:text-sky-400 flex items-center justify-center font-bold text-base border border-sky-100 dark:border-sky-900/30">
              ✈
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-wider text-slate-500 dark:text-slate-400 uppercase font-semibold block">
                HORIZONTE CLUB · PROGRAMA DE VIAJEROS
              </span>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Perfil del Pasajero & Membresía
              </h3>
            </div>
          </div>
          <span className="px-3 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
            Socio Platino
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left ID Credentials */}
          <div className="md:col-span-5 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-lg bg-slate-800 text-white flex items-center justify-center text-sm font-semibold">
                {user.avatarInitials}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 block font-medium">Titular de cuenta</span>
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{user.name} {user.lastName}</p>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400">{user.passport}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-3 border-t border-slate-200 dark:border-slate-700/60">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Nacionalidad</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{user.country}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Puntos acumulados</span>
                <span className="font-semibold text-[#EA580C]">{user.points.toLocaleString()} pts</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Emisión</span>
                <span className="text-slate-600 dark:text-slate-400">2022 / Digital</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Estado</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Activo</span>
              </div>
            </div>
          </div>

          {/* Right Stamps Grid */}
          <div className="md:col-span-7 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Historial de Destinos Visitados ({stamps.length})
              </span>
              <span className="text-[11px] text-slate-400">Verificado</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {stamps.map((stamp, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
                  title={`Visita a ${stamp.country}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{stamp.icon}</span>
                    <span className="text-[8px] font-mono font-medium text-slate-400">{stamp.code}</span>
                  </div>
                  <div className="my-1">
                    <span className="text-[11px] font-semibold block leading-tight text-slate-800 dark:text-slate-200 truncate">{stamp.seal}</span>
                    <span className="text-[9px] text-slate-500 block truncate">{stamp.country.split(',')[0]}</span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <span>REG</span>
                    <span>{stamp.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



function HomePage({
  packages,
  onBookNow,
  onAddToCart,
  onNavigateRegister,
  isLoggedIn,
  searchDestination,
  setSearchDestination,
  searchDates,
  setSearchDates,
  searchPassengers,
  setSearchPassengers,
  activeFilterTag,
  setActiveFilterTag,
  isDarkMode,
  currency,
  onExplore3D
}: HomePageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [serviceCategory, setServiceCategory] = useState<'todos' | 'paquete' | 'aereo' | 'estadia' | 'auto'>('todos');

  const allInventoryProducts = DbStorageService.getProducts();

  const filteredInventory = allInventoryProducts.filter((p) => {
    const matchesCategory = serviceCategory === 'todos' || p.categoria === serviceCategory;
    const matchesQuery =
      searchDestination === '' ||
      p.nombre.toLowerCase().includes(searchDestination.toLowerCase()) ||
      p.descripcion.toLowerCase().includes(searchDestination.toLowerCase()) ||
      p.codigo.toLowerCase().includes(searchDestination.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const filteredPackages = packages.filter((pkg) => {
    const matchesTag = activeFilterTag === 'Todos' || pkg.tag === activeFilterTag;
    const matchesQuery =
      searchDestination === '' ||
      pkg.destination.toLowerCase().includes(searchDestination.toLowerCase()) ||
      pkg.country.toLowerCase().includes(searchDestination.toLowerCase());
    return matchesTag && matchesQuery;
  });

  return (
    <div className="flex flex-col">
      {/* HERO SECTION CON THREE.JS 3D GLOBE */}
      <div className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-slate-950">
        {/* Background Image with Dark Tint Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/90 to-slate-950" />

        {/* Hero Content Grid (Left Text & Search + Right 3D Globe) */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Col: Headings & Search Box */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-200 text-xs font-medium mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C]" />
                Temporada 2026/2027 · Tarifas confirmadas
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight mb-3">
                Explorá destinos únicos en todo el mundo
              </h1>

              <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 mb-6 font-normal leading-relaxed">
                Paquetes integrales, vuelos, estadías y alquiler de autos con confirmación en tiempo real y asistencia permanente.
              </p>

              {/* SEARCH BAR BOX */}
              <div className="w-full bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm text-left">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  {/* Destination */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Destino
                    </label>
                    <input
                      type="text"
                      value={searchDestination}
                      onChange={(e) => setSearchDestination(e.target.value)}
                      placeholder="Ej: Cancún, París..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                    />
                  </div>

                  {/* Dates */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={searchDates}
                      onChange={(e) => setSearchDates(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                    />
                  </div>

                  {/* Passengers */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Pasajeros
                    </label>
                    <select
                      value={searchPassengers}
                      onChange={(e) => setSearchPassengers(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7] cursor-pointer"
                    >
                      <option value={1}>1 pasajero</option>
                      <option value={2}>2 pasajeros (Pareja)</option>
                      <option value={3}>3 pasajeros</option>
                      <option value={4}>4 pasajeros (Familia)</option>
                    </select>
                  </div>

                  {/* Search Button */}
                  <div>
                    <button
                      onClick={() => {
                        const el = document.getElementById('paquetes-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Buscar Paquetes
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Three.js Interactive Globe */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[420px] relative">
                <ThreeGlobe
                  isDarkMode={isDarkMode}
                  packages={packages}
                  onSelectDestination={(pkg) => {
                    setSearchDestination(pkg.destination);
                    const el = document.getElementById('paquetes-section');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS STRIP */}
      <section className="bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 py-6 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="py-2">
              <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">2.4M+</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Clientes satisfechos</p>
            </div>

            <div className="py-2 border-l border-slate-100 dark:border-slate-800">
              <p className="text-2xl sm:text-3xl font-bold text-[#EA580C]">500+</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Destinos en el mundo</p>
            </div>

            <div className="py-2 border-l border-slate-100 dark:border-slate-800">
              <p className="text-2xl sm:text-3xl font-bold text-[#0284C7] dark:text-sky-400">12.000+</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Paquetes turísticos</p>
            </div>

            <div className="py-2 border-l border-slate-100 dark:border-slate-800">
              <p className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-slate-300">99.4%</p>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">Reseñas 5 estrellas</p>
            </div>
          </div>
        </div>
      </section>

      {/* PACKAGES CATALOG SECTION */}
      <section id="paquetes-section" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <span className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 uppercase tracking-wider block mb-1">
              Catálogo de Servicios Turísticos
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Paquetes, Vuelos, Estadías y Autos
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-1 max-w-xl text-xs sm:text-sm">
              Selecciona tus servicios, agrégalos a tu carrito de compras o resérvalos directamente con confirmación inmediata.
            </p>
          </div>

          {/* Selector de Modo de Vista */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-[#0284C7] dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cuadrícula
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-[#0284C7] dark:text-sky-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="1.3.1. Consultar la lista de productos (formato lista sin fotos)"
            >
              Lista rápida
            </button>
          </div>
        </div>

        {/* Categorías de Servicios del PDF (Paquetes, Aéreos, Estadías, Autos) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => {
              setServiceCategory('todos');
              setActiveFilterTag('Todos');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              serviceCategory === 'todos' && activeFilterTag === 'Todos'
                ? 'bg-[#0284C7] text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#0284C7]'
            }`}
          >
            Todos los servicios
          </button>
          <button
            onClick={() => {
              setServiceCategory('paquete');
              setActiveFilterTag('Todos');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              serviceCategory === 'paquete'
                ? 'bg-[#0284C7] text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#0284C7]'
            }`}
          >
            Paquetes integrales
          </button>
          <button
            onClick={() => {
              setServiceCategory('aereo');
              setActiveFilterTag('Todos');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              serviceCategory === 'aereo'
                ? 'bg-[#0284C7] text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#0284C7]'
            }`}
          >
            Pasajes aéreos
          </button>
          <button
            onClick={() => {
              setServiceCategory('estadia');
              setActiveFilterTag('Todos');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              serviceCategory === 'estadia'
                ? 'bg-[#0284C7] text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#0284C7]'
            }`}
          >
            Estadías y hoteles
          </button>
          <button
            onClick={() => {
              setServiceCategory('auto');
              setActiveFilterTag('Todos');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
              serviceCategory === 'auto'
                ? 'bg-[#0284C7] text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-[#0284C7]'
            }`}
          >
            Alquiler de autos
          </button>
        </div>

        {/* ============================================================== */}
        {/* VISTA 1: LISTA RÁPIDA SIN IMÁGENES (Punto 1.3.1 del PDF)        */}
        {/* ============================================================== */}
        {viewMode === 'list' ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Lista de productos sin imágenes (Requisito 1.3.1)
              </span>
              <span className="text-slate-500">
                {filteredInventory.length} servicios disponibles
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Categoría</th>
                    <th className="py-3 px-4">Nombre y Descripción del Servicio</th>
                    <th className="py-3 px-4 text-center">Cupos</th>
                    <th className="py-3 px-4 text-right">Precio Unitario</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInventory.map((item) => (
                    <tr key={item.codigo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-[#0284C7] dark:text-sky-400">
                        {item.codigo}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-medium capitalize text-[11px] text-slate-700 dark:text-slate-300">
                          {item.categoria}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {item.nombre}
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                          {item.descripcion}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                          {item.stock} cupos
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-[#EA580C] text-xs sm:text-sm">
                        {formatPriceCustom(item.precioUnitario, currency)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => onAddToCart(item)}
                          className="px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-[#0284C7] hover:text-white dark:hover:bg-[#0284C7] text-xs font-medium transition cursor-pointer"
                          title="Añadir este servicio al carrito"
                        >
                          Añadir al carrito
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* VISTA 2: CUADRÍCULA DE PAQUETES CON FOTOS                     */
          /* ============================================================== */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <div key={pkg.id} className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col h-full group">
              {/* Image & Badges */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={pkg.image}
                  alt={pkg.destination}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-80" />

                {/* Tag Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider text-white shadow-xs ${pkg.tagColor}`}>
                    {pkg.tag}
                  </span>
                </div>

                {/* Nights badge */}
                <div className="absolute top-3 right-3 bg-slate-900/80 text-white px-2.5 py-1 rounded-md text-[11px] font-medium shadow-xs flex items-center gap-1 border border-white/10">
                  <span>{pkg.nights} noches</span>
                </div>

                {/* Location text */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                  <span className="text-lg font-semibold">
                    {pkg.destination}, {pkg.country}
                  </span>
                  <div className="flex items-center gap-1 bg-black/60 px-2 py-0.5 rounded-md text-xs font-semibold">
                    <span className="text-amber-400">★</span>
                    <span>{pkg.rating}</span>
                    <span className="text-slate-300 text-[10px] font-normal">({pkg.reviewsCount})</span>
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#0284C7] dark:group-hover:text-sky-400 transition-colors leading-snug">
                    {pkg.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {pkg.description}
                  </p>

                  {/* Highlight */}
                  <div className="mt-3 py-1 px-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-md text-xs text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                    <span className="text-[#EA580C] font-bold">✓</span>
                    <span className="truncate">{pkg.highlight}</span>
                  </div>

                  {/* Includes Chips */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {pkg.includes.map((item, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                      Precio desde
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-[#EA580C]">
                        {formatPriceCustom(pkg.price, currency)}
                      </span>
                      <span className="text-[11px] text-slate-500 font-normal">/ pers.</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        soundFx.playWoosh();
                        onExplore3D(pkg);
                      }}
                      className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-[#0284C7] hover:text-[#0284C7] text-xs font-medium transition cursor-pointer"
                      title="Ver itinerario detallado"
                    >
                      Detalles 3D
                    </button>
                    <button
                      onClick={() => onAddToCart(pkg)}
                      className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-medium transition cursor-pointer"
                      title="Añadir este paquete al carrito"
                    >
                      Añadir
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playCelebration();
                        onBookNow(pkg);
                      }}
                      className="px-3.5 py-1.5 rounded-md bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold text-xs transition cursor-pointer"
                    >
                      Reservar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

        {filteredPackages.length === 0 && (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">No encontramos resultados con esos filtros</h3>
            <p className="text-xs text-slate-500 mt-1">Intenta con otro término de búsqueda o restablece los filtros.</p>
            <button
              onClick={() => {
                setActiveFilterTag('Todos');
                setSearchDestination('');
              }}
              className="mt-3 px-3 py-1.5 bg-[#0284C7] text-white rounded-md text-xs font-medium"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </section>

      {/* POR QUÉ ELEGIRNOS */}
      <section className="bg-slate-50 dark:bg-slate-900/40 py-16 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#EA580C]">Garantía y Confianza</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              ¿Por qué elegir Horizonte Moderno?
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-xs sm:text-sm">
              Servicios respaldados con atención personalizada antes, durante y después de tu viaje.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-full">
              <div className="w-10 h-10 rounded-lg bg-sky-50 dark:bg-sky-950/50 text-[#0284C7] dark:text-sky-400 flex items-center justify-center mb-4 border border-sky-100 dark:border-sky-900/40">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Tarifas Transparentes</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                Precios finales con impuestos y tasas incluidas, sin cargos ocultos ni sorpresas en el check-out.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-full">
              <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-[#EA580C] dark:text-orange-400 flex items-center justify-center mb-4 border border-orange-100 dark:border-orange-900/40">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Pagos Seguros y Cuotas</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                Procesamiento con encriptación bancaria y financiación en cuotas fijas con todas las tarjetas principales.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col h-full">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 border border-emerald-100 dark:border-emerald-900/40">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">Atención Personalizada 24/7</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-2 leading-relaxed">
                Asesores turísticos dedicados para asistirte ante imprevistos, cambios de fechas o consultas de tu itinerario.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER CTA */}
      {!isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sm:p-10 text-white shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl text-center md:text-left">
              <span className="inline-block px-2.5 py-0.5 rounded-md bg-slate-800 text-[#EA580C] text-[11px] font-semibold uppercase tracking-wider mb-2 border border-slate-700">
                Beneficio para Nuevos Usuarios
              </span>
              <h3 className="text-xl sm:text-2xl font-bold leading-tight">
                Creá tu cuenta y accedé a beneficios exclusivos en tu primera reserva
              </h3>
              <p className="text-slate-400 mt-2 text-xs sm:text-sm leading-relaxed">
                Seguimiento de pedidos en tiempo real, emisión inmediata de vouchers y acumulación de puntos canjeables.
              </p>
            </div>

            <div className="shrink-0">
              <button
                onClick={onNavigateRegister}
                className="px-6 py-3 bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold rounded-lg transition-colors cursor-pointer text-xs sm:text-sm"
              >
                Crear cuenta gratis
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ==========================================
// 2. LOGIN COMPONENT
// ==========================================
interface LoginPageProps {
  onLoginSuccess: (email: string) => void;
  onLoginAsSalesAdmin?: () => void;
  onNavigateRegister: () => void;
}

function LoginPage({ onLoginSuccess, onLoginAsSalesAdmin, onNavigateRegister }: LoginPageProps) {
  const [email, setEmail] = useState<string>('maria.gonzalez@horizontemoderno.com');
  const [password, setPassword] = useState<string>('password123');
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setErrorMsg(null);
    if (email.toLowerCase().includes('jefeventas') || email.toLowerCase().includes('ventas')) {
      if (onLoginAsSalesAdmin) {
        onLoginAsSalesAdmin();
        return;
      }
    }
    onLoginSuccess(email);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2">
      {/* Left Column Brand Split */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200">
            <span>✈</span> Horizonte Moderno
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-2xl font-bold leading-snug mb-3 text-white">
            Tu plataforma integral de gestión de viajes y reservas turísticas
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Accedé a tu panel para verificar pedidos en tiempo real, consultar tus vouchers y gestionar tus itinerarios.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-mono">
          © 2026 Horizonte Moderno · Sistema de Gestión Turística
        </div>
      </div>

      {/* Right Form Split */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white dark:bg-slate-950 transition-colors">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Iniciar Sesión</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Ingresá tus credenciales para acceder a tus reservas y pedidos.
            </p>
          </div>

          {/* Box de Cuentas de Prueba Evaluador */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Acceso Rápido · Mesa Evaluadora
              </span>
              <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium px-1.5 py-0.2 rounded-sm">
                Demo
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onLoginSuccess('maria.gonzalez@horizontemoderno.com')}
                className="p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left hover:border-[#0284C7] transition cursor-pointer"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-white">
                  Pasajera (María)
                </div>
                <div className="text-[10px] text-slate-400 truncate">maria.gonzalez@...</div>
              </button>

              <button
                type="button"
                onClick={() => onLoginAsSalesAdmin ? onLoginAsSalesAdmin() : onLoginSuccess('jefeventas@horizontemoderno.com')}
                className="p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left hover:border-[#EA580C] transition cursor-pointer"
              >
                <div className="text-xs font-semibold text-[#EA580C]">
                  Jefe Ventas (Carlos)
                </div>
                <div className="text-[10px] text-slate-400 truncate">jefeventas@...</div>
              </button>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onLoginSuccess('maria.gonzalez@gmail.com')}
              className="flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.27 21.36 7.35 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
              </svg>
              <span>Google</span>
            </button>

            <button
              type="button"
              onClick={() => onLoginSuccess('maria.gonzalez@facebook.com')}
              className="flex items-center justify-center gap-2 py-2 px-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-950 px-2 text-[11px] text-slate-400 uppercase tracking-wider">
              o con email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMsg && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-300 text-xs font-medium flex items-center gap-2">
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Contraseña
                </label>
                <a
                  href="#olvido"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Hemos enviado un correo de recuperación a tu dirección.');
                  }}
                  className="text-xs text-[#0284C7] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7] pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <span className="text-xs">{showPassword ? 'Ocultar' : 'Ver'}</span>
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded-sm border-slate-300 text-[#0284C7] focus:ring-0"
              />
              <label htmlFor="rememberMe" className="ml-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                Recordar mi sesión en este dispositivo
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white py-2.5 rounded-md font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500">¿No tienes cuenta todavía? </span>
            <button
              onClick={onNavigateRegister}
              className="text-xs text-[#0284C7] hover:underline font-semibold cursor-pointer"
            >
              Crear una cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. REGISTER COMPONENT
// ==========================================
interface RegisterPageProps {
  onRegisterSuccess: (newUser: User) => void;
  onNavigateLogin: () => void;
  onNavigateTerms?: () => void;
}

function RegisterPage({ onRegisterSuccess, onNavigateLogin, onNavigateTerms }: RegisterPageProps) {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Por favor ingresa tu nombre completo');
      return;
    }
    if (!email || !email.includes('@')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Debes aceptar los términos y condiciones');
      return;
    }

    setErrorMsg(null);
    const parts = fullName.trim().split(' ');
    const name = parts[0] || 'Viajero';
    const lastName = parts.slice(1).join(' ') || 'Nuevo';
    const initials = `${name[0] || ''}${lastName[0] || ''}`.toUpperCase() || 'VY';

    const createdUser: User = {
      name,
      lastName,
      email,
      phone: '+1 555-0192',
      country: 'México',
      city: 'Ciudad de México',
      birthDate: '1995-01-01',
      passport: 'PAS-NEW123',
      verified: true,
      avatarInitials: initials,
      preferences: ['Playa', 'Aventura'],
      points: 2500
    };

    onRegisterSuccess(createdUser);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2">
      {/* Left Inspiration Split */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200">
            <span>✈</span> Horizonte Moderno
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-2xl font-bold leading-snug mb-3 text-white">
            Creá tu cuenta para gestionar tus itinerarios y pedidos
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Formá parte de la red de viajeros. Obtené acceso inmediato a seguimiento de compras, vouchers digitales y asistencia personalizada.
          </p>
        </div>

        <div className="relative z-10 text-xs text-slate-500 font-mono">
          © 2026 Horizonte Moderno · Sistema de Gestión Turística
        </div>
      </div>

      {/* Right Form Split */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white dark:bg-slate-950 transition-colors">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Crear Cuenta</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Completá tus datos para registrarte en la plataforma.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-md text-red-700 dark:text-red-300 text-xs font-medium flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: María González"
                className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@ejemplo.com"
                className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contraseña (mínimo 6 caracteres)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7] transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Confirmar Contraseña
                </label>
                {confirmPassword.length > 0 && (
                  <span className={`text-[11px] font-medium ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {passwordsMatch ? '✓ Coinciden' : '✗ No coinciden'}
                  </span>
                )}
              </div>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-3 py-2 rounded-md border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden transition ${
                  confirmPassword.length > 0 && !passwordsMatch
                    ? 'border-red-400 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-[#0284C7]'
                }`}
              />
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded-sm border-slate-300 text-[#0284C7] focus:ring-0"
              />
              <label htmlFor="terms" className="ml-2 text-xs text-slate-600 dark:text-slate-400">
                Acepto los{' '}
                <button type="button" onClick={onNavigateTerms} className="text-[#0284C7] hover:underline font-medium cursor-pointer">Términos del Servicio</button>{' '}
                y la{' '}
                <button type="button" onClick={onNavigateTerms} className="text-[#0284C7] hover:underline font-medium cursor-pointer">Política de Privacidad</button>.
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-[#EA580C] hover:bg-[#C2410C] text-white py-2.5 rounded-md font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Crear cuenta
            </button>
          </form>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500">¿Ya tienes una cuenta registrada? </span>
            <button
              onClick={onNavigateLogin}
              className="text-xs text-[#0284C7] hover:underline font-semibold cursor-pointer"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. DASHBOARD COMPONENT CON BOARDING PASS 3D
// ==========================================
interface DashboardPageProps {
  user: User;
  trips: Trip[];
  orders?: Order[];
  onRefreshOrders?: () => void;
  onNewBooking: () => void;
  onViewPackage: (packageId: string) => void;
}

function DashboardPage({ user, trips, orders = [], onRefreshOrders, onNewBooking }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'upcoming' | 'completed' | 'cancelled'>('pedidos');
  const [selectedVoucherTrip, setSelectedVoucherTrip] = useState<Trip | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editNotes, setEditNotes] = useState<string>('');

  const myOrders = (orders && orders.length > 0 ? orders : DbStorageService.getOrders()).filter(
    (o) => o.clienteEmail === user.email || user.email.includes('maria') || o.clienteNombre.toLowerCase().includes(user.name.toLowerCase())
  );
  const pendingOrders = myOrders.filter((o) => o.estado === 'pendiente_entrega');

  const upcomingTrips = trips.filter((t) => t.status === 'upcoming');
  const completedTrips = trips.filter((t) => t.status === 'completed');
  const cancelledTrips = trips.filter((t) => t.status === 'cancelled');

  const displayedTrips =
    activeTab === 'upcoming'
      ? upcomingTrips
      : activeTab === 'completed'
      ? completedTrips
      : cancelledTrips;

  const nextTrip = upcomingTrips[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <span className="text-xs font-semibold text-[#0284C7] dark:text-sky-400 uppercase tracking-wider">
            Área de Clientes
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
            Panel del Viajero: {user.name}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Gestioná tus reservas, revisá el estado de entrega de tus pedidos y consultá tus tarjetas de embarque.
          </p>
        </div>

        <button
          onClick={onNewBooking}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs sm:text-sm transition cursor-pointer shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva reserva
        </button>
      </div>

      {/* PERFIL DE VIAJERO */}
      <Passport3D user={user} />

      {/* 4 STAT METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0284C7] dark:text-sky-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Viajes Realizados</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{completedTrips.length} viajes</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-[#EA580C] dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-100 dark:border-orange-900/40">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Próximo Viaje</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {nextTrip ? nextTrip.departureDate.split(',')[0] : 'Sin viajes'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Países Visitados</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">3 países</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-[#0284C7] dark:text-sky-400 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Puntos Horizonte</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {user.points.toLocaleString()} pts
            </p>
          </div>
        </div>
      </div>

      {/* FEATURED BOARDING PASS DEL PRÓXIMO VIAJE */}
      {nextTrip && (
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
            Próximo Itinerario Confirmado
          </span>
          <BoardingPass3D trip={nextTrip} user={user} />
        </div>
      )}

      {/* TRIPS LIST WITH TABS */}
      <div className="space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-1">
          <div className="flex gap-4 sm:gap-6 min-w-max">
            <button
              onClick={() => setActiveTab('pedidos')}
              className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'pedidos'
                  ? 'border-[#0284C7] text-[#0284C7] dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Pedidos Pendientes de Entrega (1.3.3)</span>
              {pendingOrders.length > 0 && (
                <span className="px-2 py-0.5 text-xs bg-[#EA580C] text-white rounded-full font-bold">
                  {pendingOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'border-[#0284C7] text-[#0284C7] dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Itinerarios Confirmados ({upcomingTrips.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'completed'
                  ? 'border-[#0284C7] text-[#0284C7] dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Completados ({completedTrips.length})
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition cursor-pointer ${
                activeTab === 'cancelled'
                  ? 'border-[#0284C7] text-[#0284C7] dark:text-sky-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cancelados ({cancelledTrips.length})
            </button>
          </div>
        </div>

        {/* CONTENIDO SEGÚN TAB */}
        {activeTab === 'pedidos' ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 flex items-start gap-3">
              <span className="text-base text-[#0284C7]">ℹ</span>
              <div className="text-xs text-slate-700 dark:text-slate-300">
                <strong className="text-[#0284C7] dark:text-sky-300 font-semibold block mb-0.5">
                  Seguimiento de Órdenes (Requisitos 1.3.3 y 1.3.4)
                </strong>
                Tus compras se registran como <strong>"Pendiente de Entrega"</strong> hasta que el sector de reservas y el Jefe de Ventas validan los cupos y entregan los vouchers. Puedes modificar indicaciones o cancelar tu orden mientras esté pendiente.
              </div>
            </div>

            {myOrders.length > 0 ? (
              <div className="space-y-4">
                {myOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                            Orden #{ord.id}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            (Factura: #{ord.nroFactura})
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          Registrado el {new Date(ord.fecha).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {ord.estado === 'pendiente_entrega' && (
                          <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-xs font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            <span>Pendiente de Entrega (1.3.3)</span>
                          </span>
                        )}
                        {ord.estado === 'entregado' && (
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-xs font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>Entregado / Despachado (1.4.4)</span>
                          </span>
                        )}
                        {ord.estado === 'anulado' && (
                          <span className="px-2.5 py-1 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 text-xs font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>Cancelado (1.3.4)</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800 font-semibold text-[10px]">
                          <tr>
                            <th className="py-2">Código</th>
                            <th className="py-2">Descripción</th>
                            <th className="py-2 text-center">Cant.</th>
                            <th className="py-2 text-right">Unitario</th>
                            <th className="py-2 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {ord.items.map((it, idx) => (
                            <tr key={idx}>
                              <td className="py-2 font-mono font-medium text-slate-600 dark:text-slate-400">
                                {it.codigoProducto}
                              </td>
                              <td className="py-2 font-medium text-slate-800 dark:text-slate-200">
                                {it.descripcion}
                              </td>
                              <td className="py-2 text-center font-semibold">
                                {it.cantidad}
                              </td>
                              <td className="py-2 text-right text-slate-500">
                                ${it.precioUnitario.toLocaleString()} USD
                              </td>
                              <td className="py-2 text-right font-bold text-[#EA580C]">
                                ${it.subtotal.toLocaleString()} USD
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer / Notes & Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">
                          Indicaciones / Notas del Cliente:
                        </span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {ord.notas || 'Sin indicaciones especiales.'}
                        </span>
                        {ord.motivoAnulacion && (
                          <div className="text-rose-600 dark:text-rose-400 text-xs mt-1 font-medium">
                            Motivo de cancelación: {ord.motivoAnulacion}
                          </div>
                        )}
                        {ord.fechaEntrega && (
                          <div className="text-emerald-600 dark:text-emerald-400 text-xs mt-1 font-medium">
                            Entregado el: {new Date(ord.fechaEntrega).toLocaleString()} por {ord.responsableEntrega || 'Ventas'}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <div className="text-right pr-3 mr-2 border-r border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total</span>
                          <span className="text-base font-bold text-[#EA580C]">
                            ${ord.total.toLocaleString()} USD
                          </span>
                        </div>

                        {ord.estado === 'pendiente_entrega' && (
                          <>
                            <button
                              onClick={() => {
                                setEditingOrder(ord);
                                setEditNotes(ord.notas || '');
                              }}
                              className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium transition cursor-pointer"
                              title="Modificar observaciones o indicaciones (Requisito 1.3.4)"
                            >
                              Modificar
                            </button>

                            <button
                              onClick={() => {
                                const reason = prompt('Ingrese el motivo de cancelación de la orden (Requisito 1.3.4):', 'Cambio de itinerario o fecha');
                                if (reason) {
                                  DbStorageService.cancelOrder(ord.id, reason);
                                  if (onRefreshOrders) onRefreshOrders();
                                  alert('La orden ha sido cancelada con éxito y el stock fue liberado.');
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-md border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-medium transition cursor-pointer"
                              title="Cancelar este pedido (Requisito 1.3.4)"
                            >
                              Cancelar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  No tienes pedidos pendientes de entrega
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Agrega servicios al carrito o reserva un paquete para que se registre tu orden formal.
                </p>
                <button
                  onClick={onNewBooking}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#0284C7] text-white text-xs font-semibold hover:bg-[#0369A1] transition cursor-pointer"
                >
                  Ver Catálogo de Servicios
                </button>
              </div>
            )}
          </div>
        ) : (
        /* Trips Cards */
        displayedTrips.length > 0 ? (
          <div className="space-y-4">
            {displayedTrips.map((trip) => (
              <TiltCard key={trip.id} maxTilt={6} scale={1.01}>
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] p-4 sm:p-6 shadow-sm hover:shadow-lg transition flex flex-col md:flex-row items-center gap-6">
                  {/* Image */}
                  <img
                    src={trip.image}
                    alt={trip.destination}
                    className="w-full md:w-36 h-36 rounded-xl object-cover shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 w-full space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider font-mono">
                        Reserva #{trip.bookingCode}
                      </span>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${
                          trip.status === 'upcoming'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : trip.status === 'completed'
                            ? 'bg-[#F1F5F9] dark:bg-[#0F172A] text-[#64748B] dark:text-[#94A3B8]'
                            : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                        }`}
                      >
                        {trip.status === 'upcoming' ? 'Confirmado' : trip.status === 'completed' ? 'Completado' : 'Cancelado'}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-[#1E293B] dark:text-[#E2E8F0] font-fraunces">
                      {trip.title}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#64748B] dark:text-[#94A3B8] pt-1">
                      <div>
                        <span className="text-[#64748B] dark:text-[#64748B] block text-[11px]">Destino</span>
                        <span className="font-semibold text-[#1E293B] dark:text-[#E2E8F0]">{trip.destination}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] dark:text-[#64748B] block text-[11px]">Fechas</span>
                        <span className="font-semibold text-[#1E293B] dark:text-[#E2E8F0]">{trip.departureDate}</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] dark:text-[#64748B] block text-[11px]">Duración & Pasajeros</span>
                        <span className="font-semibold text-[#1E293B] dark:text-[#E2E8F0]">{trip.nights} noches · {trip.passengers} pers.</span>
                      </div>
                      <div>
                        <span className="text-[#64748B] dark:text-[#64748B] block text-[11px]">Total abonado</span>
                        <span className="font-bold text-[#0EA5E9] dark:text-[#E2E8F0] text-sm">${trip.totalPrice.toLocaleString()} USD</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="w-full md:w-auto flex md:flex-col gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedVoucherTrip(trip)}
                      className="flex-1 md:w-36 py-2 px-3 text-xs font-bold rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition cursor-pointer text-center"
                    >
                      Ver Voucher
                    </button>
                    <button
                      onClick={() => onNewBooking()}
                      className="flex-1 md:w-36 py-2 px-3 text-xs font-bold rounded-xl bg-[#F1F5F9] dark:bg-[#0F172A] text-[#0EA5E9] dark:text-[#E2E8F0] hover:bg-[#E2E8F0] dark:hover:bg-[#334155] transition cursor-pointer text-center"
                    >
                      Volver a viajar
                    </button>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-[#F1F5F9]/40 dark:bg-[#1E293B] rounded-2xl border border-dashed border-[#E2E8F0] dark:border-[#334155] p-12 text-center">
            <span className="text-4xl block mb-3">🌴</span>
            <h3 className="text-lg font-bold text-[#1E293B] dark:text-[#E2E8F0]">
              No tienes viajes en esta categoría
            </h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-sm mx-auto">
              {activeTab === 'cancelled'
                ? '¡Buenas noticias! No tienes reservas canceladas en tu historial.'
                : '¿Qué esperas para planificar tu próxima escapada en 3D?'}
            </p>
            <button
              onClick={onNewBooking}
              className="mt-6 px-6 py-2.5 rounded-xl bg-[#F97316] text-white text-xs font-bold shadow-md hover:bg-[#EA580C] transition cursor-pointer"
            >
              Explorar destinos ahora
            </button>
          </div>
        )
      )}
      </div>

      {/* Voucher Modal */}
      {selectedVoucherTrip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6 text-[#1E293B] dark:text-[#E2E8F0] animate-scaleIn">
            <button
              onClick={() => setSelectedVoucherTrip(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center pb-4 border-b border-[#E2E8F0] dark:border-[#334155]">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-[#1E293B] px-3 py-1 rounded-full mb-2 border border-emerald-200 dark:border-[#334155]">
                ✓ Reserva Confirmada & Emitida 3D
              </div>
              <h3 className="text-xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0]">
                Voucher de Reserva Oficial
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-mono mt-1">
                CÓDIGO: #{selectedVoucherTrip.bookingCode}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-[#E2E8F0]/60 dark:border-[#334155]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Paquete:</span>
                <span className="font-bold text-[#1E293B] dark:text-[#E2E8F0] text-right">{selectedVoucherTrip.title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2E8F0]/60 dark:border-[#334155]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Destino:</span>
                <span className="font-semibold text-[#1E293B] dark:text-[#E2E8F0]">{selectedVoucherTrip.destination}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2E8F0]/60 dark:border-[#334155]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Titular principal:</span>
                <span className="font-semibold text-[#1E293B] dark:text-[#E2E8F0]">{user.name} {user.lastName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2E8F0]/60 dark:border-[#334155]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Documento / Pasaporte:</span>
                <span className="font-mono text-[#1E293B] dark:text-[#E2E8F0]">{user.passport}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2E8F0]/60 dark:border-[#334155]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Fechas:</span>
                <span className="font-semibold text-[#1E293B] dark:text-[#E2E8F0]">{selectedVoucherTrip.departureDate} al {selectedVoucherTrip.returnDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E2E8F0]/60 dark:border-[#334155]">
                <span className="text-[#64748B] dark:text-[#94A3B8]">Monto total pagado:</span>
                <span className="font-bold text-[#0EA5E9] dark:text-[#E2E8F0] text-sm">${selectedVoucherTrip.totalPrice.toLocaleString()} USD</span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Voucher PDF descargado a tu dispositivo.');
                setSelectedVoucherTrip(null);
              }}
              className="w-full py-3 bg-[#0EA5E9] dark:bg-[#334155] text-white dark:text-[#E2E8F0] rounded-xl font-bold text-xs shadow-md hover:bg-[#64748B] dark:hover:bg-[#0F172A] transition cursor-pointer"
            >
              Descargar Comprobante PDF
            </button>
          </div>
        </div>
      )}

      {/* Modal para Modificar Pedido (Punto 1.3.4 del Pliego) */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-4 text-[#1E293B] dark:text-[#E2E8F0] animate-scaleIn">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/10 pb-3">
              <h3 className="text-lg font-bold font-fraunces flex items-center gap-2">
                <span>✏️</span>
                <span>Modificar Pedido #{editingOrder.id}</span>
              </h3>
              <button
                onClick={() => setEditingOrder(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Puedes actualizar las notas especiales, requerimientos alimenticios, preferencias de habitación o detalles de contacto para esta orden mientras continúe en estado <strong>Pendiente de Entrega</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                Indicaciones / Observaciones Especiales
              </label>
              <textarea
                rows={4}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Ej: Pasajeros solicitan habitación en piso alto con cama matrimonial. Incluir asistencia médica en traslados."
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs text-slate-800 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  DbStorageService.updateOrderNotes(editingOrder.id, editNotes);
                  if (onRefreshOrders) onRefreshOrders();
                  setEditingOrder(null);
                  alert('¡Pedido actualizado con éxito!');
                }}
                className="px-5 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 5. PROFILE COMPONENT
// ==========================================
interface ProfilePageProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  onNavigateDashboard: () => void;
}

function ProfilePage({ user, onUpdateUser, onNavigateDashboard }: ProfilePageProps) {
  const [profileTab, setProfileTab] = useState<'personal' | 'security' | 'preferences'>('personal');

  const [name, setName] = useState<string>(user.name);
  const [lastName, setLastName] = useState<string>(user.lastName);
  const [email, setEmail] = useState<string>(user.email);
  const [phone, setPhone] = useState<string>(user.phone);
  const [country, setCountry] = useState<string>(user.country);
  const [city, setCity] = useState<string>(user.city);
  const [birthDate, setBirthDate] = useState<string>(user.birthDate);
  const [passport, setPassport] = useState<string>(user.passport);

  const [preferences, setPreferences] = useState<string[]>(user.preferences);

  const [currentPass, setCurrentPass] = useState<string>('');
  const [newPass, setNewPass] = useState<string>('');
  const [confirmNewPass, setConfirmNewPass] = useState<string>('');
  const [securityFeedback, setSecurityFeedback] = useState<string | null>(null);

  const allPreferencesList = ['Playa', 'Montaña', 'Ciudad', 'Cultural', 'Gastronomía', 'Entretenimiento'];

  const togglePreference = (pref: string) => {
    if (preferences.includes(pref)) {
      setPreferences(preferences.filter((p) => p !== pref));
    } else {
      setPreferences([...preferences, pref]);
    }
  };

  const handleSavePersonal = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: User = {
      ...user,
      name,
      lastName,
      email,
      phone,
      country,
      city,
      birthDate,
      passport,
      preferences,
      avatarInitials: `${name[0] || ''}${lastName[0] || ''}`.toUpperCase()
    };
    onUpdateUser(updated);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass) {
      setSecurityFeedback('Por favor ingresa tu contraseña actual');
      return;
    }
    if (newPass.length < 6) {
      setSecurityFeedback('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPass !== confirmNewPass) {
      setSecurityFeedback('Las nuevas contraseñas no coinciden');
      return;
    }

    setSecurityFeedback('✓ Contraseña actualizada exitosamente');
    setCurrentPass('');
    setNewPass('');
    setConfirmNewPass('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SIDEBAR */}
        <div className="lg:col-span-1 space-y-4">
          {/* User Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
            <div className="relative inline-block mx-auto mb-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xl flex items-center justify-center">
                {user.avatarInitials}
              </div>
              {user.verified && (
                <div
                  className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#0284C7] text-white border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold"
                  title="Cuenta verificada"
                >
                  ✓
                </div>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {user.name} {user.lastName}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{user.email}</p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800/60">
              <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Cuenta Verificada</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1.5 space-y-1">
            <button
              onClick={() => setProfileTab('personal')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                profileTab === 'personal'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Información personal
            </button>

            <button
              onClick={() => setProfileTab('preferences')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                profileTab === 'preferences'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Preferencias de viaje
            </button>

            <button
              onClick={() => setProfileTab('security')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer text-left ${
                profileTab === 'security'
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Seguridad & Contraseña
            </button>

            <button
              onClick={onNavigateDashboard}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer text-left"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Mis viajes & vouchers
            </button>
          </nav>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-3 space-y-6">
          {profileTab === 'personal' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Información Personal
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Actualizá tus datos para acelerar la emisión de tus futuros billetes y vouchers.
                </p>
              </div>

              <form onSubmit={handleSavePersonal} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Teléfono Móvil
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      País de Residencia
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Número de Pasaporte / Documento
                    </label>
                    <input
                      type="text"
                      value={passport}
                      onChange={(e) => setPassport(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-mono focus:outline-hidden focus:border-[#0284C7]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs transition cursor-pointer"
                  >
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          )}

          {profileTab === 'preferences' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Preferencias de Viaje
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Seleccioná los tipos de experiencias que más disfrutás para personalizar tus recomendaciones.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {allPreferencesList.map((pref) => {
                  const isChecked = preferences.includes(pref);
                  return (
                    <label
                      key={pref}
                      onClick={() => togglePreference(pref)}
                      className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between cursor-pointer transition ${
                        isChecked
                          ? 'border-[#0284C7] bg-sky-50/50 dark:bg-sky-950/30 text-[#0284C7] dark:text-sky-300'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100/50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>{pref}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-[#0284C7] rounded-sm focus:ring-0"
                      />
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleSavePersonal}
                  className="px-4 py-2 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs transition cursor-pointer"
                >
                  Guardar preferencias
                </button>
              </div>
            </div>
          )}

          {profileTab === 'security' && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Seguridad & Contraseña
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mantené tu cuenta protegida actualizando periódicamente tu clave de acceso.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                {securityFeedback && (
                  <div
                    className={`p-3 rounded-md text-xs font-medium ${
                      securityFeedback.startsWith('✓')
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    {securityFeedback}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPass}
                    onChange={(e) => setConfirmNewPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-md bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold text-xs transition cursor-pointer"
                  >
                    Actualizar contraseña
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. CHECKOUT COMPONENT CON 3D FLIP CARD
// ==========================================
interface CheckoutPageProps {
  user: User | null;
  pkg: Package;
  cartItems?: CartItem[];
  onClearCart?: () => void;
  currency?: CurrencyType;
  formatPrice?: (val: number) => string;
  passengersCount: number;
  paymentDone: boolean;
  bookingCode: string;
  onConfirmPayment: (code: string, newTrip: Trip) => void;
  onGoToDashboard: () => void;
  onExploreMore: () => void;
}

function CheckoutPage({
  user,
  pkg,
  cartItems = [],
  onClearCart,
  currency: _currency = 'ARS',
  formatPrice,
  passengersCount,
  paymentDone,
  bookingCode,
  onConfirmPayment,
  onGoToDashboard,
  onExploreMore
}: CheckoutPageProps) {
  // Travelers form
  const [firstName, setFirstName] = useState<string>(user?.name || 'María');
  const [lastName, setLastName] = useState<string>(user?.lastName || 'González');
  const [email, setEmail] = useState<string>(user?.email || 'maria.gonzalez@horizontemoderno.com');
  const [phone, setPhone] = useState<string>(user?.phone || '+54 9 11 4829-1928');
  const [passport, setPassport] = useState<string>(user?.passport || 'PAS-982341');
  const [nationality, setNationality] = useState<string>('Argentina');

  // Payment method state
  const [paymentType, setPaymentType] = useState<'tarjeta' | 'debito' | 'transferencia'>('tarjeta');
  const [cardNumber, setCardNumber] = useState<string>('4532 8901 2345 6789');
  const [cardHolder, setCardHolder] = useState<string>(
    user ? `${user.name} ${user.lastName}`.toUpperCase() : 'MARÍA GONZÁLEZ'
  );
  const [expiry, setExpiry] = useState<string>('12/28');
  const [cvv, setCvv] = useState<string>('842');
  const [installments, setInstallments] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);
  const [generatedInvoice, setGeneratedInvoice] = useState<string>('FAC-2026-084');

  // Financial calculations
  const isFromCart = cartItems && cartItems.length > 0;
  const passengers = passengersCount || 2;
  const subtotal = isFromCart
    ? cartItems.reduce((acc, ci) => acc + ci.subtotal, 0)
    : pkg.price * passengers;
  const discount = Math.min(100, Math.floor(subtotal * 0.05));
  const total = Math.max(0, subtotal - discount);
  const installmentAmount = (total / installments).toFixed(2);

  // Auto formatting for credit card number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Auto formatting for Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setExpiry(raw);
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const generatedCode = 'VY-' + Math.floor(10000 + Math.random() * 90000);

      // Armar items para la orden relacional (Requisito 1.3.3 del Pliego)
      const orderItems: Array<{
        codigoProducto: string;
        descripcion: string;
        categoria: any;
        cantidad: number;
        precioUnitario: number;
        subtotal: number;
      }> = [];

      if (isFromCart && cartItems.length > 0) {
        cartItems.forEach((ci) => {
          orderItems.push({
            codigoProducto: ci.producto.codigo,
            descripcion: ci.producto.nombre,
            categoria: ci.producto.categoria,
            cantidad: ci.cantidad,
            precioUnitario: ci.producto.precioUnitario,
            subtotal: ci.subtotal
          });
        });
      } else {
        orderItems.push({
          codigoProducto: `PKG-${pkg.id}`,
          descripcion: `${pkg.title} (${pkg.destination})`,
          categoria: 'paquete',
          cantidad: passengers,
          precioUnitario: pkg.price,
          subtotal: pkg.price * passengers
        });
      }

      // Persistir orden con estado 'pendiente_entrega' (Requisito 1.3.3)
      // Genera factura correlativa en tbl_ventas (Requisito 1.4.5), descuenta stock y envía 2 correos auditados (Pliego pág. 2)
      const newDbOrder = DbStorageService.createOrder({
        clienteId: user?.passport || 'CLI-001',
        clienteNombre: `${firstName} ${lastName}`.trim(),
        clienteEmail: email,
        items: orderItems,
        total: total,
        metodoPago: paymentType,
        cuotas: installments,
        notas: `Reserva web generada con código #${generatedCode}. Pasajeros: ${passengers}. Nacionalidad: ${nationality}.`
      });

      setGeneratedInvoice(newDbOrder.nroFactura);

      const newTrip: Trip = {
        id: 'trip-' + Date.now(),
        packageId: pkg.id,
        title: isFromCart ? `Reserva Múltiple (${cartItems.length} servicios)` : pkg.title,
        destination: isFromCart ? 'Itinerario Personalizado' : `${pkg.destination}, ${pkg.country}`,
        departureDate: '20 Nov, 2026',
        returnDate: '27 Nov, 2026',
        nights: pkg.nights || 7,
        passengers,
        bookingCode: generatedCode,
        totalPrice: total,
        status: 'upcoming',
        image: isFromCart ? cartItems[0].producto.imagen || pkg.image : pkg.image
      };

      if (onClearCart) onClearCart();
      onConfirmPayment(generatedCode, newTrip);
    }, 1500);
  };

  // If payment done -> Success Screen
  if (paymentDone) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6">
        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-semibold">
            <span>⏳</span>
            <span>ESTADO: PENDIENTE DE ENTREGA (Requisito 1.3.3)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Compra confirmada con éxito
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-lg mx-auto">
            El pedido ha sido asentado en el sistema con estado <strong>"Pendiente de Entrega"</strong>. El equipo de ventas verificará la disponibilidad y emitirá tus comprobantes oficiales.
          </p>

          {/* Notificación de envío dual de correos auditados */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left max-w-lg mx-auto flex items-start gap-3 text-xs mt-4">
            <span className="text-lg">📬</span>
            <div className="space-y-1">
              <strong className="text-slate-900 dark:text-white font-semibold block">
                Comprobante y Notificación Dual Despachada
              </strong>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Se enviaron <strong>2 correos electrónicos</strong>: uno a tu casilla (<span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{email}</span>) y una copia para registro a <strong>ventas@horizontemoderno.com</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Booking Card Box */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-left space-y-4 max-w-lg mx-auto shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Código de Reserva</p>
              <p className="text-xl font-mono font-bold text-[#0284C7] dark:text-sky-400">#{bookingCode}</p>
              <p className="text-[11px] font-mono text-slate-400">Factura: #{generatedInvoice}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">Total abonado</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">
                {formatPrice ? formatPrice(total) : `$${total.toLocaleString()} USD`}
              </p>
              <span className="text-[11px] text-slate-400 block capitalize">{paymentType} ({installments} {installments === 1 ? 'pago' : 'cuotas'})</span>
            </div>
          </div>

          <div className="flex items-center gap-3.5 pt-1">
            <img src={pkg.image} alt={pkg.destination} className="w-14 h-14 rounded-lg object-cover border border-slate-200 dark:border-slate-800" />
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                {isFromCart ? `Reserva Múltiple (${cartItems.length} servicios)` : pkg.title}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">{passengers} viajeros · Cobertura y asistencia incluida</p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onGoToDashboard}
            className="w-full sm:w-auto px-5 py-2.5 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs sm:text-sm transition cursor-pointer"
          >
            Ver mis Pedidos Pendientes
          </button>
          <button
            onClick={onExploreMore}
            className="w-full sm:w-auto px-5 py-2.5 rounded-md border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-xs sm:text-sm transition cursor-pointer"
          >
            Explorar más servicios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="mb-6">
        <span className="text-xs font-semibold text-[#0284C7] uppercase tracking-wider">Checkout Seguro</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
          Finalizar Reserva
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
          Completá los datos del titular y el método de pago para confirmar tu compra.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* LEFT 3/5: FORM */}
        <form onSubmit={handleConfirmOrder} className="lg:col-span-3 space-y-6">
          {/* SECCIÓN 1: DATOS DEL VIAJERO */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700">
                1
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Datos del Pasajero Titular
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Número de Pasaporte / Documento
                </label>
                <input
                  type="text"
                  required
                  value={passport}
                  onChange={(e) => setPassport(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-mono focus:outline-hidden focus:border-[#0284C7]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nacionalidad
                </label>
                <input
                  type="text"
                  required
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-hidden focus:border-[#0284C7]"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: MÉTODO DE PAGO */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700">
                2
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Método de Pago
              </h2>
            </div>

            {/* Type Selector */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentType('tarjeta')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                  paymentType === 'tarjeta'
                    ? 'border-[#0284C7] bg-sky-50/50 dark:bg-sky-950/30 text-[#0284C7] dark:text-sky-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('debito')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                  paymentType === 'debito'
                    ? 'border-[#0284C7] bg-sky-50/50 dark:bg-sky-950/30 text-[#0284C7] dark:text-sky-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Débito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('transferencia')}
                className={`py-2 px-3 rounded-lg border text-xs font-medium flex items-center justify-center gap-2 transition cursor-pointer ${
                  paymentType === 'transferencia'
                    ? 'border-[#0284C7] bg-sky-50/50 dark:bg-sky-950/30 text-[#0284C7] dark:text-sky-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                <span>Transferencia</span>
              </button>
            </div>

            {/* DYNAMIC CREDIT CARD WIDGET */}
            <Card3D
              cardNumber={cardNumber}
              cardHolder={cardHolder}
              expiry={expiry}
              cvv={cvv}
              isFlipped={isCardFlipped}
              onFlipToggle={() => setIsCardFlipped(!isCardFlipped)}
            />

            {/* Card Inputs */}
            <div className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Número de Tarjeta
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={19}
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    onFocus={() => setIsCardFlipped(false)}
                    placeholder="1234 5678 9012 3456"
                    className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-mono focus:outline-hidden focus:border-[#0284C7]"
                  />
                  <div className="absolute right-3 top-2.5 text-slate-400 dark:text-slate-500 text-xs">🔒 Seguro</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre del Titular (como figura en la tarjeta)
                </label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  onFocus={() => setIsCardFlipped(false)}
                  placeholder="MARÍA GONZÁLEZ"
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm uppercase focus:outline-hidden focus:border-[#0284C7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Vencimiento (MM/AA)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={expiry}
                    onChange={handleExpiryChange}
                    onFocus={() => setIsCardFlipped(false)}
                    placeholder="12/28"
                    className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-mono focus:outline-hidden focus:border-[#0284C7]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Código CVV
                    </label>
                    <span className="text-[10px] text-slate-400">Ver reverso</span>
                  </div>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.slice(0, 4))}
                    onFocus={() => setIsCardFlipped(true)}
                    placeholder="123"
                    className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm font-mono focus:outline-hidden focus:border-[#0284C7]"
                  />
                </div>
              </div>

              {/* Installments selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Plan de Cuotas
                </label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-[#0284C7] cursor-pointer"
                >
                  <option value={1}>1 pago de ${total.toLocaleString()} USD (Sin interés)</option>
                  <option value={3}>3 cuotas fijas de ${(total / 3).toFixed(2)} USD</option>
                  <option value={6}>6 cuotas fijas de ${(total / 6).toFixed(2)} USD</option>
                  <option value={12}>12 cuotas fijas de ${(total / 12).toFixed(2)} USD</option>
                  <option value={18}>18 cuotas fijas de ${(total / 18).toFixed(2)} USD</option>
                </select>
              </div>
            </div>

            {/* Confirm CTA Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 rounded-md bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 shadow-xs"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Procesando pago...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Confirmar pago · ${total.toLocaleString()} USD</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                🔒 Certificación PCI-DSS y encriptación de extremo a extremo.
              </p>
            </div>
          </div>
        </form>

        {/* RIGHT 2/5: STICKY SUMMARY */}
        <div className="lg:col-span-2 sticky top-24 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-5 shadow-xs">
            {/* Package Thumbnail & Title */}
            <div className="flex gap-3.5">
              <img
                src={pkg.image}
                alt={pkg.destination}
                className="w-20 h-20 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-800"
              />
              <div className="flex flex-col justify-center">
                <span className="text-[11px] font-semibold text-[#0284C7] dark:text-sky-400">
                  {pkg.tag}
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                  {pkg.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {pkg.destination}, {pkg.country} · {pkg.nights} noches
                </p>
              </div>
            </div>

            {/* Included Chips */}
            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-3">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1">El servicio incluye:</span>
              {pkg.includes.map((inc, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{inc}</span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Precio base unitario</span>
                <span>${pkg.price.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Pasajeros ({passengers} personas)</span>
                <span>${subtotal.toLocaleString()} USD</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tasas aeroportuarias & IVA</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Incluidos</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Bonificación online</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">-${discount} USD</span>
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Total a pagar</span>
                  {installments > 1 && (
                    <span className="block text-[11px] text-slate-500">
                      {installments} cuotas de ${installmentAmount} USD
                    </span>
                  )}
                </div>
                <span className="text-xl font-bold text-[#0284C7] dark:text-sky-400">
                  ${total.toLocaleString()} USD
                </span>
              </div>
            </div>

            {/* Guarantees */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg text-[11px] text-slate-600 dark:text-slate-400 space-y-1 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Garantía y Asistencia Operativa</span>
              </div>
              <p>Seguimiento continuo de tu itinerario y entrega formal auditada por el Jefe de Ventas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 7. FOOTER COMPONENT
// ==========================================

// ==========================================
// 6.5 TÉRMINOS Y CONDICIONES COMPONENT
// ==========================================
interface TermsPageProps {
  onNavigate: (page: PageType) => void;
}

function TermsPage({ onNavigate }: TermsPageProps) {
  const [activeSection, setActiveSection] = useState<string>('seccion-1');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [acceptedPolicy, setAcceptedPolicy] = useState<boolean>(false);

  const sections = [
    {
      id: 'seccion-1',
      number: '01',
      icon: '📌',
      title: 'Ámbito de Aplicación y Objeto del Servicio',
      summary: 'Marco contractual entre el viajero y Horizonte Moderno Inc.',
      content: [
        'El presente documento establece las condiciones generales que regulan el uso de la plataforma digital, la tecnología de visualización 3D y la adquisición de paquetes turísticos comercializados por Horizonte Moderno Inc. (en adelante, "Horizonte Moderno").',
        'Al navegar, registrar una cuenta o efectuar el pago de una reserva a través de nuestros sistemas web, el Usuario declara ser mayor de 18 años, contar con capacidad legal plena y aceptar sin reservas las presentes cláusulas contractuales.',
        'Horizonte Moderno actúa como agencia de viajes mayorista y operadora turística digital, intermediando entre los usuarios finales y los prestatarios directos de servicios de transporte aéreo, alojamiento hotelero, traslados terrestres y actividades recreativas en destino.'
      ]
    },
    {
      id: 'seccion-2',
      number: '02',
      icon: '💳',
      title: 'Reservas, Precios y Medios de Pago 3D-Secure',
      summary: 'Transparencia de tarifas en USD, emisión instantánea y seguridad bancaria.',
      content: [
        'Todas las tarifas publicadas se encuentran expresadas en Dólares Estadounidenses (USD), e incluyen tasas aeroportuarias, impuestos hoteleros e Impuesto al Valor Agregado (IVA), salvo indicación explícita en el detalle del paquete.',
        'El procesamiento de pagos con tarjeta de crédito y débito se realiza mediante pasarelas con certificación internacional PCI-DSS Nivel 1 y validación de seguridad biométrica 3D-Secure. Ningún dato sensible de tarjeta (como el código CVV) es retenido en texto plano en nuestros servidores.',
        'La confirmación de la reserva y la emisión de los billetes con código de reserva oficial y Tarjeta de Embarque 3D (Boarding Pass 3D) se realiza de forma inmediata una vez validada la transacción por la entidad bancaria emisora.',
        'En modalidades de pago en cuotas, el usuario se compromete al cumplimiento del cronograma acordado según los términos de su banco emisor o tarjeta de crédito.'
      ]
    },
    {
      id: 'seccion-3',
      number: '03',
      icon: '🔄',
      title: 'Políticas de Cancelación, Reembolsos y Cambios de Fecha',
      summary: 'Ventana de cancelación 24h, plazos de solicitud y devoluciones garantizadas.',
      content: [
        'Ventana de Arrepentimiento de 24 Horas: El usuario goza del derecho a cancelar su reserva sin penalidad alguna dentro de las primeras 24 horas continuas a la confirmación de la compra, siempre que la fecha de salida diste al menos 14 días corridos.',
        'Cancelaciones anticipadas (más de 30 días antes del viaje): Dan derecho al reembolso del 100% del importe abonado o a la reprogramación de fecha sin penalización administrativa.',
        'Cancelaciones entre 29 y 15 días previos: Sujetas a una retención del 25% por gastos operativos de reserva o emisión de crédito canjeable por otro destino de Horizonte Moderno.',
        'Cancelaciones con menos de 14 días: Quedan sujetas a las condiciones y penalidades estipuladas por las aerolíneas y cadenas de resorts asociadas al paquete.',
        'Procedimiento de Reembolso: Las devoluciones aprobadas se tramitan en un plazo de 5 a 10 días hábiles en el mismo método de pago utilizado originariamente.'
      ]
    },
    {
      id: 'seccion-4',
      number: '04',
      icon: '🛡️',
      title: 'Garantía y Cobertura Horizonte Care',
      summary: 'Asistencia médica internacional, seguro de equipaje y soporte 24/7.',
      content: [
        'Todos los paquetes de categoría "Más vendido", "Exclusivo" y "Lujo" integran la cobertura médica y legal Horizonte Care, con un tope asistencial de hasta $50,000 USD por pasajero ante contingencias de salud en destino.',
        'La cobertura contempla compensación económica por extravío o rotura de equipaje despachado y asistencia inmediata ante demoras de vuelo superiores a 4 horas.',
        'Exclusiones de Fuerza Mayor: Horizonte Moderno queda eximido de responsabilidad directa frente a demoras o cancelaciones motivadas por eventos climáticos extremos, desastres naturales, disposiciones sanitarias gubernamentales sobrevenidas o conflictos bélicos imprevistos.'
      ]
    },
    {
      id: 'seccion-5',
      number: '05',
      icon: '🛂',
      title: 'Documentación de Viaje, Visados y Requisitos Sanitarios',
      summary: 'Responsabilidades del pasajero respecto a pasaporte, visas y vacunas.',
      content: [
        'Es responsabilidad personal y exclusiva de cada viajero contar con su pasaporte vigente con una validez residual mínima de 6 meses contados desde la fecha prevista de regreso.',
        'El usuario debe gestionar y validar oportunamente los visados de entrada (ej. ESTA para Estados Unidos, ETIAS para la Unión Europea, visados turísticos para Emiratos Árabes o Indonesia) requeridos por las autoridades migratorias competentes.',
        'Horizonte Moderno no se responsabiliza por la denegación de embarque o ingreso a territorio extranjero debido a documentación insuficiente, antecedentes migratorios o incumplimiento de certificados de vacunación obligatorios.'
      ]
    },
    {
      id: 'seccion-6',
      number: '06',
      icon: '🌐',
      title: 'Propiedad Intelectual y Tecnología Inmersiva 3D',
      summary: 'Derechos sobre el motor gráfico WebGL, diseño de marca y algoritmos.',
      content: [
        'Los modelos tridimensionales del globo terráqueo interactivo, los algoritmos de cálculo de curvas geodésicas de vuelo, la tarjeta interactiva 3D y la identidad visual de "Horizonte Moderno" son propiedad intelectual exclusiva de Horizonte Moderno Inc.',
        'Queda expresamente prohibida la ingeniería inversa, la extracción masiva automatizada de datos (web scraping), o la reproducción comercial de los elementos gráficos y técnicos de la plataforma sin autorización previa y por escrito.'
      ]
    },
    {
      id: 'seccion-7',
      number: '07',
      icon: '🔒',
      title: 'Protección de Datos Personales y Política de Privacidad',
      summary: 'Tratamiento conforme a GDPR, no comercialización y privacidad total.',
      content: [
        'En cumplimiento con el Reglamento General de Protección de Datos (GDPR) y normativas internacionales de protección de privacidad, tratamos su información con estándares estrictos de confidencialidad.',
        'Sus datos personales solo son compartidos con los prestadores esenciales del servicio contratado (aerolíneas para emisión de billetes aéreos y hoteles para registro de huéspedes). Nunca vendemos ni cedemos sus datos a empresas de publicidad de terceros.',
        'Usted puede ejercer en cualquier momento sus derechos de acceso, rectificación, supresión o limitación del tratamiento de sus datos enviando una solicitud a privacy@horizontemoderno.com.'
      ]
    },
    {
      id: 'seccion-8',
      number: '08',
      icon: '⚖️',
      title: 'Resolución de Controversias, Jurisdicción y Contacto',
      summary: 'Canales de mediación directa, arbitraje y atención jurídica 24/7.',
      content: [
        'Las partes acuerdan someter cualquier diferendo o divergencia sobre la interpretación o ejecución de los presentes términos a una instancia previa de conciliación directa ante el Centro de Atención al Consumidor de Horizonte Moderno.',
        'Canales Oficiales de Contacto Legal y Soporte:',
        '• Línea Telefónica Prioritaria: 0800-HORIZONTE (Disponible 24/7)',
        '• Correo Electrónico Legal: legal@horizontemoderno.com',
        '• Oficina Central: Torre Horizonte, Nivel 32, Distrito Financiero Internacional.'
      ]
    }
  ];

  const filteredSections = sections.filter((sec) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.summary.toLowerCase().includes(q) ||
      sec.content.some((c) => c.toLowerCase().includes(q))
    );
  });

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8 animate-fadeIn">
      {/* BREADCRUMB & HEADER */}
      <div className="space-y-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
          >
            Inicio
          </button>
          <span>/</span>
          <span>Información Legal</span>
          <span>/</span>
          <span className="text-slate-900 dark:text-white font-medium">Términos y Condiciones</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 mb-2">
              <span>📋</span> Documento Oficial · Versión 4.2
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
              Términos y Condiciones Generales
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Bases contractuales, derechos del consumidor, políticas de cancelación y garantías para el uso de la plataforma y reservas en Horizonte Moderno.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 cursor-pointer shadow-xs"
              title="Imprimir o guardar como PDF"
            >
              <svg className="w-3.5 h-3.5 text-[#0284C7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="px-4 py-2 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <span>Volver a Servicios</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
          <span>Última actualización: <strong>28 de Septiembre de 2026</strong></span>
          <span>•</span>
          <span>Jurisdicción: <strong>Estándar Internacional</strong></span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            Vigente y certificado
          </span>
        </div>
      </div>

      {/* 4 HIGHLIGHT PILLARS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs h-full flex flex-col justify-between">
          <div className="w-9 h-9 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] dark:text-sky-400 flex items-center justify-center text-base font-bold mb-3 border border-sky-100 dark:border-sky-900/40">
            ⚡
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Cancelación 24h Sin Costo</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Derecho a desistimiento total en las primeras 24 horas para reservas con más de 14 días de antelación.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs h-full flex flex-col justify-between">
          <div className="w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-[#EA580C] dark:text-orange-400 flex items-center justify-center text-base font-bold mb-3 border border-orange-100 dark:border-orange-900/40">
            🔐
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Pagos Seguros SSL</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Encriptación bancaria de 256 bits y verificación EMV para transacciones confiables.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs h-full flex flex-col justify-between">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base font-bold mb-3 border border-emerald-100 dark:border-emerald-900/40">
            🏥
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Horizonte Care Incluido</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Asistencia médica internacional hasta $50,000 USD y seguro de equipaje en todos los paquetes.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs h-full flex flex-col justify-between">
          <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-base font-bold mb-3 border border-slate-200 dark:border-slate-700">
            🏷️
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">Precios Finales Sin Sorpresas</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Tasas aéreas, cargos de gestión e IVA incluidos desde el primer momento hasta la confirmación.
            </p>
          </div>
        </div>
      </div>

      {/* TWO-COLUMN LAYOUT: STICKY TOC & SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: INDEX & SEARCH */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Índice de Cláusulas
              </span>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                8 Secciones
              </span>
            </div>

            {/* Filter Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar cláusula (ej. reembolso)..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-[#0284C7]"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Navigation List */}
            <nav className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
              {filteredSections.map((sec) => {
                const isActive = activeSection === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-2 ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-xs shrink-0">{sec.icon}</span>
                    <span className="truncate flex-1">{sec.title}</span>
                    <span className={`text-[10px] font-mono shrink-0 ${isActive ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'}`}>
                      {sec.number}
                    </span>
                  </button>
                );
              })}

              {filteredSections.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No se encontraron cláusulas para "{searchFilter}".
                </p>
              )}
            </nav>
          </div>

          {/* Contact & Support Box */}
          <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow-xs space-y-2.5">
            <div className="flex items-center gap-2 text-sky-400">
              <span className="text-sm">⚖️</span>
              <span className="text-xs font-semibold uppercase tracking-wider">Asesoría Legal</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Tenés dudas o necesitás un certificado formal para presentar ante tu seguro o empleador? Nuestro equipo está a tu disposición.
            </p>
            <div className="pt-2 border-t border-slate-800 space-y-1 text-xs text-slate-300 font-mono">
              <p>legal@horizontemoderno.com</p>
              <p>0800-HORIZONTE (Disponible 24/7)</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED SECTIONS */}
        <div className="lg:col-span-8 space-y-6">
          {filteredSections.map((sec) => (
            <div
              key={sec.id}
              id={sec.id}
              className="scroll-mt-24 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-sm font-bold border border-slate-200 dark:border-slate-700 shrink-0">
                    {sec.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#0284C7] dark:text-sky-400 font-semibold uppercase tracking-wider block">
                      Cláusula {sec.number}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {sec.title}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {sec.content.map((paragraph, pIdx) => (
                  <p key={pIdx}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {/* ACCEPTANCE CARD */}
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <input
                id="policy-consent"
                type="checkbox"
                checked={acceptedPolicy}
                onChange={(e) => setAcceptedPolicy(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded-sm border-slate-300 text-[#0284C7] focus:ring-0 cursor-pointer shrink-0"
              />
              <label htmlFor="policy-consent" className="text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                He leído detenidamente las políticas de reserva, cancelación y cobertura del servicio de <strong>Horizonte Moderno</strong> y declaro estar conforme con sus términos.
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500">
                {acceptedPolicy ? '✓ Conformidad registrada en tu sesión actual.' : 'Marcá la casilla para confirmar lectura.'}
              </span>
              <button
                onClick={() => onNavigate('home')}
                className="w-full sm:w-auto px-4 py-2 rounded-md bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold text-xs transition cursor-pointer"
              >
                Aceptar y Explorar Servicios
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: Brand */}
          <div className="lg:col-span-2 space-y-3">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-md bg-[#0284C7] flex items-center justify-center text-white">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                Horizonte Moderno
              </span>
            </button>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Plataforma de gestión de reservas, ventas turísticas y paquetes vacacionales integrales para la República Argentina y el mundo.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500">Redes:</span>
              <a href="#instagram" className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 hover:text-white transition">Instagram</a>
              <a href="#facebook" className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 hover:text-white transition">Facebook</a>
              <a href="#linkedin" className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-800 text-slate-300 hover:text-white transition">LinkedIn</a>
            </div>
          </div>

          {/* Col 2: Destinos */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Destinos Populares</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><button onClick={() => onNavigate('home')} className="hover:text-white transition">Cancún Todo Incluido</button></li>
              <li><button onClick={() => onNavigate('home')} className="hover:text-white transition">París & Roma</button></li>
              <li><button onClick={() => onNavigate('home')} className="hover:text-white transition">Bali & Templos</button></li>
              <li><button onClick={() => onNavigate('home')} className="hover:text-white transition">Machu Picchu</button></li>
              <li><button onClick={() => onNavigate('home')} className="hover:text-white transition">Santorini</button></li>
            </ul>
          </div>

          {/* Col 3: Empresa */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Institucional</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><a href="#about" className="hover:text-white transition">Quiénes somos</a></li>
              <li><a href="#press" className="hover:text-white transition">Prensa & Novedades</a></li>
              <li><a href="#sustainability" className="hover:text-white transition">Turismo Sostenible</a></li>
              <li><a href="#careers" className="hover:text-white transition">Trabajá con nosotros</a></li>
            </ul>
          </div>

          {/* Col 4: Soporte */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Ayuda & Normativa</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li><a href="#help" className="hover:text-white transition">Centro de ayuda 24/7</a></li>
              <li><a href="#status" className="hover:text-white transition">Estado del servicio</a></li>
              <li><button onClick={() => onNavigate('terms')} className="hover:text-white transition cursor-pointer text-left">Políticas de cancelación</button></li>
              <li><button onClick={() => onNavigate('terms')} className="hover:text-white transition cursor-pointer text-left">Términos del servicio</button></li>
              <li><button onClick={() => onNavigate('terms')} className="hover:text-white transition cursor-pointer text-left">Privacidad y datos</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Horizonte Moderno Inc. Todos los derechos reservados.</p>
          <div className="flex items-center gap-3">
            <span>Operaciones protegidas con encriptación SSL de 256 bits</span>
            <div className="flex gap-1.5 text-slate-400 font-mono text-[10px]">
              <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">VISA</span>
              <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">MC</span>
              <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">AMEX</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
