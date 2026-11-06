const PUBLIC_TOKEN_FIELDS = [
  'tokenNumber',
  'service',
  'status',
  'createdAt',
  'calledAt',
  'completedAt',
  'queueDate'
];

export function toPublicToken(token) {
  const source = token && typeof token.toObject === 'function' ? token.toObject() : token;
  return Object.fromEntries(
    PUBLIC_TOKEN_FIELDS
      .filter(field => source?.[field] !== undefined)
      .map(field => [field, source[field]])
  );
}
