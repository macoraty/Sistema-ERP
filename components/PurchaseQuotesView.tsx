"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useErp } from "@/hooks/use-erp";
import { FileText, Plus, Trash2, X, Download, Paperclip, Search, Sparkles, ChevronUp, ChevronDown, UploadCloud, Check, Loader2, FileCheck } from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { getTodayFormatted } from "@/lib/working-days";
import { Quote } from "@/lib/types";

export default function PurchaseQuotesView() {
  const {
    quotes,
    saveQuote,
    deleteQuote,
    purchaseNeeds,
    contacts,
    products,
    savePurchaseNeed,
  } = useErp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quoteType, setQuoteType] = useState<"need" | "avulso">("avulso");
  const [selectedNeedId, setSelectedNeedId] = useState<number>(0);
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<number>(0);
  const [pdfName, setPdfName] = useState("");
  const [basket, setBasket] = useState<{ prodId: number; qtd: number; valorUnitario: number }[]>([]);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [parsingStep, setParsingStep] = useState("");
  const [isDragging, setIsDragging] = useState(false);

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

  // Product Autocomplete States for direct item entry
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [selectedProductIdForEntry, setSelectedProductIdForEntry] = useState<number | null>(null);
  const [entryQtd, setEntryQtd] = useState("1");
  const [entryPrice, setEntryPrice] = useState("");

  const pendingNeeds = useMemo(
    () => purchaseNeeds.filter((n) => n.status !== "Cotado"),
    [purchaseNeeds],
  );
  const fornecedores = useMemo(
    () => contacts.filter((c) => c.tipo === "Fornecedor"),
    [contacts],
  );

  // Initialize quoteType on load or when modal opens
  const openRegistrationModal = () => {
    if (pendingNeeds.length > 0) {
      setQuoteType("need");
      handleNeedChange(pendingNeeds[0].id);
    } else {
      setQuoteType("avulso");
      setBasket([]);
    }
    setSelectedFornecedorId(0);
    setPdfName("");
    setProductSearchQuery("");
    setSelectedProductIdForEntry(null);
    setEntryQtd("1");
    setEntryPrice("");
    setIsModalOpen(true);
  };

  const handleNeedChange = (needId: number) => {
    setSelectedNeedId(needId);
    const need = purchaseNeeds.find((n) => n.id === needId);
    if (need) {
      setBasket(
        need.itens.map((item) => ({
          prodId: item.prodId,
          qtd: item.qtd,
          valorUnitario: 0,
        }))
      );
    } else {
      setBasket([]);
    }
  };

  const handleUpdateUnitValue = (index: number, valStr: string) => {
    const val = parseFloat(valStr) || 0;
    const updated = [...basket];
    updated[index].valorUnitario = val;
    setBasket(updated);
  };

  const handleUpdateQtdValue = (index: number, qtdStr: string) => {
    const val = parseFloat(qtdStr) || 0;
    const updated = [...basket];
    updated[index].qtd = val;
    setBasket(updated);
  };

  const handleRemoveFromBasket = (index: number) => {
    setBasket(basket.filter((_, idx) => idx !== index));
  };

  const filteredProductsForSearch = useMemo(() => {
    let result = products;
    if (productSearchQuery) {
      result = products.filter(
        (p) =>
          p.codigo.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
          p.descricao.toLowerCase().includes(productSearchQuery.toLowerCase())
      );
    }
    return [...result].sort((a, b) => a.descricao.localeCompare(b.descricao));
  }, [products, productSearchQuery]);

  const selectProductForEntry = (p: typeof products[0]) => {
    setSelectedProductIdForEntry(p.id);
    setProductSearchQuery(`[${p.codigo}] - ${p.descricao}`);
    setEntryPrice(p.valor.toString() || "0");
    setShowProductSuggestions(false);
  };

  const handleAddToBasket = () => {
    if (!selectedProductIdForEntry) {
      alert("Por favor, selecione um produto com estrutura.");
      return;
    }
    const qty = parseFloat(entryQtd);
    if (isNaN(qty) || qty <= 0) {
      alert("Por favor, digite uma quantidade válida.");
      return;
    }
    const price = parseFloat(entryPrice);
    if (isNaN(price) || price < 0) {
      alert("Por favor, digite um preço unitário válido.");
      return;
    }

    const existingIdx = basket.findIndex((b) => b.prodId === selectedProductIdForEntry);
    if (existingIdx !== -1) {
      const updated = [...basket];
      updated[existingIdx].qtd += qty;
      updated[existingIdx].valorUnitario = price;
      setBasket(updated);
    } else {
      setBasket([
        ...basket,
        {
          prodId: selectedProductIdForEntry,
          qtd: qty,
          valorUnitario: price,
        },
      ]);
    }

    // Reset entry fields
    setSelectedProductIdForEntry(null);
    setProductSearchQuery("");
    setEntryQtd("1");
    setEntryPrice("");
    setShowProductSuggestions(false);
  };

  const handlePdfUpload = async (file: File) => {
    setPdfName(file.name);
    setIsParsingPdf(true);
    setParsingStep("Lendo arquivo...");

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });

      setParsingStep("Analisando com Inteligência Artificial...");
      const response = await fetch("/api/parse-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileBase64: base64,
          mimeType: file.type || "application/pdf",
          products: products,
        }),
      });

      if (!response.ok) {
        throw new Error("Erro na resposta do servidor.");
      }

      const data = await response.json();
      if (data.items && Array.isArray(data.items)) {
        setParsingStep("Mapeando itens com catálogo...");
        
        const extractedItens = data.items.map((item: any) => ({
          prodId: Number(item.prodId),
          qtd: Number(item.qtd),
          valorUnitario: Number(item.valorUnitario),
        }));

        setBasket(extractedItens);
        setParsingStep("Concluído!");
      } else {
        throw new Error("Formato de resposta inválido.");
      }
    } catch (err) {
      console.error("Erro ao analisar arquivo:", err);
      alert("Não foi possível analisar o arquivo automaticamente usando IA. Mas você pode adicionar os itens manualmente logo abaixo!");
    } finally {
      setIsParsingPdf(false);
      setParsingStep("");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
      const isImage = file.type.startsWith("image/");
      if (isPdf || isImage) {
        handlePdfUpload(file);
      } else {
        alert("Por favor, envie apenas arquivos no formato PDF ou Imagem.");
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handlePdfUpload(file);
    }
  };

  const handleSaveQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (quoteType === "need" && !selectedNeedId) {
      alert("Por favor, selecione uma lista de necessidades base.");
      return;
    }
    if (!selectedFornecedorId) {
      alert("Por favor, selecione um fornecedor. Se não houver nenhum, cadastre um em Clientes & Fornecedores.");
      return;
    }
    if (basket.length === 0) {
      alert("Por favor, adicione pelo menos um item ao orçamento.");
      return;
    }

    const totalCalculado = basket.reduce((acc, b) => acc + b.qtd * b.valorUnitario, 0);

    saveQuote({
      purchaseNeedId: quoteType === "need" ? selectedNeedId : 0,
      fornecedorId: selectedFornecedorId,
      dataCotacao: getTodayFormatted(),
      valorTotal: totalCalculado,
      arquivoPdf: pdfName || undefined,
      itens: basket,
      status: "Aguardando",
    });

    if (quoteType === "need" && selectedNeedId > 0) {
      const need = purchaseNeeds.find((n) => n.id === selectedNeedId);
      if (need) {
        savePurchaseNeed({
          ...need,
          status: "Cotado",
        });
      }
    }

    setIsModalOpen(false);
    setSelectedNeedId(0);
    setSelectedFornecedorId(0);
    setPdfName("");
    setBasket([]);
  };

  const getFornecedorName = (id: number) => {
    return contacts.find((c) => c.id === id)?.nome || "Fornecedor Desconhecido";
  };

  const getProductDetails = (id: number) => {
    const p = products.find((prod) => prod.id === id);
    return p
      ? { codigo: p.codigo, descricao: p.descricao, unidade: p.unidade }
      : { codigo: "—", descricao: "Insumo Desconhecido", unidade: "UN" };
  };

  const totalGeral = useMemo(() => {
    return basket.reduce((acc, item) => acc + item.qtd * item.valorUnitario, 0);
  }, [basket]);

  const sortedQuotes = useMemo(() => {
    if (!sortField) return quotes;
    return [...quotes].sort((a, b) => {
      let valA = a[sortField as keyof Quote] ?? "";
      let valB = b[sortField as keyof Quote] ?? "";

      if (sortField === "fornecedorId") {
        valA = getFornecedorName(a.fornecedorId);
        valB = getFornecedorName(b.fornecedorId);
      }

      if (sortField === "valorTotal" || sortField === "id") {
        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        return sortDirection === "asc" ? numA - numB : numB - numA;
      }

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [quotes, sortField, sortDirection, contacts]);

  return (
    <div className="space-y-6 font-sans animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827] border border-[#1f293d] p-5 rounded-xl shadow-lg">
        <div>
          <h2 className="text-lg font-black text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-500 animate-pulse" />
            <span>Orçamentos de Compras</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Registre os orçamentos recebidos dos fornecedores para as necessidades de compra de forma rápida e centralizada.
          </p>
        </div>
        <button
          onClick={openRegistrationModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-colors shadow-md shadow-emerald-900/20 hover:scale-[1.02] transform duration-150"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Orçamento</span>
        </button>
      </div>

      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#1f293d] bg-[#0f1523] flex justify-between items-center">
          <h3 className="font-bold text-gray-300 text-sm flex items-center space-x-2">
            <span>Histórico de Orçamentos Cadastrados</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#0b0f17] text-gray-400 text-[10px] uppercase font-black border-b border-[#1f293d] tracking-wider">
                <th 
                  className="py-3.5 px-4 w-28 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('id')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>ID / Data</span>
                    {sortField === 'id' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
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
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('purchaseNeedId')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Ref. Necessidade</span>
                    {sortField === 'purchaseNeedId' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 select-none">Qtd. Itens</th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('valorTotal')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Valor Total</span>
                    {sortField === 'valorTotal' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th className="py-3.5 px-4 select-none">Anexo PDF</th>
                <th className="py-3.5 px-4 text-center select-none">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50 text-gray-300">
              {sortedQuotes.map((q) => (
                <tr key={q.id} className="hover:bg-gray-800/20 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[10px] whitespace-nowrap">
                    <div className="text-white font-bold"># {q.id}</div>
                    <div className="text-gray-500">{q.dataCotacao}</div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-gray-200">
                    {getFornecedorName(q.fornecedorId)}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-gray-400 whitespace-nowrap">
                    {q.purchaseNeedId ? (
                      <span className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded border border-blue-900/50 text-[10px] font-bold">
                        Req. #{q.purchaseNeedId}
                      </span>
                    ) : (
                      <span className="bg-amber-900/20 text-amber-400 px-2 py-0.5 rounded border border-amber-900/30 text-[10px] font-bold">
                        Avulso / Direto
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-gray-400 text-center">
                    {q.itens?.length || 0}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap text-sm">
                    {q.valorTotal.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="py-3.5 px-4 max-w-[150px]">
                    {q.arquivoPdf ? (
                      <div className="flex items-center space-x-1.5 text-blue-400 hover:text-blue-300 cursor-pointer">
                        <Paperclip className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate text-[11px]">{q.arquivoPdf}</span>
                      </div>
                    ) : (
                      <span className="text-gray-600 italic text-[11px]">Sem anexo</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      onClick={() => deleteQuote(q.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      title="Excluir Orçamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {quotes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-500 text-xs italic">
                    Nenhum orçamento registrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-3xl overflow-visible shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d] rounded-t-xl">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Registrar Novo Orçamento</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-md hover:bg-gray-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuote} className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Top Segmented Controls for Quote Source */}
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">
                  Origem do Orçamento
                </label>
                <div className="grid grid-cols-2 gap-2 bg-[#0b0f17] p-1.5 rounded-lg border border-[#1f293d]">
                  <button
                    type="button"
                    disabled={pendingNeeds.length === 0}
                    onClick={() => {
                      setQuoteType("need");
                      if (pendingNeeds.length > 0) {
                        handleNeedChange(pendingNeeds[0].id);
                      }
                    }}
                    className={`py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                      quoteType === "need"
                        ? "bg-emerald-600 text-white shadow"
                        : "text-gray-400 hover:text-white disabled:opacity-30 disabled:hover:text-gray-400"
                    }`}
                  >
                    <span>Vincular a Necessidade ({pendingNeeds.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteType("avulso");
                      setBasket([]);
                    }}
                    className={`py-2 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                      quoteType === "avulso"
                        ? "bg-emerald-600 text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    <span>Orçamento Direto / Avulso</span>
                  </button>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Fornecedor Selection */}
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                    Fornecedor (Remetente do Orçamento)
                  </label>
                  <select
                    value={selectedFornecedorId}
                    onChange={(e) => setSelectedFornecedorId(Number(e.target.value))}
                    required
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg text-white text-xs px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-semibold"
                  >
                    <option value={0} disabled>
                      Selecione o fornecedor...
                    </option>
                    {fornecedores.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.nome} (CNPJ: {f.cnpj})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Left side changes depending on selected quoteType */}
                {quoteType === "need" ? (
                  <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                      Lista de Necessidade Base
                    </label>
                    <select
                      value={selectedNeedId}
                      onChange={(e) => handleNeedChange(Number(e.target.value))}
                      required={quoteType === "need"}
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg text-white text-xs px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-semibold"
                    >
                      <option value={0} disabled>
                        Selecione uma lista de necessidades...
                      </option>
                      {pendingNeeds.map((n) => (
                        <option key={n.id} value={n.id}>
                          Req. #{n.id} — {n.dataCriacao} ({n.itens.length} itens)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="pdf-file-upload-avulso"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                    
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                      Orçamento (PDF ou Imagem)
                    </label>
                    
                    {isParsingPdf ? (
                      <div className="w-full bg-[#0b0f17] border border-blue-500/50 rounded-lg px-3 flex items-center justify-center space-x-2 animate-pulse h-[38px] min-h-[38px]">
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                        <span className="text-[10px] text-gray-400 font-mono truncate">{parsingStep}</span>
                      </div>
                    ) : pdfName ? (
                      <div className="w-full bg-[#0b0f17] border border-emerald-500/30 rounded-lg px-3 flex items-center justify-between h-[38px]">
                        <div className="flex items-center space-x-2 truncate">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="text-[10px] font-bold text-white truncate max-w-[120px] sm:max-w-[160px]" title={pdfName}>
                            {pdfName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPdfName("");
                            setBasket([]);
                          }}
                          className="text-[10px] text-red-400 hover:text-red-300 font-bold ml-2 shrink-0"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById("pdf-file-upload-avulso")?.click()}
                        className={`w-full border border-dashed rounded-lg px-3 flex items-center justify-between cursor-pointer transition-all h-[38px] ${
                          isDragging
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                            : "border-[#1f293d] bg-[#0b0f17] text-gray-400 hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center space-x-1.5 truncate">
                          <UploadCloud className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-[11px] font-medium truncate text-gray-400">
                            Anexar PDF / Imagem (IA Ativa)
                          </span>
                        </div>
                        <span className="text-[9px] bg-[#1f293d]/80 text-gray-300 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                          Upload
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* PDF upload if linked to quoteType need */}
              {quoteType === "need" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">
                      Anexar Orçamento (PDF ou Imagem)
                    </label>
                    <input
                      type="file"
                      id="pdf-file-upload-need"
                      accept=".pdf,image/*"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                    {isParsingPdf ? (
                      <div className="w-full bg-[#0b0f17] border border-blue-500/50 rounded-lg px-4 flex items-center justify-center space-x-2 animate-pulse h-[38px]">
                        <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                        <span className="text-[10px] text-gray-400 font-mono">{parsingStep}</span>
                      </div>
                    ) : pdfName ? (
                      <div className="w-full bg-[#0b0f17] border border-emerald-500/30 rounded-lg px-3 flex items-center justify-between h-[38px]">
                        <div className="flex items-center space-x-2 truncate">
                          <FileCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span className="text-[11px] font-bold text-white truncate max-w-[250px] md:max-w-[400px]" title={pdfName}>
                            {pdfName}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPdfName("")}
                          className="text-[10px] text-red-400 hover:text-red-300 font-bold ml-2 shrink-0"
                        >
                          Remover
                        </button>
                      </div>
                    ) : (
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById("pdf-file-upload-need")?.click()}
                        className={`w-full border border-dashed rounded-lg px-3 flex items-center justify-between cursor-pointer transition-all h-[38px] ${
                          isDragging
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                            : "border-[#1f293d] bg-[#0b0f17] text-gray-400 hover:border-gray-500"
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <UploadCloud className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                          <span className="text-[11px] font-medium truncate text-gray-400">
                            Arraste o PDF ou Imagem do Orçamento aqui ou clique para selecionar
                          </span>
                        </div>
                        <span className="text-[9px] bg-[#1f293d]/80 text-gray-300 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                          Upload
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Direct Input Section for Quote Type Avulso */}
              {quoteType === "avulso" && (
                <div className="bg-[#0b0f17]/50 border border-[#1f293d]/50 p-4 rounded-xl space-y-3.5">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center space-x-2">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    <span>Adicionar Itens e Valores ao Orçamento</span>
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end relative">
                    {/* Search Field */}
                    <div className="md:col-span-5 relative">
                      <label className="block text-gray-500 text-[9px] uppercase font-black mb-1 tracking-wider">
                        Produto / Insumo
                      </label>
                      <SearchableSelect
                        options={[...products]
                          .sort((a, b) => a.descricao.localeCompare(b.descricao))
                          .map((p) => ({
                            id: p.id,
                            label: `[${p.codigo}] - ${p.descricao}`,
                            sublabel: `Unidade: ${p.unidade} | Custo: R$ ${(
                              p.valor || 0
                            ).toLocaleString("pt-BR", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`,
                          }))}
                        selectedValue={selectedProductIdForEntry || 0}
                        onChange={(id) => {
                          const p = products.find((prod) => prod.id === id);
                          if (p) selectProductForEntry(p);
                        }}
                        placeholder="Selecione um insumo..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-gray-500 text-[9px] uppercase font-black mb-1 tracking-wider">
                        Qtd.
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={entryQtd}
                        onChange={(e) => setEntryQtd(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] p-2 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-gray-500 text-[9px] uppercase font-black mb-1 tracking-wider">
                        Preço Unitário (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={entryPrice}
                        onChange={(e) => setEntryPrice(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] p-2 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={handleAddToBasket}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 px-1 rounded-lg transition-colors flex items-center justify-center space-x-1"
                        style={{ height: "38px" }}
                      >
                        <Plus className="w-4 h-4" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Basket / Item Pricing Table */}
              <div className="border border-[#1f293d] rounded-xl overflow-hidden bg-[#0b0f17]/30">
                <div className="px-4 py-3 bg-[#0f1523] border-b border-[#1f293d] flex justify-between items-center">
                  <h4 className="font-bold text-gray-300 text-xs uppercase tracking-wider">
                    Itens e Preços Registrados no Orçamento
                  </h4>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                    {basket.length} {basket.length === 1 ? "item" : "itens"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#0b0f17] text-gray-400 text-[9px] uppercase font-black border-b border-[#1f293d] tracking-wider">
                        <th className="py-2.5 px-3">Insumo / Componente</th>
                        <th className="py-2.5 px-3 w-28 text-center">Quantidade</th>
                        <th className="py-2.5 px-3 w-36">Preço Unitário (R$)</th>
                        <th className="py-2.5 px-3 w-32">Subtotal</th>
                        {quoteType === "avulso" && <th className="py-2.5 px-3 w-12 text-center">Ações</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f293d]/40 text-gray-300">
                      {basket.map((item, index) => {
                        const { codigo, descricao, unidade } = getProductDetails(item.prodId);
                        const subtotal = item.qtd * item.valorUnitario;
                        return (
                          <tr key={item.prodId} className="hover:bg-gray-800/10">
                            <td className="py-2.5 px-3">
                              <span className="font-mono text-blue-400 font-bold">[{codigo}]</span>{" "}
                              <span className="text-gray-200">{descricao}</span>
                              <span className="text-[9px] text-gray-500 font-bold uppercase ml-1">
                                ({unidade})
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {quoteType === "need" ? (
                                <span className="font-mono font-bold text-gray-200">{item.qtd}</span>
                              ) : (
                                <input
                                  type="number"
                                  step="any"
                                  value={item.qtd}
                                  onChange={(e) => handleUpdateQtdValue(index, e.target.value)}
                                  className="w-20 text-center bg-[#0b0f17] border border-[#1f293d] py-1 rounded text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                                />
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[10px] text-gray-500 font-bold font-mono">
                                  R$
                                </span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={item.valorUnitario || ""}
                                  onChange={(e) => handleUpdateUnitValue(index, e.target.value)}
                                  required
                                  className="w-full bg-[#0b0f17] border border-[#1f293d] pl-7 pr-2 py-1 rounded text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">
                              {subtotal.toLocaleString("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              })}
                            </td>
                            {quoteType === "avulso" && (
                              <td className="py-2.5 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFromBasket(index)}
                                  className="text-gray-500 hover:text-red-400 p-1"
                                  title="Remover Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {basket.length === 0 && (
                        <tr>
                          <td colSpan={quoteType === "avulso" ? 5 : 4} className="py-6 text-center text-gray-500 italic">
                            Nenhum item adicionado a este orçamento ainda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#0f1523] px-4 py-3 flex justify-between items-center border-t border-[#1f293d] text-xs">
                  <span className="text-gray-400 font-bold">Total Geral do Orçamento:</span>
                  <span className="text-sm font-mono font-black text-emerald-400 bg-[#0b0f17] px-3 py-1 rounded-md border border-[#1f293d]">
                    {totalGeral.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end space-x-3 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={basket.length === 0}
                  className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center space-x-2 transition-colors shadow-md shadow-emerald-950/20"
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

