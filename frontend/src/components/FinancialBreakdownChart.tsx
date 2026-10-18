import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { NetNeedsResult } from "../types";
import { formatCurrency } from "../utils/validation";

interface FinancialBreakdownChartProps {
  netNeeds: NetNeedsResult;
}

interface ComponentChartItem {
  name: string;
  category: "Obligation" | "Resource" | "Coverage Gap";
  amount: number;
  color: string;
  description: string;
}

interface TooltipPayloadItem {
  payload: ComponentChartItem;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const isDeduction = data.category === "Resource";
    return (
      <div className="chart-tooltip">
        <div className="tooltip-title">{data.name}</div>
        <div className="tooltip-category" style={{ color: data.color }}>
          {data.category === "Obligation"
            ? "➕ Added to Life Cover Need"
            : data.category === "Resource"
            ? "➖ Subtracted (Already Protected)"
            : "🎯 Net Required Additional Cover"}
        </div>
        <div className="tooltip-amount">
          {isDeduction ? "- " : ""}
          {formatCurrency(data.amount)}
        </div>
        <div className="tooltip-desc">{data.description}</div>
      </div>
    );
  }
  return null;
};

export const FinancialBreakdownChart: React.FC<FinancialBreakdownChartProps> = ({ netNeeds }) => {
  // 1. Detailed 5-Component Breakdown
  const componentData: ComponentChartItem[] = [
    {
      name: "Liabilities & Debts",
      category: "Obligation",
      amount: netNeeds.outstanding_liabilities,
      color: "#48243C", // Deep Plum
      description: "Immediate debts to be paid off to prevent burdening family.",
    },
    {
      name: "Future Goals",
      category: "Obligation",
      amount: netNeeds.future_financial_goals,
      color: "#A25772", // Plum Rose Accent
      description: "Future milestone funds (children's education, marriage, emergency).",
    },
    {
      name: "Income Replacement PV",
      category: "Obligation",
      amount: netNeeds.pv_income_replacement,
      color: "#29242B", // Charcoal Ink
      description: `Present value of living support over ${netNeeds.replacement_years} years.`,
    },
    {
      name: "Liquid Assets",
      category: "Resource",
      amount: netNeeds.available_assets,
      color: "#D98278", // Dusty Rose
      description: "Liquid savings available to settle needs immediately.",
    },
    {
      name: "Existing Insurance",
      category: "Resource",
      amount: netNeeds.existing_life_insurance,
      color: "#7E5265", // Muted Mauve Plum
      description: "Existing policy sum assured reducing the need for new cover.",
    },
  ];

  // 2. High-Level Macro Comparison (Obligations vs Resources vs Net Gap)
  const macroComparisonData = [
    {
      label: "Total Obligations",
      value: netNeeds.total_obligations,
      fill: "#48243C", // Deep Plum
      subtext: "Debts + Goals + Income PV",
    },
    {
      label: "Existing Resources",
      value: netNeeds.total_resources,
      fill: "#D98278", // Dusty Rose
      subtext: "Liquid Assets + Existing Cover",
    },
    {
      label: "Recommended Cover",
      value: netNeeds.recommended_cover,
      fill: "#663556", // Elevated Plum
      subtext: netNeeds.is_clamped_to_zero ? "Fully Covered (0 Need)" : "Net Uninsured Gap",
    },
  ];

  return (
    <div className="financial-chart-wrapper">
      {/* Chart Section Header */}
      <div className="chart-header">
        <div>
          <h3 className="chart-title">Visual Financial Breakdown</h3>
          <p className="chart-subtitle">
            How your liabilities, future goals, and living needs compare against your existing wealth.
          </p>
        </div>
      </div>

      {/* Macro Comparison Bar Chart */}
      <div className="chart-card">
        <h4 className="chart-inner-title">
          <span>📊</span> Financial Balance: Obligations vs. Resources vs. Net Need
        </h4>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart
              data={macroComparisonData}
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "#334155", fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: "#cbd5e1" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val: number) => formatCurrency(val)}
              />
              <Tooltip
                formatter={(val: number | string | Array<number | string> | undefined) => [
                  typeof val === "number" ? formatCurrency(val) : "0",
                  "Amount",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  borderColor: "#cbd5e1",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={70}>
                {macroComparisonData.map((entry, index) => (
                  <Cell key={`macro-cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Macro Chart Caption Legend */}
        <div className="macro-legend-row">
          <div className="legend-chip">
            <span className="chip-dot" style={{ backgroundColor: "#48243C" }}></span>
            <span>Total Family Obligations: <strong className="font-mono">{formatCurrency(netNeeds.total_obligations)}</strong></span>
          </div>
          <div className="legend-chip">
            <span className="chip-dot" style={{ backgroundColor: "#D98278" }}></span>
            <span>Existing Resources: <strong className="font-mono">{formatCurrency(netNeeds.total_resources)}</strong></span>
          </div>
          <div className="legend-chip">
            <span className="chip-dot" style={{ backgroundColor: "#663556" }}></span>
            <span>Recommended Cover: <strong className="font-mono">{formatCurrency(netNeeds.recommended_cover)}</strong></span>
          </div>
        </div>
      </div>

      {/* Granular 5-Component Breakdown */}
      <div className="chart-card">
        <h4 className="chart-inner-title">
          <span>🔍</span> Granular Component Composition
        </h4>
        <div style={{ width: "100%", height: 280 }}>
          <ResponsiveContainer>
            <BarChart
              data={componentData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val: number) => formatCurrency(val)}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={140}
                tick={{ fill: "#29242B", fontSize: 11, fontWeight: 600 }}
                axisLine={{ stroke: "#E2D7C5" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {componentData.map((entry, index) => (
                  <Cell key={`comp-cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Visual Category Legend */}
        <div className="component-legend-container">
          <div className="category-legend-group">
            <span className="category-title">Obligations (Additions to Need):</span>
            <div className="category-items">
              <div className="legend-item-chip">
                <span className="chip-color-bar" style={{ backgroundColor: "#48243C" }}></span>
                <span className="chip-label">Liabilities:</span>
                <strong className="chip-val font-mono">{formatCurrency(netNeeds.outstanding_liabilities)}</strong>
              </div>
              <div className="legend-item-chip">
                <span className="chip-color-bar" style={{ backgroundColor: "#A25772" }}></span>
                <span className="chip-label">Future Goals:</span>
                <strong className="chip-val font-mono">{formatCurrency(netNeeds.future_financial_goals)}</strong>
              </div>
              <div className="legend-item-chip">
                <span className="chip-color-bar" style={{ backgroundColor: "#29242B" }}></span>
                <span className="chip-label">Income Replacement PV:</span>
                <strong className="chip-val font-mono">{formatCurrency(netNeeds.pv_income_replacement)}</strong>
              </div>
            </div>
          </div>

          <div className="category-legend-group">
            <span className="category-title">Resources (Deductions from Need):</span>
            <div className="category-items">
              <div className="legend-item-chip">
                <span className="chip-color-bar" style={{ backgroundColor: "#D98278" }}></span>
                <span className="chip-label">Liquid Assets:</span>
                <strong className="chip-val font-mono">&minus; {formatCurrency(netNeeds.available_assets)}</strong>
              </div>
              <div className="legend-item-chip">
                <span className="chip-color-bar" style={{ backgroundColor: "#7E5265" }}></span>
                <span className="chip-label">Existing Insurance:</span>
                <strong className="chip-val font-mono">&minus; {formatCurrency(netNeeds.existing_life_insurance)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
