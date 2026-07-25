import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly isPasswordVisible = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly hasShakeError = signal(false);
  protected readonly statusMessage = signal<string | null>(null);

  protected readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update(visible => !visible);
  }

  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.triggerShake();
      this.statusMessage.set("Whoops. That combo is not it, chief.");
      return;
    }

    this.isSubmitting.set(true);
    this.statusMessage.set(null);

    // Placeholder for the real auth call. Swap this timeout for your
    // actual AuthService request, then route or emit an output on success.
    setTimeout(() => {
      this.isSubmitting.set(false);
      this.statusMessage.set('Nice. The vault door is opening.');
    }, 1200);
  }

  private triggerShake(): void {
    this.hasShakeError.set(true);
    setTimeout(() => this.hasShakeError.set(false), 400);
  }
}