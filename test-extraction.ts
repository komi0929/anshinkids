import { mergeMegaWikiSections } from "./src/lib/wiki/article-templates";

const testFuzzing = () => {
  let passed = 0;
  let failed = 0;

  const runTest = (name: string, fn: () => void) => {
    try {
      fn();
      console.log(`[PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`[FAIL] ${name}`, e);
      failed++;
    }
  };

  runTest("Both undefined/null", () => {
    mergeMegaWikiSections(null as any, undefined as any);
  });

  runTest("String instead of objects", () => {
    mergeMegaWikiSections(["garbage"] as any, [{ heading: "test", items: "string" }] as any);
  });

  runTest("Items array is missing properties", () => {
    mergeMegaWikiSections(
      [{ heading: "h", items: [{}] as any }],
      [{ heading: "h", items: [{ content: "bar" }] as any }]
    );
  });

  runTest("Item tips and reviews are primitive instead of array", () => {
    mergeMegaWikiSections(
      [{ heading: "A", items: [{ title: "T", tips: "not-array" } as any] }],
      [{ heading: "A", items: [{ title: "T", tips: "not-array2" } as any] }]
    );
  });

  runTest("Extreme numbers parsing", () => {
    mergeMegaWikiSections(
      [{ heading: "A", items: [{ title: "T", mention_count: "NaN", heat_score: {} } as any] }],
      [{ heading: "A", items: [{ title: "T", mention_count: null, heat_score: "100" } as any] }]
    );
  });

  runTest("Deeply nested objects in text parsing (should be stringified or handled safely)", () => {
    mergeMegaWikiSections(
      [{ heading: "A", items: [{ title: "T", content: { a: 1 } } as any] }],
      [{ heading: "A", items: [{ title: "T", content: [{ a: 2 }] } as any] }]
    );
  });

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);
};

testFuzzing();
