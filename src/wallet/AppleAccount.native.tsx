import { useEffect, useState } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform, Text } from "react-native";

import { tr } from "../i18n";
import { getSupabase } from "../online/client";

const S = tr({
  ja: {
    noToken: "Appleの認証情報を受け取れませんでした。",
    failed: "Appleでログインできませんでした。設定を確認してください。",
  },
  en: {
    noToken: "Didn't receive sign-in details from Apple.",
    failed: "Couldn't sign in with Apple. Check your settings.",
  },
});

export function AppleAccount({ onSignedIn }: { onSignedIn: () => void }) {
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS === "ios") {
      void AppleAuthentication.isAvailableAsync()
        .then(setAvailable)
        .catch(() => {});
    }
  }, []);

  const signIn = async () => {
    setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      if (!credential.identityToken) throw new Error(S.noToken);
      const { error: authError } = await getSupabase().auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });
      if (authError) throw authError;
      onSignedIn();
    } catch (cause) {
      if ((cause as { code?: string }).code === "ERR_REQUEST_CANCELED") return;
      setError(S.failed);
    }
  };

  if (!available) return null;
  return (
    <>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={6}
        style={{ height: 44, width: "100%" }}
        onPress={() => void signIn()}
      />
      {error ? <Text style={{ color: "#a43128" }}>{error}</Text> : null}
    </>
  );
}

export async function appleAuthorizationCode(): Promise<string | null> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [],
  });
  return credential.authorizationCode ?? null;
}
