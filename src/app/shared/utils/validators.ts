import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function egyptianMobileValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const valid = /^(\+20|0020|0)1[0-2,5]\d{8}$/.test(control.value as string);
  return valid ? null : { egyptianMobile: true };
}

export function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const value = control.value as string;
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  const isLongEnough = value.length >= 8;

  if (hasUppercase && hasLowercase && hasNumber && hasSpecial && isLongEnough) {
    return null;
  }
  return { strongPassword: { hasUppercase, hasLowercase, hasNumber, hasSpecial, isLongEnough } };
}

export function passwordMatchValidator(passwordField: string, confirmField: string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const password = group.get(passwordField)?.value;
    const confirm = group.get(confirmField)?.value;
    return password === confirm ? null : { passwordMismatch: true };
  };
}

export function authPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasDigit = /\d/.test(value);
  if (hasUppercase && hasLowercase && hasDigit) return null;
  return { authPassword: { hasUppercase, hasLowercase, hasDigit } };
}
