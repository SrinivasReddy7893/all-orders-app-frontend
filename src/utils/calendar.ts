/** Month arithmetic for the date picker. Months are 0-based. */
export type Month = { y: number; m: number };

export const addMonths = ({ y, m }: Month, delta: number): Month => {
  const d = new Date(y, m + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
};

const index = ({ y, m }: Month) => y * 12 + m;

/** Whether a month lies in the choosable range (either end may be open). */
export const monthAllowed = (month: Month, min?: Month, max?: Month) =>
  (!min || index(month) >= index(min)) && (!max || index(month) <= index(max));

/** The closest choosable month, for a year jump that lands outside the range. */
export const clampMonth = (month: Month, min?: Month, max?: Month): Month => {
  if (min && index(month) < index(min)) return { y: min.y, m: min.m };
  if (max && index(month) > index(max)) return { y: max.y, m: max.m };
  return month;
};
