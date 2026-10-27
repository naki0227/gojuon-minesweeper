// The picture shared with the result: the day's board in colors only, so
// it shows how the puzzle went without giving the answer letters away
// (🟦 a safe cell opened, 🟧 an answer letter found, white still closed).
import { forwardRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import { questionPrompt } from "../data/questions";
import { getBoardGrid } from "../game/board";
import { questionMineCharacters } from "../game/engine";
import { colors } from "../theme/colors";
import { HALLOWEEN, seasonOf } from "../theme/season";
import type { DailyPlay } from "./play";
import { shortDate } from "./dates";

type Props = { play: DailyPlay; streak: number };

export const DailyShareCard = forwardRef<View, Props>(function DailyShareCard(
  { play, streak },
  ref,
) {
  const night = seasonOf(play.date) === "halloween";
  const ink = night ? HALLOWEEN.text : colors.ink;
  const sub = night ? HALLOWEEN.sub : colors.muted;
  const mines = questionMineCharacters(play.question);
  const opened = new Set(play.opened);
  const result =
    play.phase === "solved" ? `正解！ ${play.moves.length}手` : "ギブアップ…";

  return (
    <View
      ref={ref}
      collapsable={false}
      style={[
        card.root,
        { backgroundColor: night ? HALLOWEEN.night : colors.background },
      ]}
    >
      <View style={card.head}>
        <Text style={[card.kicker, night && { color: HALLOWEEN.pumpkin }]}>
          {night ? "🎃 " : ""}今日の一問 {shortDate(play.date)}
        </Text>
        <Text style={[card.app, { color: sub }]}>五十音マインスイーパー</Text>
      </View>
      <Text style={[card.prompt, { color: ink }]}>
        お題：{questionPrompt(play.question)}
      </Text>
      <View style={card.board}>
        {getBoardGrid(play.question.language).map((row, r) => (
          <View key={r} style={card.row}>
            {row.map((char, c) => (
              <View
                key={c}
                style={[
                  card.cell,
                  !char && card.empty,
                  char && opened.has(char)
                    ? mines.has(char)
                      ? card.mine
                      : card.safe
                    : null,
                ]}
              />
            ))}
          </View>
        ))}
      </View>
      <Text style={[card.result, { color: ink }]}>
        {result}
        {streak > 1 ? `　🔥${streak}日連続` : ""}
      </Text>
      <Text style={[card.url, { color: sub }]}>minesweeper.enludus.com</Text>
    </View>
  );
});

const card = StyleSheet.create({
  root: {
    width: "100%",
    aspectRatio: 1.15,
    borderRadius: 14,
    padding: 16,
    gap: 8,
    justifyContent: "center",
  },
  head: { flexDirection: "row", justifyContent: "space-between" },
  kicker: { color: colors.primary, fontWeight: "900", fontSize: 13 },
  app: { fontWeight: "800", fontSize: 11 },
  prompt: { fontWeight: "900", fontSize: 18 },
  board: { gap: 4 },
  row: { flexDirection: "row", gap: 4 },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 5,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#c9d5df",
  },
  empty: { backgroundColor: "transparent", borderWidth: 0 },
  safe: { backgroundColor: colors.primary, borderColor: colors.primary },
  mine: { backgroundColor: colors.accent, borderColor: colors.accentStrong },
  result: { fontWeight: "900", fontSize: 16, textAlign: "center" },
  url: { fontWeight: "700", fontSize: 11, textAlign: "center" },
});
