import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

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
}

export type PageType = 'home' | 'login' | 'register' | 'dashboard' | 'profile' | 'checkout' | 'terms';


// ==========================================
// 🌟 CHICHES & DELIGHT SYSTEM: CURRENCIES & SOUND
// ==========================================
type CurrencyType = 'USD' | 'EUR' | 'ARS' | 'MXN';

const CURRENCY_CONFIG: Record<CurrencyType, { rate: number; symbol: string; label: string; flag: string }> = {
  USD: { rate: 1.0, symbol: 'USD $', label: 'USD', flag: '🇺🇸' },
  EUR: { rate: 0.92, symbol: '€', label: 'EUR', flag: '🇪🇺' },
  ARS: { rate: 1350, symbol: 'AR$', label: 'ARS', flag: '🇦🇷' },
  MXN: { rate: 18.2, symbol: 'Mex$', label: 'MXN', flag: '🇲🇽' },
};

const formatPriceCustom = (priceUSD: number, cur: CurrencyType = 'USD') => {
  const conf = CURRENCY_CONFIG[cur] || CURRENCY_CONFIG.USD;
  const converted = Math.round(priceUSD * conf.rate);
  return `${conf.symbol} ${converted.toLocaleString('es-ES')} ${conf.label}`;
};

// Web Audio Synthesizer (Zero External Dependencies)
class SoundFxEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private noiseNode: AudioNode | null = null;
  public isAmbiencePlaying: boolean = false;

  private getCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioClass) this.ctx = new AudioClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  playClick() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {
      // Ignored
    }
  }

  playWoosh() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Ignored
    }
  }

  playCelebration() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const chord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.4);
      });
    } catch {
      // Ignored
    }
  }

  toggleOceanWaves(enable: boolean) {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      if (enable) {
        if (this.isAmbiencePlaying) return;
        const bufLen = ctx.sampleRate * 2;
        const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
        const data = buf.getChannelData(0);
        let last = 0;
        for (let i = 0; i < bufLen; i++) {
          const w = Math.random() * 2 - 1;
          data[i] = (last + 0.02 * w) / 1.02;
          last = data[i];
          data[i] *= 3.0;
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(320, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.035, ctx.currentTime);

        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.setValueAtTime(0.16, ctx.currentTime);
        lfoGain.gain.setValueAtTime(0.025, ctx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);

        src.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        src.start();
        lfo.start();

        this.ambientGain = gain;
        this.noiseNode = src;
        this.isAmbiencePlaying = true;
      } else {
        if (this.ambientGain && ctx) {
          this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
          setTimeout(() => {
            if (this.noiseNode && 'stop' in this.noiseNode) (this.noiseNode as AudioBufferSourceNode).stop();
            this.isAmbiencePlaying = false;
          }, 450);
        }
      }
    } catch {
      // Ignored
    }
  }
}

const soundFx = new SoundFxEngine();
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
  points: 14850
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

