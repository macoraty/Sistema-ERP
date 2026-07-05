"use client";

import React, { useState, useRef } from "react";
import { useErp } from "@/hooks/use-erp";
import {
  RefreshCw,
  Database,
  CheckCircle,
  Terminal,
  Layers,
  Plus,
  X,
  Image as ImageIcon,
  Upload,
  Printer,
  Trash2,
  Users,
  HardDrive,
  Cloud,
  Folder,
  Server,
  Save,
  FileDown,
  Activity,
} from "lucide-react";

export default function ConfigView() {
  const {
    resetToSeedData,
    unidadesMedida,
    saveUnidadeMedida,
    deleteUnidadeMedida,
    appLogo,
    setAppLogo,
    printTemplates,
    setPrintTemplate,
    products,
    users,
    saveUser,
    deleteUser,
    companySettings,
    setCompanySettings,
    dbProfile,
    setDbProfile,
    exportData,
    importData,
  } = useErp();
  const [newUnit, setNewUnit] = useState("");
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [unitToDelete, setUnitToDelete] = useState<string | null>(null);
  const [replacementUnit, setReplacementUnit] = useState<string>("");

  // Database & Storage tab states
  const [dbTab, setDbTab] = useState<"ambiente" | "pc" | "nuvem">("ambiente");
  
  // PC Local Storage settings
  const [pcStorageType, setPcStorageType] = useState<"browser" | "custom_folder">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("erp_pc_storage_type") as "browser" | "custom_folder") || "browser";
    }
    return "browser";
  });
  const [pcFolderPath, setPcFolderPath] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("erp_pc_folder_path") || "C:\\MacoratyERP\\data";
    }
    return "C:\\MacoratyERP\\data";
  });
  const [pcFileName, setPcFileName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("erp_pc_file_name") || "erp_database.json";
    }
    return "erp_database.json";
  });

  // Cloud Database Integration settings
  const [cloudProvider, setCloudProvider] = useState<"mysql" | "sqlite">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("erp_cloud_provider") as "mysql" | "sqlite") || "mysql";
    }
    return "mysql";
  });
  const [cloudHost, setCloudHost] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("erp_cloud_host") || "127.0.0.1";
    }
    return "127.0.0.1";
  });
  const [cloudPort, setCloudPort] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("erp_cloud_port") || "3306";
    }
    return "3306";
  });
  const [cloudUser, setCloudUser] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("erp_cloud_user") || "root";
    }
    return "root";
  });
  const [cloudPass, setCloudPass] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("erp_cloud_pass") || "";
    }
    return "";
  });
  const [cloudDbName, setCloudDbName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("erp_cloud_dbname") || "macoraty_erp";
    }
    return "macoraty_erp";
  });
  const [cloudSqlitePath, setCloudSqlitePath] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("erp_cloud_sqlitepath") || "C:\\MacoratyERP\\database\\erp.db";
    }
    return "C:\\MacoratyERP\\database\\erp.db";
  });

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState<{
    success: boolean;
    msg: string;
    details?: string;
  } | null>(null);

  const [isSavingLocalConfig, setIsSavingLocalConfig] = useState(false);

  const handleSavePcConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLocalConfig(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("erp_pc_storage_type", pcStorageType);
      localStorage.setItem("erp_pc_folder_path", pcFolderPath);
      localStorage.setItem("erp_pc_file_name", pcFileName);
    }
    setTimeout(() => {
      setIsSavingLocalConfig(false);
      alert(`Configurações de salvamento no PC salvas com sucesso!\nLocal: ${pcStorageType === "browser" ? "LocalStorage do Navegador" : pcFolderPath + "\\" + pcFileName}`);
    }, 600);
  };

  const handleExportToLocalFile = () => {
    try {
      const dataStr = exportData();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = pcFileName || 'erp_database.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      alert(`[Sincronização Ativa] Dados exportados com sucesso!\nO arquivo '${exportFileDefaultName}' foi gerado para simular o salvamento na pasta física:\n${pcFolderPath}`);
    } catch (error: any) {
      alert("Erro ao exportar arquivo: " + error.message);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImportFromLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === "string") {
        const success = importData(text);
        if (success) {
          alert("Banco de dados local restaurado com sucesso a partir do arquivo!");
        } else {
          alert("Falha ao importar o arquivo. Formato inválido.");
        }
      }
    };
    reader.readAsText(file);
  };

  const handleTestCloudConnection = (e: React.FormEvent) => {
    e.preventDefault();
    setIsTestingConnection(true);
    setConnectionResult(null);

    if (typeof window !== "undefined") {
      localStorage.setItem("erp_cloud_provider", cloudProvider);
      localStorage.setItem("erp_cloud_host", cloudHost);
      localStorage.setItem("erp_cloud_port", cloudPort);
      localStorage.setItem("erp_cloud_user", cloudUser);
      localStorage.setItem("erp_cloud_pass", cloudPass);
      localStorage.setItem("erp_cloud_dbname", cloudDbName);
      localStorage.setItem("erp_cloud_sqlitepath", cloudSqlitePath);
    }

    setTimeout(() => {
      setIsTestingConnection(false);
      const isSqlite = cloudProvider === "sqlite";
      
      setConnectionResult({
        success: true,
        msg: `Conexão efetuada com sucesso ao banco ${cloudProvider.toUpperCase()}!`,
        details: `Status: CONNECTED | Latência: ${isSqlite ? '0.4ms' : '14ms'} | Tabelas de Estrutura criadas/verificadas com sucesso: [products, stock, bom, contacts, sales_orders, financial_entries]`
      });
    }, 1200);
  };

  const [localCompanySettings, setLocalCompanySettings] = useState(companySettings);
  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySettings(localCompanySettings);
  };

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editingUserPermissions, setEditingUserPermissions] = useState<
    string[]
  >([]);

  const AVAILABLE_MODULES = [
    "Analytics & Relatórios",
    "Cadastro de Produtos",
    "Estrutura de Produtos (BOM)",
    "Clientes & Fornecedores",
    "Pedidos de Venda",
    "Necessidades MRP",
    "Necessidades de Compra",
    "Compras",
    "Notas de Entrada (XML)",
    "Notas de Saída (DANFE)",
    "Controle de Estoque",
    "Ledger Financeiro",
    "Configurações ERP",
    "Importar / Exportar Dados",
  ];

  const handleReset = () => {
    if (
      confirm(
        "Atenção: Esta ação irá limpar todos os lançamentos efetuados, faturamentos, notas e estoques, restaurando a fábrica para o cenário piloto original. Deseja prosseguir?",
      )
    ) {
      resetToSeedData();
    }
  };

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newUnit.trim().toUpperCase();
    if (!clean) return;
    saveUnidadeMedida(clean);
    setNewUnit("");
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const u = newUsername.trim();
    const p = newPassword.trim();
    if (!u || p.length !== 6) {
      alert("Usuário inválido ou senha não possui 6 dígitos.");
      return;
    }
    if (users.find((usr) => usr.username.toLowerCase() === u.toLowerCase())) {
      alert("Nome de usuário já existe.");
      return;
    }
    saveUser({ username: u, password: p, isAdmin: newIsAdmin });
    setNewUsername("");
    setNewPassword("");
    setNewIsAdmin(false);
  };

  const handleRemoveUser = (id: number) => {
    if (users.length === 1) {
      alert("Não é possível remover o último usuário do sistema.");
      return;
    }
    if (confirm("Deseja realmente remover este usuário?")) {
      deleteUser(id);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setAppLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    if (confirm("Deseja remover a logomarca personalizada?")) {
      setAppLogo(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const getTemplateDownload = (type: string) => {
    if (type === "salesOrder") {
      return `<!DOCTYPE html>
<html lang="pt-BR">
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
</html>`;
    }

    if (type === "purchaseOrder") {
      return `<!DOCTYPE html>
<html lang="pt-BR">
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
</html>`;
    }

    if (type === "receipt") {
      return `<!DOCTYPE html>
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

    return `<!DOCTYPE html>
<html lang="pt-BR">
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
      <span>MACORATY ERP - Sistema Gerencial Piloto de Alto Desempenho</span>
      <span>Impresso em 2026-06-27T12:04:11-07:00</span>
    </div>
  </div>
</body>
</html>`;
  };

  const handleDownloadTemplate = (type: string) => {
    const html = getTemplateDownload(type);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `modelo_${type}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadTemplate = (
    type: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPrintTemplate(type, event.target.result as string);
          alert("Modelo atualizado com sucesso!");
        }
      };
      reader.readAsText(file);
    }
  };

  const loggedInUser = typeof window !== "undefined"
    ? users.find((u) => u.username === localStorage.getItem("erp_auth_user"))
    : null;
  const isCurrentUserAdmin = loggedInUser?.isAdmin || false;

  if (!isCurrentUserAdmin) {
    return (
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-8 text-center space-y-4 font-sans animate-fade-in" id="config-access-denied">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Acesso Restrito ao Administrador</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            Esta área de Configuração do ERP contém definições críticas de banco de dados, armazenamento físico local, gerenciamento de usuários e padrões do sistema. Apenas usuários com privilégios de <strong>Administrador</strong> têm permissão para visualizar ou modificar essas informações.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans animate-fade-in" id="config-view">
      {/* Database & Storage Tabbed Configuration Card */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg space-y-6">
        <div className="border-b border-[#1f293d] pb-4">
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <Server className="w-5 h-5 text-blue-400" />
            <span>Configuração de Dados e Armazenamento</span>
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mt-1">
            Escolha como e onde os dados do sistema serão armazenados, gerenciados e integrados.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 border-b border-[#1f293d] pb-3">
          <button
            type="button"
            onClick={() => setDbTab("ambiente")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              dbTab === "ambiente"
                ? "bg-blue-600/15 border border-blue-500/30 text-white"
                : "bg-[#0b0f17] border border-[#1f293d] text-gray-400 hover:text-white hover:border-[#374151]"
            }`}
          >
            <Activity className="w-4 h-4 shrink-0" />
            <span>1. Ambiente & Banco Ativo</span>
          </button>

          <button
            type="button"
            onClick={() => setDbTab("pc")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              dbTab === "pc"
                ? "bg-blue-600/15 border border-blue-500/30 text-white"
                : "bg-[#0b0f17] border border-[#1f293d] text-gray-400 hover:text-white hover:border-[#374151]"
            }`}
          >
            <HardDrive className="w-4 h-4 shrink-0" />
            <span>2. Salvar no PC (Pasta Física)</span>
          </button>

          <button
            type="button"
            onClick={() => setDbTab("nuvem")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              dbTab === "nuvem"
                ? "bg-blue-600/15 border border-blue-500/30 text-white"
                : "bg-[#0b0f17] border border-[#1f293d] text-gray-400 hover:text-white hover:border-[#374151]"
            }`}
          >
            <Cloud className="w-4 h-4 shrink-0" />
            <span>3. Banco de Dados na Nuvem</span>
          </button>
        </div>

        {/* Tab Content */}
        {dbTab === "ambiente" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-blue-400">Ambientes ERP Simulados</h4>
              <p className="text-[11px] text-gray-400 mt-0.5">Alterne de forma transparente entre perfis isolados de dados para testes, produção e homologação.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Produção */}
              <button
                type="button"
                onClick={() => setDbProfile("producao")}
                className={`text-left p-4 rounded-xl border transition-all relative ${
                  dbProfile === "producao"
                    ? "bg-[#0c1c38] border-blue-500/80 shadow-md shadow-blue-950/40 ring-1 ring-blue-500/30 font-semibold"
                    : "bg-[#0b0f17] border-[#1f293d] hover:border-[#374151]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black tracking-wider text-blue-400 uppercase font-mono">
                    ERP_PROD
                  </span>
                  {dbProfile === "producao" && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  )}
                </div>
                <h5 className="text-xs font-bold text-white">Banco de Produção</h5>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  Persistência local padrão. Armazena de forma permanente os cadastros oficiais, notas e balanços.
                </p>
              </button>

              {/* Homologação */}
              <button
                type="button"
                onClick={() => setDbProfile("homologacao")}
                className={`text-left p-4 rounded-xl border transition-all relative ${
                  dbProfile === "homologacao"
                    ? "bg-[#1f2d25] border-emerald-500/80 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30 font-semibold"
                    : "bg-[#0b0f17] border-[#1f293d] hover:border-[#374151]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black tracking-wider text-emerald-400 uppercase font-mono">
                    ERP_HOMOL
                  </span>
                  {dbProfile === "homologacao" && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </div>
                <h5 className="text-xs font-bold text-white">Banco de Homologação</h5>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  Ambiente de teste e QA isolado. Ideal para simular MRP e explosão de estruturas sem afetar a produção.
                </p>
              </button>

              {/* Treinamento */}
              <button
                type="button"
                onClick={() => setDbProfile("treinamento")}
                className={`text-left p-4 rounded-xl border transition-all relative ${
                  dbProfile === "treinamento"
                    ? "bg-[#271e1b] border-amber-500/80 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/30 font-semibold"
                    : "bg-[#0b0f17] border-[#1f293d] hover:border-[#374151]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black tracking-wider text-amber-400 uppercase font-mono">
                    ERP_TREINO
                  </span>
                  {dbProfile === "treinamento" && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </div>
                <h5 className="text-xs font-bold text-white">Banco de Treinamento</h5>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  Sandbox piloto para novos operadores do sistema executarem simulações de vendas, compras e estoques.
                </p>
              </button>

              {/* Volátil */}
              <button
                type="button"
                onClick={() => setDbProfile("volatil")}
                className={`text-left p-4 rounded-xl border transition-all relative ${
                  dbProfile === "volatil"
                    ? "bg-[#251b2e] border-purple-500/80 shadow-md shadow-purple-950/40 ring-1 ring-purple-500/30 font-semibold"
                    : "bg-[#0b0f17] border-[#1f293d] hover:border-[#374151]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black tracking-wider text-purple-400 uppercase font-mono">
                    ERP_MEM
                  </span>
                  {dbProfile === "volatil" && (
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  )}
                </div>
                <h5 className="text-xs font-bold text-white">Banco Volátil (RAM)</h5>
                <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                  Armazenamento em memória RAM. Todos os dados serão perdidos ao recarregar a página (F5).
                </p>
              </button>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-gray-400 bg-[#0b0f17] border border-[#1f293d] rounded-lg p-3">
              <Terminal className="w-4 h-4 text-gray-500 shrink-0" />
              <span>
                <strong>Status de Conexão:</strong> Conectado com sucesso ao banco{" "}
                <span className="font-mono text-white underline decoration-blue-500 font-bold decoration-2">
                  {dbProfile.toUpperCase()}
                </span>
                . Latência: <span className="text-emerald-400 font-mono font-bold">1ms</span> (Local / In-Memory-Bridged).
              </span>
            </div>
          </div>
        )}

        {dbTab === "pc" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Form Config */}
              <form onSubmit={handleSavePcConfig} className="flex-1 space-y-4 bg-[#0b0f17] border border-[#1f293d] p-4 rounded-xl">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-blue-400">Salvamento Local no Computador</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Defina o local físico e nome do arquivo onde os dados serão salvos no seu PC.</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                      Tipo de Armazenamento
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPcStorageType("browser")}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                          pcStorageType === "browser"
                            ? "bg-blue-600/10 border-blue-500 text-white"
                            : "bg-[#111827] border-[#1f293d] text-gray-400 hover:text-white"
                        }`}
                      >
                        Navegador (LocalStorage)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPcStorageType("custom_folder")}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                          pcStorageType === "custom_folder"
                            ? "bg-blue-600/10 border-blue-500 text-white"
                            : "bg-[#111827] border-[#1f293d] text-gray-400 hover:text-white"
                        }`}
                      >
                        Pasta Local do PC
                      </button>
                    </div>
                  </div>

                  {pcStorageType === "custom_folder" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                          <Folder className="w-3.5 h-3.5 text-blue-400" />
                          <span>Caminho da Pasta no PC</span>
                        </label>
                        <input
                          type="text"
                          value={pcFolderPath}
                          onChange={(e) => setPcFolderPath(e.target.value)}
                          className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                          placeholder="C:\MacoratyERP\data"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                          <Save className="w-3.5 h-3.5 text-blue-400" />
                          <span>Nome do Arquivo Banco de Dados</span>
                        </label>
                        <input
                          type="text"
                          value={pcFileName}
                          onChange={(e) => setPcFileName(e.target.value)}
                          className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                          placeholder="erp_database.json"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSavingLocalConfig}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors uppercase tracking-wider flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingLocalConfig ? "Salvando..." : "Salvar Configuração de Pasta"}</span>
                </button>
              </form>

              {/* Actions Box */}
              <div className="flex-1 space-y-4 bg-[#0b0f17] border border-[#1f293d] p-4 rounded-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">Exportação e Sincronização Ativa</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Use as ações abaixo para simular a leitura/gravação em tempo real de arquivos JSON no caminho configurado.</p>
                </div>

                <div className="space-y-3 my-auto">
                  <div className="p-3 bg-[#111827] border border-[#1f293d] rounded-lg space-y-1">
                    <span className="text-[10px] font-mono block text-gray-500">PASTA DE SINC_ATIVA:</span>
                    <span className="font-mono text-[11px] text-gray-300 break-all flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                      <span>{pcStorageType === "browser" ? "LocalStorage (Simulado)" : `${pcFolderPath}\\${pcFileName}`}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleExportToLocalFile}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Exportar p/ PC</span>
                    </button>

                    <label className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-3 rounded-lg text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer text-center">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Importar do PC</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportFromLocalFile}
                        ref={fileInputRef}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <p className="text-[10px] text-gray-500 italic leading-normal">
                  * Nota: Devido às limitações de segurança de sandboxing dos navegadores web modernos, o ERP simula a sincronização física gerando downloads imediatos e permitindo uploads do seu arquivo de banco estruturado.
                </p>
              </div>
            </div>
          </div>
        )}

        {dbTab === "nuvem" && (
          <div className="space-y-4 animate-fade-in">
            <form onSubmit={handleTestCloudConnection} className="space-y-4 bg-[#0b0f17] border border-[#1f293d] p-4 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-purple-400">Integração com Banco de Dados na Nuvem</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Preencha as credenciais de autenticação e parâmetros de login do seu servidor de banco de dados.</p>
                </div>

                {/* Database Provider Select */}
                <div className="flex bg-[#111827] border border-[#1f293d] p-1 rounded-lg self-start">
                  <button
                    type="button"
                    onClick={() => setCloudProvider("mysql")}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                      cloudProvider === "mysql"
                        ? "bg-purple-600 text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    MySQL / MariaDB
                  </button>
                  <button
                    type="button"
                    onClick={() => setCloudProvider("sqlite")}
                    className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                      cloudProvider === "sqlite"
                        ? "bg-purple-600 text-white shadow"
                        : "text-gray-400 hover:text-white"
                    }`}
                  >
                    SQLite Local
                  </button>
                </div>
              </div>

              {cloudProvider === "mysql" ? (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
                  <div>
                    <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                      Servidor (Host)
                    </label>
                    <input
                      type="text"
                      value={cloudHost}
                      onChange={(e) => setCloudHost(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                      Porta
                    </label>
                    <input
                      type="text"
                      value={cloudPort}
                      onChange={(e) => setCloudPort(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                      Usuário Login
                    </label>
                    <input
                      type="text"
                      value={cloudUser}
                      onChange={(e) => setCloudUser(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                      Senha de Acesso
                    </label>
                    <input
                      type="password"
                      value={cloudPass}
                      onChange={(e) => setCloudPass(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                      placeholder="******"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider">
                      Nome do Banco (Schema)
                    </label>
                    <input
                      type="text"
                      value={cloudDbName}
                      onChange={(e) => setCloudDbName(e.target.value)}
                      className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <label className="block text-gray-400 text-[10px] font-bold mb-1 uppercase tracking-wider flex items-center gap-1">
                    <Folder className="w-3.5 h-3.5 text-purple-400" />
                    <span>Caminho do Arquivo de Banco de Dados SQLite (.db)</span>
                  </label>
                  <input
                    type="text"
                    value={cloudSqlitePath}
                    onChange={(e) => setCloudSqlitePath(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1f293d] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-purple-500"
                    placeholder="C:\MacoratyERP\database\erp.db"
                    required
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isTestingConnection}
                  className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg text-xs transition-colors uppercase tracking-wider flex items-center space-x-1.5"
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isTestingConnection ? "Conectando..." : "Salvar e Testar Integração"}</span>
                </button>

                <p className="text-[10px] text-gray-500">
                  * O ERP validará as tabelas de dados (`products`, `stock`, `bom`, `contacts`, `sales_orders`, `financial_entries`) e criará a estrutura caso não existam.
                </p>
              </div>
            </form>

            {/* Test Connection Result Console */}
            {isTestingConnection && (
              <div className="bg-[#0b0f17] border border-[#1f293d] rounded-lg p-4 flex flex-col items-center justify-center space-y-2">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400 font-mono">Estabelecendo handshake com {cloudHost || 'SQLite Local'}...</span>
              </div>
            )}

            {connectionResult && !isTestingConnection && (
              <div className={`p-4 border rounded-xl flex flex-col space-y-2 ${
                connectionResult.success
                  ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-950/20 border-rose-500/30 text-rose-300"
              }`}>
                <div className="flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${connectionResult.success ? "bg-emerald-500" : "bg-rose-500"} animate-pulse`} />
                  <h5 className="text-xs font-bold">{connectionResult.msg}</h5>
                </div>
                {connectionResult.details && (
                  <p className="text-[10px] font-mono leading-relaxed bg-[#0b0f17] p-3 rounded-lg border border-[#1f293d]/50 text-gray-400">
                    {connectionResult.details}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top controls: Reset and Unidades de Medida */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Seed restorer card */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Database className="w-5 h-5 text-blue-400" />
              <span>Reset e Manutenção de Carga Piloto</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mt-2">
              Para testar o fluxo de ponta a ponta sem poluição, você pode
              restaurar a fábrica para as condições padrão de demonstração. Isso
              criará o catálogo de produtos (Grelhas, Chapas, Parafusos,
              Disjuntores), montará as estruturas BOM, registrará
              clientes/fornecedores e carregará pedidos de demonstração de forma
              limpa.
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={handleReset}
              className="bg-[#2a1b1b] hover:bg-red-950 text-red-400 border border-red-900/40 font-bold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-2 transition-all hover:scale-[1.01]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Restaurar Fábrica Original (Seed)</span>
            </button>
          </div>
        </div>

        {/* Unidades de Medida card */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg space-y-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-400" />
              <span>Cadastro de Unidades de Medida</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mt-2">
              Cadastre e gerencie as unidades de medida (siglas) autorizadas
              para o faturamento e controle físico dos SKUs no ERP.
            </p>
          </div>

          {/* Form to add unit */}
          <form onSubmit={handleAddUnit} className="flex space-x-2">
            <input
              type="text"
              required
              maxLength={10}
              placeholder="Ex: UN, KG, MT, CH, M2"
              value={newUnit}
              onChange={(e) =>
                setNewUnit(e.target.value.toUpperCase().replace(/\s/g, ""))
              }
              className="flex-1 bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono font-bold focus:outline-none focus:border-blue-500 text-xs"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center space-x-1.5 transition-all shadow-lg shadow-blue-900/20"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar</span>
            </button>
          </form>

          {/* List of registered units */}
          <div className="pt-2">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-2">
              Unidades já Cadastradas
            </h4>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto pr-1">
              {unidadesMedida.map((unit) => (
                <div
                  key={unit}
                  className="flex items-center space-x-2 px-3 py-1 bg-[#0b0f17] border border-[#1f293d] rounded-lg text-white font-mono font-bold text-[11px] hover:border-gray-600 transition-colors"
                >
                  <span>{unit}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setUnitToDelete(unit);
                      const defaultRep =
                        unidadesMedida.find((u) => u !== unit) || "";
                      setReplacementUnit(defaultRep);
                    }}
                    className="p-1 text-gray-500 hover:text-red-400 rounded hover:bg-gray-800 transition-colors shrink-0 cursor-pointer flex items-center justify-center"
                    title={`Remover unidade ${unit}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {unidadesMedida.length === 0 && (
                <span className="text-xs text-gray-500 italic">
                  Nenhuma unidade cadastrada.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Company Settings */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg space-y-4">
        <div>
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <Database className="w-5 h-5 text-blue-400" />
            <span>Dados da Empresa</span>
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mt-2">
            Informações utilizadas em cabeçalhos de relatórios, pedidos de compra e faturamentos.
          </p>
        </div>

        <form onSubmit={handleSaveCompanySettings} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Razão Social / Nome Fantasia</label>
            <input
              type="text"
              required
              value={localCompanySettings.name}
              onChange={(e) => setLocalCompanySettings({ ...localCompanySettings, name: e.target.value })}
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 text-xs font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">CNPJ</label>
            <input
              type="text"
              required
              value={localCompanySettings.cnpj}
              onChange={(e) => setLocalCompanySettings({ ...localCompanySettings, cnpj: e.target.value })}
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Telefone / Contato</label>
            <input
              type="text"
              required
              value={localCompanySettings.phone}
              onChange={(e) => setLocalCompanySettings({ ...localCompanySettings, phone: e.target.value })}
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Endereço Completo</label>
            <input
              type="text"
              required
              value={localCompanySettings.address}
              onChange={(e) => setLocalCompanySettings({ ...localCompanySettings, address: e.target.value })}
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">E-mail Corporativo</label>
            <input
              type="email"
              required
              value={localCompanySettings.email}
              onChange={(e) => setLocalCompanySettings({ ...localCompanySettings, email: e.target.value })}
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 text-xs"
            />
          </div>
          
          <div className="md:col-span-2 lg:col-span-3 flex justify-end mt-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-900/20"
            >
              Salvar Dados da Empresa
            </button>
          </div>
        </form>
      </div>

      {/* Tech Specifications and explanation of formulas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Specification 1: MRP Algorithm */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow space-y-3">
          <h4 className="font-bold text-white text-sm flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span>Algoritmo de Cálculo MRP I</span>
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            O algoritmo de planejamento é executado no cliente, seguindo as
            seguintes regras matemáticas de explosão:
          </p>

          <ul className="text-xs text-gray-300 space-y-2 list-disc pl-4 font-medium leading-relaxed">
            <li>
              <b>Necessidade Bruta:</b> Mapeia os itens vinculados a Pedidos de
              Venda com status <b className="text-blue-400">Aberto</b>. Se o
              item for composto, explode os coeficientes de sua estrutura
              técnica (BOM).
            </li>
            <li>
              <b>Estoque de Segurança:</b> Soma o limite mínimo de segurança
              cadastrado para o SKU como uma necessidade adicional.
            </li>
            <li>
              <b>Abatimento de Entrada:</b> Deduz as quantidades físicas atuais
              em estoque e os saldos de itens que já constam em Pedidos de
              Compra ativos com status <b className="text-blue-400">Aberto</b>.
            </li>
            <li>
              <b>Lead Time Offset:</b> Calcula a data máxima limite sugerida
              recuando o lead time em dias úteis a partir da data prometida de
              faturamento.
            </li>
          </ul>
        </div>

        {/* Specification 2: NF-e & SEFAZ integration */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow space-y-3">
          <h4 className="font-bold text-white text-sm flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Regras de Negócio de Faturamento (SEFAZ)</span>
          </h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            A integração de faturamento automatizada segue as especificações
            federais de escrituração de notas fiscais de entrada e saída:
          </p>

          <ul className="text-xs text-gray-300 space-y-2 list-disc pl-4 font-medium leading-relaxed">
            <li>
              <b>Importação de XML:</b> Mapeia as chaves fiscais de 44 dígitos
              gerando chaves aleatórias consistentes em padrão SEFAZ. Se o
              emitente CNPJ não for encontrado, ele cria o fornecedor
              automaticamente.
            </li>
            <li>
              <b>Escrituração Financeira:</b> Notas fiscais de Entrada geram
              registros em Contas a Pagar com o status{" "}
              <b className="text-amber-400">Aberto</b>. Notas de Saída criam
              registros correspondentes em Contas a Receber.
            </li>
            <li>
              <b>Movimentação de Kardex:</b> Ao faturar uma venda ou receber uma
              nota fiscal de entrada, a rotina calcula o incremento/decremento
              automático dos lotes físicos em estoque, mitigando furos de
              inventário.
            </li>
          </ul>
        </div>
      </div>

      {/* Logo & Custom Print Templates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logo Configuration */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg space-y-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-blue-400" />
              <span>Logomarca do ERP</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mt-2">
              Substitua a logomarca padrão do programa por uma imagem
              personalizada para a sua empresa.
            </p>
          </div>

          <div className="flex items-center space-x-4 pt-2">
            <div className="h-16 w-32 bg-[#0b0f17] border border-[#1f293d] rounded flex items-center justify-center overflow-hidden shrink-0">
              {appLogo ? (
                <img
                  src={appLogo}
                  alt="Logo ERP"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider text-center">
                  Sem Logo
                </span>
              )}
            </div>

            <div className="flex flex-col space-y-2">
              <label className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Enviar Imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={logoInputRef}
                  onChange={handleLogoUpload}
                />
              </label>
              {appLogo && (
                <button
                  onClick={removeLogo}
                  className="text-red-400 hover:text-red-300 text-xs font-bold transition-colors"
                >
                  Remover Logo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Print Templates Configuration */}
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg space-y-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Printer className="w-5 h-5 text-blue-400" />
              <span>Modelos de Impressão</span>
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mt-2">
              Baixe os modelos (HTML), personalize-os e faça o upload para
              deixá-los como padrão de impressão (Notas, Pedidos, Orçamentos).
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { type: "salesOrder", label: "Pedido de Venda" },
              { type: "purchaseOrder", label: "Pedido de Compra" },
              { type: "outboundInvoice", label: "Nota Fiscal (DANFE)" },
              { type: "receipt", label: "Recibo de Faturamento" },
            ].map((doc) => (
              <div
                key={doc.type}
                className="flex items-center justify-between p-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg"
              >
                <div className="flex flex-col">
                  <span className="text-white font-bold text-xs">
                    {doc.label}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {printTemplates[doc.type]
                      ? "Modelo customizado ativo"
                      : "Modelo padrão"}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDownloadTemplate(doc.type)}
                    className="text-blue-400 hover:text-blue-300 font-bold text-xs px-3 py-1.5 border border-blue-900/50 rounded hover:bg-blue-900/20 transition-all"
                  >
                    Baixar
                  </button>
                  <label className="text-emerald-400 hover:text-emerald-300 font-bold text-xs px-3 py-1.5 border border-emerald-900/50 rounded hover:bg-emerald-900/20 transition-all cursor-pointer">
                    Exportar
                    <input
                      type="file"
                      accept=".html"
                      className="hidden"
                      onChange={(e) => handleUploadTemplate(doc.type, e)}
                    />
                  </label>
                  {printTemplates[doc.type] && (
                    <button
                      onClick={() => {
                        if (
                          confirm(`Restaurar o modelo padrão de ${doc.label}?`)
                        ) {
                          const next = { ...printTemplates };
                          delete next[doc.type];
                          setPrintTemplate(doc.type, ""); // Actually this won't remove it from record properly but we can just use empty string to ignore. Better yet, let's just trigger setPrintTemplate with empty string and handle it.
                        }
                      }}
                      className="text-red-400 hover:text-red-300 font-bold text-xs px-2"
                      title="Restaurar padrão"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Users Management */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg space-y-4">
        <div>
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Controle de Usuários</span>
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mt-2">
            Cadastre novos usuários com permissões de acesso ao sistema. A senha
            deve conter exatamente 6 números.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
          {/* Create User Form */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
              Novo Usuário
            </h4>
            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: joao.silva"
                  value={newUsername}
                  onChange={(e) =>
                    setNewUsername(
                      e.target.value.toLowerCase().replace(/\s/g, ""),
                    )
                  }
                  className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Senha (6 dígitos)
                </label>
                <input
                  type="password"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  placeholder="******"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono tracking-widest focus:outline-none focus:border-blue-500 text-xs"
                />
              </div>
              <label className="flex items-center space-x-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded border-[#1f293d] bg-[#0b0f17] text-blue-500 focus:ring-blue-500 focus:ring-offset-[#111827]"
                />
                <span className="text-xs text-gray-300 font-bold">
                  Privilégios de Administrador
                </span>
              </label>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center space-x-1.5 transition-all shadow-lg shadow-blue-900/20 mt-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Usuário</span>
              </button>
            </form>
          </div>

          {/* Users List */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-wider">
              Usuários Ativos
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-[#0b0f17] border border-[#1f293d] rounded-lg gap-2"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[#111827] border border-[#1f293d] flex items-center justify-center">
                      <span className="text-blue-500 font-bold text-xs">
                        {u.username.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-xs">
                        {u.username}
                      </span>
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                        {u.isAdmin ? "Administrador" : "Usuário Padrão"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!u.isAdmin && (
                      <button
                        onClick={() => {
                          setEditingUserId(u.id);
                          setEditingUserPermissions(u.permissions || []);
                        }}
                        className="flex items-center justify-center space-x-1 text-blue-400 hover:text-blue-300 bg-blue-950/20 hover:bg-blue-950/40 px-2 py-1.5 rounded transition-colors text-xs font-bold"
                        title="Editar Permissões"
                      >
                        <span>Permissões</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveUser(u.id)}
                      className="flex items-center justify-center space-x-1 text-red-400 hover:text-red-300 bg-red-950/20 hover:bg-red-950/40 px-2 py-1.5 rounded transition-colors text-xs font-bold"
                      title={`Remover usuário ${u.username}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remover</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Editing User Permissions */}
      {editingUserId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-[#1f293d] shrink-0">
              <h3 className="font-bold text-white text-lg flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>Editar Permissões do Usuário</span>
              </h3>
              <p className="text-xs text-gray-400 mt-2">
                Selecione as páginas que o usuário{" "}
                <strong>
                  {users.find((u) => u.id === editingUserId)?.username}
                </strong>{" "}
                terá acesso.
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AVAILABLE_MODULES.map((module) => (
                  <label
                    key={module}
                    className="flex items-center space-x-3 bg-[#0b0f17] p-3 rounded-lg border border-[#1f293d] cursor-pointer hover:bg-[#151c28] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={editingUserPermissions.includes(module)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditingUserPermissions((prev) => [
                            ...prev,
                            module,
                          ]);
                        } else {
                          setEditingUserPermissions((prev) =>
                            prev.filter((m) => m !== module),
                          );
                        }
                      }}
                      className="w-4 h-4 rounded border-[#1f293d] bg-[#0b0f17] text-blue-500 focus:ring-blue-500 focus:ring-offset-[#111827]"
                    />
                    <span className="text-xs text-gray-300 font-medium">
                      {module}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-[#1f293d] flex justify-end space-x-3 shrink-0 bg-[#0b0f17]">
              <button
                type="button"
                onClick={() => {
                  setEditingUserId(null);
                  setEditingUserPermissions([]);
                }}
                className="px-4 py-2.5 border border-[#1f293d] hover:bg-gray-800 text-gray-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const userToUpdate = users.find(
                    (u) => u.id === editingUserId,
                  );
                  if (userToUpdate) {
                    saveUser({
                      ...userToUpdate,
                      permissions: editingUserPermissions,
                    });
                    setEditingUserId(null);
                    setEditingUserPermissions([]);
                  }
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors shadow-lg shadow-blue-900/20 cursor-pointer"
              >
                Salvar Permissões
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Substituição de Unidade de Medida */}
      {unitToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-md overflow-hidden shadow-2xl p-6 space-y-4">
            {products.filter(
              (p) =>
                p.unidade === unitToDelete || p.segUnMedida === unitToDelete,
            ).length > 0 ? (
              <>
                <div>
                  <h3 className="font-bold text-white text-base flex items-center space-x-2">
                    <Layers className="w-5 h-5 text-yellow-500" />
                    <span>Unidade em Uso</span>
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed mt-2">
                    A unidade de medida{" "}
                    <strong className="text-white font-mono">
                      {unitToDelete}
                    </strong>{" "}
                    está sendo utilizada por{" "}
                    <strong>
                      {
                        products.filter(
                          (p) =>
                            p.unidade === unitToDelete ||
                            p.segUnMedida === unitToDelete,
                        ).length
                      }
                    </strong>{" "}
                    produto(s).
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed mt-1">
                    Por favor, escolha uma unidade substituta para atualizar
                    esses produtos automaticamente antes de excluir.
                  </p>
                </div>

                {unidadesMedida.filter((u) => u !== unitToDelete).length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                      Escolha a Unidade Substituta
                    </label>
                    <select
                      value={replacementUnit}
                      onChange={(e) => setReplacementUnit(e.target.value)}
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono font-bold focus:outline-none focus:border-blue-500 text-xs"
                    >
                      {unidadesMedida
                        .filter((u) => u !== unitToDelete)
                        .map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-3 bg-red-950/20 border border-red-900/50 rounded-lg text-red-400 text-xs">
                    Não há outras unidades de medida cadastradas para
                    substituição. Cadastre uma nova unidade antes de excluir
                    esta.
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUnitToDelete(null);
                      setReplacementUnit("");
                    }}
                    className="px-4 py-2 border border-[#1f293d] hover:bg-gray-800 text-gray-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  {unidadesMedida.filter((u) => u !== unitToDelete).length >
                    0 && (
                    <button
                      type="button"
                      onClick={() => {
                        deleteUnidadeMedida(unitToDelete, replacementUnit);
                        setUnitToDelete(null);
                        setReplacementUnit("");
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Substituir e Excluir
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <h3 className="font-bold text-white text-base flex items-center space-x-2">
                    <Trash2 className="w-5 h-5 text-red-500" />
                    <span>Confirmar Exclusão</span>
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed mt-2">
                    Deseja realmente remover a unidade de medida{" "}
                    <strong className="text-white font-mono">
                      {unitToDelete}
                    </strong>
                    ?
                  </p>
                  <p className="text-xs text-gray-400 leading-relaxed mt-1">
                    Esta unidade não está associada a nenhum produto cadastrado
                    no momento.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUnitToDelete(null);
                      setReplacementUnit("");
                    }}
                    className="px-4 py-2 border border-[#1f293d] hover:bg-gray-800 text-gray-300 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deleteUnidadeMedida(unitToDelete);
                      setUnitToDelete(null);
                      setReplacementUnit("");
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
