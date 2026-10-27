import { Card, Typography } from 'antd';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const { Title } = Typography;

/**
 * Carte graphique en barres.
 * props : titre, data, cleX, series [{ dataKey, name, couleur }]
 */
export default function BarChartCard({ titre, data = [], cleX = 'x', series = [] }) {
  return (
    <Card>
      <Title level={5} style={{ marginBottom: 16 }}>
        {titre}
      </Title>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
            <XAxis dataKey={cleX} tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => Number(v).toLocaleString('fr-FR')} />
            <Legend />
            {series.map((s) => (
              <Bar
                key={s.dataKey}
                dataKey={s.dataKey}
                name={s.name}
                fill={s.couleur || '#0E7A55'}
                radius={[4, 4, 0, 0]}
                maxBarSize={42}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
