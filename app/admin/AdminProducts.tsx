"use client";

import { useState } from "react";
import { Plus, Edit3, Trash2, Save, X, ShoppingCart, Package } from "lucide-react";
import { createProduct, updateProduct, deleteProduct } from "../actions";

export default function AdminProducts({ products = [] }: { products: any[] }) {
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("0");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append("name", newName);
    formData.append("price", newPrice);
    formData.append("stock", newStock);
    
    await createProduct(formData);
    
    setIsAdding(false);
    setNewName("");
    setNewPrice("");
    setNewStock("0");
    setLoading(false);
  };

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setEditName(product.name);
    setEditPrice(product.price.toString());
    setEditStock(product.stock.toString());
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("id", editingId.toString());
    formData.append("name", editName);
    formData.append("price", editPrice);
    formData.append("stock", editStock);
    
    await updateProduct(formData);
    
    setEditingId(null);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro que deseas eliminar este producto?")) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("id", id.toString());
    await deleteProduct(formData);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-6 lg:p-10 shadow-sm border border-stone-200/60 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="font-bold text-2xl text-stone-900 tracking-tight">Listado de Productos</h3>
          <p className="text-stone-500 text-sm mt-1">Controla tu stock y precios del minibar.</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-[#d97706] text-white px-5 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-amber-600 transition shadow-lg shadow-amber-500/20"
          >
            <Plus size={16} /> Nuevo Producto
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-amber-50 border border-amber-100 rounded-2xl p-6 mb-8 animate-fade-in-up">
          <h4 className="font-bold text-amber-900 mb-4">Añadir Nuevo Producto</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase">Nombre del Producto</label>
              <input type="text" required value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Agua Mineral" className="w-full mt-1 border border-amber-200 bg-white rounded-xl px-4 py-2 text-sm font-bold" />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase">Precio (S/)</label>
              <input type="number" step="0.01" min="0" required value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full mt-1 border border-amber-200 bg-white rounded-xl px-4 py-2 text-sm font-bold" />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-500 uppercase">Stock Inicial</label>
              <input type="number" min="0" required value={newStock} onChange={e => setNewStock(e.target.value)} className="w-full mt-1 border border-amber-200 bg-white rounded-xl px-4 py-2 text-sm font-bold" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button disabled={loading} type="submit" className="bg-stone-900 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-800 transition">Guardar</button>
            <button disabled={loading} type="button" onClick={() => setIsAdding(false)} className="bg-white border border-stone-200 text-stone-600 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-stone-50 transition">Cancelar</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map(product => (
          <div key={product.id} className="border border-stone-200 rounded-2xl p-5 hover:border-amber-300 transition-colors bg-stone-50 group">
            {editingId === product.id ? (
              <form onSubmit={handleSaveEdit} className="space-y-3">
                <input type="text" required value={editName} onChange={e => setEditName(e.target.value)} className="w-full border border-amber-300 rounded-lg px-3 py-1.5 text-sm font-bold" />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">S/</span>
                    <input type="number" step="0.01" min="0" required value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full border border-amber-300 rounded-lg pl-8 pr-2 py-1.5 text-sm font-bold" />
                  </div>
                  <div className="relative w-20">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-[10px] font-bold">Stock</span>
                    <input type="number" min="0" required value={editStock} onChange={e => setEditStock(e.target.value)} className="w-full border border-amber-300 rounded-lg pl-10 pr-2 py-1.5 text-sm font-bold" />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={loading} className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-xs font-bold uppercase hover:bg-amber-600 flex justify-center"><Save size={16} /></button>
                  <button type="button" disabled={loading} onClick={() => setEditingId(null)} className="flex-1 bg-stone-200 text-stone-700 py-2 rounded-lg text-xs font-bold uppercase hover:bg-stone-300 flex justify-center"><X size={16} /></button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-full bg-white border border-stone-200 flex items-center justify-center text-amber-500">
                    <Package size={20} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(product)} className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-amber-600 hover:border-amber-300 transition-colors"><Edit3 size={14} /></button>
                    <button onClick={() => handleDelete(product.id)} className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center text-stone-500 hover:text-red-500 hover:border-red-200 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
                <h4 className="font-bold text-stone-900 leading-tight mb-2 line-clamp-2" title={product.name}>{product.name}</h4>
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-stone-200/60">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Precio</span>
                    <span className="font-black text-amber-600">S/ {product.price.toFixed(2)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-0.5">Stock</span>
                    <span className={`font-black text-lg ${product.stock <= 5 ? 'text-red-500' : 'text-stone-900'}`}>{product.stock}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {products.length === 0 && !isAdding && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-stone-200 rounded-3xl text-stone-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">No hay productos registrados.</p>
          </div>
        )}
      </div>
    </div>
  );
}
