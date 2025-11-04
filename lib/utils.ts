export function getDateRanges(date: Date) {
  const now = new Date(date);
  now.setHours(0, 0, 0, 0);

  // Daily range
  const dailyStart = new Date(now);
  const dailyEnd = new Date(now);
  dailyEnd.setHours(23, 59, 59, 999);

  // Weekly range
  const weeklyStart = new Date(now);
  weeklyStart.setDate(now.getDate() - now.getDay());
  const weeklyEnd = new Date(weeklyStart);
  weeklyEnd.setDate(weeklyStart.getDate() + 6);
  weeklyEnd.setHours(23, 59, 59, 999);

  // Monthly range
  const monthlyStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  return {
    daily: { start: dailyStart, end: dailyEnd },
    weekly: { start: weeklyStart, end: weeklyEnd },
    monthly: { start: monthlyStart, end: monthlyEnd },
  };
}