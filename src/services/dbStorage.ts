// ============================================================================
// 💾 SERVICIO DE PERSISTENCIA Y BASE DE DATOS LOCAL RELACIONAL
// Olimpiadas IPP 6to Año - Capa Servidor / Datos (Persistencia en LocalStorage)
// ============================================================================

export type ProductCategory = 'paquete' | 'aereo' | 'estadia' | 'auto';

export interface ProductItem {
  codigo: string;          // Clave Primaria (ej. AER-101, EST-201, PAQ-01)
  nombre: string;
  descripcion: string;
  categoria: ProductCategory;
  precioUnitario: number;  // Base en USD
  stock: number;           // Cupos disponibles
  imagen?: string;
  noches?: number;
  incluye?: string[];
  rating?: number;
  highlight?: string;
}

export interface OrderItem {
  idPedido: string;
  codigoProducto: string;
  descripcion: string;
  categoria: ProductCategory;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export type OrderStatus = 'pendiente_entrega' | 'entregado' | 'anulado';

export interface Order {
  id: string;               // Clave Primaria (ej. ORD-2026-084)
  nroFactura: string;       // Relación con Ventas (ej. FAC-2026-084)
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  fecha: string;            // ISO String
  estado: OrderStatus;
  items: OrderItem[];
  total: number;            // Total en USD
  metodoPago: 'tarjeta' | 'debito' | 'transferencia';
  cuotas: number;
  notas?: string;
  fechaEntrega?: string;
  responsableEntrega?: string;
  motivoAnulacion?: string;
}

export interface SalesInvoice {
  nroFactura: string;       // Clave Primaria
  idPedido: string;         // Clave Foránea
  idCliente: string;
  clienteNombre: string;
  clienteEmail: string;
  fecha: string;
  montoTotal: number;
  estadoCobro: 'cobrado' | 'a_cobrar';
  metodoPago: string;
  cuotas: number;
}

export interface HistoricDelivery {
  id: string;
  idPedido: string;
  nroFactura: string;
  clienteNombre: string;
  clienteEmail: string;
  fechaEntrega: string;
  responsableEntrega: string;
  montoTotal: number;
  itemsCount: number;
}

export interface EmailAuditLog {
  id: string;
  destinatario: string;
  tipo: 'cliente' | 'empresa_ventas';
  asunto: string;
  fechaHora: string;
  estado: 'Enviado';
  cuerpo: string;
}

// 📦 DATOS INICIALES SEMILLADOS (SEED DATA)
const INITIAL_PRODUCTS: ProductItem[] = [
  // 1. Paquetes Integrales
  {
    codigo: 'PAQ-01',
    nombre: 'Cancún All-Inclusive & Tulum Maya',
    descripcion: 'Vuelo directo + Resort 5★ Riviera Maya + Excursión en Catamarán a Isla Mujeres y Cenotes.',
    categoria: 'paquete',
    precioUnitario: 1290,
    stock: 14,
    noches: 7,
    rating: 4.9,
    imagen: 'https://images.unsplash.com/photo-1510097467424-192d713fd8c2?auto=format&fit=crop&w=800&q=80',
    incluye: ['Vuelos I/V', 'Resort 5★', 'All-Inclusive', 'Traslados VIP'],
    highlight: 'Oferta Especial'
  },
  {
    codigo: 'PAQ-02',
    nombre: 'París Clásico, Louvre & Crucero Sena',
    descripcion: 'Vuelo con Air France + Hotel Boutique Ópera + Cena Gourmet en la Torre Eiffel y paseos.',
    categoria: 'paquete',
    precioUnitario: 2150,
    stock: 8,
    noches: 6,
    rating: 4.8,
    imagen: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=80',
    incluye: ['Vuelos I/V', 'Hotel 4★ Sup', 'Desayunos Buffet', 'Paseos Guiados'],
    highlight: 'Más Vendido'
  },
  {
    codigo: 'PAQ-03',
    nombre: 'Bali Místico, Templos & Ubud Zen',
    descripcion: 'Aéreo internacional + Villa privada con piscina infinita + Trekking y santuarios sagrados.',
    categoria: 'paquete',
    precioUnitario: 1890,
    stock: 10,
    noches: 10,
    rating: 4.95,
    imagen: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80',
    incluye: ['Vuelo + Hotel', 'Piscina Privada', 'Excursiones', 'Spa Diario'],
    highlight: 'Exclusivo'
  },
  {
    codigo: 'PAQ-04',
    nombre: 'Machu Picchu Sagrado & Cusco Imperial',
    descripcion: 'Pasaje aéreo + Tren Vistadome panorámico + Hotel 5★ con vista a los Andes.',
    categoria: 'paquete',
    precioUnitario: 980,
    stock: 18,
    noches: 5,
    rating: 4.9,
    imagen: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=80',
    incluye: ['Vuelos', 'Tren Panorámico', 'Entrada Machu Picchu', 'Guía Privado'],
    highlight: 'Aventura'
  },
  {
    codigo: 'PAQ-05',
    nombre: 'Santorini Sunset & Mykonos Luxury',
    descripcion: 'Vuelos internos + Suite en acantilado de Oia con jacuzzi privado y cata de vinos griegos.',
    categoria: 'paquete',
    precioUnitario: 2450,
    stock: 6,
    noches: 7,
    rating: 5.0,
    imagen: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=80',
    incluye: ['Ferry VIP', 'Suite Cueva', 'Desayuno Caldera', 'Cata Vinos'],
    highlight: 'Romántico'
  },
  {
    codigo: 'PAQ-06',
    nombre: 'Dubai Futurista & Safari Desierto',
    descripcion: 'Vuelo en Emirates + Hotel Burj Al Arab área + Safari en 4x4 con cena beduina bajo estrellas.',
    categoria: 'paquete',
    precioUnitario: 3100,
    stock: 9,
    noches: 6,
    rating: 4.92,
    imagen: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80',
    incluye: ['Vuelo Emirates', 'Hotel 5★ Gran Lujo', 'Safari 4x4', 'Burj Khalifa VIP'],
    highlight: 'Lujo'
  },

  // 2. Pasajes Aéreos
  {
    codigo: 'AER-101',
    nombre: 'Pasaje Aéreo: Buenos Aires ➔ Madrid / París',
    descripcion: 'Vuelo directo internacional ida y vuelta con equipaje de bodega incluido de 23kg y comida gourmet a bordo.',
    categoria: 'aereo',
    precioUnitario: 890,
    stock: 25,
    imagen: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80',
    incluye: ['Ida y Vuelta', 'Equipaje 23kg', 'Snack & Bebidas', 'Selección Asiento'],
    highlight: 'Vuelo Regular'
  },
  {
    codigo: 'AER-102',
    nombre: 'Pasaje Aéreo: Santiago / Lima ➔ Cancún Caribe',
    descripcion: 'Vuelo de temporada con conexión rápida y entretenimiento a bordo con pantallas táctiles individuales.',
    categoria: 'aereo',
    precioUnitario: 540,
    stock: 30,
    imagen: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80',
    incluye: ['Ida y Vuelta', 'Mochila + Carry-on', 'Embarque Prioritario'],
    highlight: 'Tarifa Promo'
  },

  // 3. Estadías y Hoteles
  {
    codigo: 'EST-201',
    nombre: 'Estadía: Cabaña Boutique Selva de Ubud (Bali)',
    descripcion: 'Pensión completa en villa flotante de madera teca con vista a los arrozales y piscina natural privada.',
    categoria: 'estadia',
    precioUnitario: 135,
    stock: 8,
    noches: 1,
    imagen: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    incluye: ['Por Noche', 'Desayuno Orgánico', 'Yoga Matutino', 'Wifi Alta Velocidad'],
    highlight: 'Eco-Luxury'
  },
  {
    codigo: 'EST-202',
    nombre: 'Estadía: Resort All-Inclusive Gran Diamante (Cancún)',
    descripcion: 'Habitación King frente al mar turquesa con barra libre prémium, 6 restaurantes temáticos y acceso a playa.',
    categoria: 'estadia',
    precioUnitario: 210,
    stock: 15,
    noches: 1,
    imagen: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
    incluye: ['Por Noche', 'All-Inclusive', 'Room Service 24h', 'Deportes Acuáticos'],
    highlight: 'Frente al Mar'
  },

  // 4. Alquiler de Autos
  {
    codigo: 'AUT-301',
    nombre: 'Alquiler de Auto: Camioneta SUV 4x4 All-Terrain',
    descripcion: 'Vehículo todoterreno con tracción integral, kilometraje libre, seguro total contra todo riesgo y GPS satelital.',
    categoria: 'auto',
    precioUnitario: 75,
    stock: 12,
    imagen: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80',
    incluye: ['Tarifa Diaria', 'Kilometraje Libre', 'Seguro Full 0 Deducible', 'Segundo Conductor'],
    highlight: 'Aventura'
  },
  {
    codigo: 'AUT-302',
    nombre: 'Alquiler de Auto: Convertible Deportivo de Lujo',
    descripcion: 'Auto descapotable de alta gama para recorrer costas y ciudades icónicas con elegancia.',
    categoria: 'auto',
    precioUnitario: 140,
    stock: 5,
    imagen: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
    incluye: ['Tarifa Diaria', 'Transmisión Automática', 'Audio Prémium', 'Seguro Premium'],
    highlight: 'Experiencia VIP'
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ORD-2026-081',
    nroFactura: 'FAC-2026-081',
    clienteId: 'usr-maria',
    clienteNombre: 'María González',
    clienteEmail: 'maria.gonzalez@horizontemoderno.com',
    fecha: '2026-09-28T14:30:00.000Z',
    estado: 'pendiente_entrega',
    total: 2580,
    metodoPago: 'tarjeta',
    cuotas: 6,
    notas: 'Pasajeros prefieren asientos delanteros en los traslados.',
    items: [
      {
        idPedido: 'ORD-2026-081',
        codigoProducto: 'PAQ-01',
        descripcion: 'Cancún All-Inclusive & Tulum Maya',
        categoria: 'paquete',
        cantidad: 2,
        precioUnitario: 1290,
        subtotal: 2580
      }
    ]
  },
  {
    id: 'ORD-2026-079',
    nroFactura: 'FAC-2026-079',
    clienteId: 'usr-lucas',
    clienteNombre: 'Lucas Fernández',
    clienteEmail: 'lucas.fernandez@gmail.com',
    fecha: '2026-09-20T10:15:00.000Z',
    estado: 'entregado',
    total: 2150,
    metodoPago: 'debito',
    cuotas: 1,
    fechaEntrega: '2026-09-21T16:00:00.000Z',
    responsableEntrega: 'Carlos Méndez (Jefe de Ventas)',
    items: [
      {
        idPedido: 'ORD-2026-079',
        codigoProducto: 'PAQ-02',
        descripcion: 'París Clásico, Louvre & Crucero Sena',
        categoria: 'paquete',
        cantidad: 1,
        precioUnitario: 2150,
        subtotal: 2150
      }
    ]
  },
  {
    id: 'ORD-2026-075',
    nroFactura: 'FAC-2026-075',
    clienteId: 'usr-sofia',
    clienteNombre: 'Sofía Romero',
    clienteEmail: 'sofia.romero@hotmail.com',
    fecha: '2026-09-15T09:40:00.000Z',
    estado: 'anulado',
    total: 1080,
    metodoPago: 'transferencia',
    cuotas: 1,
    motivoAnulacion: 'Cancelación solicitada por el cliente por cambio de fechas laborales.',
    items: [
      {
        idPedido: 'ORD-2026-075',
        codigoProducto: 'AER-102',
        descripcion: 'Pasaje Aéreo: Santiago / Lima ➔ Cancún Caribe',
        categoria: 'aereo',
        cantidad: 2,
        precioUnitario: 540,
        subtotal: 1080
      }
    ]
  }
];

const INITIAL_INVOICES: SalesInvoice[] = [
  {
    nroFactura: 'FAC-2026-081',
    idPedido: 'ORD-2026-081',
    idCliente: 'usr-maria',
    clienteNombre: 'María González',
    clienteEmail: 'maria.gonzalez@horizontemoderno.com',
    fecha: '2026-09-28T14:30:00.000Z',
    montoTotal: 2580,
    estadoCobro: 'cobrado',
    metodoPago: 'Tarjeta de Crédito (6 cuotas)',
    cuotas: 6
  },
  {
    nroFactura: 'FAC-2026-079',
    idPedido: 'ORD-2026-079',
    idCliente: 'usr-lucas',
    clienteNombre: 'Lucas Fernández',
    clienteEmail: 'lucas.fernandez@gmail.com',
    fecha: '2026-09-20T10:15:00.000Z',
    montoTotal: 2150,
    estadoCobro: 'cobrado',
    metodoPago: 'Tarjeta de Débito',
    cuotas: 1
  },
  {
    nroFactura: 'FAC-2026-075',
    idPedido: 'ORD-2026-075',
    idCliente: 'usr-sofia',
    clienteNombre: 'Sofía Romero',
    clienteEmail: 'sofia.romero@hotmail.com',
    fecha: '2026-09-15T09:40:00.000Z',
    montoTotal: 1080,
    estadoCobro: 'a_cobrar',
    metodoPago: 'Transferencia Bancaria',
    cuotas: 1
  }
];

const INITIAL_EMAIL_LOGS: EmailAuditLog[] = [
  {
    id: 'EML-001',
    destinatario: 'maria.gonzalez@horizontemoderno.com',
    tipo: 'cliente',
    asunto: 'Comprobante de Pedido #ORD-2026-081 - Registrado como Pendiente de Entrega',
    fechaHora: '2026-09-28 14:31:05',
    estado: 'Enviado',
    cuerpo: 'Estimada María González, hemos recibido tu compra por $2.580 USD. Tu pedido ha sido registrado en estado PENDIENTE DE ENTREGA mientras el sector de reservas valida la disponibilidad con los operadores hoteleros.'
  },
  {
    id: 'EML-002',
    destinatario: 'ventas@horizontemoderno.com',
    tipo: 'empresa_ventas',
    asunto: '🚨 NUEVA ORDEN RECIBIDA: #ORD-2026-081 - Cliente: María González ($2.580 USD)',
    fechaHora: '2026-09-28 14:31:06',
    estado: 'Enviado',
    cuerpo: 'Atención Sector Ventas: El pasajero María González ha registrado la orden #ORD-2026-081 con 2 plazas en "Cancún All-Inclusive & Tulum Maya". Se requiere su revisión y posterior despacho en el panel interno.'
  }
];

// ============================================================================
// 🛠️ CLASE CONTROLADORA DE PERSISTENCIA (DATABASE ENGINE SIMULATOR)
// ============================================================================
export class DbStorageService {
  private static KEYS = {
    PRODUCTS: 'hm_db_productos',
    ORDERS: 'hm_db_pedidos',
    INVOICES: 'hm_db_ventas',
    EMAILS: 'hm_db_correos_audit',
    HISTORY: 'hm_db_historico_entregas'
  };

