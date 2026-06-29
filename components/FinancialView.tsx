'use client';

import React, { useState, useMemo } from 'react';
import { useErp } from '@/hooks/use-erp';
import { FinancialEntry, Contact } from '@/lib/types';
import { 
  DollarSign, 
  Search, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  X,
  Clock,
  Briefcase,
  FileCheck,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';
import { getTodayFormatted } from '@/lib/working-days';

export default function FinancialView() {
  const { financialEntries, contacts, saveFinancialEntry, liquidarEntry } = useErp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Todos');
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

  // Form State
  const [tipo, setTipo] = useState<'Receita' | 'Despesa'>('Receita');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [contatoId, setContatoId] = useState<number>(0);

  const handleOpenAddModal = () => {
    setTipo('Receita');
    setDescricao('');
    setValor('');
    setDataVencimento('');
    if (contacts.length > 0) setContatoId(contacts[0].id);
    setIsModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao || !valor || !dataVencimento) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const dParts = dataVencimento.split('-');
    const formattedDueDate = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;

    saveFinancialEntry({
      id: 0,
      tipo,
      descricao,
      valor: parseFloat(valor),
      dataVencimento: formattedDueDate,
      contatoId: contatoId || undefined,
      status: 'Pendente'
    });

    setIsModalOpen(false);
  };

  // Financial Metrics calculations
  const summary = useMemo(() => {
    let paidRevenue = 0;
    let pendingRevenue = 0;
    let paidExpense = 0;
    let pendingExpense = 0;

    financialEntries.forEach(f => {
      const isPaid = f.status === 'Pago';
      if (f.tipo === 'Receita') {
        if (isPaid) paidRevenue += f.valor;
        else pendingRevenue += f.valor;
      } else {
        if (isPaid) paidExpense += f.valor;
        else pendingExpense += f.valor;
      }
    });

    return {
      caixaLíquido: paidRevenue - paidExpense,
      receitasPagas: paidRevenue,
      receitasPendentes: pendingRevenue,
      despesasPagas: paidExpense,
      despesasPendentes: pendingExpense
    };
  }, [financialEntries]);

  const filteredEntries = useMemo(() => {
    return financialEntries.filter(f => {
      const contactName = contacts.find(c => c.id === f.contatoId)?.nome.toLowerCase() || '';
      const matchSearch = 
        f.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contactName.includes(searchTerm.toLowerCase());
      
      let matchType = true;
      if (filterType === 'Receita') matchType = f.tipo === 'Receita';
      else if (filterType === 'Despesa') matchType = f.tipo === 'Despesa';
      else if (filterType === 'Pendente') matchType = f.status === 'Pendente';
      else if (filterType === 'Pago') matchType = f.status === 'Pago';

      return matchSearch && matchType;
    });
  }, [financialEntries, contacts, searchTerm, filterType]);

  const sortedEntries = useMemo(() => {
    if (!sortField) return filteredEntries;
    return [...filteredEntries].sort((a, b) => {
      let valA = a[sortField as keyof FinancialEntry] ?? "";
      let valB = b[sortField as keyof FinancialEntry] ?? "";

      if (sortField === 'contatoId') {
        const partnerA = contacts.find(c => c.id === a.contatoId);
        const partnerB = contacts.find(c => c.id === b.contatoId);
        valA = partnerA ? partnerA.nome : "";
        valB = partnerB ? partnerB.nome : "";
      }

      if (sortField === 'valor' || sortField === 'id') {
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
  }, [filteredEntries, sortField, sortDirection, contacts]);

  return (
    <div className="space-y-6 font-sans animate-fade-in" id="financial-view">
      
      {/* Financial KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* KPI 1: Realized Cash Balance */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Saldo em Caixa Realizado</span>
            <div className="text-xl font-black text-white mt-0.5 font-mono">
              {summary.caixaLíquido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              <span>Soma de faturamentos liquidados</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Receivables (Receitas) */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/10">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Receitas (Contas a Receber)</span>
            <div className="text-sm font-bold text-white mt-0.5 font-mono">
              Liquidadas: <b className="text-emerald-400 font-black">{summary.receitasPagas.toLocaleString('pt-BR')}</b>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
              Projetadas / Abertas: <b className="text-blue-400 font-bold">{summary.receitasPendentes.toLocaleString('pt-BR')}</b>
            </div>
          </div>
        </div>

        {/* KPI 3: Payables (Despesas) */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/10">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Despesas (Contas a Pagar)</span>
            <div className="text-sm font-bold text-white mt-0.5 font-mono">
              Liquidadas: <b className="text-rose-400 font-black">{summary.despesasPagas.toLocaleString('pt-BR')}</b>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5 font-mono">
              Projetadas / Abertas: <b className="text-orange-400 font-bold">{summary.despesasPendentes.toLocaleString('pt-BR')}</b>
            </div>
          </div>
        </div>

      </div>

      {/* Control filters bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#111827] border border-[#1f293d] p-4 rounded-xl">
        
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar lançamento por descrição, parceiro..."
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none"
          >
            <option value="Todos">Todas as Operações</option>
            <option value="Receita">Apenas Receitas (+)</option>
            <option value="Despesa">Apenas Despesas (-)</option>
            <option value="Pendente">Contas em Aberto</option>
            <option value="Pago">Títulos Liquidados</option>
          </select>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Lançamento Manual</span>
        </button>

      </div>

      {/* Ledger Entries Table */}
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
                    <span>Fluxo</span>
                    {sortField === 'tipo' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('dataVencimento')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Vencimento</span>
                    {sortField === 'dataVencimento' ? (
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
                    <span>Descrição do Título</span>
                    {sortField === 'descricao' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('contatoId')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Parceiro Comercial</span>
                    {sortField === 'contatoId' ? (
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
                    <span>Valor Líquido</span>
                    {sortField === 'valor' ? (
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
                <th className="py-3 px-4 text-center select-none">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50 text-gray-300">
              {sortedEntries.map((f) => {
                const partner = contacts.find(c => c.id === f.contatoId);
                const isReceita = f.tipo === 'Receita';
                const isPago = f.status === 'Pago';

                return (
                  <tr key={f.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {isReceita ? (
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Receita (+)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Despesa (-)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-400">
                      {f.dataVencimento}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-white max-w-xs truncate" title={f.descricao}>
                      {f.descricao}
                    </td>
                    <td className="py-3.5 px-4 text-gray-300">
                      {partner ? partner.nome : 'Nenhum / Lançamento Direto'}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-mono font-black ${isReceita ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isReceita ? '+' : '-'}{f.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {isPago ? (
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider inline-flex items-center space-x-1">
                          <CheckCircle className="w-3 h-3 text-emerald-400" />
                          <span>Liquidado</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 tracking-wider inline-flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                          <span>Aberto</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {!isPago ? (
                        <button
                          onClick={() => liquidarEntry(f.id)}
                          className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-[10px] font-black px-2.5 py-1 rounded transition-colors"
                        >
                          Liquidar
                        </button>
                      ) : (
                        <span className="text-gray-500 text-[10px] font-mono">Efetuado</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">
                    Nenhum lançamento financeiro registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Manual Entry Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-xl overflow-visible shadow-2xl animate-scale-up">
            
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d] rounded-t-xl">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Briefcase className="w-4.5 h-4.5 text-blue-400" />
                <span>Novo Lançamento Manual Financeiro</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="p-5 space-y-4 text-xs">
              
              <div>
                <label className="block text-gray-400 font-bold mb-1">Tipo de Título</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipo('Receita')}
                    className={`p-2.5 rounded-lg border font-bold text-xs transition-colors ${
                      tipo === 'Receita' 
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' 
                        : 'bg-[#0b0f17] border-[#1f293d] text-gray-400 hover:text-white'
                    }`}
                  >
                    Receita / Entrada (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipo('Despesa')}
                    className={`p-2.5 rounded-lg border font-bold text-xs transition-colors ${
                      tipo === 'Despesa' 
                        ? 'bg-rose-500/10 border-rose-500/40 text-rose-400' 
                        : 'bg-[#0b0f17] border-[#1f293d] text-gray-400 hover:text-white'
                    }`}
                  >
                    Despesa / Saída (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Descrição do Lançamento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Conta de Energia Elétrica Enel"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Valor do Lançamento (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Ex: 450.00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Vencimento</label>
                  <input
                    type="date"
                    required
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    onClick={(e) => { try { (e.target as any).showPicker(); } catch(err) {} }}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2 text-white cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">Parceiro Comercial (Opcional)</label>
                <SearchableSelect
                  options={[
                    { id: 0, label: "Nenhum / Lançamento Direto" },
                    ...contacts.map((c) => ({
                      id: c.id,
                      label: `[${c.tipo}] - ${c.nome}`,
                    })),
                  ]}
                  selectedValue={contatoId}
                  onChange={(id) => setContatoId(id)}
                  placeholder="Selecione um parceiro..."
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
                  <span>Salvar Lançamento</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
