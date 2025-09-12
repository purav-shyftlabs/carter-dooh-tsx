import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { carterColors, Typography } from 'shyftlabs-dsl';
import styles from '../../styles/components/widgets/network-performance.module.scss';
import PerformanceCard from '../common/performance-card.component';
import InventoryChart from '../charts/inventory-chart.component';
import { IRootState } from '@/redux/reducers';
import { useAppDispatch } from '@/redux/hooks';
import { fetchDashboardData } from '@/redux/actions';

interface INetworkPerformance {
  isCampaignPerformance?: boolean;
  title?: string;
}

const NetworkPerformance: React.FC<INetworkPerformance> = props => {
  const { title = 'Dashboard Overview' } = props;
  const [activeNetworkFilter, setActiveNetworkFilter] = useState<string>('billboards');
  const dispatch = useAppDispatch();
  const { data: dashboardData, isLoading } = useSelector((state: IRootState) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  // Transform API data to performance cards
  const performanceCards = dashboardData ? [
    {
      key: 'billboards',
      title: 'Active Billboards',
      value: dashboardData.billboards.active.toString(),
      change: `+${dashboardData.billboards.growthFromLastMonth}%`,
      changeType: dashboardData.billboards.growthFromLastMonth >= 0 ? 'positive' as const : 'negative' as const,
    },
    {
      key: 'schedules',
      title: 'Upcoming Schedules',
      value: dashboardData.schedules.upcomingIn24h.toString(),
      change: '24h',
      changeType: 'positive' as const,
    },
    {
      key: 'content',
      title: 'Total Content',
      value: dashboardData.content.total.toString(),
      change: `+${dashboardData.content.weeklyGrowth}%`,
      changeType: dashboardData.content.weeklyGrowth >= 0 ? 'positive' as const : 'negative' as const,
    },
    {
      key: 'users',
      title: 'Online Users',
      value: dashboardData.users.online.toString(),
      change: 'Active',
      changeType: 'positive' as const,
    },
  ] : [];

  // Chart data based on selected KPI
  const getChartData = (selectedKPI: string) => {
    const baseData = [
      { name: 'Jan 1', current: 0, previous: 0 },
      { name: 'Jan 2', current: 0, previous: 0 },
      { name: 'Jan 3', current: 0, previous: 0 },
      { name: 'Jan 4', current: 0, previous: 0 },
      { name: 'Jan 5', current: 0, previous: 0 },
      { name: 'Jan 6', current: 0, previous: 0 },
      { name: 'Jan 7', current: 0, previous: 0 },
    ];

    switch (selectedKPI) {
      case 'billboards':
        return baseData.map((item, index) => ({
          ...item,
          current: 3 + index * 0.2,
          previous: 2.5 + index * 0.15,
        }));
      case 'schedules':
        return baseData.map((item, index) => ({
          ...item,
          current: 1 + index * 0.1,
          previous: 0.8 + index * 0.08,
        }));
      case 'content':
        return baseData.map((item, index) => ({
          ...item,
          current: 6 + index * 0.3,
          previous: 5 + index * 0.25,
        }));
      case 'users':
        return baseData.map((item, index) => ({
          ...item,
          current: 4 + index * 0.2,
          previous: 3.5 + index * 0.15,
        }));
      default:
        return baseData;
    }
  };

  const chartData = getChartData(activeNetworkFilter);

  return (
    <div className={styles.container}>
      <div className={styles.header_container}>
        <Typography variant="body-large-semibold" color={carterColors['text-900']}>
          {title}
        </Typography>
      </div>
      <div className={styles.cards_container}>
        {isLoading ? (
          <div style={{ display: 'flex', gap: '16px', width: '100%' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ 
                flex: 1, 
                height: '120px', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '8px',
                animation: 'pulse 2s infinite'
              }} />
            ))}
          </div>
        ) : (
          performanceCards.map(({ key, ...item }) => (
            <PerformanceCard
              key={key}
              onClick={() => setActiveNetworkFilter(key)}
              title={item.title}
              value={item.value}
              growthPercentage={item.changeType === 'positive' ? 10 : item.changeType === 'negative' ? -10 : 0}
              active={key === activeNetworkFilter}
            />
          ))
        )}
      </div>
      <div className={styles.info_container}>
        <Typography variant="body-large-semibold" color={carterColors['text-900']}>
          {performanceCards.find(card => card.key === activeNetworkFilter)?.title || 'Active Billboards'}
        </Typography>
        <div className={styles.legends_container}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: carterColors['orange-700'], borderRadius: '2px' }} />
            <Typography variant="body-regular">Previous Period</Typography>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '12px', height: '12px', backgroundColor: carterColors['links-blue'], borderRadius: '2px' }} />
            <Typography variant="body-regular">This Period</Typography>
          </div>
        </div>
      </div>
      <div style={{ height: '273px', backgroundColor: 'white', borderRadius: '8px', padding: '16px' }}>
        <InventoryChart 
          data={chartData.map(item => ({
            name: item.name,
            All: item.current,
            Display: item.previous,
            Product: 0, // Not used
            Native: 0, // Not used
            amt: item.current
          }))}
          activeInventory={[
            { label: 'This Period', value: 'all' },
            { label: 'Previous Period', value: 'display' }
          ]}
        />
      </div>
    </div>
  );
};

export default NetworkPerformance;
