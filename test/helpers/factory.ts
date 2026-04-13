export function createSignupPayload(overrides: Partial<{
  email: string;
  password: string;
  username: string;
}> = {}) {
  const suffix = Date.now();

  return {
    email: overrides.email ?? `user-${suffix}@example.com`,
    password: overrides.password ?? '12345678',
    username: overrides.username ?? `user_${suffix}`,
  };
}
