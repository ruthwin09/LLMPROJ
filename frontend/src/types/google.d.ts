// TypeScript declarations for Google Sign-In for Web (GSI) SDK
// Loaded via <script src="https://accounts.google.com/gsi/client">

interface CredentialResponse {
  /** The Google ID Token (JWT) — send this to your backend for verification */
  credential: string;
  select_by: string;
  clientId: string;
}

interface GsiButtonConfiguration {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: string | number;
  locale?: string;
}

interface IdConfiguration {
  client_id: string;
  callback?: (response: CredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  context?: 'signin' | 'signup' | 'use';
  ux_mode?: 'popup' | 'redirect';
  login_uri?: string;
  native_callback?: (response: CredentialResponse) => void;
  itp_support?: boolean;
}

interface PromptNotification {
  isDisplayMoment(): boolean;
  isDisplayed(): boolean;
  isNotDisplayed(): boolean;
  getNotDisplayedReason(): string;
  isSkippedMoment(): boolean;
  getSkippedReason(): string;
  isDismissedMoment(): boolean;
  getDismissedReason(): string;
  getMomentType(): string;
}

interface GoogleAccountsId {
  initialize(idConfiguration: IdConfiguration): void;
  prompt(momentListener?: (promptNotification: PromptNotification) => void): void;
  renderButton(parent: HTMLElement, options: GsiButtonConfiguration, clickHandler?: () => void): void;
  disableAutoSelect(): void;
  storeCredential(credential: { id: string; password: string }, callback?: () => void): void;
  cancel(): void;
  revoke(hint: string, callback: (done: { successful: boolean; error: string }) => void): void;
}

interface Google {
  accounts: {
    id: GoogleAccountsId;
    oauth2: {
      initTokenClient(config: object): { requestAccessToken: (overrides?: object) => void };
      initCodeClient(config: object): { requestCode: () => void };
    };
  };
}

declare global {
  interface Window {
    google?: Google;
    // Callback invoked by Google GSI after sign-in (used with data-callback attribute)
    handleGoogleCredential?: (response: CredentialResponse) => void;
  }
}

export {};
