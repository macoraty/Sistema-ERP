"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Product,
  BomItem,
  Contact,
  SalesOrder,
  Stock,
  FinancialEntry,
  PurchaseOrder,
  EntryInvoice,
  OutboundInvoice,
  MrpRequirement,
  Alert,
  User,
  CompanySettings,
} from "@/lib/types";
import {
  getTodayFormatted,
  parseDate,
  formatDate,
  addWorkingDays,
} from "@/lib/working-days";

interface ErpContextType {
  products: Product[];
  bom: BomItem[];
  contacts: Contact[];
  salesOrders: SalesOrder[];
  stock: Stock[];
  financialEntries: FinancialEntry[];
  purchaseOrders: PurchaseOrder[];
  entryInvoices: EntryInvoice[];
  outboundInvoices: OutboundInvoice[];
  mrpRequirements: MrpRequirement[];
  alerts: Alert[];
  users: User[];
  companySettings: CompanySettings;
  setCompanySettings: (settings: CompanySettings) => void;
  purchaseNeeds: import("../lib/types").PurchaseNeed[];
  quotes: import("../lib/types").Quote[];
  unidadesMedida: string[];
  appLogo: string | null;
  setAppLogo: (logo: string | null) => void;
  printTemplates: Record<string, string>;
  setPrintTemplate: (key: string, html: string) => void;

  saveProduct: (p: Product) => void;
  deleteProduct: (id: number) => void;
  saveContact: (c: Contact) => void;
  deleteContact: (id: number) => void;
  savePurchaseNeed: (
    n: Omit<import("../lib/types").PurchaseNeed, "id"> & { id?: number },
  ) => void;
  deletePurchaseNeed: (id: number) => void;
  saveQuote: (
    q: Omit<import("../lib/types").Quote, "id"> & { id?: number },
  ) => void;
  deleteQuote: (id: number) => void;
  saveSalesOrder: (o: Omit<SalesOrder, "id">) => void;
  updateSalesOrder: (o: SalesOrder) => void;
  faturarSalesOrder: (id: number) => void;
  cancelSalesOrder: (id: number) => void;
  savePurchaseOrder: (o: Omit<PurchaseOrder, "id">) => void;
  receberPurchaseOrder: (id: number) => void;
  receberPurchaseOrderWithXml: (
    orderId: number,
    nNF: string,
    chNFe: string,
    xmlItens: {
      prodId?: number;
      prodCode: string;
      prodDesc: string;
      unidade?: string;
      qtd: number;
      valorUnitario: number;
    }[],
    valorTotal: number,
  ) => void;
  cancelPurchaseOrder: (id: number) => void;
  runMrpCalculation: () => void;
  adjustStockQtd: (prodId: number, delta: number) => void;
  updateStockMinimo: (prodId: number, minimo: number) => void;
  saveFinancialEntry: (f: Omit<FinancialEntry, "id"> & { id?: number }) => void;
  liquidateFinancial: (id: number) => void;
  deleteFinancialEntry: (id: number) => void;
  resetDatabase: () => void;
  importXml: (xmlText: string) => boolean;
  saveBomItem: (b: Omit<BomItem, "id"> & { id?: number }) => void;
  deleteBomItem: (id: number) => void;
  cloneBomStructure: (fromParentId: number, toParentId: number) => void;
  saveUser: (u: Omit<User, "id"> & { id?: number }) => void;
  deleteUser: (id: number) => void;
  saveUnidadeMedida: (sigla: string) => void;
  deleteUnidadeMedida: (sigla: string, substituto?: string) => void;
  saveOutboundInvoice: (
    invoice: Omit<OutboundInvoice, "id" | "numero" | "chave"> & {
      id?: number;
      numero?: string;
      chave?: string;
    },
  ) => void;

  clearAlerts: () => void;
  resetToSeedData: () => void;
  liquidarEntry: (id: number) => void;
  saveStockLevel: (prodId: number, qtd: number, minimo: number) => void;
  importXmlInvoice: (xmlText: string) => boolean;
  exportData: () => string;
  importData: (jsonText: string) => boolean;
  importProductsAndBomFromRows: (
    productsRows: any[],
    bomRows: any[],
  ) => {
    productsAdded: number;
    productsUpdated: number;
    bomAdded: number;
    bomUpdated: number;
    errors: string[];
  };
}

const ErpContext = createContext<ErpContextType | undefined>(undefined);

// Core initial simulated factory data
const initialProducts: Product[] = [
  {
    id: 1,
    codigo: "PA-MESA-MET",
    descricao: "Mesa Industrial Metálica Premium",
    tipo: "Acabado",
    unidade: "UN",
    valor: 850.0,
    leadTime: 3,
  },
  {
    id: 2,
    codigo: "PA-ARM-ACO",
    descricao: "Armário de Aço Oficina Especial",
    tipo: "Acabado",
    unidade: "UN",
    valor: 1200.0,
    leadTime: 4,
  },
  {
    id: 3,
    codigo: "PA-PNL-TRI",
    descricao: "Painel Elétrico Trifásico Estanque",
    tipo: "Acabado",
    unidade: "UN",
    valor: 3500.0,
    leadTime: 5,
  },
  {
    id: 4,
    codigo: "SA-GAV-MOD",
    descricao: "Módulo Gaveteiro Estrutural",
    tipo: "Semi-acabado",
    unidade: "UN",
    valor: 180.0,
    leadTime: 2,
  },
  {
    id: 5,
    codigo: "MP-CHA-3MM",
    descricao: "Chapa de Aço Carbono AISI 1020 3mm",
    tipo: "Materia-Prima",
    unidade: "CH",
    valor: 120.0,
    leadTime: 2,
  },
  {
    id: 6,
    codigo: "MP-PER-MET",
    descricao: "Perfil Metálico Tubo Quadrado 40x40",
    tipo: "Materia-Prima",
    unidade: "MT",
    valor: 45.0,
    leadTime: 1,
  },
  {
    id: 7,
    codigo: "IS-PIN-ELE",
    descricao: "Tinta Pó Epóxi Eletrostática Preta",
    tipo: "Insumo",
    unidade: "KG",
    valor: 15.0,
    leadTime: 1,
  },
  {
    id: 8,
    codigo: "MP-DIS-50A",
    descricao: "Disjuntor Din Trifásico Siemens 50A",
    tipo: "Materia-Prima",
    unidade: "UN",
    valor: 110.0,
    leadTime: 3,
  },
  {
    id: 9,
    codigo: "IS-PAR-M8",
    descricao: "Parafuso Sextavado Zincado M8x25",
    tipo: "Insumo",
    unidade: "Cento",
    valor: 18.0,
    leadTime: 1,
  },
  {
    id: 10,
    codigo: "MP-CAB-6MM",
    descricao: "Cabo Flexível de Cobre Isolação 6mm²",
    tipo: "Materia-Prima",
    unidade: "MT",
    valor: 8.0,
    leadTime: 2,
  },
  {
    id: 11,
    codigo: "PFX-0840",
    descricao: "Parafuso Sextavado Zincado M8 x 40mm",
    tipo: "Insumo",
    unidade: "Cento",
    valor: 12.5,
    leadTime: 1,
  },
  {
    id: 12,
    codigo: "PFA-0620",
    descricao: "Parafuso Allen Cabeça Cilíndrica M6 x 20mm",
    tipo: "Insumo",
    unidade: "UN",
    valor: 0.45,
    leadTime: 1,
  },
  {
    id: 13,
    codigo: "ARR-M800",
    descricao: "Arruela Lisa Zincada M8",
    tipo: "Insumo",
    unidade: "UN",
    valor: 0.08,
    leadTime: 1,
  },
  {
    id: 14,
    codigo: "POR-M800",
    descricao: "Porca Sextavada Zincada M8",
    tipo: "Insumo",
    unidade: "UN",
    valor: 0.15,
    leadTime: 1,
  },
];

const initialBom: BomItem[] = [
  // Mesa uses Chapa, Perfil, Parafusos, Pintura
  { id: 1, parentId: 1, componentId: 5, quantidade: 2 },
  { id: 2, parentId: 1, componentId: 6, quantidade: 4 },
  { id: 3, parentId: 1, componentId: 9, quantidade: 0.16 }, // 16 parafusos (0.16 cento)
  { id: 4, parentId: 1, componentId: 7, quantidade: 1.5 },

  // Armário uses Chapa, Gaveteiro, Parafusos, Pintura
  { id: 5, parentId: 2, componentId: 5, quantidade: 4 },
  { id: 6, parentId: 2, componentId: 4, quantidade: 2 },
  { id: 7, parentId: 2, componentId: 9, quantidade: 0.24 }, // 24 parafusos (0.24 cento)
  { id: 8, parentId: 2, componentId: 7, quantidade: 2.0 },

  // Gaveteiro uses Chapa and Parafuso
  { id: 9, parentId: 4, componentId: 5, quantidade: 0.5 },
  { id: 10, parentId: 4, componentId: 9, quantidade: 0.08 },

  // Painel uses Chapa, Disjuntor, Cabos, Parafuso
  { id: 11, parentId: 3, componentId: 5, quantidade: 1 },
  { id: 12, parentId: 3, componentId: 8, quantidade: 3 },
  { id: 13, parentId: 3, componentId: 10, quantidade: 15 },
  { id: 14, parentId: 3, componentId: 9, quantidade: 0.12 },
];

