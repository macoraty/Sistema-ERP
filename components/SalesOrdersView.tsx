'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useErp } from '@/hooks/use-erp';
import { SalesOrder, Contact, Product } from '@/lib/types';
import { 
  FileText, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  ShoppingBag, 
  Trash2,
  X,
  PlusCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Check,
  Edit,
  Printer
} from 'lucide-react';

import { triggerPrint } from "@/lib/print";
import { SearchableSelect } from '@/components/SearchableSelect';

export default function SalesOrdersView() {
  const { 
    salesOrders, 
    contacts, 
    products, 
    stock, 
    saveSalesOrder, 
    updateSalesOrder,
    faturarSalesOrder, 
    cancelSalesOrder,
    printTemplates,
    appLogo
  } = useErp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);

  // Sorting State
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handlePrint = (order: SalesOrder) => {
    if (printTemplates['salesOrder']) {
      let tpl = printTemplates['salesOrder'];
      const contact = contacts.find(c => c.id === order.clienteId);
      tpl = tpl.replace(/{{ID}}/g, String(order.id));
      tpl = tpl.replace(/{{DATA}}/g, order.dataEmissao);
      tpl = tpl.replace(/{{NOME_CONTATO}}/g, contact ? contact.nome : 'Desconhecido');
      tpl = tpl.replace(/{{TOTAL}}/g, order.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      
      const itemsHtml = order.itens.map(it => {
        const p = products.find(prod => prod.id === it.prodId);
        return `<tr>
          <td>${p?.codigo}</td>
          <td>${p?.descricao}</td>
          <td>${it.qtd}</td>
          <td>${it.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
        </tr>`;
      }).join('');

      tpl = tpl.replace(/{{ITENS_HTML}}/g, `<table>
        <thead><tr><th>Código</th><th>Descrição</th><th>Qtd</th><th>Valor Unit.</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>`);

      if (appLogo) {
        tpl = tpl.replace(/<div class="print-section">/, `<div class="print-section"><div style="text-align:center;margin-bottom:20px;"><img src="${appLogo}" style="max-height:80px;" /></div>`);
      }

      triggerPrint(`Pedido_Venda_${order.id}`, tpl);
    } else {
      triggerPrint(`Pedido_Venda_${order.id}`);
    }
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // New Sales Order Form State
  const [clienteId, setClienteId] = useState<number>(0);
  const [dataEntrega, setDataEntrega] = useState('');
  
  // Basket builder state
  const [basket, setBasket] = useState<{ prodId: number; qtd: number; valorUnitario: number }[]>([]);
  const [currentProdId, setCurrentProdId] = useState<number>(0);
  const [currentQtd, setCurrentQtd] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');

  // Dropdown data
  const clients = useMemo(() => contacts.filter(c => c.tipo === 'Cliente'), [contacts]);
  const salableProducts = useMemo(() => products, [products]);

  const clientOptions = useMemo(() => {
    return clients.map(c => ({
      id: c.id,
      label: c.nome,
      sublabel: c.cnpj ? `CNPJ: ${c.cnpj} | ${c.cidade}-${c.uf}` : `${c.cidade}-${c.uf}`
    }));
  }, [clients]);

  const productOptions = useMemo(() => {
    return [...salableProducts]
      .sort((a, b) => a.descricao.localeCompare(b.descricao))
      .map(p => ({
      id: p.id,
      label: `[${p.codigo}] - ${p.descricao}`,
      sublabel: `Preço: R$ ${(p.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Lead Time: ${p.leadTime || 0} dias`
    }));
  }, [salableProducts]);

  // Open Add modal setup
  const handleOpenAddModal = () => {
    setEditingOrder(null);
    if (clients.length > 0) setClienteId(clients[0].id);
    if (salableProducts.length > 0) {
      const defaultProd = salableProducts[0];
      setCurrentProdId(defaultProd.id);
      setCurrentPrice(String(defaultProd.valor));
    }
    setDataEntrega('');
    setBasket([]);
    setCurrentQtd('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (order: SalesOrder) => {
    setEditingOrder(order);
    setClienteId(order.clienteId);
    
    // Parse order.dataEntrega "DD/MM/YYYY" back to "YYYY-MM-DD" for input type="date"
    let dVal = "";
    if (order.dataEntrega) {
      const parts = order.dataEntrega.split('/');
      if (parts.length === 3) {
        dVal = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    setDataEntrega(dVal);
    setBasket(order.itens);
    
    if (salableProducts.length > 0) {
      const defaultProd = salableProducts[0];
      setCurrentProdId(defaultProd.id);
      setCurrentPrice(String(defaultProd.valor));
    }
    setCurrentQtd('');
    setIsModalOpen(true);
  };

  const handlePrintSalesOrder = (order: SalesOrder) => {
    handleOpenViewModal(order);
  };

  // When selected product in form changes, auto-load standard standard price
  const handleProductChange = (prodId: number) => {
    setCurrentProdId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setCurrentPrice(String(prod.valor));
    }
  };

  const handleAddToBasket = () => {
    if (!currentProdId || !currentQtd || parseFloat(currentQtd) <= 0 || !currentPrice) {
      alert('Por favor, informe a quantidade e o preço unitário do item.');
      return;
    }

    const prodId = Number(currentProdId);
    const qtd = parseFloat(currentQtd);
    const valUnit = parseFloat(currentPrice);

    // If already in basket, accumulate
    const existingIdx = basket.findIndex(item => item.prodId === prodId);
    if (existingIdx !== -1) {
      const updated = [...basket];
      updated[existingIdx].qtd += qtd;
      setBasket(updated);
    } else {
      setBasket([...basket, { prodId, qtd, valorUnitario: valUnit }]);
    }

    setCurrentQtd('');
  };

  const handleRemoveFromBasket = (index: number) => {
    setBasket(basket.filter((_, idx) => idx !== index));
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (basket.length === 0) {
      alert('Você precisa adicionar pelo menos um item ao pedido de venda.');
      return;
    }

    if (!clienteId || !dataEntrega) {
      alert('Informe o cliente e a data estimada de entrega.');
      return;
    }

    // Format expected delivery date
    const dParts = dataEntrega.split('-');
    const formattedDeliveryDate = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;

    // Calculate sum
    const total = basket.reduce((acc, b) => acc + (b.qtd * b.valorUnitario), 0);

    // Format current date
    const today = new Date();
    const dStr = String(today.getDate()).padStart(2, '0');
    const mStr = String(today.getMonth() + 1).padStart(2, '0');
    const yStr = today.getFullYear();

    if (editingOrder) {
      updateSalesOrder({
        ...editingOrder,
        clienteId,
        dataEntrega: formattedDeliveryDate,
        itens: basket,
        valorTotal: total
      });
      setEditingOrder(null);
    } else {
      saveSalesOrder({
        clienteId,
        dataEmissao: `${dStr}/${mStr}/${yStr}`,
        dataEntrega: formattedDeliveryDate,
        itens: basket,
        valorTotal: total,
        status: 'Aberto'
      });
    }

    setIsModalOpen(false);
  };

  const handleOpenViewModal = (order: SalesOrder) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const filteredOrders = useMemo(() => {
    return salesOrders.filter(o => {
      const client = contacts.find(c => c.id === o.clienteId);
      const clientName = client ? client.nome.toLowerCase() : '';
      const matchSearch = clientName.includes(searchTerm.toLowerCase()) || String(o.id).includes(searchTerm);
      const matchStatus = selectedStatus === 'Todos' || o.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [salesOrders, contacts, searchTerm, selectedStatus]);

  const sortedOrders = useMemo(() => {
    if (!sortField) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      let valA = a[sortField as keyof SalesOrder] ?? "";
      let valB = b[sortField as keyof SalesOrder] ?? "";

      if (sortField === 'clienteId') {
        const clientA = contacts.find(c => c.id === a.clienteId);
        const clientB = contacts.find(c => c.id === b.clienteId);
        valA = clientA ? clientA.nome : "";
        valB = clientB ? clientB.nome : "";
      }

      if (sortField === 'valorTotal' || sortField === 'id') {
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
  }, [filteredOrders, sortField, sortDirection, contacts]);

  return (
    <div className="space-y-6 font-sans animate-fade-in" id="sales-orders-view">
      
      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#111827] border border-[#1f293d] p-4 rounded-xl">
        
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente ou número do pedido..."
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Aberto">Abertos (Em Produção)</option>
            <option value="Faturado">Faturados / Despachados</option>
            <option value="Cancelado">Cancelados</option>
          </select>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Pedido Venda</span>
        </button>

      </div>

      {/* Orders Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f1523] border-b border-[#1f293d] text-gray-400 text-[10px] uppercase font-black tracking-wider font-sans">
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('id')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>ID Pedido</span>
                    {sortField === 'id' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('clienteId')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Cliente</span>
                    {sortField === 'clienteId' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('dataEmissao')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Emissão</span>
                    {sortField === 'dataEmissao' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('dataEntrega')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Entrega Prometida</span>
                    {sortField === 'dataEntrega' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-right"
                  onClick={() => toggleSort('valorTotal')}
                >
                  <div className="flex items-center justify-end space-x-1 select-none">
                    <span>Valor Total</span>
                    {sortField === 'valorTotal' ? (
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
                    <span>Status</span>
                    {sortField === 'status' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-center select-none">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50 text-xs text-gray-300">
              {sortedOrders.map((o) => {
                const client = contacts.find(c => c.id === o.clienteId);
                const isOpen = o.status === 'Aberto';
                const isFaturado = o.status === 'Faturado';

                let statusBadge = '';
                if (isOpen) statusBadge = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                else if (isFaturado) statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                else statusBadge = 'bg-gray-500/10 text-gray-400 border border-gray-500/20';

                return (
                  <tr key={o.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white text-[11px]">
                      #{o.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {client ? client.nome : 'Cliente Não Encontrado'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-gray-400">
                      {o.dataEmissao}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-blue-400">
                      {o.dataEntrega}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-gray-200">
                      {o.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${statusBadge}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenViewModal(o)}
                          className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                          title="Ver Detalhes do Pedido"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handlePrintSalesOrder(o)}
                          className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                          title="Imprimir Pedido"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(o)}
                          disabled={o.status === 'Faturado'}
                          className={`p-1 rounded transition-colors ${
                            o.status === 'Faturado'
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800'
                          }`}
                          title={o.status === 'Faturado' ? 'Pedidos faturados não podem ser editados' : 'Editar Pedido'}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        
                        {isOpen && (
                          <>
                            <button
                              onClick={() => faturarSalesOrder(o.id)}
                              className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-[10px] font-black px-2.5 py-1 rounded transition-colors"
                            >
                              Faturar
                            </button>
                            <button
                              onClick={() => cancelSalesOrder(o.id)}
                              className="p-1 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors text-[10px]"
                              title="Cancelar Pedido"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-500 font-medium">
                    Nenhum pedido de venda registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Order Modal (Basket Builder) */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-3xl overflow-visible shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d] rounded-t-xl">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <ShoppingBag className="w-4 h-4 text-blue-400" />
                <span>{editingOrder ? `Editar Pedido de Venda #${editingOrder.id}` : 'Registrar Novo Pedido de Venda'}</span>
              </h3>
              <button onClick={() => { setIsModalOpen(false); setEditingOrder(null); }} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveOrder} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Cliente Adquirente</label>
                  <SearchableSelect
                    options={clientOptions}
                    selectedValue={clienteId}
                    onChange={(id) => setClienteId(id)}
                    placeholder="Selecione um cliente..."
                    noOptionsMessage="Nenhum cliente encontrado"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Data Prometida de Entrega</label>
                  <input
                    type="date"
                    required
                    value={dataEntrega}
                    onChange={(e) => setDataEntrega(e.target.value)}
                    onClick={(e) => { try { (e.target as any).showPicker(); } catch(err) {} }}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Basket Builder Block */}
              <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1f293d] space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center space-x-2 border-b border-[#1f293d] pb-2">
                  <PlusCircle className="w-4 h-4 text-blue-400" />
                  <span>Adicionar Itens do Pedido</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-5 border-none">
                    <label className="block text-gray-500 text-[9px] uppercase font-black mb-1 tracking-wider">Produto / SKU</label>
                    <SearchableSelect
                      options={productOptions}
                      selectedValue={currentProdId}
                      onChange={(id) => handleProductChange(id)}
                      placeholder="Selecione um produto..."
                      noOptionsMessage="Nenhum produto encontrado"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-500 text-[9px] uppercase font-black mb-1 tracking-wider">Qtd.</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 5"
                      value={currentQtd}
                      onChange={(e) => setCurrentQtd(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1f293d] p-2 rounded text-white font-mono"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-gray-500 text-[9px] uppercase font-black mb-1 tracking-wider">Unitário (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="850.00"
                      value={currentPrice}
                      onChange={(e) => setCurrentPrice(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1f293d] p-2 rounded text-white font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddToBasket}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-1 rounded transition-colors flex items-center justify-center space-x-1"
                      style={{ height: '38px' }}
                      title="Adicionar Item ao Pedido"
                    >
                      <Plus className="w-4 h-4 flex-shrink-0" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* Basket List Table */}
                <div className="pt-2">
                  <table className="w-full text-left text-[11px] text-gray-400">
                    <thead>
                      <tr className="border-b border-[#1f293d] text-gray-500 uppercase font-black text-[9px]">
                        <th className="py-1">SKU</th>
                        <th className="py-1 text-center">Qtd</th>
                        <th className="py-1 text-right">Unitário</th>
                        <th className="py-1 text-right">Subtotal</th>
                        <th className="py-1 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]/30 text-gray-300">
                      {basket.map((item, index) => {
                        const p = products.find(prod => prod.id === item.prodId);
                        const sub = item.qtd * item.valorUnitario;
                        return (
                          <tr key={index}>
                            <td className="py-1.5 font-bold text-white">{p ? p.codigo : 'SKU'}</td>
                            <td className="py-1.5 text-center font-mono font-bold text-blue-400">{item.qtd}</td>
                            <td className="py-1.5 text-right font-mono">{item.valorUnitario.toLocaleString('pt-BR')}</td>
                            <td className="py-1.5 text-right font-mono text-emerald-400 font-bold">{sub.toLocaleString('pt-BR')}</td>
                            <td className="py-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveFromBasket(index)}
                                className="text-red-400 hover:text-red-300"
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {basket.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-gray-500">
                            Nenhum item adicionado ao carrinho de faturamento.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Form Actions */}
              <div className="flex justify-between items-center pt-3 border-t border-[#1f293d]">
                <div className="text-sm font-bold text-white">
                  Total Pedido: <b className="text-emerald-400 font-mono text-base">{basket.reduce((acc, b) => acc + (b.qtd * b.valorUnitario), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-2 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg"
                  >
                    Gravar Pedido
                  </button>
                </div>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && selectedOrder && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print-force-light"
          onClick={(e) => { if (e.target === e.currentTarget) setIsViewModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-2xl overflow-visible shadow-2xl animate-scale-up print-section">
            
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d] rounded-t-xl print-hide">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Visualizador Auxiliar de Pedido de Venda</span>
              </h3>
              <div className="flex items-center space-x-3">
                <button onClick={() => selectedOrder && handlePrint(selectedOrder)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center space-x-1">
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Pedido</span>
                </button>
                <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              <div className="print-hide hidden print:block text-center mb-6 text-black">
                <h2 className="text-xl font-bold uppercase mb-1">Pedido de Venda #{selectedOrder.id}</h2>
                <p className="text-sm">Documento Auxiliar de Venda</p>
              </div>

              {/* Core metadata */}
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#1f293d]/50 print:border-gray-300">
                <div>
                  <span className="text-gray-500 uppercase font-bold text-[9px] block">Adquirente</span>
                  <span className="font-bold text-white text-xs block">
                    {contacts.find(c => c.id === selectedOrder.clienteId)?.nome || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 uppercase font-bold text-[9px] block">Status Atual</span>
                  <span className="font-bold text-blue-400 text-xs block font-mono uppercase">
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#1f293d]/50">
                <div>
                  <span className="text-gray-500 uppercase font-bold text-[9px] block">Data Emissão</span>
                  <span className="font-medium text-gray-300 font-mono">{selectedOrder.dataEmissao}</span>
                </div>
                <div>
                  <span className="text-gray-500 uppercase font-bold text-[9px] block">Previsão Despacho</span>
                  <span className="font-medium text-blue-400 font-mono">{selectedOrder.dataEntrega}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">Itens do Faturamento</h4>
                <div className="bg-[#0b0f17] rounded-lg border border-[#1f293d] overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="bg-[#0f1523] text-gray-500 uppercase font-black text-[9px] border-b border-[#1f293d]">
                        <th className="py-2 px-3">SKU</th>
                        <th className="py-2 px-3 text-center">Qtd</th>
                        <th className="py-2 px-3 text-right">Unitário</th>
                        <th className="py-2 px-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]/20 text-gray-300 font-mono">
                      {selectedOrder.itens.map((item, idx) => {
                        const p = products.find(prod => prod.id === item.prodId);
                        return (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-bold text-white">{p ? p.codigo : 'SKU'}</td>
                            <td className="py-2 px-3 text-center text-blue-400 font-bold">{item.qtd}</td>
                            <td className="py-2 px-3 text-right">{item.valorUnitario.toLocaleString('pt-BR')}</td>
                            <td className="py-2 px-3 text-right text-emerald-400 font-bold">{(item.qtd * item.valorUnitario).toLocaleString('pt-BR')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total display */}
              <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10 flex justify-between items-center text-sm font-bold text-white">
                <span>Valor Líquido do Pedido:</span>
                <span className="text-emerald-400 font-mono text-base">
                  {selectedOrder.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-lg"
                >
                  Fechar Espelho
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
