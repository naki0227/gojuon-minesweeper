import { useEffect, useState } from "react";
import * as AppleAuthentication from "expo-apple-authentication";
import { Platform, Text } from "react-native";

import { getSupabase } from "../online/client";

export function AppleAccount({ onSignedIn }: { onSignedIn: () => void }) {
  const [available, setAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (Platform.OS === "ios") {
      void AppleAuthentication.isAvailableAsync().then(setAvailable).catch(() => {});
    }
  }, []);

  const signIn = async () => {
    setError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error("Appleの認証情報を受け取れませんでした。");
      const { error: authError } = await getSupabase().auth.signInWithIdToken({
        provider: "apple",
        token: credential.identityToken,
      });
      if (authError) throw authError;
      onSignedIn();
    } catch (cause) {
      if ((cause as { code?: string }).code === "ERR_REQUEST_CANCELED") return;
      setError("Appleでログインできませんでした。設定を確認してください。");
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