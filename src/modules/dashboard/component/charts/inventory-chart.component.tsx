import React from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { carterColors } from 'shyftlabs-dsl';

type InventoryChartProps = {
  data?: {
    name: string;
    All: number;
    Display: number;
    Product: number;
    Native: number;
    amt: number;
  }[];
  activeInventory?: Array<{ label: string; value: string }>;
};

const InventoryChart: React.FC<InventoryChartProps> = ({ data, activeInventory }) => {
  // Dummy data
  const dummyData = [
    { name: 'Jan 1', All: 1200, Display: 800, Product: 600, Native: 400, amt: 1200 },
    { name: 'Jan 2', All: 1350, Display: 900, Product: 650, Native: 450, amt: 1350 },
    { name: 'Jan 3', All: 1500, Display: 1000, Product: 700, Native: 500, amt: 1500 },
    { name: 'Jan 4', All: 1400, Display: 950, Product: 680, Native: 480, amt: 1400 },
    { name: 'Jan 5', All: 1600, Display: 1100, Product: 750, Native: 520, amt: 1600 },
    { name: 'Jan 6', All: 1750, Display: 1200, Product: 800, Native: 550, amt: 1750 },
    { name: 'Jan 7', All: 1800, Display: 1250, Product: 850, Native: 580, amt: 1800 },
  ];

  const dummyActiveInventory = [
    { label: 'All', value: 'all' },
    { label: 'Display', value: 'display' },
    { label: 'Product', value: 'product' },
    { label: 'Native', value: 'native' },
  ];

  const chartData = data || dummyData;
  const chartActiveInventory = activeInventory || dummyActiveInventory;

  // Available lines for the chart - only show lines that are in activeInventory
  const availableLines = [
    { key: 'All', title: 'This Period', color: carterColors['links-blue'] },
    { key: 'Display', title: 'Previous Period', color: carterColors['orange-700'] },
    { key: 'Product', title: 'Product', color: carterColors['green-700'] },
    { key: 'Native', title: 'Native', color: carterColors['purple-700'] },
  ].filter(line => {
    if (!chartActiveInventory || chartActiveInventory.length === 0) {
      return true; // Show all lines if no filter
    }
    return chartActiveInventory.some(item => 
      item.value === line.key.toLowerCase() || 
      item.label.toLowerCase().includes(line.title.toLowerCase())
    );
  });

  return (
    <ResponsiveContainer height={260}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tickMargin={16}
          tickFormatter={val => val}
        />
        <YAxis domain={[0, (dataMax: any) => Math.max(dataMax, 1)]} tickMargin={12} />
        <Tooltip labelFormatter={label => label} />
        {availableLines.map(item => (
          <Line
            key={item.key}
            type="monotone"
            dataKey={item.key}
            name={item.title}
            stroke={item.color}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default InventoryChart;