function TiltCard({ children, className = '', maxTilt = 12, scale = 1.02 }: TiltCardProps) {
  const [tilt, setTilt] = useState<{ x: number; y: number; glareX: number; glareY: number; isHovered: boolean }>({
    x: 0,
    y: 0,
    glareX: 50,
    glareY: 50,
    isHovered: false
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * maxTilt;
    const rotY = ((x - centerX) / centerX) * maxTilt;

    setTilt({
      x: rotX,
      y: rotY,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
      isHovered: true
    });
  };

  const handleMouseLeave = () => {
    setTilt((prev) => ({ ...prev, x: 0, y: 0, isHovered: false }));
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`perspective-1000 ${className}`}
    >
      <div
        style={{
          transform: tilt.isHovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale3d(${scale}, ${scale}, ${scale})`
            : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transition: tilt.isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
          transformStyle: 'preserve-3d'
        }}
        className="relative w-full h-full"
      >
        {children}

        {/* Specular 3D Reflection / Glare */}
        {tilt.isHovered && (
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl z-30 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.22) 0%, transparent 60%)`,
              mixBlendMode: 'overlay'
            }}
          />
        )}
      </div>
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
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotX = -((y - rect.height / 2) / rect.height) * 14;
    const rotY = ((x - rect.width / 2) / rect.width) * 14;
    setTilt({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="w-full max-w-sm h-52 perspective-1500 cursor-pointer select-none"
        onClick={onFlipToggle}
        title="Haz clic para voltear la tarjeta en 3D"
      >
        <div
          style={{
            transform: isFlipped
              ? `rotateY(180deg)`
              : `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          className="relative w-full h-full preserve-3d shadow-2xl rounded-2xl"
        >
          {/* FRONT FACE OF 3D CARD */}
          <div className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-tr from-[#0F172A] via-[#1E293B] to-[#0EA5E9] dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#0284C7] p-6 text-white shadow-2xl flex flex-col justify-between overflow-hidden border border-[#E2E8F0] dark:border-[#94A3B8]/40">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 dark:bg-[#94A3B8]/10 rounded-full blur-xl" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#F97316]/20 rounded-full blur-2xl" />

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                {/* 3D Metallic EMV Chip */}
                <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 p-1 flex items-center justify-center shadow-md border border-amber-600/30">
                  <div className="w-full h-full border border-amber-800/40 rounded-xs flex flex-col justify-between">
                    <div className="border-b border-amber-800/40 h-1/2" />
                  </div>
                </div>
                <span className="text-[10px] tracking-widest text-[#F1F5F9] dark:text-[#94A3B8] uppercase font-bold">
                  Horizonte Moderno 3D Pay
                </span>
              </div>
              <span className="text-xl font-black italic tracking-wider text-white dark:text-[#E2E8F0]">VISA</span>
            </div>

            <div className="relative z-10">
              <span className="text-[10px] text-[#E2E8F0] dark:text-[#94A3B8] uppercase tracking-widest block mb-0.5">
                Número de tarjeta
              </span>
              <p className="text-lg sm:text-xl font-mono tracking-widest text-white dark:text-[#E2E8F0] drop-shadow-sm font-semibold">
                {cardNumber || '•••• •••• •••• ••••'}
              </p>
            </div>

            <div className="flex items-center justify-between relative z-10 text-xs">
              <div>
                <span className="text-[9px] text-[#E2E8F0] dark:text-[#94A3B8] uppercase tracking-widest block">Titular</span>
                <p className="font-bold tracking-wider truncate max-w-[180px] text-white dark:text-[#E2E8F0]">
                  {cardHolder || 'NOMBRE APELLIDO'}
                </p>
              </div>
              <div>
                <span className="text-[9px] text-[#E2E8F0] dark:text-[#94A3B8] uppercase tracking-widest block">Vence</span>
                <p className="font-mono font-bold text-white dark:text-[#E2E8F0]">{expiry || 'MM/AA'}</p>
              </div>
            </div>
          </div>

          {/* BACK FACE OF 3D CARD */}
          <div
            style={{ transform: 'rotateY(180deg)' }}
            className="absolute inset-0 backface-hidden rounded-2xl bg-gradient-to-tr from-[#475569] via-[#64748B] to-[#0EA5E9] dark:from-[#0F172A] dark:via-[#0F172A] dark:to-[#1E293B] py-6 text-white shadow-2xl flex flex-col justify-between overflow-hidden border border-[#E2E8F0] dark:border-[#334155]"
          >
            {/* Magnetic Stripe */}
            <div className="w-full h-11 bg-black/85 shadow-inner" />

            {/* Signature & CVV Panel */}
            <div className="px-6 space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-9 bg-white/90 rounded-sm flex items-center justify-end px-3">
                  <span className="font-mono font-bold text-slate-800 text-sm tracking-wider">
                    {cvv ? `CVV: ${cvv}` : 'CVV: •••'}
                  </span>
                </div>
                {/* 3D Hologram Security Stamp */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-pink-400 via-amber-300 to-cyan-400 shadow-sm flex items-center justify-center text-[8px] font-black text-slate-900 border border-white/50">
                  3D
                </div>
              </div>

              <p className="text-[9px] text-[#F1F5F9] dark:text-[#94A3B8] leading-tight">
                Esta tarjeta está encriptada con tecnología 3D-Secure de Horizonte Moderno. No compartas tu código de seguridad con terceros.
              </p>
            </div>

            <div className="px-6 flex justify-between items-center text-[10px] text-[#E2E8F0] dark:text-[#94A3B8]">
              <span>Servicio al cliente 24/7: 0800-HORIZONTE</span>
              <span className="font-mono font-bold">EMV-3D</span>
            </div>
          </div>
        </div>
      </div>

      {/* Button to flip 3D card */}
      <button
        type="button"
        onClick={onFlipToggle}
        className="px-4 py-1.5 rounded-full text-xs font-semibold border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
      >
        <svg className="w-3.5 h-3.5 transform transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>{isFlipped ? 'Ver frente de tarjeta' : 'Girar tarjeta para ver reverso (CVV) 3D'}</span>
      </button>
    </div>
  );
}

// =========================================================
// 🎫 COMPONENTE 3D: BOARDING PASS ISOMÉTRICO EN 3D
// =========================================================
function BoardingPass3D({ trip, user }: { trip: Trip; user: User }) {
  return (
    <TiltCard maxTilt={15} scale={1.03} className="w-full">
      <div className="relative rounded-3xl bg-gradient-to-r from-white via-white to-[#F8FAFC] dark:from-[#1E293B] dark:via-[#1E293B] dark:to-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] p-6 sm:p-8 shadow-2xl overflow-hidden preserve-3d">
        {/* Holographic 3D Foil Badge */}
        <div
          style={{ transform: 'translateZ(35px)' }}
          className="absolute -top-3 -right-3 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 via-emerald-300 to-teal-400 opacity-90 blur-xs flex items-center justify-center shadow-lg"
        />
        <div
          style={{ transform: 'translateZ(40px)' }}
          className="absolute top-4 right-4 px-3 py-1 rounded-full bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-md border border-[#E2E8F0] dark:border-[#334155] text-[10px] font-black tracking-widest text-[#F97316] uppercase shadow-sm"
        >
          ★ BOARDING PASS 3D
        </div>

        <div className="space-y-6" style={{ transform: 'translateZ(25px)' }}>
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0EA5E9] to-[#F97316] dark:from-[#334155] dark:to-[#94A3B8] flex items-center justify-center text-white shadow-md">
              ✈️
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8] tracking-wider">
                Vuelo Internacional Confirmado
              </span>
              <h3 className="text-xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0]">
                {trip.title}
              </h3>
            </div>
          </div>

          {/* Route Graphic */}
          <div className="flex items-center justify-between py-3 border-y border-dashed border-[#E2E8F0] dark:border-[#334155]">
            <div className="text-left">
              <span className="text-2xl font-black font-fraunces text-[#0EA5E9] dark:text-[#E2E8F0]">ORIG</span>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Vuelo de Salida</p>
              <p className="text-[11px] font-semibold text-[#1E293B] dark:text-white">{trip.departureDate}</p>
            </div>

            <div className="flex-1 flex flex-col items-center px-4">
              <div className="w-full flex items-center justify-center gap-2 text-xs text-[#F97316]">
                <div className="flex-1 border-t border-dashed border-[#F97316]" />
                <span>✈️ {trip.nights} Noches</span>
                <div className="flex-1 border-t border-dashed border-[#F97316]" />
              </div>
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1 font-mono">NON-STOP CLASS</span>
            </div>

            <div className="text-right">
              <span className="text-2xl font-black font-fraunces text-[#0EA5E9] dark:text-[#E2E8F0]">DEST</span>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{trip.destination}</p>
              <p className="text-[11px] font-semibold text-[#1E293B] dark:text-white">{trip.returnDate}</p>
            </div>
          </div>

          {/* Passenger & Booking Code */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] block">Pasajero</span>
              <span className="font-bold text-[#1E293B] dark:text-[#E2E8F0]">{user.name} {user.lastName}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] block">Pasaporte</span>
              <span className="font-mono font-bold text-[#1E293B] dark:text-[#E2E8F0]">{user.passport}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] block">Reserva</span>
              <span className="font-mono font-bold text-[#F97316]">#{trip.bookingCode}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] block">Asiento / Gate</span>
              <span className="font-bold text-[#1E293B] dark:text-[#E2E8F0]">12A · Puerta 4B</span>
            </div>
          </div>

          {/* Barcode Strip */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-[#334155]">
            <div className="flex gap-1 h-8 items-center opacity-70">
              <div className="w-1 h-full bg-slate-800 dark:bg-white" />
              <div className="w-2 h-full bg-slate-800 dark:bg-white" />
              <div className="w-0.5 h-full bg-slate-800 dark:bg-white" />
              <div className="w-1.5 h-full bg-slate-800 dark:bg-white" />
              <div className="w-3 h-full bg-slate-800 dark:bg-white" />
              <div className="w-1 h-full bg-slate-800 dark:bg-white" />
              <div className="w-0.5 h-full bg-slate-800 dark:bg-white" />
              <div className="w-2 h-full bg-slate-800 dark:bg-white" />
              <div className="w-1.5 h-full bg-slate-800 dark:bg-white" />
              <div className="w-0.5 h-full bg-slate-800 dark:bg-white" />
              <div className="w-2 h-full bg-slate-800 dark:bg-white" />
            </div>
            <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
              VERIFICADO ELECTRÓNICAMENTE · HORIZONTE MODERNO 3D
            </span>
          </div>
        </div>
      </div>
    </TiltCard>
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

  const [showPaletteModal, setShowPaletteModal] = useState<boolean>(false);
  const [currency, setCurrency] = useState<CurrencyType>('USD');
  const [soundAmbience, setSoundAmbience] = useState<boolean>(false);
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
      <header className="sticky top-0 z-40 bg-[#F8FAFC]/95 dark:bg-[#0F172A]/95 backdrop-blur-md border-b border-[#E2E8F0] dark:border-[#334155] shadow-xs transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo con Micro-Tilt 3D */}
          <button
            onClick={() => navigateTo('home')}
            className="flex items-center gap-2 group text-left cursor-pointer focus:outline-hidden"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0EA5E9] to-[#64748B] dark:from-[#334155] dark:to-[#94A3B8] flex items-center justify-center text-white shadow-lg shadow-emerald-950/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <svg className="w-6 h-6 transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-2xl font-black tracking-tight font-fraunces">
                <span className="text-[#1E293B] dark:text-[#E2E8F0]">Horizonte</span><span className="text-[#0EA5E9] ml-1">Moderno</span>
                <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded-sm bg-[#F97316]/20 text-[#F97316] font-sans font-bold">3D</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] dark:text-[#94A3B8]">
                Turismo & Experiencias
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links & Controls */}
            {/* CURRENCY SELECTOR */}
            <div className="relative flex items-center">
              <select
                value={currency}
                onChange={(e) => {
                  soundFx.playClick();
                  setCurrency(e.target.value as CurrencyType);
                }}
                className="bg-white dark:bg-slate-800 text-[#1E293B] dark:text-[#E2E8F0] border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-bold cursor-pointer hover:border-[#0EA5E9] focus:outline-hidden transition shadow-xs"
                title="Cambiar divisa"
              >
                <option value="USD">🇺🇸 USD ($)</option>
                <option value="EUR">🇪🇺 EUR (€)</option>
                <option value="ARS">🇦🇷 ARS ($)</option>
                <option value="MXN">🇲🇽 MXN ($)</option>
              </select>
            </div>

            {/* SOUND AMBIENCE TOGGLE */}
            <button
              onClick={() => {
                const next = !soundAmbience;
                setSoundAmbience(next);
                soundFx.toggleOceanWaves(next);
              }}
              className={`p-2 px-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-bold shadow-xs active:scale-95 ${
                soundAmbience
                  ? 'bg-sky-500/10 border-sky-500 text-[#0EA5E9]'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400'
              }`}
              title="Alternar sonido ambiental de olas de playa 3D"
            >
              {soundAmbience ? (
                <>
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-1 bg-[#0EA5E9] rounded-full eq-bar-1" />
                    <span className="w-1 bg-[#0EA5E9] rounded-full eq-bar-2" />
                    <span className="w-1 bg-[#0EA5E9] rounded-full eq-bar-3" />
                  </div>
                  <span className="text-xs">Olas 3D</span>
                </>
              ) : (
                <>
                  <span className="text-xs">🔇</span>
                  <span className="text-xs">Sonido</span>
                </>
              )}
            </button>
          <nav className="hidden md:flex items-center gap-5">
            <button
              onClick={() => navigateTo('home')}
              className={`text-sm font-medium transition-colors cursor-pointer ${
                page === 'home'
                  ? 'text-[#0EA5E9] dark:text-[#E2E8F0] font-bold'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-white'
              }`}
            >
              Explorar Paquetes
            </button>

            {/* THEME TOGGLE BUTTON */}
            <button
              onClick={toggleTheme}
              aria-label="Cambiar tema de color"
              className="relative p-2 px-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-bold
                bg-white border-[#E2E8F0] text-[#0EA5E9] hover:bg-[#F1F5F9]
                dark:bg-[#1E293B] dark:border-[#334155] dark:text-[#E2E8F0] dark:hover:bg-[#334155] shadow-xs active:scale-95"
              title={isDarkMode ? 'Modo Oscuro Activo. Clic para cambiar a Modo Claro' : 'Modo Claro Activo. Clic para cambiar a Modo Oscuro'}
            >
              {isDarkMode ? (
                <>
                  <span className="text-amber-300 text-sm">☀️</span>
                  <span className="text-xs">Modo Claro</span>
                </>
              ) : (
                <>
                  <span className="text-[#0EA5E9] text-sm">🌙</span>
                  <span className="text-xs">Modo Oscuro</span>
                </>
              )}
            </button>

            {/* PALETTE INSPECTOR BUTTON */}
            <button
              onClick={() => setShowPaletteModal(true)}
              className="px-2.5 py-1.5 rounded-xl border border-[#38BDF8] dark:border-[#334155] text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              title="Ver paletas de colores UX/UI"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#64748B] dark:bg-[#94A3B8] inline-block" />
              <span>Paleta UX/UI</span>
            </button>

            {user ? (
              <>
                <button
                  onClick={() => navigateTo('dashboard')}
                  className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                    page === 'dashboard'
                      ? 'text-[#0EA5E9] dark:text-[#E2E8F0] font-bold'
                      : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  Mis Viajes
                </button>

                <div className="h-6 w-px bg-[#E2E8F0] dark:bg-[#334155]" />

                {/* Profile Pill */}
                <button
                  onClick={() => navigateTo('profile')}
                  className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition border border-[#E2E8F0] dark:border-[#334155] cursor-pointer"
                  title="Mi Perfil"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0EA5E9] to-[#F97316] dark:from-[#334155] dark:to-[#94A3B8] text-white font-semibold text-xs flex items-center justify-center shadow-xs">
                    {user.avatarInitials}
                  </div>
                  <span className="text-sm font-medium text-[#1E293B] dark:text-[#E2E8F0] max-w-[120px] truncate">
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
                  className="text-xs font-semibold text-slate-500 hover:text-red-500 transition cursor-pointer flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Salir
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigateTo('login')}
                  className="text-sm font-semibold text-[#475569] dark:text-[#94A3B8] hover:text-[#0EA5E9] dark:hover:text-white transition cursor-pointer"
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => navigateTo('register')}
                  className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-semibold text-sm shadow-md shadow-orange-500/20 transition-all hover:shadow-lg active:scale-98 cursor-pointer"
                >
                  Crear Cuenta
                </button>
              </>
            )}
          </nav>

          {/* Mobile Actions Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-sm"
              aria-label="Cambiar tema"
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#1E293B] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] transition cursor-pointer"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                setShowPaletteModal(true);
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left py-2.5 px-3 rounded-lg text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] font-medium"
            >
              🎨 Ver Paletas de Diseño UX/UI
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

      {/* PALETTE INSPECTOR MODAL */}
      {showPaletteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative space-y-6 text-[#1E293B] dark:text-[#E2E8F0] animate-scaleIn my-8">
            <button
              onClick={() => setShowPaletteModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center justify-center text-sm font-bold cursor-pointer transition"
            >
              ✕
            </button>

            <div className="space-y-1 pr-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0EA5E9]/10 text-[#0EA5E9] text-[11px] font-bold uppercase tracking-wider">
                <span>🎨</span> Sistema de Diseño UI/UX
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0]">
                Arquitectura de Color: Horizonte Moderno
              </h3>
              <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#94A3B8]">
                Estructura fundamentada en la regla áurea 60-30-10 para inspirar confianza bancaria, aventura y estética minimalista con glassmorphism.
              </p>
            </div>

            {/* ROLES GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 60% DOMINANTE */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1E293B] dark:text-white">
                      60% Dominante
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                      Fondo
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mb-3">
                    Lienzo principal para limpieza visual, amplitud y calma visual.
                  </p>
                </div>
                <div className="space-y-2 font-mono text-[10px]">
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#F8FAFC] border border-slate-200 text-slate-800">
                    <div className="w-5 h-5 rounded-md bg-[#F8FAFC] border border-slate-300 shrink-0" />
                    <div>
                      <span className="font-bold">#F8FAFC</span>
                      <span className="block text-[9px] text-slate-500">Claro: Blanco Caliza</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0F172A] border border-slate-700 text-white">
                    <div className="w-5 h-5 rounded-md bg-[#0F172A] border border-slate-600 shrink-0" />
                    <div>
                      <span className="font-bold">#0F172A</span>
                      <span className="block text-[9px] text-slate-400">Oscuro: Azul Abisal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 30% SECUNDARIO / MARCA */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-sky-200 dark:border-sky-500/20 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#0EA5E9]">
                      30% Marca & Confianza
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950/60 text-[#0EA5E9] font-bold">
                      Identidad
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mb-3">
                    Títulos, avatares, bordes sutiles, iconos nav y halos del globo 3D.
                  </p>
                </div>
                <div className="space-y-2 font-mono text-[10px]">
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-slate-800 dark:text-sky-200">
                    <div className="w-5 h-5 rounded-md bg-[#0EA5E9] shrink-0 shadow-xs" />
                    <div>
                      <span className="font-bold text-[#0EA5E9]">#0EA5E9</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400">Azul Océano / Cyan</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-slate-800 dark:text-sky-200">
                    <div className="w-5 h-5 rounded-md bg-[#0284C7] shrink-0" />
                    <div>
                      <span className="font-bold text-[#0284C7]">#0284C7</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400">Hover / Profundidad</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 10% ACENTO / CTA */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-orange-200 dark:border-orange-500/20 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F97316]">
                      10% Acento & CTA
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-[#F97316] font-bold">
                      Conversión
                    </span>
                  </div>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mb-3">
                    Uso exclusivo para botones "Reservar", precios y tags "Más vendido".
                  </p>
                </div>
                <div className="space-y-2 font-mono text-[10px]">
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-slate-800 dark:text-orange-200">
                    <div className="w-5 h-5 rounded-md bg-[#F97316] shrink-0 shadow-xs" />
                    <div>
                      <span className="font-bold text-[#F97316]">#F97316</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400">Naranja Aventura / Atardecer</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 text-slate-800 dark:text-orange-200">
                    <div className="w-5 h-5 rounded-md bg-[#EA580C] shrink-0" />
                    <div>
                      <span className="font-bold text-[#EA580C]">#EA580C</span>
                      <span className="block text-[9px] text-slate-500 dark:text-slate-400">Hover Conversión</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* GLASSMORPHISM & TYPOGRAPHY SPECS */}
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-800/60 backdrop-blur-md border border-slate-200 dark:border-white/10 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0EA5E9] block">
                ✨ Especificaciones de Superficies Glassmorphism & Tipografía
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 space-y-1">
                  <div className="font-bold text-[#1E293B] dark:text-[#E2E8F0]">Modo Claro:</div>
                  <p className="text-[#64748B] dark:text-[#94A3B8] font-mono text-[11px]">
                    background: rgba(255, 255, 255, 0.7)<br/>
                    backdrop-filter: blur(12px)<br/>
                    border: 1px solid rgba(255, 255, 255, 0.6)<br/>
                    texto: #1E293B / #64748B
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-white/10 space-y-1">
                  <div className="font-bold text-[#1E293B] dark:text-[#E2E8F0]">Modo Oscuro:</div>
                  <p className="text-[#64748B] dark:text-[#94A3B8] font-mono text-[11px]">
                    background: rgba(30, 41, 59, 0.7)<br/>
                    backdrop-filter: blur(12px)<br/>
                    border: 1px solid rgba(255, 255, 255, 0.1)<br/>
                    texto: #E2E8F0 / #94A3B8
                  </p>
                </div>
              </div>
            </div>

            {/* MODAL ACTIONS */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-white/10">
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Modo actual activo: <strong className="text-[#0EA5E9]">{isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}</strong>
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={toggleTheme}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition cursor-pointer shadow-md active:scale-95"
                >
                  Alternar a {isDarkMode ? 'Modo Claro ☀️' : 'Modo Oscuro 🌙'}
                </button>
                <button
                  onClick={() => setShowPaletteModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-white/20 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW CONTENT */}
      <main className="flex-1">
        {page === 'home' && (
          <HomePage
            packages={MOCK_PACKAGES}
            onBookNow={handleBookNow}
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
              if (!user) {
                setUser({
                  ...INITIAL_USER,
                  email: email || INITIAL_USER.email
                });
              }
              showToast(`¡Bienvenido de nuevo!`);
              if (selectedPackage && !paymentDone) {
                navigateTo('checkout');
              } else {
                navigateTo('dashboard');
              }
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
              if (selectedPackage && !paymentDone) {
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

        {page === 'checkout' && selectedPackage && (
          <CheckoutPage
            user={user}
            pkg={selectedPackage}
            passengersCount={searchPassengers || 2}
            paymentDone={paymentDone}
            bookingCode={lastBookingCode}
            onConfirmPayment={(newBookingCode, createdTrip) => {
              setLastBookingCode(newBookingCode);
              setPaymentDone(true);
              setTrips([createdTrip, ...trips]);
              showToast('¡Pago procesado con éxito!');
            }}
            onGoToDashboard={() => navigateTo('dashboard')}
            onExploreMore={() => navigateTo('home')}
          />
        )}

        {page === 'terms' && (
          <TermsPage onNavigate={navigateTo} />
        )}
      </main>

      {/* 3D PACKAGE DETAIL & ITINERARY MODAL */}
      <PackageDetailModal
        pkg={detailPackage}
        currency={currency}
        onClose={() => setDetailPackage(null)}
        onBookNow={(p) => handleBookNow(p)}
      />

      {/* FLOATING 3D AI TRAVEL CONCIERGE */}
      <ConciergeWidget
        packages={MOCK_PACKAGES}
        onSelectPackage={(p) => {
          setDetailPackage(p);
        }}
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
// 🎊 COMPONENTE 3D: CONFETTI PARTICLES CANNON
// ==========================================
function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#0EA5E9', '#F97316', '#38BDF8', '#10B981', '#F59E0B', '#EC4899', '#A855F7'];
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      color: string;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
    }> = [];

    for (let i = 0; i < 150; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() * 260 - 130),
        y: canvas.height * 0.45 + (Math.random() * 120 - 60),
        size: Math.random() * 8 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedX: (Math.random() - 0.5) * 18,
        speedY: (Math.random() - 0.9) * 20,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
      });
    }

    let animationId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.speedY += 0.38;
        p.rotation += p.rotationSpeed;
        p.speedX *= 0.98;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });

      animationId = requestAnimationFrame(render);
    };

    render();
    const timeout = setTimeout(() => {
      cancelAnimationFrame(animationId);
    }, 6000);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(timeout);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />;
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

        {/* Live Weather Widget Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-sky-50/80 dark:bg-slate-800/80 border border-sky-200/70 dark:border-sky-500/20 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌦️</span>
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-bold block">Clima Actual</span>
              <span className="font-bold text-[#1E293B] dark:text-[#E2E8F0]">{pkg.weather?.condition || 'Soleado ☀️'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌡️</span>
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-bold block">Temperatura</span>
              <span className="font-bold text-[#1E293B] dark:text-[#E2E8F0]">{pkg.weather?.temp || '28°C'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💧</span>
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-bold block">Humedad</span>
              <span className="font-bold text-[#1E293B] dark:text-[#E2E8F0]">{pkg.weather?.humidity || '60%'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💨</span>
            <div>
              <span className="text-[10px] uppercase text-[#64748B] dark:text-[#94A3B8] font-bold block">Vientos</span>
              <span className="font-bold text-[#1E293B] dark:text-[#E2E8F0]">{pkg.weather?.wind || '12 km/h'}</span>
            </div>
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
    { country: 'Cancún, México', date: '15 NOV 2025', code: 'CUN-ARR-01', color: 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400', icon: '🇲🇽', seal: 'CARIBE MAYA' },
    { country: 'París, Francia', date: '20 MAY 2025', code: 'CDG-VIP-88', color: 'border-sky-600 text-sky-600 dark:border-sky-400 dark:text-sky-400', icon: '🇫🇷', seal: 'DOUANE ROISSY' },
    { country: 'Bali, Indonesia', date: '14 SEP 2024', code: 'DPS-IMM-32', color: 'border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400', icon: '🇮🇩', seal: 'BALI PARADISE' },
    { country: 'Machu Picchu, Perú', date: '04 FEB 2024', code: 'CUZ-VIP-77', color: 'border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400', icon: '🇵🇪', seal: 'SANTUARIO INCA' },
    { country: 'Santorini, Grecia', date: '19 AGO 2023', code: 'JTR-PORT-11', color: 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400', icon: '🇬🇷', seal: 'AEGEAN ENTRY' },
    { country: 'Dubai, EAU', date: '08 DIC 2022', code: 'DXB-FAST-99', color: 'border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400', icon: '🇦🇪', seal: 'DESERT LUXURY' },
  ];

  return (
    <TiltCard maxTilt={8} scale={1.01} className="w-full">
      <div className="rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] border-2 border-amber-500/40 p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden preserve-3d">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gradient-to-tr from-amber-400/20 via-amber-200/10 to-transparent blur-xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-amber-500/30 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-[#0F172A] rounded-2xl flex items-center justify-center text-xl">
                🌐
              </div>
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase font-bold block">
                REPÚBLICA DEL VIAJERO · HORIZONTE MODERNO
              </span>
              <h3 className="text-xl sm:text-2xl font-bold font-fraunces text-amber-100">
                Pasaporte Biométrico 3D
              </h3>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-400/40">
            ★ SOCIO PLATINO 3D
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Left ID Credentials */}
          <div className="md:col-span-5 p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-[#0EA5E9] to-[#F97316] flex items-center justify-center text-2xl font-bold text-white shadow-md border-2 border-white/20">
                {user.avatarInitials}
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-wider text-slate-400 block">Titular del Pasaporte</span>
                <p className="font-bold text-base text-white">{user.name} {user.lastName}</p>
                <p className="text-xs font-mono text-[#38BDF8]">{user.passport}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-white/10">
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Nacionalidad</span>
                <span className="font-semibold text-slate-200">{user.country}</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Puntos VIP</span>
                <span className="font-bold text-[#F97316]">{user.points.toLocaleString()} pts</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Emisión</span>
                <span className="text-slate-300">2022 / DIGITAL</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block uppercase">Validez</span>
                <span className="text-emerald-400 font-bold">PERMANENTE</span>
              </div>
            </div>
          </div>

          {/* Right Stamps Grid */}
          <div className="md:col-span-7 space-y-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Sellos de Inmigración Coleccionados ({stamps.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Pasa el cursor para efecto 3D</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {stamps.map((stamp, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border-2 border-dashed ${stamp.color} bg-black/25 flex flex-col justify-between hover:scale-105 hover:rotate-2 transition-transform duration-300 cursor-pointer shadow-xs select-none`}
                  title={`Sello de ${stamp.country}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{stamp.icon}</span>
                    <span className="text-[8px] font-mono font-black">{stamp.code}</span>
                  </div>
                  <div className="my-1">
                    <span className="text-[10px] font-bold block leading-tight truncate">{stamp.seal}</span>
                    <span className="text-[8px] block opacity-80">{stamp.country.split(',')[0]}</span>
                  </div>
                  <div className="text-[8px] font-mono border-t border-current/30 pt-0.5 flex justify-between">
                    <span>ENTRY</span>
                    <span>{stamp.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}

// ==========================================
// 🤖 COMPONENTE 3D: CONCIERGE ASISTENTE VIRTUAL
// ==========================================
interface ConciergeWidgetProps {
  onSelectPackage: (pkg: Package) => void;
  packages: Package[];
}

function ConciergeWidget({ onSelectPackage, packages }: ConciergeWidgetProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{ sender: 'bot' | 'user'; text: string; actionPkgId?: string }>>([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu Concierge 3D de Horizonte Moderno. ¿Buscas playa paradisíaca, aventura cultural o una escapada romántica? Elige una opción o pregúntame lo que desees.'
    }
  ]);
  const [inputVal, setInputVal] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const quickQuestions = [
    { text: '🏖️ ¿Cuál es el mejor destino de playa?', answer: 'Te recomiendo Cancún: playas turquesa, hotel 5★ All-Inclusive y crucero en catamarán incluido.', pkgId: 'cancun-7n' },
    { text: '💍 ¿El más romántico para parejas?', answer: 'París o Santorini son ideales: cenas gourmet a la luz de las velas y vistas panorámicas inigualables.', pkgId: 'paris-10n' },
    { text: '💳 ¿Cómo funcionan las cuotas sin interés?', answer: 'Puedes financiar hasta en 12 cuotas fijas con Visa, Mastercard y Amex con validación 3D-Secure.' },
    { text: '🛡️ ¿Qué incluye la cobertura Horizonte Care?', answer: 'Asistencia médica hasta $50,000 USD, compensación por demoras y pérdida de equipaje 24/7.' },
  ];

  const handleSend = (userText: string, customAnswer?: string, pkgId?: string) => {
    if (!userText.trim()) return;
    soundFx.playClick();
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      soundFx.playWoosh();
      let botResponse = customAnswer;
      let matchedPkg = pkgId;

      if (!botResponse) {
        const lower = userText.toLowerCase();
        if (lower.includes('playa') || lower.includes('caribe') || lower.includes('cancun')) {
          botResponse = '¡El Caribe mexicano te espera! Cancún cuenta con aguas cristalinas, resort todo incluido y traslados privados.';
          matchedPkg = 'cancun-7n';
        } else if (lower.includes('paris') || lower.includes('europa') || lower.includes('romantico') || lower.includes('pareja')) {
          botResponse = 'París y Santorini son los destinos favoritos de los enamorados, con paseos en barco y cenas de alta cocina.';
          matchedPkg = 'paris-10n';
        } else if (lower.includes('bali') || lower.includes('aventura') || lower.includes('selva')) {
          botResponse = 'Bali te ofrece templos sobre el mar, terrazas de arroz y villas privadas con piscina en plena naturaleza.';
          matchedPkg = 'bali-8n';
        } else if (lower.includes('machu') || lower.includes('peru') || lower.includes('inca')) {
          botResponse = 'Machu Picchu incluye el tren panorámico 360° y guía arqueológico privado para una experiencia mística.';
          matchedPkg = 'machu-picchu-6n';
        } else if (lower.includes('precio') || lower.includes('cuota') || lower.includes('pago')) {
          botResponse = 'Nuestras tarifas incluyen tasas e impuestos sin cargos ocultos, y puedes pagar en hasta 12 cuotas fijas con 3D-Secure.';
        } else {
          botResponse = '¡Excelente consulta! Te recomiendo explorar nuestro Globo 3D interactivo en la página principal para visualizar las rutas y atractivos en tiempo real.';
        }
      }

      setMessages((prev) => [...prev, { sender: 'bot', text: botResponse || '', actionPkgId: matchedPkg }]);
    }, 600);
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen && (
          <button
            onClick={() => {
              soundFx.playClick();
              setIsOpen(true);
            }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#0EA5E9] to-[#38BDF8] text-white flex items-center justify-center text-2xl shadow-xl shadow-sky-500/30 hover:scale-110 active:scale-95 transition-all cursor-pointer animate-radar relative group"
            title="Abrir Concierge Virtual 3D"
          >
            <span>🤖</span>
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F97316] border-2 border-white flex items-center justify-center text-[9px] font-bold">
              1
            </span>
          </button>
        )}
      </div>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm sm:max-w-md bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[520px] animate-scaleIn">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#0F172A] to-[#1E293B] text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-[#0EA5E9] flex items-center justify-center text-xl shadow-xs">
                🤖
              </div>
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  Horizonte Concierge 3D
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse" />
                </span>
                <span className="text-[10px] text-slate-300 block">Asistente de Viaje Inteligente</span>
              </div>
            </div>
            <button
              onClick={() => {
                soundFx.playClick();
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-white text-base cursor-pointer px-2 py-1"
            >
              ✕
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#F97316] text-white rounded-tr-xs shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-[#1E293B] dark:text-[#E2E8F0] rounded-tl-xs border border-slate-200 dark:border-white/10'
                  }`}
                >
                  <p>{m.text}</p>
                </div>
                {m.actionPkgId && (
                  <button
                    onClick={() => {
                      const p = packages.find((x) => x.id === m.actionPkgId);
                      if (p) onSelectPackage(p);
                      setIsOpen(false);
                    }}
                    className="mt-1.5 px-3 py-1 rounded-full bg-[#0EA5E9] text-white text-[10px] font-bold hover:bg-[#0284C7] transition cursor-pointer flex items-center gap-1 shadow-xs"
                  >
                    <span>Ver este paquete</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-1.5 text-slate-400 text-xs italic">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-bounce [animation-delay:0.4s]" />
                <span>Concierge escribiendo...</span>
              </div>
            )}
          </div>

          {/* Suggested Quick Prompt Chips */}
          <div className="p-2 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 overflow-x-auto flex gap-1.5 scrollbar-none">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q.text, q.answer, q.pkgId)}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-[10px] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0EA5E9] dark:hover:text-white whitespace-nowrap transition cursor-pointer shrink-0"
              >
                {q.text}
              </button>
            ))}
          </div>

          {/* Input field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }}
            className="p-3 border-t border-slate-200 dark:border-white/10 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Pregúntale al Concierge 3D..."
              className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs text-[#1E293B] dark:text-[#E2E8F0] focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white transition cursor-pointer"
            >
              <svg className="w-4 h-4 transform rotate-90" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function HomePage({
  packages,
  onBookNow,
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
  const filteredPackages = packages.filter((pkg) => {
    const matchesTag = activeFilterTag === 'Todos' || pkg.tag === activeFilterTag;
    const matchesQuery =
      searchDestination === '' ||
      pkg.destination.toLowerCase().includes(searchDestination.toLowerCase()) ||
      pkg.country.toLowerCase().includes(searchDestination.toLowerCase());
    return matchesTag && matchesQuery;
  });

  const filterCategories = ['Todos', 'Más vendido', 'Oferta', 'Romántico', 'Aventura', 'Exclusivo', 'Lujo'];

  return (
    <div className="flex flex-col">
      {/* HERO SECTION CON THREE.JS 3D GLOBE */}
      <div className="relative min-h-[720px] flex items-center justify-center overflow-hidden">
        {/* Background Image with Dark & Tint Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0F172A]/92 via-[#0F172A]/80 to-[#0F172A]/95" />

        {/* Hero Content Grid (Left Text & Search + Right 3D Globe) */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 z-10 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Col: Headings & Search Box */}
            <div className="lg:col-span-7 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 dark:bg-[#1E293B]/80 backdrop-blur-md border border-white/20 dark:border-[#334155] text-white dark:text-[#E2E8F0] text-xs sm:text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-[#F97316] animate-ping" />
                Explora el mundo en 3D · Temporada 2026/2027
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold text-white font-fraunces tracking-tight leading-tight mb-4">
                El viaje de tus sueños <span className="text-[#F97316] italic">comienza hoy</span>
              </h1>

              <p className="text-slate-200 dark:text-[#94A3B8] text-base sm:text-lg max-w-xl mx-auto lg:mx-0 mb-8 font-normal leading-relaxed">
                Descubre paquetes completos con vuelos, hoteles de lujo y experiencias inmersivas interactivas al mejor precio garantizado.
              </p>

              {/* SEARCH BAR BOX CON 3D TILT */}
              <TiltCard maxTilt={6} scale={1.01} className="w-full">
                <div className="bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-md rounded-3xl p-5 sm:p-6 shadow-2xl border border-[#E2E8F0] dark:border-[#334155] transition-colors text-left">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    {/* Destination */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#0EA5E9] dark:text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                        className="w-full bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3.5 py-2.5 text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
                      />
                    </div>

                    {/* Dates */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#0EA5E9] dark:text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={searchDates}
                        onChange={(e) => setSearchDates(e.target.value)}
                        className="w-full bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3.5 py-2.5 text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
                      />
                    </div>

                    {/* Passengers */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-[#0EA5E9] dark:text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Pasajeros
                      </label>
                      <select
                        value={searchPassengers}
                        onChange={(e) => setSearchPassengers(Number(e.target.value))}
                        className="w-full bg-[#F8FAFC] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-xl px-3.5 py-2.5 text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] cursor-pointer"
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
                        className="w-full bg-[#F97316] hover:bg-[#EA580C] text-white py-3 px-5 rounded-xl font-bold text-sm shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Buscar Paquetes
                      </button>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </div>

            {/* Right Col: Three.js 3D Interactive Globe */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[460px] relative animate-float-3d">
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

      {/* STATS STRIP CON 3D TILT */}
      <section className="bg-[#F1F5F9]/60 dark:bg-[#0F172A] border-y border-[#E2E8F0] dark:border-[#334155] py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <TiltCard maxTilt={10}>
              <div className="p-4 bg-white/70 dark:bg-[#1E293B]/60 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#0EA5E9] dark:text-[#E2E8F0] font-fraunces">2.4M+</p>
                <p className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mt-1">Clientes satisfechos</p>
              </div>
            </TiltCard>

            <TiltCard maxTilt={10}>
              <div className="p-4 bg-white/70 dark:bg-[#1E293B]/60 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#F97316] font-fraunces">500+</p>
                <p className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mt-1">Destinos en el mundo</p>
              </div>
            </TiltCard>

            <TiltCard maxTilt={10}>
              <div className="p-4 bg-white/70 dark:bg-[#1E293B]/60 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#0EA5E9] dark:text-[#E2E8F0] font-fraunces">12.000+</p>
                <p className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mt-1">Paquetes turísticos</p>
              </div>
            </TiltCard>

            <TiltCard maxTilt={10}>
              <div className="p-4 bg-white/70 dark:bg-[#1E293B]/60 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-xs">
                <p className="text-3xl sm:text-4xl font-extrabold text-[#64748B] dark:text-[#94A3B8] font-fraunces">99.4%</p>
                <p className="text-sm font-medium text-[#64748B] dark:text-[#94A3B8] mt-1">Reseñas 5 estrellas</p>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* PACKAGES CATALOG SECTION CON 3D TILT CARDS */}
      <section id="paquetes-section" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0EA5E9] dark:text-[#94A3B8] uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-[#0EA5E9] dark:bg-[#94A3B8]" />
              Catálogo Inmersivo 3D
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0]">
              Paquetes Turísticos Destacados
            </h2>
            <p className="text-[#64748B] dark:text-[#94A3B8] mt-2 max-w-xl">
              Vuelos directos, estadías en hoteles prémium y excursiones diseñadas por especialistas para vivir momentos inolvidables.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {filterCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilterTag(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeFilterTag === cat
                    ? 'bg-[#0EA5E9] dark:bg-[#334155] text-white dark:text-[#E2E8F0] shadow-md dark:border dark:border-[#94A3B8]/40'
                    : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#475569] dark:text-[#94A3B8] hover:bg-[#E2E8F0] dark:hover:bg-[#334155]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Packages Grid CON 3D TILT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPackages.map((pkg) => (
            <TiltCard key={pkg.id} maxTilt={12} scale={1.03}>
              <div className="bg-white dark:bg-[#1E293B] rounded-2xl overflow-hidden border border-[#E2E8F0] dark:border-[#334155] shadow-sm hover:shadow-2xl dark:hover:border-[#94A3B8]/50 transition-all duration-300 flex flex-col h-full group preserve-3d">
                {/* Image & Badges con 3D Depth */}
                <div className="relative h-64 overflow-hidden preserve-3d">
                  <img
                    src={pkg.image}
                    alt={pkg.destination}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-85" />

                  {/* Tag Badge que flota en Z */}
                  <div
                    style={{ transform: 'translateZ(30px)' }}
                    className="absolute top-4 left-4"
                  >
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg ${pkg.tagColor}`}>
                      {pkg.tag}
                    </span>
                  </div>

                  {/* Nights badge con 3D Depth */}
                  <div
                    style={{ transform: 'translateZ(25px)' }}
                    className="absolute top-4 right-4 bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-semibold text-slate-800 dark:text-[#E2E8F0] shadow-sm flex items-center gap-1 border border-black/5 dark:border-[#334155]"
                  >
                    <svg className="w-3.5 h-3.5 text-[#0EA5E9] dark:text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                    {pkg.nights} noches
                  </div>

                  {/* Location text en 3D Depth */}
                  <div
                    style={{ transform: 'translateZ(20px)' }}
                    className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white"
                  >
                    <span className="text-xl font-bold font-fraunces flex items-center gap-1 drop-shadow-md">
                      {pkg.destination}, {pkg.country}
                    </span>
                    <div className="flex items-center gap-1 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md text-xs font-bold">
                      <span className="text-amber-400">★</span>
                      <span>{pkg.rating}</span>
                      <span className="text-slate-300 font-normal">({pkg.reviewsCount})</span>
                    </div>
                  </div>
                </div>

                {/* Package Details */}
                <div className="p-6 flex-1 flex flex-col justify-between" style={{ transform: 'translateZ(15px)' }}>
                  <div>
                    <h3 className="text-lg font-bold text-[#1E293B] dark:text-[#E2E8F0] group-hover:text-[#0EA5E9] dark:group-hover:text-[#94A3B8] transition-colors leading-snug">
                      {pkg.title}
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-2 line-clamp-2 leading-relaxed">
                      {pkg.description}
                    </p>

                    {/* Highlight */}
                    <div className="mt-3 py-1.5 px-2.5 bg-[#F1F5F9]/80 dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#334155] rounded-lg text-xs text-[#64748B] dark:text-[#E2E8F0] font-medium flex items-center gap-1.5 shadow-xs">
                      <svg className="w-3.5 h-3.5 shrink-0 text-[#F97316]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      <span className="truncate">{pkg.highlight}</span>
                    </div>

                    {/* Includes Chips */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {pkg.includes.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-md bg-[#F1F5F9] dark:bg-[#0F172A] text-[#475569] dark:text-[#E2E8F0] border border-[#E2E8F0]/60 dark:border-[#334155]"
                        >
                          <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="mt-6 pt-4 border-t border-[#E2E8F0] dark:border-[#334155] flex items-center justify-between" style={{ transform: 'translateZ(25px)' }}>
                    <div>
                      <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium uppercase tracking-wider block">
                        Precio desde
                      </span>
<div className="flex items-baseline gap-1">
                        <span className="text-2xl font-extrabold text-[#F97316] font-fraunces">
                          {formatPriceCustom(pkg.price, currency)}
                        </span>
                        <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-normal">/ pers.</span>
                      </div>
                    </div>

<div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          soundFx.playWoosh();
                          onExplore3D(pkg);
                        }}
                        className="px-3.5 py-2.5 rounded-xl border border-sky-300 dark:border-sky-500/30 bg-sky-50/80 dark:bg-slate-800 text-[#0EA5E9] hover:bg-sky-100 dark:hover:bg-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Ver itinerario detallado y clima 3D"
                      >
                        <span>✨ 3D</span>
                      </button>
                      <button
                        onClick={() => {
                          soundFx.playCelebration();
                          onBookNow(pkg);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-md shadow-orange-500/20 hover:shadow-xl transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                      >
                        <span>Reservar</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </TiltCard>
          ))}
        </div>

        {filteredPackages.length === 0 && (
          <div className="text-center py-16 bg-[#F1F5F9]/40 dark:bg-[#1E293B] rounded-2xl border border-dashed border-[#E2E8F0] dark:border-[#334155]">
            <p className="text-4xl mb-3">🔍</p>
            <h3 className="text-lg font-bold text-[#1E293B] dark:text-[#E2E8F0]">No encontramos paquetes con esos filtros</h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1">Prueba seleccionando "Todos" o buscando otro destino en el globo 3D.</p>
            <button
              onClick={() => {
                setActiveFilterTag('Todos');
                setSearchDestination('');
              }}
              className="mt-4 px-4 py-2 bg-[#0EA5E9] dark:bg-[#334155] text-white rounded-xl text-xs font-semibold"
            >
              Restablecer filtros
            </button>
          </div>
        )}
      </section>

      {/* POR QUÉ ELEGIRNOS CON 3D TILT */}
      <section className="bg-[#F1F5F9]/40 dark:bg-[#0F172A] py-20 border-t border-[#E2E8F0] dark:border-[#334155] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">Confianza & Seguridad</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0] mt-2">
              ¿Por qué elegir Horizonte Moderno?
            </h2>
            <p className="text-[#64748B] dark:text-[#94A3B8] mt-3 text-sm sm:text-base">
              Más de una década conectando viajeros con sus destinos favoritos con la mayor tranquilidad y soporte del mercado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <TiltCard maxTilt={10}>
              <div className="bg-white dark:bg-[#1E293B] p-8 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm hover:shadow-xl transition text-center sm:text-left flex flex-col items-center sm:items-start h-full">
                <div className="w-14 h-14 rounded-2xl bg-[#F1F5F9] dark:bg-[#0F172A] text-[#0EA5E9] dark:text-[#94A3B8] flex items-center justify-center mb-6 shadow-xs border border-[#E2E8F0] dark:border-[#334155]">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1E293B] dark:text-[#E2E8F0] font-fraunces">Precio Garantizado</h3>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-sm mt-3 leading-relaxed">
                  Si encuentras el mismo paquete más barato en otra plataforma, te igualamos la tarifa y te otorgamos un 10% adicional en puntos para tu próximo viaje.
                </p>
              </div>
            </TiltCard>

            <TiltCard maxTilt={10}>
              <div className="bg-white dark:bg-[#1E293B] p-8 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm hover:shadow-xl transition text-center sm:text-left flex flex-col items-center sm:items-start h-full">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 dark:bg-[#0F172A] text-[#F97316] flex items-center justify-center mb-6 shadow-xs border border-orange-200 dark:border-[#334155]">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1E293B] dark:text-[#E2E8F0] font-fraunces">Pago 100% Seguro 3D</h3>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-sm mt-3 leading-relaxed">
                  Procesamiento con encriptación SSL bancaria y validación biométrica 3D Secure. Cuotas sin interés y confirmación de voucher inmediata.
                </p>
              </div>
            </TiltCard>

            <TiltCard maxTilt={10}>
              <div className="bg-white dark:bg-[#1E293B] p-8 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm hover:shadow-xl transition text-center sm:text-left flex flex-col items-center sm:items-start h-full">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-[#0F172A] text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 shadow-xs border border-emerald-200 dark:border-[#334155]">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#1E293B] dark:text-[#E2E8F0] font-fraunces">Atención Experta 24/7</h3>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-sm mt-3 leading-relaxed">
                  Asesores turísticos reales listos para apoyarte en cualquier momento vía WhatsApp, teléfono o email antes, durante y después de tu aventura.
                </p>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* BANNER CTA */}
      {!isLoggedIn && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
          <TiltCard maxTilt={5}>
            <div className="bg-gradient-to-r from-[#0EA5E9] via-[#64748B] to-[#475569] dark:from-[#0F172A] dark:via-[#1E293B] dark:to-[#334155] border border-[#E2E8F0] dark:border-[#334155] rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/5 rounded-full blur-2xl" />
              <div className="relative z-10 max-w-2xl">
                <span className="inline-block px-3 py-1 rounded-full bg-white/10 dark:bg-[#334155] text-orange-200 text-xs font-bold uppercase tracking-wider mb-4 border border-white/20 dark:border-[#94A3B8]/30">
                  Beneficio Exclusivo Miembros
                </span>
                <h3 className="text-3xl sm:text-4xl font-bold font-fraunces leading-tight">
                  Regístrate hoy y obtén hasta $150 USD de descuento en tu primera compra
                </h3>
                <p className="text-emerald-100 dark:text-[#94A3B8] mt-3 text-sm sm:text-base leading-relaxed">
                  Únete a más de 2 millones de miembros que acceden a tarifas secretas, upgrades de habitación y promociones anticipadas.
                </p>
              </div>

              <div className="relative z-10 shrink-0">
                <button
                  onClick={onNavigateRegister}
                  className="px-8 py-4 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold rounded-2xl shadow-xl shadow-black/20 hover:scale-105 transition-transform active:scale-95 cursor-pointer text-sm sm:text-base"
                >
                  Crear cuenta gratis
                </button>
              </div>
            </div>
          </TiltCard>
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
  onNavigateRegister: () => void;
}

function LoginPage({ onLoginSuccess, onNavigateRegister }: LoginPageProps) {
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
    onLoginSuccess(email);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] grid grid-cols-1 lg:grid-cols-2">
      {/* Left Inspiration Split */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[#0F172A] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-55 scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/70 to-transparent" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 dark:bg-[#1E293B]/80 backdrop-blur-md text-xs font-semibold text-[#E2E8F0] border border-white/20 dark:border-[#334155]">
            <span>✈️</span> Horizonte Moderno 3D
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-2xl font-bold font-fraunces leading-relaxed mb-4 text-[#E2E8F0]">
            "Viajar es la única cosa que compras y te hace más rico."
          </p>
          <p className="text-sm text-[#94A3B8]">
            Accede a tu panel para ver tus itinerarios en 3D, gestionar reservas y acumular puntos canjeables en tus próximas vacaciones.
          </p>
        </div>

        <div className="relative z-10 text-xs text-[#94A3B8]/80 font-mono">
          © 2026 Horizonte Moderno. Todos los derechos reservados.
        </div>
      </div>

      {/* Right Form Split */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white dark:bg-[#0F172A] transition-colors">
        <div className="w-full max-w-md space-y-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">Bienvenido de vuelta</span>
            <h2 className="text-3xl font-extrabold text-[#1E293B] dark:text-[#E2E8F0] font-fraunces mt-1">Iniciar Sesión</h2>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-2">
              Ingresa tus credenciales para acceder a tus reservas y beneficios.
            </p>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onLoginSuccess('maria.gonzalez@gmail.com')}
              className="flex items-center justify-center gap-2 py-2.5 px-4 border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition text-xs font-semibold text-[#1E293B] dark:text-[#E2E8F0] cursor-pointer shadow-xs active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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
              className="flex items-center justify-center gap-2 py-2.5 px-4 border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] rounded-xl hover:bg-[#F1F5F9] dark:hover:bg-[#334155] transition text-xs font-semibold text-[#1E293B] dark:text-[#E2E8F0] cursor-pointer shadow-xs active:scale-95"
            >
              <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>Facebook</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#E2E8F0] dark:border-[#334155] w-full" />
            <span className="bg-white dark:bg-[#0F172A] px-3 text-xs text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              o con tu email
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-xs font-medium flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ejemplo@correo.com"
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8] transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider">
                  Contraseña
                </label>
                <a
                  href="#olvido"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Hemos enviado un correo de recuperación a tu dirección.');
                  }}
                  className="text-xs text-[#0EA5E9] dark:text-[#94A3B8] hover:underline font-semibold"
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
                  className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8] transition pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#0EA5E9] dark:text-[#334155] rounded-sm border-[#E2E8F0] focus:ring-[#0EA5E9]"
              />
              <label htmlFor="rememberMe" className="ml-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                Recordarme en este dispositivo
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#0EA5E9] hover:bg-[#64748B] dark:bg-[#334155] dark:hover:bg-[#0F172A] text-white dark:text-[#E2E8F0] font-bold text-sm shadow-md shadow-emerald-900/20 transition-all hover:shadow-lg active:scale-98 cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </form>

          <p className="text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
            ¿Aún no tienes cuenta?{' '}
            <button
              onClick={onNavigateRegister}
              className="font-bold text-[#F97316] hover:underline cursor-pointer"
            >
              Regístrate gratis
            </button>
          </p>
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
    <div className="min-h-[calc(100vh-80px)] grid grid-cols-1 lg:grid-cols-2">
      {/* Left Inspiration Split */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-[#0F172A] text-white overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-55 scale-105 transition-transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1200&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/70 to-transparent" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 dark:bg-[#1E293B]/80 backdrop-blur-md text-xs font-semibold text-[#E2E8F0] border border-white/20 dark:border-[#334155]">
            <span>✨</span> Club Exclusivo Horizonte Moderno 3D
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-2xl font-bold font-fraunces leading-relaxed mb-4 text-[#E2E8F0]">
            "Comienza a coleccionar momentos, no cosas."
          </p>
          <p className="text-sm text-[#94A3B8]">
            Crea tu cuenta hoy y recibe al instante 2,500 puntos de bienvenida para canjear en tus paquetes vacacionales preferidos.
          </p>
        </div>

        <div className="relative z-10 text-xs text-[#94A3B8]/80 font-mono">
          © 2026 Horizonte Moderno. Tu próximo destino comienza aquí.
        </div>
      </div>

      {/* Right Form Split */}
      <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-white dark:bg-[#0F172A] transition-colors">
        <div className="w-full max-w-md space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0EA5E9] dark:text-[#94A3B8]">Regístrate en segundos</span>
            <h2 className="text-3xl font-extrabold text-[#1E293B] dark:text-[#E2E8F0] font-fraunces mt-1">Crear Cuenta</h2>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-2">
              Únete gratis a Horizonte Moderno y descubre una nueva manera inmersiva de viajar por el mundo.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-300 text-xs font-medium flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: María González"
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#F97316] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="maria@ejemplo.com"
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#F97316] transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                Contraseña (mínimo 6 caracteres)
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#1E293B] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#F97316] transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider">
                  Confirmar Contraseña
                </label>
                {confirmPassword.length > 0 && (
                  <span className={`text-[11px] font-semibold ${passwordsMatch ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
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
                className={`w-full px-4 py-3 rounded-xl border bg-[#F8FAFC] dark:bg-[#1E293B] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 transition ${
                  confirmPassword.length > 0 && !passwordsMatch
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-[#E2E8F0] dark:border-[#334155] focus:ring-[#F97316]'
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
                className="w-4 h-4 mt-0.5 text-[#F97316] rounded-sm border-[#E2E8F0] dark:border-[#334155] focus:ring-[#F97316]"
              />
              <label htmlFor="terms" className="ml-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                Acepto los{' '}
                <button type="button" onClick={onNavigateTerms} className="text-[#0EA5E9] dark:text-[#38BDF8] underline font-semibold cursor-pointer">Términos del Servicio</button>{' '}
                y la{' '}
                <button type="button" onClick={onNavigateTerms} className="text-[#0EA5E9] dark:text-[#38BDF8] underline font-semibold cursor-pointer">Política de Privacidad</button>{' '}
                de Horizonte Moderno.
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-md shadow-orange-500/25 transition-all hover:shadow-lg active:scale-98 cursor-pointer"
            >
              Crear cuenta gratis
            </button>
          </form>

          <p className="text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
            ¿Ya tienes una cuenta registrada?{' '}
            <button
              onClick={onNavigateLogin}
              className="font-bold text-[#0EA5E9] dark:text-[#E2E8F0] hover:underline cursor-pointer"
            >
              Inicia sesión aquí
            </button>
          </p>
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
  onNewBooking: () => void;
  onViewPackage: (packageId: string) => void;
}

function DashboardPage({ user, trips, onNewBooking }: DashboardPageProps) {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [selectedVoucherTrip, setSelectedVoucherTrip] = useState<Trip | null>(null);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] dark:border-[#334155] pb-6">
        <div>
          <span className="text-xs font-bold text-[#0EA5E9] dark:text-[#94A3B8] uppercase tracking-wider">Panel del Viajero 3D</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E293B] dark:text-[#E2E8F0] font-fraunces mt-1">
            Hola, {user.name} 👋
          </h1>
          <p className="text-[#64748B] dark:text-[#94A3B8] text-sm mt-1">
            Tienes {upcomingTrips.length} viaje{upcomingTrips.length === 1 ? '' : 's'} programado{upcomingTrips.length === 1 ? '' : 's'}. ¡Tus billetes 3D están listos!
          </p>
        </div>

        <button
          onClick={onNewBooking}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#0EA5E9] hover:bg-[#64748B] dark:bg-[#334155] dark:hover:bg-[#0F172A] text-white dark:text-[#E2E8F0] font-bold text-sm shadow-md shadow-emerald-900/20 hover:shadow-lg transition cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva reserva
        </button>
      </div>

      {/* PASAPORTE DIGITAL 3D GAMIFICADO */}
      <Passport3D user={user} />

      {/* 4 STAT CARDS CON 3D TILT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <TiltCard maxTilt={10}>
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm flex items-center gap-4 h-full">
            <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] dark:bg-[#0F172A] text-[#0EA5E9] dark:text-[#94A3B8] flex items-center justify-center shrink-0 border border-[#E2E8F0] dark:border-[#334155]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-semibold uppercase tracking-wider">Viajes Realizados</p>
              <p className="text-2xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0] mt-0.5">{completedTrips.length} viajes</p>
            </div>
          </div>
        </TiltCard>

        <TiltCard maxTilt={10}>
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm flex items-center gap-4 h-full">
            <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-[#0F172A] text-[#F97316] flex items-center justify-center shrink-0 border border-orange-200 dark:border-[#334155]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-semibold uppercase tracking-wider">Próximo Viaje</p>
              <p className="text-2xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0] mt-0.5">
                {nextTrip ? nextTrip.departureDate.split(',')[0] : 'Sin viajes'}
              </p>
            </div>
          </div>
        </TiltCard>

        <TiltCard maxTilt={10}>
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm flex items-center gap-4 h-full">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-[#0F172A] text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-[#334155]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-semibold uppercase tracking-wider">Países Visitados</p>
              <p className="text-2xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0] mt-0.5">3 países</p>
            </div>
          </div>
        </TiltCard>

        <TiltCard maxTilt={10}>
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm flex items-center gap-4 h-full">
            <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] dark:bg-[#0F172A] text-[#0EA5E9] dark:text-[#94A3B8] flex items-center justify-center shrink-0 border border-[#E2E8F0] dark:border-[#334155]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] font-semibold uppercase tracking-wider">Puntos Horizonte</p>
              <p className="text-2xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0] mt-0.5">
                {user.points.toLocaleString()} pts
              </p>
            </div>
          </div>
        </TiltCard>
      </div>

      {/* FEATURED 3D BOARDING PASS DEL PRÓXIMO VIAJE */}
      {nextTrip && (
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#F97316]">
            Tu Próximo Itinerario en 3D
          </span>
          <BoardingPass3D trip={nextTrip} user={user} />
        </div>
      )}

      {/* TRIPS LIST WITH TABS */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155]">
          <div className="flex gap-4 sm:gap-8">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`pb-4 text-sm font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'upcoming'
                  ? 'border-[#0EA5E9] dark:border-[#94A3B8] text-[#0EA5E9] dark:text-[#E2E8F0]'
                  : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-white'
              }`}
            >
              Próximos ({upcomingTrips.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`pb-4 text-sm font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'completed'
                  ? 'border-[#0EA5E9] dark:border-[#94A3B8] text-[#0EA5E9] dark:text-[#E2E8F0]'
                  : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-white'
              }`}
            >
              Completados ({completedTrips.length})
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`pb-4 text-sm font-bold border-b-2 transition cursor-pointer ${
                activeTab === 'cancelled'
                  ? 'border-[#0EA5E9] dark:border-[#94A3B8] text-[#0EA5E9] dark:text-[#E2E8F0]'
                  : 'border-transparent text-[#64748B] dark:text-[#94A3B8] hover:text-[#1E293B] dark:hover:text-white'
              }`}
            >
              Cancelados ({cancelledTrips.length})
            </button>
          </div>
        </div>

        {/* Trips Cards */}
        {displayedTrips.length > 0 ? (
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Card con 3D Tilt */}
          <TiltCard maxTilt={8}>
            <div className="bg-white dark:bg-[#1E293B] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm text-center">
              <div className="relative inline-block mx-auto mb-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#0EA5E9] to-[#F97316] dark:from-[#334155] dark:to-[#94A3B8] text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-emerald-950/20">
                  {user.avatarInitials}
                </div>
                {user.verified && (
                  <div
                    className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#0EA5E9] dark:bg-[#334155] text-white border-2 border-white dark:border-[#0F172A] flex items-center justify-center text-xs"
                    title="Cuenta verificada"
                  >
                    ✓
                  </div>
                )}
              </div>

              <h3 className="text-lg font-bold text-[#1E293B] dark:text-[#E2E8F0] font-fraunces">
                {user.name} {user.lastName}
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5 truncate">{user.email}</p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F1F5F9] dark:bg-[#0F172A] text-[#0EA5E9] dark:text-[#E2E8F0] text-xs font-semibold border border-[#E2E8F0] dark:border-[#334155]">
                <svg className="w-3.5 h-3.5 text-[#0EA5E9] dark:text-[#94A3B8]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Cuenta Verificada</span>
              </div>
            </div>
          </TiltCard>

          {/* Navigation Menu */}
          <nav className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm overflow-hidden p-2 space-y-1">
            <button
              onClick={() => setProfileTab('personal')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                profileTab === 'personal'
                  ? 'bg-[#F1F5F9] dark:bg-[#334155] text-[#475569] dark:text-[#E2E8F0]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9]/50 dark:hover:bg-[#0F172A]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Información personal
            </button>

            <button
              onClick={() => setProfileTab('preferences')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                profileTab === 'preferences'
                  ? 'bg-[#F1F5F9] dark:bg-[#334155] text-[#475569] dark:text-[#E2E8F0]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9]/50 dark:hover:bg-[#0F172A]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Preferencias de viaje
            </button>

            <button
              onClick={() => setProfileTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition cursor-pointer text-left ${
                profileTab === 'security'
                  ? 'bg-[#F1F5F9] dark:bg-[#334155] text-[#475569] dark:text-[#E2E8F0]'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9]/50 dark:hover:bg-[#0F172A]'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Seguridad & Contraseña
            </button>

            <button
              onClick={onNavigateDashboard}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9]/50 dark:hover:bg-[#0F172A] transition cursor-pointer text-left"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Mis viajes (3D Boarding Pass)
            </button>
          </nav>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="lg:col-span-3 space-y-6">
          {profileTab === 'personal' && (
            <div className="bg-white dark:bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0]">
                  Información Personal
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Actualiza tus datos para acelerar la emisión de tus futuros billetes y vouchers.
                </p>
              </div>

              <form onSubmit={handleSavePersonal} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                      Teléfono Móvil
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                      País de Residencia
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                      Número de Pasaporte / Documento
                    </label>
                    <input
                      type="text"
                      value={passport}
                      onChange={(e) => setPassport(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#E2E8F0] dark:border-[#334155]">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#64748B] dark:bg-[#334155] dark:hover:bg-[#0F172A] text-white dark:text-[#E2E8F0] font-bold text-xs shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer"
                  >
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          )}

          {profileTab === 'preferences' && (
            <div className="bg-white dark:bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0]">
                  Preferencias de Viaje
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Selecciona los tipos de experiencias que más disfrutas para recomendarte ofertas personalizadas.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                {allPreferencesList.map((pref) => {
                  const isChecked = preferences.includes(pref);
                  return (
                    <label
                      key={pref}
                      onClick={() => togglePreference(pref)}
                      className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between cursor-pointer transition ${
                        isChecked
                          ? 'border-[#0EA5E9] dark:border-[#94A3B8] bg-[#F1F5F9] dark:bg-[#334155] text-[#475569] dark:text-[#E2E8F0]'
                          : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9]/40 dark:hover:bg-[#1E293B]'
                      }`}
                    >
                      <span>{pref}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="w-4 h-4 text-[#0EA5E9] dark:text-[#334155] rounded-sm focus:ring-[#0EA5E9]"
                      />
                    </label>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4 border-t border-[#E2E8F0] dark:border-[#334155]">
                <button
                  type="button"
                  onClick={handleSavePersonal}
                  className="px-6 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#64748B] dark:bg-[#334155] dark:hover:bg-[#0F172A] text-white dark:text-[#E2E8F0] font-bold text-xs shadow-md shadow-emerald-900/20 transition active:scale-95 cursor-pointer"
                >
                  Guardar preferencias
                </button>
              </div>
            </div>
          )}

          {profileTab === 'security' && (
            <div className="bg-white dark:bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0]">
                  Seguridad & Contraseña
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Mantén tu cuenta protegida cambiando periódicamente tu clave de acceso.
                </p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                {securityFeedback && (
                  <div
                    className={`p-3 rounded-xl text-xs font-semibold ${
                      securityFeedback.startsWith('✓')
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}
                  >
                    {securityFeedback}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                    Contraseña actual
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                    Nueva contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                    Confirmar nueva contraseña
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmNewPass}
                    onChange={(e) => setConfirmNewPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-md shadow-orange-500/20 transition active:scale-95 cursor-pointer"
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

  // Financial calculations
  const passengers = passengersCount || 2;
  const subtotal = pkg.price * passengers;
  const discount = 100;
  const total = subtotal - discount;
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
      const newTrip: Trip = {
        id: 'trip-' + Date.now(),
        packageId: pkg.id,
        title: pkg.title,
        destination: `${pkg.destination}, ${pkg.country}`,
        departureDate: '20 Nov, 2026',
        returnDate: '27 Nov, 2026',
        nights: pkg.nights,
        passengers,
        bookingCode: generatedCode,
        totalPrice: total,
        status: 'upcoming',
        image: pkg.image
      };
      onConfirmPayment(generatedCode, newTrip);
    }, 1500);
  };

  // If payment done -> Success Screen
  if (paymentDone) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8 animate-fadeIn">
        <ConfettiCanvas />
        <div className="w-24 h-24 bg-emerald-100 dark:bg-[#1E293B] text-emerald-600 dark:text-[#E2E8F0] rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20 border border-emerald-300 dark:border-[#334155] animate-bounce">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest bg-emerald-50 dark:bg-[#1E293B] px-3 py-1 rounded-full border border-emerald-200 dark:border-[#334155]">
            Pago Confirmado 3D
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-fraunces text-[#1E293B] dark:text-[#E2E8F0]">
            ¡Tu reserva está confirmada!
          </h1>
          <p className="text-[#64748B] dark:text-[#94A3B8] text-base max-w-lg mx-auto">
            Hemos procesado tu pago con encriptación biométrica 3D. Enviamos tus billetes y vouchers a <strong className="text-[#1E293B] dark:text-[#E2E8F0]">{email}</strong>.
          </p>
        </div>

        {/* Booking Card Box con 3D Tilt */}
        <TiltCard maxTilt={8} scale={1.02}>
          <div className="bg-white dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] rounded-3xl p-6 sm:p-8 text-left space-y-4 shadow-xl max-w-xl mx-auto">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#334155] pb-4">
              <div>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] uppercase font-bold tracking-wider">Código de reserva</p>
                <p className="text-2xl font-mono font-bold text-[#0EA5E9] dark:text-[#E2E8F0]">#{bookingCode}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] uppercase font-bold tracking-wider">Monto abonado</p>
                <p className="text-2xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0]">${total.toLocaleString()} USD</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <img src={pkg.image} alt={pkg.destination} className="w-16 h-16 rounded-xl object-cover shadow-md" />
              <div>
                <h4 className="font-bold text-[#1E293B] dark:text-[#E2E8F0] font-fraunces text-base">{pkg.title}</h4>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">{pkg.nights} noches · {passengers} pasajeros · All-Inclusive</p>
              </div>
            </div>
          </div>
        </TiltCard>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onGoToDashboard}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#0EA5E9] hover:bg-[#64748B] dark:bg-[#334155] dark:hover:bg-[#0F172A] text-white dark:text-[#E2E8F0] font-bold text-sm shadow-md transition cursor-pointer"
          >
            Ver mis viajes (Boarding Pass 3D)
          </button>
          <button
            onClick={onExploreMore}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-[#1E293B] dark:text-[#E2E8F0] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] font-bold text-sm transition cursor-pointer"
          >
            Explorar más destinos en el globo 3D
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-8">
        <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">Paso final 3D Secure</span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-fraunces text-[#1E293B] dark:text-[#E2E8F0] mt-1">
          Finalizar Reserva
        </h1>
        <p className="text-[#64748B] dark:text-[#94A3B8] text-sm mt-1">
          Completa los datos del viajero e interactúa con tu tarjeta 3D para confirmar tu compra.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-start">
        {/* LEFT 3/5: FORM */}
        <form onSubmit={handleConfirmOrder} className="lg:col-span-3 space-y-8">
          {/* SECCIÓN 1: DATOS DEL VIAJERO */}
          <div className="bg-white dark:bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#E2E8F0] dark:border-[#334155] pb-4">
              <div className="w-8 h-8 rounded-full bg-[#F1F5F9] dark:bg-[#0F172A] text-[#0EA5E9] dark:text-[#E2E8F0] font-bold text-xs flex items-center justify-center border border-[#E2E8F0] dark:border-[#334155]">
                1
              </div>
              <h2 className="text-xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0]">
                Datos del Pasajero Titular
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                  Nombre
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                  Apellido
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                  Correo Electrónico (para vouchers)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                  Número de Pasaporte
                </label>
                <input
                  type="text"
                  required
                  value={passport}
                  onChange={(e) => setPassport(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                  Nacionalidad
                </label>
                <input
                  type="text"
                  required
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                />
              </div>
            </div>
          </div>

          {/* SECCIÓN 2: MÉTODO DE PAGO CON 3D FLIPPABLE CARD */}
          <div className="bg-white dark:bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-[#E2E8F0] dark:border-[#334155] pb-4">
              <div className="w-8 h-8 rounded-full bg-[#F1F5F9] dark:bg-[#0F172A] text-[#0EA5E9] dark:text-[#E2E8F0] font-bold text-xs flex items-center justify-center border border-[#E2E8F0] dark:border-[#334155]">
                2
              </div>
              <h2 className="text-xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0]">
                Método de Pago 3D
              </h2>
            </div>

            {/* Type Selector */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentType('tarjeta')}
                className={`py-3 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  paymentType === 'tarjeta'
                    ? 'border-[#0EA5E9] dark:border-[#94A3B8] bg-[#F1F5F9] dark:bg-[#334155] text-[#475569] dark:text-[#E2E8F0]'
                    : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9]/40 dark:hover:bg-[#1E293B]'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <span>Tarjeta de Crédito</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('debito')}
                className={`py-3 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  paymentType === 'debito'
                    ? 'border-[#0EA5E9] dark:border-[#94A3B8] bg-[#F1F5F9] dark:bg-[#334155] text-[#475569] dark:text-[#E2E8F0]'
                    : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9]/40 dark:hover:bg-[#1E293B]'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Débito Directo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('transferencia')}
                className={`py-3 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer ${
                  paymentType === 'transferencia'
                    ? 'border-[#0EA5E9] dark:border-[#94A3B8] bg-[#F1F5F9] dark:bg-[#334155] text-[#475569] dark:text-[#E2E8F0]'
                    : 'border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9]/40 dark:hover:bg-[#1E293B]'
                }`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
                <span>Transferencia</span>
              </button>
            </div>

            {/* DYNAMIC FLIPPABLE 3D CREDIT CARD WIDGET */}
            <Card3D
              cardNumber={cardNumber}
              cardHolder={cardHolder}
              expiry={expiry}
              cvv={cvv}
              isFlipped={isCardFlipped}
              onFlipToggle={() => setIsCardFlipped(!isCardFlipped)}
            />

            {/* Card Inputs */}
            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
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
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                  />
                  <div className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 text-xs">🔒 3D Secure</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                  Nombre del Titular (como figura en la tarjeta)
                </label>
                <input
                  type="text"
                  required
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  onFocus={() => setIsCardFlipped(false)}
                  placeholder="MARÍA GONZÁLEZ"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm uppercase focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
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
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider">
                      Código CVV (3D)
                    </label>
                    <span className="text-[10px] text-[#F97316]">Gira la tarjeta al enfocar</span>
                  </div>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.slice(0, 4))}
                    onFocus={() => setIsCardFlipped(true)}
                    placeholder="123"
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8]"
                  />
                </div>
              </div>

              {/* Installments selector */}
              <div>
                <label className="block text-xs font-bold text-[#475569] dark:text-[#94A3B8] uppercase tracking-wider mb-1">
                  Plan de Cuotas
                </label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-[#334155] text-sm bg-white dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9] dark:focus:ring-[#94A3B8] cursor-pointer"
                >
                  <option value={1}>1 pago de ${total.toLocaleString()} USD (Sin interés)</option>
                  <option value={3}>3 cuotas fijas de ${(total / 3).toFixed(2)} USD</option>
                  <option value={6}>6 cuotas fijas de ${(total / 6).toFixed(2)} USD</option>
                  <option value={12}>12 cuotas fijas de ${(total / 12).toFixed(2)} USD</option>
                  <option value={18}>18 cuotas fijas de ${(total / 18).toFixed(2)} USD (Especial)</option>
                </select>
              </div>
            </div>

            {/* Confirm CTA Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-4 px-6 rounded-2xl bg-[#F97316] hover:bg-[#EA580C] text-white font-extrabold text-base shadow-lg shadow-orange-500/25 transition-all hover:shadow-xl active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Procesando pago seguro 3D...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Confirmar pago 3D · ${total.toLocaleString()} USD</span>
                  </>
                )}
              </button>
              <p className="text-center text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-2">
                🔒 Certificación PCI-DSS Nivel 1 & 3D Secure. Cancelación flexible.
              </p>
            </div>
          </div>
        </form>

        {/* RIGHT 2/5: STICKY SUMMARY CON 3D TILT */}
        <div className="lg:col-span-2 sticky top-28 space-y-6">
          <TiltCard maxTilt={8} scale={1.01}>
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-[#E2E8F0] dark:border-[#334155] shadow-lg p-6 space-y-6">
              {/* Urgency Badge */}
              <div className="bg-orange-50 dark:bg-[#0F172A] border border-orange-200 dark:border-[#334155] text-[#F97316] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                <span className="animate-pulse">🔥</span>
                <span>¡Solo 3 lugares disponibles a este precio!</span>
              </div>

              {/* Package Thumbnail & Title */}
              <div className="flex gap-4">
                <img
                  src={pkg.image}
                  alt={pkg.destination}
                  className="w-24 h-24 rounded-xl object-cover shrink-0 shadow-md"
                />
                <div className="flex flex-col justify-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0EA5E9] dark:text-[#94A3B8]">
                    {pkg.tag}
                  </span>
                  <h3 className="font-bold text-[#1E293B] dark:text-[#E2E8F0] font-fraunces text-base leading-snug">
                    {pkg.title}
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                    {pkg.destination}, {pkg.country} · {pkg.nights} noches
                  </p>
                </div>
              </div>

              {/* Included Chips */}
              <div className="space-y-1.5 border-t border-[#E2E8F0] dark:border-[#334155] pt-4">
                <span className="text-xs font-bold text-[#1E293B] dark:text-[#E2E8F0] block mb-1">Tu paquete incluye:</span>
                {pkg.includes.map((inc, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{inc}</span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="border-t border-[#E2E8F0] dark:border-[#334155] pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-[#64748B] dark:text-[#94A3B8]">
                  <span>Precio base unitario</span>
                  <span>${pkg.price.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-[#64748B] dark:text-[#94A3B8]">
                  <span>Pasajeros ({passengers} personas)</span>
                  <span>${subtotal.toLocaleString()} USD</span>
                </div>
                <div className="flex justify-between text-[#64748B] dark:text-[#94A3B8]">
                  <span>Tasas aeroportuarias & IVA</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">¡Incluidos!</span>
                </div>
                <div className="flex justify-between text-[#64748B] dark:text-[#94A3B8]">
                  <span>Descuento Promo Online</span>
                  <span className="text-[#F97316] font-semibold">-${discount} USD</span>
                </div>

                <div className="border-t border-[#E2E8F0] dark:border-[#334155] pt-3 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-[#1E293B] dark:text-[#E2E8F0]">Total a pagar</span>
                    {installments > 1 && (
                      <span className="block text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        {installments} cuotas de ${installmentAmount} USD
                      </span>
                    )}
                  </div>
                  <span className="text-2xl font-extrabold text-[#0EA5E9] dark:text-[#E2E8F0] font-fraunces">
                    ${total.toLocaleString()} USD
                  </span>
                </div>
              </div>

              {/* Guarantees */}
              <div className="bg-[#F1F5F9] dark:bg-[#0F172A] p-4 rounded-xl text-[11px] text-[#64748B] dark:text-[#94A3B8] space-y-2 border border-[#E2E8F0] dark:border-[#334155]">
                <div className="flex items-center gap-2 font-medium text-[#1E293B] dark:text-[#E2E8F0]">
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>Reserva 100% Protegida por Horizonte Care</span>
                </div>
                <p>Emitimos de forma inmediata tus billetes 3D para que viajes con total serenidad y respaldo legal.</p>
              </div>
            </div>
          </TiltCard>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10 animate-fadeIn">
      {/* BREADCRUMB & HEADER */}
      <div className="space-y-4 border-b border-slate-200 dark:border-white/10 pb-8">
        <div className="flex items-center gap-2 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-[#0EA5E9] dark:hover:text-[#38BDF8] transition cursor-pointer"
          >
            Inicio
          </button>
          <span>/</span>
          <span className="text-slate-400">Información Legal</span>
          <span>/</span>
          <span className="text-[#0EA5E9] dark:text-[#38BDF8] font-bold">Términos y Condiciones</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0EA5E9]/10 text-[#0EA5E9] text-xs font-bold uppercase tracking-wider mb-2 border border-[#0EA5E9]/20">
              <span>📋</span> Documento Oficial · Versión 4.2
            </div>
            <h1 className="text-3xl sm:text-5xl font-black font-fraunces text-[#1E293B] dark:text-[#E2E8F0] tracking-tight">
              Términos y Condiciones Generales
            </h1>
            <p className="text-[#64748B] dark:text-[#94A3B8] text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Bases contractuales, derechos del consumidor, políticas de cancelación y garantías para el uso de la plataforma y reservas en Horizonte Moderno.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-white/15 bg-white dark:bg-slate-800 text-xs font-bold text-[#1E293B] dark:text-[#E2E8F0] hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2 cursor-pointer shadow-xs"
              title="Imprimir o guardar como PDF"
            >
              <svg className="w-4 h-4 text-[#0EA5E9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="px-5 py-2.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-bold transition shadow-md shadow-orange-500/20 cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <span>Volver a Paquetes</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] dark:text-[#94A3B8] pt-2">
          <span>📅 <strong>Última actualización:</strong> 28 de Septiembre de 2026</span>
          <span>•</span>
          <span>🌍 <strong>Jurisdicción:</strong> Estándar Internacional & Protección al Consumidor</span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            Vigente y certificado para reservas 3D
          </span>
        </div>
      </div>

      {/* 4 HIGHLIGHT PILLARS CON 3D TILT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <TiltCard maxTilt={8}>
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xs h-full flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-[#0EA5E9] flex items-center justify-center text-lg font-bold mb-3 border border-sky-200 dark:border-sky-800/40">
              ⚡
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1E293B] dark:text-[#E2E8F0]">Cancelación 24h Sin Costo</h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                Derecho a desistimiento total en las primeras 24 horas para reservas con más de 14 días de antelación.
              </p>
            </div>
          </div>
        </TiltCard>

        <TiltCard maxTilt={8}>
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xs h-full flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-[#F97316] flex items-center justify-center text-lg font-bold mb-3 border border-orange-200 dark:border-orange-800/40">
              🔐
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1E293B] dark:text-[#E2E8F0]">Pagos 3D-Secure SSL</h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                Encriptación bancaria de 256 bits y verificación EMV 3D para transacciones libres de fraudes.
              </p>
            </div>
          </div>
        </TiltCard>

        <TiltCard maxTilt={8}>
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xs h-full flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg font-bold mb-3 border border-emerald-200 dark:border-emerald-800/40">
              🏥
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1E293B] dark:text-[#E2E8F0]">Horizonte Care Incluido</h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                Asistencia médica internacional hasta $50,000 USD y seguro de equipaje en todos los paquetes.
              </p>
            </div>
          </div>
        </TiltCard>

        <TiltCard maxTilt={8}>
          <div className="p-5 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-white/10 shadow-xs h-full flex flex-col justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg font-bold mb-3 border border-purple-200 dark:border-purple-800/40">
              🏷️
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#1E293B] dark:text-[#E2E8F0]">Precios Finales Sin Sorpresas</h4>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1.5 leading-relaxed">
                Tasas aéreas, cargos de gestión e IVA incluidos desde el primer clic hasta la confirmación.
              </p>
            </div>
          </div>
        </TiltCard>
      </div>

      {/* TWO-COLUMN LAYOUT: STICKY TOC & SECTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: INDEX & SEARCH */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/10 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0EA5E9]">
                Índice de Cláusulas
              </span>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-[#64748B] dark:text-[#94A3B8]">
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
                className="w-full bg-[#F8FAFC] dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-[#1E293B] dark:text-[#E2E8F0] placeholder-[#64748B] focus:outline-hidden focus:ring-2 focus:ring-[#0EA5E9]"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
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
                    className={`w-full text-left p-2.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-2.5 ${
                      isActive
                        ? 'bg-[#0EA5E9] text-white font-bold shadow-md shadow-sky-500/20'
                        : 'text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-[#1E293B] dark:hover:text-[#E2E8F0]'
                    }`}
                  >
                    <span className="text-sm shrink-0">{sec.icon}</span>
                    <span className="truncate flex-1">{sec.title}</span>
                    <span className={`text-[10px] font-mono shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}>
                      {sec.number}
                    </span>
                  </button>
                );
              })}

              {filteredSections.length === 0 && (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No se encontraron cláusulas para "{searchFilter}".
                </p>
              )}
            </nav>
          </div>

          {/* Contact & Support Box */}
          <div className="bg-gradient-to-br from-slate-900 to-[#0F172A] text-white rounded-2xl p-5 border border-slate-700 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-[#0EA5E9]">
              <span className="text-base">⚖️</span>
              <span className="text-xs font-bold uppercase tracking-wider">Centro de Asesoría Legal</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              ¿Tienes dudas o necesitas un certificado formal para presentar ante tu seguro o empleador? Nuestro equipo jurídico está a tu disposición.
            </p>
            <div className="pt-2 border-t border-slate-800 space-y-1.5 text-xs text-slate-300 font-mono">
              <p className="flex items-center gap-1.5">
                <span className="text-[#0EA5E9]">✉</span> legal@horizontemoderno.com
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-[#F97316]">☎</span> 0800-HORIZONTE (Gratuito 24/7)
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DETAILED SECTIONS */}
        <div className="lg:col-span-8 space-y-8">
          {filteredSections.map((sec) => (
            <div
              key={sec.id}
              id={sec.id}
              className="scroll-mt-28 bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-sm space-y-4 hover:border-[#0EA5E9]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-[#0EA5E9] flex items-center justify-center text-lg font-bold border border-sky-200 dark:border-sky-800/30 shrink-0">
                    {sec.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-[#0EA5E9] dark:text-[#38BDF8] font-bold uppercase tracking-wider block">
                      Cláusula {sec.number}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold font-fraunces text-[#1E293B] dark:text-[#E2E8F0]">
                      {sec.title}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                {sec.content.map((paragraph, pIdx) => (
                  <p key={pIdx} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {/* ACCEPTANCE CARD */}
          <div className="bg-[#F8FAFC] dark:bg-slate-900/80 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-white/10 shadow-md space-y-4">
            <div className="flex items-start gap-3">
              <input
                id="policy-consent"
                type="checkbox"
                checked={acceptedPolicy}
                onChange={(e) => setAcceptedPolicy(e.target.checked)}
                className="w-5 h-5 mt-0.5 text-[#F97316] rounded border-slate-300 focus:ring-[#F97316] cursor-pointer shrink-0"
              />
              <label htmlFor="policy-consent" className="text-xs sm:text-sm text-[#1E293B] dark:text-[#E2E8F0] cursor-pointer">
                He leído detenidamente las políticas de reserva, cancelación y cobertura del servicio de <strong>Horizonte Moderno</strong> y declaro estar conforme con sus términos.
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-white/10">
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                {acceptedPolicy ? '✓ Conformidad registrada en tu sesión actual.' : 'Marca la casilla para confirmar lectura.'}
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => onNavigate('home')}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-xs shadow-md shadow-orange-500/25 transition cursor-pointer active:scale-95 text-center"
                >
                  Aceptar y Explorar Paquetes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer({ onNavigate }: { onNavigate: (page: PageType) => void }) {
  return (
    <footer className="bg-[#1E293B] dark:bg-[#0F172A] text-white border-t border-[#475569] dark:border-[#334155] mt-auto transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Col 1: Brand */}
          <div className="lg:col-span-2 space-y-4">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2 text-left cursor-pointer"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0EA5E9] to-[#F97316] dark:from-[#334155] dark:to-[#94A3B8] flex items-center justify-center text-white">
                <svg className="w-5 h-5 transform -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
              <span className="text-2xl font-black font-fraunces">
                <span className="text-white">Horizonte</span><span className="text-[#0EA5E9] ml-1">Moderno</span>
                <span className="text-[10px] ml-1 px-1.5 py-0.5 rounded-sm bg-[#F97316]/20 text-[#F97316] font-sans font-bold">3D</span>
              </span>
            </button>
            <p className="text-xs text-[#38BDF8] dark:text-[#94A3B8] max-w-sm leading-relaxed">
              La plataforma líder en venta de paquetes turísticos prémium de América Latina. Conectamos sueños con los mejores destinos del planeta con tecnología inmersiva 3D.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Síguenos en:</span>
              <a href="#instagram" className="w-8 h-8 rounded-lg bg-white/10 dark:bg-[#1E293B] hover:bg-white/20 flex items-center justify-center text-[#E2E8F0] transition text-xs border border-white/10 dark:border-[#334155]">IG</a>
              <a href="#facebook" className="w-8 h-8 rounded-lg bg-white/10 dark:bg-[#1E293B] hover:bg-white/20 flex items-center justify-center text-[#E2E8F0] transition text-xs border border-white/10 dark:border-[#334155]">FB</a>
              <a href="#tiktok" className="w-8 h-8 rounded-lg bg-white/10 dark:bg-[#1E293B] hover:bg-white/20 flex items-center justify-center text-[#E2E8F0] transition text-xs border border-white/10 dark:border-[#334155]">TK</a>
            </div>
          </div>

          {/* Col 2: Destinos */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">Destinos Top 3D</h4>
            <ul className="space-y-2 text-xs text-[#38BDF8] dark:text-[#94A3B8]">
              <li><button onClick={() => onNavigate('home')} className="hover:text-white dark:hover:text-[#E2E8F0] transition">Cancún Todo Incluido</button></li>
              <li><button onClick={() => onNavigate('home')} className="hover:text-white dark:hover:text-[#E2E8F0] transition">París Romántico</button></li>
              <li><button onClick={() => onNavigate('home')} className="hover:text-white dark:hover:text-[#E2E8F0] transition">Bali & Templos</button></li>
              <li><button onClick={() => onNavigate('home')} className="hover:text-white dark:hover:text-[#E2E8F0] transition">Machu Picchu Mágico</button></li>
              <li><button onClick={() => onNavigate('home')} className="hover:text-white dark:hover:text-[#E2E8F0] transition">Santorini de Lujo</button></li>
              <li><button onClick={() => onNavigate('home')} className="hover:text-white dark:hover:text-[#E2E8F0] transition">Dubai Futurista</button></li>
            </ul>
          </div>

          {/* Col 3: Empresa */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">Nosotros</h4>
            <ul className="space-y-2 text-xs text-[#38BDF8] dark:text-[#94A3B8]">
              <li><a href="#about" className="hover:text-white dark:hover:text-[#E2E8F0] transition">Quiénes somos</a></li>
              <li><a href="#press" className="hover:text-white dark:hover:text-[#E2E8F0] transition">Prensa & Noticias</a></li>
              <li><a href="#sustainability" className="hover:text-white dark:hover:text-[#E2E8F0] transition">Turismo Sostenible</a></li>
              <li><a href="#careers" className="hover:text-white dark:hover:text-[#E2E8F0] transition">Trabaja con nosotros</a></li>
              <li><a href="#agencies" className="hover:text-white dark:hover:text-[#E2E8F0] transition">Agencias asociadas</a></li>
            </ul>
          </div>

          {/* Col 4: Soporte */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E2E8F0]">Soporte & Ayuda</h4>
            <ul className="space-y-2 text-xs text-[#38BDF8] dark:text-[#94A3B8]">
              <li><a href="#help" className="hover:text-white dark:hover:text-[#E2E8F0] transition">Centro de ayuda 24/7</a></li>
              <li><a href="#status" className="hover:text-white dark:hover:text-[#E2E8F0] transition">Estado del vuelo</a></li>
              <li><button onClick={() => onNavigate('terms')} className="hover:text-[#0EA5E9] dark:hover:text-[#38BDF8] transition cursor-pointer text-left">Políticas de cancelación</button></li>
              <li><button onClick={() => onNavigate('terms')} className="hover:text-[#0EA5E9] dark:hover:text-[#38BDF8] transition cursor-pointer text-left">Términos y condiciones</button></li>
              <li><button onClick={() => onNavigate('terms')} className="hover:text-[#0EA5E9] dark:hover:text-[#38BDF8] transition cursor-pointer text-left">Privacidad y cookies</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#475569] dark:border-[#334155] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B] dark:text-[#94A3B8]">
          <p>© 2026 Horizonte Moderno Inc. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <span>Pagos seguros procesados con encriptación SSL de 256 bits y 3D-Secure</span>
            <div className="flex gap-2 text-white dark:text-[#E2E8F0] font-mono text-[10px]">
              <span className="bg-white/10 dark:bg-[#1E293B] px-2 py-0.5 rounded border border-white/10 dark:border-[#334155]">VISA</span>
              <span className="bg-white/10 dark:bg-[#1E293B] px-2 py-0.5 rounded border border-white/10 dark:border-[#334155]">MASTERCARD</span>
              <span className="bg-white/10 dark:bg-[#1E293B] px-2 py-0.5 rounded border border-white/10 dark:border-[#334155]">AMEX</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
