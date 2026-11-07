const MONGODB_PROTOCOLS = new Set(["mongodb:", "mongodb+srv:"]);

export function getMongoUri(env = process.env) {
  const mongoUri = String(env.MONGODB_URI ?? "").trim();

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required. Set an explicit MongoDB connection URI before starting QueueLess.");
  }

  let parsedUri;
  try {
    parsedUri = new URL(mongoUri);
  } catch {
    throw new Error("MONGODB_URI must be a valid MongoDB connection URI.");
  }

  if (!MONGODB_PROTOCOLS.has(parsedUri.protocol) || !parsedUri.hostname) {
    throw new Error("MONGODB_URI must use mongodb:// or mongodb+srv:// and include a host.");
  }

  return mongoUri;
}
