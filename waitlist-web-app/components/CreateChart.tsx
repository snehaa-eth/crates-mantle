"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { name: "Feb", Pelosi: 100, Smallcap: 100 },
  { name: "Mar", Pelosi: 108, Smallcap: 105 },
  { name: "Apr", Pelosi: 115, Smallcap: 109 },
  { name: "May", Pelosi: 130, Smallcap: 122 },
  { name: "Jun", Pelosi: 140, Smallcap: 132 },
  { name: "Jul", Pelosi: 155, Smallcap: 140 },
];

export default function CrateChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="name" stroke="#ccc" />
        <YAxis stroke="#ccc" />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="Pelosi" stroke="#ff2dd6" strokeWidth={2} />
        <Line type="monotone" dataKey="Smallcap" stroke="#f9ae00" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
