const norm = (v) => String(v || "").trim();

export function isRequired(value) {
  return norm(value).length > 0;
}

export function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(norm(email));
}

export function minLen(value, n) {
  return norm(value).length >= n;
}
