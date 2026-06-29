'use client';

import React, { useState, useMemo } from 'react';
import { useErp } from '@/hooks/use-erp';
import { 
  Cpu, 
  Play, 
  Plus, 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Filter, 
  ShoppingCart,
  X,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { getTodayFormatted } from '@/lib/working-days';

export default function RequirementsView() {
  const { 
    mrpRequirements, 
    products, 
    stock, 
    contacts, 
    runMrpCalculation, 
    savePurchaseOrder 
  } = useErp();

  const [filterStatus, setFilterStatus] = useState('Todos');
  const [selectedReqId, setSelectedReqId] = useState<number | null>(null);

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
  
  // Purchase Order Generation State
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<number>(0);
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');

  // Dropdowns for modal
  const suppliers = useMemo(() => contacts.filter(c => c.tipo === 'Fornecedor'), [contacts]);

  // Current requirement detail when generating purchase order
  const activeReq = useMemo(() => {
    return mrpRequirements.find(r => r.id === selectedReqId);
  }, [mrpRequirements, selectedReqId]);

  // Auto-fill homologous supplier based on product code
  const autoHomologousSupplier = (prodCode: string): number => {
    // Gerdau (ID 3) for chapas/perfil
    if (prodCode.includes('CHA') || prodCode.includes('PER')) return 3;
    // Siemens (ID 4) for electrical
    if (prodCode.includes('DIS') || prodCode.includes('CAB') || prodCode.includes('PNL')) return 4;
    // Fastenal (ID 5) for fasteners
    if (prodCode.includes('PAR') || prodCode.includes('PIN')) return 5;
    return suppliers.length > 0 ? suppliers[0].id : 0;
  };

  const handleOpenPurchaseModal = (reqId: number) => {
    setSelectedReqId(reqId);
    const req = mrpRequirements.find(r => r.id === reqId);
    if (req) {
      const prod = products.find(p => p.id === req.prodId);
      setPurchaseQty(String(req.qtdNecessaria));
      setPurchasePrice(prod ? String(prod.valor) : '0');
      setSelectedFornecedorId(autoHomologousSupplier(prod ? prod.codigo : ''));
    }
    setIsPurchaseModalOpen(true);
  };

  const handleGeneratePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReq || !selectedFornecedorId || !purchaseQty || !purchasePrice) {
      alert('Preencha as informações de suprimento.');
      return;
    }

    const prodId = activeReq.prodId;
    const qty = parseFloat(purchaseQty);
    const price = parseFloat(purchasePrice);

    // Format delivery date (approx lead time business days, say 5 days)
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 7);
    const dStr = String(delivery.getDate()).padStart(2, '0');
    const mStr = String(delivery.getMonth() + 1).padStart(2, '0');
    const yStr = delivery.getFullYear();

    // Create Purchase Order
    savePurchaseOrder({
      fornecedorId: selectedFornecedorId,
      dataEmissao: getTodayFormatted(),
      dataEntrega: `${dStr}/${mStr}/${yStr}`,
      itens: [{ prodId, qtd: qty, valorUnitario: price }],
      valorTotal: qty * price,
      status: 'Aberto'
    });

    // Mark requirement status or recalculate after order creation
    // To keep it simple, we let the user re-run MRP to clear outfulfilled demands
    setIsPurchaseModalOpen(false);
  };

  const filteredRequirements = useMemo(() => {
    return mrpRequirements.filter(r => {
      if (filterStatus === 'Todos') return true;
      return r.status === filterStatus;
    });
  }, [mrpRequirements, filterStatus]);

  const sortedRequirements = useMemo(() => {
    if (!sortField) return filteredRequirements;
    return [...filteredRequirements].sort((a, b) => {
      let valA = a[sortField as keyof typeof a] ?? "";
      let valB = b[sortField as keyof typeof b] ?? "";

      if (sortField === 'codigo') {
        const prodA = products.find(p => p.id === a.prodId);
        const prodB = products.find(p => p.id === b.prodId);
        valA = prodA ? prodA.codigo : "";
        valB = prodB ? prodB.codigo : "";
      }

      if (sortField === 'qtdNecessaria') {
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
  }, [filteredRequirements, sortField, sortDirection, products]);

  return (
    <div className="space-y-6 font-sans animate-fade-in" id="requirements-view">
      
      {/* MRP Explanation Banner */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-1 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Cpu className="w-4 h-4 animate-pulse text-blue-400" />
            <span>Processamento de Carga MRP I (Materials Requirement Planning)</span>
          </div>
          <h3 className="text-sm font-black text-white">Planejamento e Explosão de Necessidades Líquidas</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            O algoritmo cruza os <b>Pedidos de Venda Abertos</b>, explode suas respectivas estruturas de engenharia <b>(BOM)</b> e abate os <b>Saldos de Estoque</b> e <b>Pedidos de Compra em Aberto</b>, indicando precisamente os déficits de suprimento que necessitam de compras urgentes para evitar paradas na linha de montagem.
          </p>
        </div>

        <button
          onClick={runMrpCalculation}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 rounded-lg flex items-center space-x-2 shadow transition-all hover:scale-[1.02] shrink-0"
        >
          <Play className="w-3.5 h-3.5 fill-white text-white" />
          <span>Rodar Cálculo de Necessidades</span>
        </button>
      </div>

      {/* Grid: Stats and list */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Quick summary metrics */}
        <div className="space-y-4">
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider">Diagnóstico de Garga</h4>
            
            <div className="divide-y divide-[#1f293d]">
              <div className="py-2.5 flex justify-between items-center text-xs">
                <span className="text-gray-400">Total Necessidades</span>
                <span className="font-bold text-white font-mono">{mrpRequirements.length}</span>
              </div>
              <div className="py-2.5 flex justify-between items-center text-xs">
                <span className="text-gray-400">Insumos Críticos</span>
                <span className="font-bold text-rose-400 font-mono">
                  {mrpRequirements.filter(r => r.status === 'Pendente').length}
                </span>
              </div>
              <div className="py-2.5 flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold text-amber-400 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sugerido Compra</span>
                </span>
                <span className="font-bold text-amber-400 font-mono">
                  {mrpRequirements.filter(r => r.qtdNecessaria > 0).length} itens
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-500/5 rounded-xl border border-blue-500/10 text-[11px] leading-relaxed text-gray-400">
            <h5 className="font-bold text-white mb-1">Como suprir o estoque?</h5>
            Clique no botão <b>Suprir / Comprar</b> em qualquer linha de déficit crítico. O ERP carregará os dados do fornecedor homologado para envio do pedido de compra.
          </div>
        </div>

        {/* List of calculated requirements */}
        <div className="lg:col-span-3 bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
          <div className="p-4 bg-[#0f1523] border-b border-[#1f293d] flex justify-between items-center">
            <span className="font-bold text-white text-xs">Necessidades Líquidas de Suprimentos</span>
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-[#0b0f17] border border-[#1f293d] rounded p-1 text-[10px] text-gray-300"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Pendente">Apenas Pendentes</option>
                <option value="Comprado">Saldados / Emitidos</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0f1523]/50 border-b border-[#1f293d] text-gray-400 text-[10px] uppercase font-black tracking-wider">
                  <th 
                    className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort('codigo')}
                  >
                    <div className="flex items-center space-x-1 select-none">
                      <span>Insumo SKU</span>
                      {sortField === 'codigo' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors text-center"
                    onClick={() => toggleSort('qtdNecessaria')}
                  >
                    <div className="flex items-center justify-center space-x-1 select-none">
                      <span>Quantidade Necessária</span>
                      {sortField === 'qtdNecessaria' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors text-center"
                    onClick={() => toggleSort('dataNecessidade')}
                  >
                    <div className="flex items-center justify-center space-x-1 select-none">
                      <span>Data Limite Fábrica</span>
                      {sortField === 'dataNecessidade' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => toggleSort('origem')}
                  >
                    <div className="flex items-center space-x-1 select-none">
                      <span>Demanda Origem</span>
                      {sortField === 'origem' ? (
                        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                      )}
                    </div>
                  </th>
                  <th className="py-2.5 px-4 text-center select-none">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]/50 text-gray-300">
                {sortedRequirements.map((r) => {
                  const prod = products.find(p => p.id === r.prodId);
                  const isComp = r.status === 'Comprado';

                  return (
                    <tr key={r.id} className="hover:bg-gray-800/20 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-white text-[10px] block">{prod ? prod.codigo : 'SKU'}</span>
                        <span className="text-gray-400 text-[11px] block truncate max-w-xs">{prod ? prod.descricao : 'Material'}</span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-black text-rose-400">
                        {r.qtdNecessaria} {prod ? prod.unidade : 'UN'}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                        {r.dataNecessidade}
                      </td>
                      <td className="py-3 px-4 text-gray-400 max-w-xs truncate" title={r.origem}>
                        {r.origem}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!isComp ? (
                          <button
                            onClick={() => handleOpenPurchaseModal(r.id)}
                            className="bg-[#1f293d] hover:bg-blue-600 border border-[#243049] hover:border-blue-500 text-white font-bold text-[10px] px-2.5 py-1.5 rounded flex items-center space-x-1 mx-auto transition-colors"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Suprir / Comprar</span>
                          </button>
                        ) : (
                          <span className="text-emerald-400 font-bold flex items-center justify-center space-x-1">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Atendido</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredRequirements.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500 font-semibold leading-relaxed">
                      Nenhuma necessidade calculada.<br />
                      <span className="text-[10px] font-normal text-gray-600">Aperte em &quot;Rodar Cálculo de Necessidades&quot; para atualizar.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Auto-Purchase Order generator Modal */}
      {isPurchaseModalOpen && activeReq && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsPurchaseModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-xl overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d]">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-blue-400" />
                <span>Geração de Pedido de Compra Automatizado</span>
              </h3>
              <button onClick={() => setIsPurchaseModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleGeneratePurchase} className="p-5 space-y-4 text-xs">
              
              <div className="p-3.5 bg-blue-500/5 rounded-xl border border-blue-500/10 space-y-1">
                <span className="text-gray-500 uppercase font-black text-[9px]">Análise do Déficit</span>
                <p className="text-gray-100 font-semibold">
                  Produto: <b className="text-white font-bold font-mono">[{products.find(p => p.id === activeReq.prodId)?.codigo}]</b> {products.find(p => p.id === activeReq.prodId)?.descricao}
                </p>
                <p className="text-rose-400 font-medium">
                  Quantidade sugerida em déficit: {activeReq.qtdNecessaria} {products.find(p => p.id === activeReq.prodId)?.unidade}
                </p>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Fornecedor Homologado / Sugerido</label>
                <select
                  value={selectedFornecedorId}
                  onChange={(e) => setSelectedFornecedorId(Number(e.target.value))}
                  className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.nome} ({s.cidade} - {s.uf})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Qtd. a Comprar</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={purchaseQty}
                    onChange={(e) => setPurchaseQty(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Preço Acordado Unitário (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-gray-800/30 rounded-lg flex justify-between items-center">
                <span className="font-bold text-gray-400">Total do Pedido:</span>
                <span className="font-mono text-base font-black text-emerald-400">
                  {((parseFloat(purchaseQty) || 0) * (parseFloat(purchasePrice) || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg"
                >
                  Transmitir Compra
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
