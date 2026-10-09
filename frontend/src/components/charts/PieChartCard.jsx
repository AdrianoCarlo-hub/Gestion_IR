import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { LuChartPie } from "react-icons/lu";

const COULEURS = [
  '#1a5c4a', '#10b981', '#34d399', '#f59e0b',
  '#dc2626', '#3b82f6', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316', '#a3a3a3',
];

export default function PieChartCard({ titre, data, cleNom, cleValeur }) {
  return (
    <div className="chart-card">
      <h3 className="chart-title">
        <LuChartPie
          style={{ width: 18, height: 18, verticalAlign: 'middle', marginRight: 8 }}
        />
        {titre}
      </h3>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <RechartsPieChart>
            <Pie
              data={data}
              dataKey={cleValeur}
              nameKey={cleNom}
              cx="50%"
              cy="50%"
              outerRadius={100}
              innerRadius={50}
              paddingAngle={2}
              label={({ name, percent }) =>
                percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''
              }
              labelLine={false}
              fontSize={11}
              animationDuration={500}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={COULEURS[index % COULEURS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => Number(value).toLocaleString('fr-FR') + ' Ar'}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: 12,
                background: '#ffffff',
              }}
              itemStyle={{ color: '#1e293b' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
              align="center"
              iconType="circle"
              iconSize={10}
            />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
