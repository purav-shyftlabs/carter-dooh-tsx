import React from 'react';
import { useSelector } from 'react-redux';
import styles from '../../styles/components/widgets/upcoming-schedules.module.scss';
import ScheduleCard from '@/components/schedule-card/schedule-card.component';
import { Typography, carterColors } from 'shyftlabs-dsl';
import { IRootState } from '@/redux/reducers';
// import { useAppDispatch } from '@/redux/hooks';
// import { fetchDashboardData } from '@/redux/actions';
import NoDataPlaceholder from '@/components/no-data-placeholder/no-data-placeholder.component';

type UpcomingSchedule = {
  id?: string | number;
  name?: string;
  location?: string;
  billboardName?: string;
  imageUrl?: string;
  timeRemaining?: string;
  startTime?: string;
};

const UpcomingSchedules: React.FC = () => {
  const { items, isLoading, error } = useSelector((state: IRootState) => state.upcomingSchedules);

  // dummy data
  const upcomingSchedules = [
    {
      id: 1,
      name: 'Schedule 1',
      location: 'Location 1',
      imageUrl: 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRhO19TV174QcqD38GCJshP-jF23gdJ6QyiaUmZ5nlVHCfKIsgPxDsD1ZM97CnWqYlVr89tpQlhPt4Jv2DFIgy66pAzPCdgkje3htp9d7I1F0-KLp6JxhoDNA',
      timeRemaining: '10 minutes',
      startTime: '2025-01-01',
    },
    {
      id: 2,
      name: 'Schedule 2',
      location: 'Location 2',
      imageUrl:'https://www.apple.com/v/iphone-17-pro/a/images/overview/welcome/hero__bdntboqignj6_xlarge.jpg',
      timeRemaining: '10 hours',
      startTime: '2025-01-01',
    },
    
    {
      id: 3,
      name: 'Schedule 3',
      location: 'Location 3',
      imageUrl: 'https://images.ctfassets.net/hnk2vsx53n6l/5kbabItNDd1ROzqcCXTEGh/648d0493d314bb0e2a589f069fc11d63/4b1775f90ba30df9386d0c2cb8c6855362d2d50b.png?w=1200&h=1200&fm=avif&f=center&fit=fill&q=80',
      timeRemaining: '10 hours',
      startTime: '2025-01-01',
    },
    
    {
      id: 4,
      name: 'Schedule 4',
      location: 'Location 4',
      imageUrl: 'https://shop.teamsg.in/cdn/shop/files/2_3703c8e1-f59d-4282-8a12-b91cf97ffdb9.jpg?v=1749553327&width=533',
      timeRemaining: '10 days',
      startTime: '2025-01-01',
    },
    
  ];

  // useEffect(() => {
  //   dispatch(fetchDashboardData());
  // }, [dispatch]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header_container}>
          <Typography variant="body-large-semibold" color={carterColors['text-900']}>
            Upcoming Schedules
          </Typography>
        </div>
        <div className={styles.cards_container}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ 
              height: '200px', 
              backgroundColor: '#f3f4f6', 
              borderRadius: '8px',
              animation: 'pulse 2s infinite'
            }} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header_container}>
          <Typography variant="body-large-semibold" color={carterColors['text-900']}>
            Upcoming Schedules
          </Typography>
        </div>
        <div className={styles.cards_container}>
          <Typography variant="body-regular" color={carterColors['text-600']}>
            Error loading schedules: {error}
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header_container}>
        <Typography variant="body-large-semibold" color={carterColors['text-900']}>
          Upcoming Schedules ({upcomingSchedules.length})
        </Typography>
      </div>
      <div className={` ${upcomingSchedules.length === 0 ? styles.no_data_placeholder : styles.cards_container}`}>
        {upcomingSchedules.length === 0 ? (
          <NoDataPlaceholder 
            title="No upcoming schedules found"
            description="Please try again later"
            className={styles.no_data_placeholder}
          />
        ) : (
          upcomingSchedules.map((schedule: UpcomingSchedule, index: number) => (
            <ScheduleCard
              key={schedule.id || index}
              title={schedule.name || 'Untitled Schedule'}
              location={schedule.location || schedule.billboardName || 'Unknown Location'}
              imageSrc={schedule.imageUrl || ''}
              id={String(schedule.id ?? index)}
              startingIn={String(schedule.timeRemaining ?? schedule.startTime ?? 'TBD')}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default UpcomingSchedules;