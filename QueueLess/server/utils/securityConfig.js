const PLACEHOLDER_VALUE = /^(?:change_me|replace_this|placeholder)/i;

export function getSecurityConfig(env = process.env) {
  const jwtSecret = String(env.JWT_SECRET ?? "").trim();
  const staffEmail = String(env.STAFF_EMAIL ?? "").trim().toLowerCase();
  const staffPassword = String(env.STAFF_PASSWORD ?? "");
  const staffName = String(env.STAFF_NAME ?? "QueueLess Staff").trim() || "QueueLess Staff";

  const problems = [];
  if (jwtSecret.length < 32 || PLACEHOLDER_VALUE.test(jwtSecret)) {
    problems.push("JWT_SECRET must be a unique, non-placeholder value of at least 32 characters");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffEmail)) {
    problems.push("STAFF_EMAIL must be a valid email address");
  }
  if (staffPassword.length < 12 || PLACEHOLDER_VALUE.test(staffPassword)) {
    problems.push("STAFF_PASSWORD must be a unique, non-placeholder value of at least 12 characters");
  }

  if (problems.length > 0) {
    throw new Error(`Invalid security configuration: ${problems.join("; ")}.`);
  }

  return { jwtSecret, staffEmail, staffPassword, staffName };
}
