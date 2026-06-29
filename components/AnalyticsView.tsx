import React, { useMemo } from "react";
import { useErp } from "@/hooks/use-erp";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Activity, TrendingUp, DollarSign, Package } from "lucide-react";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

export default function AnalyticsView() {
  const { products, salesOrders, financialEntries, stock } = useErp();

  // Data for Sales per product
  const salesByProduct = useMemo(() => {
    const data: Record<string, number> = {};
    salesOrders.forEach((order) => {
      order.itens.forEach((item) => {
        const prod = products.find((p) => p.id === item.prodId);
        const name = prod ? prod.descricao : `Prod ${item.prodId}`;
        if (!data[name]) data[name] = 0;
        data[name] += item.qtd * item.valorUnitario;
      });
    });
    return Object.keys(data)
      .map((key) => ({ name: key, value: data[key] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [salesOrders, products]);

  // Data for Financial Cash Flow (Revenues vs Expenses)
  const cashFlowData = useMemo(() => {
    const data: Record<string, { receitas: number; despesas: number }> = {};
    financialEntries.forEach((entry) => {
      const month = entry.dataVencimento.substring(0, 7); // YYYY-MM
      if (!data[month]) data[month] = { receitas: 0, despesas: 0 };
      if (entry.tipo === "Receita") {
        data[month].receitas += entry.valor;
      } else {
        data[month].despesas += entry.valor;
      }
    });
    return Object.keys(data)
      .sort()
      .map((key) => ({
        name: key,
        Receitas: data[key].receitas,
        Despesas: data[key].despesas,
      }));
  }, [financialEntries]);

  // Data for Stock Value Distribution by Category
  const stockByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    stock.forEach((s) => {
      const prod = products.find((p) => p.id === s.prodId);
      if (prod) {
        const group = prod.grupo || prod.tipo;
        if (!data[group]) data[group] = 0;
        data[group] += s.qtd * (prod.precoVenda || prod.valor || 0);
      }
    });
    return Object.keys(data).map((key) => ({ name: key, value: data[key] }));
  }, [stock, products]);

  const totalRevenue = financialEntries
    .filter((e) => e.tipo === "Receita" && e.status === "Pago")
    .reduce((acc, curr) => acc + curr.valor, 0);
  const totalExpenses = financialEntries
    .filter((e) => e.tipo === "Despesa" && e.status === "Pago")
    .reduce((acc, curr) => acc + curr.valor, 0);
  const balance = totalRevenue - totalExpenses;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto overflow-y-auto max-h-[calc(100vh-4rem)] custom-scrollbar">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight flex items-center space-x-2">
            <Activity className="w-6 h-6 text-blue-500" />
            <span>Analytics & Dashboards</span>
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Visão geral, gráficos e relatórios detalhados do sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg flex flex-col justify-center">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Receitas Realizadas
            </h3>
          </div>
          <p className="text-3xl font-black text-white mt-2">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalRevenue)}
          </p>
        </div>
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg flex flex-col justify-center">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <DollarSign className="w-5 h-5 text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Despesas Pagas
            </h3>
          </div>
          <p className="text-3xl font-black text-white mt-2">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totalExpenses)}
          </p>
        </div>
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg flex flex-col justify-center">
          <div className="flex items-center space-x-3 mb-2">
            <div
              className={`p-2 rounded-lg ${balance >= 0 ? "bg-blue-500/10" : "bg-red-500/10"}`}
            >
              <Activity
                className={`w-5 h-5 ${balance >= 0 ? "text-blue-500" : "text-red-500"}`}
              />
            </div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Saldo Líquido
            </h3>
          </div>
          <p
            className={`text-3xl font-black mt-2 ${balance >= 0 ? "text-blue-400" : "text-red-400"}`}
          >
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(balance)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg">
          <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">
            Fluxo de Caixa Mensal
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f293d"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b0f17",
                    borderColor: "#1f293d",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg">
          <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm">
            Vendas por Produto (Top 10)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesByProduct}
                layout="vertical"
                margin={{ top: 0, right: 0, bottom: 0, left: 40 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1f293d"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `R$ ${val / 1000}k`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#6b7280"
                  fontSize={10}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b0f17",
                    borderColor: "#1f293d",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg">
          <h3 className="font-bold text-white mb-6 uppercase tracking-wider text-sm flex items-center space-x-2">
            <Package className="w-4 h-4 text-gray-400" />
            <span>Valor em Estoque por Categoria</span>
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stockByCategory.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0b0f17",
                    borderColor: "#1f293d",
                    color: "#fff",
                  }}
                  formatter={(value: any) =>
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(value))
                  }
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1f293d] rounded-xl p-6 shadow-lg flex flex-col">
          <h3 className="font-bold text-white mb-4 uppercase tracking-wider text-sm">
            Resumo de Dados (Planilha)
          </h3>
          <div className="flex-1 overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#1f293d]">
                  <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Métrica
                  </th>
                  <th className="p-3 text-[10px] font-black text-gray-500 uppercase tracking-wider whitespace-nowrap text-right">
                    Valor
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <tr className="border-b border-[#1f293d] hover:bg-[#151c28] transition-colors">
                  <td className="p-3 text-gray-300 font-medium">
                    Total de Produtos Cadastrados
                  </td>
                  <td className="p-3 text-white text-right font-bold">
                    {products.length}
                  </td>
                </tr>
                <tr className="border-b border-[#1f293d] hover:bg-[#151c28] transition-colors">
                  <td className="p-3 text-gray-300 font-medium">
                    Pedidos de Venda
                  </td>
                  <td className="p-3 text-white text-right font-bold">
                    {salesOrders.length}
                  </td>
                </tr>
                <tr className="border-b border-[#1f293d] hover:bg-[#151c28] transition-colors">
                  <td className="p-3 text-gray-300 font-medium">
                    Lançamentos Financeiros
                  </td>
                  <td className="p-3 text-white text-right font-bold">
                    {financialEntries.length}
                  </td>
                </tr>
                <tr className="border-b border-[#1f293d] hover:bg-[#151c28] transition-colors">
                  <td className="p-3 text-gray-300 font-medium">
                    Itens em Estoque
                  </td>
                  <td className="p-3 text-white text-right font-bold">
                    {stock.reduce((acc, curr) => acc + curr.qtd, 0)}
                  </td>
                </tr>
                <tr className="hover:bg-[#151c28] transition-colors">
                  <td className="p-3 text-gray-300 font-medium">
                    Valor Total em Estoque
                  </td>
                  <td className="p-3 text-blue-400 text-right font-bold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(
                      stockByCategory.reduce(
                        (acc, curr) => acc + curr.value,
                        0,
                      ),
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
