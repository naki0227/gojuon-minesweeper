import { describe, expect, it } from "vitest";

import { transitionSound, type SoundSnapshot } from "../src/sound/transitions";

const base: SoundSnapshot = {
  key: "q1",
  opened: ["あ"],
  isMine: (char) => char === "ね",
  won: false,
  finished: false,
  message: "",
};

const next = (patch: Partial<SoundSnapshot>) => ({ ...base, ...patch });

describe("transition sounds", () => {
  it("plays the right sound for each kind of change", () => {
    expect(transitionSound(base, next({ opened: ["あ", "い"] }))).toBe("open");
    expect(transitionSound(base, next({ opened: ["あ", "い", "う"] }))).toBe(
      "chain",
    );
    expect(transitionSound(base, next({ opened: ["あ", "ね"] }))).toBe("mine");
    expect(transitionSound(base, next({ won: true }))).toBe("correct");
    expect(transitionSound(base, next({ finished: true }))).toBe("over");
    expect(
      transitionSound(
        base,
        next({ message: "不正解。盤面から1文字開けてください。" }),
      ),
    ).toBe("wrong");
  });

  it("stays quiet when nothing new happened or the question changed", () => {
    expect(transitionSound(base, base)).toBeNull();
    expect(
      transitionSound(base, next({ message: "回答をパスしました。" })),
    ).toBeNull();
    expect(
      transitionSound(base, next({ key: "q2", opened: ["か", "き"] })),
    ).toBeNull();
    expect(transitionSound(null, base)).toBeNull();
  });

  it("prefers the win and the mine over the rest", () => {
    expect(
      transitionSound(base, next({ won: true, opened: ["あ", "い"] })),
    ).toBe("correct");
    expect(
      transitionSound(base, next({ finished: true, opened: ["あ", "ね"] })),
    ).toBe("mine");
  });
});
