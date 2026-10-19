// The stream's screen (1280x720), meant for an OBS browser source. The
// shell polls /view for the current frame and plays the host's voice when a
// new line comes in.
import { getBoardGrid } from "../../src/game/board";
import { colors } from "../../src/theme/colors";
import { tileCss, tileHtml } from "../daily/card";
import { escapeHtml } from "../daily/html";
import { answerLength, roundPrompt } from "./round";
import { topScores, type Session } from "./session";

const CSS = `*{box-sizing:border-box;margin:0}
body{width:1280px;height:720px;overflow:hidden;background:linear-gradient(170deg,${colors.primarySoft},${colors.background} 45%);
font-family:"Hiragino Sans","Noto Sans CJK JP","Noto Sans JP","Yu Gothic UI","Meiryo",sans-serif;color:${colors.ink}}
#view{position:absolute;inset:0;padding:36px 44px;display:flex;gap:40px}
.board{width:640px;flex:none;align-self:center;display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:6px}
${tileCss(0.62)}
.side{flex:1;display:flex;flex-direction:column;gap:18px;min-width:0}
.no{font-size:24px;font-weight:900;color:${colors.primary}}
.prompt{font-size:52px;font-weight:900;line-height:1.1}
.slots{display:flex;gap:8px}
.slots span{width:44px;height:44px;border-radius:10px;background:${colors.accent};color:#fff;font-size:28px;font-weight:900;display:flex;align-items:center;justify-content:center}
.how{font-size:19px;font-weight:700;color:#3e4c56;line-height:1.5}
.how b{color:${colors.accentStrong}}
.host{background:${colors.ink};color:#fff;border-radius:18px;padding:16px 20px;font-size:24px;font-weight:800;line-height:1.4}
.host:before{content:"🎙 ";}
.log{font-size:20px;font-weight:700;color:#3e4c56;line-height:1.55;flex:1;overflow:hidden}
.rank{font-size:20px;font-weight:800}
.rank h3{font-size:18px;color:${colors.primary};margin-bottom:4px}
.rank ul{padding:0}
.rank li{list-style:none;display:flex;justify-content:space-between}`;

function boardHtml(session: Session): string {
  const { question, opened } = session.round;
  return `<div class="board">${getBoardGrid(question.language)
    .flat()
    .map((char) =>
      tileHtml(question, char, char !== null && opened.includes(char)),
    )
    .join("")}</div>`;
}

// The part that changes; the shell swaps it in.
export function viewHtml(session: Session): string {
  const solved = session.round.solvedBy !== null;
  const slots = Array.from(
    { length: answerLength(session.round) },
    () => "<span>？</span>",
  ).join("");
  const ranking = topScores(session)
    .map(
      (row, i) =>
        `<li><span>${i + 1}. ${escapeHtml(row.name)}</span><span>${row.points}点</span></li>`,
    )
    .join("");
  return `${boardHtml(session)}<div class="side">
<div class="no">第${session.roundNo}問${solved ? "　🎉 正解が出たよ！" : ""}</div>
<div class="prompt">${escapeHtml(roundPrompt(session.round))}</div>
<div class="slots">${slots}</div>
<div class="how">コメントに<b>1文字</b>（例：か）→ そのマスが開く<br>答えがわかったら<b>そのままコメント</b>（例：答え：○○）</div>
<div class="host">${escapeHtml(session.host)}</div>
<div class="log">${session.log.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}</div>
<div class="rank"><h3>ランキング</h3><ul>${ranking || "<li>まだいないよ</li>"}</ul></div>
</div>`;
}

export function shellHtml(): string {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><title>五十音マインスイーパー ライブ</title>
<style>${CSS}</style></head><body><div id="view"></div><script>
// The line already on screen when the page loads is not read out again.
let voice;
async function poll() {
  try {
    const res = await fetch("/view");
    const data = await res.json();
    document.getElementById("view").innerHTML = data.html;
    if (voice === undefined) voice = data.voice || "";
    else if (data.voice && data.voice !== voice) {
      voice = data.voice;
      new Audio(voice).play().catch(() => {});
    }
  } catch {}
  setTimeout(poll, 400);
}
poll();
</script></body></html>`;
}
