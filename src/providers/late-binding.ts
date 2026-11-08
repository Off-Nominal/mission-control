// Copying a `let` into an object stores the value at that moment. These
// readers are consulted on each access, so a client created during boot is
// visible to services that start later.
export function withLateBindings<T extends object>(
  values: T,
  reads: Partial<{ [K in keyof T]: () => T[K] }>,
): T {
  const target = { ...values };

  for (const key of Object.keys(reads) as (keyof T)[]) {
    const read = reads[key];
    if (!read) continue;

    Object.defineProperty(target, key, {
      enumerable: true,
      configurable: true,
      get: read,
    });
  }

  return target;
}
