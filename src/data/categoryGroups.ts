import { tr } from "../i18n";
import type { QuestionLanguage } from "./types";

const S = tr({
  ja: {
    daily: "くらし",
    study: "勉強",
    words: "ことば",
    geography: "地理",
    people: "芸能・人物",
    hobby: "趣味",
    work: "仕事・テクノロジー",
  },
  en: {
    daily: "Everyday",
    study: "Study",
    words: "Words",
    geography: "Geography",
    people: "Celebrities",
    hobby: "Hobbies",
    work: "Work & Tech",
  },
});

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
    label: S.daily,
    sample: { ja: "はさみ", en: "CUP" },
    categories: [
      "文房具",
      "衣服",
      "乗り物",
      "天気",
      "植物",
      "楽器",
      "季節・行事",
      "料理",
      "お菓子",
      "果物",
      "野菜",
      "食材",
      "調味料",
      "飲み物",
      "動物",
      "鳥",
      "魚・海の生き物",
      "虫",
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
      "体の部位",
      "健康・病気",
      "人・家族",
      "日用品",
      "台所用品",
      "掃除・洗濯",
      "家具・家電",
      "工具",
      "家のつくり",
      "建物・施設",
      "交通・道路",
      "時間・こよみ",
      "色",
      "遊び・おもちゃ",
      "Kitchen",
      "Tools",
      "Trees",
      "Flowers",
      "Fruits and Veggies",
    ],
  },
  {
    id: "study",
    label: S.study,
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
      "算数・数学",
      "宇宙",
      "学校",
      "Elements",
      "Dinosaurs",
      "Gems",
      "School",
    ],
  },
  {
    id: "words",
    label: S.words,
    sample: { ja: "ことわざ", en: "WORD" },
    categories: [
      "動詞",
      "形容詞",
      "様子を表す言葉",
      "気持ち",
      "性格",
      "擬音語",
      "国語",
      "四字熟語",
      "ことわざ",
      "慣用句",
      "Actions",
      "Describing Words",
      "Emotions",
    ],
  },
  {
    id: "geography",
    label: S.geography,
    sample: { ja: "ながの", en: "PERU" },
    categories: [
      "都道府県",
      "日本の地名",
      "日本の名所",
      "世界の国",
      "世界の都市",
      "自然・風景",
      "Countries",
      "Cities",
      "US States",
      "Geography",
    ],
  },
  {
    id: "people",
    label: S.people,
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
    label: S.hobby,
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
      "Music Genres",
      "Dances",
      "昔話・童話",
      "伝統・文化",
      "趣味・アウトドア",
      "舞台・芸能",
      "音楽",
      "Mythology",
    ],
  },
  {
    id: "work",
    label: S.work,
    sample: { ja: "さーば", en: "CODE" },
    categories: [
      "IT用語",
      "仕事・会社",
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
