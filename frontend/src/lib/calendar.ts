export type MonthGridCell = {
  year: number;
  month: number;
  day: number;
  isCurrentMonth: boolean;
  monthOffset: -1 | 0 | 1;
};

function getMonthInfo(year: number, month: number): { year: number; month: number; daysInMonth: number } {
  const date = new Date(Date.UTC(year, month - 1, 1));
  const normalizedYear = date.getUTCFullYear();
  const normalizedMonth = date.getUTCMonth() + 1;
  const daysInMonth = new Date(Date.UTC(normalizedYear, normalizedMonth, 0)).getUTCDate();

  return { year: normalizedYear, month: normalizedMonth, daysInMonth };
}

export function formatMonthGridCellDate(cell: MonthGridCell): string {
  return `${cell.year}-${String(cell.month).padStart(2, "0")}-${String(cell.day).padStart(2, "0")}`;
}

export function getMonthGridCells(year: number, month: number): MonthGridCell[] {
  const currentMonth = getMonthInfo(year, month);
  const previousMonth = getMonthInfo(year, month - 1);
  const nextMonth = getMonthInfo(year, month + 1);
  const firstDay = new Date(Date.UTC(currentMonth.year, currentMonth.month - 1, 1)).getUTCDay();
  const cells: MonthGridCell[] = [];

  for (let index = firstDay; index > 0; index -= 1) {
    cells.push({
      year: previousMonth.year,
      month: previousMonth.month,
      day: previousMonth.daysInMonth - index + 1,
      isCurrentMonth: false,
      monthOffset: -1,
    });
  }

  for (let day = 1; day <= currentMonth.daysInMonth; day += 1) {
    cells.push({
      year: currentMonth.year,
      month: currentMonth.month,
      day,
      isCurrentMonth: true,
      monthOffset: 0,
    });
  }

  while (cells.length < 42) {
    cells.push({
      year: nextMonth.year,
      month: nextMonth.month,
      day: cells.length - firstDay - currentMonth.daysInMonth + 1,
      isCurrentMonth: false,
      monthOffset: 1,
    });
  }

  return cells;
}

export function getMonthGrid(year: number, month: number) {
  return getMonthGridCells(year, month).map((cell) => (cell.isCurrentMonth ? cell.day : null));
}
