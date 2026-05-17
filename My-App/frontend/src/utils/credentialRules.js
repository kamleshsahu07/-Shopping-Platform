export function validateEmailFormat(email) {
  if (typeof email !== "string") return false;
  const v = email.trim();
  if (!v) return false;
  // Basic “standard email” pattern. (UI already uses type="email" as well.)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function validatePassword(password) {
  if (typeof password !== "string") return false;
  // Password: 8-16 chars, at least one uppercase, at least one special
  const v = password;
  if (v.length < 8 || v.length > 16) return false;
  if (!/[A-Z]/.test(v)) return false;
  // Special char: anything that's not a letter/number/space
  if (!/[^A-Za-z0-9]/.test(v)) return false;
  return true;
}

export function getPasswordRuleSummary() {
  return {
    minChars: 8,
    maxChars: 16,
    requiresUppercase: true,
    requiresSpecial: true
  };
}

export function validateAddress(address) {
  // Requirement says: Address: Max 400 characters.
  if (typeof address !== "string") return false;
  return address.length <= 400;
}

export function validateUsernameMinMax(username) {
  // “Min 20 characters, Max 60 characters.” — applying to Name/Username field.
  if (typeof username !== "string") return false;
  const len = username.trim().length;
  return len >= 20 && len <= 60;
}

export function getRulesText() {
  return {
    name: "Name: min 20 chars, max 60 chars",
    email: "Email: valid email format (example@domain.com)",
    address: "Address: max 400 characters",
    password:
      "Password: 8-16 chars, at least 1 uppercase letter and 1 special character (e.g., Admin@123)"
  };
}
