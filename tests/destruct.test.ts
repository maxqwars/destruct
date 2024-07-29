import { destruct } from "../src";

describe("ISO 639-1 language code format", () => {
  test("should return an array of 'keywords' for an English string", () => {
    const result = destruct(
      "President Obama woke up Monday facing a Congressional defeat that many in both parties believed could hobble his presidency.",
      {
        language: "en",
        returnChangedCase: true,
      }
    );

    expect(result).not.toBeFalsy();
    expect(result).toStrictEqual([
      "president",
      "obama",
      "woke",
      "monday",
      "facing",
      "congressional",
      "defeat",
      "parties",
      "believed",
      "hobble",
      "presidency",
    ]);
  });

  test("should return an array of 'keywords' for a Russian string", () => {
    const result = destruct(
      "Президент Обама проснулся понедельник перед Конгрессом поражение, что многие в обе стороны мнению, могли бы ковылять его президентства.",
      {
        language: "ru",
        returnChangedCase: true,
      }
    );

    expect(result).not.toBeFalsy();
    expect(result).toStrictEqual([
      "президент",
      "обама",
      "проснулся",
      "понедельник",
      "конгрессом",
      "поражение",
      "многие",
      "обе",
      "стороны",
      "мнению",
      "могли",
      "ковылять",
      "президентства",
    ]);
  });
});
