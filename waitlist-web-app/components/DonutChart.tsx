"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";


const COLORS = [
  "#7ed957",
  "#8664ff",
  "#57c0ff",
  "#d9d9d9",
  "#5871f5",
  "#ff6b6b",
  "#f5a623",
  "#00c49f",
  "#ffbb28",
  "#0088fe",
];

const renderLegend = (stocks) => {
  return (
    <div className="text-sm text-white">
      {stocks.map((entry, index) => (
        <div key={index} className="flex justify-between items-center py-1">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span>{entry.stock?.name} -- {entry.stock?.symbol}</span>
          </div>
          <span className="text-gray-400">{entry.weight.toFixed(2)}%</span>
        </div>
      ))}
    </div>
  );
};

export function DonutChartWithLegend({ stocks }) {

  const chartData = stocks?.map((stock, index) => ({
    name: stock?.stock?.name || stock?.stock?.symbol,
    value: stock.weight,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="grid md:grid-cols-2 gap-6 bg-[#171717] p-6 rounded-xl w-full max-w-3xl">
      {/* Chart */}
      <div className="w-full h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={50}
              outerRadius={100}
              paddingAngle={4}
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#1e1e1e",
                border: "none",
                borderRadius: "6px",
              }}
              itemStyle={{ color: "#fff" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-col justify-center">{renderLegend(stocks)}</div>
    </div>
  );
}
