export const ACTIVE_SERVICES = [
  'General Enquiry',
  'Exam Section',
  'Accounts',
  'Library',
  'College Canteen',
  'Idea Lab'
];

export const HISTORICAL_SERVICES = [
  'Student Office',
  'Laboratory'
];

export const ALL_SERVICES = [...ACTIVE_SERVICES, ...HISTORICAL_SERVICES];

export const calculateEstimatedWaitMinutes = (waitingAhead, servingToken, avgMinutes = 5) => {
  if (waitingAhead === 0 && !servingToken) {
    return 0;
  }

  let servingRemaining = 0;
  if (servingToken) {
    if (servingToken.calledAt) {
      const elapsedMinutes = Math.floor((Date.now() - new Date(servingToken.calledAt).getTime()) / 60000);
      servingRemaining = Math.max(1, avgMinutes - Math.max(0, elapsedMinutes));
    } else {
      servingRemaining = avgMinutes;
    }
  }

  const total = servingRemaining + (waitingAhead * avgMinutes);
  return Math.max(0, total);
};
