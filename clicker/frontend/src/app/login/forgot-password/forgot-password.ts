import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';

type ForgotPasswordStep = 'requestReset' | 'completeReset' | 'done';

@Component({
  selector: 'app-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly backToLogin = output<void>();

  protected readonly step = signal<ForgotPasswordStep>('requestReset');
  protected readonly isSubmitting = signal(false);
  protected readonly statusMessage = signal<string | null>(null);
  protected readonly isPasswordVisible = signal(false);

  protected readonly requestForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  protected readonly resetForm = this.formBuilder.nonNullable.group({
    token: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(8)]]
  });

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update(visible => !visible);
  }

  protected onRequestReset(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.statusMessage.set(null);

    const { email } = this.requestForm.getRawValue();

    this.authService.requestPasswordReset(email).then(result => {
      this.isSubmitting.set(false);

      // The backend always responds with the same generic message whether
      // or not the email exists, so this can't be used to discover which
      // emails have accounts. No email provider is wired up yet, so the
      // actual reset link is logged server-side rather than shown here,
      // see the comment above the /api/auth/forgot-password route.
      if (result.success) {
        this.step.set('completeReset');
        this.statusMessage.set(
          'If that email has an account, a reset link just got generated. Check with whoever runs the server for the link (or the server console, for now) and paste the code below.'
        );
      } else {
        this.statusMessage.set(result.error ?? 'Something went wrong.');
      }
    });
  }

  protected onCompleteReset(): void {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.statusMessage.set(null);

    const { token, newPassword } = this.resetForm.getRawValue();

    this.authService.resetPassword(token, newPassword).then(result => {
      this.isSubmitting.set(false);

      if (result.success) {
        this.step.set('done');
        this.statusMessage.set('Password changed. Head back and sign in with the new one.');
      } else {
        this.statusMessage.set(result.error ?? 'That reset link did not work.');
      }
    });
  }

  protected onBackToLogin(): void {
    this.backToLogin.emit();
  }
}
