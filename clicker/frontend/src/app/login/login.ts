import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // <-- Added ActivatedRoute here
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../core/services/auth.service';
import { ForgotPassword } from './forgot-password/forgot-password';

type AuthMode = 'signIn' | 'signUp';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, ForgotPassword],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly forgotPasswordRequested = output<void>();

  protected readonly mode = signal<AuthMode>('signIn');
  protected readonly isPasswordVisible = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly hasShakeError = signal(false);
  protected readonly statusMessage = signal<string | null>(null);
  
  protected referralCode: string | null = null;

  protected readonly authForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: [''],
    rememberMe: [false]
  });

  constructor() {
    // Capture the QR code from the URL immediately
    this.route.queryParams.subscribe(params => {
      if (params['ref']) {
        this.referralCode = params['ref'];
        this.statusMessage.set('Special birthday link detected! Log in to claim your VIP status.');
      }
    });
  }

  protected togglePasswordVisibility(): void {
    this.isPasswordVisible.update(visible => !visible);
  }

  protected switchMode(): void {
    this.mode.update(current => (current === 'signIn' ? 'signUp' : 'signIn'));
    this.statusMessage.set(null);
    this.authForm.patchValue({ confirmPassword: '' });
  }

  protected onForgotPassword(): void {
    this.forgotPasswordRequested.emit();
  }

  protected onSubmit(): void {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      this.triggerShake();
      this.statusMessage.set('Whoops. That combo is not it, chief.');
      return;
    }

    const { email, password, confirmPassword, rememberMe } = this.authForm.getRawValue();
    const currentMode = this.mode();

    if (currentMode === 'signUp' && password !== confirmPassword) {
      this.triggerShake();
      this.statusMessage.set('Those two passwords are having a disagreement.');
      return;
    }

    this.isSubmitting.set(true);
    this.statusMessage.set(null);

    // Pass the referralCode to the auth service
    const request =
      currentMode === 'signUp'
        ? this.authService.signUp(email, password, rememberMe, this.referralCode ?? undefined)
        : this.authService.logIn(email, password, rememberMe, this.referralCode ?? undefined);

    request.then(result => {
      this.isSubmitting.set(false);

      if (!result.success) {
        this.triggerShake();
        this.statusMessage.set(result.error ?? 'Something broke. Try again.');
        return;
      }

      void this.router.navigate(['/clicker']);
    });
  }

  private triggerShake(): void {
    this.hasShakeError.set(true);
    setTimeout(() => this.hasShakeError.set(false), 400);
  }
}