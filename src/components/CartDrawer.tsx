import React from 'react';
import type { ProductItem } from '../services/dbStorage';

export interface CartItem {
  producto: ProductItem;
  cantidad: number;
  subtotal: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (codigo: string, delta: number) => void;
  onRemoveItem: (codigo: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  currency: 'USD' | 'EUR' | 'ARS' | 'MXN';
  formatPrice: (amountUSD: number) => string;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  formatPrice
}) => {
  if (!isOpen) return null;

  const totalUSD = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItemsCount = items.reduce((sum, item) => sum + item.cantidad, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
      {/* Backdrop con Glassmorphism */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#F8FAFC] dark:bg-[#0F172A] border-l border-slate-200 dark:border-white/10 shadow-2xl flex flex-col justify-between text-[#1E293B] dark:text-[#E2E8F0] transform transition-transform duration-300 ease-in-out">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0EA5E9] to-[#0284C7] flex items-center justify-center text-white shadow-md shadow-sky-500/20">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold font-fraunces text-[#1E293B] dark:text-white">
                  Carrito de Compras
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  {totalItemsCount} {totalItemsCount === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Cerrar carrito"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body: Lista de Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400">
                  <svg className="w-10 h-10 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#1E293B] dark:text-white">
                    Tu carrito está vacío
                  </h3>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] max-w-xs">
                    Explora nuestros paquetes, vuelos, estadías o autos y arma tu itinerario ideal.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-xs font-bold transition shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.producto.codigo}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-800/80 p-4 shadow-sm relative group hover:border-[#0EA5E9]/50 transition"
                >
                  <div className="flex gap-3">
                    {item.producto.imagen ? (
                      <img
                        src={item.producto.imagen}
                        alt={item.producto.nombre}
                        className="w-18 h-18 rounded-xl object-cover border border-slate-200 dark:border-white/10"
                      />
                    ) : (
                      <div className="w-18 h-18 rounded-xl bg-[#0EA5E9]/10 text-[#0EA5E9] border border-[#0EA5E9]/30 flex items-center justify-center font-bold text-xs">
                        {item.producto.categoria.toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#0EA5E9]/10 text-[#0EA5E9] font-bold">
                          {item.producto.codigo}
                        </span>
                        <button
                          onClick={() => onRemoveItem(item.producto.codigo)}
                          className="text-slate-400 hover:text-red-500 transition p-1 cursor-pointer"
                          title="Eliminar del carrito"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <h4 className="text-xs font-bold text-[#1E293B] dark:text-white truncate mt-1">
                        {item.producto.nombre}
                      </h4>

                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        Unitario: {formatPrice(item.producto.precioUnitario)}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-white/5">
                        {/* Controles de Cantidad */}
                        <div className="flex items-center border border-slate-200 dark:border-white/10 rounded-lg bg-slate-50 dark:bg-slate-900/60 overflow-hidden">
                          <button
                            onClick={() => onUpdateQuantity(item.producto.codigo, -1)}
                            className="px-2 py-1 text-xs text-slate-500 hover:text-[#0EA5E9] transition font-bold"
                            title="Disminuir"
                          >
                            -
                          </button>
                          <span className="px-3 py-1 text-xs font-bold text-[#1E293B] dark:text-white">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.producto.codigo, 1)}
                            className="px-2 py-1 text-xs text-slate-500 hover:text-[#0EA5E9] transition font-bold"
                            title="Aumentar"
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#F97316]">
                            {formatPrice(item.subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer del Carrito */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md space-y-4">
              <div className="space-y-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItemsCount} ítems):</span>
                  <span className="font-semibold text-[#1E293B] dark:text-white">{formatPrice(totalUSD)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasas aeroportuarias e impuestos:</span>
                  <span className="text-emerald-500 font-semibold">Incluidos (0% extra)</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#1E293B] dark:text-white pt-2 border-t border-slate-200 dark:border-white/10">
                  <span>Total Final:</span>
                  <span className="text-[#F97316] font-fraunces text-xl">{formatPrice(totalUSD)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={onClearCart}
                  className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-red-500 hover:border-red-300 dark:hover:border-red-900 transition text-xs font-bold"
                  title="Vaciar todo el carrito"
                >
                  Vaciar
                </button>

                <button
                  onClick={() => {
                    onCheckout();
                    onClose();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white font-bold text-sm shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                >
                  <span>Proceder al Cobro</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>

              <p className="text-[10px] text-center text-[#64748B] dark:text-[#94A3B8] leading-tight">
                🔒 Tu compra se registrará inicialmente como <strong>Pendiente de Entrega</strong> hasta la confirmación de cupos por el sector de ventas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
