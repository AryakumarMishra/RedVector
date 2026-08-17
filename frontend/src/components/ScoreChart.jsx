import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import Icon from "./Icon";
import { categoryLabel, scoreColor } from "../theme";

export default function ScoreChart({ scores }) {
  const data = scores.map((s) => ({
    category: categoryLabel(s.category),
    vulnerability_score: s.vulnerability_score,
    vulnerable: s.vulnerable,
    total: s.total,
  }));

  return (
    <div className="chart-card">
      <div className="chart-card-title">
        <Icon name="activity" size={13} />
        Vulnerability by category
      </div>
      <div style={{ width: "100%", height: 230 }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 18, right: 8, bottom: 4, left: -12 }}
            barCategoryGap="28%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1C2027"
              vertical={false}
            />
            <XAxis
              dataKey="category"
              stroke="#6B7280"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#272B33" }}
              interval={0}
              dy={6}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              stroke="#6B7280"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={44}
            />
            <Tooltip
              cursor={{ fill: "rgba(59, 130, 246, 0.05)" }}
              contentStyle={{
                background: "#15181D",
                border: "1px solid #343A46",
                borderRadius: 8,
                fontSize: 12,
                boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              }}
              labelStyle={{ color: "#9AA1AE", fontWeight: 600 }}
              itemStyle={{ color: "#E9EBEF" }}
              formatter={(value, _name, props) => [
                `${Math.round(value * 100)}% · ${props.payload.vulnerable}/${props.payload.total} vulnerable`,
                "Vulnerability score",
              ]}
            />
            <Bar
              dataKey="vulnerability_score"
              radius={[3, 3, 0, 0]}
              maxBarSize={44}
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={scoreColor(entry.vulnerability_score)} />
              ))}
              <LabelList
                dataKey="vulnerable"
                position="top"
                formatter={(v) => `${v}`}
                fill="#6B7280"
                fontSize={11}
                offset={6}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}