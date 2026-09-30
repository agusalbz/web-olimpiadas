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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-[#1E293B] dark:text-[#E2E8F0] pb-24 transition-colors duration-300">
      
      {/* Barra Superior de Control de Ventas */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] border-b border-[#334155] text-white px-4 sm:px-8 py-5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0EA5E9] to-[#F97316] flex items-center justify-center text-white shadow-lg font-bold">
              👔
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold font-fraunces text-white">
                  Panel de Gestión y Ventas
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#0EA5E9]/20 text-[#38BDF8] border border-[#0EA5E9]/40">
                  Rol: Jefe de Ventas
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Operador: <strong>Carlos Méndez</strong> · Sistema Administrativo de Gestión Turística
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-600 flex items-center gap-1.5 transition cursor-pointer"
              title="Refrescar datos de la base de datos local"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Actualizar Datos</span>
            </button>

            <button
              onClick={onBackToClient}
              className="px-4 py-2 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-bold shadow-md shadow-sky-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <span>Ver Sitio como Pasajero</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Métricas Principales (KPIs) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Pedidos Pendientes
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-fraunces text-amber-500">
                {pendingOrders.length}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500">
                Por Entregar
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Pedidos Entregados
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-fraunces text-emerald-500">
                {deliveredOrders.length}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500">
                Despachados
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Productos en Catálogo
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-fraunces text-[#0EA5E9]">
                {products.length}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/10 text-[#0EA5E9]">
                Activos
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Facturación Cobrada
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-xl font-bold font-fraunces text-[#F97316]">
                {formatPrice(totalBilledUSD)}
              </span>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-sm col-span-2 lg:col-span-1">
            <span className="text-[11px] font-semibold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
              Correos Auditados
            </span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold font-fraunces text-purple-500">
                {emails.length}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">
                Log Automático
              </span>
            </div>
          </div>
        </div>

        {/* Selector de Pestañas de Gestión (Punto 1.4 del PDF) */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/10 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('pendientes')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'pendientes'
                ? 'bg-[#0EA5E9] text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <span>⏳ 1.4.3. Pedidos Pendientes ({pendingOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('cargar_producto')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'cargar_producto'
                ? 'bg-[#0EA5E9] text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <span>➕ 1.4.1. Cargar Producto</span>
          </button>

          <button
            onClick={() => setActiveTab('productos')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'productos'
                ? 'bg-[#0EA5E9] text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <span>📦 1.4.2. Lista de Productos ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('facturacion')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'facturacion'
                ? 'bg-[#0EA5E9] text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <span>📊 1.4.5. Estado de Cuenta / Facturación</span>
          </button>

          <button
            onClick={() => setActiveTab('historico')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'historico'
                ? 'bg-[#0EA5E9] text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <span>📁 2.4. Tabla Histórica ({history.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('correos')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'correos'
                ? 'bg-[#F97316] text-white shadow-md shadow-orange-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800'
            }`}
          >
            <span>📧 Auditoría de Correos Automáticos</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* PESTAÑA 1: PEDIDOS PENDIENTES & ENTREGA (1.4.3 y 1.4.4) */}
        {/* ============================================================== */}
        {activeTab === 'pendientes' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-fraunces text-[#1E293B] dark:text-white">
                  Bandeja de Pedidos Pendientes de Entrega
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Requerimientos 1.4.3 (Ver pendientes), 1.4.4 (Realizar entrega) y 1.4.6 (Anular pedido).
                </p>
              </div>
            </div>

            {pendingOrders.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white/70 dark:bg-slate-800/70 border border-slate-200 dark:border-white/10 space-y-3">
                <span className="text-4xl">🎉</span>
                <h4 className="text-base font-bold text-[#1E293B] dark:text-white">
                  ¡No hay pedidos pendientes de entrega!
                </h4>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-md mx-auto">
                  Todas las compras realizadas por los clientes han sido despachadas a la tabla histórica o anuladas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {pendingOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-6 rounded-3xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-md space-y-4 hover:border-[#0EA5E9]/50 transition"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/5 pb-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/30">
                            {ord.id}
                          </span>
                          <span className="text-xs font-mono text-slate-400">
                            Factura: {ord.nroFactura}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-[#1E293B] dark:text-white">
                          Cliente: {ord.clienteNombre} ({ord.clienteEmail})
                        </h4>
                        <span className="text-xs text-slate-500">
                          Fecha de Compra: {new Date(ord.fecha).toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div className="text-right space-y-1">
                        <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Monto Total:</span>
                        <div className="text-xl font-bold font-fraunces text-[#F97316]">
                          {formatPrice(ord.total)}
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Método: {ord.metodoPago.toUpperCase()} ({ord.cuotas} cuotas)
                        </span>
                      </div>
                    </div>

                    {/* Detalle de Artículos del Pedido (2.2) */}
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] block mb-2">
                        Artículos incluidos en el pedido:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ord.items.map((it, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 text-xs flex justify-between items-center"
                          >
                            <div>
                              <span className="font-bold text-[#0EA5E9] font-mono">[{it.codigoProducto}]</span>{' '}
                              <span className="font-medium">{it.descripcion}</span>
                              <div className="text-[10px] text-slate-400">
                                Cantidad / Pasajeros: {it.cantidad} · Unitario: {formatPrice(it.precioUnitario)}
                              </div>
                            </div>
                            <span className="font-bold text-[#1E293B] dark:text-white">
                              {formatPrice(it.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {ord.notas && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400">
                        <strong>Nota del pasajero:</strong> {ord.notas}
                      </div>
                    )}

                    {/* Botones de Acción: Entrega (1.4.4) y Anulación (1.4.6) */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                      <button
                        onClick={() => handleCancelOrder(ord.id)}
                        className="px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>1.4.6. Anular Pedido</span>
                      </button>

                      <button
                        onClick={() => handleDeliver(ord.id)}
                        className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2 cursor-pointer active:scale-98"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>1.4.4. Realizar Entrega del Pedido</span>
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
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold font-fraunces text-[#1E293B] dark:text-white">
                Carga y Alta de Nuevos Productos Turísticos
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Requerimiento 1.4.1: Cargar productos (código, descripción, precio unitario).
              </p>
            </div>

            {formSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center gap-3 animate-fadeIn">
                <span className="text-xl">✅</span>
                <span>{formSuccess}</span>
              </div>
            )}

            <form
              onSubmit={handleSaveProduct}
              className="p-8 rounded-3xl bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-white/10 shadow-xl space-y-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    Código del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    placeholder="Ej. AER-205, EST-301, PAQ-10"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm font-mono focus:border-[#0EA5E9] focus:outline-hidden"
                  />
                  <span className="text-[10px] text-slate-400">Identificador único en inventario.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    Categoría del Servicio *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ProductCategory)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm font-semibold focus:border-[#0EA5E9] focus:outline-hidden cursor-pointer"
                  >
                    <option value="paquete">🌴 Paquete Integral</option>
                    <option value="aereo">✈️ Pasaje Aéreo</option>
                    <option value="estadia">🏨 Estadía / Hotel</option>
                    <option value="auto">🚗 Alquiler de Auto</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                  Nombre / Título Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej. Madrid Cultural & Museo del Prado"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm focus:border-[#0EA5E9] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                  Descripción Detallada *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Especifica los servicios incluidos, itinerario básico, características del vehículo o amenities del hotel..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm focus:border-[#0EA5E9] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    Precio Unitario (USD) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm font-bold text-[#F97316] focus:border-[#0EA5E9] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    Cupos / Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newStock}
                    onChange={(e) => setNewStock(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm focus:border-[#0EA5E9] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
                    Duración (Días / Noches)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={newNights}
                    onChange={(e) => setNewNights(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm focus:border-[#0EA5E9] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-8 py-3.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-bold text-sm shadow-lg shadow-sky-500/25 transition active:scale-98 cursor-pointer flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Guardar Producto en Catálogo</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 3: LISTA DE PRODUCTOS (1.4.2) */}
        {/* ============================================================== */}
        {activeTab === 'productos' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-fraunces text-[#1E293B] dark:text-white">
                  Inventario General de Productos
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Requerimiento 1.4.2: Consultar la lista de productos.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Buscar por código o nombre..."
                  value={searchProduct}
                  onChange={(e) => setSearchProduct(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs w-56 focus:outline-hidden focus:border-[#0EA5E9]"
                />

                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs font-semibold focus:outline-hidden focus:border-[#0EA5E9] cursor-pointer"
                >
                  <option value="todos">Todas las categorías</option>
                  <option value="paquete">Paquetes</option>
                  <option value="aereo">Aéreos</option>
                  <option value="estadia">Estadías</option>
                  <option value="auto">Autos</option>
                </select>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 text-[#64748B] dark:text-[#94A3B8] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Código</th>
                      <th className="py-3.5 px-4">Categoría</th>
                      <th className="py-3.5 px-4">Descripción del Producto</th>
                      <th className="py-3.5 px-4 text-center">Cupos</th>
                      <th className="py-3.5 px-4 text-right">Precio Unitario</th>
                      <th className="py-3.5 px-4 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {filteredProducts.map((p) => (
                      <tr key={p.codigo} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0EA5E9]">
                          {p.codigo}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/60 font-medium capitalize">
                            {p.categoria}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#1E293B] dark:text-white">{p.nombre}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{p.descripcion}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                            p.stock > 5 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {p.stock} disp.
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#F97316]">
                          {formatPrice(p.precioUnitario)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Seguro que deseas eliminar el producto [${p.codigo}] del catálogo?`)) {
                                DbStorageService.deleteProduct(p.codigo);
                                refreshData();
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition cursor-pointer"
                            title="Eliminar producto"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold font-fraunces text-[#1E293B] dark:text-white">
                  Estado de Cuenta: Facturas a Cobrar y Cobradas
                </h3>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Requerimiento 1.4.5: Ver el estado de cuenta (facturas a cobrar ordenadas por fecha y por cliente).
                </p>
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Filtrar por cliente o factura..."
                  value={searchClientInvoice}
                  onChange={(e) => setSearchClientInvoice(e.target.value)}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-xs w-64 focus:outline-hidden focus:border-[#0EA5E9]"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 text-[#64748B] dark:text-[#94A3B8] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">N° Factura</th>
                      <th className="py-3.5 px-4">Fecha Emisión</th>
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">Pedido Asociado</th>
                      <th className="py-3.5 px-4">Medio de Pago</th>
                      <th className="py-3.5 px-4 text-center">Estado Cobro</th>
                      <th className="py-3.5 px-4 text-right">Monto Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {sortedAndFilteredInvoices.map((inv) => (
                      <tr key={inv.nroFactura} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0EA5E9]">
                          {inv.nroFactura}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(inv.fecha).toLocaleDateString('es-AR')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#1E293B] dark:text-white">
                          {inv.clienteNombre}
                          <div className="text-[10px] text-slate-400 font-normal">{inv.clienteEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {inv.idPedido}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {inv.metodoPago}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            inv.estadoCobro === 'cobrado'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {inv.estadoCobro === 'cobrado' ? '✓ Cobrada' : '⏳ A Cobrar'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#F97316]">
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
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold font-fraunces text-[#1E293B] dark:text-white">
                Tabla Histórica de Pedidos Entregados y Despachados
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Requerimiento Servidor 2.4: Eliminar los pedidos pendientes una vez entregados y pasarlos a una tabla histórica.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 text-[#64748B] dark:text-[#94A3B8] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">ID Histórico</th>
                      <th className="py-3.5 px-4">Pedido Original</th>
                      <th className="py-3.5 px-4">Cliente</th>
                      <th className="py-3.5 px-4">Fecha de Entrega</th>
                      <th className="py-3.5 px-4">Responsable de Entrega</th>
                      <th className="py-3.5 px-4 text-center">Ítems</th>
                      <th className="py-3.5 px-4 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                          {h.id}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0EA5E9]">
                          {h.idPedido}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#1E293B] dark:text-white">
                          {h.clienteNombre}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(h.fechaEntrega).toLocaleString('es-AR')}
                        </td>
                        <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">
                          {h.responsableEntrega}
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold">
                          {h.itemsCount}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#F97316]">
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
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h3 className="text-lg font-bold font-fraunces text-[#1E293B] dark:text-white">
                Registro y Auditoría de Correos Electrónicos Automáticos
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Requerimiento Oficial: <em>"enviar correos electrónicos automáticos tanto al cliente como al sector correspondiente de la empresa (este correo debe registrarse en una tabla de la aplicación)."</em>
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-white/10 text-[#64748B] dark:text-[#94A3B8] font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">ID Correo</th>
                      <th className="py-3.5 px-4">Fecha y Hora</th>
                      <th className="py-3.5 px-4">Tipo</th>
                      <th className="py-3.5 px-4">Destinatario</th>
                      <th className="py-3.5 px-4">Asunto</th>
                      <th className="py-3.5 px-4 text-center">Estado</th>
                      <th className="py-3.5 px-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {emails.map((eml) => (
                      <tr key={eml.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-[#0EA5E9]">
                          {eml.id}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {eml.fechaHora}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            eml.tipo === 'cliente'
                              ? 'bg-sky-500/10 text-[#0EA5E9]'
                              : 'bg-purple-500/10 text-purple-500'
                          }`}>
                            {eml.tipo === 'cliente' ? '👤 Al Cliente' : '🏢 Sector Ventas'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {eml.destinatario}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#1E293B] dark:text-white max-w-xs truncate">
                          {eml.asunto}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold text-[10px]">
                            ✓ {eml.estado}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedEmail(eml)}
                            className="px-3 py-1 rounded-lg bg-[#0EA5E9]/10 text-[#0EA5E9] hover:bg-[#0EA5E9] hover:text-white font-bold transition cursor-pointer"
                          >
                            Ver Mensaje
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
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-white/10 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] font-mono text-[#0EA5E9] font-bold">
                        {selectedEmail.id} · REGISTRO DE AUDITORÍA
                      </span>
                      <h4 className="text-base font-bold text-[#1E293B] dark:text-white mt-1">
                        {selectedEmail.asunto}
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="w-8 h-8 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 border-b border-slate-200 dark:border-white/10 pb-3">
                    <div><strong>Para:</strong> {selectedEmail.destinatario}</div>
                    <div><strong>Fecha:</strong> {selectedEmail.fechaHora}</div>
                    <div><strong>Canal:</strong> Disparo Automático Servidor (SMTP Simulado)</div>
                  </div>

                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 font-mono text-xs text-[#1E293B] dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                    {selectedEmail.cuerpo}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setSelectedEmail(null)}
                      className="px-5 py-2.5 rounded-xl bg-[#0EA5E9] text-white font-bold text-xs shadow-md"
                    >
                      Cerrar Vista
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
