import CryptoKit
import Foundation

// The App Group the app writes too (src/daily/widgetStore.ios.ts).
let appGroup = "group.com.naki0227.gojuonminesweeper"
let siteURL = "https://minesweeper.enludus.com"
let appURL = URL(string: "gojuonminesweeper://today")!

// /daily/<date>/widget.json, written by scripts/daily/widget.ts.
struct WidgetDay: Codable {
  let version: Int
  let date: String
  let prompt: String
  let rows: [[String?]]
  // "s2": a safe cell next to two answer letters; "m1": a letter found
  // once in the answer.
  let cells: [String: String]
  let opened: [String]
  let choices: [String]
  let answer: String
  let season: String?
}

// The same shapes as SavedPlay and Streak in the app (src/daily).
struct SavedPlay: Codable {
  var date: String
  var opened: [String]
  var moves: [String]  // "safe" | "mine" | "wrong" | "correct"
  var phase: String  // "playing" | "solved" | "gaveUp"
}

struct Streak: Codable {
  var lastSolved: String?
  var count: Int
  var best: Int
}

// Only the widgets use this: the words already tried and the last cell
// opened (shown on the Lock Screen).
struct WidgetMemo: Codable {
  var date: String
  var tried: [String]
  var last: String?
}

enum Keys {
  static let play = "daily.play"
  static let streak = "daily.streak"
  static let day = "widget.day"
  static let memo = "widget.memo"
}

// Values are JSON strings, as the app's ExtensionStorage reads them.
enum Store {
  static let defaults = UserDefaults(suiteName: appGroup)

  static func load<T: Decodable>(_ type: T.Type, _ key: String) -> T? {
    guard let text = defaults?.string(forKey: key), let data = text.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(type, from: data)
  }

  static func save<T: Encodable>(_ value: T, _ key: String) {
    guard let data = try? JSONEncoder().encode(value),
      let text = String(data: data, encoding: .utf8)
    else { return }
    defaults?.set(text, forKey: key)
  }
}

enum DailyDate {
  static let japan = TimeZone(identifier: "Asia/Tokyo")!

  private static func formatter() -> DateFormatter {
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.timeZone = japan
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter
  }

  // A new puzzle comes out every morning at 7:00 Japan time.
  static func current(_ now: Date = Date()) -> String {
    formatter().string(from: now.addingTimeInterval(-7 * 3600))
  }

  static func add(_ date: String, _ days: Int) -> String {
    let format = formatter()
    guard let day = format.date(from: date) else { return date }
    return format.string(from: day.addingTimeInterval(Double(days) * 86400))
  }

  static func nextRelease(_ now: Date = Date()) -> Date {
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = japan
    let seven = calendar.nextDate(
      after: now, matching: DateComponents(hour: 7, minute: 1), matchingPolicy: .nextTime)
    return seven ?? now.addingTimeInterval(3600)
  }

  // "2026-10-25" -> "10/25"
  static func short(_ date: String) -> String {
    let parts = date.split(separator: "-").compactMap { Int($0) }
    return parts.count == 3 ? "\(parts[1])/\(parts[2])" : date
  }
}

enum DayLoader {
  private static func fetch(_ date: String) async -> WidgetDay? {
    guard let url = URL(string: "\(siteURL)/daily/\(date)/widget.json") else { return nil }
    var request = URLRequest(url: url)
    request.cachePolicy = .reloadIgnoringLocalCacheData
    request.timeoutInterval = 10
    guard let result = try? await URLSession.shared.data(for: request),
      (result.1 as? HTTPURLResponse)?.statusCode == 200,
      let day = try? JSONDecoder().decode(WidgetDay.self, from: result.0),
      day.date == date, day.version == 1
    else { return nil }
    Store.save(day, Keys.day)
    return day
  }

  static func cached() -> WidgetDay? {
    Store.load(WidgetDay.self, Keys.day)
  }

  // Today's puzzle, or yesterday's until today's is online. Downloads only
  // when the saved one is not today's.
  static func current() async -> WidgetDay? {
    let today = DailyDate.current()
    let saved = cached()
    if saved?.date == today { return saved }
    if let day = await fetch(today) { return day }
    if saved?.date == DailyDate.add(today, -1) { return saved }
    return await fetch(DailyDate.add(today, -1)) ?? saved
  }
}

