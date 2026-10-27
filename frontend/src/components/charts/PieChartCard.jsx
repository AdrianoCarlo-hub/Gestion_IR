import { Card, Typography } from 'antd';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const { Title } = Typography;

const PIE_COLORS = ['#0E7A55', '#16A34A', '#F59E0B', '#DC2626', '#0369A1', '#7C3AED', '#64748B'];

/**
 * Carte graphique en anneau.
 * props : titre, data, cleNom, cleValeur
 */
export default function PieChartCard({ titre, data = [], cleNom = 'nom', cleValeur = 'valeur' }) {
  return (
    <Card>
      <Title level={5} style={{ marginBottom: 16 }}>
        {titre}
      </Title>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              dataKey={cleValeur}
              nameKey={cleNom}
              innerRadius={58}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => Number(v).toLocaleString('fr-FR')} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
