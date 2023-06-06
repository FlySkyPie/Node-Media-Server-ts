import chalk from 'chalk';

const LOG_TYPES = {
  NONE: 0,
  ERROR: 1,
  NORMAL: 2,
  DEBUG: 3,
  FFDEBUG: 4
};

let logType = LOG_TYPES.NORMAL;

const setLogType = (type: any) => {
  if (typeof type !== 'number') return;

  logType = type;
};

const logTime = () => {
  let nowDate = new Date();
  return nowDate.toLocaleDateString() + ' ' + nowDate.toLocaleTimeString([], { hour12: false });
};

const log = (...args: any) => {
  if (logType < LOG_TYPES.NORMAL) return;

  console.log(logTime(), process.pid, chalk.bold.green('[INFO]'), ...args);
};

const error = (...args: any) => {
  if (logType < LOG_TYPES.ERROR) return;

  console.log(logTime(), process.pid, chalk.bold.red('[ERROR]'), ...args);
};

const debug = (...args: any) => {
  if (logType < LOG_TYPES.DEBUG) return;

  console.log(logTime(), process.pid, chalk.bold.blue('[DEBUG]'), ...args);
};

const ffdebug = (...args: any) => {
  if (logType < LOG_TYPES.FFDEBUG) return;

  console.log(logTime(), process.pid, chalk.bold.blue('[FFDEBUG]'), ...args);
};

export default {
  LOG_TYPES,
  setLogType,

  log, error, debug, ffdebug
};