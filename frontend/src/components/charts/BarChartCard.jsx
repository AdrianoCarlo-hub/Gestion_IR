import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

const fmt = (n) => {
  if (n == null) return '0';
  const v = Number(n);
  if (Math.abs(v) >= 1_000_000_000) return (v / 1_000_000_000).toFixed(1) + ' Md';
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(0) + ' M';
  if (Math.abs(v) >= 1_000) return (v / 1_000).toFixed(0) + ' k';
  return v.toString();
};

export default function BarChartCard({ titre, data, cleX, series }) {
  return (
    <div className="chart-card">
      <h3 className="chart-title">{titre}</h3>
      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey={cleX} stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} tickFormatter={fmt} />
            <Tooltip
              formatter={(value) => fmt(value) + ' Ar'}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {series.map((s, i) => (
              <Bar
                key={i}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.couleur || '#1a5c4a'}
                radius={[6, 6, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
