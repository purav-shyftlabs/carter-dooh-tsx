import { Cell, Label, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { carterColors, Typography } from 'shyftlabs-dsl';
import { Maybe } from '@/types';
// Helper functions for formatting
const getSpendPortion = ({ total, value }: { total: number | string; value: number }): string => {
  const totalNum = typeof total === 'string' ? parseFloat(total) : total;
  return ((value / totalNum) * 100).toFixed(1);
};

const numericHelper = (value: number | string, options: { append?: string; defaultValue?: string } = {}): string => {
  if (!value && value !== 0) return options.defaultValue || '0';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num.toLocaleString()}${options.append || ''}`;
};
import styles from '../../styles/components/charts/advertiser-chart.module.scss';

const colors = [
  carterColors.yellow,
  carterColors['orange-700'],
  carterColors['light-blue'],
  carterColors.purple,
  carterColors.pink,
];

type AdvertiserChartProps = {
  data?: {
    name: string;
    value: number;
    portion?: Maybe<number>;
  }[];
  total?: string | number;
};

const AdvertiserChart: React.FC<AdvertiserChartProps> = ({ data, total }) => {
  // Dummy data
  const dummyData = [
    { name: 'Nike', value: 45000, portion: 35 },
    { name: 'Adidas', value: 32000, portion: 25 },
    { name: 'Apple', value: 28000, portion: 22 },
    { name: 'Samsung', value: 18000, portion: 14 },
    { name: 'Google', value: 5000, portion: 4 },
  ];

  const dummyTotal = 128000;
  
  const chartData = data || dummyData;
  const chartTotal = total || dummyTotal;
  return (
    <div className={styles.container}>
      <div className={styles.charts_container}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            {chartTotal === 0 ? (
              <Pie
                cx="50%"
                cy="50%"
                data={[{ name: 'No Data', value: 1 }]}
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                fill="#eeeeee"
              >
                <Label
                  value={numericHelper(chartTotal, { append: '$', defaultValue: '$0.00' })}
                  position="centerBottom"
                  fill="#000000"
                />
                <Label value="Ad Spend" position="centerTop" className={styles.text_wrap} />
              </Pie>
            ) : (
              <Pie cx="50%" cy="50%" data={chartData} innerRadius={55} outerRadius={80} fill="#8884d8" dataKey="value">
                <Label value={numericHelper(chartTotal, { append: '$' })} position="centerBottom" fill="#000000" />
                <Label value="Ad Spend" position="centerTop" className={styles.text_wrap} />
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
            )}
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.legend_container}>
        {chartData.map((item, index) => (
          <div key={item.name} className={styles.legend_wrapper}>
            <div className={styles.inner_legion}>
              <span className={styles.legend_dot} style={{ backgroundColor: colors[index % colors.length] }} />
              <Typography trimLength={20}>{item.name}</Typography>
            </div>
            <Typography>{getSpendPortion({ total: chartTotal, value: item.value })}%</Typography>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvertiserChart;
