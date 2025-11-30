// Central calendar config
export const PERSIAN_CALENDAR_LOCALE = 'fa-IR';

export type DateKey = string;

// What we expect from API
export type PlayerFromDb = {
  playerKey?: string;
  name: string;
  winsByDate: Record<DateKey, number>;
};

export type Scoreboard = {
  leagueKey: string;
  seasonKey: string;
  title?: string;
  dates: DateKey[];
  players: PlayerFromDb[];
};

export type PlayerRow = {
  name: string;
  wins: Record<DateKey, number>;
};

// Persian calendar month grouping key (e.g. "01", "02", ..., "12")
export type MonthKey = string;

export type DateMeta = {
  label: DateKey; // "YYYY-MM-DD"
  date: Date; // JS Date, used only for formatting / calendar
  monthKey: MonthKey; // Persian month ("01".."12")
};

export type Column =
  | { kind: 'date'; label: DateKey; date: Date }
  | { kind: 'month-total'; monthKey: MonthKey; label: string };
