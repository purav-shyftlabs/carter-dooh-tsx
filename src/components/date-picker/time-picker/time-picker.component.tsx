import { NON_ZERO_TIME_PICKER_END_DATE, TIME_PICKER_START_DATE } from '@/common/picker-options';
import { DateTimeType } from '@/lib/date-time-parser';
import { DateUtils } from '../helper/date-utils';
import styles from './time-picker.module.scss';

interface TimePickerConfig {
  minDateTime?: DateTimeType;
  maxDateTime?: DateTimeType;
  value: DateTimeType | null;
  timezone?: string;
  disablePast?: boolean;
  disableFuture?: boolean;
  disabled?: boolean;
}

interface ITimePicker {
  config: TimePickerConfig;
  type: 'startDate' | 'endDate';
  handleChangeForPicker: (key: 'startDate' | 'endDate', date: DateTimeType, time: string) => void;
}

const TimePicker: React.FC<ITimePicker> = props => {
  const { config, type, handleChangeForPicker } = props;
  const minDateTime: DateTimeType = config.minDateTime as DateTimeType;
  const maxDateTime: DateTimeType = config.maxDateTime as DateTimeType;
  const selectedDate: DateTimeType | null = config.value;

  if (!selectedDate) {
    return null;
  }

  const isPastDisabled = minDateTime ? selectedDate?.isSame(minDateTime, 'day') : config?.disablePast;
  const isFutureDisabled = maxDateTime ? selectedDate?.isSame(maxDateTime, 'day') : config?.disableFuture;

  const TIME_OPTIONS = type === 'startDate' ? TIME_PICKER_START_DATE : NON_ZERO_TIME_PICKER_END_DATE;

  return (
    <div className={styles.container}>
      {TIME_OPTIONS.map(item => (
        <button
          key={item.value}
          disabled={
            !DateUtils.isHoursValid(item.value, {
              selectedDate,
              minDateTime,
              maxDateTime,
              timezone: config.timezone ?? 'UTC',
              isPastDisabled,
              isFutureDisabled,
            }) || config.disabled
          }
          onClick={() => {
            handleChangeForPicker(type, selectedDate, item.value);
          }}
          data-active={DateUtils.isHourActive({ selectedDate, time: item.value, timezone: config.timezone ?? 'UTC' })}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default TimePicker;
