export type AuthValues = { fullName: string; email: string; password: string; confirmPassword: string };
export function validateAuth(values: AuthValues, register: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  if (register && !values.fullName.trim()) errors.fullName = "Enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = "Enter a valid email address.";
  if (!values.password) errors.password = "Enter your password.";
  else if (register && values.password.length < 8) errors.password = "Use at least 8 characters.";
  if (register && !values.confirmPassword) errors.confirmPassword = "Confirm your password.";
  else if (register && values.confirmPassword !== values.password) errors.confirmPassword = "Passwords do not match.";
  return errors;
}
