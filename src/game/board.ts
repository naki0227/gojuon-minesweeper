import type { QuestionLanguage } from "../data/types";
import { ALPHABET_GRID, ALPHABET_ORDER } from "./alphabet";
import { GOJUON_GRID, GOJUON_ORDER } from "./gojuon";

export function getBoardGrid(
  language: QuestionLanguage,
): ReadonlyArray<ReadonlyArray<string | null>> {
  return language === "ja" ? GOJUON_GRID : ALPHABET_GRID;
}

export function getBoardOrder(language: QuestionLanguage): readonly string[] {
  return language === "ja" ? GOJUON_ORDER : ALPHABET_ORDER;
}

export function adjacentCharacters(
  language: QuestionLanguage,
  char: string,
): string[] {
  const grid = getBoardGrid(language);
  let row = -1;
  let column = -1;

  for (let rowIndex = 0; rowIndex < grid.length; rowIndex += 1) {
    const columnIndex = grid[rowIndex]?.indexOf(char) ?? -1;

    if (columnIndex >= 0) {
      row = rowIndex;
      column = columnIndex;
      break;
    }
  }

  if (row < 0 || column < 0) {
    return [];
  }

  const result: string[] = [];

  for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
      if (rowOffset === 0 && columnOffset === 0) {
        continue;
      }

      const neighbor = grid[row + rowOffset]?.[column + columnOffset];

      if (neighbor) {
        result.push(neighbor);
      }
    }
  }

  return result;
}
