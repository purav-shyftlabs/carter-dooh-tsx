import logger from './logger';
import { Moment } from 'moment';
import DateTimeParser, { DateTimeType } from '@/lib/date-time-parser';
import { Maybe } from '@/types';

export const isValidAssetURL = (url: string = '') => url.startsWith('https://') || url.startsWith('http://');

export const parseFileName = (fileURLString: string = '') => {
  // Sanitize input to prevent XSS
  if (!fileURLString || typeof fileURLString !== 'string') {
    return '';
  }

  // HTML entity encode the input to prevent XSS
  const sanitizeHtml = (str: string): string => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };

  try {
    const url = new URL(fileURLString);
    let fileName = url.pathname.substring(1);
    if (fileName) {
      if (fileName.includes('Cohort/')) {
        fileName = fileName.replace('Cohort/', '');
      } else if (fileName.includes('IO/')) {
        fileName = fileName.replace('IO/', '');
      } else if (fileName.includes('AdItemTargeting/')) {
        fileName = fileName.replace('AdItemTargeting/', '');
      }
      const timeStampRegex = /-(\d{14})(\.[^.]+)$/;
      const match = fileName.match(timeStampRegex);
      if (match) {
        fileName = fileName.replace(timeStampRegex, '$2');
      }
      return sanitizeHtml(decodeURI(fileName));
    }
  } catch (error) {
    logger.error(error);
    // If URL parsing fails, handle as a simple string
  }

  if (fileURLString.includes('?')) {
    fileURLString = fileURLString.split('?')[0];
  }

  const urlParts = fileURLString.split('/');
  const lastPart = urlParts[urlParts.length - 1];

  const dotIndex = lastPart.lastIndexOf('.');
  const filename = dotIndex !== -1 ? lastPart.slice(0, dotIndex) : lastPart;
  const extension = dotIndex !== -1 ? lastPart.slice(dotIndex + 1) : '';

  const decodedFileName = decodeURI(filename);
  const sanitizedFileName = sanitizeHtml(decodedFileName);

  return extension ? `${sanitizedFileName}.${extension}` : sanitizedFileName;
};

export const isLastSecond = (timestamp: Maybe<string> | DateTimeType): boolean => {
  let date: Date;

  if (DateTimeParser.isMoment(timestamp)) {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp as string | number | Date);
  }

  if (isNaN(date.getTime())) {
    return false;
  }

  const seconds: number = date.getUTCSeconds();
  const milliseconds: number = date.getUTCMilliseconds();
  return seconds === 59 && milliseconds >= 0 && milliseconds <= 999;
};


type UnitConfig = {
  get: keyof Pick<Moment, 'seconds' | 'minutes' | 'hours'>;
  round: number;
  reset: string[];
};

type Units = {
  [key in 'minute' | 'hour' | 'day']: UnitConfig;
};


export const roundToUnit = (
  date: Moment | string,
  timezone: string,
  format: string,
  unit: 'minute' | 'hour' | 'day',
): string => {
  const momentDate = DateTimeParser.tz(date, timezone);

  const units: Units = {
    minute: { get: 'seconds', round: 30, reset: ['milliseconds'] },
    hour: { get: 'minutes', round: 30, reset: ['milliseconds', 'seconds'] },
    day: { get: 'hours', round: 12, reset: ['milliseconds', 'seconds', 'minutes'] },
  };

  const unitConfig = units[unit];
  // Now TypeScript knows this is a valid method name
  const value = momentDate[unitConfig.get]();

  if (value >= unitConfig.round) {
    momentDate.add(1, unit).startOf(unit);
  } else {
    momentDate.startOf(unit);
  }

  return momentDate.format(format);
};