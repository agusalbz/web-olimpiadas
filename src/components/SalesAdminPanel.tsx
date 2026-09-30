import React, { useState, useEffect } from 'react';
import {
  DbStorageService,
  type ProductItem,
  type Order,
  type SalesInvoice,
  type HistoricDelivery,
  type EmailAuditLog,
  type ProductCategory
} from '../services/dbStorage';

interface SalesAdminPanelProps {
  onBackToClient: () => void;
  formatPrice: (amountUSD: number) => string;
}

export const SalesAdminPanel: React.FC<SalesAdminPanelProps> = ({
  onBackToClient,
  formatPrice
}) => {
  const [activeTab, setActiveTab] = useState<
    'pendientes' | 'productos' | 'cargar_producto' | 'facturacion' | 'historico' | 'correos'
  >('pendientes');

  // Estados de datos locales
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [history, setHistory] = useState<HistoricDelivery[]>([]);
  const [emails, setEmails] = useState<EmailAuditLog[]>([]);

  // Filtros
  const [searchProduct, setSearchProduct] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('todos');
  const [searchClientInvoice, setSearchClientInvoice] = useState('');

  // Formulario nuevo producto (1.4.1)
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<ProductCategory>('paquete');
  const [newPrice, setNewPrice] = useState<number>(500);
  const [newStock, setNewStock] = useState<number>(10);
  const [newNights, setNewNights] = useState<number>(5);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Modal para ver contenido de correo
  const [selectedEmail, setSelectedEmail] = useState<EmailAuditLog | null>(null);

  const refreshData = () => {
    setProducts(DbStorageService.getProducts());
    setOrders(DbStorageService.getOrders());
    setInvoices(DbStorageService.getInvoices());
    setHistory(DbStorageService.getDeliveryHistory());
    setEmails(DbStorageService.getEmailLogs());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // 1.4.1 Cargar Producto
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim() || !newDesc.trim() || newPrice <= 0) {
      alert('Por favor, completa todos los campos requeridos con valores válidos.');
      return;
    }

    const item: ProductItem = {
      codigo: newCode.trim().toUpperCase(),
      nombre: newName.trim(),
      descripcion: newDesc.trim(),
      categoria: newCategory,
      precioUnitario: Number(newPrice),
      stock: Number(newStock),
      noches: newCategory === 'paquete' || newCategory === 'estadia' ? Number(newNights) : undefined,
      rating: 5.0,
      highlight: 'Nuevo Producto'
    };

    DbStorageService.saveProduct(item);
    refreshData();
    setFormSuccess(`¡Producto [${item.codigo}] ${item.nombre} guardado exitosamente en el catálogo!`);
    
    // Limpiar formulario
    setNewCode('');
    setNewName('');
    setNewDesc('');
    setNewPrice(500);
    setTimeout(() => setFormSuccess(null), 4000);
  };

  // 1.4.4 Realizar Entrega de Pedidos
  const handleDeliver = (orderId: string) => {
    if (window.confirm(`¿Confirmas la entrega formal del pedido #${orderId}? Esto notificará al cliente y pasará el registro a la tabla histórica.`)) {
      DbStorageService.deliverOrder(orderId, 'Carlos Méndez (Jefe de Ventas)');
      refreshData();
    }
  };

  // 1.4.6 Anular Pedido
  const handleCancelOrder = (orderId: string) => {
    const motivo = window.prompt(`Ingresa el motivo de la anulación para el pedido #${orderId}:`, 'Cancelación comercial / Falta de pago');
    if (motivo) {
      DbStorageService.cancelOrder(orderId, motivo);
      refreshData();
    }
  };

  // Métricas
  const pendingOrders = orders.filter(o => o.estado === 'pendiente_entrega');
  const deliveredOrders = orders.filter(o => o.estado === 'entregado');
  const totalBilledUSD = invoices.reduce((sum, inv) => sum + (inv.estadoCobro === 'cobrado' ? inv.montoTotal : 0), 0);

  // Filtrado de productos
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.nombre.toLowerCase().includes(searchProduct.toLowerCase()) || p.codigo.toLowerCase().includes(searchProduct.toLowerCase());
    const matchesCategory = filterCategory === 'todos' || p.categoria === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Filtrado de facturas ordenadas por fecha (1.4.5)
  const sortedAndFilteredInvoices = [...invoices]
    .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .filter(inv => inv.clienteNombre.toLowerCase().includes(searchClientInvoice.toLowerCase()) || inv.nroFactura.toLowerCase().includes(searchClientInvoice.toLowerCase()));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors">
      
      {/* Barra Superior de Control de Ventas */}
      <header className="bg-slate-900 border-b border-slate-800 text-white px-4 sm:px-6 py-3.5 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center font-bold text-xs">
              HM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Panel de Gestión y Ventas
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  Jefe de Ventas
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Operador: <strong>Carlos Méndez</strong> · Sistema Administrativo de Gestión Turística
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              title="Refrescar datos de la base de datos local"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Actualizar Datos</span>
            </button>

            <button
              onClick={onBackToClient}
              className="px-3.5 py-1.5 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span>Vista de Pasajero</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Métricas Principales (KPIs) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="rounded-lg p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Pedidos Pendientes
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-amber-600 dark:text-amber-400">
                {pendingOrders.length}
              </span>
              <span className="text-[10px] font-medium font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                Por Entregar
              </span>
            </div>
          </div>

          <div className="rounded-lg p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Pedidos Entregados
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {deliveredOrders.length}
              </span>
              <span className="text-[10px] font-medium font-mono px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Despachados
              </span>
            </div>
          </div>

          <div className="rounded-lg p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Catálogo de Servicios
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-[#0284C7] dark:text-sky-400">
                {products.length}
              </span>
              <span className="text-[10px] font-medium font-mono px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                Activos
              </span>
            </div>
          </div>

          <div className="rounded-lg p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Facturación Cobrada
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {formatPrice(totalBilledUSD)}
              </span>
            </div>
          </div>

          <div className="rounded-lg p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 lg:col-span-1">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
              Correos Auditados
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {emails.length}
              </span>
              <span className="text-[10px] font-medium font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Automáticos
              </span>
            </div>
          </div>
        </div>

        {/* Selector de Pestañas de Gestión (Punto 1.4 del Pliego) */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`px-3 py-2 text-xs font-medium transition cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
              activeTab === 'pendientes'
                ? 'border-[#0284C7] text-[#0284C7] dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            1.4.3. Pedidos Pendientes ({pendingOrders.length})
          </button>

          <button
            onClick={() => setActiveTab('cargar_producto')}
            className={`px-3 py-2 text-xs font-medium transition cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
              activeTab === 'cargar_producto'
                ? 'border-[#0284C7] text-[#0284C7] dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            1.4.1. Cargar Producto
          </button>

          <button
            onClick={() => setActiveTab('productos')}
            className={`px-3 py-2 text-xs font-medium transition cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
              activeTab === 'productos'
                ? 'border-[#0284C7] text-[#0284C7] dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            1.4.2. Lista de Productos ({products.length})
          </button>

          <button
            onClick={() => setActiveTab('facturacion')}
            className={`px-3 py-2 text-xs font-medium transition cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
              activeTab === 'facturacion'
                ? 'border-[#0284C7] text-[#0284C7] dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            1.4.5. Facturación / Estado de Cuenta
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`px-3 py-2 text-xs font-medium transition cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
              activeTab === 'historico'
                ? 'border-[#0284C7] text-[#0284C7] dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            2.4. Tabla Histórica ({history.length})
          </button>

          <button
            onClick={() => setActiveTab('correos')}
            className={`px-3 py-2 text-xs font-medium transition cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
              activeTab === 'correos'
                ? 'border-[#0284C7] text-[#0284C7] dark:text-sky-400 font-semibold'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Auditoría de Correos ({emails.length})
          </button>
        </div>

        {/* ============================================================== */}
        {/* PESTAÑA 1: PEDIDOS PENDIENTES & ENTREGA (1.4.3 y 1.4.4) */}
        {/* ============================================================== */}
        {activeTab === 'pendientes' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Bandeja de Pedidos Pendientes de Entrega
                </h3>
                <p className="text-xs text-slate-500">
                  Requerimientos 1.4.3 (Ver pendientes), 1.4.4 (Realizar entrega) y 1.4.6 (Anular pedido).
                </p>
              </div>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  No hay pedidos pendientes de entrega
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Todas las operaciones registradas se encuentran formalmente despachadas o anuladas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {pendingOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-4 sm:p-5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            {ord.id}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            Factura: {ord.nroFactura}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white pt-1">
                          Cliente: {ord.clienteNombre} ({ord.clienteEmail})
                        </h4>
                        <span className="text-[11px] text-slate-500 block">
                          Fecha: {new Date(ord.fecha).toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div className="text-right space-y-0.5">
                        <span className="text-[11px] text-slate-500 block">Monto total</span>
                        <div className="text-lg font-bold text-[#0284C7] dark:text-sky-400">
                          {formatPrice(ord.total)}
                        </div>
                        <span className="text-[10px] text-slate-400 block capitalize">
                          {ord.metodoPago} ({ord.cuotas} {ord.cuotas === 1 ? 'pago' : 'cuotas'})
                        </span>
                      </div>
                    </div>

                    {/* Detalle de Artículos del Pedido */}
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block mb-1.5">
                        Servicios incluidos en la orden:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ord.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs flex justify-between items-center"
                          >
                            <div>
                              <span className="font-mono font-semibold text-[#0284C7] dark:text-sky-400">[{it.codigoProducto}]</span>{' '}
                              <span className="font-medium text-slate-900 dark:text-white">{it.descripcion}</span>
                              <div className="text-[10px] text-slate-500">
                                Cantidad: {it.cantidad} · Unitario: {formatPrice(it.precioUnitario)}
                              </div>
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {formatPrice(it.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {ord.notas && (
                      <div className="p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300">
                        <strong>Nota:</strong> {ord.notas}
                      </div>
                    )}

                    {/* Botones de Acción */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleCancelOrder(ord.id)}
                        className="px-3 py-1.5 rounded-md border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-medium transition cursor-pointer flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>1.4.6. Anular Pedido</span>
                      </button>

                      <button
                        onClick={() => handleDeliver(ord.id)}
                        className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>1.4.4. Realizar Entrega</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 2: CARGAR PRODUCTOS (1.4.1) */}
        {/* ============================================================== */}
        {activeTab === 'cargar_producto' && (
          <div className="max-w-2xl mx-auto space-y-4 animate-fadeIn">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Alta de Nuevos Productos Turísticos
              </h3>
              <p className="text-xs text-slate-500">
                Requerimiento 1.4.1: Cargar productos (código, descripción, precio unitario).
              </p>
            </div>

            {formSuccess && (
              <div className="p-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                <span>✓</span>
                <span>{formSuccess}</span>
              </div>
            )}

            <form
              onSubmit={handleSaveProduct}
              className="p-5 sm:p-6 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Código de Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="Ej. AER-205, EST-301, PAQ-10"
                    className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono focus:border-[#0284C7] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Identificador único.</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Categoría del Servicio *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:border-[#0284C7] focus:outline-hidden cursor-pointer"
                  >
                    <option value="paquete">Paquete Integral</option>
                    <option value="aereo">Pasaje Aéreo</option>
                    <option value="estadia">Estadía / Hotel</option>
                    <option value="auto">Alquiler de Auto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Madrid Cultural & Museo del Prado"
                  className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:border-[#0284C7] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Descripción Detallada *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Detallar inclusiones, itinerario, prestaciones hoteleras..."
                  className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:border-[#0284C7] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Precio Unitario (USD) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold focus:border-[#0284C7] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Stock / Cupos *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:border-[#0284C7] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Duración (Noches)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newNights}
                    onChange={(e) => setNewNights(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:border-[#0284C7] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold text-xs transition cursor-pointer shadow-xs"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 3: LISTA DE PRODUCTOS (1.4.2) */}
        {/* ============================================================== */}
        {activeTab === 'productos' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Inventario General de Productos
                </h3>
                <p className="text-xs text-slate-500">
                  Requerimiento 1.4.2: Consultar la lista de productos.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs w-52 focus:outline-hidden focus:border-[#0284C7]"
                />

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-hidden focus:border-[#0284C7] cursor-pointer"
                >
                  <option value="todos">Todas las categorías</option>
                  <option value="paquete">Paquetes</option>
                  <option value="aereo">Aéreos</option>
                  <option value="estadia">Estadías</option>
                  <option value="auto">Autos</option>
                </select>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5">Código</th>
                      <th className="py-2.5 px-3.5">Categoría</th>
                      <th className="py-2.5 px-3.5">Descripción del Servicio</th>
                      <th className="py-2.5 px-3.5 text-center">Cupos</th>
                      <th className="py-2.5 px-3.5 text-right">Precio Unitario</th>
                      <th className="py-2.5 px-3.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.map((p) => (
                      <tr key={p.codigo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3.5 font-mono font-semibold text-[#0284C7] dark:text-sky-400">
                          {p.codigo}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium capitalize bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {p.categoria}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white">{p.nombre}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{p.descripcion}</div>
                        </td>
                        <td className="py-2.5 px-3.5 text-center font-medium font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                            p.stock > 5 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400'
                          }`}>
                            {p.stock} disp.
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-slate-900 dark:text-white">
                          {formatPrice(p.precioUnitario)}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Seguro que deseas eliminar el producto [${p.codigo}] del catálogo?`)) {
                                DbStorageService.deleteProduct(p.codigo);
                                refreshData();
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 transition cursor-pointer"
                            title="Eliminar producto"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 4: ESTADO DE CUENTA / FACTURACIÓN (1.4.5) */}
        {/* ============================================================== */}
        {activeTab === 'facturacion' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Estado de Cuenta: Facturación
                </h3>
                <p className="text-xs text-slate-500">
                  Requerimiento 1.4.5: Ver el estado de cuenta (facturas a cobrar ordenadas por fecha y por cliente).
                </p>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Filtrar por cliente o factura..."
                  value={searchClientInvoice}
                  onChange={(e) => setSearchClientInvoice(e.target.value)}
                  className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs w-60 focus:outline-hidden focus:border-[#0284C7]"
                />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5">N° Factura</th>
                      <th className="py-2.5 px-3.5">Fecha</th>
                      <th className="py-2.5 px-3.5">Cliente</th>
                      <th className="py-2.5 px-3.5">Pedido</th>
                      <th className="py-2.5 px-3.5">Medio de Pago</th>
                      <th className="py-2.5 px-3.5 text-center">Estado</th>
                      <th className="py-2.5 px-3.5 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedAndFilteredInvoices.map((inv) => (
                      <tr key={inv.nroFactura} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3.5 font-mono font-semibold text-[#0284C7] dark:text-sky-400">
                          {inv.nroFactura}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500">
                          {new Date(inv.fecha).toLocaleDateString('es-AR')}
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-slate-900 dark:text-white">
                          {inv.clienteNombre}
                          <div className="text-[10px] text-slate-400">{inv.clienteEmail}</div>
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-500">
                          {inv.idPedido}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-400 capitalize">
                          {inv.metodoPago}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            inv.estadoCobro === 'cobrado'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          }`}>
                            {inv.estadoCobro === 'cobrado' ? '✓ Cobrada' : '⏳ A Cobrar'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-slate-900 dark:text-white">
                          {formatPrice(inv.montoTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 5: TABLA HISTÓRICA (Capa Servidor 2.4) */}
        {/* ============================================================== */}
        {activeTab === 'historico' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Tabla Histórica de Pedidos Entregados y Despachados
              </h3>
              <p className="text-xs text-slate-500">
                Requerimiento Servidor 2.4: Los pedidos pendientes se trasladan a esta tabla histórica una vez concretada la entrega.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5">ID Histórico</th>
                      <th className="py-2.5 px-3.5">Pedido</th>
                      <th className="py-2.5 px-3.5">Cliente</th>
                      <th className="py-2.5 px-3.5">Fecha Entrega</th>
                      <th className="py-2.5 px-3.5">Responsable</th>
                      <th className="py-2.5 px-3.5 text-center">Ítems</th>
                      <th className="py-2.5 px-3.5 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3.5 font-mono text-slate-500">
                          {h.id}
                        </td>
                        <td className="py-2.5 px-3.5 font-mono font-semibold text-[#0284C7] dark:text-sky-400">
                          {h.idPedido}
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-slate-900 dark:text-white">
                          {h.clienteNombre}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500">
                          {new Date(h.fechaEntrega).toLocaleString('es-AR')}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-700 dark:text-slate-300 font-medium">
                          {h.responsableEntrega}
                        </td>
                        <td className="py-2.5 px-3.5 text-center font-mono">
                          {h.itemsCount}
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-semibold text-slate-900 dark:text-white">
                          {formatPrice(h.montoTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 6: AUDITORÍA DE CORREOS AUTOMÁTICOS (Nota Pág. 2) */}
        {/* ============================================================== */}
        {activeTab === 'correos' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Registro y Auditoría de Correos Electrónicos Automáticos
              </h3>
              <p className="text-xs text-slate-500">
                Requerimiento Oficial: Envío automático de notificaciones al cliente y al sector comercial con registro en tabla relacional.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3.5">ID Log</th>
                      <th className="py-2.5 px-3.5">Fecha y Hora</th>
                      <th className="py-2.5 px-3.5">Tipo</th>
                      <th className="py-2.5 px-3.5">Destinatario</th>
                      <th className="py-2.5 px-3.5">Asunto</th>
                      <th className="py-2.5 px-3.5 text-center">Estado</th>
                      <th className="py-2.5 px-3.5 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {emails.map((eml) => (
                      <tr key={eml.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3.5 font-mono text-slate-500">
                          {eml.id}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-500 whitespace-nowrap">
                          {eml.fechaHora}
                        </td>
                        <td className="py-2.5 px-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                            eml.tipo === 'cliente'
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800'
                              : 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                          }`}>
                            {eml.tipo === 'cliente' ? 'Cliente' : 'Ventas'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {eml.destinatario}
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                          {eml.asunto}
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
                            ✓ {eml.estado}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-center">
                          <button
                            onClick={() => setSelectedEmail(eml)}
                            className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium transition cursor-pointer"
                          >
                            Ver Correo
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal de Lectura de Correo */}
            {selectedEmail && (
              <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg max-w-xl w-full p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {selectedEmail.id} · REGISTRO DE AUDITORÍA
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {selectedEmail.asunto}
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="w-7 h-7 rounded-md border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-0.5 text-xs text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div><strong>Para:</strong> {selectedEmail.destinatario}</div>
                    <div><strong>Fecha:</strong> {selectedEmail.fechaHora}</div>
                    <div><strong>Canal:</strong> Despacho Automático del Sistema</div>
                  </div>

                  <div className="p-3.5 rounded-md bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                    {selectedEmail.cuerpo}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="px-3.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
