export function normalizeUserPair(
  a: bigint,
  b: bigint,
): { user1Id: bigint; user2Id: bigint } {
  if (a === b) {
    throw new Error('same user pair is not allowed');
  }

  return a < b ? { user1Id: a, user2Id: b } : { user1Id: b, user2Id: a };
}
