'use client';

import React, { useState, useMemo } from 'react';
import { useErp } from '@/hooks/use-erp';
import { Product } from '@/lib/types';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Layers, 
  DollarSign, 
  Clock, 
  X,
  FileCheck,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function ProductsView() {
  const { products, saveProduct, deleteProduct, unidadesMedida } = useErp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('Todos');
  const [filterReview, setFilterReview] = useState<'Todos' | 'Revisar' | 'Revisados'>('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [codigo, setCodigo] = useState('');
  const [codigoSuffix, setCodigoSuffix] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<Product['tipo']>('Acabado');
  const [unidade, setUnidade] = useState('UN');
  const [valor, setValor] = useState('');
  const [leadTime, setLeadTime] = useState('');
  const [codigoFornecedor, setCodigoFornecedor] = useState('');
  const [codigoFornecedor2, setCodigoFornecedor2] = useState('');
  const [codigoFornecedor3, setCodigoFornecedor3] = useState('');
  const [codigoFornecedor4, setCodigoFornecedor4] = useState('');
  const [needsReview, setNeedsReview] = useState(false);

  // Fields from Image 2
  const [grupo, setGrupo] = useState('');
  const [segUnMedida, setSegUnMedida] = useState('');
  const [fatorConversao, setFatorConversao] = useState('');
  const [tipoConversao, setTipoConversao] = useState('M - Multiplicador');
  const [precoVenda, setPrecoVenda] = useState('');
  const [moedaCusto, setMoedaCusto] = useState('1 - Moeda1');
  const [pesoLiquido, setPesoLiquido] = useState('');
  const [familia, setFamilia] = useState('');

  // Expandable row state
  const [expandedProductId, setExpandedProductId] = useState<number | null>(null);

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

  const availableUnits = useMemo(() => {
    const list = unidadesMedida || [];
    const merged = [...list];
    if (unidade && !merged.includes(unidade)) {
      merged.push(unidade);
    }
    return merged.length > 0 ? merged : ['UN'];
  }, [unidadesMedida, unidade]);

  const availableSegUnits = useMemo(() => {
    const list = unidadesMedida || [];
    const merged = [...list];
    if (segUnMedida && !merged.includes(segUnMedida)) {
      merged.push(segUnMedida);
    }
    return merged;
  }, [unidadesMedida, segUnMedida]);

  const getPrefix = (t: Product['tipo']) => {
    switch (t) {
      case 'Acabado': return 'PA-';
      case 'Semi-acabado': return 'SA-';
      case 'Materia-Prima': return 'MP-';
      case 'Insumo': return 'IS-';
      default: return 'MP-';
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setCodigo('');
    setCodigoSuffix('');
    setDescricao('');
    setTipo('Acabado');
    setUnidade('UN');
    setValor('');
    setLeadTime('');
    setCodigoFornecedor('');
    setNeedsReview(false);
    
    // Reset Image 2 fields
    setGrupo('');
    setSegUnMedida('');
    setFatorConversao('');
    setTipoConversao('M - Multiplicador');
    setPrecoVenda('');
    setMoedaCusto('1 - Moeda1');
    setPesoLiquido('');
    setFamilia('');

    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setCodigo(p.codigo);
    if (p.needsReview) {
      setCodigoSuffix(p.codigo.replace(/^(PA-|SA-|MP-|IS-)/i, ''));
    } else {
      setCodigoSuffix('');
    }
    setDescricao(p.descricao);
    setTipo(p.tipo);
    setUnidade(p.unidade);
    setValor(String(p.valor));
    setLeadTime(String(p.leadTime));
    setCodigoFornecedor(p.codigoFornecedor || '');
    setCodigoFornecedor2(p.codigoFornecedor2 || '');
    setCodigoFornecedor3(p.codigoFornecedor3 || '');
    setCodigoFornecedor4(p.codigoFornecedor4 || '');
    setNeedsReview(!!p.needsReview);
    
    // Load Image 2 fields
    setGrupo(p.grupo || '');
    setSegUnMedida(p.segUnMedida || '');
    setFatorConversao(p.fatorConversao !== undefined ? String(p.fatorConversao) : '');
    setTipoConversao(p.tipoConversao || 'M - Multiplicador');
    setPrecoVenda(p.precoVenda !== undefined ? String(p.precoVenda) : '');
    setMoedaCusto(p.moedaCusto || '1 - Moeda1');
    setPesoLiquido(p.pesoLiquido !== undefined ? String(p.pesoLiquido) : '');
    setFamilia(p.familia || '');

    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    const showPrefixInput = !editingProduct || !!editingProduct.needsReview;
    const finalCodigo = showPrefixInput 
      ? `${getPrefix(tipo)}${codigoSuffix.trim()}`
      : codigo.trim();

    if (!finalCodigo || !descricao || !valor || !leadTime) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    saveProduct({
      id: editingProduct ? editingProduct.id : 0,
      codigo: finalCodigo,
      descricao,
      tipo,
      unidade,
      valor: parseFloat(valor),
      leadTime: parseInt(leadTime, 10),
      
      // Additional fields
      grupo: grupo.trim() || undefined,
      segUnMedida: segUnMedida.trim() || undefined,
      fatorConversao: fatorConversao ? parseFloat(fatorConversao) : undefined,
      tipoConversao: tipoConversao || undefined,
      precoVenda: precoVenda ? parseFloat(precoVenda) : undefined,
      moedaCusto: moedaCusto || undefined,
      pesoLiquido: pesoLiquido ? parseFloat(pesoLiquido) : undefined,
      familia: familia.trim() || undefined,
      needsReview: editingProduct ? needsReview : false,
      codigoFornecedor: codigoFornecedor.trim() || undefined,
      codigoFornecedor2: codigoFornecedor2.trim() || undefined,
      codigoFornecedor3: codigoFornecedor3.trim() || undefined,
      codigoFornecedor4: codigoFornecedor4.trim() || undefined,
    });

    setIsModalOpen(false);
  };

  const handleDeleteProduct = (id: number, code: string) => {
    if (confirm(`Atenção: Ao deletar o produto ${code}, todas as estruturas BOM associadas serão também removidas. Deseja prosseguir?`)) {
      deleteProduct(id);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = 
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.codigoFornecedor && p.codigoFornecedor.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.codigoFornecedor2 && p.codigoFornecedor2.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.codigoFornecedor3 && p.codigoFornecedor3.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.codigoFornecedor4 && p.codigoFornecedor4.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchType = selectedType === 'Todos' || p.tipo === selectedType;
      
      let matchReview = true;
      if (filterReview === 'Revisar') {
        matchReview = !!p.needsReview;
      } else if (filterReview === 'Revisados') {
        matchReview = !p.needsReview;
      }
      
      return matchSearch && matchType && matchReview;
    });
  }, [products, searchTerm, selectedType, filterReview]);

  const sortedProducts = useMemo(() => {
    if (!sortField) return filteredProducts;
    return [...filteredProducts].sort((a, b) => {
      let valA = a[sortField as keyof Product] ?? "";
      let valB = b[sortField as keyof Product] ?? "";
      
      if (sortField === 'valor' || sortField === 'leadTime') {
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
  }, [filteredProducts, sortField, sortDirection]);

  const showPrefixInput = !editingProduct || !!editingProduct.needsReview;

  return (
    <div className="space-y-6 font-sans animate-fade-in" id="products-view">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#111827] border border-[#1f293d] p-4 rounded-xl">
        
        {/* Search & Filter bar */}
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar SKU por código ou descrição..."
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="Todos">Todas as Classificações</option>
            <option value="Acabado">Produto Acabado (PA)</option>
            <option value="Semi-acabado">Semi-Acabado (SA)</option>
            <option value="Materia-Prima">Matéria-Prima (MP)</option>
            <option value="Insumo">Insumo Industrial (IS)</option>
          </select>

          <select
            value={filterReview}
            onChange={(e) => setFilterReview(e.target.value as any)}
            className="bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="Todos">Todos (Revisão)</option>
            <option value="Revisar">⚠️ Sob Revisão (Importados XML)</option>
            <option value="Revisados">✓ Já Revisados / Cadastrados</option>
          </select>
        </div>

        {/* Action button */}
        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow transition-all hover:scale-[1.01]"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar SKU</span>
        </button>

      </div>

      {/* Products Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f1523] border-b border-[#1f293d] text-gray-400 text-[10px] uppercase font-black tracking-wider">
                <th className="py-3 px-4 w-10 text-center">Detalhes</th>
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
                    <span>Descrição</span>
                    {sortField === 'descricao' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('unidade')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>UM</span>
                    {sortField === 'unidade' ? (
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
                    <span>Valor Padrão</span>
                    {sortField === 'valor' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors text-center"
                  onClick={() => toggleSort('leadTime')}
                >
                  <div className="flex items-center justify-center space-x-1 select-none">
                    <span>Lead Time (Úteis)</span>
                    {sortField === 'leadTime' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50 text-xs text-gray-300">
              {sortedProducts.map((p) => {
                let badgeClass = '';
                if (p.tipo === 'Acabado') badgeClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                else if (p.tipo === 'Semi-acabado') badgeClass = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                else if (p.tipo === 'Materia-Prima') badgeClass = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
                else badgeClass = 'bg-gray-500/10 text-gray-400 border border-gray-500/20';

                const isExpanded = expandedProductId === p.id;

                return (
                  <React.Fragment key={p.id}>
                    <tr className="hover:bg-gray-800/20 transition-colors">
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                          className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors"
                          title={isExpanded ? "Recolher Detalhes" : "Expandir Detalhes"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${badgeClass}`}>
                          {p.tipo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-white text-[11px]">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                          <span>{p.codigo}</span>
                          {p.needsReview && (
                            <span 
                              className="px-1.5 py-0.5 text-[8px] bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded font-sans font-black tracking-wider uppercase animate-pulse flex items-center shrink-0"
                              title="Produto importado via XML aguardando revisão de código SKU"
                            >
                              ⚠️ Revisar
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-gray-100 max-w-xs truncate" title={p.descricao}>
                        {p.descricao}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[10px] text-gray-400">
                        {p.unidade}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-gray-200">
                        {p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-400">
                        {p.leadTime} dias
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          {p.needsReview && (
                            <button
                              onClick={() => {
                                saveProduct({
                                  ...p,
                                  needsReview: false
                                });
                              }}
                              className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded transition-colors"
                              title="Aprovar Código / Concluir Revisão"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                            title="Editar SKU"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.codigo)}
                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Deletar SKU"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[#0b0f17]/40 border-b border-[#1f293d]/50">
                        <td colSpan={8} className="p-4 bg-slate-900/10">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 p-3 bg-black/20 rounded-lg border border-[#1f293d]/40">
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Grupo</span>
                              <span className="text-gray-200 font-medium">{p.grupo || '—'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Seg. Unid. Medida</span>
                              <span className="text-gray-200 font-mono font-bold">{p.segUnMedida || '—'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Fator Conv.</span>
                              <span className="text-gray-200 font-mono font-bold">{p.fatorConversao !== undefined ? p.fatorConversao : '—'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tipo de Conv.</span>
                              <span className="text-gray-200 font-medium">{p.tipoConversao || '—'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Preço de Venda</span>
                              <span className="text-emerald-400 font-mono font-bold">
                                {p.precoVenda !== undefined ? p.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Moeda C.Std</span>
                              <span className="text-gray-200 font-medium">{p.moedaCusto || '—'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Peso Líquido</span>
                              <span className="text-gray-200 font-mono font-bold">{p.pesoLiquido !== undefined ? `${p.pesoLiquido} kg` : '—'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Família</span>
                              <span className="text-gray-200 font-medium">{p.familia || '—'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Códigos do Fornecedor (XML)</span>
                              <div className="flex flex-col space-y-0.5">
                                <span className="text-amber-400 font-mono font-bold text-xs">{p.codigoFornecedor || '—'}</span>
                                {p.codigoFornecedor2 && <span className="text-amber-400/80 font-mono font-bold text-[10px]">{p.codigoFornecedor2}</span>}
                                {p.codigoFornecedor3 && <span className="text-amber-400/60 font-mono font-bold text-[10px]">{p.codigoFornecedor3}</span>}
                                {p.codigoFornecedor4 && <span className="text-amber-400/40 font-mono font-bold text-[10px]">{p.codigoFornecedor4}</span>}
                              </div>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Status de Revisão</span>
                              <span className={`font-mono font-bold ${p.needsReview ? 'text-amber-500 animate-pulse' : 'text-emerald-500'}`}>
                                {p.needsReview ? '⚠️ Sob Revisão' : '✓ Revisado / Ok'}
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500 font-medium">
                    Nenhum produto encontrado na pesquisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit SKU Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d]">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Package className="w-4 h-4 text-blue-400" />
                <span>{editingProduct ? 'Editar SKU Cadastrado' : 'Cadastrar Novo SKU'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-5 space-y-5 text-xs max-h-[85vh] overflow-y-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Col 1: Basic Fields */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Dados Básicos do SKU</h4>
                  </div>

                  {editingProduct?.needsReview && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg text-amber-400 leading-relaxed text-[11px] flex items-start space-x-2 animate-pulse">
                      <span className="text-base leading-none">⚠️</span>
                      <div>
                        <strong className="block font-black mb-0.5">PRODUTO IMPORTADO AGUARDANDO REVISÃO</strong>
                        Este SKU foi cadastrado automaticamente via importação XML. Você pode alterar o código SKU interno e o código do fornecedor abaixo para organizá-los.
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Código (SKU) *</label>
                    {!showPrefixInput ? (
                      <div className="relative">
                        <input
                          type="text"
                          required
                          disabled
                          value={codigo}
                          className="w-full bg-[#111827] border border-[#1f293d]/80 rounded-lg p-2.5 text-gray-400 font-mono font-bold cursor-not-allowed select-none opacity-80"
                          placeholder="Ex: MP-ACO-1020"
                        />
                        <span className="absolute right-3 top-2.5 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold uppercase select-none">
                          Código Salvo
                        </span>
                      </div>
                    ) : (
                      <div className="flex rounded-lg overflow-hidden border border-[#1f293d] focus-within:border-blue-500 bg-[#0b0f17]">
                        <span className="bg-[#1f293d] px-3 flex items-center justify-center text-gray-300 font-mono font-bold text-xs select-none border-r border-[#1f293d]">
                          {getPrefix(tipo)}
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Ex: ACO-3MM"
                          value={codigoSuffix}
                          onChange={(e) => setCodigoSuffix(e.target.value.toUpperCase().replace(/^(PA-|SA-|MP-|IS-)/gi, ''))}
                          className="flex-1 bg-transparent p-2.5 text-white font-mono focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Código Fornecedor (Principal)</label>
                      <input
                        type="text"
                        placeholder="Ex: FORN-123"
                        value={codigoFornecedor}
                        onChange={(e) => setCodigoFornecedor(e.target.value.toUpperCase())}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Código Fornecedor 2 (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: ALT-123"
                        value={codigoFornecedor2}
                        onChange={(e) => setCodigoFornecedor2(e.target.value.toUpperCase())}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Código Fornecedor 3 (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: EXT-123"
                        value={codigoFornecedor3}
                        onChange={(e) => setCodigoFornecedor3(e.target.value.toUpperCase())}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Código Fornecedor 4 (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ex: EXT-124"
                        value={codigoFornecedor4}
                        onChange={(e) => setCodigoFornecedor4(e.target.value.toUpperCase())}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">Descrição Comercial / Técnica *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Chapa de Aço Carbono AISI 1020 3mm"
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Classificação *</label>
                      <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value as Product['tipo'])}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Acabado">Produto Acabado (PA)</option>
                        <option value="Semi-acabado">Semi-Acabado (SA)</option>
                        <option value="Materia-Prima">Matéria-Prima (MP)</option>
                        <option value="Insumo">Insumo (IS)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Unidade Medida *</label>
                      <select
                        value={unidade}
                        onChange={(e) => setUnidade(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-semibold focus:outline-none focus:border-blue-500"
                      >
                        {availableUnits.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Custo / Preço Padrão (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="Ex: 120.00"
                        value={valor}
                        onChange={(e) => setValor(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Lead Time (Úteis)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Ex: 3"
                        value={leadTime}
                        onChange={(e) => setLeadTime(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Col 2: Image 2 Additional Fields */}
                <div className="space-y-4 border-t md:border-t-0 md:border-l border-[#1f293d] pt-4 md:pt-0 md:pl-5">
                  <div>
                    <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-2">Informações Adicionais (Img 2)</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Grupo</label>
                      <input
                        type="text"
                        placeholder="Ex: FIXADORES"
                        value={grupo}
                        onChange={(e) => setGrupo(e.target.value.toUpperCase())}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Seg. Un. Medida</label>
                      <select
                        value={segUnMedida}
                        onChange={(e) => setSegUnMedida(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-semibold focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Sem Segunda Unidade</option>
                        {availableSegUnits.map((u) => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Fator Conv.</label>
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="0.00"
                        value={fatorConversao}
                        onChange={(e) => setFatorConversao(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Tipo de Conv.</label>
                      <select
                        value={tipoConversao}
                        onChange={(e) => setTipoConversao(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="M - Multiplicador">M - Multiplicador</option>
                        <option value="D - Divisor">D - Divisor</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Preço Venda (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={precoVenda}
                        onChange={(e) => setPrecoVenda(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Moeda C.Std</label>
                      <select
                        value={moedaCusto}
                        onChange={(e) => setMoedaCusto(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="1 - Moeda1">1 - Moeda1</option>
                        <option value="BRL">Real (BRL)</option>
                        <option value="USD">Dólar (USD)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Peso Líquido (kg)</label>
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="0.0000"
                        value={pesoLiquido}
                        onChange={(e) => setPesoLiquido(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">Família</label>
                      <input
                        type="text"
                        placeholder="Ex: METALURGICA"
                        value={familia}
                        onChange={(e) => setFamilia(e.target.value.toUpperCase())}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                </div>

              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-2.5 rounded-lg transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg flex items-center space-x-1.5 transition-all shadow-lg shadow-blue-900/20"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>{editingProduct ? 'Atualizar SKU' : 'Salvar SKU'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
