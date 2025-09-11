import pino, { stdTimeFunctions } from 'pino';

type PinoPrettyOptions = {
  colorize: boolean;
};

type PinoConfig = {
  transport: {
    target: string;
    options: PinoPrettyOptions;
  };
  enabled: boolean;
  timestamp: typeof stdTimeFunctions.isoTime;
  browser: {
    asObject: boolean;
  };
};

const pinoConfig: PinoConfig = {
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
  enabled: true,
  timestamp: stdTimeFunctions.isoTime,
  browser: {
    asObject: true,
  },
};

const logger = pino(pinoConfig);

export default logger;
