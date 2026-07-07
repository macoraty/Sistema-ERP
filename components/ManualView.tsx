"use client";

import React, { useState } from "react";
import { 
  BookOpen, 
  HelpCircle, 
  Layers, 
  FileText, 
  Printer, 
  Code, 
  ArrowRight, 
  CheckCircle, 
  Copy, 
  Check,
  Cpu,
  Package,
  ShoppingCart,
  TrendingUp,
  FileCode
} from "lucide-react";

export default function ManualView() {
  const [activeSubTab, setActiveSubTab] = useState("visao-geral");
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  const handleCopy = (text: string, index: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const templatesExamples = {
    salesOrder: `<!DOCTYPE html>
<` + `html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Pedido de Venda</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #333;
      margin: 0;
      padding: 20px;
      line-height: 1.5;
    }
    .print-section {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      padding: 30px;
      border-radius: 8px;
      background-color: #fff;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    .header-table td {
      border: none;
      padding: 0;
    }
    .logo-container {
      text-align: left;
      vertical-align: middle;
    }
    .title-container {
      text-align: right;
      vertical-align: middle;
    }
    .title-container h1 {
      margin: 0 0 5px 0;
      font-size: 22px;
      color: #1e3a8a;
      text-transform: uppercase;
    }
    .title-container p {
      margin: 0;
      font-size: 11px;
      color: #6b7280;
    }
    .grid {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e5e7eb;
    }
    .grid-col {
      flex: 1;
    }
    .section-title {
      font-size: 10px;
      font-weight: bold;
      color: #1e3a8a;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
    }
    .info-text {
      font-size: 12px;
      margin: 3px 0;
      color: #4b5563;
    }
    .info-text strong {
      color: #111827;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      margin-bottom: 30px;
    }
    th {
      background-color: #f3f4f6;
      color: #1e3a8a;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
      padding: 10px 12px;
      border-bottom: 2px solid #e5e7eb;
      text-align: left;
    }
    th:nth-child(3) { text-align: center; }
    th:nth-child(4) { text-align: right; }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
      color: #4b5563;
    }
    td:nth-child(1) { font-weight: bold; color: #111827; }
    td:nth-child(3) { text-align: center; font-weight: bold; }
    td:nth-child(4) { text-align: right; font-family: monospace; }
    .footer-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 20px;
    }
    .obs-box {
      flex: 1;
      font-size: 11px;
      color: #6b7280;
      background-color: #f9fafb;
      padding: 12px;
      border-radius: 6px;
      margin-right: 30px;
    }
    .total-box {
      width: 240px;
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 15px;
      border-radius: 8px;
      text-align: right;
    }
    .total-box span {
      display: block;
      font-size: 9px;
      color: #1e40af;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .total-box strong {
      font-size: 20px;
      color: #1e3a8a;
      font-family: monospace;
    }
    @media print {
      body { padding: 0; }
      .print-section { border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="print-section">
    <table class="header-table">
      <tr>
        <td class="logo-container">
          <!-- O logotipo carregado em configurações será inserido aqui automaticamente -->
          <div style="font-weight: 900; font-size: 20px; color: #1e3a8a;">MACORATY<span style="color:#2563eb">.ERP</span></div>
        </td>
        <td class="title-container">
          <h1>Pedido de Venda</h1>
          <p>Número do Controle: #{{ID}}</p>
        </td>
      </tr>
    </table>

    <div class="grid">
      <div class="grid-col">
        <div class="section-title">Dados do Adquirente</div>
        <p class="info-text"><strong>Nome/Razão Social:</strong> {{NOME_CONTATO}}</p>
        <p class="info-text"><strong>Destino:</strong> Mercado Interno (Nacional)</p>
        <p class="info-text"><strong>Condição de Faturamento:</strong> Padrão ERP</p>
      </div>
      <div class="grid-col" style="max-width: 250px;">
        <div class="section-title">Cronologia</div>
        <p class="info-text"><strong>Emissão do Pedido:</strong> {{DATA}}</p>
        <p class="info-text"><strong>Documento ID:</strong> PV-00{{ID}}</p>
        <p class="info-text"><strong>Canal de Venda:</strong> Direto ERP</p>
      </div>
    </div>

    <div class="section-title" style="margin-bottom: 5px;">Detalhamento dos Itens do Faturamento</div>
    <div class="items-container">
      {{ITENS_HTML}}
    </div>

    <div class="footer-container">
      <div class="obs-box">
        <strong>Observações do Documento:</strong><br>
        Este documento é uma representação auxiliar do pedido de venda gerado pelo sistema integrado. Todos os impostos e encargos de transporte estão inclusos no montante faturado final.
      </div>
      <div class="total-box">
        <span>Total Líquido da Nota</span>
        <strong>{{TOTAL}}</strong>
      </div>
    </div>
  </div>
</body>
</` + `html>`,
    purchaseOrder: `<!DOCTYPE html>
<` + `html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Pedido de Compra</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      color: #333;
      margin: 0;
      padding: 20px;
      line-height: 1.5;
    }
    .print-section {
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      padding: 30px;
      border-radius: 8px;
      background-color: #fff;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    .header-table td {
      border: none;
      padding: 0;
    }
    .logo-container {
      text-align: left;
      vertical-align: middle;
    }
    .title-container {
      text-align: right;
      vertical-align: middle;
    }
    .title-container h1 {
      margin: 0 0 5px 0;
      font-size: 22px;
      color: #475569;
      text-transform: uppercase;
    }
    .title-container p {
      margin: 0;
      font-size: 11px;
      color: #64748b;
    }
    .grid {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 30px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e2e8f0;
    }
    .grid-col {
      flex: 1;
    }
    .section-title {
      font-size: 10px;
      font-weight: bold;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .info-text {
      font-size: 12px;
      margin: 3px 0;
      color: #475569;
    }
    .info-text strong {
      color: #0f172a;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      margin-bottom: 30px;
    }
    th {
      background-color: #f8fafc;
      color: #475569;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10px;
      letter-spacing: 0.05em;
      padding: 10px 12px;
      border-bottom: 2px solid #e2e8f0;
      text-align: left;
    }
    th:nth-child(3) { text-align: center; }
    th:nth-child(4) { text-align: right; }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 12px;
      color: #475569;
    }
    td:nth-child(1) { font-weight: bold; color: #0f172a; }
    td:nth-child(3) { text-align: center; font-weight: bold; }
    td:nth-child(4) { text-align: right; font-family: monospace; }
    .footer-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-top: 20px;
    }
    .obs-box {
      flex: 1;
      font-size: 11px;
      color: #64748b;
      background-color: #f8fafc;
      padding: 12px;
      border-radius: 6px;
      margin-right: 30px;
      border: 1px solid #f1f5f9;
    }
    .total-box {
      width: 240px;
      background-color: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 15px;
      border-radius: 8px;
      text-align: right;
    }
    .total-box span {
      display: block;
      font-size: 9px;
      color: #475569;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .total-box strong {
      font-size: 20px;
      color: #0f172a;
      font-family: monospace;
    }
    @media print {
      body { padding: 0; }
      .print-section { border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="print-section">
    <table class="header-table">
      <tr>
        <td class="logo-container">
          <div style="font-weight: 900; font-size: 20px; color: #334155;">MACORATY<span style="color:#64748b">.ERP</span></div>
        </td>
        <td class="title-container">
          <h1>Pedido de Compra</h1>
          <p>Ordem de Compra: #{{ID}}</p>
        </td>
      </tr>
    </table>

    <div class="grid">
      <div class="grid-col">
        <div class="section-title">Dados do Fornecedor</div>
        <p class="info-text"><strong>Parceiro Comercial:</strong> {{NOME_CONTATO}}</p>
        <p class="info-text"><strong>Categoria:</strong> Suprimentos de Fábrica</p>
        <p class="info-text"><strong>Condição de Pagamento:</strong> Faturado 30 dias</p>
      </div>
      <div class="grid-col" style="max-width: 250px;">
        <div class="section-title">Dados de Controle</div>
        <p class="info-text"><strong>Data de Emissão:</strong> {{DATA}}</p>
        <p class="info-text"><strong>Documento Ref:</strong> PC-00{{ID}}</p>
        <p class="info-text"><strong>Autorizado por:</strong> Gestão de Suprimentos</p>
      </div>
    </div>

    <div class="section-title" style="margin-bottom: 5px;">Itens Solicitados na Ordem de Fornecimento</div>
    <div class="items-container">
      {{ITENS_HTML}}
    </div>

    <div class="footer-container">
      <div class="obs-box">
        <strong>Instruções de Entrega:</strong><br>
        O fornecedor deverá anexar a Nota Fiscal eletrônica correspondente na entrega. O recebimento é realizado em horário comercial de segunda a sexta-feira.
      </div>
      <div class="total-box">
        <span>Valor Estimado Total</span>
        <strong>{{TOTAL}}</strong>
      </div>
    </div>
  </div>
</body>
</` + `html>`,
    outboundInvoice: `<!DOCTYPE html>
<` + `html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>DANFE - Documento Auxiliar da Nota Fiscal Eletrônica</title>
  <style>
    body {
      font-family: 'Courier New', Courier, monospace;
      color: #000;
      margin: 0;
      padding: 15px;
      font-size: 10px;
      line-height: 1.2;
    }
    .print-section {
      max-width: 850px;
      margin: 0 auto;
      border: 1px solid #000;
      padding: 12px;
      background-color: #fff;
    }
    .border-box {
      border: 1px solid #000;
      margin-bottom: 6px;
      padding: 4px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .header-table td {
      border: 1px solid #000;
      padding: 4px;
      vertical-align: top;
    }
    .title-main {
      font-size: 13px;
      font-weight: bold;
      text-align: center;
      margin-top: 5px;
    }
    .title-sub {
      font-size: 8px;
      text-align: center;
      margin-bottom: 5px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .label {
      font-size: 7px;
      font-weight: bold;
      text-transform: uppercase;
      display: block;
      margin-bottom: 2px;
    }
    .value {
      font-size: 10px;
      font-weight: bold;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      gap: 4px;
      margin-bottom: 6px;
    }
    .col-3 { grid-column: span 3; }
    .col-4 { grid-column: span 4; }
    .col-6 { grid-column: span 6; }
    .col-8 { grid-column: span 8; }
    .col-12 { grid-column: span 12; }
    
    table.products-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      margin-bottom: 6px;
    }
    table.products-table th, table.products-table td {
      border: 1px solid #000;
      padding: 4px;
      font-size: 9px;
    }
    table.products-table th {
      background-color: #eaeaea;
      font-weight: bold;
      text-transform: uppercase;
    }
    table.products-table td:nth-child(3) { text-align: center; }
    table.products-table td:nth-child(4) { text-align: right; font-family: monospace; }
    
    .danfe-footer {
      display: flex;
      justify-content: space-between;
      border-top: 1px dashed #000;
      padding-top: 6px;
      font-size: 8px;
    }
  </style>
</head>
<body>
  <div class="print-section">
    <!-- Controle de Recebimento -->
    <div class="border-box">
      <span class="label">Recebemos de MACORATY ERP os produtos constantes da NF-e indicada ao lado</span>
      <div style="display: flex; justify-content: space-between; margin-top: 4px;">
        <div>DATA DE RECEBIMENTO: ___________________________</div>
        <div>ASSINATURA DO RECEBEDOR: ___________________________</div>
        <div style="font-weight: bold;">NF-e N° {{ID}}</div>
      </div>
    </div>

    <!-- Cabeçalho Principal -->
    <table class="header-table">
      <tr>
        <td style="width: 45%;">
          <div style="font-weight: 900; font-size: 15px;">MACORATY ERP LTDA</div>
          <div style="font-size: 8px; margin-top: 3px;">
            Rua Industrial da Automação, Q-40, Lote 12<br>
            Polo Tecnológico - Contagem - MG - CEP: 32000-000<br>
            FONE: (31) 3456-7890
          </div>
        </td>
        <td style="width: 25%; text-align: center;">
          <div class="title-main">DANFE</div>
          <div class="title-sub">Documento Auxiliar da Nota Fiscal Eletrônica</div>
          <div style="font-size: 8px;">0 - ENTRADA<br>1 - SAÍDA</div>
          <div style="font-size: 13px; font-weight: bold; margin-top: 4px;">1</div>
          <div style="font-weight: bold; margin-top: 4px;">Nº {{ID}}<br>SÉRIE 001</div>
        </td>
        <td style="width: 30%;">
          <span class="label">Controle do Fisco / Chave de Acesso</span>
          <div style="text-align: center; margin-top: 5px;">
            <div style="font-weight: bold; font-size: 12px; letter-spacing: 1px;">3126 0660 4480 8919 3655 0010 000{{ID}}</div>
            <div style="font-size: 7px; margin-top: 5px; color: #444;">Consulta de autenticidade no portal nacional da NF-e</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- Natureza de Operação -->
    <div class="grid">
      <div class="col-8 border-box">
        <span class="label">Natureza de Operação</span>
        <span class="value">VENDA DE MERCADORIA ADQUIRIDA DE TERCEIROS - CFOP 5.102</span>
      </div>
      <div class="col-4 border-box">
        <span class="label">Protocolo de Autorização de Uso</span>
        <span class="value">131260029384912 - 2026-06-27</span>
      </div>
    </div>

    <!-- Destinatário / Remetente -->
    <div class="border-box" style="background: #fdfdfd;">
      <span class="label" style="border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px; font-size: 8px;">Destinatário / Remetente</span>
      <div class="grid">
        <div class="col-8">
          <span class="label">Nome / Razão Social</span>
          <span class="value">{{NOME_CONTATO}}</span>
        </div>
        <div class="col-4">
          <span class="label">CNPJ / CPF</span>
          <span class="value">00.000.000/0001-91</span>
        </div>
      </div>
      <div class="grid" style="margin-bottom: 0;">
        <div class="col-6">
          <span class="label">Endereço</span>
          <span class="value">Área Comercial, 200 - Centro</span>
        </div>
        <div class="col-3">
          <span class="label">Data de Emissão</span>
          <span class="value">{{DATA}}</span>
        </div>
        <div class="col-3">
          <span class="label">Data de Saída</span>
          <span class="value">{{DATA}}</span>
        </div>
      </div>
    </div>

    <!-- Cálculos Adicionais do Imposto -->
    <div class="border-box">
      <span class="label" style="border-bottom: 1px solid #000; padding-bottom: 2px; margin-bottom: 4px; font-size: 8px;">Fatura / Impostos de Referência</span>
      <div style="display: flex; justify-content: space-between; text-align: center;">
        <div style="flex: 1; border-right: 1px solid #eaeaea;">
          <span class="label">Base Cálc ICMS</span>
          <span class="value">R$ 0,00</span>
        </div>
        <div style="flex: 1; border-right: 1px solid #eaeaea;">
          <span class="label">Valor ICMS</span>
          <span class="value">R$ 0,00</span>
        </div>
        <div style="flex: 1; border-right: 1px solid #eaeaea;">
          <span class="label">Base ICMS Subs</span>
          <span class="value">R$ 0,00</span>
        </div>
        <div style="flex: 1; border-right: 1px solid #eaeaea;">
          <span class="label">Valor ICMS Subs</span>
          <span class="value">R$ 0,00</span>
        </div>
        <div style="flex: 1;">
          <span class="label">Total Geral Nota</span>
          <span class="value">{{TOTAL}}</span>
        </div>
      </div>
    </div>

    <!-- Tabela de Produtos -->
    <span class="label" style="margin-top: 10px;">Dados dos Produtos / Serviços constantes da Nota Fiscal</span>
    <div class="items-container">
      {{ITENS_HTML}}
    </div>

    <!-- Rodapé -->
    <div class="danfe-footer">
      <span>MACORATY ERP - Sistema Gerencial Piloto Industrial Integrado de Alto Desempenho</span>
      <span>Impresso em 2026-06-27T12:04:11-07:00</span>
    </div>
  </div>
</body>
</` + `html>`
  };

  return (
    <div className="space-y-6 text-xs text-gray-300">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900/40 via-[#111827] to-[#111827] border border-[#1f293d] rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <BookOpen className="w-40 h-40" />
        </div>
        <div className="max-w-2xl">
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="bg-blue-600/20 text-blue-400 p-2 rounded-lg border border-blue-500/30">
              <BookOpen className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-mono text-xs font-black tracking-widest text-blue-400 uppercase">Documentação Oficial</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Manual do Sistema & Guia de Customização</h1>
          <p className="text-xs text-gray-400 mt-2 leading-relaxed">
            Bem-vindo ao centro de conhecimento do <strong className="text-white">MACORATY.ERP</strong>. Aqui você encontra as instruções de operação de todos os recursos da fábrica, além de um guia técnico para configurar e baixar modelos de impressão 100% personalizados.
          </p>
        </div>
      </div>

      {/* Main Layout: Left Navigation, Right Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2">
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 space-y-1">
            <span className="text-[9px] font-black tracking-widest text-gray-500 uppercase px-2 block mb-2">Sumário do Manual</span>
            
            <button
              onClick={() => setActiveSubTab("visao-geral")}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center space-x-2 transition-all font-bold ${activeSubTab === "visao-geral" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>1. Visão Geral do Sistema</span>
            </button>

            <button
              onClick={() => setActiveSubTab("modulo-vendas")}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center space-x-2 transition-all font-bold ${activeSubTab === "modulo-vendas" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
            >
              <Package className="w-4 h-4 shrink-0" />
              <span>2. Produtos & Vendas</span>
            </button>

            <button
              onClick={() => setActiveSubTab("modulo-mrp")}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center space-x-2 transition-all font-bold ${activeSubTab === "modulo-mrp" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>3. MRP & Cadeia de Compra</span>
            </button>

            <button
              onClick={() => setActiveSubTab("modulo-financeiro")}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center space-x-2 transition-all font-bold ${activeSubTab === "modulo-financeiro" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>4. Estoque & Financeiro</span>
            </button>

            <button
              onClick={() => setActiveSubTab("modelos-impressao")}
              className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center space-x-2 transition-all font-bold ${activeSubTab === "modelos-impressao" ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>5. Modelos de Impressão</span>
            </button>
          </div>

          <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-4 text-[11px] space-y-2.5">
            <span className="font-bold text-white block">Acesso Rápido</span>
            <p className="text-gray-400 leading-relaxed">
              Deseja modificar a logo do cabeçalho ou restaurar os dados iniciais? Acesse a aba <strong className="text-blue-400">Configurações ERP</strong>.
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 bg-[#111827] border border-[#1f293d] rounded-xl p-6 min-h-[500px]">
          
          {/* Sub Tab: Visão Geral */}
          {activeSubTab === "visao-geral" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-blue-400" />
                <span>1. Visão Geral do Sistema MACORATY.ERP</span>
              </h2>
              <div className="border-b border-[#1f293d] pb-4">
                <p className="leading-relaxed text-gray-300">
                  O <strong className="text-white">MACORATY.ERP</strong> é uma plataforma integrada de planejamento e controle de manufatura e suprimentos, projetada especialmente para operar com alta fidelidade de regras de negócios industriais. 
                </p>
                <p className="leading-relaxed text-gray-300 mt-2">
                  Ele resolve de forma coesa desde o cadastro da engenharia de produtos (fórmulas e componentes) até a baixa física de estoques, com faturamentos e conciliação financeira automatizada em tempo real.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-white text-xs uppercase tracking-wider text-blue-400">Fluxo Principal de Trabalho</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0b0f17] border border-[#1f293d] p-3 rounded-lg space-y-2">
                    <div className="text-blue-400 font-bold font-mono text-xs">Etapa 1: Vendas</div>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      Lançamento de novos Pedidos de Venda demandados por Clientes. Estes pedidos reservam estoque provisório.
                    </p>
                  </div>
                  <div className="bg-[#0b0f17] border border-[#1f293d] p-3 rounded-lg space-y-2">
                    <div className="text-blue-400 font-bold font-mono text-xs">Etapa 2: MRP & Engenharia</div>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      O MRP varre os pedidos, explode a BOM (árvore do produto), calcula estoques virtuais e gera necessidades de compra.
                    </p>
                  </div>
                  <div className="bg-[#0b0f17] border border-[#1f293d] p-3 rounded-lg space-y-2">
                    <div className="text-blue-400 font-bold font-mono text-xs">Etapa 3: Execução</div>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      Pedidos de compra geram Notas de Entrada (XML) que alimentam estoques, permitindo faturar vendas e gerar notas fiscais (DANFE).
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-950/20 border border-blue-900/30 rounded-xl space-y-1">
                <h4 className="font-bold text-white text-xs">Dica de Navegação:</h4>
                <p className="text-gray-400 leading-relaxed text-[11px]">
                  Ao clicar no logotipo <strong className="text-white font-mono">MACORATY.ERP</strong> no canto superior ou lateral esquerdo, o sistema redireciona você instantaneamente de volta ao Dashboard principal.
                </p>
              </div>
            </div>
          )}

          {/* Sub Tab: Produtos & Vendas */}
          {activeSubTab === "modulo-vendas" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-400" />
                <span>2. Engenharia de Produtos & Vendas</span>
              </h2>
              
              <div className="space-y-3">
                <div className="border-b border-[#1f293d] pb-3">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-blue-400">Cadastro de Produtos</h3>
                  <p className="text-gray-300 leading-relaxed mt-1">
                    Todos os itens de estoque (matérias-primas e produtos acabados) devem ser cadastrados com códigos SKU exclusivos, descrições detalhadas, unidade de medida (como UN, KG, MT) e tipo de item (Fabricado ou Comprado).
                  </p>
                </div>

                <div className="border-b border-[#1f293d] pb-3">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-blue-400">Estrutura de Produtos (BOM)</h3>
                  <p className="text-gray-300 leading-relaxed mt-1">
                    A Bill of Materials (BOM) representa a &quot;receita&quot; do produto fabricado. Nela, você define quais componentes e matérias-primas e em quais quantidades são consumidos na produção de 1 unidade do produto pai. O sistema suporta cópias de estruturas e atualização de insumos em tempo real.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-blue-400">Pedidos de Venda</h3>
                  <p className="text-gray-300 leading-relaxed mt-1">
                    Representam o compromisso de faturamento comercial com os Clientes cadastrados:
                  </p>
                  <ul className="list-disc pl-5 text-gray-400 text-[11px] mt-1 space-y-1">
                    <li><strong className="text-gray-300">Reserva de Estoque:</strong> Ao lançar um pedido, o sistema reserva os produtos correspondentes para que o MRP tome conhecimento.</li>
                    <li><strong className="text-gray-300">Faturamento Real:</strong> Ao clicar em &quot;Faturar&quot;, a saída de estoque físico é confirmada, gerando um registro financeiro de contas a receber e uma Nota de Saída (DANFE).</li>
                    <li><strong className="text-gray-300">Previsão de Despacho:</strong> Controle as datas de entrega de cada venda em aberto.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: MRP & Compras */}
          {activeSubTab === "modulo-mrp" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <span>3. Algoritmo MRP & Processo de Compras</span>
              </h2>

              <div className="space-y-3">
                <div className="border-b border-[#1f293d] pb-3">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-blue-400">O Algoritmo MRP</h3>
                  <p className="text-gray-300 leading-relaxed mt-1">
                    O Material Requirements Planning (Planejamento de Necessidades de Materiais) é o coração inteligente do ERP:
                  </p>
                  <p className="text-gray-300 leading-relaxed mt-2">
                    Ele analisa a demanda de produtos acabados nos Pedidos de Venda e, através da estrutura BOM, explode a quantidade requerida de cada insumo. O cálculo cruza a demanda total necessária com o <strong className="text-white">Estoque Físico Atual</strong> e <strong className="text-white">Ordens de Compra Pendentes</strong> para calcular a necessidade real líquida de aquisição sem gerar excesso de estoque.
                  </p>
                </div>

                <div className="border-b border-[#1f293d] pb-3">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-blue-400">Necessidades de Compra</h3>
                  <p className="text-gray-300 leading-relaxed mt-1">
                    Compiladas automaticamente pelo MRP, essas necessidades podem ser aglutinadas em cotações e de forma direta em Pedidos de Compra.
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-blue-400">Importação de XML de Entrada</h3>
                  <p className="text-gray-300 leading-relaxed mt-1">
                    Para agilizar o recebimento físico e fiscal, você pode colar ou carregar o arquivo XML de Nota Fiscal emitido pelo seu fornecedor. O sistema lê as tags XML, identifica os itens e quantidades, faz o vínculo inteligente de códigos e dá entrada automática no estoque físico com lançamento de contas a pagar.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: Estoque & Financeiro */}
          {activeSubTab === "modulo-financeiro" && (
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                <span>4. Controle de Estoque & Ledger Financeiro</span>
              </h2>

              <div className="space-y-3">
                <div className="border-b border-[#1f293d] pb-3">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-blue-400">Controle de Estoque</h3>
                  <p className="text-gray-300 leading-relaxed mt-1">
                    O sistema mantém a rastreabilidade exata do estoque atual de cada SKU:
                  </p>
                  <ul className="list-disc pl-5 text-gray-400 text-[11px] mt-1 space-y-1">
                    <li><strong className="text-gray-300">Lançamentos Manuais:</strong> Permite efetuar acertos de inventário (entradas e saídas avulsas) registrando o motivo e o valor de custo.</li>
                    <li><strong className="text-gray-300">Baixa Automatizada:</strong> Processada automaticamente no faturamento de vendas ou no recebimento de XMLs de fornecedor.</li>
                    <li><strong className="text-gray-300">Ponto de Ressuprimento (Estoque Mínimo):</strong> O ERP gera alertas imediatos no cabeçalho caso algum item atinja o nível crítico.</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-blue-400">Ledger Financeiro Integrado</h3>
                  <p className="text-gray-300 leading-relaxed mt-1">
                    Todas as transações operacionais possuem reflexo no caixa corporativo:
                  </p>
                  <ul className="list-disc pl-5 text-gray-400 text-[11px] mt-1 space-y-1">
                    <li><strong className="text-gray-300">Receitas:</strong> Geradas no faturamento dos Pedidos de Venda.</li>
                    <li><strong className="text-gray-300">Despesas:</strong> Registradas na aprovação de Notas Fiscais de Entrada de Fornecedor.</li>
                    <li><strong className="text-gray-300">Fluxo de Caixa:</strong> Permite lançamentos financeiros manuais de receitas/despesas adicionais (como energia, salários, aluguel) com gráficos consolidados de saldo geral e rentabilidade líquida da operação.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Sub Tab: Modelos de Impressão */}
          {activeSubTab === "modelos-impressao" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <span>5. Customização e Códigos dos Modelos de Impressão</span>
              </h2>

              <p className="text-gray-300 leading-relaxed">
                O ERP possui suporte para **Modelos de Impressão Customizados (HTML/CSS)**. Se você habilitar um modelo nas configurações, o sistema passará a renderizar os relatórios impressos utilizando a sua estrutura HTML específica em vez do layout padrão.
              </p>

              {/* Placeholders Table */}
              <div className="bg-[#0b0f17] border border-[#1f293d] rounded-xl overflow-hidden">
                <div className="p-3 bg-[#0f1523] border-b border-[#1f293d]">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider">Marcadores de Substituição (Placeholders)</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Use esses códigos exatos no seu código HTML para que o ERP substitua pelas informações reais do documento.</p>
                </div>
                <div className="p-3 text-[11px] divide-y divide-[#1f293d]/50 space-y-2">
                  <div className="grid grid-cols-4 gap-2 pt-1 pb-1">
                    <span className="font-mono font-bold text-blue-400">{"{{ID}}"}</span>
                    <span className="col-span-3 text-gray-300">Código de identificação exclusivo (Número do Pedido de Venda, Pedido de Compra ou Número da Nota DANFE).</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-2 pb-1">
                    <span className="font-mono font-bold text-blue-400">{"{{DATA}}"}</span>
                    <span className="col-span-3 text-gray-300">Data de emissão oficial do documento (ex: 27/06/2026).</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-2 pb-1">
                    <span className="font-mono font-bold text-blue-400">{"{{NOME_CONTATO}}"}</span>
                    <span className="col-span-3 text-gray-300">Nome completo ou razão social do Cliente ou do Fornecedor envolvido na transação.</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-2 pb-1">
                    <span className="font-mono font-bold text-blue-400">{"{{TOTAL}}"}</span>
                    <span className="col-span-3 text-gray-300">O valor total bruto final, já formatado em moeda brasileira (ex: R$ 12.500,00).</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-2 pb-1">
                    <span className="font-mono font-bold text-blue-400">{"{{ITENS_HTML}}"}</span>
                    <span className="col-span-3 text-gray-300">Gera automaticamente uma tabela de itens HTML contendo as colunas de Código SKU, Descrição, Quantidade e Preço Unitário.</span>
                  </div>
                </div>
              </div>

              {/* Ready-to-use Code Snippets with Copy Buttons */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-[#1f293d] pb-2">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wider text-blue-400">Modelos Oficiais de Download (Padrão Comercial)</h3>
                  <span className="text-[10px] text-gray-400">Copie o código-fonte abaixo para customizar offline</span>
                </div>

                {/* Example 1: Sales Order */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-[#0b0f17] px-4 py-2 border border-[#1f293d] rounded-t-lg">
                    <span className="font-mono text-[11px] font-bold text-white flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-400" />
                      <span>Modelo de Pedido de Venda (sales_order_template.html)</span>
                    </span>
                    <button
                      onClick={() => handleCopy(templatesExamples.salesOrder, "sales")}
                      className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center space-x-1 transition-colors"
                    >
                      {copiedIndex === "sales" ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-[#0b0f17]/60 border-l border-r border-b border-[#1f293d] p-3 rounded-b-lg font-mono text-[10px] text-gray-400 max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{templatesExamples.salesOrder}</pre>
                  </div>
                </div>

                {/* Example 2: Purchase Order */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-[#0b0f17] px-4 py-2 border border-[#1f293d] rounded-t-lg">
                    <span className="font-mono text-[11px] font-bold text-white flex items-center space-x-1.5">
                      <ShoppingCart className="w-3.5 h-3.5 text-slate-400" />
                      <span>Modelo de Pedido de Compra (purchase_order_template.html)</span>
                    </span>
                    <button
                      onClick={() => handleCopy(templatesExamples.purchaseOrder, "purchase")}
                      className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center space-x-1 transition-colors"
                    >
                      {copiedIndex === "purchase" ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-[#0b0f17]/60 border-l border-r border-b border-[#1f293d] p-3 rounded-b-lg font-mono text-[10px] text-gray-400 max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{templatesExamples.purchaseOrder}</pre>
                  </div>
                </div>

                {/* Example 3: DANFE */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-[#0b0f17] px-4 py-2 border border-[#1f293d] rounded-t-lg">
                    <span className="font-mono text-[11px] font-bold text-white flex items-center space-x-1.5">
                      <FileCode className="w-3.5 h-3.5 text-yellow-400" />
                      <span>Modelo de DANFE Fiscal (danfe_outbound_invoice.html)</span>
                    </span>
                    <button
                      onClick={() => handleCopy(templatesExamples.outboundInvoice, "danfe")}
                      className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded font-bold flex items-center space-x-1 transition-colors"
                    >
                      {copiedIndex === "danfe" ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar Código</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-[#0b0f17]/60 border-l border-r border-b border-[#1f293d] p-3 rounded-b-lg font-mono text-[10px] text-gray-400 max-h-40 overflow-y-auto">
                    <pre className="whitespace-pre-wrap">{templatesExamples.outboundInvoice}</pre>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

    </div>
  );
}
