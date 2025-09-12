import React, { useState } from 'react';
import { InternalLayout } from '@/layouts/internal-layout';
import NetworkPerformance from '../component/widgets/network-performance.component';
import PageHeader from '@/components/page-header/page-header.component';
import { useMediaQuery } from '@mui/material';
import { Button, CarterDateRangePicker } from 'shyftlabs-dsl';
import styles from '../styles/dashboard.module.scss';
import DateTimeParser, { DateTimeType } from '@/lib/date-time-parser';
import { DATE_FORMAT } from '@/common/constants';
import styles_publisher from '../styles/components/publisher-dashboard.module.scss';

const Dashboard = () => {
    const isMobile = useMediaQuery(`(min-width: 320px) and (max-width: 767px)`);
    const timeZone = 'EST';
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [dates, setDates] = useState<{ startDate: DateTimeType; endDate: DateTimeType }>({ startDate: DateTimeParser.tz('2024-01-01', timeZone), endDate: DateTimeParser.tz('2024-01-01', timeZone) });
    const minimumStartDate = DateTimeParser().isBefore(dates.startDate) ? dates.startDate.clone().add(1, 'hour') : DateTimeParser();
    const isDateRangeAllowed = (dates: { startDate: DateTimeType; endDate: DateTimeType }) => {
        return dates.endDate.isAfter(dates.startDate);
    };
    const showAlert = (alert: { title: string; variant: string }) => {
        console.log(alert);
    };
    const [dateFilter, setDateFilter] = useState<'custom' | '7' | '30'>('7');
    const datePickerProps = {
        value: { startDate: dates.startDate, endDate: dates.endDate },
        withTimezone: true,
        timeZone,
        calendarProps: {
          startDatePicker: {
            views: ['year', 'day'] as any,
            format: DATE_FORMAT.MM_DD_YYYY,
    
            label: 'Start Date',
            maxDateTime: dates.endDate,
            minDateTime: minimumStartDate,
          },
          endDatePicker: {
            views: ['year', 'day'] as any,
            format: DATE_FORMAT.MM_DD_YYYY,
            label: 'End Date',
            disablePast: false,
            minDateTime: dates.startDate,
            maxDateTime: DateTimeParser.tz(timeZone),
          },
        },
        onChange: ({ startDate, endDate }: any) => {
          if (!isDateRangeAllowed({ startDate, endDate })) {
            showAlert({
              title: 'Please note that the maximum allowed date difference is one year',
              variant: 'danger',
            });
            return;
          }
          setDates({
            startDate: DateTimeParser.tz(startDate, timeZone).startOf('day'),
            endDate: DateTimeParser.tz(endDate, timeZone).endOf('day'),
          });
        },
      };
    
    return (
        <div className={styles.container}>
        <PageHeader
        data-testid="dashboard-header"
        title={
          'Dashboard'
        }
        ActionComponent={() => {
            if (isMobile) {
              return (
                <Button
                  label="Date Filter"
                  size="small"
                  variant="text-only"
                  onClick={({ currentTarget }) => setAnchorEl(currentTarget)}
                />
              );
            }
            return (
              <div className={styles.actions_container}>
                {dateFilter !== 'custom' ? (
                  <Button
                    label="Custom"
                    size="small"
                    variant="text-only"
                    onClick={() => {
                      setDateFilter('custom');
                    }}
                  />
                ) : (
                  <CarterDateRangePicker {...datePickerProps} />
                )}
                <div className={styles.button_group_container}>
                  <Button
                    label="Last 7 Days"
                    size="small"
                    variant={dateFilter === '7' ? 'primary' : 'tertiary'}
                    data-active={dateFilter === '7'}
                    onClick={() => setDateFilter('7')}
                  />
                  <Button
                    label="Last 30 Days"
                    size="small"
                    variant={dateFilter === '30' ? 'primary' : 'tertiary'}
                    data-active={dateFilter === '30'}
                    onClick={() => setDateFilter('30')}
                  />
                </div>
                
              </div>
            );
          }}
      />
      <div className={styles_publisher.container}>
        <NetworkPerformance />
      </div>
        </div>
    );
};

// Set the layout for this page
Dashboard.getLayout = (page: React.ReactNode) => {
    return <InternalLayout head={{ title: 'Dashboard', description: 'User Dashboard' }}>{page}</InternalLayout>;
};

export default Dashboard;