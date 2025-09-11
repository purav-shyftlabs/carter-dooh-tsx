import { Maybe } from '@/types';
import DateTimeParser, { DateTimeType } from '@/lib/date-time-parser';
import { DATE_FORMAT } from '@/common/constants';
import { isLastSecond, roundToUnit } from '@/common/helpers';

type THourRangeOptions = {
  selectedDate: DateTimeType;
  minDate?: DateTimeType;
  maxDate?: DateTimeType;
};

type THoursValidConfig = {
  minDateTime: DateTimeType;
  maxDateTime: DateTimeType;
  selectedDate: DateTimeType;
  timezone: string;
  isPastDisabled?: boolean;
  isFutureDisabled?: boolean;
};

type THoursActive = {
  selectedDate: DateTimeType;
  time: string;
  timezone: string;
};

const isHoursValid = (time: string, config: THoursValidConfig): boolean => {
  const { isPastDisabled, isFutureDisabled, selectedDate, minDateTime, maxDateTime } = config;
  if (isPastDisabled || isFutureDisabled) {
    const [hour, minute] = time.split(':');
    const currentSelectedObj = DateTimeParser.tz(selectedDate, config.timezone)
      .set('hour', Number(hour))
      .set('minutes', Number(minute));
    if (isPastDisabled) {
      const minDateObj = DateTimeParser.tz(minDateTime, config.timezone);
      if (minDateObj.isAfter(currentSelectedObj)) {
        return false;
      }
      return true;
    }
    if (isFutureDisabled) {
      const maxDateObj = DateTimeParser.tz(maxDateTime, config.timezone);
      if (maxDateObj.isBefore(currentSelectedObj)) {
        return false;
      }
      return true;
    }
  }
  return true;
};

const isHourActive = (config: THoursActive) => {
  const { time, timezone } = config;
  const selectedDate = DateTimeParser.tz(config.selectedDate, timezone);
  const optionTimeObj = DateTimeParser.tz(time, 'hh:mm', timezone);

  return selectedDate.hours() === optionTimeObj.hours() && selectedDate.minutes() === optionTimeObj.minutes();
};

const getHoursRange = (options: THourRangeOptions) => {
  const { selectedDate, minDate, maxDate } = options;
  if (minDate) {
    if (selectedDate.isSame(minDate, 'date')) {
      if (selectedDate.isBefore(minDate)) {
        return minDate.set('minute', 0);
      }
    }
  }
  if (maxDate) {
    if (selectedDate.isSame(maxDate, 'date')) {
      if (selectedDate.isAfter(maxDate)) {
        return maxDate.set('minute', 0);
      }
    }
  }
  if (selectedDate.hours() === 23 && selectedDate.minutes() === 59) {
    return selectedDate.clone();
  }
};
const getEndTime = (endDate?: Maybe<string | DateTimeType>, timeZone?: string): any => {
  if (typeof endDate === 'string') {
    return endDate;
  }
  if (endDate && timeZone) {
    const utcTime = DateTimeParser.tz(endDate.clone(), timeZone);
    if (utcTime.hours() === 23 && utcTime.minutes() === 59) {
      return endDate.clone().endOf('minute').set('milliseconds', 0).format(`${DATE_FORMAT.DEFAULT}.SSS[Z]`);
    }
    return endDate.clone().subtract(1, 'second').set('milliseconds', 0).format(`${DATE_FORMAT.DEFAULT}.SSS[Z]`);
  }
};

const getStartTime = (date?: Maybe<string | DateTimeType>, timeZone?: string) => {
  if (typeof date === 'string') {
    return date;
  }
  if (date && timeZone) {
    return date.clone().startOf('minute').format(`${DATE_FORMAT.DEFAULT}.SSS[Z]`);
  }
};

const getStartDateInUTC = (date?: Maybe<string | DateTimeType>, timeZone?: string) => {
  if (typeof date === 'string') {
    return date;
  }
  if (date && timeZone) {
    return date.clone().startOf('minute').utc().format(`${DATE_FORMAT.DEFAULT}.SSS[Z]`);
  }
};

const getEndDateInUTC = (endDate?: Maybe<string | DateTimeType>, timeZone?: string) => {
  if (typeof endDate === 'string') {
    return endDate;
  }
  if (endDate && timeZone) {
    let baseEndDate = endDate.clone();
    if (isEOD(endDate, timeZone)) {
      baseEndDate = baseEndDate.endOf('minutes');
    } else {
      baseEndDate = baseEndDate.subtract(1, 'second');
    }
    return baseEndDate.set('millisecond', 0).format(`${DATE_FORMAT.DEFAULT}.SSS[Z]`);
  }
};

const isEOD = (date?: Maybe<string> | Date | DateTimeType, timeZone?: string) => {
  if (date && timeZone) {
    const momentDate = DateTimeParser.tz(date, timeZone);
    const isLastMinuteOfDay = momentDate.hours() === 23 && momentDate.minutes() === 59;
    return isLastMinuteOfDay;
  }
  return false;
};
interface GetFormattedDateTimeOptions {
  date: string | DateTimeType | Date | undefined | null;
  timeZone: string;
  dateFormat?: string;
  timeFormat?: string;
  roundOff?: boolean;
}

const getFormattedDateTime = ({
  date,
  timeZone,
  dateFormat = DATE_FORMAT.MMM_DD_YYYY,
  timeFormat = 'HH:mm',
  roundOff = false,
}: GetFormattedDateTimeOptions): { finalDate: string; finalTime: string } => {
  if (!date) {
    return { finalDate: '', finalTime: '' };
  }

  const momentDate = DateTimeParser.tz(date, timeZone);
  const isLastMinuteOfDay = momentDate.hours() === 23 && momentDate.minutes() === 59;

  const shouldRoundOff = roundOff && isLastSecond(momentDate) && !isLastMinuteOfDay;

  const finalDate = shouldRoundOff
    ? roundToUnit(date as unknown as string | DateTimeType, timeZone, dateFormat, 'hour')
    : momentDate.format(dateFormat);

  const finalTime = shouldRoundOff
    ? roundToUnit(date as unknown as string | DateTimeType, timeZone, timeFormat, 'hour')
    : momentDate.format(timeFormat);

  return { finalDate, finalTime };
};

export const DateUtils = {
  getHoursRange,
  isHoursValid,
  isHourActive,
  isEOD,
  getStartTime,
  getStartDateInUTC,
  getEndTime,
  getEndDateInUTC,
  getFormattedDateTime,
};
