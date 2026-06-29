"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useErp } from "@/hooks/use-erp";
import {
  FolderTree,
  Plus,
  Trash2,
  Boxes,
  X,
  FileEdit,
  Folder,
  Search,
} from "lucide-react";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Product, BomItem } from "@/lib/types";

interface TreeNode {
  product: Product;
  quantidade: number;
  bomId: number | null;
  children: TreeNode[];
}

const buildTree = (
  productId: number,
  qty: number,
  currentBomId: number | null,
  allProducts: Product[],
  allBom: BomItem[],
  visited: Set<number> = new Set(),
): TreeNode | null => {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return null;

  // Prevent infinite loops in BOM
  if (visited.has(productId)) {
    return { product, quantidade: qty, bomId: currentBomId, children: [] };
  }

  const newVisited = new Set(visited);
  newVisited.add(productId);

  const childrenBom = allBom.filter((b) => b.parentId === productId);
  const children = childrenBom
    .map((b) =>
      buildTree(
        b.componentId,
        b.quantidade,
        b.id,
        allProducts,
        allBom,
        newVisited,
      ),
    )
    .filter((n): n is TreeNode => n !== null);

  return {
    product,
    quantidade: qty,
    bomId: currentBomId,
    children,
  };
};

const BomTreeNode = ({
  node,
  level = 0,
  selectedBomId,
  selectedProductId,
  onSelect,
}: {
  node: TreeNode;
  level?: number;
  selectedBomId: number | null;
  selectedProductId: number | null;
  onSelect: (bomId: number | null, productId: number) => void;
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  // A node is selected if it's the root and we selected root (bomId === null and productId matches)
  // or if it's a child and bomId matches
  const isSelected =
    (node.bomId !== null && selectedBomId === node.bomId) ||
    (node.bomId === null &&
      selectedBomId === null &&
      selectedProductId === node.product.id);

  return (
    <div>
      <div
        className={`flex items-center space-x-2 py-1 px-2 cursor-pointer select-none transition-colors border-l-2 ${
          isSelected
            ? "bg-blue-600/90 text-white border-blue-400"
            : "text-gray-300 hover:bg-gray-800/50 border-transparent"
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.bomId, node.product.id);
        }}
      >
        {/* Expand/Collapse Icon */}
        <div
          className="w-3.5 h-3.5 flex items-center justify-center border border-gray-500 bg-gray-100 text-gray-800 text-[10px] cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
        >
          {hasChildren ? (expanded ? "-" : "+") : ""}
        </div>

        {/* Folder Icon */}
        <Folder
          className={`w-4 h-4 flex-shrink-0 fill-current ${isSelected ? "text-blue-200" : "text-yellow-500"}`}
        />

        <span className="font-mono text-xs font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {node.product.codigo} - {node.product.descricao}
          {node.bomId !== null && (
            <span className={isSelected ? "text-blue-100" : "text-gray-400"}>
              {" "}
              / QTDE: {Number(node.quantidade).toFixed(6)}
            </span>
          )}
        </span>
      </div>

      {expanded && hasChildren && (
        <div>
          {node.children.map((child, idx) => (
            <BomTreeNode
              key={`${child.bomId}-${idx}`}
              node={child}
              level={level + 1}
              selectedBomId={selectedBomId}
              selectedProductId={selectedProductId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function BomView() {
  const { products, bom, saveBomItem, deleteBomItem, saveProduct, unidadesMedida, cloneBomStructure } = useErp();

  const [searchTerm, setSearchTerm] = useState("");

  // Selected parent finished/semi-finished SKU to inspect in the left menu
  const parentProducts = useMemo(() => {
    return products.filter(
      (p) =>
        (p.tipo === "Acabado" || p.tipo === "Semi-acabado") &&
        (p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.descricao.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  }, [products, searchTerm]);

  const [selectedParentId, setSelectedParentId] = useState<number>(
    parentProducts.length > 0 ? parentProducts[0].id : 0,
  );

  // Tree selection state
  const [selectedNodeBomId, setSelectedNodeBomId] = useState<number | null>(
    null,
  );
  const [selectedNodeProductId, setSelectedNodeProductId] = useState<
    number | null
  >(selectedParentId);

  // Sync tree selection when root changes on render
  const [prevSelectedParentId, setPrevSelectedParentId] = useState(selectedParentId);
  if (selectedParentId !== prevSelectedParentId) {
    setPrevSelectedParentId(selectedParentId);
    setSelectedNodeBomId(null);
    setSelectedNodeProductId(selectedParentId);
  }

  // Modal State for adding a component
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<number>(0);
  const [quantidade, setQuantidade] = useState("");

  // Modal State for New Structure (Product)
  const [isNewStructureModalOpen, setIsNewStructureModalOpen] = useState(false);
  const [newStructSearchQuery, setNewStructSearchQuery] = useState("");
  const [newStructSelectedProductId, setNewStructSelectedProductId] = useState<number | null>(null);
  const [newStructCode, setNewStructCode] = useState("");
  const [newStructDesc, setNewStructDesc] = useState("");
  const [newStructType, setNewStructType] = useState<
    "Acabado" | "Semi-acabado"
  >("Acabado");
  const [newStructUnidade, setNewStructUnidade] = useState("UN");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newStructSimilarProductId, setNewStructSimilarProductId] = useState<number | null>(null);
  const [newStructSimilarSearchQuery, setNewStructSimilarSearchQuery] = useState("");
  const [showSimilarSuggestions, setShowSimilarSuggestions] = useState(false);

  const productsWithStructure = useMemo(() => {
    const parentIdsWithBom = new Set(bom.map((b) => b.parentId));
    return products.filter((p) => parentIdsWithBom.has(p.id));
  }, [products, bom]);

  const availableUnits = useMemo(() => {
    const list = unidadesMedida || [];
    const merged = [...list];
    if (newStructUnidade && !merged.includes(newStructUnidade)) {
      merged.push(newStructUnidade);
    }
    return merged.length > 0 ? merged : ['UN'];
  }, [unidadesMedida, newStructUnidade]);

  const handleSaveNewStructure = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStructSelectedProductId) {
      const existingProduct = products.find(
        (p) => p.id === newStructSelectedProductId,
      );
      if (existingProduct) {
        saveProduct({
          ...existingProduct,
          tipo: newStructType,
        });

        if (newStructSimilarProductId) {
          cloneBomStructure(newStructSimilarProductId, newStructSelectedProductId);
        }

        setIsNewStructureModalOpen(false);
        setNewStructSearchQuery("");
        setNewStructSelectedProductId(null);
        setNewStructCode("");
        setNewStructDesc("");
        setNewStructType("Acabado");
        setNewStructUnidade("UN");
        setNewStructSimilarProductId(null);
        setNewStructSimilarSearchQuery("");
        setShowSimilarSuggestions(false);
        setSelectedParentId(newStructSelectedProductId);
      }
    } else {
      if (!newStructCode || !newStructDesc) {
        alert("Preencha o código e a descrição da nova estrutura.");
        return;
      }
      const codeExists = products.some(
        (p) => p.codigo.trim().toUpperCase() === newStructCode.trim().toUpperCase()
      );
      if (codeExists) {
        alert("Já existe um produto com este código. Selecione-o na lista ou escolha outro código.");
        return;
      }
      const newId =
        products.length > 0
          ? Math.max(...products.map((item) => item.id)) + 1
          : 1;
      saveProduct({
        id: 0,
        codigo: newStructCode.trim().toUpperCase(),
        descricao: newStructDesc.trim(),
        tipo: newStructType,
        unidade: newStructUnidade,
        valor: 0,
        leadTime: 0,
      });

      if (newStructSimilarProductId) {
        cloneBomStructure(newStructSimilarProductId, newId);
      }

      setIsNewStructureModalOpen(false);
      setNewStructSearchQuery("");
      setNewStructSelectedProductId(null);
      setNewStructCode("");
      setNewStructDesc("");
      setNewStructType("Acabado");
      setNewStructUnidade("UN");
      setNewStructSimilarProductId(null);
      setNewStructSimilarSearchQuery("");
      setShowSimilarSuggestions(false);
      setSelectedParentId(newId);
    }
  };

  const handleOpenNewStructureModal = () => {
    setNewStructSearchQuery("");
    setNewStructSelectedProductId(null);
    setNewStructCode("");
    setNewStructDesc("");
    setNewStructType("Acabado");
    setNewStructUnidade("UN");
    setNewStructSimilarProductId(null);
    setNewStructSimilarSearchQuery("");
    setShowSuggestions(false);
    setShowSimilarSuggestions(false);
    setIsNewStructureModalOpen(true);
  };

  // Available components to add to the currently selected node
  const availableComponents = useMemo(() => {
    if (!selectedNodeProductId) return [];
    const alreadyAddedIds = bom
      .filter((b) => b.parentId === selectedNodeProductId)
      .map((b) => b.componentId);
    return products.filter(
      (p) => p.id !== selectedNodeProductId && !alreadyAddedIds.includes(p.id),
    );
  }, [products, selectedNodeProductId, bom]);

  const handleOpenAddModal = () => {
    if (availableComponents.length > 0) {
      setSelectedComponentId(availableComponents[0].id);
    } else {
      setSelectedComponentId(0);
    }
    setQuantidade("");
    setIsModalOpen(true);
  };

  const handleSaveBomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNodeProductId || !selectedComponentId || !quantidade) {
      alert("Preencha os dados de engenharia.");
      return;
    }

    saveBomItem({
      parentId: selectedNodeProductId,
      componentId: selectedComponentId,
      quantidade: parseFloat(quantidade),
    });

    setIsModalOpen(false);
  };

  const handleDeleteBomItem = () => {
    if (
      selectedNodeBomId &&
      confirm("Deseja retirar este componente da estrutura?")
    ) {
      deleteBomItem(selectedNodeBomId);
      // Reset selection to root
      setSelectedNodeBomId(null);
      setSelectedNodeProductId(selectedParentId);
    }
  };

  const parentProductDetail = useMemo(() => {
    return products.find((p) => p.id === selectedParentId);
  }, [products, selectedParentId]);

  const rootNode = useMemo(() => {
    if (!selectedParentId) return null;
    return buildTree(selectedParentId, 1, null, products, bom);
  }, [selectedParentId, products, bom]);

  // Can we add components? (Only to Acabado/Semi-acabado)
  const canAddComponent = useMemo(() => {
    if (!selectedNodeProductId) return false;
    const prod = products.find((p) => p.id === selectedNodeProductId);
    return prod ? prod.tipo !== "Materia-Prima" : false;
  }, [selectedNodeProductId, products]);

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-4 gap-6 font-sans animate-fade-in h-full pb-8"
      id="bom-view"
    >
      {/* Left Selector: Choose SKU to inspect */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-5 space-y-4 lg:col-span-1 flex flex-col h-[calc(100vh-140px)]">
        <h3 className="font-bold text-white text-sm flex items-center space-x-2 pb-2 border-b border-[#1f293d]">
          <FolderTree className="w-4.5 h-4.5 text-blue-400" />
          <span>Estruturas (BOM)</span>
        </h3>
        <p className="text-gray-400 text-[11px] leading-relaxed">
          Selecione um Produto Acabado ou Semi-Acabado para gerenciar sua lista
          técnica de materiais em árvore.
        </p>

        <div className="space-y-1.5 pt-2 flex-1 overflow-hidden flex flex-col">
          <div className="flex flex-col space-y-3 mb-3">
            <div className="flex items-center justify-between">
              <label className="block text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                Produtos com Estrutura
              </label>
              <button
                onClick={handleOpenNewStructureModal}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-2.5 rounded flex items-center space-x-1 transition-colors"
                title="Criar nova estrutura"
              >
                <Plus className="w-3 h-3" />
                <span>Nova</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar estruturas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5 overflow-y-auto pr-1 flex-1 scrollbar-thin">
            {parentProducts.map((p) => {
              const isSelected = p.id === selectedParentId;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedParentId(p.id)}
                  className={`w-full text-left p-3 rounded-lg text-xs font-semibold flex flex-col transition-all border ${
                    isSelected
                      ? "bg-blue-600/10 border-blue-500/50 text-white shadow-md"
                      : "bg-[#0b0f17] border-[#1f293d] text-gray-400 hover:text-white hover:bg-gray-800/30"
                  }`}
                >
                  <span className="font-mono font-bold text-[10px] text-blue-400 uppercase">
                    {p.codigo}
                  </span>
                  <span className="text-white mt-0.5 truncate">
                    {p.descricao}
                  </span>
                  <span className="text-[9px] text-gray-500 mt-1 uppercase font-mono">
                    {p.tipo}
                  </span>
                </button>
              );
            })}
            {parentProducts.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-xs">
                Nenhum produto composto cadastrado.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Center & Right: Exploded tree details & Component list */}
      <div className="lg:col-span-3 h-[calc(100vh-140px)] flex flex-col">
        {parentProductDetail && rootNode ? (
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl shadow-lg flex flex-col h-full overflow-hidden">
            {/* Header Properties */}
            <div className="p-4 border-b border-[#1f293d] grid grid-cols-2 md:grid-cols-5 gap-4 text-xs bg-[#151d2e]">
              <div className="flex flex-col space-y-1 md:col-span-2">
                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                  Código
                </span>
                <div className="bg-[#0b0f17] border border-[#1f293d] rounded px-3 py-1.5 text-white font-mono truncate shadow-inner">
                  {parentProductDetail.codigo}
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                  Unidade
                </span>
                <div className="bg-[#0b0f17] border border-[#1f293d] rounded px-3 py-1.5 text-gray-300 font-mono text-center shadow-inner">
                  {parentProductDetail.unidade}
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                  Revisão
                </span>
                <div className="bg-[#0b0f17] border border-[#1f293d] rounded px-3 py-1.5 text-gray-300 font-mono text-center shadow-inner">
                  001
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-gray-400 font-bold text-[10px] uppercase tracking-wider">
                  Quantidade Base
                </span>
                <div className="bg-[#0b0f17] border border-[#1f293d] rounded px-3 py-1.5 text-gray-300 font-mono text-right shadow-inner">
                  1.00
                </div>
              </div>
            </div>

            {/* Toolbar Actions */}
            <div className="px-4 py-2 border-b border-[#1f293d] bg-[#0d131f] flex space-x-3 items-center">
              <button
                onClick={handleOpenAddModal}
                disabled={!canAddComponent}
                className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 disabled:opacity-30 disabled:hover:bg-blue-600/20 border border-blue-500/30 px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 transition-colors"
                title={
                  canAddComponent
                    ? "Adicionar componente ao item selecionado"
                    : "Não é possível adicionar componentes a Matéria-Prima"
                }
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Sub-item</span>
              </button>
              <button
                onClick={handleDeleteBomItem}
                disabled={!selectedNodeBomId}
                className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 disabled:opacity-30 disabled:hover:bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1.5 transition-colors"
                title="Remover componente selecionado"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remover</span>
              </button>
            </div>

            {/* Tree View Canvas */}
            <div className="p-4 flex-1 overflow-y-auto bg-white/5 shadow-inner">
              <BomTreeNode
                node={rootNode}
                selectedBomId={selectedNodeBomId}
                selectedProductId={selectedNodeProductId}
                onSelect={(bomId, prodId) => {
                  setSelectedNodeBomId(bomId);
                  setSelectedNodeProductId(prodId);
                }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl shadow-lg flex flex-col h-full items-center justify-center text-gray-500 p-8 text-center space-y-4">
            <FolderTree className="w-12 h-12 text-gray-700" />
            <p className="text-sm">
              Selecione um produto no painel lateral para visualizar sua
              estrutura.
            </p>
          </div>
        )}
      </div>

      {/* Add Component to BOM Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-2xl overflow-visible shadow-2xl animate-scale-up">
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d] rounded-t-xl">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-blue-400" />
                <span>Vincular Componente</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveBomItem}
              className="p-5 space-y-4 text-xs"
            >
              <div className="p-3 bg-gray-800/50 rounded border border-[#1f293d] space-y-1">
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  Adicionando à estrutura de:
                </span>
                <div className="text-white font-mono font-medium truncate">
                  {products.find((p) => p.id === selectedNodeProductId)?.codigo}
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">
                  Insumo / Matéria-Prima
                </label>
                <SearchableSelect
                  options={[...availableComponents]
                    .sort((a, b) => a.descricao.localeCompare(b.descricao))
                    .map((p) => ({
                      id: p.id,
                      label: `[${p.codigo}] - ${p.descricao}`,
                      sublabel: `Unidade: ${p.unidade}`,
                    }))}
                  selectedValue={selectedComponentId}
                  onChange={(id) => setSelectedComponentId(id)}
                  placeholder="Selecione um insumo..."
                  noOptionsMessage="Nenhum insumo disponível para adicionar"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1">
                  Quantidade Necessária
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="Ex: 2.50"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={selectedComponentId === 0}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Structure Modal */}
      {isNewStructureModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsNewStructureModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-2xl overflow-visible shadow-2xl animate-scale-up">
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d] rounded-t-xl">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <FolderTree className="w-4 h-4 text-blue-400" />
                <span>Nova Estrutura (Produto)</span>
              </h3>
              <button
                onClick={() => setIsNewStructureModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSaveNewStructure}
              className="p-5 space-y-4 text-xs"
            >
              {/* Unified product selection / search */}
              <div className="relative">
                <label className="block text-gray-400 font-bold mb-1">
                  Buscar Produto Existente ou Digitar Novo
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Busque por código ou nome, ou digite o novo código..."
                    value={newStructSearchQuery}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewStructSearchQuery(val);
                      setNewStructSelectedProductId(null);
                      setNewStructCode(val.toUpperCase());
                      setShowSuggestions(true);
                    }}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors font-semibold"
                  />
                  {newStructSelectedProductId && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-blue-500/20 text-blue-400 font-bold text-[9px] px-1.5 py-0.5 rounded border border-blue-500/30">
                      Existente
                    </span>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 mt-1 bg-[#0f1523] border border-[#1f293d] rounded-lg max-h-96 overflow-y-auto z-10 shadow-2xl scrollbar-thin">
                    {products
                      .filter(
                        (p) =>
                          p.codigo.toLowerCase().includes(newStructSearchQuery.toLowerCase()) ||
                          p.descricao.toLowerCase().includes(newStructSearchQuery.toLowerCase())
                      )
                      .sort((a, b) => a.descricao.localeCompare(b.descricao))
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setNewStructSelectedProductId(p.id);
                            setNewStructCode(p.codigo);
                            setNewStructDesc(p.descricao);
                            setNewStructUnidade(p.unidade);
                            if (p.tipo === "Acabado" || p.tipo === "Semi-acabado") {
                              setNewStructType(p.tipo);
                            } else {
                              setNewStructType("Acabado");
                            }
                            setNewStructSearchQuery(`[${p.codigo}] - ${p.descricao}`);
                            setShowSuggestions(false);
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-blue-600/25 text-xs flex justify-between items-center border-b border-[#1f293d]/50"
                        >
                          <div>
                            <span className="font-mono text-blue-400 font-bold">[{p.codigo}]</span>{" "}
                            <span className="text-gray-200">{p.descricao}</span>
                          </div>
                          <span className="text-[9px] bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono uppercase">
                            {p.tipo}
                          </span>
                        </div>
                      ))}
                    {products.filter(
                      (p) =>
                        p.codigo.toLowerCase().includes(newStructSearchQuery.toLowerCase()) ||
                        p.descricao.toLowerCase().includes(newStructSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-3 text-center text-gray-500 italic">
                        Nenhum produto correspondente. Preencha as informações abaixo para cadastrar como novo.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form inputs for details */}
              <div className="space-y-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">
                    Código da Estrutura
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!newStructSelectedProductId}
                    value={newStructCode}
                    onChange={(e) => setNewStructCode(e.target.value.toUpperCase())}
                    placeholder="Ex: PA-001"
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1">
                    Descrição da Estrutura
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!newStructSelectedProductId}
                    value={newStructDesc}
                    onChange={(e) => setNewStructDesc(e.target.value)}
                    placeholder="Ex: Mesa de Escritório Premium"
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-bold mb-1">
                    Definir Tipo da Estrutura
                  </label>
                  <select
                    value={newStructType}
                    onChange={(e) =>
                      setNewStructType(
                        e.target.value as "Acabado" | "Semi-acabado",
                      )
                    }
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                  >
                    <option value="Acabado">Produto Acabado</option>
                    <option value="Semi-acabado">Semi-acabado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1">
                    Unidade
                  </label>
                  <select
                    value={newStructUnidade}
                    disabled={!!newStructSelectedProductId}
                    onChange={(e) => setNewStructUnidade(e.target.value)}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {availableUnits.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="relative">
                <label className="block text-gray-400 font-bold mb-1">
                  Copiar de Estrutura Similar (Opcional)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 font-bold" />
                  <input
                    type="text"
                    placeholder="Digite o código ou nome de um produto com estrutura..."
                    value={newStructSimilarSearchQuery}
                    onFocus={() => setShowSimilarSuggestions(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewStructSimilarSearchQuery(val);
                      if (!val) {
                        setNewStructSimilarProductId(null);
                      }
                      setShowSimilarSuggestions(true);
                    }}
                    className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg pl-9 pr-8 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors font-semibold placeholder:text-gray-600"
                  />
                  {newStructSimilarProductId && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewStructSimilarProductId(null);
                        setNewStructSimilarSearchQuery("");
                        setShowSimilarSuggestions(false);
                      }}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white text-xs font-bold font-mono bg-transparent border-0"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Similar Suggestions Dropdown */}
                {showSimilarSuggestions && (
                  <div className="absolute left-0 right-0 mt-1 bg-[#0f1523] border border-[#1f293d] rounded-lg max-h-96 overflow-y-auto z-10 shadow-2xl scrollbar-thin">
                    <div
                      onClick={() => {
                        setNewStructSimilarProductId(null);
                        setNewStructSimilarSearchQuery("");
                        setShowSimilarSuggestions(false);
                      }}
                      className="px-3 py-2 cursor-pointer hover:bg-red-900/20 text-xs text-red-400 border-b border-[#1f293d]/50 font-bold"
                    >
                      -- Não copiar (Estrutura em branco) --
                    </div>
                    {productsWithStructure
                      .filter(
                        (p) =>
                          p.codigo.toLowerCase().includes(newStructSimilarSearchQuery.toLowerCase()) ||
                          p.descricao.toLowerCase().includes(newStructSimilarSearchQuery.toLowerCase())
                      )
                      .sort((a, b) => a.descricao.localeCompare(b.descricao))
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setNewStructSimilarProductId(p.id);
                            setNewStructSimilarSearchQuery(`[${p.codigo}] - ${p.descricao}`);
                            setShowSimilarSuggestions(false);
                          }}
                          className="px-3 py-2 cursor-pointer hover:bg-blue-600/25 text-xs flex justify-between items-center border-b border-[#1f293d]/50"
                        >
                          <div>
                            <span className="font-mono text-blue-400 font-bold">[{p.codigo}]</span>{" "}
                            <span className="text-gray-200">{p.descricao}</span>
                          </div>
                          <span className="text-[9px] bg-blue-900/30 text-blue-400 px-1.5 py-0.5 rounded font-mono uppercase border border-blue-900/40">
                            Estrutura Ativa
                          </span>
                        </div>
                      ))}
                    {productsWithStructure.filter(
                      (p) =>
                        p.codigo.toLowerCase().includes(newStructSimilarSearchQuery.toLowerCase()) ||
                        p.descricao.toLowerCase().includes(newStructSimilarSearchQuery.toLowerCase())
                    ).length === 0 && (
                      <div className="px-3 py-3 text-center text-gray-500 italic">
                        Nenhum produto cadastrado com estrutura correspondente.
                      </div>
                    )}
                  </div>
                )}
                <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                  Selecione um produto que já possua uma estrutura cadastrada para clonar seus sub-itens. Depois de criada, você poderá adicionar ou remover sub-itens livremente.
                </p>
              </div>

              {newStructSelectedProductId && (
                <div className="flex justify-between items-center p-2.5 bg-blue-950/20 border border-blue-900/40 rounded-lg">
                  <span className="text-blue-400 text-[10px] font-bold">
                    Produto cadastrado selecionado. Clique no botão ao lado para limpar.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setNewStructSelectedProductId(null);
                      setNewStructSearchQuery("");
                      setNewStructCode("");
                      setNewStructDesc("");
                      setNewStructUnidade("UN");
                    }}
                    className="text-red-400 hover:text-red-300 font-bold underline text-[10px]"
                  >
                    Limpar
                  </button>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setIsNewStructureModalOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg"
                >
                  Criar Estrutura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
