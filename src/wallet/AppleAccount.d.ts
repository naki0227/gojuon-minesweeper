export declare function AppleAccount(props: {
  onSignedIn: () => void;
}): import("react").ReactNode;
// Asks Apple for a fresh authorization code so the server can revoke the
// Sign in with Apple tokens on account deletion. Null if unavailable.
export declare function appleAuthorizationCode(): Promise<string | null>;
