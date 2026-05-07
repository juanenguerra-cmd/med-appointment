import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const parserModulePath = path.resolve("src/census/parser/parseCensusText.ts");
const fixtureDir = path.resolve("src/census/parser/__fixtures__");

const fixtures = [
  {
    file: "pcc-resident-listing-basic.txt",
    expected: {
      minResidents: 3,
      mrns: ["100001", "100002", "100003"],
      duplicateResidents: 0,
    },
  },
  {
    file: "pcc-resident-listing-wrapped-lines.txt",
    expected: {
      minResidents: 2,
      mrns: ["100004", "100005"],
      duplicateResidents: 0,
    },
  },
  {
    file: "pcc-resident-listing-missing-fields.txt",
    expected: {
      minResidents: 2,
      mrns: ["100006", "100007"],
      minWarnings: 1,
    },
  },
  {
    file: "pcc-resident-listing-duplicates.txt",
    expected: {
      minResidents: 3,
      mrns: ["100008", "100009"],
      duplicateResidents: 1,
    },
  },
];

async function loadParser() {
  if (!fs.existsSync(parserModulePath)) {
    throw new Error("Missing parser module: src/census/parser/parseCensusText.ts");
  }

  try {
    return await import(pathToFileURL(parserModulePath).href);
  } catch (error) {
    throw new Error(`Unable to import TypeScript parser module directly. Run npm run build first or add a TS runtime if needed. Original error: ${String(error)}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function summarizeResidents(residents) {
  return residents.map((resident) => `${resident.fullName || resident.name || "Unknown"} | ${resident.mrn || "No MRN"} | ${resident.unit || "No Unit"} | ${resident.roomBed || resident.room || "No Room"}`);
}

const { parseCensusText } = await loadParser();
let failures = 0;

console.log("Census Parser Fixture Tests\n");

for (const fixture of fixtures) {
  const fixturePath = path.join(fixtureDir, fixture.file);
  console.log(`Testing ${fixture.file}...`);

  try {
    assert(fs.existsSync(fixturePath), `Missing fixture file: ${fixture.file}`);
    const rawText = fs.readFileSync(fixturePath, "utf8");
    const result = parseCensusText({
      importId: `fixture_${fixture.file}`,
      sourceType: "txt",
      rawText,
      importedAt: new Date().toISOString(),
      facilityId: "fixture-facility",
    });

    assert(result.residents.length >= fixture.expected.minResidents, `Expected at least ${fixture.expected.minResidents} residents, got ${result.residents.length}`);

    for (const mrn of fixture.expected.mrns || []) {
      assert(result.residents.some((resident) => resident.mrn === mrn), `Expected MRN ${mrn} was not parsed.`);
    }

    if (typeof fixture.expected.duplicateResidents === "number") {
      assert(result.summary.duplicateResidents === fixture.expected.duplicateResidents, `Expected ${fixture.expected.duplicateResidents} duplicate group(s), got ${result.summary.duplicateResidents}`);
    }

    if (typeof fixture.expected.minWarnings === "number") {
      assert(result.summary.residentsWithWarnings >= fixture.expected.minWarnings, `Expected at least ${fixture.expected.minWarnings} resident(s) with warnings, got ${result.summary.residentsWithWarnings}`);
    }

    console.log(`✅ Passed: ${fixture.file}`);
    console.log(`   Parsed residents: ${result.residents.length}`);
    console.log(`   Resident rows: ${summarizeResidents(result.residents).join(" || ")}`);
  } catch (error) {
    failures += 1;
    console.log(`❌ Failed: ${fixture.file}`);
    console.log(`   ${String(error.message || error)}`);
  }

  console.log("");
}

if (failures > 0) {
  console.log(`Census parser fixture tests failed with ${failures} failure(s).`);
  process.exit(1);
}

console.log("All census parser fixture tests passed.");
