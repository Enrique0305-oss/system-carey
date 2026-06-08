import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RecipeModal({ isOpen, onClose, product }: { isOpen: boolean, onClose: () => void, product: any }) {
  const [loading, setLoading] = useState(true);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  
  const [recipeItems, setRecipeItems] = useState<{inputId: string, quantity: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !product) return;
    
    // Fetch all products to use as inputs
    fetch('http://localhost:4000/api/products?status=ACTIVO')
      .then(res => res.json())
      .then(data => {
        // Filter out the product itself to prevent infinite loops (cannot make Salchicha out of Salchicha)
        setAllProducts(data.filter((p: any) => p.id !== product.id));
      });

    // Fetch existing recipe
    fetch(`http://localhost:4000/api/products/${product.id}/recipe`)
      .then(res => res.json())
      .then(data => {
        if (data && data.items) {
          setRecipeItems(data.items.map((item: any) => ({
            inputId: item.inputId,
            quantity: item.quantity.toString()
          })));
        } else {
          setRecipeItems([]);
        }
      })
      .catch(err => console.error("Error fetching recipe:", err))
      .finally(() => setLoading(false));

  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleSave = async () => {
    // Validate
    if (recipeItems.some(i => !i.inputId || !i.quantity || Number(i.quantity) <= 0)) {
      toast.error('Por favor completa todos los campos correctamente.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`http://localhost:4000/api/products/${product.id}/recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: recipeItems })
      });
      if (res.ok) {
        toast.success('Receta guardada exitosamente');
        onClose();
      } else {
        const err = await res.json();
        toast.error('Error al guardar: ' + err.error);
      }
    } catch (error) {
      toast.error('Error de red');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Receta Maestra</h2>
            <p className="text-sm text-gray-500 mt-0.5">Para 1 {product.unit} de <strong className="text-purple-600">{product.description}</strong></p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Cargando receta...</div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
                Añade los insumos exactos necesarios para producir <strong>una unidad (1 {product.unit})</strong> de este producto terminado.
              </div>

              <div className="space-y-3">
                {recipeItems.map((item, index) => (
                  <div key={index} className="flex gap-3 items-end bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Insumo</label>
                      <select 
                        value={item.inputId}
                        onChange={e => {
                          const newItems = [...recipeItems];
                          newItems[index].inputId = e.target.value;
                          setRecipeItems(newItems);
                        }}
                        className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                      >
                        <option value="" className="text-gray-900">Selecciona un insumo...</option>
                        {allProducts.map(p => (
                          <option key={p.id} value={p.id} className="text-gray-900">{p.description} ({p.unit})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <label className="block text-[11px] font-semibold text-gray-500 mb-1">Cantidad</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          min="0" step="0.001"
                          value={item.quantity}
                          onChange={e => {
                            const newItems = [...recipeItems];
                            newItems[index].quantity = e.target.value;
                            setRecipeItems(newItems);
                          }}
                          className="w-full border border-gray-300 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                          placeholder="Ej. 0.50"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const newItems = [...recipeItems];
                        newItems.splice(index, 1);
                        setRecipeItems(newItems);
                      }}
                      className="p-2.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setRecipeItems([...recipeItems, { inputId: "", quantity: "" }])}
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 flex items-center justify-center gap-2 font-medium transition-all"
              >
                <Plus size={18} /> Añadir Insumo a la Receta
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving || loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Receta'}
          </button>
        </div>

      </div>
    </div>
  );
}
