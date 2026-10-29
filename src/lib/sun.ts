/*
 * Local time and sunrise/sunset for a city, using the standard sunrise
 * equation (same math as city() in the design prototype).
 */

export interface Daylight {
  time: string;
  rise: string;
  set: string;
  /** Sunrise position on the 24 h bar, in percent. */
  left: number;
  /** Daylight length on the 24 h bar, in percent. */
  width: number;
  /** Current local time on the 24 h bar, in percent. */
  now: number;
  length: string;
  status: string;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function parts(ms: number, timeZone: string): Record<string, string> {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, fmt);
  }
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(new Date(ms))) out[p.type] = p.value;
  return out;
}

function hours(ms: number, timeZone: string): number {
  const p = parts(ms, timeZone);
  return Number(p.hour) + Number(p.minute) / 60;
}

export function formatHM(ms: number, timeZone: string): string {
  const p = parts(ms, timeZone);
  return `${p.hour}:${p.minute}`;
}

function duration(h: number): string {
  const total = Math.round(h * 60);
  return `${Math.floor(total / 60)} h ${String(total % 60).padStart(2, '0')} min`;
}

export function daylight(lat: number, lon: number, timeZone: string, now: number): Daylight {
  const p = parts(now, timeZone);
  const r = Math.PI / 180;
  // Julian day count since J2000 for the city's local date, at local noon.
  const n = Math.round(Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), 12) / 864e5 + 2440587.5 - 2451545);
  const J = n - lon / 360;
  const M = (357.5291 + 0.98560028 * J) % 360;
  const C = 1.9148 * Math.sin(M * r) + 0.02 * Math.sin(2 * M * r) + 0.0003 * Math.sin(3 * M * r);
  const L = (M + C + 282.9372) % 360;
  const transit = 2451545 + J + 0.0053 * Math.sin(M * r) - 0.0069 * Math.sin(2 * L * r);
  const decl = Math.asin(Math.sin(L * r) * Math.sin(23.4397 * r));
  // Clamp so polar day/night degrade to a full or empty bar instead of NaN.
  const cosW = (Math.sin(-0.833 * r) - Math.sin(lat * r) * Math.sin(decl)) / (Math.cos(lat * r) * Math.cos(decl));
  const w = Math.acos(Math.min(1, Math.max(-1, cosW))) / r;
  const toMs = (jd: number) => (jd - 2440587.5) * 864e5;
  const rise = toMs(transit - w / 360);
  const set = toMs(transit + w / 360);

  const riseH = hours(rise, timeZone);
  const setH = hours(set, timeZone);

  let status: string;
  if (now < rise) status = `Sunrise in ${duration((rise - now) / 36e5)}`;
  else if (now < set) status = `Sunset in ${duration((set - now) / 36e5)}`;
  else status = `Dark since ${formatHM(set, timeZone)}`;

  return {
    time: formatHM(now, timeZone),
    rise: formatHM(rise, timeZone),
    set: formatHM(set, timeZone),
    left: (riseH / 24) * 100,
    width: ((setH - riseH) / 24) * 100,
    now: (hours(now, timeZone) / 24) * 100,
    length: duration((set - rise) / 36e5),
    status,
  };
}
