import AppIntents
import WidgetKit

// The widgets' buttons. Each changes the saved game; WidgetKit then
// redraws the widgets, and the app picks the game up when it opens.
private func update(_ change: (inout DailyGame) -> Void) {
  guard let day = DayLoader.cached() else { return }
  var game = DailyGame(day: day)
  change(&game)
  game.save()
}

struct OpenCellIntent: AppIntent {
  static var title: LocalizedStringResource = "マスを開ける"
  static var isDiscoverable = false

  @Parameter(title: "マス")
  var cell: String

  init() {}

  init(cell: String) {
    self.cell = cell
  }

  func perform() async throws -> some IntentResult {
    update { $0.open(cell) }
    return .result()
  }
}

struct ChooseAnswerIntent: AppIntent {
  static var title: LocalizedStringResource = "答えを選ぶ"
  static var isDiscoverable = false

  @Parameter(title: "答え")
  var word: String

  init() {}

  init(word: String) {
    self.word = word
  }

  func perform() async throws -> some IntentResult {
    update { $0.choose(word) }
    return .result()
  }
}

struct OpenHintIntent: AppIntent {
  static var title: LocalizedStringResource = "1マス開ける"
  static var isDiscoverable = false

  func perform() async throws -> some IntentResult {
    update { $0.openHint() }
    return .result()
  }
}
