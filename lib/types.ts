export interface Product {
  id: number;
  codigo: string;
  descricao: string;
  tipo: 'Acabado' | 'Semi-acabado' | 'Materia-Prima' | 'Insumo';
  unidade: string;
  valor: number;
  leadTime: number; // in business days
  
  // Fields from Image 2
  grupo?: string;
  segUnMedida?: string;
  fatorConversao?: number;
  tipoConversao?: string;
  precoVenda?: number;
  moedaCusto?: string;
  pesoLiquido?: number;
  familia?: string;
  needsReview?: boolean;
  codigoFornecedor?: string;
  codigoFornecedor2?: string;
  codigoFornecedor3?: string;
  codigoFornecedor4?: string;
}

export interface BomItem {
  id: number;
  parentId: number; // Product.id of finished/semi-finished
  componentId: number; // Product.id of required raw material/component
  quantidade: number;
}

export interface Contact {
  id: number;
  nome: string;
  tipo: 'Cliente' | 'Fornecedor';
  cnpj: string;
  email: string;
  telefone: string;
  cidade: string;
  uf: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cep?: string;
  formasPagamento?: string;
  observacoes?: string;
  inscricaoEstadual?: string;
}

export interface SalesOrderItem {
  prodId: number;
  qtd: number;
  valorUnitario: number;
}

export interface SalesOrder {
  id: number;
  clienteId: number;
  dataEmissao: string;
  dataEntrega: string;
  itens: SalesOrderItem[];
  valorTotal: number;
  status: 'Aberto' | 'Faturado' | 'Cancelado';
}

export interface Stock {
  prodId: number;
  qtd: number;
  minimo: number;
}

export interface FinancialEntry {
  id: number;
  descricao: string;
  tipo: 'Receita' | 'Despesa';
  data?: string;
  dataVencimento: string;
  valor: number;
  status: 'Pago' | 'Pendente';
  contatoId?: number;
}

export interface PurchaseOrderItem {
  prodId: number;
  qtd: number;
  valorUnitario: number;
}

export interface PurchaseOrder {
  id: number;
  fornecedorId: number;
  dataEmissao: string;
  dataEntrega: string;
  itens: PurchaseOrderItem[];
  valorTotal: number;
  status: 'Orçar' | 'Aberto' | 'Recebido' | 'Cancelado';
  pdfName?: string;
  pdfBase64?: string;
}

export interface EntryInvoice {
  id: number;
  numero: string;
  chave: string;
  fornecedorId: number;
  dataEmissao: string;
  valorTotal: number;
  itens: { prodId: number; qtd: number; valorUnitario: number }[];
  xmlOriginal?: string;
}

export interface OutboundInvoice {
  id: number;
  numero: string;
  chave: string;
  clienteId: number;
  dataEmissao: string;
  pedidoVendaId: number;
  valorTotal: number;
  itens: { prodId: number; qtd: number; valorUnitario: number }[];
  xmlOriginal?: string;
}

export interface MrpRequirement {
  id: number;
  prodId: number;
  qtdNecessaria: number;
  dataNecessidade: string;
  origem: string; // e.g., "Pedido Venda #101"
  status: 'Pendente' | 'Comprado' | 'Produzido';
}

export interface PurchaseNeed {
  id: number;
  dataCriacao: string;
  itens: { prodId: number; qtd: number }[];
  status: 'Pendente' | 'Em Cotação' | 'Cotado';
  nomeReferencia?: string;
}

export interface Quote {
  id: number;
  purchaseNeedId: number;
  fornecedorId: number;
  dataCotacao: string;
  valorTotal: number;
  arquivoPdf?: string; // Nome do arquivo ou base64 simulado
  itens: { prodId: number; qtd: number; valorUnitario: number }[];
  status: 'Aprovado' | 'Rejeitado' | 'Aguardando';
}

export interface User {
  id: number;
  username: string;
  password?: string;
  isAdmin?: boolean;
  permissions?: string[];
}

export interface Alert {
  id: number;
  tipo: 'warning' | 'info' | 'success';
  mensagem: string;
  data: string;
}

export interface CompanySettings {
  name: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
}
