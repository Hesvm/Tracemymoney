import type { CalendarSystem } from "@/types/money";

export type CalendarParts = {
  year: number;
  month: number;
  day: number;
};

const jalaaliBreaks = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];

export const shamsiMonthNames = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand"
];

export const gregorianMonthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

function div(a: number, b: number) {
  return Math.trunc(a / b);
}

function mod(a: number, b: number) {
  return a - Math.trunc(a / b) * b;
}

function jalCal(jy: number) {
  const bl = jalaaliBreaks.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = jalaaliBreaks[0];
  let jump = 0;

  if (jy < jp || jy >= jalaaliBreaks[bl - 1]) {
    throw new Error("Jalaali year is out of supported range");
  }

  for (let i = 1; i < bl; i += 1) {
    const jm = jalaaliBreaks[i];
    jump = jm - jp;
    if (jy < jm) break;
    leapJ += div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ += div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }

  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) leap = 4;

  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number) {
  let d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4);
  d += div(153 * mod(gm + 9, 12) + 2, 5);
  d += gd - 34840408;
  d -= div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4);
  return d + 752;
}

function d2g(jdn: number): CalendarParts {
  let j = 4 * jdn + 139361631;
  j += div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const day = div(mod(i, 153), 5) + 1;
  const month = mod(div(i, 153), 12) + 1;
  const year = div(j, 1461) - 100100 + div(8 - month, 6);

  return { year, month, day };
}

function j2d(jy: number, jm: number, jd: number) {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): CalendarParts {
  const gy = d2g(jdn).year;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;

  if (k >= 0) {
    if (k <= 185) {
      return { year: jy, month: 1 + div(k, 31), day: mod(k, 31) + 1 };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) k += 1;
  }

  return { year: jy, month: 7 + div(k, 30), day: mod(k, 30) + 1 };
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function gregorianToIso(parts: CalendarParts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function isoToGregorian(isoDate: string): CalendarParts {
  const [year, month, day] = isoDate.split("-").map(Number);
  return {
    year: year || new Date().getFullYear(),
    month: month || 1,
    day: day || 1
  };
}

export function gregorianToShamsi(parts: CalendarParts): CalendarParts {
  return d2j(g2d(parts.year, parts.month, parts.day));
}

export function shamsiToGregorian(parts: CalendarParts): CalendarParts {
  return d2g(j2d(parts.year, parts.month, parts.day));
}

export function isoToCalendarParts(isoDate: string, system: CalendarSystem) {
  const gregorian = isoToGregorian(isoDate || todayIsoDate());
  return system === "shamsi" ? gregorianToShamsi(gregorian) : gregorian;
}

export function calendarPartsToIso(parts: CalendarParts, system: CalendarSystem) {
  const gregorian = system === "shamsi" ? shamsiToGregorian(parts) : parts;
  return gregorianToIso(gregorian);
}

export function getCalendarMonthLength(year: number, month: number, system: CalendarSystem) {
  if (system === "gregorian") return new Date(year, month, 0).getDate();
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  return jalCal(year).leap === 0 ? 30 : 29;
}

export function getCalendarWeekday(parts: CalendarParts, system: CalendarSystem) {
  const iso = calendarPartsToIso(parts, system);
  return new Date(`${iso}T12:00:00`).getDay();
}

export function formatCalendarDate(isoDate: string | undefined, system: CalendarSystem) {
  const safeIso = isoDate || todayIsoDate();
  const parts = isoToCalendarParts(safeIso, system);
  const month = system === "shamsi" ? shamsiMonthNames[parts.month - 1] : gregorianMonthNames[parts.month - 1];
  return `${month} ${parts.day}, ${parts.year}`;
}
