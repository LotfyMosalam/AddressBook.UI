import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/stores/auth.store';
import { ApiError } from '../../../core/services/base-api.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  readonly isLoading = signal(false);
  readonly showPassword = signal(false);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get emailError(): string | null {
    const c = this.form.controls.email;
    if (!c.touched || c.valid) return null;
    if (c.hasError('required')) return 'Email is required';
    if (c.hasError('email')) return 'Enter a valid email address';
    return null;
  }

  get passwordError(): string | null {
    const c = this.form.controls.password;
    if (!c.touched || c.valid) return null;
    if (c.hasError('required')) return 'Password is required';
    if (c.hasError('minlength')) return 'Password must be at least 8 characters';
    return null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    const { email, password } = this.form.getRawValue();

    this.authStore.login({ email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toast.success('Welcome back!');
        this.router.navigate(['/addresses']);
      },
      error: (err: ApiError) => {
        this.isLoading.set(false);
        this.toast.error(err.message ?? 'Login failed. Please try again.');
      },
    });
  }
}
