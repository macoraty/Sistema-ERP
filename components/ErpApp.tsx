"use client";

import React, { useState, useEffect } from "react";
import { ErpProvider, useErp } from "@/hooks/use-erp";
import {
  Cpu,
  TrendingUp,
  Boxes,
  FileCheck,
  FileCode,
  ShoppingCart,
  ShoppingBag,
  Users,
  FolderTree,
  Package,
  Database,
  Menu,
  X,
  Bell,
  AlertTriangle,
  ExternalLink,
  HelpCircle,
  FileSpreadsheet,
  Download,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// Import our modular ERP views
import DashboardView from "@/components/DashboardView";
import ProductsView from "@/components/ProductsView";
import BomView from "@/components/BomView";
import ContactsView from "@/components/ContactsView";
import SalesOrdersView from "@/components/SalesOrdersView";
import RequirementsView from "@/components/RequirementsView";
import PurchaseOrdersView from "@/components/PurchaseOrdersView";
import EntryInvoicesView from "@/components/EntryInvoicesView";
import OutboundInvoicesView from "@/components/OutboundInvoicesView";
import StockView from "@/components/StockView";
import FinancialView from "@/components/FinancialView";
import ConfigView from "@/components/ConfigView";
import PurchaseNeedsView from "@/components/PurchaseNeedsView";
import PurchaseQuotesView from "@/components/PurchaseQuotesView";
import ImportExportView from "@/components/ImportExportView";
import ManualView from "@/components/ManualView";
import AnalyticsView from "@/components/AnalyticsView";

export function ErpApp() {
  const { alerts, clearAlerts, stock, mrpRequirements, appLogo, users } =
    useErp();
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authUsername, setAuthUsername] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      if (typeof window !== "undefined") {
        setIsSidebarCollapsed(localStorage.getItem("erp_sidebar_collapsed") === "true");
        setIsAuthenticated(localStorage.getItem("erp_auth") === "true");
        setAuthUsername(localStorage.getItem("erp_auth_user"));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(
      (u) => u.username === loginUsername && u.password === loginPassword,
    );
    if (user) {
      setIsAuthenticated(true);
      setAuthUsername(user.username);
      setActiveTab("Dashboard");
      setLoginError("");
      if (typeof window !== "undefined") {
        localStorage.setItem("erp_auth", "true");
        localStorage.setItem("erp_auth_user", user.username);
        localStorage.setItem(
          "erp_auth_is_admin",
          user.isAdmin ? "true" : "false",
        );
      }
    } else {
      setLoginError("Usuário ou senha inválidos.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthUsername(null);
    setActiveTab("Dashboard");
    if (typeof window !== "undefined") {
      localStorage.removeItem("erp_auth");
      localStorage.removeItem("erp_auth_user");
      localStorage.removeItem("erp_auth_is_admin");
    }
    setLoginUsername("");
    setLoginPassword("");
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("erp_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  // Quick indicator metrics for badges
  const stockAlertsCount = stock.filter(
    (s) => s.qtd <= s.minimo && s.minimo > 0,
  ).length;
  const mrpAlertsCount = mrpRequirements.filter(
    (r) => r.status === "Pendente",
  ).length;

  const allMenuItems = [
    {
      name: "Dashboard",
      icon: Cpu,
      view: DashboardView,
      badge: 0,
    },
    {
      name: "Analytics & Relatórios",
      icon: TrendingUp,
      view: AnalyticsView,
      badge: 0,
    },
    {
      name: "Cadastro de Produtos",
      icon: Package,
      view: ProductsView,
      badge: 0,
    },
    {
      name: "Estrutura de Produtos (BOM)",
      icon: FolderTree,
      view: BomView,
      badge: 0,
    },
    {
      name: "Clientes & Fornecedores",
      icon: Users,
      view: ContactsView,
      badge: 0,
    },
    {
      name: "Pedidos de Venda",
      icon: ShoppingBag,
      view: SalesOrdersView,
      badge: 0,
    },
    {
      name: "Necessidades MRP",
      icon: Cpu,
      view: RequirementsView,
      badge: mrpAlertsCount,
    },
    {
      name: "Necessidades de Compra",
      icon: ShoppingCart,
      view: PurchaseNeedsView,
      badge: 0,
    },
    {
      name: "Compras",
      icon: ShoppingCart,
      view: PurchaseOrdersView,
      badge: 0,
    },
    {
      name: "Notas de Entrada (XML)",
      icon: FileCode,
      view: EntryInvoicesView,
      badge: 0,
    },
    {
      name: "Notas de Saída (DANFE)",
      icon: FileSpreadsheet,
      view: OutboundInvoicesView,
      badge: 0,
    },
    {
      name: "Controle de Estoque",
      icon: Boxes,
      view: StockView,
      badge: stockAlertsCount,
    },
    {
      name: "Ledger Financeiro",
      icon: TrendingUp,
      view: FinancialView,
      badge: 0,
    },
    { name: "Configurações ERP", icon: Database, view: ConfigView, badge: 0 },
    {
      name: "Importar / Exportar Dados",
      icon: Download,
      view: ImportExportView,
      badge: 0,
    },
    {
      name: "Manual do Sistema",
      icon: BookOpen,
      view: ManualView,
      badge: 0,
    },
  ];

  const currentUser = users.find(u => u.username === authUsername);
  const isCurrentUserAdmin = currentUser?.isAdmin || false;
  
  const menuItems = allMenuItems.filter(item => {
    if (item.name === "Configurações ERP") {
      return isCurrentUserAdmin;
    }
    if (isCurrentUserAdmin) return true;
    if (item.name === "Dashboard") return true; // Everyone sees Dashboard
    if (item.name === "Manual do Sistema") return true; // Everyone sees Manual
    return currentUser?.permissions?.includes(item.name);
  });

  const handleNavigate = (tabName: string) => {
    setActiveTab(tabName);
    setIsMobileMenuOpen(false);
  };

  const ActiveComponent =
    menuItems.find((item) => item.name === activeTab)?.view || DashboardView;

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center">
          <Cpu className="w-12 h-12 text-blue-500 mb-4 animate-spin" />
          <span className="font-mono text-xl font-black tracking-widest text-white">
            MACORATY<b className="text-blue-500">.ERP</b>
          </span>
          <p className="text-xs text-gray-400 mt-2">Carregando ambiente...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center p-4 font-sans select-none">
        <div className="bg-[#111827] border border-[#1f293d] p-8 rounded-xl w-full max-w-md shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <Cpu className="w-12 h-12 text-blue-500 mb-4 animate-pulse" />
            <span className="font-mono text-xl font-black tracking-widest text-white">
              MACORATY<b className="text-blue-500">.ERP</b>
            </span>
            <p className="text-xs text-gray-400 mt-2">
              Área Restrita - Faça login para continuar
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">
                Usuário
              </label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-bold mb-1 uppercase tracking-wider">
                Senha (6 dígitos)
              </label>
              <input
                type="password"
                maxLength={6}
                pattern="[0-9]{6}"
                title="A senha deve conter exatamente 6 números."
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full bg-[#0b0f17] border border-[#1f293d] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 tracking-[0.5em] text-center font-mono text-lg transition-colors"
                required
              />
            </div>

            {loginError && (
              <div className="text-rose-400 text-xs font-bold text-center mt-2 bg-rose-500/10 border border-rose-500/20 py-2 rounded-lg">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors mt-6 text-sm uppercase tracking-wider shadow-lg shadow-blue-900/20"
            >
              Acessar Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#0b0f17] text-gray-100 flex flex-col md:flex-row relative overflow-x-hidden font-sans select-none"
      id="erp-portal"
    >
      {/* Mobile Top Header */}
      <header className="md:hidden w-full bg-[#111827] border-b border-[#1f293d] p-4 flex justify-between items-center z-40 sticky top-0">
        <div
          className="flex items-center space-x-2.5 cursor-pointer"
          onClick={() => handleNavigate("Dashboard")}
        >
          {appLogo ? (
            <img
              src={appLogo}
              alt="Logo ERP"
              className="max-h-8 object-contain"
            />
          ) : (
            <>
              <Cpu className="w-6 h-6 text-blue-500 animate-spin" />
              <span className="font-mono text-xs font-black tracking-widest text-white">
                MACORATY<b className="text-blue-500">.ERP</b>
              </span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-500 text-white font-black text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">
                {alerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Sidebar (Desktop & Animated Mobile Overlay) */}
      <AnimatePresence>
        {(isMobileMenuOpen || !isMobileMenuOpen) && (
          <aside
            className={`bg-[#111827] border-r border-[#1f293d] flex flex-col justify-between fixed top-0 bottom-0 left-0 z-50 transition-all duration-300 md:transform-none h-[100vh] ${
              isSidebarCollapsed ? "md:w-20 w-64" : "w-64"
            } ${
              isMobileMenuOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            }`}
          >
            {/* Header / Brand */}
            <div
              className={`border-b border-[#1f293d] ${isSidebarCollapsed ? "p-3 flex flex-col items-center gap-2" : "p-5"}`}
            >
              <div
                className={`flex items-center w-full ${isSidebarCollapsed ? "flex-col md:gap-3 justify-center" : "justify-between"}`}
              >
                <div
                  className="flex items-center space-x-2.5 overflow-hidden cursor-pointer"
                  onClick={() => handleNavigate("Dashboard")}
                >
                  {appLogo ? (
                    <img
                      src={appLogo}
                      alt="Logo"
                      className={`object-contain transition-all duration-300 ${isSidebarCollapsed ? "w-10 h-10" : "h-8 max-w-full"}`}
                    />
                  ) : (
                    <>
                      <Cpu className="w-5 h-5 text-blue-500 animate-pulse shrink-0" />
                      <span
                        className={`font-mono text-xs font-black tracking-widest text-white transition-opacity duration-200 ${isSidebarCollapsed ? "md:hidden" : "block"}`}
                      >
                        MACORATY<b className="text-blue-500">.ERP</b>
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {/* Collapse/Expand Toggle Button (visible on desktop) */}
                  <button
                    onClick={toggleSidebar}
                    className="hidden md:flex items-center justify-center p-1.5 rounded bg-[#1c2331] hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                    title={
                      isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"
                    }
                  >
                    {isSidebarCollapsed ? (
                      <ChevronRight className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronLeft className="w-3.5 h-3.5" />
                    )}
                  </button>
                  {/* Mobile close button */}
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="md:hidden text-gray-400 hover:text-white p-1"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
              <p
                className={`text-[10px] text-gray-500 uppercase font-bold tracking-wider pt-1 ${isSidebarCollapsed ? "md:hidden" : "block"}`}
              >
                Industrial Suite v2.0
              </p>
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin">
              <span
                className={`px-3 text-[9px] uppercase font-black tracking-wider text-gray-500 block mb-2 ${isSidebarCollapsed ? "md:hidden" : "block"}`}
              >
                Visões e Cadastros
              </span>
              {menuItems.map((item) => {
                const isSelected = item.name === activeTab;
                const Icon = item.icon;
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigate(item.name)}
                    title={isSidebarCollapsed ? item.name : undefined}
                    className={`w-full flex items-center rounded-lg text-xs font-semibold transition-all border relative ${
                      isSidebarCollapsed
                        ? "md:justify-center md:px-2 md:py-3 px-3 py-2.5"
                        : "justify-between px-3 py-2.5"
                    } ${
                      isSelected
                        ? "bg-blue-600/10 border-blue-500/30 text-white shadow"
                        : "bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-gray-800/40"
                    }`}
                  >
                    <div
                      className={`flex items-center ${isSidebarCollapsed ? "md:space-x-0" : "space-x-2.5"}`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isSelected ? "text-blue-400" : "text-gray-500"}`}
                      />
                      <span
                        className={`${isSidebarCollapsed ? "md:hidden" : "block"} whitespace-nowrap`}
                      >
                        {item.name}
                      </span>
                    </div>

                    {/* Quick alert badge */}
                    {item.badge > 0 &&
                      (isSidebarCollapsed ? (
                        <>
                          {/* Mini dot badge for collapsed desktop layout */}
                          <span
                            className={`hidden md:block absolute top-1 right-1 w-2.5 h-2.5 rounded-full border-2 border-[#111827] ${
                              item.name === "Controle de Estoque"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                            }`}
                          />
                          {/* Normal text badge for mobile view since mobile sidebar is always full-width */}
                          <span className="md:hidden px-1.5 py-0.2 rounded font-mono font-black text-[9px] bg-rose-500/10 text-rose-400 border border-rose-500/15">
                            {item.badge}
                          </span>
                        </>
                      ) : (
                        <span
                          className={`px-1.5 py-0.2 rounded font-mono font-black text-[9px] ${
                            item.name === "Controle de Estoque"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/15"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                          }`}
                        >
                          {item.badge}
                        </span>
                      ))}
                  </button>
                );
              })}
            </nav>

            {/* Bottom Credit line */}
            <div
              className={`p-4 border-t border-[#1f293d] bg-[#0d1320] flex flex-col gap-1.5 text-[10px] text-gray-500 ${isSidebarCollapsed ? "md:items-center" : ""}`}
            >
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span
                  className={`${isSidebarCollapsed ? "md:hidden" : "block"}`}
                >
                  Base de Dados Local Ativa
                </span>
              </div>
              <p
                className={`font-mono text-[9px] ${isSidebarCollapsed ? "md:hidden" : "block"}`}
              >
                Sessão: {new Date().toLocaleDateString("pt-BR")}
              </p>

              <button
                onClick={handleLogout}
                className={`mt-2 flex items-center justify-center space-x-2 text-rose-400 hover:text-rose-300 font-bold transition-colors border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 rounded ${isSidebarCollapsed ? "py-1.5 px-1.5 w-auto" : "py-1.5 w-full"}`}
                title="Sair do Sistema"
              >
                <X className="w-3.5 h-3.5" />
                <span
                  className={`${isSidebarCollapsed ? "md:hidden" : "block"}`}
                >
                  Sair do Sistema
                </span>
              </button>
            </div>
          </aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main
        className={`flex-1 flex flex-col min-h-screen relative transition-all duration-300 ${
          isSidebarCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex justify-between items-center px-8 py-4 bg-[#111827] border-b border-[#1f293d] sticky top-0 z-30">
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              {activeTab}
            </h2>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Visão unificada de chão de fábrica e faturamento industrial
              integrado
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick telemetry indicators */}
            <div className="flex items-center space-x-3.5 text-[10px] text-gray-500 border-r border-[#1f293d] pr-4">
              {stockAlertsCount > 0 && (
                <button
                  onClick={() => handleNavigate("Controle de Estoque")}
                  className="text-amber-400 hover:text-amber-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors focus:outline-none hover:underline"
                  title="Ir para Controle de Estoque"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{stockAlertsCount} Materiais Críticos</span>
                </button>
              )}
              {mrpAlertsCount > 0 && (
                <button
                  onClick={() => handleNavigate("Necessidades MRP")}
                  className="text-rose-400 hover:text-rose-300 font-bold flex items-center space-x-1 cursor-pointer transition-colors focus:outline-none hover:underline"
                  title="Ir para Necessidades MRP"
                >
                  <Cpu className="w-3.5 h-3.5 animate-pulse shrink-0" />
                  <span>{mrpAlertsCount} Déficits MRP</span>
                </button>
              )}
            </div>

            {/* Notifications Feed Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-lg bg-[#0b0f17] hover:bg-gray-800 text-gray-400 hover:text-white relative transition-colors border border-[#1f293d]"
              >
                <Bell className="w-4 h-4" />
                {alerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white font-black text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">
                    {alerts.length}
                  </span>
                )}
              </button>

              {/* Notifications dropdown panel */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#111827] border border-[#1f293d] rounded-xl shadow-2xl overflow-hidden z-50 py-1.5 text-xs">
                  <div className="px-4 py-2 bg-[#0f1523] border-b border-[#1f293d] flex justify-between items-center">
                    <span className="font-bold text-white">
                      Eventos Industriais Recentes
                    </span>
                    {alerts.length > 0 && (
                      <button
                        onClick={clearAlerts}
                        className="text-gray-500 hover:text-white text-[10px]"
                      >
                        Limpar Todos
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#1f293d]/50">
                    {alerts.length === 0 ? (
                      <div className="p-5 text-center text-gray-500 font-medium">
                        Sem notificações de eventos em tempo real.
                      </div>
                    ) : (
                      alerts.map((a) => (
                        <div
                          key={a.id}
                          className="p-3 hover:bg-gray-800/10 transition-colors"
                        >
                          <p className="text-gray-300 leading-relaxed text-[11px]">
                            {a.mensagem}
                          </p>
                          <span className="text-[8px] font-mono text-gray-500 block mt-1">
                            {a.data}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic View container */}
        <section className="flex-grow p-4 md:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <ActiveComponent onNavigate={handleNavigate} />
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}


