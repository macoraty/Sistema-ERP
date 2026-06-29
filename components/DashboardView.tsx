'use client';

import React, { useMemo } from 'react';
import { useErp } from '@/hooks/use-erp';
import { 
  TrendingUp, 
  TrendingDown, 
  Boxes, 
  Cpu, 
  DollarSign, 
  ArrowUpRight, 
  FileCheck, 
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronRight,
  Clock,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  onNavigate: (screen: string) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const { 
    products, 
    salesOrders, 
    stock, 
    financialEntries, 
    mrpRequirements, 
    alerts 
  } = useErp();

  // Metrics calculations
  const totalStockValue = useMemo(() => {
    return stock.reduce((acc, s) => {
      const p = products.find(prod => prod.id === s.prodId);
      const val = p ? p.valor : 0;
      return acc + (s.qtd * val);
    }, 0);
  }, [stock, products]);

  const activeSalesValue = useMemo(() => {
    return salesOrders
      .filter(o => o.status === 'Aberto')
      .reduce((acc, o) => acc + o.valorTotal, 0);
  }, [salesOrders]);

  const netCashFlow = useMemo(() => {
    let revenue = 0;
    let expense = 0;
    financialEntries.forEach(f => {
      if (f.status === 'Pago') {
        if (f.tipo === 'Receita') revenue += f.valor;
        else expense += f.valor;
      }
    });
    return revenue - expense;
  }, [financialEntries]);

  const criticalStockItemsCount = useMemo(() => {
    return stock.filter(s => s.qtd <= s.minimo && s.minimo > 0).length;
  }, [stock]);

  // Chart calculation: Receita vs Despesa
  const monthlyChartData = useMemo(() => {
    // We group by month. Since it's a simulated database, let's create a solid mock representing 6 months of data
    return [
      { month: 'Jan', receita: 15000, despesa: 11000 },
      { month: 'Fev', receita: 18500, despesa: 12500 },
      { month: 'Mar', receita: 22000, despesa: 14000 },
      { month: 'Abr', receita: 19000, despesa: 15500 },
      { month: 'Mai', receita: 25000, despesa: 18000 },
      { month: 'Jun', receita: 31000, despesa: 20500 },
    ];
  }, []);

  return (
    <div className="space-y-6 font-sans" id="dashboard-view">
      
      {/* Top Banner Alert / Factory Status */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-900/40 via-indigo-950/30 to-slate-900 border border-blue-500/20 rounded-xl p-5 shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
            <span>Painel Operacional Ativo</span>
          </div>
          <h3 className="text-base font-black text-white">Engenharia de Manufatura Macoraty &amp; Co</h3>
          <p className="text-xs text-gray-400">
            Fábrica operando com algoritmos de MRP I, leitor de XML SEFAZ, controle dinâmico de estruturas BOM e ledger financeiro integrado.
          </p>
        </div>
        
        <button
          onClick={() => onNavigate('Necessidades MRP')}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-2 shadow-lg transition-transform hover:scale-[1.03]"
        >
          <span>Rodar Planejador MRP</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Net Cash Flow */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Fluxo de Caixa Líquido</span>
            <div className="text-lg font-black text-white mt-0.5 font-mono">
              {netCashFlow.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="flex items-center space-x-1 text-[10px] text-emerald-400 mt-1 font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>+18.4% este mês</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Inventory Valuation */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/10">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Valor em Estoque</span>
            <div className="text-lg font-black text-white mt-0.5 font-mono">
              {totalStockValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              <span>{products.length} itens cadastrados</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Sales Book Value */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/10">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Vendas em Carteira</span>
            <div className="text-lg font-black text-white mt-0.5 font-mono">
              {activeSalesValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>{salesOrders.filter(o => o.status === 'Aberto').length} pedidos em produção</span>
            </div>
          </div>
        </div>

        {/* KPI 4: MRP Requirements */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow flex items-center space-x-4">
          <div className="p-3.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/10">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Déficits MRP de Carga</span>
            <div className="text-lg font-black text-rose-400 mt-0.5 font-mono">
              {mrpRequirements.length}
            </div>
            <div className="text-[10px] text-gray-500 mt-1 flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span className="text-amber-500 font-bold">{criticalStockItemsCount} abaixo do mínimo</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Section: Financial Cash Flow Chart & Alarm center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cash Flow Chart Box */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center pb-3 border-b border-[#1f293d]">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Evolução do Faturamento Mensal (Reais)</span>
            </h3>
            <span title="Faturamento vs Despesas liquidadas em simulação">
              <Info className="w-3.5 h-3.5 text-gray-500 cursor-help" />
            </span>
          </div>

          {/* SVG representation of Bar Chart */}
          <div className="h-64 flex flex-col justify-between pt-4">
            <div className="flex-1 flex items-end justify-between px-4 pb-2 border-b border-[#1f293d]/50 relative">
              
              {/* Grid Lines */}
              <div className="absolute inset-x-0 top-0 border-t border-[#1f293d]/20" />
              <div className="absolute inset-x-0 top-1/3 border-t border-[#1f293d]/20" />
              <div className="absolute inset-x-0 top-2/3 border-t border-[#1f293d]/20" />

              {monthlyChartData.map((data, index) => {
                const maxVal = 35000;
                const recHeight = (data.receita / maxVal) * 100;
                const desHeight = (data.despesa / maxVal) * 100;

                return (
                  <div key={index} className="flex flex-col items-center space-y-2 z-10 w-1/6">
                    <div className="flex items-end space-x-1.5 h-44 w-full justify-center">
                      {/* Receita bar */}
                      <div 
                        className="w-3 bg-blue-500 hover:bg-blue-400 rounded-t transition-all duration-500 relative group cursor-pointer"
                        style={{ height: `${recHeight}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1f293d] border border-[#243049] text-[9px] font-mono text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow">
                          Rec: {data.receita.toLocaleString('pt-BR')}
                        </div>
                      </div>
                      {/* Despesa bar */}
                      <div 
                        className="w-3 bg-rose-500 hover:bg-rose-400 rounded-t transition-all duration-500 relative group cursor-pointer"
                        style={{ height: `${desHeight}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1f293d] border border-[#243049] text-[9px] font-mono text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 shadow">
                          Desp: {data.despesa.toLocaleString('pt-BR')}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold font-mono uppercase">{data.month}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Chart Legend */}
            <div className="flex items-center justify-center space-x-6 text-[10px] text-gray-400 pt-2">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-blue-500 rounded-sm" />
                <span>Receitas de Venda</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 bg-rose-500 rounded-sm" />
                <span>Despesas / Custos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Factory Alerts / Feed Center */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2 pb-3 border-b border-[#1f293d]">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Alertas e Notificações</span>
            </h3>
            
            <div className="space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
              {alerts.length === 0 ? (
                <div className="p-4 bg-gray-800/20 border border-[#1f293d] text-center rounded-xl text-gray-500 text-xs">
                  Sem alertas ou ocorrências registradas na fábrica.
                </div>
              ) : (
                alerts.slice(0, 5).map((a) => {
                  const isWarning = a.tipo === 'warning';
                  const isInfo = a.tipo === 'info';
                  return (
                    <div 
                      key={a.id} 
                      className={`p-3 rounded-lg border text-xs leading-relaxed transition-all ${
                        isWarning 
                          ? 'bg-amber-500/5 border-amber-500/15 text-amber-300' 
                          : isInfo 
                          ? 'bg-blue-500/5 border-blue-500/10 text-blue-300' 
                          : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      <div className="flex justify-between items-start space-x-1">
                        <p>{a.mensagem}</p>
                        <span className="text-[8px] opacity-60 font-mono flex-shrink-0 mt-0.5">{a.data}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('Configurações ERP')}
            className="w-full text-center bg-[#0b0f17] hover:bg-gray-800/80 border border-[#1f293d] hover:border-gray-700 text-gray-400 hover:text-white font-bold text-[10px] p-2.5 rounded-lg uppercase tracking-wider transition-colors flex items-center justify-center space-x-2"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Limpar / Restaurar Dados Fábrica</span>
          </button>
        </div>

      </div>

      {/* Critical Stock list & Quick Action Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Critical Stock Widget */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
            <Boxes className="w-4 h-4 text-purple-400" />
            <span>Materiais Críticos (Abaixo do Mínimo)</span>
          </h3>
          <p className="text-gray-400 text-xs">
            Abastecimento urgente sugerido para os seguintes componentes e materiais de estoque:
          </p>

          <div className="divide-y divide-[#1f293d] pt-2">
            {stock.filter(s => s.qtd <= s.minimo && s.minimo > 0).slice(0, 4).map(s => {
              const p = products.find(prod => prod.id === s.prodId);
              if (!p) return null;
              return (
                <div key={s.prodId} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white">{p.codigo}</span>
                    <p className="text-gray-500 text-[10px]">{p.descricao}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-rose-400 font-bold font-mono">{s.qtd} {p.unidade}</span>
                    <p className="text-[9px] text-gray-500 font-mono">Mínimo: {s.minimo} {p.unidade}</p>
                  </div>
                </div>
              );
            })}
            {stock.filter(s => s.qtd <= s.minimo && s.minimo > 0).length === 0 && (
              <div className="p-4 text-center text-gray-500 text-xs">
                Todos os materiais estão acima do estoque mínimo de segurança!
              </div>
            )}
          </div>
        </div>

        {/* Quick Operations Bento Grid */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <span>Carga Operacional Rápida</span>
          </h3>
          <p className="text-gray-400 text-xs">
            Atalhos para as principais visões do chão de fábrica e faturamento:
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onNavigate('Cadastro de Produtos')}
              className="bg-[#0b0f17] hover:bg-blue-600/10 border border-[#1f293d] hover:border-blue-500/30 p-3 rounded-lg text-left transition-all"
            >
              <span className="block font-bold text-white text-xs">Novo Produto</span>
              <span className="text-[10px] text-gray-500">Cadastrar SKU</span>
            </button>
            <button
              onClick={() => onNavigate('Pedidos de Venda')}
              className="bg-[#0b0f17] hover:bg-emerald-600/10 border border-[#1f293d] hover:border-emerald-500/30 p-3 rounded-lg text-left transition-all"
            >
              <span className="block font-bold text-white text-xs">Nova Venda</span>
              <span className="text-[10px] text-gray-500">Registrar Pedido</span>
            </button>
            <button
              onClick={() => onNavigate('Notas de Entrada')}
              className="bg-[#0b0f17] hover:bg-amber-600/10 border border-[#1f293d] hover:border-amber-500/30 p-3 rounded-lg text-left transition-all"
            >
              <span className="block font-bold text-white text-xs">Importar XML</span>
              <span className="text-[10px] text-gray-500">Nota Fiscal SEFAZ</span>
            </button>
            <button
              onClick={() => onNavigate('Ledger Financeiro')}
              className="bg-[#0b0f17] hover:bg-purple-600/10 border border-[#1f293d] hover:border-purple-500/30 p-3 rounded-lg text-left transition-all"
            >
              <span className="block font-bold text-white text-xs">Ledger Financeiro</span>
              <span className="text-[10px] text-gray-500">Visualizar Fluxo</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
