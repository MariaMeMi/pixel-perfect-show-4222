export type RegionKey = "forehead" | "nose" | "leftCheek" | "rightCheek" | "chin";

export type TriggerKey =
  | "sun"
  | "heat"
  | "cold"
  | "stress"
  | "exercise"
  | "alcohol"
  | "spicy"
  | "hotDrinks"
  | "newSkincare"
  | "makeup"
  | "cycle"
  | "poorSleep"
  | "other";

export type FeelingKey = "normal" | "warm" | "burning" | "itchy" | "dry" | "sensitive";

export type Analysis = {
  score: number;
  irritation: number;
  regions: Record<RegionKey, number>;
  summary: string;
  observations: string[];
  contributors: string[];
  tips: string[];
};

export type Entry = {
  id: string;
  date: string; // ISO
  analysis: Analysis;
  photo?: string | undefined; // data URL, only when photo retention is on
  feeling?: FeelingKey | undefined;
  triggers: TriggerKey[];
};

export type Profile = {
  name: string;
  skinType: string;
  sensitivity: string;
  knownTriggers: TriggerKey[];
  routine: string;
  products: string;
  medications: string;
  remindersEnabled: boolean;
  retainPhotos: boolean;
  language: "en" | "de";
  country: string;
};
