import SwiftUI
import WidgetKit

// The small and Lock Screen widgets: the prompt and the streak, and on
// the Lock Screen a button that opens one safe cell as a hint.
struct GlanceView: View {
  @Environment(\.widgetFamily) private var family
  let entry: DailyEntry

  var body: some View {
    switch family {
    case .accessoryInline: inline
    case .accessoryCircular: circular
    case .accessoryRectangular: rectangular
    default: small
    }
  }

  private var game: DailyGame? { entry.game }

  private var streakText: String { entry.streak > 0 ? "🔥\(entry.streak)" : "" }

  // What the last opened cell showed: "「か」のまわりに2つ".
  private var lastHint: String {
    guard let game, let cell = game.memo.last else { return "数字＝まわりの答えの文字の数" }
    if game.isMine(cell) { return "「\(cell)」は答えにある！" }
    return "「\(cell)」のまわりに\(game.number(cell))つ"
  }

  private var inline: some View {
    let state = game.map { $0.solved ? "正解✅" : $0.day.prompt } ?? ""
    return Text("\(streakText) 今日の一問 \(state)")
      .containerBackground(for: .widget) { Color.clear }
      .widgetURL(appURL)
  }

  private var circular: some View {
    ZStack {
      AccessoryWidgetBackground()
      VStack(spacing: 0) {
        Text(game?.solved == true ? "✅" : "🔥").font(.system(size: 14))
        Text("\(entry.streak)").font(.system(size: 20, weight: .bold))
      }
    }
    .containerBackground(for: .widget) { Color.clear }
    .widgetURL(appURL)
  }

  private var rectangular: some View {
    VStack(alignment: .leading, spacing: 1) {
      Text("\(streakText) \(game?.day.prompt ?? "今日の一問")")
        .font(.headline)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
      if let game, game.playing {
        Text(lastHint).font(.caption).lineLimit(1).minimumScaleFactor(0.7)
        Button(intent: OpenHintIntent()) {
          Label("1マス開ける", systemImage: "hand.tap.fill").font(.caption.bold())
        }
        .buttonStyle(.plain)
      } else if let game {
        Text(game.solved ? "正解！" : "また明日！").font(.caption.bold())
        Text(game.movesLine).font(.caption2).lineLimit(1).minimumScaleFactor(0.5)
      } else {
        Text("アプリを開いてね").font(.caption)
      }
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .containerBackground(for: .widget) { Color.clear }
    .widgetURL(appURL)
  }

  private var small: some View {
    let theme = Theme.of(game?.day.season)
    return VStack(alignment: .leading, spacing: 4) {
      Text("今日の一問").font(.caption.bold()).foregroundStyle(theme.accent)
      Text(game?.day.prompt ?? "アプリを開いてね")
        .font(.headline)
        .foregroundStyle(theme.ink)
        .lineLimit(2)
        .minimumScaleFactor(0.7)
      Spacer(minLength: 0)
      if let game {
        Text(game.solved ? "正解！✅" : game.playing ? "あいたマス \(game.play.opened.count)" : "また明日！")
          .font(.subheadline.bold())
          .foregroundStyle(theme.ink)
      }
      Text(entry.streak > 0 ? "🔥\(entry.streak)日連続" : "毎朝7時に新しい問題")
        .font(.caption)
        .foregroundStyle(theme.sub)
    }
    .frame(maxWidth: .infinity, alignment: .leading)
    .containerBackground(theme.background, for: .widget)
    .widgetURL(appURL)
  }
}

struct DailyGlanceWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "DailyGlance", provider: DailyProvider()) { entry in
      GlanceView(entry: entry)
    }
    .configurationDisplayName("今日の一問")
    .description("お題と連続日数。ロック画面ではヒントを1マスずつ開けられます。")
    .supportedFamilies([.systemSmall, .accessoryRectangular, .accessoryInline, .accessoryCircular])
  }
}

@main
struct DailyWidgets: WidgetBundle {
  var body: some Widget {
    DailyBoardWidget()
    DailyGlanceWidget()
  }
}