  // Inicializador de tablas
  static initDatabase(): void {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(this.KEYS.PRODUCTS)) {
      localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    }
    if (!localStorage.getItem(this.KEYS.ORDERS)) {
      localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(INITIAL_ORDERS));
    }
    if (!localStorage.getItem(this.KEYS.INVOICES)) {
      localStorage.setItem(this.KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    }
    if (!localStorage.getItem(this.KEYS.EMAILS)) {
      localStorage.setItem(this.KEYS.EMAILS, JSON.stringify(INITIAL_EMAIL_LOGS));
    }
    if (!localStorage.getItem(this.KEYS.HISTORY)) {
      const initialHistory: HistoricDelivery[] = [
        {
          id: 'HIST-001',
          idPedido: 'ORD-2026-079',
          nroFactura: 'FAC-2026-079',
          clienteNombre: 'Lucas Fernández',
          clienteEmail: 'lucas.fernandez@gmail.com',
          fechaEntrega: '2026-09-21T16:00:00.000Z',
          responsableEntrega: 'Carlos Méndez (Jefe de Ventas)',
          montoTotal: 2150,
          itemsCount: 1
        }
      ];
      localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(initialHistory));
    }
  }

  // --- PRODUCTOS ---
  static getProducts(): ProductItem[] {
    this.initDatabase();
    try {
      const data = localStorage.getItem(this.KEYS.PRODUCTS);
      return data ? JSON.parse(data) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  }

  static saveProduct(product: ProductItem): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.codigo.toUpperCase() === product.codigo.toUpperCase());
    if (index >= 0) {
      products[index] = product;
    } else {
      products.unshift(product);
    }
    localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(products));
  }

  static deleteProduct(codigo: string): void {
    const products = this.getProducts().filter(p => p.codigo.toUpperCase() !== codigo.toUpperCase());
    localStorage.setItem(this.KEYS.PRODUCTS, JSON.stringify(products));
  }

  // --- PEDIDOS (ÓRDENES) ---
  static getOrders(): Order[] {
    this.initDatabase();
    try {
      const data = localStorage.getItem(this.KEYS.ORDERS);
      return data ? JSON.parse(data) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  }

  static createOrder(orderData: Omit<Order, 'id' | 'nroFactura' | 'fecha' | 'estado' | 'items'> & { items: Omit<OrderItem, 'idPedido'>[] }): Order {
    const orders = this.getOrders();
    const nextNum = orders.length + 85;
    const orderId = `ORD-2026-0${nextNum}`;
    const invoiceNum = `FAC-2026-0${nextNum}`;

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      nroFactura: invoiceNum,
      fecha: new Date().toISOString(),
      estado: 'pendiente_entrega',
      items: orderData.items.map(item => ({ ...item, idPedido: orderId }))
    };

    orders.unshift(newOrder);
    localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));

    // Registrar en tabla de Ventas / Facturación
    this.createInvoice({
      nroFactura: invoiceNum,
      idPedido: orderId,
      idCliente: newOrder.clienteId,
      clienteNombre: newOrder.clienteNombre,
      clienteEmail: newOrder.clienteEmail,
      fecha: newOrder.fecha,
      montoTotal: newOrder.total,
      estadoCobro: 'cobrado',
      metodoPago: newOrder.metodoPago === 'tarjeta' ? `Tarjeta (${newOrder.cuotas} cuotas)` : newOrder.metodoPago.toUpperCase(),
      cuotas: newOrder.cuotas
    });

    // Disparar los 2 correos automáticos exigidos por la consigna
    this.sendAutomaticEmails(newOrder);

    return newOrder;
  }

  static updateOrder(updatedOrder: Order): void {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === updatedOrder.id);
    if (index >= 0) {
      orders[index] = updatedOrder;
      localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
    }
  }

  static updateOrderNotes(orderId: string, notes: string): Order | null {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;
    order.notas = notes;
    localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));
    return order;
  }

  static deliverOrder(orderId: string, responsable: string = 'Carlos Méndez (Jefe de Ventas)'): boolean {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.estado = 'entregado';
    order.fechaEntrega = new Date().toISOString();
    order.responsableEntrega = responsable;
    localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));

    // Agregar a la tabla histórica de entregas
    const history = this.getDeliveryHistory();
    history.unshift({
      id: `HIST-${Date.now().toString().slice(-4)}`,
      idPedido: order.id,
      nroFactura: order.nroFactura,
      clienteNombre: order.clienteNombre,
      clienteEmail: order.clienteEmail,
      fechaEntrega: order.fechaEntrega,
      responsableEntrega: responsable,
      montoTotal: order.total,
      itemsCount: order.items.reduce((acc, it) => acc + it.cantidad, 0)
    });
    localStorage.setItem(this.KEYS.HISTORY, JSON.stringify(history));

    // Correo de despacho al cliente
    this.addEmailLog({
      destinatario: order.clienteEmail,
      tipo: 'cliente',
      asunto: `🎉 ¡Tu viaje ha sido EMITIDO Y ENTREGADO! Pedido #${order.id}`,
      cuerpo: `Estimado/a ${order.clienteNombre}, tu pedido #${order.id} ha sido despachado y entregado por ${responsable}. Ya puedes acceder a tu Tarjeta de Embarque 3D y vouchers oficiales desde tu cuenta.`
    });

    return true;
  }

  static cancelOrder(orderId: string, motivo: string = 'Anulación solicitada por el usuario'): boolean {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return false;

    order.estado = 'anulado';
    order.motivoAnulacion = motivo;
    localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(orders));

    // Actualizar factura
    const invoices = this.getInvoices();
    const inv = invoices.find(i => i.idPedido === orderId);
    if (inv) {
      inv.estadoCobro = 'a_cobrar';
      localStorage.setItem(this.KEYS.INVOICES, JSON.stringify(invoices));
    }

    // Registrar correo de notificación
    this.addEmailLog({
      destinatario: order.clienteEmail,
      tipo: 'cliente',
      asunto: `Aviso de Anulación de Pedido #${order.id}`,
      cuerpo: `Estimado/a ${order.clienteNombre}, se ha registrado la anulación del pedido #${order.id}. Motivo: ${motivo}. Para consultas contáctenos a soporte@horizontemoderno.com.`
    });

    return true;
  }

  // --- FACTURACIÓN / ESTADO DE CUENTA ---
  static getInvoices(): SalesInvoice[] {
    this.initDatabase();
    try {
      const data = localStorage.getItem(this.KEYS.INVOICES);
      return data ? JSON.parse(data) : INITIAL_INVOICES;
    } catch {
      return INITIAL_INVOICES;
    }
  }

  static createInvoice(invoice: SalesInvoice): void {
    const invoices = this.getInvoices();
    invoices.unshift(invoice);
    localStorage.setItem(this.KEYS.INVOICES, JSON.stringify(invoices));
  }

  // --- HISTÓRICO DE ENTREGAS ---
  static getDeliveryHistory(): HistoricDelivery[] {
    this.initDatabase();
    try {
      const data = localStorage.getItem(this.KEYS.HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // --- AUDITORÍA DE CORREOS ELECTRÓNICOS ---
  static getEmailLogs(): EmailAuditLog[] {
    this.initDatabase();
    try {
      const data = localStorage.getItem(this.KEYS.EMAILS);
      return data ? JSON.parse(data) : INITIAL_EMAIL_LOGS;
    } catch {
      return INITIAL_EMAIL_LOGS;
    }
  }

  static addEmailLog(email: Omit<EmailAuditLog, 'id' | 'fechaHora' | 'estado'>): EmailAuditLog {
    const logs = this.getEmailLogs();
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const newLog: EmailAuditLog = {
      ...email,
      id: `EML-00${logs.length + 1}`,
      fechaHora: formattedDate,
      estado: 'Enviado'
    };

    logs.unshift(newLog);
    localStorage.setItem(this.KEYS.EMAILS, JSON.stringify(logs));
    return newLog;
  }

  static sendAutomaticEmails(order: Order): void {
    // 1. Correo al Cliente
    this.addEmailLog({
      destinatario: order.clienteEmail,
      tipo: 'cliente',
      asunto: `✈️ Confirmación de Compra #${order.id} - Registrado como Pendiente de Entrega`,
      cuerpo: `Estimado/a ${order.clienteNombre},\n\nGracias por confiar en Horizonte Moderno. Tu orden por un total de $${order.total.toLocaleString()} USD ha sido procesada con éxito y se encuentra registrada como PENDIENTE DE ENTREGA.\n\nDetalle de la compra:\n${order.items.map(it => `• [${it.codigoProducto}] ${it.descripcion} x${it.cantidad} - $${(it.subtotal).toLocaleString()} USD`).join('\n')}\n\nNuestro sector de reservas y el Jefe de Ventas están validando los cupos con los prestadores oficiales. Te notificaremos en cuanto los vouchers definitivos y tu Boarding Pass 3D estén emitidos.`
    });

    // 2. Correo al Sector Ventas de la Empresa
    this.addEmailLog({
      destinatario: 'ventas@horizontemoderno.com',
      tipo: 'empresa_ventas',
      asunto: `🚨 NUEVA COMPRA RECIBIDA: Orden #${order.id} (${order.clienteNombre} - $${order.total.toLocaleString()} USD)`,
      cuerpo: `AVISO AUTOMÁTICO AL SECTOR VENTAS:\n\nSe ha completado una nueva compra en la plataforma web.\n\n• Pedido: #${order.id}\n• Factura: #${order.nroFactura}\n• Cliente: ${order.clienteNombre} (${order.clienteEmail})\n• Total Cobrado: $${order.total.toLocaleString()} USD\n• Método de Pago: ${order.metodoPago.toUpperCase()} (${order.cuotas} cuotas)\n• Artículos a despachar: ${order.items.length}\n\nPor favor, ingresar al Panel del Jefe de Ventas para verificar la disponibilidad y proceder a la entrega formal del servicio.`
    });
  }
}
