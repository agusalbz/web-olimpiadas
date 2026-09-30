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
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 transition-opacity duration-200"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col justify-between text-slate-900 dark:text-slate-100">
          
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#0284C7] dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/40">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Carrito de Compras
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {totalItemsCount} {totalItemsCount === 1 ? 'servicio seleccionado' : 'servicios seleccionados'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-md border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Cerrar carrito"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body: Lista de Items */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                  <svg className="w-7 h-7 stroke-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    El carrito está vacío
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                    Seleccioná paquetes turísticos o servicios desde el catálogo para agregarlos a tu compra.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="mt-2 px-4 py-2 rounded-md bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold transition cursor-pointer"
                >
                  Explorar Catálogo
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.producto.codigo}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-xs relative"
                >
                  <div className="flex gap-3">
                    {item.producto.imagen ? (
                      <img
                        src={item.producto.imagen}
                        alt={item.producto.nombre}
                        className="w-16 h-16 rounded-md object-cover border border-slate-200 dark:border-slate-800 shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-mono font-bold text-[10px] shrink-0">
                        {item.producto.categoria.toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.producto.codigo}
                        </span>
                        <button
                          onClick={() => onRemoveItem(item.producto.codigo)}
                          className="text-slate-400 hover:text-red-500 transition p-0.5 cursor-pointer"
                          title="Eliminar del carrito"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-1">
                        {item.producto.nombre}
                      </h4>

                      <p className="text-[11px] text-slate-500">
                        Unitario: {formatPrice(item.producto.precioUnitario)}
                      </p>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        {/* Controles de Cantidad */}
                        <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 overflow-hidden">
                          <button
                            onClick={() => onUpdateQuantity(item.producto.codigo, -1)}
                            className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition font-medium"
                            title="Disminuir"
                          >
                            -
                          </button>
                          <span className="px-2.5 py-0.5 text-xs font-semibold text-slate-900 dark:text-white">
                            {item.cantidad}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(item.producto.codigo, 1)}
                            className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition font-medium"
                            title="Aumentar"
                          >
                            +
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
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
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal ({totalItemsCount} ítems):</span>
                  <span className="font-medium text-slate-900 dark:text-white">{formatPrice(totalUSD)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasas aeroportuarias e impuestos:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium">Incluidos</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Total Final:</span>
                  <span className="text-base text-[#0284C7] dark:text-sky-400">{formatPrice(totalUSD)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onClearCart}
                  className="px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-600 hover:border-red-300 dark:hover:border-red-900 transition text-xs font-medium cursor-pointer"
                  title="Vaciar todo el carrito"
                >
                  Vaciar
                </button>

                <button
                  onClick={() => {
                    onCheckout();
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-md bg-[#EA580C] hover:bg-[#C2410C] text-white font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Proceder al Cobro</span>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>

              <p className="text-[11px] text-center text-slate-500 leading-tight">
                🔒 Tu compra se registrará como <strong>Pendiente de Entrega</strong> hasta su validación final.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
