function getExpirationStatus(nextDueDate, warningDays = Number(process.env.EXPIRATION_WARNING_DAYS) || 5) {
  if (!nextDueDate) return 'no_payment';

  const now = new Date();
  const diffDays = (new Date(nextDueDate) - now) / (1000 * 60 * 60 * 24);

  if (diffDays < 0) return 'expired';
  if (diffDays <= warningDays) return 'expiring_soon';
  return 'active';
}

module.exports = { getExpirationStatus };