// The day's game as both the app and the widgets play it
// (src/daily/play.ts).
struct DailyGame {
  let day: WidgetDay
  var play: SavedPlay
  var memo: WidgetMemo

  init(day: WidgetDay) {
    self.day = day
    if let saved = Store.load(SavedPlay.self, Keys.play), saved.date == day.date {
      play = saved
    } else {
      play = SavedPlay(date: day.date, opened: day.opened, moves: [], phase: "playing")
    }
    if let saved = Store.load(WidgetMemo.self, Keys.memo), saved.date == day.date {
      memo = saved
    } else {
      memo = WidgetMemo(date: day.date, tried: [], last: nil)
    }
  }

  var playing: Bool { play.phase == "playing" }
  var solved: Bool { play.phase == "solved" }

  func isOpen(_ cell: String) -> Bool { play.opened.contains(cell) }
  func isMine(_ cell: String) -> Bool { day.cells[cell]?.hasPrefix("m") ?? false }
  func number(_ cell: String) -> Int { Int(day.cells[cell]?.dropFirst() ?? "") ?? 0 }

  private func neighbors(_ cell: String) -> [String] {
    for (row, line) in day.rows.enumerated() {
      guard let column = line.firstIndex(where: { $0 == cell }) else { continue }
      var result: [String] = []
      for dr in -1...1 {
        for dc in -1...1 where dr != 0 || dc != 0 {
          let r = row + dr
          let c = column + dc
          guard day.rows.indices.contains(r), day.rows[r].indices.contains(c),
            let next = day.rows[r][c]
          else { continue }
          result.append(next)
        }
      }
      return result
    }
    return []
  }

  // Opens a cell; a safe cell with no answer letters around opens its
  // neighbors too, as in the game.
  mutating func open(_ cell: String) {
    guard playing, !isOpen(cell), day.cells[cell] != nil else { return }
    memo.last = cell
    if isMine(cell) {
      play.opened.append(cell)
      play.moves.append("mine")
      return
    }
    var seen = Set(play.opened)
    var queue = [cell]
    var index = 0
    while index < queue.count {
      let current = queue[index]
      index += 1
      if seen.contains(current) || isMine(current) { continue }
      seen.insert(current)
      play.opened.append(current)
      if number(current) == 0 { queue.append(contentsOf: neighbors(current)) }
    }
    play.moves.append("safe")
  }

  // The Lock Screen's hint: one safe cell not open yet.
  mutating func openHint() {
    let closed = day.rows.joined().compactMap { $0 }.filter { !isOpen($0) && !isMine($0) }
    if let cell = closed.randomElement() { open(cell) }
  }

  static func hash(_ date: String, _ word: String) -> String {
    SHA256.hash(data: Data("\(date):\(word)".utf8)).map { String(format: "%02x", $0) }.joined()
  }

  mutating func choose(_ word: String) {
    guard playing, !memo.tried.contains(word) else { return }
    if DailyGame.hash(day.date, word) == day.answer {
      play.phase = "solved"
      play.moves.append("correct")
      recordSolve()
    } else {
      play.moves.append("wrong")
      memo.tried.append(word)
    }
  }

  private func recordSolve() {
    var streak = Store.load(Streak.self, Keys.streak) ?? Streak(lastSolved: nil, count: 0, best: 0)
    guard streak.lastSolved != day.date else { return }
    streak.count = streak.lastSolved == DailyDate.add(day.date, -1) ? streak.count + 1 : 1
    streak.lastSolved = day.date
    streak.best = max(streak.best, streak.count)
    Store.save(streak, Keys.streak)
  }

  func save() {
    Store.save(play, Keys.play)
    Store.save(memo, Keys.memo)
  }

  // Days in a row, still alive until the end of the day after the last
  // solve (src/daily/streak.ts).
  static func streak() -> Int {
    guard let streak = Store.load(Streak.self, Keys.streak), let last = streak.lastSolved
    else { return 0 }
    let today = DailyDate.current()
    return last == today || last == DailyDate.add(today, -1) ? streak.count : 0
  }

  // "🟦🟦🟧❌✅" (src/daily/play.ts movesLine)
  var movesLine: String {
    let emoji = ["safe": "🟦", "mine": "🟧", "wrong": "❌", "correct": "✅"]
    return play.moves.compactMap { emoji[$0] }.joined()
  }
}
