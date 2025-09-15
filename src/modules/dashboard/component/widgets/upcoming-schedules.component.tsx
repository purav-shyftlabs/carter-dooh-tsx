import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styles from '../../styles/components/widgets/upcoming-schedules.module.scss';
import ScheduleCard from '@/components/schedule-card/schedule-card.component';
import { Typography, carterColors } from 'shyftlabs-dsl';
import { IRootState } from '@/redux/reducers';
import { useAppDispatch } from '@/redux/hooks';
import { fetchDashboardData } from '@/redux/actions';
import NoDataPlaceholder from '@/components/no-data-placeholder/no-data-placeholder.component';

const UpcomingSchedules: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items: upcomingSchedules, isLoading, error } = useSelector((state: IRootState) => state.upcomingSchedules);

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
          upcomingSchedules.map((schedule: any, index: number) => (
            <ScheduleCard
              key={schedule.id || index}
              title={schedule.name || schedule.name || 'Untitled Schedule'}
              location={schedule.location || schedule.billboardName || 'Unknown Location'}
              imageSrc={schedule.imageUrl}
              id={schedule.id || index.toString()}
              startingIn={schedule.timeRemaining || schedule.startTime || 'TBD'}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default UpcomingSchedules;