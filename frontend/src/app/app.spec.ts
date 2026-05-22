import { TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, Router } from '@angular/router';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter(routes),
        provideAnimationsAsync(),
        providePrimeNG({
          theme: {
            preset: Aura
          }
        })
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the login title', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    fixture.detectChanges();
    await router.navigateByUrl('/login');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Almacen Pajaro Azul');
  });

  it('should navigate to home from the sign in button', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    fixture.detectChanges();
    await router.navigateByUrl('/login');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    const signInButton = compiled.querySelector('.login-button') as HTMLButtonElement;

    signInButton.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/home');
    expect(compiled.querySelector('h1')?.textContent).toContain('Overview');
  });
});
