export function toInt(value: unknown, fieldName: string): number {
    const n = Number(value);
    if (!Number.isInteger(n)) {
      throw Object.assign(new Error(`${fieldName} must be an integer`), { status: 400 });
    }
    return n;
  }
  
  export function toNumber(value: unknown, fieldName: string): number {
    const n = Number(value);
    if (!Number.isFinite(n)) {
      throw Object.assign(new Error(`${fieldName} must be a number`), { status: 400 });
    }
    return n;
  }
  