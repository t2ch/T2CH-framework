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
  let dateNow = new Date();
  dateNow.setTime(time);
  const start = dateNow.setHours(0, 0, 0, 0);
  const end = dateNow.setHours(23, 59, 59, 999);
  return {
    start,
    end,
  };
}
