// 今日の一問 プレゼント on the static pages: puzzle.json for the
// daily-lottery Edge Function, and the entry / result box with its script.
import { createHash } from "node:crypto";

import { normalizeValue } from "../../src/game/normalize";
import { dailyQuestion, type DailyEntry } from "../../src/daily/schedule";
import { colors } from "../../src/theme/colors";

export const CAMPAIGN = {
  instant: 100,
  dailyWinners: 20,
  claimDays: 3,
  codesExpire: "2027年4月14日",
};

// The function hashes a normalized answer the same way:
// sha256 hex of "<date>:<normalized answer>".
export function answerHash(date: string, normalized: string): string {
  return createHash("sha256").update(`${date}:${normalized}`).digest("hex");
}

// Every spelling the game accepts for the day's question. Answers grouped
// into one question share their letters, so each fits the board.
export function puzzleJson(entry: DailyEntry): string {
  const question = dailyQuestion(entry);
  const normalized = new Set(
    question.answers
      .flatMap((answer) => answer.aliases)
      .map((alias) => normalizeValue(alias, question.language))
      .filter((value) => value.length > 0),
  );
  return JSON.stringify({
    date: entry.date,
    language: question.language,
    answers: [...normalized].map((value) => answerHash(entry.date, value)),
  });
}

export const LOTTERY_CSS = `
.gift{border-color:${colors.accent}}
.gift h2{margin:0;font-size:19px}
.gift input{font:inherit;font-size:17px;padding:12px;border:1px solid ${colors.line};border-radius:10px;width:100%}
.gift .msg{font-weight:800;color:${colors.ink}}
.gift .ticket{font-size:28px;font-weight:900;letter-spacing:3px;color:${colors.primary}}
.gift small{color:${colors.muted};font-size:12px;line-height:1.6}
.gift details{font-size:13px;color:#536875;line-height:1.7}
.gift[hidden],.gift [hidden]{display:none}`;

function rules(): string {
  return `<details><summary>プレゼントのルール</summary><ul>
<li>今日の一問に正解した人の中から、毎日${CAMPAIGN.dailyWinners}名にiPhoneアプリ「五十音マインスイーパー」のジェム10個のコードをプレゼントします。</li>
<li>リリース記念として、最初の${CAMPAIGN.instant}名は正解したその場でプレゼント（1台につき1回）。なくなり次第、毎日の抽選になります。</li>
<li>応募できるのは問題が出ている間（朝7時〜翌朝7時）だけ。1台につき1日1回です。</li>
<li>抽選は翌朝7時の答え発表のあと。このページか、ほかの日の問題のページを開くと結果が出ます。当選から${CAMPAIGN.claimDays}日以内に開かないと、コードはほかの人に回ります。</li>
<li>受け取り番号はこのブラウザに保存されます。消えたときのためにスクショしておいてね。</li>
<li>コードはiPhone・iPadのApp Storeで使えます（有効期限 ${CAMPAIGN.codesExpire}）。ジェムを受け取るにはアプリでAppleでログインしてください。</li>
<li>コードがなくなったら終了します。内容は予告なく変わることがあります。</li>
<li>このプレゼントはAppleが提供・協賛するものではありません。</li>
</ul></details>`;
}

// `open` is today's puzzle (entries allowed); other pages only show
// results of tickets saved in this browser.
export function lotterySection(
  entry: DailyEntry,
  open: boolean,
  endpoint: string,
): string {
  const form = open
    ? `<div id="gift-form"><h2>🎁 答えて応募</h2>
<p>正解するとジェム10個のコードが当たるかも。リリース記念で最初の${CAMPAIGN.instant}名はその場でプレゼント！</p>
<input id="gift-answer" placeholder="答え（ひらがな）" autocomplete="off" maxlength="40">
<button id="gift-send">答えて応募する</button>
<details><summary>受け取り番号で結果を見る</summary>
<input id="gift-ticket" placeholder="ABCD-EFGH" autocomplete="off" maxlength="9">
<button id="gift-check">結果を見る</button></details></div>`
    : "";
  return `<div class="card gift" id="gift"${open ? "" : " hidden"}>${form}
<div id="gift-out" class="msg" aria-live="polite"></div><div id="gift-results"></div>
${rules()}</div>
<script>${lotteryScript(endpoint, entry.date)}</script>`;
}

function lotteryScript(endpoint: string, date: string): string {
  return `(()=>{
const API=${JSON.stringify(endpoint)},DATE=${JSON.stringify(date)},KEY="gojuon-gift-tickets";
const $=(id)=>document.getElementById(id);
const store={get(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
let device=store.get("gojuon-gift-device",null);
if(!device){device=crypto.randomUUID();store.set("gojuon-gift-device",device)}
const call=(body)=>fetch(API,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}).then((r)=>r.json()).catch(()=>({ok:false,error:"通信できませんでした。"}));
const esc=(s)=>String(s).replace(/[&<>"]/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
const short=(d)=>Number(d.slice(5,7))+"/"+Number(d.slice(8));
const claim=(url)=>'<a class="cta" href="'+esc(url)+'">App Storeで受け取る</a><small>App Storeが開いたらそのまま引き換えてね。アプリでAppleでログインしているとジェムが届きます。</small>';
const LABEL={pending:"抽選は明日の朝7時",won:"当選！🎉",lost:"今回はハズレ…また挑戦してね",expired:"受け取り期限が過ぎました"};
function show(results){
  $("gift-results").innerHTML=results.map((r)=>'<p><b>'+short(r.date)+'の問題</b>　受け取り番号 '+esc(r.ticket)+'<br>'+LABEL[r.status]+'</p>'+(r.url?claim(r.url):"")).join("");
  if(results.length)$("gift").hidden=false;
}
function remember(ticket,date){
  const list=store.get(KEY,[]).filter((t)=>t.ticket!==ticket);
  list.unshift({ticket,date});store.set(KEY,list.slice(0,30));
}
function refresh(){
  const saved=store.get(KEY,[]);
  if(saved.length)call({action:"status",tickets:saved.map((t)=>t.ticket)}).then((res)=>{if(res.ok)show(res.results)});
}
refresh();
const check=$("gift-check");
if(check)check.onclick=async()=>{
  const ticket=$("gift-ticket").value.trim().toUpperCase().replace(/^([A-Z0-9]{4})-?([A-Z0-9]{4})$/,"$1-$2");
  const res=await call({action:"status",tickets:[ticket]});
  if(!res.ok||!res.results.length){$("gift-out").textContent=res.error||"その番号は見つかりませんでした。";return}
  remember(ticket,res.results[0].date);$("gift-out").textContent="";refresh();
};
const send=$("gift-send");
if(send)send.onclick=async()=>{
  const answer=$("gift-answer").value.trim();if(!answer)return;
  send.disabled=true;
  const res=await call({action:"enter",date:DATE,answer,device});
  send.disabled=false;
  if(!res.ok){$("gift-out").textContent=res.error;return}
  if(!res.correct){$("gift-out").textContent="ちがうみたい…もう一度考えてみて！";return}
  remember(res.ticket,res.date);
  $("gift-form").hidden=true;
  $("gift-out").innerHTML=res.status==="won"
    ?'正解！リリース記念プレゼントが当たったよ🎉<div class="ticket">'+esc(res.ticket)+'</div>'+claim(res.url)
    :'正解！🎉 受け取り番号<div class="ticket">'+esc(res.ticket)+'</div><small>明日の朝7時に抽選。このページを開くと結果が出ます。番号はスクショしておいてね。</small>';
};
})();`;
}
