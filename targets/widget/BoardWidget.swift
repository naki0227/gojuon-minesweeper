import SwiftUI
import WidgetKit

struct DailyEntry: TimelineEntry {
  let date: Date
  let game: DailyGame?
  let streak: Int
}

struct DailyProvider: TimelineProvider {
  private func entry(_ day: WidgetDay?) -> DailyEntry {
    DailyEntry(date: Date(), game: day.map { DailyGame(day: $0) }, streak: DailyGame.streak())
  }

  func placeholder(in context: Context) -> DailyEntry {
    entry(DayLoader.cached())
  }

  func getSnapshot(in context: Context, completion: @escaping (DailyEntry) -> Void) {
    if let day = DayLoader.cached() {
      completion(entry(day))
      return
    }
    Task {
      let day = await DayLoader.current()
      completion(entry(day))
    }
  }

  // Redraws at the next 7:00 for the new puzzle; until today's is online,
  // tries again every 15 minutes.
  func getTimeline(in context: Context, completion: @escaping (Timeline<DailyEntry>) -> Void) {
    Task {
      let day = await DayLoader.current()
      let next =
        day?.date == DailyDate.current()
        ? DailyDate.nextRelease() : Date().addingTimeInterval(15 * 60)
      completion(Timeline(entries: [entry(day)], policy: .after(next)))
    }
  }
}

struct NoPuzzleView: View {
  var body: some View {
    VStack(spacing: 6) {
      Text("今日の一問").font(.headline)
      Text("アプリを開いてね").font(.caption).foregroundStyle(.secondary)
    }
    .containerBackground(Theme.plain.background, for: .widget)
    .widgetURL(appURL)
  }
}

struct CellView: View {
  let game: DailyGame
  let cell: String?
  let theme: Theme

  var body: some View {
    Group {
      if let cell {
        if game.isOpen(cell) {
          opened(cell)
        } else if game.playing {
          Button(intent: OpenCellIntent(cell: cell)) { closed(cell) }
            .buttonStyle(.plain)
        } else {
          closed(cell)
        }
      } else {
        Color.clear
      }
    }
    .frame(maxWidth: .infinity)
    .aspectRatio(1, contentMode: .fit)
  }

  private var shape: RoundedRectangle { RoundedRectangle(cornerRadius: 6, style: .continuous) }

  private func closed(_ cell: String) -> some View {
    Text(cell)
      .font(.system(size: 14, weight: .heavy))
      .foregroundStyle(theme.closedInk)
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .background(theme.closed, in: shape)
      .overlay(shape.strokeBorder(theme.closedEdge, lineWidth: 1))
  }

  @ViewBuilder
  private func opened(_ cell: String) -> some View {
    if game.isMine(cell) {
      ZStack(alignment: .bottomTrailing) {
        Text(cell)
          .font(.system(size: 14, weight: .black))
          .foregroundStyle(.white)
          .frame(maxWidth: .infinity, maxHeight: .infinity)
        if game.number(cell) > 1 {
          Text("\(game.number(cell))")
            .font(.system(size: 8, weight: .black))
            .foregroundStyle(.white)
            .padding(2)
        }
      }
      .background(theme.mine, in: shape)
    } else {
      let n = game.number(cell)
      Text(n == 0 ? cell : "\(n)")
        .font(.system(size: n == 0 ? 11 : 16, weight: .black))
        .foregroundStyle(n == 0 ? theme.safeInk.opacity(0.6) : theme.count(n))
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(theme.safe, in: shape)
    }
  }
}

// The Home Screen board: open cells by tapping them, then pick the
// answer from four words.
struct BoardView: View {
  let game: DailyGame
  let streak: Int

  private var theme: Theme { Theme.of(game.day.season) }

  var body: some View {
    VStack(alignment: .leading, spacing: 8) {
      header
      VStack(spacing: 3) {
        ForEach(game.day.rows.indices, id: \.self) { row in
          HStack(spacing: 3) {
            ForEach(game.day.rows[row].indices, id: \.self) { column in
              CellView(game: game, cell: game.day.rows[row][column], theme: theme)
            }
          }
        }
      }
      if game.playing { choices } else { result }
    }
    .containerBackground(theme.background, for: .widget)
    .widgetURL(appURL)
  }

  private var title: String {
    let mark = game.day.season == "halloween" ? "🎃 " : ""
    return mark + "今日の一問 " + DailyDate.short(game.day.date)
  }

  private var header: some View {
    HStack(alignment: .firstTextBaseline) {
      VStack(alignment: .leading, spacing: 1) {
        Text(title)
          .font(.caption.bold())
          .foregroundStyle(theme.accent)
        Text("お題：\(game.day.prompt)")
          .font(.headline)
          .foregroundStyle(theme.ink)
          .lineLimit(1)
          .minimumScaleFactor(0.7)
      }
      Spacer(minLength: 4)
      if streak > 0 {
        Text("🔥\(streak)").font(.headline).foregroundStyle(theme.ink)
      }
    }
  }

  private var choices: some View {
    let words = game.day.choices
    let rows = stride(from: 0, to: words.count, by: 2).map { Array(words[$0..<min($0 + 2, words.count)]) }
    return VStack(spacing: 5) {
      Text(game.play.moves.isEmpty ? "数字＝まわりにある答えの文字の数" : game.movesLine)
        .font(.caption2)
        .foregroundStyle(theme.sub)
        .lineLimit(1)
      ForEach(rows.indices, id: \.self) { index in
        HStack(spacing: 6) {
          ForEach(rows[index], id: \.self) { word in
            choice(word)
          }
        }
      }
    }
  }

  private func choice(_ word: String) -> some View {
    let tried = game.memo.tried.contains(word)
    return Button(intent: ChooseAnswerIntent(word: word)) {
      Text(word)
        .font(.subheadline.bold())
        .strikethrough(tried)
        .lineLimit(1)
        .minimumScaleFactor(0.6)
        .foregroundStyle(theme.choiceInk)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 7)
        .background(theme.choice.opacity(tried ? 0.35 : 1), in: RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
    .buttonStyle(.plain)
    .disabled(tried)
  }

  private var result: some View {
    VStack(spacing: 3) {
      Text(game.solved ? "正解！🎉" : "また明日！")
        .font(.title3.bold())
        .foregroundStyle(theme.ink)
      Text(game.movesLine).font(.caption).lineLimit(1).minimumScaleFactor(0.5)
      Text("アプリで結果をシェア ›").font(.caption.bold()).foregroundStyle(theme.accent)
    }
    .frame(maxWidth: .infinity)
  }
}

struct BoardEntryView: View {
  let entry: DailyEntry

  var body: some View {
    if let game = entry.game {
      BoardView(game: game, streak: entry.streak)
    } else {
      NoPuzzleView()
    }
  }
}

struct DailyBoardWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "DailyBoard", provider: DailyProvider()) { entry in
      BoardEntryView(entry: entry)
    }
    .configurationDisplayName("今日の一問")
    .description("マスを開けて推理して、4つの中から答えを選ぼう。")
    .supportedFamilies([.systemLarge])
  }
}
