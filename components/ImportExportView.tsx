"use client";

import React, { useRef, useState } from "react";
import { useErp } from "@/hooks/use-erp";
import { 
  Download, 
  Upload, 
  Database, 
  AlertCircle, 
  FileSpreadsheet, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Info 
} from "lucide-react";
import * as XLSX from "xlsx";

export default function ImportExportView() {
  const { 
    products, 
    bom, 
    stock, 
    importProductsAndBomFromRows 
  } = useErp();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importReport, setImportReport] = useState<{
    success: boolean;
    productsAdded: number;
    productsUpdated: number;
    bomAdded: number;
    bomUpdated: number;
    errors: string[];
    fileName: string;
  } | null>(null);

  // Helper to construct the standard arrays with user-friendly headers
  const getProductsExportData = () => {
    return products.map(p => {
      const stockItem = stock.find(s => s.prodId === p.id);
      return {
        "Código": p.codigo,
        "Descrição": p.descricao,
        "Tipo": p.tipo,
        "Unidade": p.unidade,
        "Valor Unitário": p.valor,
        "Lead Time (Dias)": p.leadTime,
        "Estoque Atual": stockItem ? stockItem.qtd : 0,
        "Estoque Mínimo": stockItem ? stockItem.minimo : 5,
        "Grupo": p.grupo || "",
        "Seg. Un. Medida": p.segUnMedida || "",
        "Fator Conv.": p.fatorConversao || "",
        "Tipo de Conv.": p.tipoConversao || "",
        "Preço Venda": p.precoVenda || "",
        "Moeda C.Std": p.moedaCusto || "",
        "Peso Líquido": p.pesoLiquido || "",
        "Família": p.familia || ""
      };
    });
  };

  const getBomExportData = () => {
    return bom.map(b => {
      const parent = products.find(p => p.id === b.parentId);
      const component = products.find(p => p.id === b.componentId);
      return {
        "Produto Pai (Código)": parent ? parent.codigo : `ID-${b.parentId}`,
        "Componente (Código)": component ? component.codigo : `ID-${b.componentId}`,
        "Quantidade Necessária": b.quantidade
      };
    });
  };

  // Export as Multi-tab Excel (.xlsx)
  const handleExportXlsx = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // 1. Products Sheet
      const prodData = getProductsExportData();
      const wsProd = XLSX.utils.json_to_sheet(prodData);
      XLSX.utils.book_append_sheet(wb, wsProd, "Produtos");
      
      // 2. BOM Sheet
      const bomData = getBomExportData();
      const wsBom = XLSX.utils.json_to_sheet(bomData);
      XLSX.utils.book_append_sheet(wb, wsBom, "Estruturas BOM");
      
      // Save Workbook
      XLSX.writeFile(wb, `erp_dados_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (e: any) {
      alert("Erro ao exportar planilha Excel: " + e.message);
    }
  };

  // Export Products as plain CSV
  const handleExportProductsCsv = () => {
    try {
      const prodData = getProductsExportData();
      const ws = XLSX.utils.json_to_sheet(prodData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      downloadCsvFile(csv, `erp_produtos_${new Date().toISOString().split("T")[0]}.csv`);
    } catch (e: any) {
      alert("Erro ao exportar CSV de Produtos: " + e.message);
    }
  };

  // Export BOM as plain CSV
  const handleExportBomCsv = () => {
    try {
      const bomData = getBomExportData();
      const ws = XLSX.utils.json_to_sheet(bomData);
      const csv = XLSX.utils.sheet_to_csv(ws);
      
      downloadCsvFile(csv, `erp_estruturas_bom_${new Date().toISOString().split("T")[0]}.csv`);
    } catch (e: any) {
      alert("Erro ao exportar CSV de Estruturas: " + e.message);
    }
  };

  const downloadCsvFile = (csvContent: string, fileName: string) => {
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Sample Templates for Excel
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    // Sample Products Data
    const sampleProds = [
      {
        "Código": "MP-PAR-M6",
        "Descrição": "Parafuso M6 Zincado Sextavado",
        "Tipo": "Insumo",
        "Unidade": "UN",
        "Valor Unitário": 0.35,
        "Lead Time (Dias)": 2,
        "Estoque Atual": 200,
        "Estoque Mínimo": 50
      },
      {
        "Código": "SA-SUP-MET",
        "Descrição": "Suporte Metálico Reforçado",
        "Tipo": "Semi-acabado",
        "Unidade": "UN",
        "Valor Unitário": 15.80,
        "Lead Time (Dias)": 3,
        "Estoque Atual": 15,
        "Estoque Mínimo": 5
      },
      {
        "Código": "PA-SUP-MAQ",
        "Descrição": "Suporte de Máquina Montado",
        "Tipo": "Acabado",
        "Unidade": "UN",
        "Valor Unitário": 120.00,
        "Lead Time (Dias)": 4,
        "Estoque Atual": 5,
        "Estoque Mínimo": 2
      }
    ];

    // Sample BOM Data
    const sampleBom = [
      {
        "Produto Pai (Código)": "PA-SUP-MAQ",
        "Componente (Código)": "SA-SUP-MET",
        "Quantidade Necessária": 1
      },
      {
        "Produto Pai (Código)": "PA-SUP-MAQ",
        "Componente (Código)": "MP-PAR-M6",
        "Quantidade Necessária": 4
      }
    ];

    const wsProd = XLSX.utils.json_to_sheet(sampleProds);
    const wsBom = XLSX.utils.json_to_sheet(sampleBom);
    XLSX.utils.book_append_sheet(wb, wsProd, "Produtos");
    XLSX.utils.book_append_sheet(wb, wsBom, "Estruturas BOM");

    XLSX.writeFile(wb, "erp_modelo_importacao.xlsx");
  };

  // Handle uploading of files (.xlsx, .xls, .csv)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportReport(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        
        let productsRows: any[] = [];
        let bomRows: any[] = [];

        // Identify Sheets
        // If Excel workbook, check sheet names. If CSV, it only has 1 sheet (usually "Sheet1")
        const sheetNames = workbook.SheetNames;
        
        // Find sheets by keyword or just load sheet 1 and sheet 2 if present
        const prodSheetName = sheetNames.find(name => 
          name.toLowerCase().includes("prod") || name.toLowerCase().includes("item")
        );
        const bomSheetName = sheetNames.find(name => 
          name.toLowerCase().includes("bom") || name.toLowerCase().includes("estrut") || name.toLowerCase().includes("eng")
        );

        if (prodSheetName) {
          productsRows = XLSX.utils.sheet_to_json(workbook.Sheets[prodSheetName]);
        }
        if (bomSheetName) {
          bomRows = XLSX.utils.sheet_to_json(workbook.Sheets[bomSheetName]);
        }

        // Fallback for simple CSV files without explicit sheet names
        if (sheetNames.length === 1 && productsRows.length === 0 && bomRows.length === 0) {
          const singleSheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[0]]);
          
          // Detect if this CSV has products column headers or BOM column headers
          const firstRow = singleSheetData[0] as any;
          if (firstRow) {
            const keys = Object.keys(firstRow).map(k => k.toLowerCase());
            const hasBomKeys = keys.some(k => k.includes("pai") || k.includes("parent") || k.includes("component"));
            
            if (hasBomKeys) {
              bomRows = singleSheetData;
            } else {
              productsRows = singleSheetData;
            }
          }
        }

        if (productsRows.length === 0 && bomRows.length === 0) {
          throw new Error("Nenhum dado legível de Produtos ou Estruturas encontrado no arquivo. Use o modelo para referência.");
        }

        // Trigger Import
        const result = importProductsAndBomFromRows(productsRows, bomRows);
        setImportReport({
          success: true,
          productsAdded: result.productsAdded,
          productsUpdated: result.productsUpdated,
          bomAdded: result.bomAdded,
          bomUpdated: result.bomUpdated,
          errors: result.errors,
          fileName: file.name
        });
      } catch (err: any) {
        console.error(err);
        setImportReport({
          success: false,
          productsAdded: 0,
          productsUpdated: 0,
          bomAdded: 0,
          bomUpdated: 0,
          errors: [err.message || "Erro desconhecido ao processar planilha."],
          fileName: file.name
        });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6 font-sans animate-fade-in max-w-4xl mx-auto pb-10">
      {/* Header Panel */}
      <div className="bg-[#111827] border border-[#1f293d] p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-white flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            <span>Importação / Exportação de Planilhas</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Transfira dados de Cadastro de Produtos e Estruturas de Engenharia (BOM) via planilhas <strong>Excel (.xlsx)</strong> ou arquivos <strong>CSV (.csv)</strong>.
          </p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3.5 py-2 rounded-lg text-xs font-bold transition-colors border border-[#1f293d] flex items-center space-x-1.5 shrink-0"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Baixar Planilha Modelo (.xlsx)</span>
        </button>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Panel */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center">
              <Download className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Exportar Dados Atuais</h3>
              <p className="text-xs text-gray-400 mt-1">
                Baixe o cadastro de produtos e a árvore de produtos (BOM) em formato de planilhas prontas para edição ou backup.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <button
              onClick={handleExportXlsx}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Planilha Excel (.xlsx)</span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleExportProductsCsv}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-[#1f293d] font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span>Produtos (CSV)</span>
              </button>
              <button
                onClick={handleExportBomCsv}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 border border-[#1f293d] font-bold py-2 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span>BOM (CSV)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Import Panel */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
              <Upload className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Importar Planilha / CSV</h3>
              <p className="text-xs text-gray-400 mt-1">
                Envie uma planilha preenchida contendo os dados de produtos e/ou estruturas para serem incorporados ao sistema.
              </p>
            </div>
          </div>

          <div>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-bold py-3 rounded-lg text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{isImporting ? "Processando arquivo..." : "Selecionar Planilha (.xlsx, .csv)"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Import Report Panel */}
      {importReport && (
        <div className={`border p-5 rounded-xl animate-fade-in ${importReport.success ? "bg-emerald-950/20 border-emerald-500/30" : "bg-red-950/20 border-red-500/30"}`}>
          <div className="flex items-center space-x-2.5 mb-3">
            {importReport.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <XCircle className="w-5 h-5 text-red-400" />
            )}
            <h4 className="font-bold text-sm text-white">
              Relatório de Importação: <span className="font-mono text-gray-400 text-xs font-normal">{importReport.fileName}</span>
            </h4>
          </div>

          {importReport.success ? (
            <div className="space-y-3">
              <p className="text-xs text-emerald-200">
                O arquivo foi processado com sucesso! Veja abaixo o resumo das mesclagens efetuadas para garantir a não-duplicidade:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0b0f17]/60 p-4 rounded-lg border border-[#1f293d]">
                <div className="text-center">
                  <span className="block font-mono text-lg font-black text-emerald-400">{importReport.productsAdded}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Novos Produtos</span>
                </div>
                <div className="text-center border-l border-[#1f293d]/50">
                  <span className="block font-mono text-lg font-black text-blue-400">{importReport.productsUpdated}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Produtos Atualizados</span>
                </div>
                <div className="text-center border-l border-[#1f293d]/50">
                  <span className="block font-mono text-lg font-black text-indigo-400">{importReport.bomAdded}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Novas Estruturas</span>
                </div>
                <div className="text-center border-l border-[#1f293d]/50">
                  <span className="block font-mono text-lg font-black text-purple-400">{importReport.bomUpdated}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Estruturas Atualiz.</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-red-300">
              Não foi possível concluir a importação devido ao seguinte erro:
            </p>
          )}

          {importReport.errors.length > 0 && (
            <div className="mt-3.5 space-y-1 bg-black/40 p-3 rounded-lg border border-red-500/20 max-h-40 overflow-y-auto">
              <span className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Avisos e Erros:</span>
              {importReport.errors.map((err, i) => (
                <div key={i} className="text-xs font-mono text-red-400 flex items-start space-x-1.5">
                  <span className="shrink-0">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Explanatory Guide Box */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 space-y-3.5">
        <h4 className="text-sm font-bold text-gray-200 flex items-center space-x-2">
          <Info className="w-4 h-4 text-blue-400" />
          <span>Regras de Validação Inteligente (Anti-Duplicidade)</span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-400 divide-y md:divide-y-0 md:divide-x divide-[#1f293d]/60">
          <div className="space-y-2 pr-0 md:pr-4">
            <h5 className="font-bold text-gray-300 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>Cadastro de Produtos</span>
            </h5>
            <p className="leading-relaxed">
              A chave de validação é o <strong>Código do Produto</strong>. Se o código enviado na planilha já existir, o sistema atualizará a descrição, unidade, valor e lead-time, mantendo o ID interno. Caso o código seja novo, ele criará o produto e gerará seu respectivo inventário de estoque automaticamente.
            </p>
          </div>
          <div className="space-y-2 pt-3 md:pt-0 pl-0 md:pl-4">
            <h5 className="font-bold text-gray-300 flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span>Estrutura de Produtos (BOM)</span>
            </h5>
            <p className="leading-relaxed">
              O vínculo de estruturas é feito informando o <strong>Código do Produto Pai</strong> e o <strong>Código do Componente</strong>. Se esse par já estiver cadastrado na engenharia, o sistema apenas atualizará a quantidade necessária, evitando duplicar a linha de relacionamento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
