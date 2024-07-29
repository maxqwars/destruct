import { russian } from "./languages/russian";
import { english } from "./languages/english";

type LanguageIdentifiersType =
  | "danish"
  | "dutch"
  | "english"
  | "french"
  | "galician"
  | "german"
  | "italian"
  | "polish"
  | "portuguese"
  | "romanian"
  | "russian"
  | "spanish"
  | "swedish"
  | "vietnam"
  | "ar"
  | "cs"
  | "da"
  | "de"
  | "en"
  | "es"
  | "fa"
  | "fr"
  | "gl"
  | "it"
  | "ko"
  | "nl"
  | "pl"
  | "pt"
  | "ro"
  | "ru"
  | "sv"
  | "tr"
  | "vi"
  | "vt";

const SUPPORTED_LANGUAGE_IDENTIFIERS = [
  "danish",
  "dutch",
  "english",
  "french",
  "galician",
  "german",
  "italian",
  "polish",
  "portuguese",
  "romanian",
  "russian",
  "spanish",
  "swedish",
  "ar",
  "cs",
  "da",
  "de",
  "en",
  "es",
  "fa",
  "fr",
  "gl",
  "it",
  "ko",
  "nl",
  "pl",
  "pt",
  "ro",
  "ru",
  "sv",
  "tr",
  "vi",
];

const STOPWORDS: { [key: string]: string[] } = {
  ru: russian,
  en: english,
};

const LANG_TO_STOPWORDS_MAP: { [key: string]: LanguageIdentifiersType } = {
  arabic: "ar",
  czech: "cs",
  danish: "da",
  dutch: "nl",
  english: "en",
  french: "fr",
  galician: "gl",
  german: "de",
  italian: "it",
  korean: "ko",
  persian: "fa",
  polish: "pl",
  portuguese: "pt",
  romanian: "ro",
  russian: "ru",
  spanish: "es",
  swedish: "sv",
  turkish: "tr",
  vietnam: "vt",
};

type GetStopwordsOptionsType = {
  language?: LanguageIdentifiersType;
};

type DestructOptionsType = {
  removeDigits?: boolean;
  returnChangedCase?: boolean;
  returnChainedWords?: boolean;
  removeDuplicates?: boolean;
  returnMaxNGrams?: number | false;
} & GetStopwordsOptionsType;

function getLanguageMapping(
  languageId: LanguageIdentifiersType
): LanguageIdentifiersType | string {
  if (typeof languageId !== "string") return "";
  return LANG_TO_STOPWORDS_MAP[languageId] || "";
}

function sanitizeLanguage(
  languageId: LanguageIdentifiersType
): LanguageIdentifiersType | never {
  const errorMessage = `Language must be one of [${SUPPORTED_LANGUAGE_IDENTIFIERS.join(
    ", "
  )}]`;

  if (typeof languageId !== "string") {
    throw new Error(errorMessage);
  }

  const requestedLanguageName =
    languageId.length === 2 ? languageId : getLanguageMapping(languageId);

  if (SUPPORTED_LANGUAGE_IDENTIFIERS.indexOf(languageId) < 0) {
    throw new Error(errorMessage);
  }

  return requestedLanguageName as LanguageIdentifiersType;
}

function getStopwords(options: GetStopwordsOptionsType): string[] {
  let language = options.language || "en";
  language = sanitizeLanguage(language);
  return STOPWORDS[language];
}

const DESTRUCT_DEFAULT_OPTIONS: DestructOptionsType = {
  removeDigits: true,
  returnChangedCase: true,
  returnChainedWords: false,
  removeDuplicates: true,
  returnMaxNGrams: false,
  language: "english",
};

interface DestructFunction {
  (str: string, options?: DestructOptionsType): string[];
}

export const destruct: DestructFunction = function (
  str: string,
  options = DESTRUCT_DEFAULT_OPTIONS
) {
  if (!str) return [];

  const {
    language,
    returnChangedCase,
    returnChainedWords,
    removeDigits,
    removeDuplicates,
    returnMaxNGrams,
  } = options;

  const selectedLanguage = sanitizeLanguage(language);
  const text = str.replace(/(<([^>]+)>)/gi, "").trim();

  if (!text) return [];

  const words = text.split(/\s/);
  const unchangedWords = [];
  const lowercaseWords = [];

  //? Change the case of all the words
  for (let x = 0; x < words.length; x++) {
    let word = words[x].match(/https?:\/\/.*[\r\n]*/g)
      ? words[x]
      : words[x].replace(/\.|,|;|!|\?|\(|\)|:|"|^'|'$|“|”|‘|’/g, "");

    //  remove periods, question marks, exclamation points, commas, and semi-colons
    //  if this is a short result, make sure it's not a single character or something 'odd'
    if (word.length === 1) {
      word = word.replace(/_|@|&|#/g, "");
    }

    //  if it's a number, remove it
    const isDigit = word.match(/\d/g);
    if (removeDigits && isDigit && isDigit.length === word.length) word = "";
    if (word.length > 0) {
      lowercaseWords.push(word.toLocaleLowerCase());
      unchangedWords.push(word);
    }
  }

  let results: string[] = [];
  const stopwords = getStopwords({ language });
  let lastResultWordIndex = 0;
  let startResultWordIndex = 0;
  let unbrokenResultWordIndex: number | boolean = 0;

  for (let y = 0; y < lowercaseWords.length; y++) {
    if (stopwords.indexOf(lowercaseWords[y]) < 0) {
      if (lastResultWordIndex !== y - 1) {
        startResultWordIndex = y;
        unbrokenResultWordIndex = false;
      } else {
        unbrokenResultWordIndex = true;
      }
      const resultWord =
        returnChainedWords && !unchangedWords[y].match(/https?:\/\/.*[\r\n]*/g)
          ? lowercaseWords[y]
          : unchangedWords[y];

      if (
        returnMaxNGrams &&
        unbrokenResultWordIndex &&
        !returnChainedWords &&
        returnMaxNGrams > y - startResultWordIndex &&
        lastResultWordIndex === y - 1
      ) {
        const changePosition = results.length - 1 < 0 ? 0 : results.length - 1;
        results[changePosition] = results[changePosition]
          ? results[changePosition] + " " + resultWord
          : resultWord;
      } else if (returnChainedWords && lastResultWordIndex === y - 1) {
        const changePosition = results.length - 1 < 0 ? 0 : results.length - 1;
        results[changePosition] = results[changePosition]
          ? results[changePosition] + " " + resultWord
          : resultWord;
      } else {
        results.push(resultWord);
      }

      lastResultWordIndex = y;
    } else {
      unbrokenResultWordIndex = false;
    }

    if (removeDuplicates) {
      results = results.filter((v, i, a) => a.indexOf(v) === i);
    }
  }

  return returnChangedCase
    ? results.map((w) => w.toLocaleLowerCase())
    : results;
};