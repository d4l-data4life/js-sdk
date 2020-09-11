import config from '../config/index';

const throttleQueue: Function[] = [];
const processThrottleQueue = (interval: number): void => {
  if (!throttleQueue.length) {
    return;
  }

  throttleQueue[0]();
  const proceed = () => {
    throttleQueue.shift();
    processThrottleQueue(interval);
  };
  setTimeout(proceed, interval);
};

const defaultInterval = config.rateLimit ? Math.ceil(1000 / config.rateLimit) : 0;
export const throttle = (interval: number = defaultInterval): Promise<undefined> =>
  new Promise(resolve => {
    if (!interval) {
      resolve();
      return;
    }

    throttleQueue.push(resolve);
    if (throttleQueue.length === 1) {
      processThrottleQueue(interval);
    }
  });

export default {
  throttle,
};
