import SwiftUI

extension Color {
  init(hex: UInt32) {
    self.init(
      red: Double((hex >> 16) & 0xff) / 255,
      green: Double((hex >> 8) & 0xff) / 255,
      blue: Double(hex & 0xff) / 255)
  }
}

// The app's colors (src/theme/colors.ts, src/components/tileStyles.ts),
// and the Halloween night (src/theme/season.ts) on its dates.
struct Theme {
  let background: Color
  let ink: Color
  let sub: Color
  let accent: Color
  let closed: Color
  let closedInk: Color
  let closedEdge: Color
  let safe: Color
  let safeInk: Color
  let mine: Color
  let choice: Color
  let choiceInk: Color

  static let plain = Theme(
    background: Color(hex: 0xf7fafc), ink: Color(hex: 0x102433), sub: Color(hex: 0x7b8992),
    accent: Color(hex: 0x3388b0), closed: .white, closedInk: Color(hex: 0x152534),
    closedEdge: Color(hex: 0xbccbd6), safe: Color(hex: 0xe6edf2), safeInk: Color(hex: 0x8696a1),
    mine: Color(hex: 0xe98a2f), choice: Color(hex: 0x3388b0), choiceInk: .white)

  static let halloween = Theme(
    background: Color(hex: 0x21173a), ink: Color(hex: 0xfff7ec), sub: Color(hex: 0xd8c8f0),
    accent: Color(hex: 0xf08a24), closed: Color(hex: 0xfff7ec), closedInk: Color(hex: 0x21173a),
    closedEdge: Color(hex: 0x8e7ab8), safe: Color(hex: 0x3a2458), safeInk: Color(hex: 0xd8c8f0),
    mine: Color(hex: 0xf08a24), choice: Color(hex: 0x2b1d47), choiceInk: Color(hex: 0xfff7ec))

  static func of(_ season: String?) -> Theme {
    season == "halloween" ? .halloween : .plain
  }

  // Colors for the number of answer letters around an open cell.
  func count(_ n: Int) -> Color {
    let colors: [UInt32] = [0x9aa7b0, 0x3388b0, 0x2f9e6a, 0xe97817]
    return n < colors.count ? Color(hex: colors[n]) : Color(hex: 0xc2410c)
  }
}
