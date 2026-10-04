import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const COULEURS = [
  '#1a5c4a', '#10b981', '#34d399', '#f59e0b',
  '#dc2626', '#3b82f6', '#8b5cf6', '#ec4899',
  '#14b8a6', '#f97316', '#a3a3a3',
];

export default function PieChartCard({ titre, data, cleNom, cleValeur }) {
  return (
    <div className="chart-card">
      <h3 className="chart-title">{titre}</h3>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <PieChart>
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
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
