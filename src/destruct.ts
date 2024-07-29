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
  str,
  options = DESTRUCT_DEFAULT_OPTIONS
) {
  if (!str) {
    return [];
  }

  const {
    returnChangedCase,
    returnChainedWords,
    removeDigits,
    language,
    removeDuplicates,
    returnMaxNGrams,
  } = options;

  const cleared = str.replace(/(<([^>]+)>)/gi, "").trim();

  if (!cleared) {
    return [];
  } else {
    const words = cleared.split(/\s/);
    const unchangedWords: string[] = [];
    const lowWords: string[] = [];

    for (let i = 0; i < words.length; i++) {
      let word: string = words[i].match(/https?:\/\/.*[\r\n]*/g)
        ? words[i]
        : words[i].replace(/\.|,|;|!|\?|\(|\)|:|"|^'|'$|“|”|‘|’/g, "");

      if (word.length === 1) {
        word = word.replace(/_|@|&|#/g, "");
      }

      const digitMatch = word.match(/\d/g);
      if (removeDigits && digitMatch && digitMatch.length === word.length) {
        word = "";
      }

      if (word.length > 0) {
        lowWords.push(word.toLocaleLowerCase());
        unchangedWords.push(word);
      }
    }

    let result: string[] = [];
    const stopwords = getStopwords({ language });
    let lastResultWordIndex = 0;
    let startResultWordIndex = 0;
    let unbrokenWordChain = false;

    for (let x = 0; x < lowWords.length; x++) {
      if (stopwords.indexOf(lowWords[x]) < 0) {
        if (lastResultWordIndex !== x - 1) {
          startResultWordIndex = x;
          unbrokenWordChain = false;
        } else {
          unbrokenWordChain = true;
        }

        const resultWord =
          returnChangedCase && !unchangedWords[x].match(/https?:\/\/.*[\r\n]*/g)
            ? lowWords[x]
            : unchangedWords[x];

        if (
          returnMaxNGrams &&
          unbrokenWordChain &&
          !returnChainedWords &&
          returnMaxNGrams > x - startResultWordIndex &&
          lastResultWordIndex === x - 1
        ) {
          const changePos = result.length - 1 < 0 ? 0 : result.length - 1;
          result[changePos] = result[changePos]
            ? result[changePos] + " " + resultWord
            : resultWord;
        } else if (returnChainedWords && lastResultWordIndex === x - 1) {
          const changePos = result.length - 1 < 0 ? 0 : result.length - 1;
          result[changePos] = result[changePos]
            ? result[changePos] + " " + resultWord
            : resultWord;
        } else {
          result.push(resultWord);
        }

        lastResultWordIndex = x;
      } else {
        unbrokenWordChain = false;
      }

      if (removeDuplicates) {
        result = result.filter((v, i, a) => a.indexOf(v) === i);
      }

      return result;
    }
  }

  return [];
};
