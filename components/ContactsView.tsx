"use client";

import React, { useState, useMemo } from "react";
import { useErp } from "@/hooks/use-erp";
import { Contact } from "@/lib/types";
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  FileText,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function ContactsView() {
  const { contacts, saveContact, deleteContact } = useErp();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [expandedContactId, setExpandedContactId] = useState<number | null>(null);

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

  // Form Fields
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<"Cliente" | "Fornecedor">("Cliente");
  const [cnpj, setCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cep, setCep] = useState("");
  const [formasPagamento, setFormasPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);

  const handleCepChange = async (value: string) => {
    // Only digits and hyphen
    const clean = value.replace(/\D/g, "");
    let masked = clean;
    if (clean.length > 5) {
      masked = `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
    }
    setCep(masked.slice(0, 9));

    if (clean.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setEndereco(data.logradouro || "");
          setBairro(data.bairro || "");
          setCidade(data.localidade || "");
          setUf(data.uf || "");
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleOpenAddModal = () => {
    setEditingContact(null);
    setNome("");
    setTipo("Cliente");
    setCnpj("");
    setEmail("");
    setTelefone("");
    setCidade("");
    setUf("");
    setEndereco("");
    setNumero("");
    setBairro("");
    setCep("");
    setFormasPagamento("");
    setObservacoes("");
    setInscricaoEstadual("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Contact) => {
    setEditingContact(c);
    setNome(c.nome);
    setTipo(c.tipo);
    setCnpj(c.cnpj);
    setEmail(c.email);
    setTelefone(c.telefone);
    setCidade(c.cidade);
    setUf(c.uf);
    setEndereco(c.endereco || "");
    setNumero(c.numero || "");
    setBairro(c.bairro || "");
    setCep(c.cep || "");
    setFormasPagamento(c.formasPagamento || "");
    setObservacoes(c.observacoes || "");
    setInscricaoEstadual(c.inscricaoEstadual || "");
    setIsModalOpen(true);
  };

  const handleSaveContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !cnpj || !email) {
      alert(
        "Por favor, preencha os campos obrigatórios (Razão Social, CNPJ/CPF e E-mail).",
      );
      return;
    }

    saveContact({
      id: editingContact ? editingContact.id : 0,
      nome,
      tipo,
      cnpj,
      email,
      telefone,
      cidade,
      uf: uf.toUpperCase(),
      endereco,
      numero,
      bairro,
      cep,
      formasPagamento,
      observacoes,
      inscricaoEstadual,
    });

    setIsModalOpen(false);
  };

  const handleDeleteContact = (id: number, name: string) => {
    if (confirm(`Excluir permanentemente o contato "${name}"?`)) {
      deleteContact(id);
    }
  };

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const matchSearch =
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpj.replace(/\D/g, "").includes(searchTerm.replace(/\D/g, "")) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = selectedType === "Todos" || c.tipo === selectedType;
      return matchSearch && matchType;
    });
  }, [contacts, searchTerm, selectedType]);

  const sortedContacts = useMemo(() => {
    if (!sortField) return filteredContacts;
    return [...filteredContacts].sort((a, b) => {
      let valA = a[sortField as keyof Contact] ?? "";
      let valB = b[sortField as keyof Contact] ?? "";
      
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredContacts, sortField, sortDirection]);

  return (
    <div className="space-y-6 font-sans animate-fade-in" id="contacts-view">
      {/* Search & Action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-[#111827] border border-[#1f293d] p-4 rounded-xl">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por Razão Social, CNPJ/CPF ou E-mail..."
              className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#0b0f17] border border-[#1f293d] rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-blue-500"
          >
            <option value="Todos">Clientes e Fornecedores</option>
            <option value="Cliente">Apenas Clientes</option>
            <option value="Fornecedor">Apenas Fornecedores</option>
          </select>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center justify-center space-x-1.5 shadow"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Contato</span>
        </button>
      </div>

      {/* Contacts Table */}
      <div className="bg-[#111827] border border-[#1f293d] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0f1523] border-b border-[#1f293d] text-gray-400 text-[10px] uppercase font-black tracking-wider">
                <th className="py-3 px-4 w-10 text-center">Detalhes</th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('tipo')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Classificação</span>
                    {sortField === 'tipo' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('nome')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Razão Social / Nome</span>
                    {sortField === 'nome' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('cnpj')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>CNPJ / CPF</span>
                    {sortField === 'cnpj' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('email')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>E-mail</span>
                    {sortField === 'email' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('telefone')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Telefone</span>
                    {sortField === 'telefone' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th 
                  className="py-3 px-4 cursor-pointer hover:text-white transition-colors"
                  onClick={() => toggleSort('cidade')}
                >
                  <div className="flex items-center space-x-1 select-none">
                    <span>Cidade - UF</span>
                    {sortField === 'cidade' ? (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-400" /> : <ChevronDown className="w-3 h-3 text-blue-400" />
                    ) : (
                      <ChevronDown className="w-3 h-3 text-gray-600 opacity-40 animate-pulse" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d]/50 text-xs text-gray-300">
              {sortedContacts.map((c) => {
                const isClient = c.tipo === "Cliente";
                const isExpanded = expandedContactId === c.id;
                const badgeClass = isClient
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-purple-500/10 text-purple-400 border border-purple-500/20";

                return (
                  <React.Fragment key={c.id}>
                    <tr className="hover:bg-gray-800/20 transition-colors">
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setExpandedContactId(isExpanded ? null : c.id)}
                          className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-800 transition-colors"
                          title={isExpanded ? "Recolher Detalhes" : "Expandir Detalhes"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-blue-400" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${badgeClass}`}>
                          {c.tipo}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-white text-[11px] max-w-xs truncate" title={c.nome}>
                        {c.nome}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-300">
                        {c.cnpj}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 max-w-xs truncate" title={c.email}>
                        {c.email}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300 font-mono">
                        {c.telefone || "—"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-gray-300">
                        {c.cidade ? `${c.cidade} - ${c.uf}` : "—"}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
                            title="Editar Contato"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteContact(c.id, c.nome)}
                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Deletar Contato"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-[#0b0f17]/40 border-b border-[#1f293d]/50">
                        <td colSpan={8} className="p-4 bg-slate-900/10">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-black/20 rounded-lg border border-[#1f293d]/40">
                            <div className="md:col-span-2">
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Endereço Completo</span>
                              <span className="text-gray-200 font-medium">
                                {c.endereco ? (
                                  <>
                                    {c.endereco}{c.numero ? `, ${c.numero}` : ""}{c.bairro ? ` - ${c.bairro}` : ""}{c.cep ? ` (CEP: ${c.cep})` : ""}
                                  </>
                                ) : "—"}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Inscrição Estadual</span>
                              <span className="text-gray-200 font-mono font-bold">{c.inscricaoEstadual || "—"}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Formas de Pagamento</span>
                              <span className="text-emerald-400 font-bold">{c.formasPagamento || "—"}</span>
                            </div>
                            <div className="md:col-span-4">
                              <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Observações</span>
                              <p className="text-gray-300 italic leading-relaxed">{c.observacoes || "Nenhuma observação registrada."}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredContacts.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500 font-medium">
                    Nenhum contato encontrado na pesquisa.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false) }}
        >
          <div className="bg-[#111827] border border-[#1f293d] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
            {/* Modal Header */}
            <div className="bg-[#0f1523] px-5 py-4 flex justify-between items-center border-b border-[#1f293d]">
              <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>
                  {editingContact ? "Editar Contato" : "Registrar Contato"}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSaveContact}
              className="p-5 space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Basic Info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-wider border-b border-[#1f293d] pb-1">
                    Dados Gerais
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">
                        Classificação
                      </label>
                      <select
                        value={tipo}
                        onChange={(e) =>
                          setTipo(e.target.value as "Cliente" | "Fornecedor")
                        }
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="Cliente">Cliente (Vendas)</option>
                        <option value="Fornecedor">Fornecedor (Insumos)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">
                        Inscrição Estadual
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Isento ou Nº"
                        value={inscricaoEstadual}
                        onChange={(e) => setInscricaoEstadual(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">
                      Razão Social / Nome Fantasia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Siemens Energy Ltda"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">
                        CNPJ / CPF *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 00.000.000/0000-00"
                        value={cnpj}
                        onChange={(e) => setCnpj(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">
                        Telefone de Contato
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: (11) 4004-1122"
                        value={telefone}
                        onChange={(e) => setTelefone(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">
                      E-mail Comercial *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: contato@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">
                      Formas de Pagamento
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 30/60 dias, Boleto, Pix, Depósito"
                      value={formasPagamento}
                      onChange={(e) => setFormasPagamento(e.target.value)}
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Address & Observations */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-wider border-b border-[#1f293d] pb-1">
                    Endereço & Observações
                  </h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 relative">
                      <label className="block text-gray-400 font-bold mb-1">
                        CEP
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 01001-000"
                        value={cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                      {loadingCep && (
                        <span className="absolute right-2.5 bottom-2.5 text-[10px] text-blue-400 animate-pulse font-bold">
                          ...
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">
                        Número
                      </label>
                      <input
                        type="text"
                        placeholder="Nº"
                        value={numero}
                        onChange={(e) => setNumero(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">
                      Rua / Logradouro
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Avenida Paulista"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <label className="block text-gray-400 font-bold mb-1">
                        Bairro
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Bela Vista"
                        value={bairro}
                        onChange={(e) => setBairro(e.target.value)}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 font-bold mb-1">
                        UF
                      </label>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="SP"
                        value={uf}
                        onChange={(e) => setUf(e.target.value.toUpperCase())}
                        className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">
                      Município
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: São Paulo"
                      value={cidade}
                      onChange={(e) => setCidade(e.target.value)}
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold mb-1">
                      Observações
                    </label>
                    <textarea
                      placeholder="Alguma observação importante sobre o contato..."
                      value={observacoes}
                      onChange={(e) => setObservacoes(e.target.value)}
                      rows={2}
                      className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t border-[#1f293d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-4 py-2 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg"
                >
                  Salvar Contato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
