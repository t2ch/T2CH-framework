/**
 * Перевод timestamp в секунды
 *
 * @returns {number}
 */
export default function getTimeInSec() {
  const ms = new Date();
  return Math.floor(ms / 1000);
}

export function calctimeFrame(time) {
  // TODO: придумать как определить конец дня
  return {
    start: 1,
    end: 2,
  };
}