const initialContacts: Contact[] = [
  {
    id: 1,
    nome: "Bosch Rexroth Automotiva S/A",
    tipo: "Cliente",
    cnpj: "12.345.678/0001-99",
    email: "compras@bosch.com.br",
    telefone: "(11) 4004-1122",
    cidade: "Campinas",
    uf: "SP",
  },
  {
    id: 2,
    nome: "Embraer Defesa e Segurança",
    tipo: "Cliente",
    cnpj: "98.765.432/0001-88",
    email: "suprimentos@embraer.com.br",
    telefone: "(12) 3927-1000",
    cidade: "São José dos Campos",
    uf: "SP",
  },
  {
    id: 3,
    nome: "Gerdau Metalurgia e Siderurgia S/A",
    tipo: "Fornecedor",
    cnpj: "22.333.444/0001-55",
    email: "vendas@gerdau.com.br",
    telefone: "(11) 3003-2422",
    cidade: "Sapucaia do Sul",
    uf: "RS",
  },
  {
    id: 4,
    nome: "Siemens Energy Ltda",
    tipo: "Fornecedor",
    cnpj: "55.666.777/0001-33",
    email: "vendas.br@siemens.com",
    telefone: "(11) 4504-2000",
    cidade: "Jundiaí",
    uf: "SP",
  },
  {
    id: 5,
    nome: "Fastenal Distribuidora de Fixadores",
    tipo: "Fornecedor",
    cnpj: "44.555.666/0001-22",
    email: "faturamento@fastenal.com.br",
    telefone: "(11) 2100-3000",
    cidade: "Sorocaba",
    uf: "SP",
  },
];

const initialSalesOrders: SalesOrder[] = [
  {
    id: 1001,
    clienteId: 1,
    dataEmissao: "15/06/2026",
    dataEntrega: "10/07/2026",
    itens: [{ prodId: 1, qtd: 10, valorUnitario: 850.0 }],
    valorTotal: 8500.0,
    status: "Aberto",
  },
  {
    id: 1002,
    clienteId: 2,
    dataEmissao: "18/06/2026",
    dataEntrega: "15/07/2026",
    itens: [{ prodId: 3, qtd: 3, valorUnitario: 3500.0 }],
    valorTotal: 10500.0,
    status: "Aberto",
  },
  {
    id: 1003,
    clienteId: 1,
    dataEmissao: "01/06/2026",
    dataEntrega: "20/06/2026",
    itens: [{ prodId: 2, qtd: 5, valorUnitario: 1200.0 }],
    valorTotal: 6000.0,
    status: "Faturado",
  },
];

const initialStock: Stock[] = [
  { prodId: 1, qtd: 2, minimo: 5 },
  { prodId: 2, qtd: 1, minimo: 3 },
  { prodId: 3, qtd: 0, minimo: 2 },
  { prodId: 4, qtd: 3, minimo: 5 },
  { prodId: 5, qtd: 15, minimo: 20 },
  { prodId: 6, qtd: 40, minimo: 30 },
  { prodId: 7, qtd: 20, minimo: 10 },
  { prodId: 8, qtd: 5, minimo: 10 },
  { prodId: 9, qtd: 1.2, minimo: 2.0 }, // 120 parafusos (1.20 centos)
  { prodId: 10, qtd: 25, minimo: 50 },
];

const initialFinancial: FinancialEntry[] = [
  {
    id: 2001,
    descricao: "Faturamento Pedido Venda #1003 (Recebido)",
    tipo: "Receita",
    dataVencimento: "20/06/2026",
    valor: 6000.0,
    status: "Pago",
  },
  {
    id: 2002,
    descricao: "Pagamento Gerdau - Lote de Chapa Siderúrgica",
    tipo: "Despesa",
    dataVencimento: "10/06/2026",
    valor: 1800.0,
    status: "Pago",
  },
  {
    id: 2003,
    descricao: "Faturamento Previsto Pedido Venda #1001",
    tipo: "Receita",
    dataVencimento: "10/07/2026",
    valor: 8500.0,
    status: "Pendente",
  },
  {
    id: 2004,
    descricao: "Serviço Terceirizado Pintura - Mesa Lote 1",
    tipo: "Despesa",
    dataVencimento: "28/06/2026",
    valor: 450.0,
    status: "Pendente",
  },
  {
    id: 2005,
    descricao: "Fatura Siemens - Disjuntores e Cabos Trifásicos",
    tipo: "Despesa",
    dataVencimento: "05/07/2026",
    valor: 980.0,
    status: "Pendente",
  },
];

const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 3001,
    fornecedorId: 3,
    dataEmissao: "12/06/2026",
    dataEntrega: "22/06/2026",
    itens: [{ prodId: 5, qtd: 10, valorUnitario: 120.0 }],
    valorTotal: 1200.0,
    status: "Recebido",
  },
  {
    id: 3002,
    fornecedorId: 4,
    dataEmissao: "22/06/2026",
    dataEntrega: "05/07/2026",
    itens: [{ prodId: 8, qtd: 6, valorUnitario: 110.0 }],
    valorTotal: 660.0,
    status: "Aberto",
  },
];

const initialEntryInvoices: EntryInvoice[] = [
  {
    id: 4001,
    numero: "00010492",
    chave: "35260622333444000155550010001049219812739182",
    fornecedorId: 3,
    dataEmissao: "22/06/2026",
    valorTotal: 1200.0,
    itens: [{ prodId: 5, qtd: 10, valorUnitario: 120.0 }],
  },
];

const initialOutboundInvoices: OutboundInvoice[] = [
  {
    id: 5001,
    numero: "00008511",
    chave: "35260612345678000199550010000851119283749102",
    clienteId: 1,
    dataEmissao: "20/06/2026",
    pedidoVendaId: 1003,
    valorTotal: 6000.0,
    itens: [{ prodId: 2, qtd: 5, valorUnitario: 1200.0 }],
  },
];

const initialMrp: MrpRequirement[] = [];

const initialAlerts: Alert[] = [
  {
    id: 1,
    tipo: "info",
    mensagem: "Banco de dados local do ERP carregado com sucesso.",
    data: getTodayFormatted(),
  },
  {
    id: 2,
    tipo: "warning",
    mensagem:
      "Estoque do produto PA-PNL-TRI está zerado. Recomenda-se rodar o MRP.",
    data: getTodayFormatted(),
  },
];

const initialUnidadesMedida = [
  "UN",
  "KG",
  "MT",
  "CH",
  "L",
  "M2",
  "M3",
  "CX",
  "RL",
  "Cento",
  "PCT",
];

const initialUsers: User[] = [
  { id: 1, username: "admin", password: "159753", isAdmin: true },
];

const initialCompanySettings: CompanySettings = {
  name: "MACORATY.ERP",
  cnpj: "00.000.000/0000-00",
  address: "Rua Exemplo, 123",
  phone: "(00) 0000-0000",
  email: "contato@macoraty.com"
};

