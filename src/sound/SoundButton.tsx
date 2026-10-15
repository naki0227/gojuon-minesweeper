import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useState } from "react";
import { Platform, StyleSheet, Switch, Text, View } from "react-native";

import { Popup } from "../components/Popup";
import { colors } from "../theme/colors";
import { setSoundSettings, useSoundSettings } from "./soundSettings";
import { Pressable } from "../components/TapPressable";
import { tr } from "../i18n";

const S = tr({
  ja: {
    settings: "サウンド設定",
    title: "サウンド",
    effects: "効果音",
    music: "BGM",
    silentNote: "マナーモード中は鳴りません。",
    close: "閉じる",
  },
  en: {
    settings: "Sound settings",
    title: "Sound",
    effects: "Sound effects",
    music: "Music",
    silentNote: "No sound while your phone is on silent.",
    close: "Close",
  },
});

// A speaker icon that opens switches for sound effects and music.
export function SoundButton() {
  const settings = useSoundSettings();
  const [open, setOpen] = useState(false);
  const on = settings.effects || settings.music;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={S.settings}
        onPress={() => setOpen(true)}
        hitSlop={10}
      >
        <MaterialIcons
          name={on ? "volume-up" : "volume-off"}
          size={20}
          color={colors.help}
        />
      </Pressable>
      <Popup visible={open} onDismiss={() => setOpen(false)}>
        <View style={styles.body}>
          <Text style={styles.title}>{S.title}</Text>
          <Row
            label={S.effects}
            value={settings.effects}
            onChange={(effects) => setSoundSettings({ effects })}
          />
          <Row
            label={S.music}
            value={settings.music}
            onChange={(music) => setSoundSettings({ music })}
          />
          {Platform.OS === "ios" ? (
            <Text style={styles.note}>{S.silentNote}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => setOpen(false)}
            style={styles.close}
          >
            <Text style={styles.closeText}>{S.close}</Text>
          </Pressable>
        </View>
      </Popup>
    </>
  );
}

function Row({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.primary, false: colors.line }}
        thumbColor={colors.white}
        // react-native-web colors the "on" thumb with activeThumbColor.
        {...{ activeThumbColor: colors.white }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 14 },
  title: { color: colors.ink, fontSize: 18, fontWeight: "900" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  label: { color: colors.ink, fontSize: 16, fontWeight: "700" },
  note: { color: colors.muted, fontSize: 12 },
  close: { alignSelf: "flex-end", paddingVertical: 6 },
  closeText: { color: colors.primary, fontSize: 15, fontWeight: "800" },
});
