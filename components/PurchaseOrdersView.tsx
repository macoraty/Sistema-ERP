'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useErp } from '@/hooks/use-erp';
import { PurchaseOrder, Contact, Product } from '@/lib/types';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Trash2,
  X,
  PlusCircle,
  Eye,
  FileText,
  Upload,
  FileCode,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Check,
  Printer,
  Loader2,
  FileCheck,
  UploadCloud
} from 'lucide-react';
import { SearchableSelect } from '@/components/SearchableSelect';
import { getTodayFormatted } from '@/lib/working-days';
import { triggerPrint } from "@/lib/print";

export default function PurchaseOrdersView() {
  const { 
    purchaseOrders, 
    contacts, 
    products, 
    purchaseNeeds,
    savePurchaseOrder, 
    receberPurchaseOrder, 
    receberPurchaseOrderWithXml,
    cancelPurchaseOrder,
    savePurchaseNeed,
    saveProduct,
    printTemplates,
    appLogo
  } = useErp();

  const handlePrint = (order: PurchaseOrder) => {
    if (printTemplates['purchaseOrder']) {
      let tpl = printTemplates['purchaseOrder'];
      const contact = contacts.find(c => c.id === order.fornecedorId);
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

      triggerPrint(`Pedido_Compra_${order.id}`, tpl);
    } else {
      triggerPrint(`Pedido_Compra_${order.id}`);
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

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

  // Quote States
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteTargetOrder, setQuoteTargetOrder] = useState<PurchaseOrder | null>(null);
  const [quotePdfName, setQuotePdfName] = useState("");
  const [quotePdfBase64, setQuotePdfBase64] = useState("");
  const [isParsingQuote, setIsParsingQuote] = useState(false);
  const [parsingQuoteStep, setParsingQuoteStep] = useState("");
  const [quoteBasket, setQuoteBasket] = useState<{ prodId: number; qtd: number; valorUnitario: number }[]>([]);
  const [quoteFornecedorId, setQuoteFornecedorId] = useState<number>(0);

  const handleOpenQuoteModal = (order: PurchaseOrder) => {
    setQuoteTargetOrder(order);
    setQuoteBasket(order.itens.map(i => ({ ...i })));
    setQuoteFornecedorId(order.fornecedorId || 0);
    setQuotePdfName(order.pdfName || "");
    setQuotePdfBase64(order.pdfBase64 || "");
    setIsQuoteModalOpen(true);
  };

  const handleQuotePdfUpload = async (file: File) => {
    setQuotePdfName(file.name);
    alert("Recurso de IA desativado conforme solicitado.");
  };

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteTargetOrder) return;
    if (!quoteFornecedorId) {
      alert("Selecione um fornecedor.");
      return;
    }
    if (quoteBasket.length === 0) {
      alert("Adicione itens ao orçamento.");
      return;
    }

    const totalCalculado = quoteBasket.reduce((acc, b) => acc + b.qtd * b.valorUnitario, 0);

    savePurchaseOrder({
      ...quoteTargetOrder,
      fornecedorId: quoteFornecedorId,
      itens: quoteBasket,
      valorTotal: totalCalculado,
      status: 'Aberto', // when quote is done, it becomes an open order? Or stays Orçar? We can make it Aberto to say quote is confirmed and ordered.
      pdfName: quotePdfName,
      pdfBase64: quotePdfBase64,
    });

    setIsQuoteModalOpen(false);
    setQuoteTargetOrder(null);
  };

  // XML Import States
  const [isXmlModalOpen, setIsXmlModalOpen] = useState(false);
  const [xmlOrderTarget, setXmlOrderTarget] = useState<PurchaseOrder | null>(null);
  const [xmlText, setXmlText] = useState("");
  const [xmlParsedResult, setXmlParsedResult] = useState<any>(null);
  const [validationReport, setValidationReport] = useState<any>(null);
  const [showWarningAlert, setShowWarningAlert] = useState(false);

  // XML Parser & Validator Helpers
  const parseXmlString = (text: string) => {
    const getTagContent = (tag: string, src: string): string => {
      const regex = new RegExp(`<([^>:]+:)?${tag}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/([^>:]+:)?${tag}>`, "i");
      const match = src.match(regex);
      return match ? match[2].trim() : "";
    };

    const nNF = getTagContent("nNF", text);
    const chNFe = getTagContent("chNFe", text);
    const cnpfEmit = getTagContent("CNPJ", text);
    const xNome = getTagContent("xNome", text);

    const items: { codigo: string; xProd: string; qCom: number; vUnCom: number; vProd: number }[] = [];
    const prodRegex = /<([^>:]+:)?prod(?:\s+[^>]*)?>([\s\S]*?)<\/([^>:]+:)?prod>/gi;
    let match;

    while ((match = prodRegex.exec(text)) !== null) {
      const prodBlock = match[2];
      const cProd = getTagContent("cProd", prodBlock);
      const xProd = getTagContent("xProd", prodBlock);
      
      const qComRaw = getTagContent("qCom", prodBlock) || "0";
      const qCom = parseFloat(qComRaw.replace(",", ".")) || 0;
      
      const vUnComRaw = getTagContent("vUnCom", prodBlock) || "0";
      const vUnCom = parseFloat(vUnComRaw.replace(",", ".")) || 0;
      
      const vProdRaw = getTagContent("vProd", prodBlock) || "0";
      const vProd = parseFloat(vProdRaw.replace(",", ".")) || (qCom * vUnCom);

      items.push({
        codigo: cProd,
        xProd: xProd,
        qCom: qCom,
        vUnCom: vUnCom,
        vProd: vProd,
      });
    }

    const totalStr = getTagContent("vNF", text) || "0";
    const total = parseFloat(totalStr.replace(",", ".")) || items.reduce((acc, i) => acc + i.vProd, 0);

    return {
      nNF,
      chNFe,
      cnpfEmit,
      xNome,
      items,
      total,
    };
  };

  const runValidation = (parsed: any, order: PurchaseOrder) => {
    const supplier = contacts.find(c => c.id === order.fornecedorId);
    const expectedCnpj = (supplier?.cnpj || "").replace(/\D/g, "");
    const actualCnpj = (parsed.cnpfEmit || "").replace(/\D/g, "");

    const isSupplierMatch = expectedCnpj === actualCnpj || (expectedCnpj === "" && actualCnpj === "");

    const itemReports: any[] = [];
    let hasErrors = !isSupplierMatch;

    // Check expected items
    order.itens.forEach((item) => {
      const prod = products.find(p => p.id === item.prodId);
      const prodCode = prod?.codigo || "";
      const prodDesc = prod?.descricao || "Materia-Prima";

      const xmlItem = parsed.items.find(
        (xi: any) => xi.codigo.toLowerCase() === prodCode.toLowerCase()
      );

      if (!xmlItem) {
        hasErrors = true;
        itemReports.push({
          prodId: item.prodId,
          codigo: prodCode,
          descricao: prodDesc,
          expectedQtd: item.qtd,
          actualQtd: 0,
          expectedPrice: item.valorUnitario,
          actualPrice: 0,
          status: "not_found",
          msg: "Item não encontrado no XML da nota fiscal.",
        });
      } else {
        const isQtyMismatch = xmlItem.qCom !== item.qtd;
        const isPriceMismatch = Math.abs(xmlItem.vUnCom - item.valorUnitario) > 0.01;

        let status: any = "ok";
        let msg = "Item de acordo com o pedido.";

        if (isQtyMismatch && isPriceMismatch) {
          status = "mismatch_both";
          msg = `Quantidade diverge (Ped: ${item.qtd} / XML: ${xmlItem.qCom}) e Preço diverge (Ped: R$ ${item.valorUnitario.toFixed(2)} / XML: R$ ${xmlItem.vUnCom.toFixed(2)})`;
          hasErrors = true;
        } else if (isQtyMismatch) {
          status = "mismatch_qty";
          msg = `Quantidade diverge do pedido (Ped: ${item.qtd} / XML: ${xmlItem.qCom})`;
          hasErrors = true;
        } else if (isPriceMismatch) {
          status = "mismatch_price";
          msg = `Preço diverge do pedido (Ped: R$ ${item.valorUnitario.toFixed(2)} / XML: R$ ${xmlItem.vUnCom.toFixed(2)})`;
          hasErrors = true;
        }

        itemReports.push({
          prodId: item.prodId,
          codigo: prodCode,
          descricao: prodDesc,
          expectedQtd: item.qtd,
          actualQtd: xmlItem.qCom,
          expectedPrice: item.valorUnitario,
          actualPrice: xmlItem.vUnCom,
          status: status,
          msg: msg,
        });
      }
    });

    // Check extra items
    parsed.items.forEach((xmlItem: any) => {
      const matchingPoItem = order.itens.find((item) => {
        const prod = products.find(p => p.id === item.prodId);
        return prod?.codigo.toLowerCase() === xmlItem.codigo.toLowerCase();
      });

      if (!matchingPoItem) {
        hasErrors = true;
        itemReports.push({
          prodId: 0,
          codigo: xmlItem.codigo,
          descricao: xmlItem.xProd,
          expectedQtd: 0,
          actualQtd: xmlItem.qCom,
          expectedPrice: 0,
          actualPrice: xmlItem.vUnCom,
          status: "extra",
          msg: "Item extra no XML (não solicitado no Pedido de Compra).",
        });
      }
    });

    return {
      isSupplierMatch,
      cnpjExpected: supplier?.cnpj || "Não cadastrado",
      cnpjActual: parsed.cnpfEmit || "Não informado",
      supplierExpectedName: supplier?.nome || "Fornecedor",
      hasErrors,
      itemReports,
    };
  };

  const handleXmlChange = (val: string, order: PurchaseOrder) => {
    setXmlText(val);
    if (!val.trim()) {
      setXmlParsedResult(null);
      setValidationReport(null);
      setShowWarningAlert(false);
      return;
    }

    try {
      const parsed = parseXmlString(val);
      setXmlParsedResult(parsed);

      const report = runValidation(parsed, order);
      setValidationReport(report);
      setShowWarningAlert(report.hasErrors);
    } catch (err) {
      setXmlParsedResult(null);
      setValidationReport(null);
      setShowWarningAlert(false);
    }
  };

  const handleOpenXmlImportModal = (order: PurchaseOrder) => {
    setXmlOrderTarget(order);
    setXmlText("");
    setXmlParsedResult(null);
    setValidationReport(null);
    setShowWarningAlert(false);
    setIsXmlModalOpen(true);
  };

  const generateXmlForOrder = (order: PurchaseOrder, type: "perfect" | "qty_diff" | "price_diff" | "extra_item") => {
    const supplier = contacts.find(c => c.id === order.fornecedorId);
    const cnpj = (supplier?.cnpj || "33333333000103").replace(/\D/g, "");
    const name = supplier?.nome || "FORNECEDOR S/A";
    const nNF = String(Math.floor(Math.random() * 90000) + 10000);
    const dateStr = "2026-06-25T14:30:00-03:00";

    let total = 0;
    const itemsXml = order.itens.map((item, idx) => {
      const prod = products.find(p => p.id === item.prodId);
      const code = prod?.codigo || `MP-CODE-${item.prodId}`;
      const desc = prod?.descricao || "Materia-Prima";

      let qCom = item.qtd;
      let vUnCom = item.valorUnitario;

      if (type === "qty_diff" && idx === 0) {
        qCom = Math.round(item.qtd * 1.5);
      }
      if (type === "price_diff" && idx === 0) {
        vUnCom = Number((item.valorUnitario * 1.25).toFixed(2));
      }

      const vProd = Number((qCom * vUnCom).toFixed(2));
      total += vProd;

      return `      <det nItem="${idx + 1}">
        <prod>
          <cProd>${code}</cProd>
          <xProd>${desc}</xProd>
          <uCom>${prod?.unidade || "UN"}</uCom>
          <qCom>${qCom.toFixed(4)}</qCom>
          <vUnCom>${vUnCom.toFixed(4)}</vUnCom>
          <vProd>${vProd.toFixed(2)}</vProd>
        </prod>
      </det>`;
    }).join("\n");

    let extraXml = "";
    if (type === "extra_item") {
      const extraCode = "MP-EXTRA-999";
      const extraDesc = "Insumo Adicional Nao Solicitado";
      const extraQ = 10;
      const extraVal = 50.00;
      const extraTot = extraQ * extraVal;
      total += extraTot;

      extraXml = `\n      <det nItem="${order.itens.length + 1}">
        <prod>
          <cProd>${extraCode}</cProd>
          <xProd>${extraDesc}</xProd>
          <uCom>UN</uCom>
          <qCom>${extraQ.toFixed(4)}</qCom>
          <vUnCom>${extraVal.toFixed(4)}</vUnCom>
          <vProd>${extraTot.toFixed(2)}</vProd>
        </prod>
      </det>`;
    }

    const key = "352606" + cnpj.padEnd(14, "0") + "55001" + nNF + "19283749102";

    return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${key}" versao="4.00">
      <ide>
        <nNF>${nNF}</nNF>
        <dhEmi>${dateStr}</dhEmi>
        <chNFe>${key}</chNFe>
      </ide>
      <emit>
        <CNPJ>${cnpj}</CNPJ>
        <xNome>${name}</xNome>
      </emit>
      <dest>
        <CNPJ>12345678000199</CNPJ>
        <xNome>MACORATY INDUSTRIAL ERP LTDA</xNome>
      </dest>
${itemsXml}${extraXml}
      <total>
        <ICMSTot>
          <vProd>${total.toFixed(2)}</vProd>
          <vNF>${total.toFixed(2)}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;
  };

  const loadTemplateXml = (type: "perfect" | "qty_diff" | "price_diff" | "extra_item") => {
    if (!xmlOrderTarget) return;
    const generated = generateXmlForOrder(xmlOrderTarget, type);
    handleXmlChange(generated, xmlOrderTarget);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !xmlOrderTarget) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      handleXmlChange(text, xmlOrderTarget);
    };
    reader.readAsText(file);
  };

  const executeXmlImport = () => {
    if (!xmlOrderTarget || !xmlParsedResult) return;

    // Map XML items to pass their full details (code, description, unit, quantities, prices)
    const xmlItensToSend = xmlParsedResult.items.map((xi: any) => {
      const prod = products.find(p => p.codigo.toLowerCase() === xi.codigo.toLowerCase() || 
        (p.codigoFornecedor && p.codigoFornecedor.toLowerCase() === xi.codigo.toLowerCase()) ||
        (p.codigoFornecedor2 && p.codigoFornecedor2.toLowerCase() === xi.codigo.toLowerCase()) ||
        (p.codigoFornecedor3 && p.codigoFornecedor3.toLowerCase() === xi.codigo.toLowerCase()) ||
        (p.codigoFornecedor4 && p.codigoFornecedor4.toLowerCase() === xi.codigo.toLowerCase())
      );
      return {
        prodId: prod?.id, // Can be undefined if it doesn't exist yet
        prodCode: xi.codigo,
        prodDesc: xi.xProd || "Material Importado XML",
        unidade: xi.uCom || "UN",
        qtd: xi.qCom,
        valorUnitario: xi.vUnCom,
      };
    });

    receberPurchaseOrderWithXml(
      xmlOrderTarget.id,
      xmlParsedResult.nNF,
      xmlParsedResult.chNFe,
      xmlItensToSend,
      xmlParsedResult.total
    );

    setIsXmlModalOpen(false);
    setXmlOrderTarget(null);
  };

  // New Purchase Order Form State
  const [fornecedorId, setFornecedorId] = useState<number>(0);
  const [dataEntrega, setDataEntrega] = useState('');
  const [createStatus, setCreateStatus] = useState<'Aberto' | 'Orçar'>('Aberto');
  const [linkedNeedId, setLinkedNeedId] = useState<number | null>(null);
  const [newOrderPdfName, setNewOrderPdfName] = useState('');
  const [newOrderPdfBase64, setNewOrderPdfBase64] = useState('');
  const [isParsingNewOrderPdf, setIsParsingNewOrderPdf] = useState(false);
  const [parsingNewOrderPdfStep, setParsingNewOrderPdfStep] = useState('');
  
  // Basket builder state
  const [basket, setBasket] = useState<{ prodId: number; qtd: number; valorUnitario: number }[]>([]);
  const [currentProdId, setCurrentProdId] = useState<number>(0);
  const [currentQtd, setCurrentQtd] = useState('');
  const [currentPrice, setCurrentPrice] = useState('');

  // Dropdown data
  const suppliers = useMemo(() => contacts.filter(c => c.tipo === 'Fornecedor'), [contacts]);
  const purchasableProducts = useMemo(() => products, [products]);

  const supplierOptions = useMemo(() => {
    return suppliers.map(s => ({
      id: s.id,
      label: s.nome,
      sublabel: s.cnpj ? `CNPJ: ${s.cnpj} | ${s.cidade}-${s.uf}` : `${s.cidade}-${s.uf}`
    }));
  }, [suppliers]);

  const productOptions = useMemo(() => {
    return [...purchasableProducts]
      .sort((a, b) => a.descricao.localeCompare(b.descricao))
      .map(p => ({
      id: p.id,
      label: `[${p.codigo}] - ${p.descricao}`,
      sublabel: `Custo: R$ ${(p.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | Unidade: ${p.unidade}`
    }));
  }, [purchasableProducts]);

  // Open Add modal setup
  const handleOpenAddModal = () => {
    if (suppliers.length > 0) setFornecedorId(suppliers[0].id);
    if (purchasableProducts.length > 0) {
      const defaultProd = purchasableProducts[0];
      setCurrentProdId(defaultProd.id);
      setCurrentPrice(String(defaultProd.valor));
    }
    setDataEntrega('');
    setBasket([]);
    setCurrentQtd('');
    setCreateStatus('Aberto');
    setLinkedNeedId(null);
    setNewOrderPdfName('');
    setNewOrderPdfBase64('');
    setIsModalOpen(true);
  };

  const handleOpenAddQuoteModal = () => {
    setFornecedorId(0);
    if (purchasableProducts.length > 0) {
      const defaultProd = purchasableProducts[0];
      setCurrentProdId(defaultProd.id);
      setCurrentPrice(String(defaultProd.valor));
    }
    setDataEntrega('');
    setBasket([]);
    setCurrentQtd('');
    setCreateStatus('Orçar');
    setLinkedNeedId(null);
    setNewOrderPdfName('');
    setNewOrderPdfBase64('');
    setIsModalOpen(true);
  };

  const handleNewOrderPdfUpload = async (file: File) => {
    setNewOrderPdfName(file.name);
    alert("Recurso de IA desativado conforme solicitado.");
  };

  const handleProductChange = (prodId: number) => {
    setCurrentProdId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setCurrentPrice(String(prod.valor));
    }
  };

  const handleAddToBasket = () => {
    if (!currentProdId || !currentQtd || parseFloat(currentQtd) <= 0 || !currentPrice) {
      alert('Por favor, informe a quantidade e o preço de custo.');
      return;
    }

    const prodId = Number(currentProdId);
    const qtd = parseFloat(currentQtd);
    const valUnit = parseFloat(currentPrice);

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

  const handleNeedSelectionChange = (needId: number) => {
    setLinkedNeedId(needId);
    const need = purchaseNeeds.find(n => n.id === needId);
    if (need) {
      const newBasket = need.itens.map(item => {
        const prod = products.find(p => p.id === item.prodId);
        return {
          prodId: item.prodId,
          qtd: item.qtd,
          valorUnitario: prod?.valor || 0
        };
      });
      setBasket(newBasket);
    } else {
      setBasket([]);
    }
  };

  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (basket.length === 0) {
      alert('Você precisa adicionar pelo menos um insumo ao pedido.');
      return;
    }

    if (!fornecedorId && createStatus !== 'Orçar') {
      alert('Informe o fornecedor para transmitir o pedido.');
      return;
    }
    
    if (!dataEntrega) {
      alert('Informe a data programada de recebimento.');
      return;
    }

    const dParts = dataEntrega.split('-');
    const formattedDeliveryDate = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;
    const total = basket.reduce((acc, b) => acc + (b.qtd * b.valorUnitario), 0);

    savePurchaseOrder({
      fornecedorId: fornecedorId || 0,
      dataEmissao: getTodayFormatted(),
      dataEntrega: formattedDeliveryDate,
      itens: basket,
      valorTotal: total,
      status: createStatus,
      pdfName: newOrderPdfName,
      pdfBase64: newOrderPdfBase64
    });

    if (linkedNeedId) {
      const need = purchaseNeeds.find(n => n.id === linkedNeedId);
      if (need) {
        savePurchaseNeed({ ...need, status: 'Cotado' });
      }
    }

    setIsModalOpen(false);
  };

  const handleOpenViewModal = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  const filteredOrders = useMemo(() => {
    return purchaseOrders.filter(o => {
      const supplier = contacts.find(c => c.id === o.fornecedorId);
      const supplierName = supplier ? supplier.nome.toLowerCase() : '';
      const matchSearch = supplierName.includes(searchTerm.toLowerCase()) || String(o.id).includes(searchTerm);
      const matchStatus = selectedStatus === 'Todos' || o.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [purchaseOrders, contacts, searchTerm, selectedStatus]);

  const sortedOrders = useMemo(() => {
    if (!sortField) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      let valA = a[sortField as keyof PurchaseOrder] ?? "";
      let valB = b[sortField as keyof PurchaseOrder] ?? "";

      if (sortField === 'fornecedorId') {
        const supplierA = contacts.find(c => c.id === a.fornecedorId);
        const supplierB = contacts.find(c => c.id === b.fornecedorId);
        valA = supplierA ? supplierA.nome : "";
        valB = supplierB ? supplierB.nome : "";
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
    <div className="space-y-6 font-sans animate-fade-in" id="purchase-orders-view">
      
      {/* Search and action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#111827] border border-[#1f293d] p-4 rounded-xl">
        
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por fornecedor ou número do pedido..."
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none"
          >
            <option value="Todos">Todos os Status</option>
            <option value="Orçar">Orçar</option>
            <option value="Aberto">Abertos (Em trânsito)</option>
            <option value="Recebido">Recebidos / Estocados</option>
            <option value="Cancelado">Cancelados</option>
          </select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleOpenAddQuoteModal}
            className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Orçamento</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Pedido Compra</span>
          </button>
        </div>

      </div>

      {/* Orders Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f1523] border-b border-[#1f293d] text-gray-400 text-[10px] uppercase font-black tracking-wider">
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
                    <span>Prazo Entrega</span>
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
                const supplier = contacts.find(c => c.id === o.fornecedorId);
                const isOpen = o.status === 'Aberto';
                const isRecebido = o.status === 'Recebido';

                let statusBadge = '';
                if (isOpen) statusBadge = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                else if (isRecebido) statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                else statusBadge = 'bg-gray-500/10 text-gray-400 border border-gray-500/20';

                return (
                  <tr key={o.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-white text-[11px]">
                      #{o.id}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      {supplier ? supplier.nome : 'Fornecedor Desconhecido'}
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
                          title="Imprimir Pedido"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenViewModal(o)}
                          className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                          title="Visualizar Pedido"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {o.status === 'Orçar' && (
                          <button
                            onClick={() => handleOpenQuoteModal(o)}
                            className="bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/20 text-[10px] font-black px-2 py-1 rounded transition-colors"
                            title="Fazer Orçamento"
                          >
                            Orçar
                          </button>
                        )}
                        
                        {isOpen && (
                          <>
                            <button
                              onClick={() => receberPurchaseOrder(o.id)}
                              className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-[10px] font-black px-2 py-1 rounded transition-colors"
                              title="Receber sem XML"
                            >
                              Receber
                            </button>
                            <button
                              onClick={() => handleOpenXmlImportModal(o)}
                              className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/20 text-[10px] font-black px-2 py-1 rounded transition-colors"
                              title="Importar XML da Nota Fiscal para Recebimento"
                            >
                              Importar XML
                            </button>
                            <button
                              onClick={() => cancelPurchaseOrder(o.id)}
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
                    Nenhum pedido de compra registrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Order Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-3xl overflow-visible shadow-2xl animate-scale-up">
            
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d] rounded-t-xl">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <ShoppingCart className={`w-4 h-4 ${createStatus === 'Orçar' ? 'text-purple-400' : 'text-blue-400'}`} />
                <span>{createStatus === 'Orçar' ? 'Registrar Novo Orçamento' : 'Registrar Pedido de Compra'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">
                    Fornecedor Destinatário <span className="text-[9px] font-normal text-gray-500">(Opcional p/ Orçar)</span>
                  </label>
                  <SearchableSelect
                    options={supplierOptions}
                    selectedValue={fornecedorId}
                    onChange={(id) => setFornecedorId(id)}
                    placeholder="Selecione um fornecedor..."
                    noOptionsMessage="Nenhum fornecedor cadastrado"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Data Estimada de Entrega</label>
                  <input
                    type="date"
                    required
                    value={dataEntrega}
                    onChange={(e) => setDataEntrega(e.target.value)}
                    onClick={(e) => { try { (e.target as any).showPicker(); } catch(err) {} }}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2 text-white focus:outline-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">Vincular a Necessidade (Opcional)</label>
                  <select
                    value={linkedNeedId || 0}
                    onChange={(e) => handleNeedSelectionChange(Number(e.target.value))}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2 text-white focus:outline-none cursor-pointer text-xs"
                  >
                    <option value={0}>-- Orçamento Avulso (Sem Vínculo) --</option>
                    {purchaseNeeds.filter(n => n.status !== 'Cotado').map(n => (
                      <option key={n.id} value={n.id}>Req. #{n.id} — {n.dataCriacao} ({n.itens.length} itens)</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1">Anexar Orçamento (PDF ou Imagem)</label>
                  <input
                    type="file"
                    id="new-order-pdf-upload"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && e.target.files[0] && handleNewOrderPdfUpload(e.target.files[0])}
                  />
                  {isParsingNewOrderPdf ? (
                    <div className="w-full bg-[#0b0f17] border border-blue-500/30 rounded-lg px-3 flex items-center justify-between h-[36px] animate-pulse">
                      <div className="flex items-center space-x-2 truncate">
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />
                        <span className="text-[11px] font-bold text-blue-400 truncate">
                          {parsingNewOrderPdfStep}
                        </span>
                      </div>
                    </div>
                  ) : newOrderPdfName ? (
                    <div className="w-full bg-[#0b0f17] border border-emerald-500/30 rounded-lg px-3 flex items-center justify-between h-[36px]">
                      <div className="flex items-center space-x-2 truncate">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-white truncate max-w-[120px]" title={newOrderPdfName}>
                          {newOrderPdfName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setNewOrderPdfName(""); setNewOrderPdfBase64(""); }}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold ml-2 shrink-0 animate-pulse"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById("new-order-pdf-upload")?.click()}
                      className="w-full border border-dashed border-[#1f293d] bg-[#0b0f17] rounded-lg px-3 flex items-center justify-between cursor-pointer hover:border-gray-500 transition-all h-[36px]"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <UploadCloud className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        <span className="text-[11px] font-medium truncate text-gray-400">
                          Selecionar PDF/Imagem
                        </span>
                      </div>
                      <span className="text-[9px] bg-[#1f293d]/80 text-gray-300 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                        Upload
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Item Builder */}
              <div className="bg-[#0b0f17] p-4 rounded-xl border border-[#1f293d] space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center space-x-2 border-b border-[#1f293d] pb-2">
                  <PlusCircle className="w-4 h-4 text-blue-400" />
                  <span>Incluir Insumos e Componentes</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-5 border-none">
                    <label className="block text-gray-500 text-[9px] uppercase font-black mb-1 tracking-wider">Insumo / SKU</label>
                    <SearchableSelect
                      options={productOptions}
                      selectedValue={currentProdId}
                      onChange={(id) => handleProductChange(id)}
                      placeholder="Selecione um insumo..."
                      noOptionsMessage="Nenhum insumo cadastrado"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-gray-500 text-[9px] uppercase font-black mb-1 tracking-wider">Qtd.</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="Ex: 50"
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
                      placeholder="120.00"
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
                            <td className="py-1.5 text-right font-mono text-rose-400 font-bold">{sub.toLocaleString('pt-BR')}</td>
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
                  Total Pedido: <b className="text-rose-400 font-mono text-base">{basket.reduce((acc, b) => acc + (b.qtd * b.valorUnitario), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</b>
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  {createStatus === 'Orçar' ? (
                    <button
                      type="submit"
                      onClick={() => setCreateStatus('Orçar')}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-purple-500/10"
                    >
                      Salvar Novo Orçamento
                    </button>
                  ) : (
                    <>
                      <button
                        type="submit"
                        onClick={() => setCreateStatus('Orçar')}
                        className="bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border border-purple-500/30 font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        Salvar como Orçamento
                      </button>
                      <button
                        type="submit"
                        onClick={() => setCreateStatus('Aberto')}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg transition-colors"
                      >
                        Transmitir Pedido Aberto
                      </button>
                    </>
                  )}
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
              <div className="flex flex-col">
                <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Visualizador Auxiliar de Pedido de Compra</span>
                </h3>
                <span className="text-[10px] text-yellow-500/80 mt-1 font-medium">Dica: Se a impressão não abrir, pressione Ctrl+P ou abra em nova aba.</span>
              </div>
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
                <h2 className="text-xl font-bold uppercase mb-1">Pedido de Compra #{selectedOrder.id}</h2>
                <p className="text-sm">Documento Auxiliar de Compra</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#1f293d]/50 print:border-gray-300">
                <div>
                  <span className="text-gray-500 uppercase font-bold text-[9px] block">Fornecedor</span>
                  <span className="font-bold text-white text-xs block">
                    {contacts.find(c => c.id === selectedOrder.fornecedorId)?.nome || 'N/A'}
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
                  <span className="text-gray-500 uppercase font-bold text-[9px] block">Previsão Entrega</span>
                  <span className="font-medium text-blue-400 font-mono">{selectedOrder.dataEntrega}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-wider">Insumos Solicitados</h4>
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
                            <td className="py-2 px-3 text-right text-rose-400 font-bold">{(item.qtd * item.valorUnitario).toLocaleString('pt-BR')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/10 flex justify-between items-center text-sm font-bold text-white">
                <span>Custo Total Previsto:</span>
                <span className="text-rose-400 font-mono text-base">
                  {selectedOrder.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>

              {selectedOrder.pdfBase64 && (
                <div className="p-3 bg-[#0b0f17] rounded-lg border border-[#1f293d] flex justify-between items-center">
                  <div className="flex items-center space-x-2 truncate">
                    <FileCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">Anexo do Orçamento</span>
                      <span className="text-xs text-gray-300 font-medium truncate max-w-[200px]" title={selectedOrder.pdfName}>
                        {selectedOrder.pdfName || "documento.pdf"}
                      </span>
                    </div>
                  </div>
                  <a
                    href={selectedOrder.pdfBase64}
                    download={selectedOrder.pdfName || "orcamento.pdf"}
                    className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 text-[10px] font-black px-3 py-1.5 rounded transition-colors flex items-center space-x-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Visualizar PDF</span>
                  </a>
                </div>
              )}

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

      {/* XML Import & Validation Modal */}
      {isXmlModalOpen && xmlOrderTarget && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setIsXmlModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-5xl overflow-hidden shadow-2xl my-8 animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d]">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <FileCode className="w-5 h-5 text-blue-400 animate-pulse" />
                <span>Importação & Validação de XML — Pedido de Compra #{xmlOrderTarget.id}</span>
              </h3>
              <button
                onClick={() => setIsXmlModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              {/* Simulator / Quick Testing Templates */}
              <div className="bg-[#0b0f17]/60 border border-blue-500/20 p-4 rounded-xl space-y-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    Simulador do Fluxo de Validação de XML (Testar Cenários)
                  </h4>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Para facilitar a homologação, clique em um dos botões abaixo para gerar automaticamente o conteúdo XML simulado para este pedido específico e observar as regras de validação em tempo real:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => loadTemplateXml('perfect')}
                    className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-[11px] font-bold py-2 px-3 rounded-lg transition-all transform hover:scale-[1.02]"
                  >
                    ✓ XML Correto (Perfeito)
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplateXml('qty_diff')}
                    className="bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/30 text-[11px] font-bold py-2 px-3 rounded-lg transition-all transform hover:scale-[1.02]"
                  >
                    ⚠ Divergência de Quantidade
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplateXml('price_diff')}
                    className="bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-[11px] font-bold py-2 px-3 rounded-lg transition-all transform hover:scale-[1.02]"
                  >
                    ⚠ Divergência de Preço
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplateXml('extra_item')}
                    className="bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/30 text-[11px] font-bold py-2 px-3 rounded-lg transition-all transform hover:scale-[1.02]"
                  >
                    ⚠ Item Extra / Não Solicitado
                  </button>
                </div>
              </div>

              {/* Main Workspace: Textarea / Upload vs Report */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* Left Panel: Upload and Textarea */}
                <div className="lg:col-span-5 flex flex-col space-y-3.5">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Conteúdo do Arquivo XML
                    </label>
                    <label className="cursor-pointer bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold px-2.5 py-1 rounded border border-[#1f293d] flex items-center space-x-1.5 transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>Carregar Arquivo</span>
                      <input
                        type="file"
                        accept=".xml"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="flex-1 min-h-[250px] relative">
                    <textarea
                      value={xmlText}
                      onChange={(e) => handleXmlChange(e.target.value, xmlOrderTarget)}
                      placeholder="Cole o código XML da NF-e aqui ou arraste o arquivo..."
                      className="w-full h-full min-h-[280px] bg-[#0b0f17] border border-[#1f293d] rounded-xl p-4 text-gray-300 font-mono text-[10px] focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
                    />
                  </div>
                  <p className="text-[9px] text-gray-500 leading-normal">
                    Passe um arquivo XML padrão SEFAZ (com as tags nNF, emit/CNPJ, det/prod, qCom, vUnCom). Os dados serão validados automaticamente frente ao pedido atual.
                  </p>
                </div>

                {/* Right Panel: Validation Report */}
                <div className="lg:col-span-7 flex flex-col bg-[#0b0f17]/40 border border-[#1f293d] rounded-xl p-5 overflow-hidden justify-between">
                  
                  <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 pb-2 border-b border-[#1f293d]/50">
                      Relatório de Verificação e Validação
                    </h4>

                    {!xmlParsedResult ? (
                      <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center space-y-2">
                        <FileCode className="w-10 h-10 text-gray-600 animate-pulse" />
                        <span className="text-xs font-semibold">Nenhum XML carregado</span>
                        <p className="text-[10px] text-gray-600 max-w-xs leading-normal">
                          Por favor, cole o XML ou selecione um dos templates acima para ver o resultado da validação.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Header metadata */}
                        <div className="grid grid-cols-2 gap-4 bg-[#0b0f17] p-3.5 rounded-lg border border-[#1f293d]">
                          <div>
                            <span className="text-[9px] text-gray-500 uppercase font-bold block">Chave de Acesso</span>
                            <span className="font-mono text-[10px] text-gray-300 block truncate" title={xmlParsedResult.chNFe}>
                              {xmlParsedResult.chNFe || 'Não localizada'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-gray-500 uppercase font-bold block">Número da NF-e</span>
                            <span className="font-mono text-xs text-white font-bold block">
                              {xmlParsedResult.nNF || 'Não localizada'}
                            </span>
                          </div>
                          
                          <div className="col-span-2 pt-2 border-t border-[#1f293d]/50 flex items-center justify-between">
                            <div>
                              <span className="text-[9px] text-gray-500 uppercase font-bold block">CNPJ Emissor (XML)</span>
                              <span className="font-mono text-[11px] text-gray-300 block">
                                {xmlParsedResult.cnpfEmit || 'Não localizado'}
                              </span>
                            </div>
                            <div>
                              {validationReport?.isSupplierMatch ? (
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded font-bold">
                                  ✓ Fornecedor Coincide
                                </span>
                              ) : (
                                <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-1 rounded font-bold flex items-center space-x-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-400 flex-shrink-0 animate-bounce" />
                                  <span>Fornecedor Divergente!</span>
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {!validationReport?.isSupplierMatch && (
                            <div className="col-span-2 text-[10px] text-rose-400 leading-normal bg-rose-500/5 p-2 rounded border border-rose-500/10 mt-1">
                              O CNPJ do XML ({validationReport?.cnpjActual}) difere do CNPJ do fornecedor deste pedido ({validationReport?.cnpjExpected} - {validationReport?.supplierExpectedName}).
                            </div>
                          )}
                        </div>

                        {/* Items comparison table */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider block">Conformidade dos Itens</span>
                          <div className="bg-[#0b0f17] rounded-lg border border-[#1f293d] overflow-hidden">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="bg-[#0f1523] text-gray-400 uppercase font-black text-[9px] border-b border-[#1f293d] tracking-wider">
                                  <th className="py-2.5 px-3">SKU / Item</th>
                                  <th className="py-2.5 px-3 text-center">Qtd (Ped/XML)</th>
                                  <th className="py-2.5 px-3 text-right">Unit. (Ped/XML)</th>
                                  <th className="py-2.5 px-3 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#1f293d]/20 text-gray-300">
                                {validationReport?.itemReports.map((rep: any, idx: number) => {
                                  let statusBadge = '';
                                  if (rep.status === 'ok') {
                                    statusBadge = 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
                                  } else if (rep.status === 'extra') {
                                    statusBadge = 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
                                  } else if (rep.status === 'not_found') {
                                    statusBadge = 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
                                  } else {
                                    statusBadge = 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
                                  }

                                  return (
                                    <tr key={idx} className="hover:bg-gray-800/10 font-medium">
                                      <td className="py-2 px-3">
                                        <div className="font-bold text-white font-mono">[{rep.codigo}]</div>
                                        <div className="text-gray-500 text-[10px] truncate max-w-[160px]" title={rep.descricao}>
                                          {rep.descricao}
                                        </div>
                                      </td>
                                      <td className="py-2 px-3 text-center font-mono">
                                        {rep.status === 'not_found' ? (
                                          <span className="text-rose-400 font-bold">{rep.expectedQtd} / 0</span>
                                        ) : rep.status === 'extra' ? (
                                          <span className="text-purple-400 font-bold">0 / {rep.actualQtd}</span>
                                        ) : rep.expectedQtd !== rep.actualQtd ? (
                                          <span className="text-amber-400 font-bold">{rep.expectedQtd} / {rep.actualQtd}</span>
                                        ) : (
                                          <span className="text-emerald-400">{rep.expectedQtd} / {rep.actualQtd}</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-right font-mono">
                                        {rep.status === 'not_found' ? (
                                          <span className="text-rose-400">R$ {rep.expectedPrice.toFixed(2)} / —</span>
                                        ) : rep.status === 'extra' ? (
                                          <span className="text-purple-400">— / R$ {rep.actualPrice.toFixed(2)}</span>
                                        ) : rep.expectedPrice !== rep.actualPrice ? (
                                          <span className="text-amber-400">R$ {rep.expectedPrice.toFixed(2)} / {rep.actualPrice.toFixed(2)}</span>
                                        ) : (
                                          <span className="text-emerald-400">R$ {rep.expectedPrice.toFixed(2)} / {rep.actualPrice.toFixed(2)}</span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 text-center whitespace-nowrap">
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${statusBadge}`}>
                                          {rep.status === 'ok' ? 'OK' : rep.status === 'extra' ? 'EXTRA' : rep.status === 'not_found' ? 'AUSENTE' : 'DIVERGE'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Valor Total check */}
                        <div className="flex justify-between items-center text-xs p-3 bg-[#0b0f17] rounded-lg border border-[#1f293d] font-bold">
                          <span className="text-gray-400">Total do XML da Nota:</span>
                          <span className={`font-mono text-sm ${Math.abs(xmlParsedResult.total - xmlOrderTarget.valorTotal) > 0.05 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {xmlParsedResult.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            {Math.abs(xmlParsedResult.total - xmlOrderTarget.valorTotal) > 0.05 && (
                              <span className="text-[10px] text-gray-500 font-normal block text-right mt-0.5">
                                Pedido previa: {xmlOrderTarget.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions / Alert Warnings */}
                  {xmlParsedResult && validationReport && (
                    <div className="pt-5 border-t border-[#1f293d]/50 mt-4 space-y-4">
                      
                      {/* Red Alert / Yellow Alert if has errors */}
                      {validationReport.hasErrors ? (
                        <div className="bg-red-500/10 border border-red-500/30 p-3.5 rounded-xl space-y-1.5">
                          <div className="flex items-center space-x-2 text-red-400 font-bold text-xs">
                            <AlertTriangle className="w-4 h-4 animate-bounce text-red-400 flex-shrink-0" />
                            <span>Divergência Detectada!</span>
                          </div>
                          <p className="text-[11px] text-gray-300 leading-relaxed">
                            Os dados do XML <b>não estão de acordo</b> com o pedido de compra cadastrado (fornecedor, quantidades, itens ou valores unitários divergem).
                          </p>
                          <div className="text-[10px] text-red-400 font-semibold pt-1">
                            Como solicitado, você pode cancelar a importação ou optar por importar com divergências mesmo assim. Caso importe, os itens serão estocados com os valores contidos no XML.
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl space-y-1">
                          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>Dados em Conformidade!</span>
                          </div>
                          <p className="text-[11px] text-gray-300 leading-relaxed">
                            O XML corresponde perfeitamente ao pedido de compra. A importação irá receber os itens e atualizar o estoque com segurança.
                          </p>
                        </div>
                      )}

                      {/* Action buttons inside report */}
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setIsXmlModalOpen(false)}
                          className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold px-4 py-2.5 rounded-lg transition-colors"
                        >
                          Cancelar Importação
                        </button>
                        {validationReport.hasErrors ? (
                          <button
                            type="button"
                            onClick={executeXmlImport}
                            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center space-x-1.5 shadow-md shadow-amber-950/20"
                          >
                            <span>Importar Mesmo Assim (Forçar)</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={executeXmlImport}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all flex items-center space-x-1.5 shadow-md shadow-emerald-950/20"
                          >
                            <span>Confirmar & Estocar Itens</span>
                          </button>
                        )}
                      </div>

                    </div>
                  )}

                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Quote Modal */}
      {isQuoteModalOpen && quoteTargetOrder && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsQuoteModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl animate-scale-up">
            
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d]">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Registrar Orçamento - Pedido #{quoteTargetOrder.id}</span>
              </h3>
              <button
                onClick={() => setIsQuoteModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuoteSubmit} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                    Fornecedor (Remetente do Orçamento)
                  </label>
                  <select
                    value={quoteFornecedorId}
                    onChange={(e) => setQuoteFornecedorId(Number(e.target.value))}
                    required
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg text-white text-xs px-3 py-2.5 focus:outline-none focus:border-purple-500 font-semibold"
                  >
                    <option value={0} disabled>
                      Selecione o fornecedor...
                    </option>
                    {contacts.filter(c => c.tipo === 'Fornecedor').map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome} (CNPJ: {f.cnpj})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                    Anexar Orçamento (PDF ou Imagem)
                  </label>
                  <input
                    type="file"
                    id="quote-pdf-upload"
                    accept=".pdf,image/*"
                    className="hidden"
                    onChange={(e) => e.target.files && e.target.files[0] && handleQuotePdfUpload(e.target.files[0])}
                  />
                  {isParsingQuote ? (
                    <div className="w-full bg-[#0b0f17] border border-blue-500/50 rounded-lg px-4 flex items-center justify-center space-x-2 animate-pulse h-[38px]">
                      <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                      <span className="text-[10px] text-gray-400 font-mono">{parsingQuoteStep}</span>
                    </div>
                  ) : quotePdfName ? (
                    <div className="w-full bg-[#0b0f17] border border-emerald-500/30 rounded-lg px-3 flex items-center justify-between h-[38px]">
                      <div className="flex items-center space-x-2 truncate">
                        <FileCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="text-[11px] font-bold text-white truncate max-w-[200px]" title={quotePdfName}>
                          {quotePdfName}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setQuotePdfName(""); setQuotePdfBase64(""); }}
                        className="text-[10px] text-red-400 hover:text-red-300 font-bold ml-2 shrink-0"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById("quote-pdf-upload")?.click()}
                      className="w-full border border-dashed border-[#1f293d] bg-[#0b0f17] rounded-lg px-3 flex items-center justify-between cursor-pointer hover:border-gray-500 transition-all h-[38px]"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <UploadCloud className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        <span className="text-[11px] font-medium truncate text-gray-400">
                          Clique para selecionar PDF/Imagem
                        </span>
                      </div>
                      <span className="text-[9px] bg-[#1f293d]/80 text-gray-300 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                        Upload
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-[#0b0f17] border border-[#1f293d] rounded-xl overflow-hidden mt-4">
                <div className="bg-[#0f1523] px-4 py-3 flex justify-between items-center border-b border-[#1f293d]">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Itens e Preços Registrados
                  </h4>
                  <span className="bg-[#1f293d] text-gray-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {quoteBasket.length} {quoteBasket.length === 1 ? "item" : "itens"}
                  </span>
                </div>
                
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#111827] text-gray-500 uppercase font-black text-[9px] tracking-wider border-b border-[#1f293d]">
                      <th className="py-2.5 px-4 w-1/2">Insumo / Componente</th>
                      <th className="py-2.5 px-4 text-center w-24">Quantidade</th>
                      <th className="py-2.5 px-4 text-right w-32">Preço Unitário (R$)</th>
                      <th className="py-2.5 px-4 text-right w-32">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f293d] text-gray-300 bg-[#0b0f17]">
                    {quoteBasket.map((item, index) => {
                      const p = products.find((prod) => prod.id === item.prodId);
                      return (
                        <tr key={index} className="hover:bg-gray-800/20 transition-colors">
                          <td className="py-3 px-4">
                            <span className="text-blue-400 font-bold mr-1 font-mono">[{p?.codigo}]</span>
                            <span className="font-semibold text-white">{p?.descricao}</span>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="0.01"
                              step="any"
                              value={item.qtd || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...quoteBasket];
                                updated[index].qtd = val;
                                setQuoteBasket(updated);
                              }}
                              className="w-full bg-[#111827] border border-[#1f293d] rounded p-1.5 text-center text-white focus:outline-none focus:border-purple-500 font-mono"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.valorUnitario || ""}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = [...quoteBasket];
                                updated[index].valorUnitario = val;
                                setQuoteBasket(updated);
                              }}
                              className="w-full bg-[#111827] border border-[#1f293d] rounded p-1.5 text-right text-emerald-400 font-bold focus:outline-none focus:border-purple-500 font-mono"
                            />
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-white">
                            R$ {(item.qtd * item.valorUnitario).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="bg-[#111827] px-5 py-4 border-t border-[#1f293d] flex justify-between items-center">
                  <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">
                    Total Geral do Orçamento:
                  </span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    R$ {quoteBasket.reduce((acc, b) => acc + b.qtd * b.valorUnitario, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-[#1f293d] mt-2">
                <button
                  type="button"
                  onClick={() => setIsQuoteModalOpen(false)}
                  className="bg-[#1f293d] hover:bg-gray-700 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={quoteBasket.length === 0 || quoteFornecedorId === 0 || isParsingQuote}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-bold text-xs px-6 py-2.5 rounded-lg shadow-lg shadow-emerald-500/20 transition-all flex items-center space-x-2"
                >
                  <span>Confirmar & Salvar Orçamento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
