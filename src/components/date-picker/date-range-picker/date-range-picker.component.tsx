import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker, DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import { Maybe } from '@/types';
import { carterColors } from 'shyftlabs-dsl';
import { useEffect, useState } from 'react';
import DateTimeParser, { DateTimeType } from '@/lib/date-time-parser';
import { DATE_FORMAT } from '@/common/constants';
import TimePicker from '../time-picker/time-picker.component';
import { DateUtils } from '../helper/date-utils';
import styles from './date-range-picker.module.scss';

export type DateRangeType = { startDate?: Maybe<string> | DateTimeType; endDate?: Maybe<string> | DateTimeType };

export interface IDateRangePicker<T> {
  value: Partial<T>;
  onChange: (value: T) => void;
  withTimezone?: boolean;
  className?: string;
  disabled?: boolean | 'start' | 'end';
  unified?: boolean;
  calendarProps?: Partial<{
    startDatePicker: Omit<DateTimePickerProps<DateTimeType>, 'onChange' | 'value' | 'disabled' | 'viewRenderers'>;
    endDatePicker: Omit<DateTimePickerProps<DateTimeType>, 'onChange' | 'value' | 'disabled' | 'viewRenderers'>;
  }>;
  unifiedImmediatelyChecked?: boolean;
}

const DateRangePicker: React.FC<IDateRangePicker<DateRangeType>> = props => {
  const {
    value,
    withTimezone = false,
    onChange,
    disabled,
    calendarProps,
    className,
    unified,
    unifiedImmediatelyChecked,
  } = props;
  const { timeZone } = { timeZone: 'EST' }

  const [isStartDateChanged, setIsStartDateChanged] = useState(false);
  const [isEndDateChanged, setIsEndDateChanged] = useState(false);

  useEffect(() => {
    if (unifiedImmediatelyChecked) {
      setIsStartDateChanged(true);
    }
  }, [unifiedImmediatelyChecked]);

  const startDate = withTimezone ? DateTimeParser.tz(value.startDate, timeZone) : DateTimeParser(value.startDate);
  const endDate = withTimezone ? DateTimeParser.tz(value.endDate, timeZone) : DateTimeParser(value.endDate);

  const minimumEndDate = DateTimeParser().isBefore(startDate) ? startDate.clone().add(1, 'hour') : DateTimeParser();

  const handleChangeForPicker = (key: 'startDate' | 'endDate', date?: Maybe<DateTimeType>, time?: string) => {
    if (key === 'startDate') {
      setIsStartDateChanged(true);
    } else {
      setIsEndDateChanged(true);
    }
    let newDate = date?.clone();
    if (time) {
      const [hour, minute] = time.split(':');
      newDate?.set('hour', Number(hour)).set('minute', Number(minute));
    } else {
      const selectedProps = key === 'startDate' ? calendarProps?.startDatePicker : calendarProps?.endDatePicker;
      const validatedHour = DateUtils.getHoursRange({
        selectedDate: newDate as DateTimeType,
        minDate: selectedProps?.minDateTime,
        maxDate: selectedProps?.maxDateTime,
      });
      if (validatedHour) {
        newDate = validatedHour;
      }
    }
    const finalDate = withTimezone
      ? newDate?.utc().set('seconds', 0)?.set('milliseconds', 0)
      : newDate?.set('seconds', 0)?.set('milliseconds', 0);

    onChange({
      ...value,
      [key]: finalDate,
    });
  };

  const baseProps: DateTimePickerProps<DateTimeType> = {
    ...(withTimezone && { timezone: timeZone }),
    className: styles.date_picker,
    sx: {
      '& .MuiInputBase-root': {
        borderRadius: '8px',
        color: carterColors['text-800'],
        height: '40px',
        '&:hover': {
          borderColor: carterColors['grey-400'],
        },
        '&: disabled': {
          backgroundColor: 'red',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          border: `1px solid ${carterColors['grey-300']}`,
          borderRadius: '5px',
          '&: active': {
            border: 'none',
          },
        },
      },
    },
    slotProps: {
      field: {
        readOnly: true,
      },
      toolbar: {
        hidden: true,
      },
      textField: {
        error: false,
        // InputProps: {
        //   endAdornment: <CalendarIcon color={carterColors['text-800']} />,
        // },
      },
    },
    views: ['year', 'day', 'hours'],
    format: DATE_FORMAT.MMM_DD_YYYY_HH_MM,
    ampmInClock: true,
  };

  return (
    <div className={className ? className : styles.container}>
      <LocalizationProvider dateAdapter={AdapterMoment} dateLibInstance={DateTimeParser}>
        <DateTimePicker
          disabled={typeof disabled === 'boolean' ? disabled : disabled === 'start'}
          value={unified ? (isStartDateChanged ? startDate : null) : startDate}
          onChange={date => {
            handleChangeForPicker('startDate', date);
          }}
          {...baseProps}
          viewRenderers={{
            hours: config => (
              <TimePicker type="startDate" config={config} handleChangeForPicker={handleChangeForPicker} />
            ),
          }}
          {...(calendarProps?.startDatePicker ?? {})}
        />
        <DateTimePicker
          disabled={typeof disabled === 'boolean' ? disabled : disabled === 'end'}
          value={unified ? (isEndDateChanged ? endDate : null) : endDate}
          onChange={date => {
            handleChangeForPicker('endDate', date);
          }}
          {...(calendarProps?.endDatePicker?.disablePast && { minDateTime: minimumEndDate })}
          disablePast={calendarProps?.endDatePicker?.disablePast}
          {...baseProps}
          viewRenderers={{
            hours: config => (
              <TimePicker type="endDate" config={config} handleChangeForPicker={handleChangeForPicker} />
            ),
          }}
          {...(calendarProps?.endDatePicker ?? {})}
        />
      </LocalizationProvider>
    </div>
  );
};

export default DateRangePicker;
