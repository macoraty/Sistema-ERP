"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useErp } from "@/hooks/use-erp";
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  X, 
  Send, 
  Search, 
  Edit, 
  Printer, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Check,
  ShoppingBag,
  ArrowRight,
  FileText
} from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { getTodayFormatted } from "@/lib/working-days";
import { triggerPrint } from "@/lib/print";
import { Product, PurchaseNeed } from "@/lib/types";

// Main PurchaseNeedsView Component
export default function PurchaseNeedsView() {
  const { 
    purchaseNeeds, 
    savePurchaseNeed, 
    deletePurchaseNeed, 
    products, 
    contacts, 
    savePurchaseOrder 
  } = useErp();

  // Primary UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  
  // Need Form State (Registering or Editing)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNeed, setEditingNeed] = useState<PurchaseNeed | null>(null);
  const [viewingNeed, setViewingNeed] = useState<PurchaseNeed | null>(null);
  const [dataCriacao, setDataCriacao] = useState("");
  const [nomeReferencia, setNomeReferencia] = useState("");
  const [cart, setCart] = useState<{ prodId: number; qtd: number }[]>([]);
  
  // Cart Builder row state
  const [selectedProductId, setSelectedProductId] = useState<number>(0);
  const [qtd, setQtd] = useState("");

  // Convert Need to Purchase Order Modal State
  const [generatingOrderNeed, setGeneratingOrderNeed] = useState<PurchaseNeed | null>(null);
  const [fornecedorId, setFornecedorId] = useState<number>(0);
  const [dataEntregaOrder, setDataEntregaOrder] = useState("");
  const [itemPrices, setItemPrices] = useState<Record<number, string>>({}); // mapped prodId -> price string

  // Sorting State
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // List selectors
  const suppliers = useMemo(() => contacts.filter(c => c.tipo === 'Fornecedor'), [contacts]);
  const rawProducts = useMemo(() => products.filter((p) => p.tipo !== "Acabado"), [products]);

  // Transform rawProducts for SearchableSelect
  const productOptions = useMemo(() => {
    return [...rawProducts]
      .sort((a, b) => a.descricao.localeCompare(b.descricao))
      .map(p => ({
      id: p.id,
      label: `[${p.codigo}] - ${p.descricao}`,
      sublabel: `Tipo: ${p.tipo} | Custo: R$ ${(p.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    }));
  }, [rawProducts]);

  // Transform suppliers for SearchableSelect
  const supplierOptions = useMemo(() => {
    return suppliers.map(s => ({
      id: s.id,
      label: s.nome,
      sublabel: s.cnpj ? `CNPJ: ${s.cnpj} | ${s.cidade}-${s.uf}` : `${s.cidade}-${s.uf}`
    }));
  }, [suppliers]);

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Open modal for creating new list
  const handleOpenAddModal = () => {
    setEditingNeed(null);
    setDataCriacao(getTodayFormatted().split('/').reverse().join('-')); // YYYY-MM-DD format
    setCart([]);
    setSelectedProductId(0);
    setQtd("");
    setNomeReferencia("");
    setIsModalOpen(true);
  };

  // Open modal for editing existing list
  const handleOpenEditModal = (need: PurchaseNeed) => {
    setEditingNeed(need);
    
    // Parse need.dataCriacao from "DD/MM/YYYY" to "YYYY-MM-DD"
    let dateVal = "";
    if (need.dataCriacao) {
      const parts = need.dataCriacao.split('/');
      if (parts.length === 3) {
        dateVal = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    setDataCriacao(dateVal);
    setCart(need.itens);
    setSelectedProductId(0);
    setQtd("");
    setNomeReferencia(need.nomeReferencia || "");
    setIsModalOpen(true);
  };

  // Open modal for generating purchase order from need
  const handleOpenOrderGenModal = (need: PurchaseNeed) => {
    setGeneratingOrderNeed(need);
    if (suppliers.length > 0) {
      setFornecedorId(suppliers[0].id);
    }
    
    // Set typical delivery 7 days from now
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 7);
    const y = delivery.getFullYear();
    const m = String(delivery.getMonth() + 1).padStart(2, '0');
    const d = String(delivery.getDate()).padStart(2, '0');
    setDataEntregaOrder(`${y}-${m}-${d}`);

    // Pre-populate prices dictionary
    const prices: Record<number, string> = {};
    need.itens.forEach(item => {
      const p = products.find(prod => prod.id === item.prodId);
      prices[item.prodId] = String(p?.valor || 0);
    });
    setItemPrices(prices);
  };

  const handleAddToCart = () => {
    if (!selectedProductId || !qtd || Number(qtd) <= 0) return;
    
    const quantity = Number(qtd);
    const existingIdx = cart.findIndex(item => item.prodId === selectedProductId);
    if (existingIdx !== -1) {
      const updated = [...cart];
      updated[existingIdx].qtd += quantity;
      setCart(updated);
    } else {
      setCart([...cart, { prodId: selectedProductId, qtd: quantity }]);
    }
    
    setSelectedProductId(0);
    setQtd("");
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handleSaveNeed = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Adicione pelo menos um item à lista.");
      return;
    }

    // Convert date back to DD/MM/YYYY
    const dParts = dataCriacao.split("-");
    const formattedDate = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;

    if (editingNeed) {
      savePurchaseNeed({
        ...editingNeed,
        dataCriacao: formattedDate,
        itens: cart,
        status: editingNeed.status,
        nomeReferencia: nomeReferencia.trim()
      });
    } else {
      savePurchaseNeed({
        dataCriacao: formattedDate,
        itens: cart,
        status: "Pendente",
        nomeReferencia: nomeReferencia.trim()
      });
    }

    setCart([]);
    setEditingNeed(null);
    setNomeReferencia("");
    setIsModalOpen(false);
  };

  // Convert Need list to real Purchase Order
  const handleConfirmPurchaseOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generatingOrderNeed) return;
    if (!fornecedorId) {
      alert("Por favor, selecione um fornecedor.");
      return;
    }

    // Parse delivery date
    const dParts = dataEntregaOrder.split("-");
    const formattedDelivery = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;

    // Map cart items with pricing entered
    const orderItems = generatingOrderNeed.itens.map(item => ({
      prodId: item.prodId,
      qtd: item.qtd,
      valorUnitario: Number(itemPrices[item.prodId] || 0)
    }));

    // Calc total
    const total = orderItems.reduce((acc, curr) => acc + (curr.qtd * curr.valorUnitario), 0);

    // Save Purchase Order
    savePurchaseOrder({
      fornecedorId,
      dataEmissao: getTodayFormatted(),
      dataEntrega: formattedDelivery,
      itens: orderItems,
      valorTotal: total,
      status: 'Aberto'
    });

    // Mark current Purchase Need as "Cotado" (Historical)
    savePurchaseNeed({
      ...generatingOrderNeed,
      status: 'Cotado'
    });

    setGeneratingOrderNeed(null);
  };

  const handlePrintNeed = (need: PurchaseNeed) => {
    setViewingNeed(need);
  };

  const getProductName = (id: number) => {
    return products.find((p) => p.id === id)?.descricao || "Desconhecido";
  };

  // Filter & Sort list of needs
  const filteredNeeds = useMemo(() => {
    let list = [...purchaseNeeds];

    // Status filter
    if (selectedStatus !== "Todos") {
      list = list.filter((n) => n.status === selectedStatus);
    }

    // Search query filter (matches ID, reference name or product code/description inside need)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter((n) => {
        const matchesId = String(n.id).includes(q) || (n.dataCriacao ? n.dataCriacao.toLowerCase().includes(q) : false);
        const matchesName = n.nomeReferencia ? n.nomeReferencia.toLowerCase().includes(q) : false;
        const matchesProducts = n.itens ? n.itens.some(item => {
          const p = products.find(prod => prod.id === item.prodId);
          return p && (p.codigo.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q));
        }) : false;
        return matchesId || matchesName || matchesProducts;
      });
    }

    // Sort
    if (sortField) {
      list.sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        if (sortField === "id") {
          valA = a.id;
          valB = b.id;
        } else if (sortField === "dataCriacao") {
          const dateA = a.dataCriacao || "";
          const dateB = b.dataCriacao || "";
          valA = dateA.split('/').reverse().join('');
          valB = dateB.split('/').reverse().join('');
        } else if (sortField === "status") {
          valA = a.status || "";
          valB = b.status || "";
        } else if (sortField === "itens") {
          valA = a.itens ? a.itens.length : 0;
          valB = b.itens ? b.itens.length : 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
      // Default sort by ID descending
      list.sort((a, b) => b.id - a.id);
    }

    return list;
  }, [purchaseNeeds, selectedStatus, searchTerm, sortField, sortDirection, products]);

  return (
    <div className="space-y-6 font-sans animate-fade-in" id="purchase-needs-view-root">
      
      {/* Title & Top Action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-[#1f293d] p-5 rounded-xl">
        <div>
          <h2 className="text-lg font-black text-white flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            <span>Necessidades de Compra</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Planeje compras de insumos para manufatura e gere pedidos de compras integrados.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-colors shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Lista de Necessidades</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 flex justify-end">
        {/* Search Input bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Pesquisar ID, data ou insumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b0f17] border border-[#1f293d] pl-9 pr-3 py-2 rounded-lg text-white text-xs placeholder:text-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-medium"
          />
        </div>
      </div>

      {/* Main Needs Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0f1523] border-b border-[#1f293d] text-gray-400 font-bold tracking-wider uppercase text-[10px]">
                <th 
                  onClick={() => toggleSort("id")} 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>ID</span>
                    {sortField === 'id' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort("dataCriacao")} 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Data Geração</span>
                    {sortField === 'dataCriacao' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort("itens")} 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Insumos / Componentes</span>
                    {sortField === 'itens' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort("status")} 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-center"
                >
                  <div className="flex items-center justify-center space-x-1 select-none">
                    <span>Status</span>
                    {sortField === 'status' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/40">
              {filteredNeeds.map((need) => {
                const isCotado = need.status === "Cotado";

                let badgeColor = "";
                if (need.status === "Pendente") badgeColor = "bg-blue-500/10 text-blue-400 border border-blue-500/20";
                else if (need.status === "Em Cotação") badgeColor = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                else badgeColor = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";

                return (
                  <tr key={need.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white text-[11px]">
                      <div>#{need.id}</div>
                      {need.nomeReferencia && (
                        <div className="text-[10px] text-gray-400 font-sans font-medium mt-0.5" title={need.nomeReferencia}>
                          {need.nomeReferencia}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-400">
                      {need.dataCriacao}
                    </td>
                    <td className="py-3.5 px-4 max-w-sm">
                      <div className="flex flex-wrap gap-1.5">
                        {need.itens.map((item, idx) => {
                          const prod = products.find(p => p.id === item.prodId);
                          return (
                            <span 
                              key={idx}
                              className="inline-flex items-center px-2 py-0.5 rounded bg-[#0b0f17] border border-[#1f293d] text-[10px] text-gray-300 font-semibold"
                            >
                              <span className="text-blue-400 font-bold mr-1 font-mono">[{prod?.codigo || 'N/A'}]</span>
                              <span className="truncate max-w-[120px] mr-1">{prod?.descricao || 'Desconhecido'}</span>
                              <span className="text-gray-500 font-mono">({item.qtd})</span>
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${badgeColor}`}>
                        {need.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        {/* Imprimir button */}
                        <button
                          onClick={() => handlePrintNeed(need)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                          title="Imprimir Necessidade"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Editar Button (only if not Cotado) */}
                        {!isCotado ? (
                          <button
                            onClick={() => handleOpenEditModal(need)}
                            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                            title="Editar Necessidade"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            disabled
                            className="p-1.5 text-gray-700 cursor-not-allowed rounded"
                            title="Listas já cotadas não podem ser editadas"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Gerar Pedido de Compra (only if not Cotado) */}
                        {!isCotado ? (
                          <button
                            onClick={() => handleOpenOrderGenModal(need)}
                            className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-[10px] font-black px-2 py-1 rounded transition-colors flex items-center space-x-1"
                            title="Gerar Pedido de Compra"
                          >
                            <ArrowRight className="w-3 h-3" />
                            <span>Gerar Pedido</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-gray-500 italic font-medium px-2 py-1">Processado</span>
                        )}

                        {/* Delete button (only if not Cotado) */}
                        {!isCotado && (
                          <button
                            onClick={() => deletePurchaseNeed(need.id)}
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Excluir Necessidade"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredNeeds.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 italic font-semibold">
                    Nenhuma lista de necessidades encontrada correspondente aos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER / EDIT NEED MODAL (Basket Builder Layout) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setIsModalOpen(false); setEditingNeed(null); } }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-3xl overflow-visible shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d] rounded-t-xl">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-blue-400" />
                <span>{editingNeed ? `Editar Lista de Necessidade #${editingNeed.id}` : 'Registrar Nova Lista de Necessidades'}</span>
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingNeed(null); }} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNeed} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-gray-400 font-bold mb-1">Identificação (Nome / Código de Referência)</label>
                  <input
                    type="text"
                    placeholder="Ex: Lote-Junho-2026, Peças Máquina A"
                    value={nomeReferencia}
                    onChange={(e) => setNomeReferencia(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Data de Criação</label>
                  <input
                    type="date"
                    required
                    value={dataCriacao}
                    onChange={(e) => setDataCriacao(e.target.value)}
                    onClick={(e) => { try { (e.target as any).showPicker(); } catch(err) {} }}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Basket Builder Block */}
              <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1f293d] space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center space-x-2 border-b border-[#1f293d]/50 pb-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  <span>Adicionar Insumos à Lista</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-8">
                    <label className="block text-gray-500 text-[9px] uppercase font-black mb-1 tracking-wider">Insumo / SKU / Componente</label>
                    <SearchableSelect
                      options={productOptions}
                      selectedValue={selectedProductId}
                      onChange={(id) => setSelectedProductId(id)}
                      placeholder="Selecione um insumo..."
                      noOptionsMessage="Nenhum insumo ou material encontrado"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-500 text-[9px] uppercase font-black mb-1 tracking-wider">Qtd.</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 50"
                      value={qtd}
                      onChange={(e) => setQtd(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1f293d] p-2 rounded text-white font-mono h-[38px] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={!selectedProductId || !qtd}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white font-bold text-xs py-2 px-1 rounded transition-colors flex items-center justify-center space-x-1"
                      style={{ height: '38px' }}
                      title="Incluir na Lista"
                    >
                      <Plus className="w-4 h-4 flex-shrink-0" />
                      <span>Incluir</span>
                    </button>
                  </div>
                </div>

                {/* Basket List Table */}
                <div className="pt-2">
                  <table className="w-full text-left text-[11px] text-gray-400">
                    <thead>
                      <tr className="border-b border-[#1f293d]/50 text-gray-500 uppercase font-black text-[9px]">
                        <th className="py-1">Código</th>
                        <th className="py-1">Descrição do Item</th>
                        <th className="py-1 text-center">Unidade</th>
                        <th className="py-1 text-right">Qtd</th>
                        <th className="py-1 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]/30 text-gray-300">
                      {cart.map((item, index) => {
                        const p = products.find(prod => prod.id === item.prodId);
                        return (
                          <tr key={index}>
                            <td className="py-2 font-mono text-blue-400 font-bold">[{p ? p.codigo : 'N/A'}]</td>
                            <td className="py-2 font-bold text-white">{p ? p.descricao : 'Item Desconhecido'}</td>
                            <td className="py-2 text-center text-gray-500 uppercase font-mono">{p ? p.unidade : 'UN'}</td>
                            <td className="py-2 text-right font-mono font-bold text-blue-400">{item.qtd}</td>
                            <td className="py-2 text-center">
                              <button
                                type="button"
                                onClick={() => removeFromCart(index)}
                                className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {cart.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-gray-500 italic">
                            Nenhum item inserido na lista ainda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setEditingNeed(null); }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cart.length === 0}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors flex items-center space-x-1"
                >
                  <Send className="w-4 h-4" />
                  <span>{editingNeed ? 'Salvar Alterações' : 'Salvar Lista de Necessidade'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW NEED MODAL */}
      {viewingNeed && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print-force-light"
          onClick={(e) => { if (e.target === e.currentTarget) setViewingNeed(null) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-3xl overflow-visible shadow-2xl animate-scale-up print-section">
            
            {/* Modal Header */}
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d] rounded-t-xl print-hide">
              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Visualizador Auxiliar de Necessidade</span>
                </h3>
                <span className="text-[10px] text-yellow-500/80 mt-1 font-medium">Dica: Se a impressão não abrir, pressione Ctrl+P ou abra em nova aba.</span>
              </div>
              <div className="flex items-center space-x-3">
                <button onClick={() => triggerPrint(`Necessidade_${viewingNeed.id}`)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center space-x-1">
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Necessidade</span>
                </button>
                <button onClick={() => setViewingNeed(null)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="print-hide hidden print:block text-center mb-6 text-black">
                <h1 className="text-xl font-bold uppercase mb-1">MACORATY INDUSTRIAL</h1>
                <p className="text-sm">Solicitação de Compra Interna / Necessidade de Materiais</p>
                <h2 className="text-lg font-bold text-blue-600 mt-4 uppercase">Necessidade de Compra #{viewingNeed.id}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#1f293d]/50 print:border-gray-300">
                <div>
                  <span className="text-gray-500 uppercase font-bold text-[9px] block">Data de Geração</span>
                  <span className="font-medium text-gray-300 font-mono">{viewingNeed.dataCriacao}</span>
                </div>
                <div>
                  <span className="text-gray-500 uppercase font-bold text-[9px] block">Status Atual</span>
                  <span className="font-bold text-blue-400 text-xs block font-mono uppercase">
                    {viewingNeed.status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">Itens Solicitados</h4>
                <div className="bg-[#0b0f17] rounded-lg border border-[#1f293d] overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-[#0f1523] text-gray-500 uppercase font-black text-[9px] border-b border-[#1f293d]">
                        <th className="py-2 px-3">Código / SKU</th>
                        <th className="py-2 px-3">Insumo / Descrição</th>
                        <th className="py-2 px-3 text-center">Unidade</th>
                        <th className="py-2 px-3 text-right">Quantidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]/20 text-gray-300 font-mono">
                      {viewingNeed.itens.map((item, idx) => {
                        const p = products.find(prod => prod.id === item.prodId);
                        return (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-bold text-white">{p ? p.codigo : 'SKU'}</td>
                            <td className="py-2 px-3 font-medium text-white font-sans">{p ? p.descricao : 'Item Desconhecido'}</td>
                            <td className="py-2 px-3 text-center">{p ? p.unidade : 'UN'}</td>
                            <td className="py-2 px-3 text-right text-blue-400 font-bold">{item.qtd}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONVERT NEED TO PURCHASE ORDER MODAL */}
      {generatingOrderNeed && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setGeneratingOrderNeed(null) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-3xl overflow-visible shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d] rounded-t-xl">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-blue-400" />
                <span>Gerar Pedido de Compra (a partir da Necessidade #{generatingOrderNeed.id})</span>
              </h3>
              <button onClick={() => setGeneratingOrderNeed(null)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleConfirmPurchaseOrder} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Fornecedor Destinatário</label>
                  <SearchableSelect
                    options={supplierOptions}
                    selectedValue={fornecedorId}
                    onChange={(id) => setFornecedorId(id)}
                    placeholder="Selecione um fornecedor..."
                    noOptionsMessage="Nenhum fornecedor cadastrado"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Previsão Prometida de Entrega</label>
                  <input
                    type="date"
                    required
                    value={dataEntregaOrder}
                    onChange={(e) => setDataEntregaOrder(e.target.value)}
                    onClick={(e) => { try { (e.target as any).showPicker(); } catch(err) {} }}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Items Table for pricing */}
              <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1f293d] space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center space-x-2 border-b border-[#1f293d]/50 pb-2">
                  <Check className="w-4 h-4 text-blue-400" />
                  <span>Definir Preços Unitários dos Itens</span>
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] text-gray-400">
                    <thead>
                      <tr className="border-b border-[#1f293d]/50 text-gray-500 uppercase font-black text-[9px]">
                        <th className="py-2">Insumo</th>
                        <th className="py-2 text-center">Unidade</th>
                        <th className="py-2 text-right">Qtd</th>
                        <th className="py-2 text-center" style={{ width: '130px' }}>Unitário (R$)</th>
                        <th className="py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]/30 text-gray-300">
                      {generatingOrderNeed.itens.map((item, index) => {
                        const p = products.find(prod => prod.id === item.prodId);
                        const pValStr = itemPrices[item.prodId] || "0";
                        const subVal = item.qtd * Number(pValStr);

                        return (
                          <tr key={index}>
                            <td className="py-2">
                              <span className="font-mono text-blue-400 font-bold mr-1">[{p?.codigo}]</span>
                              <span className="font-bold text-white">{p?.descricao}</span>
                            </td>
                            <td className="py-2 text-center text-gray-500 font-mono uppercase">{p?.unidade || 'UN'}</td>
                            <td className="py-2 text-right font-mono font-bold text-gray-300">{item.qtd}</td>
                            <td className="py-2 text-center">
                              <input
                                type="number"
                                required
                                step="0.01"
                                value={pValStr}
                                onChange={(e) => {
                                  setItemPrices({
                                    ...itemPrices,
                                    [item.prodId]: e.target.value
                                  });
                                }}
                                className="w-full bg-[#111827] border border-[#1f293d] px-2 py-1 rounded text-white font-mono text-center text-xs focus:outline-none focus:border-blue-500"
                              />
                            </td>
                            <td className="py-2 text-right font-mono text-blue-400 font-bold">
                              {subVal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Total box */}
                <div className="flex justify-end items-center space-x-3 pt-3 border-t border-[#1f293d]/50">
                  <span className="text-gray-400 font-bold text-xs uppercase">Valor Total Estimado:</span>
                  <span className="text-emerald-400 font-black text-sm font-mono">
                    {generatingOrderNeed.itens.reduce((sum, item) => {
                      const price = Number(itemPrices[item.prodId] || 0);
                      return sum + (item.qtd * price);
                    }, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setGeneratingOrderNeed(null)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors flex items-center space-x-1 shadow-lg shadow-blue-500/10"
                >
                  <Send className="w-4 h-4" />
                  <span>Gerar Pedido de Compra</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
