import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';
import { ApiError } from '../../../core/services/base-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { UserRole } from '../../../shared/models/auth.models';
import { authPasswordValidator, passwordMatchValidator } from '../../../shared/utils/validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly isLoading = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), authPasswordValidator]],
      confirmPassword: ['', [Validators.required]],
      role: this.fb.control<UserRole>('User', { validators: [Validators.required] }),
    },
    { validators: passwordMatchValidator('password', 'confirmPassword') },
  );

  // ── Error getters ──────────────────────────────────────────────────────────

  get emailError(): string | null {
    const c = this.form.controls.email;
    if (!c.touched || c.valid) return null;
    if (c.hasError('required')) return 'Email is required';
    if (c.hasError('email')) return 'Enter a valid email address';
    return null;
  }

  get passwordError(): string | null {
    const c = this.form.controls.password;
    if (!c.touched) return null;
    if (c.hasError('required')) return 'Password is required';
    if (c.hasError('minlength')) return 'Password must be at least 8 characters';
    return null;
  }

  get confirmPasswordError(): string | null {
    const c = this.form.controls.confirmPassword;
    if (!c.touched) return null;
    if (c.hasError('required')) return 'Please confirm your password';
    if (this.form.hasError('passwordMismatch')) return 'Passwords do not match';
    return null;
  }

  // ── Password strength hints ────────────────────────────────────────────────

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.form.controls.password.value);
  }

  get hasLowercase(): boolean {
    return /[a-z]/.test(this.form.controls.password.value);
  }

  get hasDigit(): boolean {
    return /\d/.test(this.form.controls.password.value);
  }

  get hasMinLength(): boolean {
    return this.form.controls.password.value.length >= 8;
  }

  get showPasswordHints(): boolean {
    return (
      this.form.controls.password.touched &&
      this.form.controls.password.hasError('authPassword')
    );
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    const { email, password, role } = this.form.getRawValue();

    this.authStore.register({ email, password, role }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.success('Account created! Welcome to Address Book.');
        this.router.navigate(['/addresses']);
      },
      error: (err: ApiError) => {
        this.isLoading.set(false);
        if (err.errors) {
          Object.values(err.errors)
            .flat()
            .forEach((msg) => this.toast.error(msg));
        } else {
          this.toast.error(err.message ?? 'Registration failed. Please try again.');
        }
      },
    });
  }
}
