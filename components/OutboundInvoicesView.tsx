'use client';

import React, { useState, useMemo } from 'react';
import { useErp } from '@/hooks/use-erp';
import { 
  FileText, 
  Search, 
  Printer, 
  ExternalLink, 
  CheckCircle,
  X,
  FileSpreadsheet,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2
} from 'lucide-react';

import { triggerPrint } from "@/lib/print";

export default function OutboundInvoicesView() {
  const { outboundInvoices, contacts, products, printTemplates, appLogo, saveOutboundInvoice } = useErp();

  const [previewMode, setPreviewMode] = useState<'danfe' | 'receipt'>('danfe');

  // Manual Sales Receipt Creation State
  const [isManualReceiptOpen, setIsManualReceiptOpen] = useState(false);
  const [manualClient, setManualClient] = useState('');
  const [manualDate, setManualDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [manualItems, setManualItems] = useState<{ prodId: string; qtd: number; valorUnitario: number }[]>([
    { prodId: '', qtd: 1, valorUnitario: 0 }
  ]);

  const addManualItem = () => {
    setManualItems(prev => [...prev, { prodId: '', qtd: 1, valorUnitario: 0 }]);
  };

  const removeManualItem = (index: number) => {
    setManualItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleManualItemChange = (index: number, field: string, value: any) => {
    setManualItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        const updated = { ...item, [field]: value };
        if (field === 'prodId') {
          const selectedProd = products.find(p => p.id === Number(value));
          if (selectedProd) {
            updated.valorUnitario = selectedProd.precoVenda || selectedProd.valor || 0;
          }
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSaveManualReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualClient) {
      alert("Por favor, selecione um cliente.");
      return;
    }
    const validItems = manualItems.filter(item => item.prodId !== '' && item.qtd > 0);
    if (validItems.length === 0) {
      alert("Adicione pelo menos um produto válido com quantidade.");
      return;
    }

    const parsedItems = validItems.map(item => ({
      prodId: Number(item.prodId),
      qtd: Number(item.qtd),
      valorUnitario: Number(item.valorUnitario)
    }));

    const total = parsedItems.reduce((acc, curr) => acc + (curr.qtd * curr.valorUnitario), 0);

    const invoicePayload = {
      clienteId: Number(manualClient),
      dataEmissao: manualDate,
      valorTotal: total,
      itens: parsedItems,
      pedidoVendaId: 0
    };

    saveOutboundInvoice(invoicePayload);

    // Reset Form
    setManualClient('');
    setManualDate(new Date().toISOString().split('T')[0]);
    setManualItems([{ prodId: '', qtd: 1, valorUnitario: 0 }]);
    setIsManualReceiptOpen(false);
  };

  const handlePrint = (invoice: any) => {
    if (printTemplates['outboundInvoice']) {
      let tpl = printTemplates['outboundInvoice'];
      const contact = contacts.find(c => c.id === invoice.clienteId);
      tpl = tpl.replace(/{{ID}}/g, String(invoice.numero));
      tpl = tpl.replace(/{{DATA}}/g, invoice.dataEmissao);
      tpl = tpl.replace(/{{NOME_CONTATO}}/g, contact ? contact.nome : 'Desconhecido');
      tpl = tpl.replace(/{{TOTAL}}/g, invoice.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
      
      const itemsHtml = invoice.itens.map((it: any) => {
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

      triggerPrint(`DANFE_${invoice.numero}`, tpl);
    } else {
      triggerPrint(`DANFE_${invoice.numero}`);
    }
  };

  const handlePrintReceipt = (invoice: any) => {
    let tpl = '';
    if (printTemplates['receipt']) {
      tpl = printTemplates['receipt'];
    } else {
      tpl = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Recibo de Faturamento</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      color: #333;
      margin: 0;
      padding: 30px;
      line-height: 1.6;
    }
    .print-section {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #000;
      padding: 30px;
      background-color: #fff;
    }
    .header {
      border-bottom: 2px solid #000;
      padding-bottom: 15px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .company-title {
      font-size: 18px;
      font-weight: bold;
    }
    .company-sub {
      font-size: 10px;
      color: #555;
    }
    .receipt-title {
      text-align: right;
    }
    .receipt-title h1 {
      margin: 0;
      font-size: 22px;
      letter-spacing: 1px;
    }
    .receipt-meta {
      display: flex;
      justify-content: space-between;
      background-color: #f9f9f9;
      border: 1px solid #ccc;
      padding: 12px;
      margin-bottom: 25px;
      border-radius: 4px;
    }
    .meta-box span {
      display: block;
      font-size: 8px;
      text-transform: uppercase;
      color: #666;
    }
    .meta-box strong {
      font-size: 13px;
    }
    .declaration {
      font-size: 13px;
      margin-bottom: 25px;
      text-align: justify;
    }
    table.products-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    table.products-table th, table.products-table td {
      border: 1px solid #ddd;
      padding: 8px 10px;
      font-size: 11px;
    }
    table.products-table th {
      background-color: #f2f2f2;
      font-weight: bold;
      text-transform: uppercase;
      text-align: left;
    }
    table.products-table td:nth-child(3) { text-align: center; }
    table.products-table td:nth-child(4) { text-align: right; }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
      gap: 40px;
    }
    .signature-box {
      flex: 1;
      text-align: center;
      border-top: 1px solid #000;
      padding-top: 8px;
      font-size: 11px;
    }
  </style>
</head>
<body>
  <div class="print-section">
    <div class="header">
      <div>
        <div class="company-title">MACORATY INDUSTRIAL ERP</div>
        <div class="company-sub">
          Rua Industrial da Automação, Q-40, Lote 12<br>
          Polo Tecnológico - CEP: 32000-000 | Fone: (31) 3456-7890
        </div>
      </div>
      <div class="receipt-title">
        <h1>RECIBO</h1>
        <div style="font-weight: bold; font-size: 12px;">Nº {{ID}}</div>
      </div>
    </div>

    <div class="receipt-meta">
      <div class="meta-box">
        <span>Valor do Recibo</span>
        <strong>{{TOTAL}}</strong>
      </div>
      <div class="meta-box" style="text-align: right;">
        <span>Data de Emissão</span>
        <strong>{{DATA}}</strong>
      </div>
    </div>

    <div class="declaration">
      Declaramos que recebemos de <strong>{{NOME_CONTATO}}</strong> a importância de <strong>{{TOTAL}}</strong> referente ao faturamento da Nota Fiscal de Saída Nº <strong>{{ID}}</strong>, correspondente aos produtos descritos abaixo, para os quais damos plena, rasa e geral quitação.
    </div>

    <table class="products-table">
      <thead>
        <tr>
          <th>Código</th>
          <th>Descrição do Item</th>
          <th style="text-align: center;">Qtd</th>
          <th style="text-align: right;">Valor Unit.</th>
        </tr>
      </thead>
      <tbody>
        {{ITENS_HTML}}
      </tbody>
    </table>

    <div class="signatures">
      <div class="signature-box">
        <strong>MACORATY INDUSTRIAL ERP LTDA</strong><br>
        Emitente
      </div>
      <div class="signature-box">
        <strong>{{NOME_CONTATO}}</strong><br>
        Recebedor / Destinatário
      </div>
    </div>
  </div>
</body>
</html>`;
    }

    const contact = contacts.find(c => c.id === invoice.clienteId);
    let rendered = tpl;
    rendered = rendered.replace(/{{ID}}/g, String(invoice.numero));
    rendered = rendered.replace(/{{DATA}}/g, invoice.dataEmissao);
    rendered = rendered.replace(/{{NOME_CONTATO}}/g, contact ? contact.nome : 'Desconhecido');
    rendered = rendered.replace(/{{TOTAL}}/g, invoice.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
    
    const itemsHtml = invoice.itens.map((it: any) => {
      const p = products.find(prod => prod.id === it.prodId);
      return `<tr>
        <td>${p?.codigo}</td>
        <td>${p?.descricao}</td>
        <td>${it.qtd}</td>
        <td>${it.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
      </tr>`;
    }).join('');

    rendered = rendered.replace(/{{ITENS_HTML}}/g, itemsHtml);

    if (appLogo) {
      rendered = rendered.replace(/<div class="print-section">/, `<div class="print-section"><div style="text-align:center;margin-bottom:20px;"><img src="${appLogo}" style="max-height:80px;" /></div>`);
    }

    triggerPrint(`RECIBO_${invoice.numero}`, rendered);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isDanfeOpen, setIsDanfeOpen] = useState(false);

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

  const handleOpenDanfe = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsDanfeOpen(true);
  };

  const filteredInvoices = useMemo(() => {
    return outboundInvoices.filter(i => {
      const client = contacts.find(c => c.id === i.clienteId);
      const clientName = client ? client.nome.toLowerCase() : '';
      return clientName.includes(searchTerm.toLowerCase()) || i.chave.includes(searchTerm) || String(i.numero).includes(searchTerm);
    });
  }, [outboundInvoices, contacts, searchTerm]);

  const sortedInvoices = useMemo(() => {
    if (!sortField) return filteredInvoices;
    return [...filteredInvoices].sort((a, b) => {
      let valA = a[sortField as keyof typeof a] ?? "";
      let valB = b[sortField as keyof typeof b] ?? "";

      if (sortField === 'clienteId') {
        const clientA = contacts.find(c => c.id === a.clienteId);
        const clientB = contacts.find(c => c.id === b.clienteId);
        valA = clientA ? clientA.nome : "";
        valB = clientB ? clientB.nome : "";
      }

      if (sortField === 'valorTotal' || sortField === 'numero' || sortField === 'id') {
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
  }, [filteredInvoices, sortField, sortDirection, contacts]);

  return (
    <div className="space-y-6 font-sans animate-fade-in" id="outbound-invoices-view">
      
      {/* Table list */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-[#0f1523] border-b border-[#1f293d] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-white text-xs">Faturamento Expedido (NF-e de Saída)</span>
            <button
              onClick={() => setIsManualReceiptOpen(true)}
              className="bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-400 font-bold text-[10px] px-3 py-1.5 border border-emerald-500/30 rounded-lg transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Recibo Manual</span>
            </button>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Chave de Acesso, Número ou Cliente..."
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg pl-9 pr-4 py-1.5 text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0f1523]/50 border-b border-[#1f293d] text-gray-400 text-[10px] uppercase font-black tracking-wider">
                <th 
                  className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('numero')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Número NF-e</span>
                    {sortField === 'numero' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('chave')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Chave de Acesso SEFAZ</span>
                    {sortField === 'chave' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('clienteId')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Cliente Adquirente</span>
                    {sortField === 'clienteId' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('dataEmissao')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Data Emissão</span>
                    {sortField === 'dataEmissao' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors text-right"
                  onClick={() => toggleSort('valorTotal')}
                >
                  <div className="flex items-center justify-end space-x-1 select-none">
                    <span>Valor Faturado</span>
                    {sortField === 'valorTotal' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-4 text-center select-none">Protocolo SEFAZ</th>
                <th className="py-2.5 px-4 text-center select-none">Ações / Documentos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50 text-gray-300">
              {sortedInvoices.map((i) => {
                const client = contacts.find(c => c.id === i.clienteId);
                return (
                  <tr key={i.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white text-[11px]">
                      Nº {i.numero}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-400 text-[10px]" title={i.chave}>
                      {i.chave.substring(0, 16)}...{i.chave.substring(36)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {client ? client.nome : 'Cliente Não Informado'}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-400">
                      {i.dataEmissao}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-400">
                      {i.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider flex items-center justify-center space-x-1 w-max mx-auto">
                        <CheckCircle className="w-3 h-3" />
                        <span>Homologada</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setPreviewMode('danfe');
                            handleOpenDanfe(i);
                          }}
                          className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold text-[10px] px-2.5 py-1.5 border border-blue-500/20 rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Emitir Nota</span>
                        </button>
                        <button
                          onClick={() => {
                            setPreviewMode('receipt');
                            handleOpenDanfe(i);
                          }}
                          className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 font-bold text-[10px] px-2.5 py-1.5 border border-emerald-500/20 rounded-lg transition-colors flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Emitir Recibo</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">
                    Nenhuma nota fiscal de faturamento emitida ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DANFE Preview Modal (Simulating physical printed receipt layout) */}
      {isDanfeOpen && selectedInvoice && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print-force-light"
          onClick={(e) => { if (e.target === e.currentTarget) setIsDanfeOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl animate-scale-up my-8 print-section">
            
            {/* Modal Header */}
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d] print-hide">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <FileSpreadsheet className="w-4.5 h-4.5 text-blue-400" />
                <span>
                  {previewMode === 'danfe' 
                    ? "Visualizador Auxiliar de NF-e (DANFE Simulado)" 
                    : "Visualizador de Recibo de Faturamento"
                  }
                </span>
              </span>
              <button onClick={() => setIsDanfeOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Print Container Sheet */}
            <div className="p-6 bg-white text-black font-sans leading-tight space-y-4 max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible">
              
              {previewMode === 'danfe' ? (
                <>
                  {/* Receipts of delivery */}
                  <div className="border border-black p-2 text-[9px] flex justify-between items-stretch">
                    <div className="flex-1 border-r border-black pr-2 flex flex-col justify-between">
                      <span>RECEBEMOS DE MACORATY INDUSTRIAL ERP LTDA OS PRODUTOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO</span>
                      <div className="flex justify-between pt-2">
                        <span>DATA DE RECEBIMENTO: _____/_____/_________</span>
                        <span>IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR: __________________________________________________</span>
                      </div>
                    </div>
                    <div className="w-48 pl-2 flex flex-col justify-center items-center text-center">
                      <span className="font-black text-xs">NF-e</span>
                      <span className="font-bold text-sm mt-1">Nº {selectedInvoice.numero}</span>
                      <span className="font-bold text-[8px] uppercase">SÉRIE: 1</span>
                    </div>
                  </div>

                  {/* Header Box (Logo + DANFE + Keys) */}
                  <div className="border border-black flex items-stretch">
                    {/* Logo emitente */}
                    <div className="flex-1 p-3 border-r border-black flex flex-col justify-center">
                      <span className="font-black text-sm block">MACORATY INDUSTRIAL ERP LTDA</span>
                      <span className="text-[9px] block text-gray-700">Rua da Engenharia Avançada, 1000 - Setor Tecnológico</span>
                      <span className="text-[9px] block text-gray-700">CEP: 01311-200 - São Paulo - SP</span>
                      <span className="text-[9px] block text-gray-700">Telefone: (11) 3222-4900 | erp@macoraty.com</span>
                    </div>

                    {/* DANFE center title */}
                    <div className="w-48 p-2 border-r border-black flex flex-col justify-between items-center text-center">
                      <span className="font-black text-xs tracking-wider">DANFE</span>
                      <span className="text-[8px]">Documento Auxiliar da Nota Fiscal Eletrônica</span>
                      <div className="flex justify-between w-full text-[8px] font-bold mt-2">
                        <span>0 - Entrada<br />1 - Saída</span>
                        <span className="border border-black px-2.5 py-1 text-xs font-black self-center">1</span>
                      </div>
                      <span className="font-black text-[10px] mt-2">Nº {selectedInvoice.numero}</span>
                      <span className="text-[8px]">SÉRIE 1 - FOLHA 1/1</span>
                    </div>

                    {/* Keys and Barcodes */}
                    <div className="w-72 p-2 flex flex-col justify-between text-[9px]">
                      <div>
                        <span className="font-bold uppercase text-[7px] block">Controle do Fisco</span>
                        <span className="font-mono text-[8px] block">CHAVE DE ACESSO SEFAZ</span>
                        <span className="font-mono font-bold text-[8px] tracking-wider block break-all select-all text-blue-800">{selectedInvoice.chave}</span>
                      </div>
                      <div className="border-t border-black pt-1.5">
                        <span className="block text-[7px]">Consulta de autenticidade no portal nacional da NF-e www.nfe.fazenda.gov.br/portal ou no site da Sefaz Autorizadora</span>
                      </div>
                    </div>
                  </div>

                  {/* Protocol box */}
                  <div className="border border-black p-2 grid grid-cols-3 gap-2 text-[9px]">
                    <div>
                      <span className="text-[7px] text-gray-600 block">NATUREZA DA OPERAÇÃO</span>
                      <span className="font-bold">VENDA DE PRODUCAO DO ESTABELECIMENTO</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-gray-600 block">PROTOCOLO DE AUTORIZAÇÃO DE USO</span>
                      <span className="font-bold font-mono text-emerald-800">135260029318903 - 25/06/2026 14:45</span>
                    </div>
                    <div>
                      <span className="text-[7px] text-gray-600 block">CNPJ / INSCRIÇÃO ESTADUAL</span>
                      <span className="font-bold">12.345.678/0001-99 | 110.223.334.115</span>
                    </div>
                  </div>

                  {/* Destinatário (Customer) */}
                  <div className="border border-black p-2 space-y-1">
                    <span className="font-bold text-[8px] block uppercase border-b border-gray-300 pb-0.5">Destinatário / Remetente</span>
                    
                    <div className="grid grid-cols-3 gap-2 text-[9px]">
                      <div className="col-span-2">
                        <span className="text-[7px] text-gray-600 block">NOME / RAZÃO SOCIAL</span>
                        <span className="font-bold">{contacts.find(c => c.id === selectedInvoice.clienteId)?.nome || 'Cliente Consumidor'}</span>
                      </div>
                      <div>
                        <span className="text-[7px] text-gray-600 block">CNPJ / CPF</span>
                        <span className="font-bold font-mono">{contacts.find(c => c.id === selectedInvoice.clienteId)?.cnpj || '00.000.000/0001-00'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-[9px] pt-1">
                      <div className="col-span-2">
                        <span className="text-[7px] text-gray-600 block">ENDEREÇO</span>
                        <span>Rua de Entrega de Vendas, 202 - Galpão B</span>
                      </div>
                      <div>
                        <span className="text-[7px] text-gray-600 block">MUNICÍPIO / UF</span>
                        <span>{contacts.find(c => c.id === selectedInvoice.clienteId)?.cidade || 'São Paulo'} - {contacts.find(c => c.id === selectedInvoice.clienteId)?.uf || 'SP'}</span>
                      </div>
                      <div>
                        <span className="text-[7px] text-gray-600 block">TELEFONE / E-MAIL</span>
                        <span>{contacts.find(c => c.id === selectedInvoice.clienteId)?.email || 'vendas@cliente.com'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items List inside DANFE */}
                  <div className="border border-black">
                    <table className="w-full text-left text-[9px] border-collapse">
                      <thead>
                        <tr className="bg-gray-100 border-b border-black text-[7px] font-bold uppercase">
                          <th className="py-1 px-2 border-r border-black">Código SKU</th>
                          <th className="py-1 px-2 border-r border-black">Descrição dos Produtos</th>
                          <th className="py-1 px-2 border-r border-black text-center">NCM</th>
                          <th className="py-1 px-2 border-r border-black text-center">CFOP</th>
                          <th className="py-1 px-2 border-r border-black text-center">UM</th>
                          <th className="py-1 px-2 border-r border-black text-center">Qtd</th>
                          <th className="py-1 px-2 border-r border-black text-right">V. Unitário</th>
                          <th className="py-1 px-2 text-right">Valor Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-300 font-mono">
                        {selectedInvoice.itens.map((item: any, idx: number) => {
                          const p = products.find(prod => prod.id === item.prodId);
                          return (
                            <tr key={idx}>
                              <td className="py-1 px-2 border-r border-black font-bold">{p ? p.codigo : 'SKU'}</td>
                              <td className="py-1 px-2 border-r border-black font-sans text-[8px]">{p ? p.descricao : 'Produto'}</td>
                              <td className="py-1 px-2 border-r border-black text-center">73089010</td>
                              <td className="py-1 px-2 border-r border-black text-center">5101</td>
                              <td className="py-1 px-2 border-r border-black text-center">{p ? p.unidade : 'UN'}</td>
                              <td className="py-1 px-2 border-r border-black text-center font-bold">{item.qtd}</td>
                              <td className="py-1 px-2 border-r border-black text-right">{item.valorUnitario.toLocaleString('pt-BR')}</td>
                              <td className="py-1 px-2 text-right font-bold text-emerald-800">{(item.qtd * item.valorUnitario).toLocaleString('pt-BR')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Total calculations */}
                  <div className="border border-black p-2.5 flex justify-between items-center text-xs font-bold bg-gray-50">
                    <span className="uppercase text-[9px] tracking-wider text-gray-700">VALOR TOTAL DOS PRODUTOS E NOTA FISCAL (DANFE):</span>
                    <span className="text-emerald-800 font-black font-mono text-base">
                      {selectedInvoice.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  {/* RECEIPT VIEW */}
                  <div className="border border-black p-6 space-y-6 text-black bg-white">
                    {/* Header */}
                    <div className="border-b-2 border-black pb-4 flex justify-between items-start">
                      <div>
                        <div className="font-extrabold text-lg text-black">MACORATY INDUSTRIAL ERP</div>
                        <div className="text-[10px] text-gray-600 mt-1">
                          Rua Industrial da Automação, Q-40, Lote 12<br />
                          Polo Tecnológico - CEP: 32000-000 | Fone: (31) 3456-7890
                        </div>
                      </div>
                      <div className="text-right">
                        <h1 className="font-black text-2xl tracking-widest text-black font-serif">RECIBO</h1>
                        <span className="font-bold text-sm block mt-1">Nº {selectedInvoice.numero}</span>
                      </div>
                    </div>

                    {/* Meta info boxes */}
                    <div className="flex justify-between bg-gray-50 border border-gray-300 p-4 rounded">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-gray-500 block">Valor do Recibo</span>
                        <strong className="text-base text-black font-mono">{selectedInvoice.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] uppercase tracking-wider text-gray-500 block">Data de Emissão</span>
                        <strong className="text-sm text-black font-mono">{selectedInvoice.dataEmissao}</strong>
                      </div>
                    </div>

                    {/* Declaration text */}
                    <div className="text-xs text-gray-800 leading-relaxed text-justify">
                      Declaramos que recebemos de <strong className="text-black font-bold">{contacts.find(c => c.id === selectedInvoice.clienteId)?.nome || 'Cliente Consumidor'}</strong> a importância de <strong className="text-black font-bold">{selectedInvoice.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong> referente ao faturamento da Nota Fiscal de Saída Nº <strong className="text-black font-bold">{selectedInvoice.numero}</strong>, correspondente aos produtos descritos abaixo, para os quais damos plena, rasa e geral quitação.
                    </div>

                    {/* Products table */}
                    <div className="border border-black">
                      <table className="w-full text-left text-[10px] border-collapse">
                        <thead>
                          <tr className="bg-gray-100 border-b border-black text-[8px] font-bold uppercase">
                            <th className="py-1.5 px-3 border-r border-black">Código SKU</th>
                            <th className="py-1.5 px-3 border-r border-black">Descrição do Item</th>
                            <th className="py-1.5 px-3 border-r border-black text-center">Qtd</th>
                            <th className="py-1.5 px-3 text-right">Valor Unit.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-300 font-mono text-black">
                          {selectedInvoice.itens.map((item: any, idx: number) => {
                            const p = products.find(prod => prod.id === item.prodId);
                            return (
                              <tr key={idx}>
                                <td className="py-1.5 px-3 border-r border-black font-bold">{p ? p.codigo : 'SKU'}</td>
                                <td className="py-1.5 px-3 border-r border-black font-sans text-[9px]">{p ? p.descricao : 'Produto'}</td>
                                <td className="py-1.5 px-3 border-r border-black text-center font-bold">{item.qtd}</td>
                                <td className="py-1.5 px-3 text-right">{(item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Signatures */}
                    <div className="grid grid-cols-2 gap-8 pt-8">
                      <div className="text-center border-t border-black pt-2">
                        <span className="font-bold text-[11px] block text-black">MACORATY INDUSTRIAL ERP LTDA</span>
                        <span className="text-[9px] text-gray-500 block">Emitente</span>
                      </div>
                      <div className="text-center border-t border-black pt-2">
                        <span className="font-bold text-[11px] block text-black">{contacts.find(c => c.id === selectedInvoice.clienteId)?.nome || 'Cliente Consumidor'}</span>
                        <span className="text-[9px] text-gray-500 block">Recebedor / Destinatário</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#0f1523] border-t border-[#1f293d] flex justify-end space-x-2 print-hide">
              {previewMode === 'danfe' ? (
                <button
                  onClick={() => selectedInvoice && handlePrint(selectedInvoice)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center space-x-1"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir DANFE</span>
                </button>
              ) : (
                <button
                  onClick={() => selectedInvoice && handlePrintReceipt(selectedInvoice)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center space-x-1"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Recibo</span>
                </button>
              )}
              <button
                onClick={() => setIsDanfeOpen(false)}
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs px-4 py-2 rounded-lg"
              >
                Fechar Visualização
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Manual Sales Receipt Modal */}
      {isManualReceiptOpen && (
        <div 
          className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setIsManualReceiptOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up my-8">
            
            {/* Modal Header */}
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d]">
              <span className="font-bold text-sm text-white flex items-center space-x-2">
                <FileText className="w-4.5 h-4.5 text-emerald-400" />
                <span>Criar Recibo de Venda Manual</span>
              </span>
              <button onClick={() => setIsManualReceiptOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveManualReceipt} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cliente */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Cliente / Destinatário</label>
                  <select
                    required
                    value={manualClient}
                    onChange={(e) => setManualClient(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Selecione um cliente...</option>
                    {contacts
                      .filter(c => c.tipo === 'Cliente')
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.nome} ({c.cnpj || 'Sem CNPJ'})</option>
                      ))
                    }
                  </select>
                </div>

                {/* Data Emissao */}
                <div>
                  <label className="block text-[10px] uppercase font-black text-gray-400 mb-1">Data de Emissão</label>
                  <input
                    type="date"
                    required
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="border border-[#1f293d] rounded-lg overflow-hidden bg-[#0b0f17]/30">
                <div className="p-3 bg-[#0b0f17] border-b border-[#1f293d] flex justify-between items-center">
                  <span className="text-[10px] uppercase font-black text-gray-400">Produtos do Recibo</span>
                  <button
                    type="button"
                    onClick={addManualItem}
                    className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Item</span>
                  </button>
                </div>

                <div className="p-3 space-y-3 max-h-[250px] overflow-y-auto">
                  {manualItems.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 bg-[#0b0f17]/80 p-2.5 rounded-lg border border-[#1f293d]/50">
                      {/* Product select */}
                      <div className="flex-1">
                        <select
                          required
                          value={item.prodId}
                          onChange={(e) => handleManualItemChange(index, 'prodId', e.target.value)}
                          className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Selecione o produto...</option>
                          {products.map(p => (
                            <option key={p.id} value={p.id}>[{p.codigo}] - {p.descricao}</option>
                          ))}
                        </select>
                      </div>

                      {/* Qtd */}
                      <div className="w-20">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Qtd"
                          value={item.qtd}
                          onChange={(e) => handleManualItemChange(index, 'qtd', Number(e.target.value))}
                          className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-white text-center focus:outline-none focus:border-blue-500 font-mono font-bold"
                        />
                      </div>

                      {/* Valor unitário */}
                      <div className="w-28">
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          placeholder="Valor Unit."
                          value={item.valorUnitario}
                          onChange={(e) => handleManualItemChange(index, 'valorUnitario', Number(e.target.value))}
                          className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-2.5 py-1.5 text-xs text-white text-right focus:outline-none focus:border-blue-500 font-mono"
                        />
                      </div>

                      {/* Actions */}
                      <button
                        type="button"
                        disabled={manualItems.length === 1}
                        onClick={() => removeManualItem(index)}
                        className="text-gray-500 hover:text-red-400 disabled:opacity-30 disabled:hover:text-gray-500 transition-colors p-1"
                        title="Remover Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Real-time total calculation bar */}
                <div className="p-3 bg-[#0f1523] border-t border-[#1f293d] flex justify-between items-center text-xs font-bold text-white">
                  <span className="uppercase text-[9px] tracking-wider text-gray-400 font-black">Valor Total Estimado:</span>
                  <span className="text-emerald-400 font-black font-mono text-sm">
                    {manualItems
                      .reduce((acc, curr) => acc + ((Number(curr.qtd) || 0) * (Number(curr.valorUnitario) || 0)), 0)
                      .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsManualReceiptOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition-colors flex items-center space-x-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Gerar e Salvar Recibo</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
