const UNITS = ['KB', 'MB', 'GB', 'TB'];
// decimal units, so KB/MB/GB mean what they say on a drive's packaging
const STEP = 1000;

// File.size is a BigInt in the schema, so coerce before doing any maths
function formatBytes(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size < 0) return '';
  if (size < STEP) return `${size} B`;

  let value = size / STEP;
  let unit = 0;
  while (value >= STEP && unit < UNITS.length - 1) {
    value /= STEP;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${UNITS[unit]}`;
}

function formatDate(date) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

// relative rather than a clock time: a time rendered on the server would be in
// the server's timezone, but "in 3 hours" is right wherever the viewer is
function formatTimeLeft(date) {
  const minutes = Math.round((new Date(date) - Date.now()) / 60000);
  const plural = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;

  if (minutes < 1) return 'less than a minute';
  if (minutes < 60) return plural(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (hours < 48) return plural(hours, 'hour');
  return plural(Math.round(hours / 24), 'day');
}

module.exports = { formatBytes, formatDate, formatTimeLeft };