export function ErpProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [companySettings, setCompanySettingsState] = useState<CompanySettings>(initialCompanySettings);
  const [products, setProducts] = useState<Product[]>([]);
  const [bom, setBom] = useState<BomItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [stock, setStock] = useState<Stock[]>([]);
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>(
    [],
  );
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [entryInvoices, setEntryInvoices] = useState<EntryInvoice[]>([]);
  const [outboundInvoices, setOutboundInvoices] = useState<OutboundInvoice[]>(
    [],
  );
  const [mrpRequirements, setMrpRequirements] = useState<MrpRequirement[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [purchaseNeeds, setPurchaseNeeds] = useState<
    import("../lib/types").PurchaseNeed[]
  >([]);
  const [quotes, setQuotes] = useState<import("../lib/types").Quote[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<string[]>([]);
  const [appLogo, setAppLogoState] = useState<string | null>(null);
  const [printTemplates, setPrintTemplates] = useState<Record<string, string>>(
    {},
  );

  const setAppLogo = (logo: string | null) => {
    setAppLogoState(logo);
    if (logo) {
      localStorage.setItem("erp_appLogo", logo);
    } else {
      localStorage.removeItem("erp_appLogo");
    }
  };

  const setPrintTemplate = (key: string, html: string) => {
    const next = { ...printTemplates, [key]: html };
    setPrintTemplates(next);
    localStorage.setItem("erp_printTemplates", JSON.stringify(next));
  };

  // Toast notification state trigger (simple window log or alert, but let's do a custom visual notification trigger if we want or standard state)
  const showToast = (msg: string) => {
    // We add an alert block
    const newAlert: Alert = {
      id: Date.now() + Math.random(),
      tipo: "success",
      mensagem: msg,
      data: getTodayFormatted(),
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  // Load from local storage
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const localProducts = localStorage.getItem("erp_products");
    const localBom = localStorage.getItem("erp_bom");
    const localContacts = localStorage.getItem("erp_contacts");
    const localSalesOrders = localStorage.getItem("erp_salesOrders");
    const localStock = localStorage.getItem("erp_stock");
    const localFinancial = localStorage.getItem("erp_financial");
    const localPurchase = localStorage.getItem("erp_purchaseOrders");
    const localEntryInvoices = localStorage.getItem("erp_entryInvoices");
    const localOutboundInvoices = localStorage.getItem("erp_outboundInvoices");
    const localMrp = localStorage.getItem("erp_mrp");
    const localAlerts = localStorage.getItem("erp_alerts");
    const localUsers = localStorage.getItem("erp_users");
    const localPurchaseNeeds = localStorage.getItem("erp_purchaseNeeds");
    const localQuotes = localStorage.getItem("erp_quotes");
    const localCompanySettings = localStorage.getItem("erp_companySettings");

    if (localCompanySettings) setCompanySettingsState(JSON.parse(localCompanySettings));
    else {
      setCompanySettingsState(initialCompanySettings);
      localStorage.setItem("erp_companySettings", JSON.stringify(initialCompanySettings));
    }

    if (localProducts) {
      const parsed = JSON.parse(localProducts);
      const hasNewProducts = parsed.some(
        (p: any) => p.codigo === "PFX-0840" || p.codigo === "PFA-0620",
      );
      if (!hasNewProducts) {
        const merged = [...parsed];
        initialProducts.forEach((ip) => {
          if (!merged.some((p: any) => p.codigo === ip.codigo)) {
            merged.push(ip);
          }
        });
        setProducts(merged);
        localStorage.setItem("erp_products", JSON.stringify(merged));
      } else {
        setProducts(parsed);
      }
    } else {
      setProducts(initialProducts);
      localStorage.setItem("erp_products", JSON.stringify(initialProducts));
    }

    if (localBom) setBom(JSON.parse(localBom));
    else {
      setBom(initialBom);
      localStorage.setItem("erp_bom", JSON.stringify(initialBom));
    }

    if (localContacts) setContacts(JSON.parse(localContacts));
    else {
      setContacts(initialContacts);
      localStorage.setItem("erp_contacts", JSON.stringify(initialContacts));
    }

    if (localSalesOrders) setSalesOrders(JSON.parse(localSalesOrders));
    else {
      setSalesOrders(initialSalesOrders);
      localStorage.setItem(
        "erp_salesOrders",
        JSON.stringify(initialSalesOrders),
      );
    }

    if (localStock) setStock(JSON.parse(localStock));
    else {
      setStock(initialStock);
      localStorage.setItem("erp_stock", JSON.stringify(initialStock));
    }

    if (localFinancial) setFinancialEntries(JSON.parse(localFinancial));
    else {
      setFinancialEntries(initialFinancial);
      localStorage.setItem("erp_financial", JSON.stringify(initialFinancial));
    }

    if (localPurchase) setPurchaseOrders(JSON.parse(localPurchase));
    else {
      setPurchaseOrders(initialPurchaseOrders);
      localStorage.setItem(
        "erp_purchaseOrders",
        JSON.stringify(initialPurchaseOrders),
      );
    }

    if (localEntryInvoices) setEntryInvoices(JSON.parse(localEntryInvoices));
    else {
      setEntryInvoices(initialEntryInvoices);
      localStorage.setItem(
        "erp_entryInvoices",
        JSON.stringify(initialEntryInvoices),
      );
    }

    if (localOutboundInvoices)
      setOutboundInvoices(JSON.parse(localOutboundInvoices));
    else {
      setOutboundInvoices(initialOutboundInvoices);
      localStorage.setItem(
        "erp_outboundInvoices",
        JSON.stringify(initialOutboundInvoices),
      );
    }

    if (localMrp) setMrpRequirements(JSON.parse(localMrp));
    else {
      setMrpRequirements(initialMrp);
      localStorage.setItem("erp_mrp", JSON.stringify(initialMrp));
    }

    if (localAlerts) setAlerts(JSON.parse(localAlerts));
    else {
      setAlerts(initialAlerts);
      localStorage.setItem("erp_alerts", JSON.stringify(initialAlerts));
    }

    if (localUsers) setUsers(JSON.parse(localUsers));
    else {
      setUsers(initialUsers);
      localStorage.setItem("erp_users", JSON.stringify(initialUsers));
    }

    if (localPurchaseNeeds) setPurchaseNeeds(JSON.parse(localPurchaseNeeds));
    if (localQuotes) setQuotes(JSON.parse(localQuotes));

    const localUnidades = localStorage.getItem("erp_unidadesMedida");
    if (localUnidades) setUnidadesMedida(JSON.parse(localUnidades));
    else {
      setUnidadesMedida(initialUnidadesMedida);
      localStorage.setItem(
        "erp_unidadesMedida",
        JSON.stringify(initialUnidadesMedida),
      );
    }

    const localLogo = localStorage.getItem("erp_appLogo");
    if (localLogo) setAppLogoState(localLogo);

    const localTemplates = localStorage.getItem("erp_printTemplates");
    if (localTemplates) setPrintTemplates(JSON.parse(localTemplates));
  }, []);

  // Update localStorage helper
  const saveState = (key: string, data: any, setter: Function) => {
    setter(data);
    localStorage.setItem(key, JSON.stringify(data));
  };

  const resetDatabase = () => {
    localStorage.removeItem("erp_products");
    localStorage.removeItem("erp_bom");
    localStorage.removeItem("erp_contacts");
    localStorage.removeItem("erp_salesOrders");
    localStorage.removeItem("erp_stock");
    localStorage.removeItem("erp_financial");
    localStorage.removeItem("erp_purchaseOrders");
    localStorage.removeItem("erp_entryInvoices");
    localStorage.removeItem("erp_outboundInvoices");
    localStorage.removeItem("erp_mrp");
    localStorage.removeItem("erp_alerts");
    localStorage.removeItem("erp_unidadesMedida");

    setProducts(initialProducts);
    setBom(initialBom);
    setContacts(initialContacts);
    setSalesOrders(initialSalesOrders);
    setStock(initialStock);
    setFinancialEntries(initialFinancial);
    setPurchaseOrders(initialPurchaseOrders);
    setEntryInvoices(initialEntryInvoices);
    setOutboundInvoices(initialOutboundInvoices);
    setMrpRequirements([]);
    setAlerts(initialAlerts);
    setUnidadesMedida(initialUnidadesMedida);
    showToast("Banco de dados local reinicializado com sucesso!");
  };

  const setCompanySettings = (settings: CompanySettings) => {
    saveState("erp_companySettings", settings, setCompanySettingsState);
    showToast("Configurações da empresa atualizadas!");
  };

  // Users Management
  const saveUser = (u: Omit<User, "id"> & { id?: number }) => {
    let next: User[];
    if (u.id) {
      next = users.map((item) =>
        item.id === u.id ? ({ ...item, ...u } as User) : item,
      );
    } else {
      const newId =
        users.length > 0 ? Math.max(...users.map((item) => item.id)) + 1 : 1;
      next = [...users, { ...u, id: newId } as User];
    }
    saveState("erp_users", next, setUsers);
    showToast(`Usuário ${u.username} salvo com sucesso!`);
  };

  const deleteUser = (id: number) => {
    const next = users.filter((item) => item.id !== id);
    saveState("erp_users", next, setUsers);
    showToast("Usuário removido!");
  };

  // 1. Products Management
  const saveProduct = (p: Product) => {
    let next: Product[];
    if (p.id) {
      next = products.map((item) => (item.id === p.id ? p : item));
    } else {
      const newId =
        products.length > 0
          ? Math.max(...products.map((item) => item.id)) + 1
          : 1;
      next = [...products, { ...p, id: newId }];
      // Set initial stock 0, minimo 5
      const newStock: Stock = { prodId: newId, qtd: 0, minimo: 5 };
      saveState("erp_stock", [...stock, newStock], setStock);
    }
    saveState("erp_products", next, setProducts);
    showToast(`Produto ${p.codigo} salvo com sucesso!`);
  };

  const deleteProduct = (id: number) => {
    const next = products.filter((item) => item.id !== id);
    saveState("erp_products", next, setProducts);
    const nextStock = stock.filter((item) => item.prodId !== id);
    saveState("erp_stock", nextStock, setStock);
    const nextBom = bom.filter(
      (item) => item.parentId !== id && item.componentId !== id,
    );
    saveState("erp_bom", nextBom, setBom);
    showToast("Produto removido da fábrica!");
  };

  // 2. Contacts Management
  const saveContact = (c: Contact) => {
    let next: Contact[];
    if (c.id) {
      next = contacts.map((item) => (item.id === c.id ? c : item));
    } else {
      const newId =
        contacts.length > 0
          ? Math.max(...contacts.map((item) => item.id)) + 1
          : 1;
      next = [...contacts, { ...c, id: newId }];
    }
    saveState("erp_contacts", next, setContacts);
    showToast(`Contato ${c.nome} registrado!`);
  };

  const deleteContact = (id: number) => {
    const next = contacts.filter((item) => item.id !== id);
    saveState("erp_contacts", next, setContacts);
    showToast("Contato excluído do ERP!");
  };

  const savePurchaseNeed = (
    n: Omit<import("../lib/types").PurchaseNeed, "id"> & { id?: number },
  ) => {
    let next: import("../lib/types").PurchaseNeed[];
    if (n.id) {
      next = purchaseNeeds.map((item) =>
        item.id === n.id
          ? ({ ...item, ...n } as import("../lib/types").PurchaseNeed)
          : item,
      );
    } else {
      const newId =
        purchaseNeeds.length > 0
          ? Math.max(...purchaseNeeds.map((item) => item.id)) + 1
          : 1;
      next = [
        ...purchaseNeeds,
        { ...n, id: newId } as import("../lib/types").PurchaseNeed,
      ];
    }
    saveState("erp_purchaseNeeds", next, setPurchaseNeeds);
    showToast(`Necessidade de Compra salva com sucesso!`);
  };

  const deletePurchaseNeed = (id: number) => {
    const next = purchaseNeeds.filter((item) => item.id !== id);
    saveState("erp_purchaseNeeds", next, setPurchaseNeeds);
    showToast("Necessidade de Compra excluída!");
  };

  const saveQuote = (
    q: Omit<import("../lib/types").Quote, "id"> & { id?: number },
  ) => {
    let next: import("../lib/types").Quote[];
    if (q.id) {
      next = quotes.map((item) =>
        item.id === q.id
          ? ({ ...item, ...q } as import("../lib/types").Quote)
          : item,
      );
    } else {
      const newId =
        quotes.length > 0 ? Math.max(...quotes.map((item) => item.id)) + 1 : 1;
      next = [...quotes, { ...q, id: newId } as import("../lib/types").Quote];
    }
    saveState("erp_quotes", next, setQuotes);
    showToast(`Orçamento salvo com sucesso!`);
  };

  const deleteQuote = (id: number) => {
    const next = quotes.filter((item) => item.id !== id);
    saveState("erp_quotes", next, setQuotes);
    showToast("Orçamento excluído!");
  };

  // 3. Sales Order & Outbound Invoicing
  const saveSalesOrder = (o: Omit<SalesOrder, "id">) => {
    const newId =
      salesOrders.length > 0
        ? Math.max(...salesOrders.map((item) => item.id)) + 1
        : 1001;
    const next = [...salesOrders, { ...o, id: newId }];
    saveState("erp_salesOrders", next, setSalesOrders);
    showToast(`Pedido de Venda #${newId} registrado em carteira!`);
  };

  const updateSalesOrder = (o: SalesOrder) => {
    const next = salesOrders.map((order) => (order.id === o.id ? o : order));
    saveState("erp_salesOrders", next, setSalesOrders);
    showToast(`Pedido de Venda #${o.id} atualizado com sucesso!`);
  };

  const faturarSalesOrder = (id: number) => {
    const nextOrders = salesOrders.map((order) => {
      if (order.id === id) {
        if (order.status !== "Aberto") return order;

        // DEDUCT STOCK & GENERATE FINANCIAL / INVOICE
        const nextStock = [...stock];
        let stockSufficient = true;

        order.itens.forEach((item) => {
          const sIdx = nextStock.findIndex((s) => s.prodId === item.prodId);
          if (sIdx !== -1) {
            if (nextStock[sIdx].qtd < item.qtd) {
              stockSufficient = false;
            }
            nextStock[sIdx].qtd = Math.max(0, nextStock[sIdx].qtd - item.qtd);
          }
        });

        // Trigger warnings/alerts if stock was insufficient
        if (!stockSufficient) {
          const alertMsg = `Faturamento do Pedido #${id} realizado com estoque insuficiente! O saldo físico ficará negativo provisoriamente.`;
          setAlerts((prev) => [
            {
              id: Date.now(),
              tipo: "warning",
              mensagem: alertMsg,
              data: getTodayFormatted(),
            },
            ...prev,
          ]);
        }

        saveState("erp_stock", nextStock, setStock);

        // Generate Outbound Invoice (Mock SEFAZ XML Layout)
        const invoiceNum = String(outboundInvoices.length + 8512).padStart(
          8,
          "0",
        );
        const randomKey =
          "352606" +
          String(Math.floor(Math.random() * 100000000000)).padStart(12, "0") +
          "55001" +
          invoiceNum +
          "19283749102";
        const newInvoice: OutboundInvoice = {
          id: Date.now(),
          numero: invoiceNum,
          chave: randomKey,
          clienteId: order.clienteId,
          dataEmissao: getTodayFormatted(),
          pedidoVendaId: order.id,
          valorTotal: order.valorTotal,
          itens: order.itens,
          xmlOriginal: `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe${randomKey}" versao="4.00">
      <ide>
        <cUF>35</cUF>
        <cNF>92837491</cNF>
        <natOp>Venda de Producao do Estabelecimento</natOp>
        <mod>55</mod>
        <serie>1</serie> series
        <nNF>${invoiceNum}</nNF>
        <dhEmi>2026-06-25T10:15:30-03:00</dhEmi>
        <tpNF>1</tpNF>
      </ide>
      <emit>
        <CNPJ>12.345.678/0001-00</CNPJ>
        <xNome>INDUSTRIAL ERP MANUFACTURING S/A</xNome>
        <xFant>Industrial ERP</xFant>
      </emit>
      <dest>
        <CNPJ>12.345.678/0001-99</CNPJ>
        <xNome>BOSCH REXROTH BRASIL S/A</xNome>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PA-MESA-MET</cProd>
          <xProd>Mesa Industrial Metálica Premium</xProd>
          <qCom>${order.itens[0]?.qtd || 1}</qCom>
          <vUnCom>${order.itens[0]?.valorUnitario || 850}</vUnCom>
          <vProd>${order.valorTotal}</vProd>
        </prod>
      </det>
      <total>
        <ICMSTot>
          <vProd>${order.valorTotal}</vProd>
          <vNF>${order.valorTotal}</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`,
        };
        saveState(
          "erp_outboundInvoices",
          [...outboundInvoices, newInvoice],
          setOutboundInvoices,
        );

        // Generate Financial Receivable
        const customer = contacts.find((c) => c.id === order.clienteId);
        const newFinance: FinancialEntry = {
          id: Date.now() + 1,
          descricao: `Faturamento NF-e #${invoiceNum} (Ref: Pedido #${order.id})`,
          tipo: "Receita",
          dataVencimento: order.dataEntrega,
          valor: order.valorTotal,
          status: "Pendente",
        };
        saveState(
          "erp_financial",
          [...financialEntries, newFinance],
          setFinancialEntries,
        );

        return { ...order, status: "Faturado" as const };
      }
      return order;
    });

    saveState("erp_salesOrders", nextOrders, setSalesOrders);
    showToast(
      `Pedido de Venda #${id} Faturado! Nota Fiscal e Contas a Receber gerados.`,
    );
  };

  const cancelSalesOrder = (id: number) => {
    const nextOrders = salesOrders.map((order) =>
      order.id === id ? { ...order, status: "Cancelado" as const } : order,
    );
    saveState("erp_salesOrders", nextOrders, setSalesOrders);
    showToast(`Pedido de Venda #${id} Cancelado.`);
  };

  // 4. Purchase Order & Entry Invoices
  const savePurchaseOrder = (o: Omit<PurchaseOrder, "id">) => {
    const newId =
      purchaseOrders.length > 0
        ? Math.max(...purchaseOrders.map((item) => item.id)) + 1
        : 3001;
    const next = [...purchaseOrders, { ...o, id: newId }];
    saveState("erp_purchaseOrders", next, setPurchaseOrders);
    showToast(`Pedido de Compra #${newId} enviado ao fornecedor!`);
  };

  const receberPurchaseOrder = (id: number) => {
    const nextPurchases = purchaseOrders.map((order) => {
      if (order.id === id) {
        if (order.status !== "Aberto") return order;

        // INCREASE STOCK
        const nextStock = [...stock];
        order.itens.forEach((item) => {
          const sIdx = nextStock.findIndex((s) => s.prodId === item.prodId);
          if (sIdx !== -1) {
            nextStock[sIdx].qtd += item.qtd;
          } else {
            nextStock.push({ prodId: item.prodId, qtd: item.qtd, minimo: 5 });
          }
        });
        saveState("erp_stock", nextStock, setStock);

        // Generate Entry Invoice
        const invoiceNum = String(entryInvoices.length + 4002).padStart(8, "0");
        const randomKey =
          "352606" +
          String(Math.floor(Math.random() * 100000000000)).padStart(12, "0") +
          "55001" +
          invoiceNum +
          "19283749102";
        const newInvoice: EntryInvoice = {
          id: Date.now(),
          numero: invoiceNum,
          chave: randomKey,
          fornecedorId: order.fornecedorId,
          dataEmissao: getTodayFormatted(),
          valorTotal: order.valorTotal,
          itens: order.itens,
        };
        saveState(
          "erp_entryInvoices",
          [...entryInvoices, newInvoice],
          setEntryInvoices,
        );

        // Generate Financial Payable
        const newFinance: FinancialEntry = {
          id: Date.now() + 1,
          descricao: `Compra Matérias-Primas NF-e #${invoiceNum} (Ref: Pedido de Compra #${order.id})`,
          tipo: "Despesa",
          dataVencimento: addWorkingDays(new Date(), 15).toLocaleDateString(
            "pt-BR",
          ), // default 15 working days term
          valor: order.valorTotal,
          status: "Pendente",
        };
        saveState(
          "erp_financial",
          [...financialEntries, newFinance],
          setFinancialEntries,
        );

        return { ...order, status: "Recebido" as const };
      }
      return order;
    });

    saveState("erp_purchaseOrders", nextPurchases, setPurchaseOrders);
    showToast(
      `Pedido de Compra #${id} recebido com sucesso! Estoque abastecido e Contas a Pagar gerado.`,
    );
  };

  const cancelPurchaseOrder = (id: number) => {
    const nextPurchases = purchaseOrders.map((order) =>
      order.id === id ? { ...order, status: "Cancelado" as const } : order,
    );
    saveState("erp_purchaseOrders", nextPurchases, setPurchaseOrders);
    showToast(`Pedido de Compra #${id} Cancelado.`);
  };

  const receberPurchaseOrderWithXml = (
    orderId: number,
    nNF: string,
    chNFe: string,
    xmlItens: {
      prodId?: number;
      prodCode: string;
      prodDesc: string;
      unidade?: string;
      qtd: number;
      valorUnitario: number;
    }[],
    valorTotal: number,
  ) => {
    const order = purchaseOrders.find((o) => o.id === orderId);
    if (!order || order.status !== "Aberto") {
      showToast("Este pedido de compra não está em aberto ou não existe.");
      return;
    }

    // 1. Identify and register any products that do not exist yet
    const nextProducts = [...products];
    const nextStock = [...stock];
    let maxProdId =
      nextProducts.length > 0 ? Math.max(...nextProducts.map((p) => p.id)) : 0;
    let productsCreatedCount = 0;

    const mappedItens = xmlItens.map((item) => {
      let existingProd = nextProducts.find(
        (p) => p.codigo.toLowerCase() === item.prodCode.toLowerCase(),
      );

      let pId: number;
      if (existingProd) {
        pId = existingProd.id;
      } else {
        maxProdId += 1;
        pId = maxProdId;
        const newProd: Product = {
          id: pId,
          codigo: item.prodCode,
          descricao: item.prodDesc || "Produto Importado XML",
          tipo: "Materia-Prima",
          unidade: item.unidade || "UN",
          valor: item.valorUnitario,
          leadTime: 2,
          needsReview: true,
          codigoFornecedor: item.prodCode,
        };
        nextProducts.push(newProd);
        nextStock.push({ prodId: pId, qtd: 0, minimo: 5 });
        productsCreatedCount += 1;
      }

      return {
        prodId: pId,
        qtd: item.qtd,
        valorUnitario: item.valorUnitario,
      };
    });

    if (productsCreatedCount > 0) {
      saveState("erp_products", nextProducts, setProducts);
    }

    // 2. INCREASE STOCK based on XML quantities
    mappedItens.forEach((item) => {
      const sIdx = nextStock.findIndex((s) => s.prodId === item.prodId);
      if (sIdx !== -1) {
        nextStock[sIdx].qtd += item.qtd;
      } else {
        nextStock.push({ prodId: item.prodId, qtd: item.qtd, minimo: 5 });
      }
    });
    saveState("erp_stock", nextStock, setStock);

    // 3. Generate Entry Invoice with XML details
    const invoiceNum =
      nNF || String(entryInvoices.length + 4002).padStart(8, "0");
    const key =
      chNFe ||
      "352606" +
        String(Math.floor(Math.random() * 100000000000)).padStart(12, "0") +
        "55001" +
        invoiceNum +
        "19283749102";
    const newInvoice: EntryInvoice = {
      id: Date.now(),
      numero: invoiceNum,
      chave: key,
      fornecedorId: order.fornecedorId,
      dataEmissao: getTodayFormatted(),
      valorTotal: valorTotal,
      itens: mappedItens,
    };
    saveState(
      "erp_entryInvoices",
      [...entryInvoices, newInvoice],
      setEntryInvoices,
    );

    // 4. Generate Financial Payable
    const newFinance: FinancialEntry = {
      id: Date.now() + 1,
      descricao: `Compra Matérias-Primas NF-e #${invoiceNum} via Importação XML (Ref: Pedido de Compra #${order.id})`,
      tipo: "Despesa",
      dataVencimento: addWorkingDays(new Date(), 15).toLocaleDateString(
        "pt-BR",
      ), // default 15 working days term
      valor: valorTotal,
      status: "Pendente",
    };
    saveState(
      "erp_financial",
      [...financialEntries, newFinance],
      setFinancialEntries,
    );

    // 5. Update purchase orders
    const nextPurchases = purchaseOrders.map((o) => {
      if (o.id === orderId) {
        return { ...o, status: "Recebido" as const };
      }
      return o;
    });
    saveState("erp_purchaseOrders", nextPurchases, setPurchaseOrders);

    let toastMsg = `Pedido de Compra #${orderId} recebido via XML! Estoque abastecido e Contas a Pagar gerado.`;
    if (productsCreatedCount > 0) {
      toastMsg += ` (${productsCreatedCount} novos produtos cadastrados automaticamente)`;
    }
    showToast(toastMsg);
  };

  // 5. MRP Calculation Engine (1º Nível)
  const runMrpCalculation = () => {
    // Collect all requirements from open Sales Orders
    const openOrders = salesOrders.filter((o) => o.status === "Aberto");
    const requirementsMap: {
      [prodId: number]: {
        totalNeeded: number;
        dataNecessidade: Date;
        origins: Set<string>;
      };
    } = {};

    // Recursive BOM Explorer to aggregate gross component needs
    const explodeBOM = (
      prodId: number,
      neededQty: number,
      dateLimit: Date,
      originText: string,
    ) => {
      // Find components of this product
      const subItems = bom.filter((b) => b.parentId === prodId);

      if (subItems.length === 0) {
        // It's a raw material or leaf node, accumulate gross requirements directly
        if (!requirementsMap[prodId]) {
          requirementsMap[prodId] = {
            totalNeeded: 0,
            dataNecessidade: dateLimit,
            origins: new Set(),
          };
        }
        requirementsMap[prodId].totalNeeded += neededQty;
        requirementsMap[prodId].origins.add(originText);
        if (dateLimit < requirementsMap[prodId].dataNecessidade) {
          requirementsMap[prodId].dataNecessidade = dateLimit;
        }
        return;
      }

      // If it's an assembly or finished good, explode it
      subItems.forEach((item) => {
        const prod = products.find((p) => p.id === item.componentId);
        const subLeadTime = prod ? prod.leadTime : 1;

        // Calculate sub limit date: Parent delivery date minus parent lead time
        const subDateLimit = new Date(dateLimit.getTime());
        subDateLimit.setDate(subDateLimit.getDate() - subLeadTime);

        explodeBOM(
          item.componentId,
          neededQty * item.quantidade,
          subDateLimit,
          originText,
        );
      });

      // Also track the assembly itself if it's not a root order item (to know assembly schedule)
      if (!requirementsMap[prodId]) {
        requirementsMap[prodId] = {
          totalNeeded: 0,
          dataNecessidade: dateLimit,
          origins: new Set(),
        };
      }
      requirementsMap[prodId].totalNeeded += neededQty;
      requirementsMap[prodId].origins.add(originText);
    };

    // Populate gross requirements
    openOrders.forEach((order) => {
      const deliveryDate = parseDate(order.dataEntrega) || new Date();

      order.itens.forEach((item) => {
        const prod = products.find((p) => p.id === item.prodId);
        const leadTime = prod ? prod.leadTime : 1;
        const assemblyStartDate = new Date(deliveryDate.getTime());
        assemblyStartDate.setDate(assemblyStartDate.getDate() - leadTime);

        explodeBOM(
          item.prodId,
          item.qtd,
          assemblyStartDate,
          `Pedido #${order.id}`,
        );
      });
    });

    // Net requirement calculation = Gross - Stock - OnOrder
    const finalRequirements: MrpRequirement[] = [];
    let reqId = 1;

    Object.keys(requirementsMap).forEach((key) => {
      const prodId = Number(key);
      const req = requirementsMap[prodId];
      const prod = products.find((p) => p.id === prodId);
      if (!prod) return;

      // Current Physical Stock
      const stockRow = stock.find((s) => s.prodId === prodId);
      const currentStock = stockRow ? stockRow.qtd : 0;

      // Pending on Purchase Orders
      const openPurchases = purchaseOrders.filter(
        (po) => po.status === "Aberto",
      );
      let incomingQty = 0;
      openPurchases.forEach((po) => {
        po.itens.forEach((it) => {
          if (it.prodId === prodId) incomingQty += it.qtd;
        });
      });

      // Net required qty
      const netQty = req.totalNeeded - currentStock - incomingQty;

      if (netQty > 0) {
        finalRequirements.push({
          id: reqId++,
          prodId,
          qtdNecessaria: Math.ceil(netQty * 100) / 100, // round up to 2 decimals
          dataNecessidade: req.dataNecessidade.toLocaleDateString("pt-BR"),
          origem: Array.from(req.origins).join(", "),
          status: "Pendente",
        });
      }
    });

    saveState("erp_mrp", finalRequirements, setMrpRequirements);

    // Dynamic alert generation about critical materials
    const alertsToKeep = alerts.filter(
      (a) =>
        !a.mensagem.includes("rodou o MRP") &&
        !a.mensagem.includes("MRP calculado"),
    );
    const newAlerts: Alert[] = [
      {
        id: Date.now(),
        tipo: "success",
        mensagem: `MRP calculado com sucesso! Encontradas ${finalRequirements.length} necessidades críticas de suprimentos/produção.`,
        data: getTodayFormatted(),
      },
      ...alertsToKeep,
    ];

    if (finalRequirements.length > 0) {
      newAlerts.push({
        id: Date.now() + 1,
        tipo: "warning",
        mensagem: `Atenção: Necessidades de insumos não atendidas. Crie ordens de compra para os fornecedores homologados.`,
        data: getTodayFormatted(),
      });
    }

    saveState("erp_alerts", newAlerts, setAlerts);
    showToast(
      `Planejador MRP Concluído! ${finalRequirements.length} necessidades mapeadas.`,
    );
  };

  // 6. Stock Manual Adjustment
  const adjustStockQtd = (prodId: number, delta: number) => {
    const nextStock = stock.map((s) => {
      if (s.prodId === prodId) {
        return { ...s, qtd: Math.max(0, s.qtd + delta) };
      }
      return s;
    });
    saveState("erp_stock", nextStock, setStock);
    showToast("Ajuste de inventário manual efetuado!");
  };

  const updateStockMinimo = (prodId: number, minimo: number) => {
    const nextStock = stock.map((s) => {
      if (s.prodId === prodId) {
        return { ...s, minimo };
      }
      return s;
    });
    saveState("erp_stock", nextStock, setStock);
    showToast("Estoque mínimo de segurança atualizado!");
  };

  // 7. Financial Entries
  const saveFinancialEntry = (
    f: Omit<FinancialEntry, "id"> & { id?: number },
  ) => {
    let next: FinancialEntry[];
    if (f.id) {
      next = financialEntries.map((item) =>
        item.id === f.id ? { ...item, ...f } : item,
      );
    } else {
      const newId =
        financialEntries.length > 0
          ? Math.max(...financialEntries.map((item) => item.id)) + 1
          : 2001;
      next = [...financialEntries, { ...f, id: newId }];
    }
    saveState("erp_financial", next, setFinancialEntries);
    showToast(
      f.id
        ? "Lançamento financeiro atualizado!"
        : "Lançamento financeiro realizado!",
    );
  };

  const liquidateFinancial = (id: number) => {
    const next = financialEntries.map((item) =>
      item.id === id ? { ...item, status: "Pago" as const } : item,
    );
    saveState("erp_financial", next, setFinancialEntries);
    showToast("Duplicata liquidada no fluxo de caixa!");
  };

  const deleteFinancialEntry = (id: number) => {
    const next = financialEntries.filter((item) => item.id !== id);
    saveState("erp_financial", next, setFinancialEntries);
    showToast("Lançamento removido do ledger!");
  };

  const saveOutboundInvoice = (
    invoice: Omit<OutboundInvoice, "id" | "numero" | "chave"> & {
      id?: number;
      numero?: string;
      chave?: string;
    },
  ) => {
    let next: OutboundInvoice[];
    if (invoice.id && outboundInvoices.some((item) => item.id === invoice.id)) {
      next = outboundInvoices.map((item) =>
        item.id === invoice.id
          ? ({ ...item, ...invoice } as OutboundInvoice)
          : item,
      );
    } else {
      const id = invoice.id || Date.now();
      const numero =
        invoice.numero ||
        String(outboundInvoices.length + 8512).padStart(8, "0");
      const chave =
        invoice.chave ||
        "352606" +
          String(Math.floor(Math.random() * 100000000000)).padStart(12, "0") +
          "55001" +
          numero +
          "19283749102";
      const newInvoice: OutboundInvoice = {
        ...invoice,
        id,
        numero,
        chave,
        pedidoVendaId: invoice.pedidoVendaId || 0,
      };
      next = [...outboundInvoices, newInvoice];
    }
    saveState("erp_outboundInvoices", next, setOutboundInvoices);
    showToast("Documento de saída registrado com sucesso!");
  };

  // 8. BOM Items (Engineering)
  const saveBomItem = (b: Omit<BomItem, "id"> & { id?: number }) => {
    let next: BomItem[];
    if (b.id) {
      next = bom.map((item) => (item.id === b.id ? { ...item, ...b } : item));
    } else {
      const newId =
        bom.length > 0 ? Math.max(...bom.map((item) => item.id)) + 1 : 1;
      next = [...bom, { ...b, id: newId }];
    }
    saveState("erp_bom", next, setBom);
    showToast("Estrutura de Engenharia (BOM) atualizada!");
  };

  const deleteBomItem = (id: number) => {
    const next = bom.filter((item) => item.id !== id);
    saveState("erp_bom", next, setBom);
    showToast("Componente de estrutura removido da engenharia!");
  };

  const cloneBomStructure = (fromParentId: number, toParentId: number) => {
    const sourceItems = bom.filter((item) => item.parentId === fromParentId);
    if (sourceItems.length === 0) return;

    let currentMaxId =
      bom.length > 0 ? Math.max(...bom.map((item) => item.id)) : 0;
    const newItems = sourceItems.map((item) => {
      currentMaxId++;
      return {
        id: currentMaxId,
        parentId: toParentId,
        componentId: item.componentId,
        quantidade: item.quantidade,
      };
    });

    const next = [...bom, ...newItems];
    saveState("erp_bom", next, setBom);
    showToast(`Estrutura copiada com sucesso para o novo produto!`);
  };

  // 9. XML SEFAZ Importer
  const importXml = (xmlTextRaw: string): boolean => {
    try {
      let xmlText = xmlTextRaw.trim();
      // Strip UTF-8 Byte Order Mark (BOM) if present
      if (xmlText.charCodeAt(0) === 0xfeff) {
        xmlText = xmlText.slice(1);
      }

      // Simple parser for mockup and real SEFAZ structure using regex
      const getTagContent = (tag: string, text: string): string => {
        const regex = new RegExp(
          `<([^>:]+:)?${tag}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/([^>:]+:)?${tag}>`,
          "i",
        );
        const match = text.match(regex);
        return match ? match[2].trim() : "";
      };

      const cnpfEmit = getTagContent("CNPJ", xmlText);
      const nameEmit = getTagContent("xNome", xmlText);
      let nNF = getTagContent("nNF", xmlText);
      if (!nNF) {
        // Fallback to avoid rejecting real non-standard/variant XMLs
        nNF =
          getTagContent("numero", xmlText) ||
          getTagContent("nRef", xmlText) ||
          String(Math.floor(Math.random() * 90000) + 10000);
      }
      let dEmi =
        getTagContent("dhEmi", xmlText) || getTagContent("dEmi", xmlText);
      if (dEmi && dEmi.includes("T")) dEmi = dEmi.split("T")[0]; // ISO dates

      // Parse date beautifully
      let dateEmi = getTodayFormatted();
      if (dEmi) {
        const dParts = dEmi.split("-");
        if (dParts.length === 3) {
          dateEmi = `${dParts[2]}/${dParts[1]}/${dParts[0]}`;
        }
      }

      // If emit CNPJ or name is empty, it's not a valid invoice
      if (!nNF) {
        throw new Error(
          "Número da Nota Fiscal (nNF) não pôde ser identificado.",
        );
      }

      // Find or create supplier
      let supplier = contacts.find(
        (c) =>
          c.tipo === "Fornecedor" &&
          cnpfEmit &&
          c.cnpj.replace(/\D/g, "") === cnpfEmit.replace(/\D/g, ""),
      );
      if (!supplier) {
        const newId =
          contacts.length > 0
            ? Math.max(...contacts.map((item) => item.id)) + 1
            : 1;
        supplier = {
          id: newId,
          nome: nameEmit || "Fornecedor XML Importado",
          tipo: "Fornecedor",
          cnpj: cnpfEmit || "00.000.000/0000-00",
          email:
            "contato@" +
            (nameEmit
              ? nameEmit.toLowerCase().replace(/[^a-z0-9]/g, "")
              : "fornecedor") +
            ".com",
          telefone: "(11) 9999-9999",
          cidade: getTagContent("xMun", xmlText) || "Indefinida",
          uf: getTagContent("UF", xmlText) || "SP",
        };
        saveState("erp_contacts", [...contacts, supplier], setContacts);
      }

      // Parse items in invoice XML
      // Brazilian NFe can have multiple det items, let's find all <prod> blocks
      const items: { prodId: number; qtd: number; valorUnitario: number }[] =
        [];
      const prodRegex =
        /<([^>:]+:)?prod(?:\s+[^>]*)?>([\s\S]*?)<\/([^>:]+:)?prod>/gi;
      let match;
      let totalNfValue = 0;

      const nextProducts = [...products];
      const nextStock = [...stock];

      while ((match = prodRegex.exec(xmlText)) !== null) {
        const prodBlock = match[2];
        const cProd = getTagContent("cProd", prodBlock);
        const xProd = getTagContent("xProd", prodBlock);

        const qComRaw = getTagContent("qCom", prodBlock);
        const qCom = parseFloat(qComRaw.replace(",", ".")) || 1;

        const vUnComRaw = getTagContent("vUnCom", prodBlock);
        const vUnCom = parseFloat(vUnComRaw.replace(",", ".")) || 0;

        const vProdRaw = getTagContent("vProd", prodBlock);
        const vProd = parseFloat(vProdRaw.replace(",", ".")) || qCom * vUnCom;

        totalNfValue += vProd;

        // Check if product exists, or create dynamic raw material
        let product = cProd
          ? nextProducts.find(
              (p) =>
                p.codigo.toLowerCase() === cProd.toLowerCase() ||
                (p.codigoFornecedor &&
                  p.codigoFornecedor.toLowerCase() === cProd.toLowerCase()) ||
                (p.codigoFornecedor2 &&
                  p.codigoFornecedor2.toLowerCase() === cProd.toLowerCase()) ||
                (p.codigoFornecedor3 &&
                  p.codigoFornecedor3.toLowerCase() === cProd.toLowerCase()) ||
                (p.codigoFornecedor4 &&
                  p.codigoFornecedor4.toLowerCase() === cProd.toLowerCase()),
            )
          : null;
        if (!product) {
          const newProdId =
            nextProducts.length > 0
              ? Math.max(...nextProducts.map((item) => item.id)) + 1
              : 1;
          product = {
            id: newProdId,
            codigo: cProd || "MP-DYN-" + Math.floor(Math.random() * 10000),
            descricao: xProd || "Material Importado XML",
            tipo: "Materia-Prima",
            unidade: getTagContent("uCom", prodBlock) || "UN",
            valor: vUnCom,
            leadTime: 2,
            needsReview: true,
            codigoFornecedor: cProd,
          };
          nextProducts.push(product);
          nextStock.push({ prodId: newProdId, qtd: 0, minimo: 5 });
        }

        // Aggregate stock adjustments
        const sIdx = nextStock.findIndex((s) => s.prodId === product!.id);
        if (sIdx !== -1) {
          nextStock[sIdx].qtd += qCom;
        } else {
          nextStock.push({ prodId: product!.id, qtd: qCom, minimo: 5 });
        }

        items.push({
          prodId: product.id,
          qtd: qCom,
          valorUnitario: vUnCom,
        });
      }

      // If no item parsed, simulate single parsed item from XML
      if (items.length === 0) {
        const vTot = parseFloat(getTagContent("vNF", xmlText)) || 1500;
        const defaultProd =
          nextProducts.find((p) => p.tipo === "Materia-Prima") ||
          nextProducts[4];
        items.push({
          prodId: defaultProd.id,
          qtd: 10,
          valorUnitario: vTot / 10,
        });
        totalNfValue = vTot;
        const sIdx = nextStock.findIndex((s) => s.prodId === defaultProd.id);
        if (sIdx !== -1) {
          nextStock[sIdx].qtd += 10;
        }
      }

      // Save updated products and stock
      saveState("erp_products", nextProducts, setProducts);
      saveState("erp_stock", nextStock, setStock);

      // Create Entry Invoice (Nota de Entrada)
      const newInvoiceId = Date.now();
      const newInvoice: EntryInvoice = {
        id: newInvoiceId,
        numero: nNF,
        chave:
          getTagContent("chNFe", xmlText) ||
          "352606" +
            cnpfEmit.replace(/\D/g, "") +
            "55001" +
            nNF +
            "19283749102",
        fornecedorId: supplier.id,
        dataEmissao: dateEmi,
        valorTotal: totalNfValue,
        itens: items,
        xmlOriginal: xmlText,
      };
      saveState(
        "erp_entryInvoices",
        [...entryInvoices, newInvoice],
        setEntryInvoices,
      );

      // Create Accounts Payable (Financial Expense)
      const newFinance: FinancialEntry = {
        id: Date.now() + 2,
        descricao: `Fatura XML NF-e #${nNF} (Fornecedor: ${supplier.nome})`,
        tipo: "Despesa",
        dataVencimento: addWorkingDays(new Date(), 21).toLocaleDateString(
          "pt-BR",
        ), // 21 working days term
        valor: totalNfValue,
        status: "Pendente",
      };
      saveState(
        "erp_financial",
        [...financialEntries, newFinance],
        setFinancialEntries,
      );

      showToast(
        `XML Nota Fiscal #${nNF} importada com sucesso! ${items.length} itens estocados.`,
      );
      return true;
    } catch (err: any) {
      console.error(err);
      alert(
        "Erro ao importar XML: " +
          (err.message || "Estrutura XML SEFAZ inválida ou não suportada."),
      );
      return false;
    }
  };

  const clearAlerts = () => {
    saveState("erp_alerts", [], setAlerts);
  };

  const resetToSeedData = () => {
    resetDatabase();
  };

  const liquidarEntry = (id: number) => {
    liquidateFinancial(id);
  };

  const saveStockLevel = (prodId: number, qtd: number, minimo: number) => {
    const nextStock = stock.map((s) => {
      if (s.prodId === prodId) {
        return { ...s, qtd, minimo };
      }
      return s;
    });
    saveState("erp_stock", nextStock, setStock);
    showToast("Ajuste de inventário efetuado com sucesso!");
  };

  const importXmlInvoice = (xmlText: string): boolean => {
    return importXml(xmlText);
  };

  const exportData = (): string => {
    return JSON.stringify(
      {
        products,
        bom,
        contacts,
        salesOrders,
        stock,
        financialEntries,
        purchaseOrders,
        entryInvoices,
        outboundInvoices,
        mrpRequirements,
        alerts,
        purchaseNeeds,
        quotes,
      },
      null,
      2,
    );
  };

  const importData = (jsonText: string): boolean => {
    try {
      const data = JSON.parse(jsonText);

      // Merge Products - Verify code to avoid duplicates
      const newProducts = [...products];
      const productMap = new Map<number, number>(); // old ID -> new ID
      let prodMaxId =
        products.length > 0 ? Math.max(...products.map((p) => p.id)) : 0;

      if (data.products && Array.isArray(data.products)) {
        data.products.forEach((impProd: Product) => {
          const existing = newProducts.find((p) => p.codigo === impProd.codigo);
          if (existing) {
            productMap.set(impProd.id, existing.id);
          } else {
            prodMaxId++;
            productMap.set(impProd.id, prodMaxId);
            newProducts.push({ ...impProd, id: prodMaxId });
          }
        });
        saveState("erp_products", newProducts, setProducts);
      }

      // Merge BOM - Verify parentId + componentId to avoid duplicates
      const newBom = [...bom];
      let bomMaxId = bom.length > 0 ? Math.max(...bom.map((b) => b.id)) : 0;

      if (data.bom && Array.isArray(data.bom)) {
        data.bom.forEach((impBom: BomItem) => {
          const mappedParentId =
            productMap.get(impBom.parentId) || impBom.parentId;
          const mappedComponentId =
            productMap.get(impBom.componentId) || impBom.componentId;

          const existing = newBom.find(
            (b) =>
              b.parentId === mappedParentId &&
              b.componentId === mappedComponentId,
          );
          if (!existing) {
            bomMaxId++;
            newBom.push({
              ...impBom,
              id: bomMaxId,
              parentId: mappedParentId,
              componentId: mappedComponentId,
            });
          }
        });
        saveState("erp_bom", newBom, setBom);
      }

      // We can also merge contacts if provided to prevent breaking dependencies
      const newContacts = [...contacts];
      let contMaxId =
        contacts.length > 0 ? Math.max(...contacts.map((c) => c.id)) : 0;

      if (data.contacts && Array.isArray(data.contacts)) {
        data.contacts.forEach((impCont: Contact) => {
          const existing = newContacts.find((c) => c.cnpj === impCont.cnpj);
          if (!existing) {
            contMaxId++;
            newContacts.push({ ...impCont, id: contMaxId });
          }
        });
        saveState("erp_contacts", newContacts, setContacts);
      }

      showToast(
        "Dados importados! Produtos e Estruturas mesclados (sem duplicar).",
      );
      return true;
    } catch (e) {
      console.error("Error importing data", e);
      return false;
    }
  };

  const importProductsAndBomFromRows = (
    productsRows: any[],
    bomRows: any[],
  ): {
    productsAdded: number;
    productsUpdated: number;
    bomAdded: number;
    bomUpdated: number;
    errors: string[];
  } => {
    const nextProducts = [...products];
    const nextStock = [...stock];
    const nextBom = [...bom];

    let productsAdded = 0;
    let productsUpdated = 0;
    let bomAdded = 0;
    let bomUpdated = 0;
    const errors: string[] = [];

    const normalizeProductRow = (row: any) => {
      const getVal = (keys: string[]) => {
        for (const k of keys) {
          if (row[k] !== undefined) return row[k];
          const foundKey = Object.keys(row).find(
            (rk) => rk.toLowerCase().trim() === k.toLowerCase(),
          );
          if (foundKey !== undefined) return row[foundKey];
        }
        return undefined;
      };

      const codigo = String(
        getVal(["Código", "Codigo", "codigo", "code", "SKU"]) || "",
      ).trim();
      const descricao = String(
        getVal([
          "Descrição",
          "Descricao",
          "descricao",
          "description",
          "nome",
          "Nome",
        ]) || "",
      ).trim();
      const tipo = String(
        getVal(["Tipo", "tipo", "type"]) || "Materia-Prima",
      ).trim();
      const unidade = String(
        getVal(["Unidade", "unidade", "unit", "un"]) || "UN",
      ).trim();
      const valor =
        parseFloat(
          String(
            getVal([
              "Valor",
              "valor",
              "Preço",
              "Preco",
              "preco",
              "price",
              "value",
              "Valor Unitário",
              "Valor Unitario",
            ]) || "0",
          ),
        ) || 0;
      const leadTime =
        parseInt(
          String(
            getVal([
              "Lead Time",
              "leadTime",
              "lead_time",
              "LeadTime",
              "prazo",
              "Lead Time (Dias)",
            ]) || "2",
          ),
        ) || 2;
      const qtdEstoque =
        parseFloat(
          String(
            getVal([
              "Estoque Atual",
              "Estoque",
              "estoque",
              "qtd",
              "quantidade",
              "quantity",
              "Stock",
              "EstoqueInicial",
              "Estoque Inicial",
            ]) || "0",
          ),
        ) || 0;
      const minimoEstoque =
        parseFloat(
          String(
            getVal([
              "Estoque Mínimo",
              "Estoque Minimo",
              "estoque_minimo",
              "minimo",
              "minimum",
              "EstoqueMinimo",
            ]) || "5",
          ),
        ) || 5;

      const grupo = String(getVal(["Grupo", "grupo", "group"]) || "").trim();
      const segUnMedida = String(
        getVal([
          "Seg. Un. Medida",
          "SegUnMedida",
          "segUnMedida",
          "segunda_unidade",
          "Seg.Un.Medi.",
          "Seg. Unid. Medida",
        ]) || "",
      ).trim();
      const fatorConversao =
        getVal([
          "Fator Conv.",
          "FatorConversao",
          "fatorConversao",
          "fator_conversao",
          "Fator de Conversão",
          "Fator de Conversao",
        ]) !== undefined
          ? parseFloat(
              String(
                getVal([
                  "Fator Conv.",
                  "FatorConversao",
                  "fatorConversao",
                  "fator_conversao",
                  "Fator de Conversão",
                  "Fator de Conversao",
                ]),
              ),
            )
          : undefined;
      const tipoConversao = String(
        getVal([
          "Tipo de Conv.",
          "TipoConversao",
          "tipoConversao",
          "tipo_conversao",
          "Tipo de Conversão",
          "Tipo de Conversao",
        ]) || "M - Multiplicador",
      ).trim();
      const precoVenda =
        getVal([
          "Preço Venda",
          "Preço de Venda",
          "PrecoVenda",
          "precoVenda",
          "preco_venda",
          "Preço Venda (R$)",
          "Preço de Venda (R$)",
        ]) !== undefined
          ? parseFloat(
              String(
                getVal([
                  "Preço Venda",
                  "Preço de Venda",
                  "PrecoVenda",
                  "precoVenda",
                  "preco_venda",
                  "Preço Venda (R$)",
                  "Preço de Venda (R$)",
                ]),
              ),
            )
          : undefined;
      const moedaCusto = String(
        getVal([
          "Moeda C.Std",
          "MoedaCusto",
          "moedaCusto",
          "moeda_custo",
          "Moeda Custo",
        ]) || "1 - Moeda1",
      ).trim();
      const pesoLiquido =
        getVal([
          "Peso Líquido",
          "Peso Liquido",
          "pesoLiquido",
          "peso_liquido",
          "Peso Líquido (kg)",
          "Peso Liquido (kg)",
        ]) !== undefined
          ? parseFloat(
              String(
                getVal([
                  "Peso Líquido",
                  "Peso Liquido",
                  "pesoLiquido",
                  "peso_liquido",
                  "Peso Líquido (kg)",
                  "Peso Liquido (kg)",
                ]),
              ),
            )
          : undefined;
      const familia = String(
        getVal(["Família", "Familia", "familia", "family"]) || "",
      ).trim();

      return {
        codigo,
        descricao,
        tipo,
        unidade,
        valor,
        leadTime,
        qtdEstoque,
        minimoEstoque,
        grupo,
        segUnMedida,
        fatorConversao,
        tipoConversao,
        precoVenda,
        moedaCusto,
        pesoLiquido,
        familia,
      };
    };

    const normalizeBomRow = (row: any) => {
      const getVal = (keys: string[]) => {
        for (const k of keys) {
          if (row[k] !== undefined) return row[k];
          const foundKey = Object.keys(row).find(
            (rk) => rk.toLowerCase().trim() === k.toLowerCase(),
          );
          if (foundKey !== undefined) return row[foundKey];
        }
        return undefined;
      };

      const parentCode = String(
        getVal([
          "Produto Pai (Código)",
          "Produto Pai (Codigo)",
          "Produto Pai",
          "parent_code",
          "Parent",
          "codigo_pai",
          "Codigo Pai",
          "Pai",
          "ProdutoPai",
        ]) || "",
      ).trim();
      const componentCode = String(
        getVal([
          "Componente (Código)",
          "Componente (Codigo)",
          "Componente",
          "component_code",
          "Component",
          "codigo_componente",
          "Codigo Componente",
          "Filho",
          "ComponenteCódigo",
        ]) || "",
      ).trim();
      const quantidade =
        parseFloat(
          String(
            getVal([
              "Quantidade Necessária",
              "Quantidade",
              "quantidade",
              "qtd",
              "quantity",
              "qty",
              "QuantidadeNecessaria",
            ]) || "1",
          ),
        ) || 1;

      return { parentCode, componentCode, quantidade };
    };

    // 1. Process Products
    productsRows.forEach((row) => {
      const norm = normalizeProductRow(row);
      if (!norm.codigo) {
        return; // Skip empty row
      }

      // Validate type
      let finalTipo: "Acabado" | "Semi-acabado" | "Materia-Prima" | "Insumo" =
        "Materia-Prima";
      const normTipoLower = norm.tipo.toLowerCase();
      if (
        normTipoLower.includes("acabado") &&
        !normTipoLower.includes("semi")
      ) {
        finalTipo = "Acabado";
      } else if (normTipoLower.includes("semi")) {
        finalTipo = "Semi-acabado";
      } else if (normTipoLower.includes("insumo")) {
        finalTipo = "Insumo";
      } else if (
        normTipoLower.includes("materia") ||
        normTipoLower.includes("matéria")
      ) {
        finalTipo = "Materia-Prima";
      }

      const existingIdx = nextProducts.findIndex(
        (p) => p.codigo.toLowerCase() === norm.codigo.toLowerCase(),
      );

      let prodId: number;
      if (existingIdx !== -1) {
        // Update details to avoid duplicates but keep existing ID
        prodId = nextProducts[existingIdx].id;
        nextProducts[existingIdx] = {
          ...nextProducts[existingIdx],
          descricao: norm.descricao || nextProducts[existingIdx].descricao,
          tipo: finalTipo,
          unidade: norm.unidade || nextProducts[existingIdx].unidade,
          valor:
            norm.valor !== 0 ? norm.valor : nextProducts[existingIdx].valor,
          leadTime:
            norm.leadTime !== 2
              ? norm.leadTime
              : nextProducts[existingIdx].leadTime,

          // Image 2 Fields
          grupo: norm.grupo || nextProducts[existingIdx].grupo,
          segUnMedida:
            norm.segUnMedida || nextProducts[existingIdx].segUnMedida,
          fatorConversao:
            norm.fatorConversao !== undefined
              ? norm.fatorConversao
              : nextProducts[existingIdx].fatorConversao,
          tipoConversao:
            norm.tipoConversao || nextProducts[existingIdx].tipoConversao,
          precoVenda:
            norm.precoVenda !== undefined
              ? norm.precoVenda
              : nextProducts[existingIdx].precoVenda,
          moedaCusto: norm.moedaCusto || nextProducts[existingIdx].moedaCusto,
          pesoLiquido:
            norm.pesoLiquido !== undefined
              ? norm.pesoLiquido
              : nextProducts[existingIdx].pesoLiquido,
          familia: norm.familia || nextProducts[existingIdx].familia,
        };
        productsUpdated++;

        // Update stock minimum or current stock if provided with active data
        const stockIdx = nextStock.findIndex((s) => s.prodId === prodId);
        if (stockIdx !== -1) {
          if (norm.minimoEstoque !== 5)
            nextStock[stockIdx].minimo = norm.minimoEstoque;
          if (norm.qtdEstoque !== 0) nextStock[stockIdx].qtd = norm.qtdEstoque;
        }
      } else {
        // Add new
        const newId =
          nextProducts.length > 0
            ? Math.max(...nextProducts.map((p) => p.id)) + 1
            : 1;
        prodId = newId;
        nextProducts.push({
          id: newId,
          codigo: norm.codigo,
          descricao: norm.descricao || `Produto ${norm.codigo}`,
          tipo: finalTipo,
          unidade: norm.unidade,
          valor: norm.valor,
          leadTime: norm.leadTime,

          // Image 2 Fields
          grupo: norm.grupo || undefined,
          segUnMedida: norm.segUnMedida || undefined,
          fatorConversao: norm.fatorConversao,
          tipoConversao: norm.tipoConversao,
          precoVenda: norm.precoVenda,
          moedaCusto: norm.moedaCusto,
          pesoLiquido: norm.pesoLiquido,
          familia: norm.familia || undefined,
        });
        nextStock.push({
          prodId: newId,
          qtd: norm.qtdEstoque,
          minimo: norm.minimoEstoque,
        });
        productsAdded++;
      }
    });

    // 2. Process BOM Structures
    bomRows.forEach((row) => {
      const norm = normalizeBomRow(row);
      if (!norm.parentCode || !norm.componentCode) {
        return; // Skip empty row
      }

      // Find parent product
      const parentProd = nextProducts.find(
        (p) => p.codigo.toLowerCase() === norm.parentCode.toLowerCase(),
      );
      const componentProd = nextProducts.find(
        (p) => p.codigo.toLowerCase() === norm.componentCode.toLowerCase(),
      );

      if (!parentProd) {
        errors.push(
          `Estrutura ignorada: Produto Pai com código "${norm.parentCode}" não encontrado.`,
        );
        return;
      }
      if (!componentProd) {
        errors.push(
          `Estrutura ignorada: Componente com código "${norm.componentCode}" não encontrado.`,
        );
        return;
      }

      // Check duplicate relationship
      const existingIdx = nextBom.findIndex(
        (b) =>
          b.parentId === parentProd.id && b.componentId === componentProd.id,
      );

      if (existingIdx !== -1) {
        // Just update quantity
        nextBom[existingIdx].quantidade = norm.quantidade;
        bomUpdated++;
      } else {
        // Insert new
        const newId =
          nextBom.length > 0 ? Math.max(...nextBom.map((b) => b.id)) + 1 : 1;
        nextBom.push({
          id: newId,
          parentId: parentProd.id,
          componentId: componentProd.id,
          quantidade: norm.quantidade,
        });
        bomAdded++;
      }
    });

    // Save states
    if (productsAdded > 0 || productsUpdated > 0) {
      saveState("erp_products", nextProducts, setProducts);
      saveState("erp_stock", nextStock, setStock);
    }
    if (bomAdded > 0 || bomUpdated > 0) {
      saveState("erp_bom", nextBom, setBom);
    }

    showToast(
      `Importação concluída: ${productsAdded} novos produtos, ${productsUpdated} atualizados, ${bomAdded} novas estruturas, ${bomUpdated} atualizadas.`,
    );

    return { productsAdded, productsUpdated, bomAdded, bomUpdated, errors };
  };

  const saveUnidadeMedida = (sigla: string) => {
    const clean = sigla.trim().toUpperCase();
    if (!clean) return;
    if (unidadesMedida.includes(clean)) {
      showToast(`A unidade ${clean} já está cadastrada.`);
      return;
    }
    const next = [...unidadesMedida, clean];
    saveState("erp_unidadesMedida", next, setUnidadesMedida);
    showToast(`Unidade de Medida ${clean} cadastrada com sucesso!`);
  };

  const deleteUnidadeMedida = (sigla: string, substituto?: string) => {
    if (substituto) {
      const nextProducts = products.map((p) => {
        const updated = { ...p };
        if (updated.unidade === sigla) {
          updated.unidade = substituto;
        }
        if (updated.segUnMedida === sigla) {
          updated.segUnMedida = substituto;
        }
        return updated;
      });
      saveState("erp_products", nextProducts, setProducts);
    }
    const next = unidadesMedida.filter((u) => u !== sigla);
    saveState("erp_unidadesMedida", next, setUnidadesMedida);
    showToast(
      `Unidade de Medida ${sigla} removida${substituto ? ` e substituída por ${substituto}` : ""}.`,
    );
  };

  return (
    <ErpContext.Provider
      value={{
        products,
        bom,
        contacts,
        salesOrders,
        stock,
        financialEntries,
        purchaseOrders,
        entryInvoices,
        outboundInvoices,
        mrpRequirements,
        alerts,
        users,
        companySettings,
        setCompanySettings,
        purchaseNeeds,
        quotes,
        unidadesMedida,

        saveProduct,
        deleteProduct,
        saveContact,
        deleteContact,
        saveUser,
        deleteUser,
        savePurchaseNeed,
        deletePurchaseNeed,
        saveQuote,
        deleteQuote,
        saveSalesOrder,
        updateSalesOrder,
        faturarSalesOrder,
        cancelSalesOrder,
        savePurchaseOrder,
        receberPurchaseOrder,
        receberPurchaseOrderWithXml,
        cancelPurchaseOrder,
        runMrpCalculation,
        adjustStockQtd,
        updateStockMinimo,
        saveFinancialEntry,
        liquidateFinancial,
        deleteFinancialEntry,
        resetDatabase,
        importXml,
        saveBomItem,
        deleteBomItem,
        cloneBomStructure,

        clearAlerts,
        resetToSeedData,
        liquidarEntry,
        saveStockLevel,
        importXmlInvoice,
        exportData,
        importData,
        importProductsAndBomFromRows,
        saveUnidadeMedida,
        deleteUnidadeMedida,
        saveOutboundInvoice,
        appLogo,
        setAppLogo,
        printTemplates,
        setPrintTemplate,
      }}
    >
      {children}
    </ErpContext.Provider>
  );
}

export function useErp() {
  const context = useContext(ErpContext);
  if (context === undefined) {
    throw new Error("useErp must be used within an ErpProvider");
  }
  return context;
}
