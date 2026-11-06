export function getScenarioTestEnvironment(env = process.env) {
  const mongoUri = String(env.TEST_MONGODB_URI ?? "").trim();
  const staffEmail = String(env.TEST_STAFF_EMAIL ?? "").trim();
  const staffPassword = String(env.TEST_STAFF_PASSWORD ?? "");

  if (!mongoUri || !staffEmail || !staffPassword) {
    throw new Error("Set TEST_MONGODB_URI, TEST_STAFF_EMAIL, and TEST_STAFF_PASSWORD before running scenario tests.");
  }

  let parsedUri;
  try {
    parsedUri = new URL(mongoUri);
  } catch {
    throw new Error("TEST_MONGODB_URI must be a valid MongoDB connection URI.");
  }

  if (!["mongodb:", "mongodb+srv:"].includes(parsedUri.protocol)) {
    throw new Error("TEST_MONGODB_URI must use mongodb:// or mongodb+srv://.");
  }

  const databaseName = decodeURIComponent(parsedUri.pathname.replace(/^\/+/, "").split("/")[0] ?? "");
  if (!databaseName.toLowerCase().endsWith("_test")) {
    throw new Error("TEST_MONGODB_URI must target a disposable database whose name ends in _test.");
  }

  return {
    mongoUri,
    staffEmail: staffEmail.toLowerCase(),
    staffPassword,
    apiBase: String(env.TEST_API_BASE ?? "http://localhost:5000/api").replace(/\/$/, "")
  };
}
