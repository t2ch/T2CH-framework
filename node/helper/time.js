/**
 * Перевод timestamp в секунды
 *
 * @returns {number}
 */
export default function getTimeInSec() {
  const ms = new Date();
  return Math.floor(ms / 1000);
}
