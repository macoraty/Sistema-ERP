export function getTodayFormatted(): string {
  const date = new Date();
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Format DD/MM/YYYY or DD.MM.YY
  const parts = dateStr.split(/[./-]/);
  if (parts.length !== 3) return null;
  
  const d = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  let y = parseInt(parts[2], 10);
  
  if (parts[2].length === 2) {
    y += 2000;
  }
  
  const date = new Date(y, m, d);
  if (isNaN(date.getTime())) return null;
  return date;
}

export function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export function getWorkingDaysBetween(startDate: Date, endDate: Date): number {
  if (startDate > endDate) return 0;
  
  let count = 0;
  const curDate = new Date(startDate.getTime());
  
  while (curDate <= endDate) {
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // 0 = Sunday, 6 = Saturday
      count++;
    }
    curDate.setDate(curDate.getDate() + 1);
  }
  
  return count;
}

export function addWorkingDays(startDate: Date, days: number): Date {
  const curDate = new Date(startDate.getTime());
  let added = 0;
  
  while (added < days) {
    curDate.setDate(curDate.getDate() + 1);
    const dayOfWeek = curDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      added++;
    }
  }
  
  return curDate;
}
