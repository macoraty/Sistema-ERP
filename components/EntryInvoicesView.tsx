'use client';

import React, { useState, useMemo } from 'react';
import { useErp } from '@/hooks/use-erp';
import { 
  FileCheck, 
  Upload, 
  Search, 
  FileCode, 
  Sparkles, 
  Info,
  CheckCircle,
  Eye,
  X,
  FileText,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { triggerPrint } from "@/lib/print";

export default function EntryInvoicesView() {
  const { entryInvoices, contacts, products, importXmlInvoice } = useErp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [customXml, setCustomXml] = useState('');
  const [isImporterOpen, setIsImporterOpen] = useState(false);

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

  // 3 Authentic Simulated SEFAZ XML Templates for quick 1-click importing
  const xmlTemplates = useMemo(() => {
    return [
      {
        title: 'NF-e 049811 - GERDAU S.A. (Aço Carbono)',
        description: 'Fornecimento de Bobinas e Chapas de Aço AISI 1020.',
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35200322238473000103550010000498111000498115" versao="4.00">
      <ide>
        <nNF>49811</nNF>
        <dhEmi>2026-06-25T14:30:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>33333333000103</CNPJ>
        <xNome>GERDAU ACOSMINAS S/A</xNome>
      </emit>
      <dest>
        <CNPJ>12345678000199</CNPJ>
        <xNome>MACORATY INDUSTRIAL ERP LTDA</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>MP-ACO-3MM</cProd>
          <xProd>Chapa de Aco Carbono AISI 1020 3.0mm</xProd>
          <uCom>UN</uCom>
          <qCom>150.0000</qCom>
          <vUnCom>120.0000</vUnCom>
          <vProd>18000.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>MP-PERFIL-U</cProd>
          <xProd>Perfil U Dobrado 100x40x3.0mm 6 Metros</xProd>
          <uCom>UN</uCom>
          <qCom>80.0000</qCom>
          <vUnCom>250.0000</vUnCom>
          <vProd>20000.00</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vProd>38000.00</vProd>
          <vNF>38000.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`
      },
      {
        title: 'NF-e 081290 - SIEMENS ENERGY (Painéis & Bornes)',
        description: 'Material elétrico para automação de painéis pneumáticos.',
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35200344444444000104550010000812901000812907" versao="4.00">
      <ide>
        <nNF>81290</nNF>
        <dhEmi>2026-06-25T11:15:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>44444444000104</CNPJ>
        <xNome>SIEMENS ENERGY BRASIL LTDA</xNome>
      </emit>
      <dest>
        <CNPJ>12345678000199</CNPJ>
        <xNome>MACORATY INDUSTRIAL ERP LTDA</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>MP-DISJ-3P</cProd>
          <xProd>Disjuntor Caixa Moldada 3P 100A</xProd>
          <uCom>UN</uCom>
          <qCom>35.0000</qCom>
          <vUnCom>450.0000</vUnCom>
          <vProd>15750.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>MP-CABO-6MM</cProd>
          <xProd>Cabo Cobre Flexivel Flex 6mm Preto 750V 100m</xProd>
          <uCom>UN</uCom>
          <qCom>15.0000</qCom>
          <vUnCom>180.0000</vUnCom>
          <vProd>2700.00</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vProd>18450.00</vProd>
          <vNF>18450.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`
      },
      {
        title: 'NF-e 003492 - FASTENAL BRASIL (Fixadores)',
        description: 'Fornecimento de parafusos de inox e pinos de centragem.',
        xml: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35200355555555000105550010000034921000034929" versao="4.00">
      <ide>
        <nNF>3492</nNF>
        <dhEmi>2026-06-25T09:00:00-03:00</dhEmi>
      </ide>
      <emit>
        <CNPJ>55555555000105</CNPJ>
        <xNome>FASTENAL DO BRASIL LTDA</xNome>
      </emit>
      <dest>
        <CNPJ>12345678000199</CNPJ>
        <xNome>MACORATY INDUSTRIAL ERP LTDA</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>MP-PAR-M8</cProd>
          <xProd>Parafuso Sextavado M8 x 40mm Inox AISI 304</xProd>
          <uCom>UN</uCom>
          <qCom>1200.0000</qCom>
          <vUnCom>0.8500</vUnCom>
          <vProd>1020.00</vProd>
        </prod>
      </det>
      <det nItem="2">
        <prod>
          <cProd>MP-PIN-8MM</cProd>
          <xProd>Pino de Centragem Retificado 8mm x 30mm</xProd>
          <uCom>UN</uCom>
          <qCom>500.0000</qCom>
          <vUnCom>2.2000</vUnCom>
          <vProd>1100.00</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vProd>2120.00</vProd>
          <vNF>2120.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`
      }
    ];
  }, []);

  const parsedXml = useMemo(() => {
    if (!customXml.trim()) return null;
    try {
      const getTagContent = (tag: string, text: string): string => {
        const regex = new RegExp(`<([^>:]+:)?${tag}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/([^>:]+:)?${tag}>`, "i");
        const match = text.match(regex);
        return match ? match[2].trim() : "";
      };

      const cnpfEmit = getTagContent("CNPJ", customXml);
      const nameEmit = getTagContent("xNome", customXml);
      let nNF = getTagContent("nNF", customXml);
      if (!nNF) {
        nNF = getTagContent("numero", customXml) || getTagContent("nRef", customXml) || "";
      }
      const chNFe = getTagContent("chNFe", customXml) || "";

      let dEmi = getTagContent("dhEmi", customXml) || getTagContent("dEmi", customXml);
      if (dEmi && dEmi.includes("T")) dEmi = dEmi.split("T")[0];
      let dateEmi = "Hoje";
      if (dEmi) {
        const dParts = dEmi.split("-");
        if (dParts.length === 3) {
          dateEmi = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;
        }
      }

      const items: { cProd: string; xProd: string; uCom: string; qCom: number; vUnCom: number; vProd: number }[] = [];
      const prodRegex = /<([^>:]+:)?prod(?:\s+[^>]*)?>([\s\S]*?)<\/([^>:]+:)?prod>/gi;
      let match;
      let calculatedTotal = 0;

      while ((match = prodRegex.exec(customXml)) !== null) {
        const prodBlock = match[2];
        const cProd = getTagContent("cProd", prodBlock);
        const xProd = getTagContent("xProd", prodBlock);
        
        const qComRaw = getTagContent("qCom", prodBlock);
        const qCom = parseFloat(qComRaw.replace(",", ".")) || 1;
        
        const vUnComRaw = getTagContent("vUnCom", prodBlock);
        const vUnCom = parseFloat(vUnComRaw.replace(",", ".")) || 0;
        
        const vProdRaw = getTagContent("vProd", prodBlock);
        const vProd = parseFloat(vProdRaw.replace(",", ".")) || qCom * vUnCom;

        calculatedTotal += vProd;

        items.push({
          cProd,
          xProd,
          uCom: getTagContent("uCom", prodBlock) || "UN",
          qCom,
          vUnCom,
          vProd
        });
      }

      const totalStr = getTagContent("vNF", customXml) || "0";
      const total = parseFloat(totalStr.replace(",", ".")) || calculatedTotal;

      return {
        nNF,
        chNFe,
        cnpfEmit: cnpfEmit || "00.000.000/0000-00",
        nameEmit: nameEmit || "Fornecedor XML Importado",
        dateEmi,
        items,
        total
      };
    } catch (e) {
      return null;
    }
  }, [customXml]);

  const handleXmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      setCustomXml(text);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (!customXml.trim()) {
      alert("Nenhum XML carregado.");
      return;
    }
    const success = importXmlInvoice(customXml);
    if (success) {
      setCustomXml('');
      setIsImporterOpen(false);
    } else {
      alert("Erro ao importar a nota fiscal. Verifique a estrutura do arquivo XML.");
    }
  };

  const handleOpenViewModal = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const filteredInvoices = useMemo(() => {
    return entryInvoices.filter(i => {
      const supplier = contacts.find(c => c.id === i.fornecedorId);
      const supplierName = supplier ? supplier.nome.toLowerCase() : '';
      return supplierName.includes(searchTerm.toLowerCase()) || i.chave.includes(searchTerm) || String(i.numero).includes(searchTerm);
    });
  }, [entryInvoices, contacts, searchTerm]);

  const sortedInvoices = useMemo(() => {
    if (!sortField) return filteredInvoices;
    return [...filteredInvoices].sort((a, b) => {
      let valA = a[sortField as keyof typeof a] ?? "";
      let valB = b[sortField as keyof typeof b] ?? "";

      if (sortField === 'fornecedorId') {
        const supplierA = contacts.find(c => c.id === a.fornecedorId);
        const supplierB = contacts.find(c => c.id === b.fornecedorId);
        valA = supplierA ? supplierA.nome : "";
        valB = supplierB ? supplierB.nome : "";
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
    <div className="space-y-6 font-sans animate-fade-in" id="entry-invoices-view">
      
      {/* SEFAZ XML Importer trigger panel */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-400 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Portabilidade SEFAZ Autônoma</span>
          </div>
          <h3 className="text-sm font-black text-white">Importação Automática de XML de Nota Fiscal (NF-e)</h3>
          <p className="text-xs text-gray-400">
            Realize o upload ou cole o arquivo XML emitido pelo fornecedor. O ERP cadastra automaticamente os produtos novos, aumenta o estoque físico e gera o passivo em Contas a Pagar.
          </p>
        </div>

        <button
          onClick={() => setIsImporterOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-1.5 shadow transition-all hover:scale-[1.01]"
        >
          <Upload className="w-4 h-4" />
          <span>Importar XML SEFAZ</span>
        </button>
      </div>

      {/* Invoices List */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 bg-[#0f1523] border-b border-[#1f293d] flex justify-between items-center">
          <span className="font-bold text-white text-xs">Histórico de Notas Fiscais de Entrada Cadastradas</span>
          <div className="relative w-72">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Chave de Acesso, Número ou Fornecedor..."
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
                  onClick={() => toggleSort('fornecedorId')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Fornecedor</span>
                    {sortField === 'fornecedorId' ? (
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
                    <span>Valor Total Nota</span>
                    {sortField === 'valorTotal' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th className="py-2.5 px-4 text-center select-none">Status Receita</th>
                <th className="py-2.5 px-4 text-center select-none">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50 text-gray-300">
              {sortedInvoices.map((i) => {
                const supplier = contacts.find(c => c.id === i.fornecedorId);
                return (
                  <tr key={i.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white text-[11px]">
                      Nº {i.numero}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-400 text-[10px]" title={i.chave}>
                      {i.chave.substring(0, 16)}...{i.chave.substring(36)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">
                      {supplier ? supplier.nome : 'Fornecedor Cadastrado'}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-400">
                      {i.dataEmissao}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-emerald-400">
                      {i.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider">
                        Autorizada
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleOpenViewModal(i)}
                        className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                        title="Visualizar Itens NF-e"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 font-medium">
                    Nenhuma nota fiscal de entrada registrada no sistema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* XML Importer Modal (File Select + Dynamic Live Preview) */}
      {isImporterOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsImporterOpen(false) }}
        >
          <div className={`bg-[#111827] border border-[#1f293d] rounded-xl w-full ${parsedXml ? 'max-w-4xl' : 'max-w-xl'} overflow-hidden shadow-2xl animate-scale-up transition-all duration-300`}>
            
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d]">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <FileCode className="w-4 h-4 text-blue-400" />
                <span>Importador SEFAZ XML de Entrada</span>
              </h3>
              <button 
                onClick={() => {
                  setIsImporterOpen(false);
                  setCustomXml('');
                }} 
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              
              {/* File Select & Upload Section */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#1f293d] rounded-xl p-6 bg-[#0b0f17]/40 text-center hover:border-blue-500/50 transition-colors relative group">
                <input
                  type="file"
                  accept=".xml"
                  onChange={handleXmlFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-blue-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-white block">Arraste ou Selecione o Arquivo XML da Nota</span>
                <p className="text-[10px] text-gray-400 mt-1">Carregue arquivos XML padrão SEFAZ para fazer o processamento automático.</p>
                
                <div className="mt-3 flex items-center space-x-2">
                  <span className="text-[10px] text-gray-500">Ou</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (xmlTemplates && xmlTemplates.length > 0) {
                        setCustomXml(xmlTemplates[0].xml);
                      }
                    }}
                    className="text-[10px] bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-medium transition-colors relative z-10"
                  >
                    ⚡ Carregar Exemplo de Teste (Gerdau)
                  </button>
                </div>
              </div>

              {/* Dynamic Live Preview Area */}
              {parsedXml ? (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Headers Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Fornecedor Card */}
                    <div className="bg-[#0b0f17] border border-[#1f293d] rounded-lg p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider">Fornecedor (Emitente)</span>
                        {(() => {
                          const existingSupplier = contacts.find(
                            (c) =>
                              c.tipo === "Fornecedor" &&
                              parsedXml.cnpfEmit &&
                              c.cnpj.replace(/\D/g, "") === parsedXml.cnpfEmit.replace(/\D/g, "")
                          );
                          return existingSupplier ? (
                            <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[9px] font-bold uppercase select-none">
                              ✓ Cadastrado
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-[9px] font-bold uppercase select-none animate-pulse">
                              🆕 Novo Fornecedor (Será Cadastrado)
                            </span>
                          );
                        })()}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white font-mono uppercase">{parsedXml.nameEmit}</h4>
                        <p className="text-[10px] text-gray-400 font-mono">CNPJ: {parsedXml.cnpfEmit}</p>
                      </div>
                    </div>

                    {/* NF-e Metadata Card */}
                    <div className="bg-[#0b0f17] border border-[#1f293d] rounded-lg p-4 space-y-2">
                      <span className="text-[9px] font-black uppercase text-gray-500 tracking-wider block">Dados do Documento</span>
                      <div className="grid grid-cols-3 gap-2 text-left">
                        <div>
                          <span className="text-[8px] uppercase text-gray-500 block">Número</span>
                          <span className="text-xs font-bold font-mono text-white">NF-e #{parsedXml.nNF}</span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase text-gray-500 block">Emissão</span>
                          <span className="text-xs font-bold font-mono text-white">{parsedXml.dateEmi}</span>
                        </div>
                        <div>
                          <span className="text-[8px] uppercase text-gray-500 block">Valor Total</span>
                          <span className="text-xs font-bold font-mono text-emerald-400">
                            {parsedXml.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-[#1f293d]/50">
                        <span className="text-[8px] uppercase text-gray-500 block">Chave de Acesso</span>
                        <span className="text-[9px] font-mono text-gray-400 truncate block max-w-xs">{parsedXml.chNFe || 'Não Informada'}</span>
                      </div>
                    </div>

                  </div>

                  {/* Items Table */}
                  <div className="border border-[#1f293d] rounded-lg overflow-hidden">
                    <div className="bg-[#0b0f17] px-4 py-2 border-b border-[#1f293d] flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Itens da Nota Fiscal</span>
                      <span className="text-[9px] text-gray-500 font-mono">{parsedXml.items.length} item(ns) localizados</span>
                    </div>
                    <div className="max-h-[220px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-[#0b0f17]/50 text-gray-400 font-bold border-b border-[#1f293d]">
                            <th className="py-2 px-3 font-mono text-[9px] uppercase">Código XML</th>
                            <th className="py-2 px-3">Insumo / Descrição</th>
                            <th className="py-2 px-3 text-center">Un</th>
                            <th className="py-2 px-3 text-right">Qtd</th>
                            <th className="py-2 px-3 text-right">Unitário</th>
                            <th className="py-2 px-3 text-right">Total</th>
                            <th className="py-2 px-3 text-center">Associação no ERP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1f293d]">
                          {parsedXml.items.map((item, idx) => {
                            const existingProduct = products.find(
                              (p) => 
                                p.codigo.toLowerCase() === item.cProd.toLowerCase() || 
                                (p.codigoFornecedor && p.codigoFornecedor.toLowerCase() === item.cProd.toLowerCase()) ||
                                (p.codigoFornecedor2 && p.codigoFornecedor2.toLowerCase() === item.cProd.toLowerCase()) ||
                                (p.codigoFornecedor3 && p.codigoFornecedor3.toLowerCase() === item.cProd.toLowerCase()) ||
                                (p.codigoFornecedor4 && p.codigoFornecedor4.toLowerCase() === item.cProd.toLowerCase())
                            );

                            return (
                              <tr key={idx} className="hover:bg-gray-800/20">
                                <td className="py-2 px-3 font-mono text-[10px] text-gray-400">{item.cProd}</td>
                                <td className="py-2 px-3 font-bold text-white max-w-[350px] truncate" title={item.xProd}>{item.xProd}</td>
                                <td className="py-2 px-3 text-center font-mono text-[10px] text-gray-400">{item.uCom}</td>
                                <td className="py-2 px-3 text-right font-mono text-gray-300">{item.qCom.toLocaleString('pt-BR')}</td>
                                <td className="py-2 px-3 text-right font-mono text-gray-300">{item.vUnCom.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="py-2 px-3 text-right font-mono text-gray-300">{item.vProd.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                <td className="py-2 px-3 text-center">
                                  {existingProduct ? (
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      ✓ Associado ao SKU {existingProduct.codigo}
                                    </span>
                                  ) : (
                                    <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                      ⚠️ Novo (Sob Revisão)
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Warning Note */}
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 flex items-start space-x-2 text-[10px] text-amber-400 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                    <div>
                      <strong className="font-bold">INFORMAÇÃO IMPORTANTE:</strong> Insumos não cadastrados receberão a etiqueta <span className="underline font-mono">{'⚠️ Sob Revisão'}</span> e serão salvos no ERP. Você poderá revisar, alterar o SKU interno e os dados desses itens na tela de <strong className="font-bold">Cadastro de Itens</strong> antes de homologá-los em definitivo.
                    </div>
                  </div>

                </div>
              ) : (
                <div className="py-12 text-center text-gray-500 flex flex-col items-center justify-center space-y-2">
                  <FileCode className="w-10 h-10 text-gray-700 animate-pulse" />
                  <span className="text-xs font-semibold">Nenhum XML Carregado</span>
                  <p className="text-[10px] text-gray-600 max-w-xs leading-normal">
                    Por favor, faça o upload de um arquivo XML da NF-e padrão para ver o resumo dos dados e validar o lote antes de confirmar a importação física.
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between items-center pt-3 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => {
                    setCustomXml('');
                  }}
                  disabled={!parsedXml}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${parsedXml ? 'border-red-500/20 hover:bg-red-500/10 text-red-400 cursor-pointer shadow-sm' : 'border-[#1f293d] text-gray-600 cursor-not-allowed'}`}
                >
                  Limpar Arquivo
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImporterOpen(false);
                      setCustomXml('');
                    }}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-2 rounded-lg text-xs transition-colors"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={!parsedXml}
                    className={`font-bold px-4 py-2 rounded-lg text-xs transition-colors ${parsedXml ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer shadow-md shadow-blue-600/10' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
                  >
                    Confirmar e Importar Nota Fiscal
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* View Invoice Details Modal */}
      {isViewModalOpen && selectedInvoice && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print-force-light"
          onClick={(e) => { if (e.target === e.currentTarget) setIsViewModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-4xl overflow-visible shadow-2xl animate-scale-up print-section">
            
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d] rounded-t-xl print-hide">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Visualizador Auxiliar de NF-e</span>
              </h3>
              <div className="flex items-center space-x-3">
                <button onClick={() => triggerPrint(`Entrada_${selectedInvoice.numero}`)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center space-x-1">
                  <Printer className="w-4 h-4" />
                  <span>Imprimir NF-e</span>
                </button>
                <button onClick={() => setIsViewModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              
              <div className="print-hide hidden print:block text-center mb-6 text-black">
                <h2 className="text-xl font-bold uppercase mb-1">Nota Fiscal de Entrada Nº {selectedInvoice.numero}</h2>
                <p className="text-sm">Documento Auxiliar de Entrada</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#1f293d]/50 print:border-gray-300">
                <div>
                  <span className="text-gray-500 uppercase font-bold text-[9px] block">Fornecedor Emitente</span>
                  <span className="font-bold text-white text-xs block">
                    {contacts.find(c => c.id === selectedInvoice.fornecedorId)?.nome || 'Fornecedor Cadastrado'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 uppercase font-bold text-[9px] block">Data Entrada</span>
                  <span className="font-medium text-gray-300 font-mono block">{selectedInvoice.dataEmissao}</span>
                </div>
              </div>

              <div className="pb-3 border-b border-[#1f293d]/50">
                <span className="text-gray-500 uppercase font-bold text-[9px] block">Chave SEFAZ NF-e</span>
                <span className="font-mono text-[10px] text-gray-400 block break-all select-all">{selectedInvoice.chave}</span>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">Itens e Tributos Recebidos</h4>
                <div className="bg-[#0b0f17] rounded-lg border border-[#1f293d] overflow-hidden flex flex-col">
                  <div className="overflow-y-auto max-h-[400px]">
                    <table className="w-full text-left text-[11px] border-collapse relative">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-[#0f1523] text-gray-500 uppercase font-black text-[9px] border-b border-[#1f293d] shadow-sm">
                          <th className="py-2 px-3">Código (SKU)</th>
                          <th className="py-2 px-3">Descrição do Insumo</th>
                          <th className="py-2 px-3 text-center">Und.</th>
                          <th className="py-2 px-3 text-right">Qtd</th>
                          <th className="py-2 px-3 text-right">Unitário</th>
                          <th className="py-2 px-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f293d]/20 text-gray-300 font-mono">
                        {selectedInvoice.itens.map((item: any, idx: number) => {
                          const p = products.find(prod => prod.id === item.prodId);
                          return (
                            <tr key={idx} className="hover:bg-gray-800/30">
                              <td className="py-2 px-3 font-bold text-white whitespace-nowrap">{p ? p.codigo : 'SKU'}</td>
                              <td className="py-2 px-3 text-xs font-sans text-gray-300 max-w-[300px] truncate" title={p ? p.descricao : 'Item não identificado'}>{p ? p.descricao : 'Item não identificado'}</td>
                              <td className="py-2 px-3 text-center text-gray-500 font-bold">{p?.unidade || 'UN'}</td>
                              <td className="py-2 px-3 text-right text-blue-400 font-bold">{item.qtd}</td>
                              <td className="py-2 px-3 text-right">{item.valorUnitario.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                              <td className="py-2 px-3 text-right text-emerald-400 font-bold">{(item.qtd * item.valorUnitario).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10 flex justify-between items-center text-sm font-bold text-white">
                <span>Valor Total da Nota (Líquido):</span>
                <span className="text-emerald-400 font-mono text-base">
                  {selectedInvoice.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-2 rounded-lg"
                >
                  Fechar NF-e
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
