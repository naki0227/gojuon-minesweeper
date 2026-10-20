// The Halloween look for the 今日の一問 images, videos and pages: a night
// sky, a moon and a few bats, all drawn as inline SVG (no image files), on
// the dates seasonOf() marks. Other dates get empty strings.
import { colors } from "../../src/theme/colors";
import { HALLOWEEN, seasonOf } from "../../src/theme/season";

const BAT =
  "M0 6C3 2 7 1 10 4c1-2 3-3 4-2 1-1 3 0 4 2 3-3 7-2 10 2-4-1-6 1-7 4-2-2-4-2-5 1-1-3-3-3-5-1-1-3-3-5-6-4-1-3-3-5-5-6z";

// Bats in front of the moon are black; the others a lighter violet so they
// show against the night sky.
function bat(
  x: number,
  y: number,
  size: number,
  turn = 0,
  fill = "#7a62ad",
): string {
  return `<svg class="bat" viewBox="0 0 28 14" style="left:${x}%;top:${y}%;width:${size}px;transform:rotate(${turn}deg)" aria-hidden="true"><path d="${BAT}" fill="${fill}"/></svg>`;
}

function moon(x: number, y: number, size: number): string {
  return `<svg class="moon" viewBox="0 0 100 100" style="left:${x}%;top:${y}%;width:${size}px" aria-hidden="true">
<circle cx="50" cy="50" r="48" fill="${HALLOWEEN.moon}"/><circle cx="66" cy="38" r="9" fill="#f3d98a"/><circle cx="38" cy="64" r="6" fill="#f3d98a"/></svg>`;
}

function pumpkin(x: number, y: number, size: number): string {
  return `<svg class="pumpkin" viewBox="0 0 100 86" style="left:${x}%;top:${y}%;width:${size}px" aria-hidden="true">
<path d="M47 14c0-8 4-12 10-13l2 5c-4 1-6 4-6 8z" fill="#3f6b2a"/>
<ellipse cx="30" cy="52" rx="24" ry="32" fill="${HALLOWEEN.pumpkin}"/><ellipse cx="70" cy="52" rx="24" ry="32" fill="${HALLOWEEN.pumpkin}"/>
<ellipse cx="50" cy="52" rx="26" ry="34" fill="#f59a3a"/>
<path d="M33 44l9-8 4 10zM67 44l-9-8-4 10zM34 62q16 14 32 0l-6 3-4-4-6 5-6-5-4 4z" fill="${HALLOWEEN.night}"/></svg>`;
}

export function isHalloween(date: string): boolean {
  return seasonOf(date) === "halloween";
}

// Shared by the image cards and the videos: a night background with the
// content drawn light on it.
export function seasonCss(date: string): string {
  if (!isHalloween(date)) return "";
  return `
body{background:radial-gradient(120% 70% at 85% 0%,${HALLOWEEN.dusk},${HALLOWEEN.night} 70%);color:${HALLOWEEN.text}}
.deco{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.deco svg{position:absolute;display:block}
.badge,.lead,.no,.kicker{color:${HALLOWEEN.pumpkin}!important}
.badge span,.no span{color:${HALLOWEEN.text}!important}
.legend,.trivia,.foot,.sub,.range,.think{color:${HALLOWEEN.sub}!important}
.logo div{background:${HALLOWEEN.tile}!important;outline:2px solid ${HALLOWEEN.sub}}
.logo div:last-child{background:${HALLOWEEN.pumpkin}!important}
.cta{border-color:${HALLOWEEN.pumpkin}!important;color:${HALLOWEEN.text}!important}
.board,.answer{position:relative;z-index:1}`;
}

// The decoration layer, placed first in <body>. Positions are in percent so
// one layer fits the square, tall and wide formats; `unit` scales the
// pixel sizes (1 = the 1080px-wide formats).
export function seasonDecor(date: string, unit = 1, aspect = 1): string {
  if (!isHalloween(date)) return "";
  const px = (value: number) => Math.round(value * unit);
  // Square and wide formats are full to the edges, so the moon tucks into
  // the top-right corner and the pumpkin sits beside the last line; tall
  // formats have room below the footer.
  const tall = aspect > 1.1;
  const moonSize = px(tall ? 150 : 110);
  return `<div class="deco">${moon(tall ? 86 : 90, tall ? -4 : -5, moonSize)}${bat(tall ? 88 : 91, 2.5, px(40), 10, "#120c22")}${bat(70, 1.5, px(52), -8)}${bat(4, 1.2, px(36), 6)}${pumpkin(86, tall ? 89 : 79, px(100))}</div>`;
}

// The 今日の一問 web pages keep their white reading layout (the colour
// belongs to the day's content, as on ほぼ日); only the top band becomes the
// night sky. Its bats drift slowly: the one ambient motion on the page,
// stopped by reduced-motion, Save-Data and when the band is off screen.
export function seasonPageCss(date: string): string {
  if (!isHalloween(date)) return "";
  return `
.season{position:relative;overflow:hidden;margin:-24px -16px 0;padding:22px 16px 18px;border-radius:0 0 22px 22px;
background:radial-gradient(120% 90% at 90% 0%,${HALLOWEEN.dusk},${HALLOWEEN.night} 72%);color:${HALLOWEEN.text}}
.season .eyebrow{color:${HALLOWEEN.pumpkin}}
.season h1{color:${HALLOWEEN.text};position:relative;z-index:1}
.season .tag{display:inline-block;margin-top:8px;font-size:13px;font-weight:800;color:${HALLOWEEN.night};background:${HALLOWEEN.pumpkin};
border-radius:999px;padding:3px 10px;box-shadow:-3px 3px 0 ${HALLOWEEN.moon};position:relative;z-index:1}
.season .deco{position:absolute;inset:0;pointer-events:none}
.season .deco svg{position:absolute}
.season .bat{animation:lpa-drift 9s ease-in-out infinite alternate}
.season .bat:nth-of-type(3){animation-duration:11s;animation-delay:-4s}
.season[data-motion=off] .bat,.season[data-offscreen] .bat{animation-play-state:paused}
@keyframes lpa-drift{to{translate:0 8px;rotate:6deg}}
@media (prefers-reduced-motion:reduce){.season .bat{animation:none}}
.cta{background:${HALLOWEEN.tile}}
@media (hover:hover) and (pointer:fine){.cta{transition:background .3s ease}.cta:hover{background:${colors.primary}}}`;
}

export function seasonBand(date: string, inner: string): string {
  if (!isHalloween(date)) return inner;
  return `<div class="season" id="season"><div class="deco">${moon(78, 8, 64)}${bat(80, 30, 26, 10, "#120c22")}${bat(58, 14, 34, -8)}${bat(66, 60, 22, 10)}</div>${inner}
<div class="tag">🎃 ハロウィン週</div></div>
<script>(()=>{const s=document.getElementById("season");if(!s)return;
if(navigator.connection&&navigator.connection.saveData)s.dataset.motion="off";
if("IntersectionObserver"in window)new IntersectionObserver(([e])=>{e.isIntersecting?delete s.dataset.offscreen:s.dataset.offscreen=""}).observe(s);})()</script>`;
}
