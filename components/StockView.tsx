'use client';

import React, { useState, useMemo } from 'react';
import { useErp } from '@/hooks/use-erp';
import { 
  Boxes, 
  Search, 
  Edit, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  X,
  FileCheck,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

export default function StockView() {
  const { stock, products, saveStockLevel } = useErp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');
  const [selectedStockProdId, setSelectedStockProdId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sorting State
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Form Fields for Adjustment
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustMin, setAdjustMin] = useState('');

  const handleOpenAdjustment = (prodId: number, currentQty: number, currentMin: number) => {
    setSelectedStockProdId(prodId);
    setAdjustQty(String(currentQty));
    setAdjustMin(String(currentMin));
    setIsModalOpen(true);
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStockProdId === null || adjustQty === '' || adjustMin === '') {
      alert('Preencha os valores de ajuste de inventário.');
      return;
    }

    saveStockLevel(
      selectedStockProdId,
      parseFloat(adjustQty),
      parseFloat(adjustMin)
    );

    setIsModalOpen(false);
  };

  // Merge product fields into stock rows for easy rendering
  const stockRows = useMemo(() => {
    return stock.map(s => {
      const p = products.find(prod => prod.id === s.prodId);
      const isCritical = s.qtd <= s.minimo && s.minimo > 0;
      return {
        ...s,
        codigo: p ? p.codigo : 'SKU',
        descricao: p ? p.descricao : 'Desconhecido',
        unidade: p ? p.unidade : 'UN',
        tipo: p ? p.tipo : 'Materia-Prima',
        valor: p ? p.valor : 0,
        totalValue: s.qtd * (p ? p.valor : 0),
        status: isCritical ? 'Crítico' : 'Seguro'
      };
    });
  }, [stock, products]);

  const filteredStock = useMemo(() => {
    return stockRows.filter(s => {
      const matchSearch = 
        s.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.descricao.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchType = true;
      if (filterType === 'Alerta') {
        matchType = s.qtd <= s.minimo && s.minimo > 0;
      } else if (filterType === 'Seguro') {
        matchType = s.qtd > s.minimo;
      } else if (filterType !== 'Todos') {
        matchType = s.tipo === filterType;
      }

      return matchSearch && matchType;
    });
  }, [stockRows, searchTerm, filterType]);

  const sortedStock = useMemo(() => {
    if (!sortField) return filteredStock;
    return [...filteredStock].sort((a, b) => {
      let valA = a[sortField as keyof typeof a] ?? "";
      let valB = b[sortField as keyof typeof b] ?? "";

      if (sortField === 'qtd' || sortField === 'minimo' || sortField === 'valor' || sortField === 'totalValue') {
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredStock, sortField, sortDirection]);

  const totalStockValuation = useMemo(() => {
    return filteredStock.reduce((acc, s) => acc + s.totalValue, 0);
  }, [filteredStock]);

  return (
    <div className="space-y-6 font-sans animate-fade-in" id="stock-view">
      
      {/* Top filter and valuations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        
        {/* Search */}
        <div className="bg-[#111827] border border-[#1f293d] p-4 rounded-xl flex items-center space-x-3 md:col-span-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código SKU ou descrição de almoxarifado..."
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none"
          >
            <option value="Todos">Todo Almoxarifado</option>
            <option value="Alerta">Abaixo do Estoque Mínimo</option>
            <option value="Seguro">Saldos Seguros</option>
            <option value="Acabado">Produto Acabado (PA)</option>
            <option value="Semi-acabado">Semi-Acabado (SA)</option>
            <option value="Materia-Prima">Matéria-Prima (MP)</option>
          </select>
        </div>

        {/* Valuation metric */}
        <div className="bg-[#111827] border border-[#1f293d] p-4 rounded-xl flex flex-col justify-center">
          <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">Valoração Almoxarifado Selecionado</span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-0.5">
            {totalStockValuation.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        </div>

      </div>

      {/* Stock Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0f1523] border-b border-[#1f293d] text-gray-400 text-[10px] uppercase font-black tracking-wider">
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('tipo')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Classificação</span>
                    {sortField === 'tipo' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('codigo')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Código (SKU)</span>
                    {sortField === 'codigo' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('descricao')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Nome do Item / Insumo</span>
                    {sortField === 'descricao' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-center"
                  onClick={() => toggleSort('qtd')}
                >
                  <div className="flex items-center justify-center space-x-1 select-none">
                    <span>Físico Atual</span>
                    {sortField === 'qtd' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-center"
                  onClick={() => toggleSort('minimo')}
                >
                  <div className="flex items-center justify-center space-x-1 select-none">
                    <span>Mínimo Segurança</span>
                    {sortField === 'minimo' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-center"
                  onClick={() => toggleSort('status')}
                >
                  <div className="flex items-center justify-center space-x-1 select-none">
                    <span>Nível / Status</span>
                    {sortField === 'status' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
                  onClick={() => toggleSort('valor')}
                >
                  <div className="flex items-center justify-end space-x-1 select-none">
                    <span>Custo Unitário</span>
                    {sortField === 'valor' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
                  onClick={() => toggleSort('totalValue')}
                >
                  <div className="flex items-center justify-end space-x-1 select-none">
                    <span>Valor em Estoque</span>
                    {sortField === 'totalValue' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Ajustar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50 text-gray-300">
              {sortedStock.map((s) => {
                const isCritical = s.qtd <= s.minimo && s.minimo > 0;
                
                let badgeClass = '';
                if (s.tipo === 'Acabado') badgeClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/10';
                else if (s.tipo === 'Semi-acabado') badgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/10';
                else if (s.tipo === 'Materia-Prima') badgeClass = 'bg-purple-500/10 text-purple-400 border border-purple-500/10';
                else badgeClass = 'bg-gray-500/10 text-gray-400 border border-gray-500/10';

                return (
                  <tr key={s.prodId} className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${badgeClass}`}>
                        {s.tipo}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-white text-[11px]">
                      {s.codigo}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-100 max-w-xs truncate" title={s.descricao}>
                      {s.descricao}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-white text-xs">
                      {s.qtd} {s.unidade}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-gray-400">
                      {s.minimo} {s.unidade}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isCritical ? (
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 tracking-wider flex items-center justify-center space-x-1 w-max mx-auto">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>Crítico</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider flex items-center justify-center space-x-1 w-max mx-auto">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>Seguro</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-gray-400">
                      {s.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-400">
                      {s.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenAdjustment(s.prodId, s.qtd, s.minimo)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                        title="Inventariar / Ajustar"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredStock.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500 font-medium">
                    Nenhum saldo encontrado no estoque físico.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Inventory Modal */}
      {isModalOpen && selectedStockProdId !== null && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up">
            
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d]">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-blue-400" />
                <span>Inventariar e Ajustar Estoque</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-5 space-y-4 text-xs">
              
              <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10 space-y-0.5">
                <span className="text-gray-500 uppercase font-black text-[9px]">Item de Referência</span>
                <span className="font-bold text-white block">
                  [{products.find(p => p.id === selectedStockProdId)?.codigo}] {products.find(p => p.id === selectedStockProdId)?.descricao}
                </span>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Quantidade Física Atual em Prateleira</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Estoque Mínimo (Ponto de Pedido MRP)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={adjustMin}
                  onChange={(e) => setAdjustMin(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg flex items-center space-x-1"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Confirmar Contagem</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
