import type { LengthRange, QuestionLanguage } from "./types";

// The home screen offers these broad groups instead of every category.
// Every category in the question banks must belong to exactly one group
// (tests/category-groups.test.ts checks this when new data is added).
export type CategoryGroup = {
  id: string;
  label: string;
  // A word shown as board tiles when the group is selected.
  sample: Record<QuestionLanguage, string>;
  categories: readonly string[];
};

export const CATEGORY_GROUPS: readonly CategoryGroup[] = [
  {
    id: "daily",
    label: "くらし",
    sample: { ja: "はさみ", en: "CUP" },
    categories: [
      "文房具",
      "生活用品",
      "衣服",
      "乗り物",
      "天気",
      "植物",
      "楽器",
      "季節・行事",
      "食べ物",
      "動物",
      "職業",
      "Body",
      "Transport",
      "Home",
      "Colors",
      "Weather",
      "Animals",
      "Foods",
      "Food",
      "Fruit",
      "Meat",
      "Cheese",
      "Condiments",
      "Fast Food",
      "Cats",
      "Dogs",
      "Birds",
      "Fish",
      "Monkeys",
      "Apex Predators",
      "Plants",
      "Nature",
      "Everyday",
      "Stationery",
      "Clothing",
      "Cotton",
      "Celebrations",
      "Instruments",
      "Jobs",
      "Furniture",
      "Houses",
      "Containers",
      "Phones",
      "Driving",
      "Automobiles",
      "Car Parts",
      "Ghosts",
    ],
  },
  {
    id: "study",
    label: "勉強",
    sample: { ja: "ちそう", en: "ATOM" },
    categories: [
      "理科・生物",
      "理科・化学",
      "理科・物理",
      "理科・地学",
      "社会・歴史",
      "社会・公民",
      "社会・地理",
      "歴史人物",
      "Space",
      "Astronomy",
      "Chemistry",
      "Physics",
      "Physics Optics",
      "Physics Units",
      "Physics Waves",
      "Science",
      "Geometry",
      "Linear Algebra",
      "History",
      "Minerals",
      "Metals",
    ],
  },
  {
    id: "geography",
    label: "地理",
    sample: { ja: "ながの", en: "PERU" },
    categories: ["都道府県", "世界の国", "Countries", "Geography"],
  },
  {
    id: "people",
    label: "芸能・人物",
    sample: { ja: "せいゆう", en: "STAR" },
    categories: [
      "俳優",
      "女優",
      "声優",
      "アイドル",
      "アイドル・グループ",
      "音楽アーティスト",
      "お笑い",
    ],
  },
  {
    id: "hobby",
    label: "趣味",
    sample: { ja: "やきゅう", en: "GAME" },
    categories: [
      "アニメ・漫画",
      "ゲーム",
      "スポーツ",
      "Sports",
      "Gaming",
      "Music",
      "Music Instruments",
      "Music Production",
      "Music Theory",
      "Filmmaking",
      "Radio",
      "3D Printing",
      "3D Graphics",
      "Design",
    ],
  },
  {
    id: "work",
    label: "仕事・テクノロジー",
    sample: { ja: "さーば", en: "CODE" },
    categories: [
      "IT用語",
      "Programming",
      "Coding",
      "Algorithms",
      "Data Structures",
      "Machine Learning",
      "Technology",
      "Accounting",
      "Corporate",
      "Corporate Jobs",
      "Insurance",
      "Real Estate",
      "Construction",
      "Architecture",
      "Buildings",
      "Infrastructure",
      "Fortifications",
      "Military Air Force",
      "Military Army",
      "Military Navy",
    ],
  },
];

// The group's categories that exist for the chosen language.
export function groupCategoriesIn(
  group: CategoryGroup,
  available: readonly string[],
): readonly string[] {
  return group.categories.filter((category) => available.includes(category));
}

// The group whose available categories are exactly the selection, if any.
export function findSelectedGroup(
  selected: readonly string[],
  available: readonly string[],
): CategoryGroup | null {
  if (selected.length === 0) {
    return null;
  }

  return (
    CATEGORY_GROUPS.find((group) => {
      const categories = groupCategoriesIn(group, available);
      return (
        categories.length === selected.length &&
        categories.every((category) => selected.includes(category))
      );
    }) ?? null
  );
}

export type LengthPreset = {
  id: string;
  label: string;
  note: string | null;
  range: "any" | LengthRange;
};

export const LENGTH_PRESETS: readonly LengthPreset[] = [
  { id: "any", label: "ぜんぶ", note: null, range: "any" },
  { id: "short", label: "短い", note: "2〜4字", range: { min: 2, max: 4 } },
  { id: "normal", label: "ふつう", note: "5〜7字", range: { min: 5, max: 7 } },
  { id: "long", label: "長い", note: "8字〜", range: { min: 8, max: null } },
];
