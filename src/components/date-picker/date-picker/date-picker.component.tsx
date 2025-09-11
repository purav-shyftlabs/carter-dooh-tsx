import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker, DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import DateTimeParser, { DateTimeType } from '@/lib/date-time-parser';

interface IDatePicker<T> {
  value: T;
  withTimezone?: boolean;
  onChange: (value: T) => void;
  calendarProps?: Omit<DateTimePickerProps<DateTimeType>, 'onChange' | 'value'>;
}

const DatePicker: React.FC<IDatePicker<DateTimeType>> = props => {
  const { calendarProps, withTimezone, onChange, value: propValue } = props;
  const { timeZone } = { timeZone: 'EST' };

  const value = withTimezone ? DateTimeParser.tz(propValue, timeZone) : DateTimeParser(propValue);

  const baseProps: DateTimePickerProps<DateTimeType> = {
    ...(withTimezone && { timezone: timeZone }),
    slotProps: {
      toolbar: {
        hidden: true,
      },
      textField: {
        error: false,
      },
    },
    views: ['year', 'day'],
    format: 'MM/DD/YYYY',
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} dateLibInstance={DateTimeParser}>
      <DateTimePicker
        value={value}
        onChange={(newValue) => onChange(newValue as DateTimeType)}
        sx={{
          '& .MuiInputBase-root': {
            height: '40px',
          },
        }}
        {...baseProps}
        {...(calendarProps ?? {})}
      />
    </LocalizationProvider>
  );
};

export default DatePicker;
