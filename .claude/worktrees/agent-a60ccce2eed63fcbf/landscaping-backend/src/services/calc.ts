type Inputs = Record<string, number>;

export function evalFormula(formula: string, inputs: Inputs): number {
  // allow tokens: numbers, + - * / ( ) and known input keys
  const allowed = Object.keys(inputs).concat(["+", "-", "*", "/", "(", ")", ".", " "]);
  // replace known keys w/ numeric literals
  let expr = formula;
  for (const k of Object.keys(inputs)) {
    const re = new RegExp(`\\b${k}\\b`, "g");
    expr = expr.replace(re, String(inputs[k]));
  }
  // naive safety: block unknown alphabetic tokens
  if (/[a-zA-Z_]/.test(expr)) throw new Error("Invalid formula");
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${expr});`)();
  return Number.isFinite(result) ? result : 0;
}

export function applyWaste(qty: number, wastePct: number) {
  return qty * (1 + wastePct);
}
