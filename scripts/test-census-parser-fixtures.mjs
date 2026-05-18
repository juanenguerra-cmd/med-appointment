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
  {
    file: "pcc-resident-listing-real-format.txt",
    expected: {
      minResidents: 5,
      mrns: ["LON202419", "LON202072", "200690", "LON202440", "200854"],
      duplicateResidents: 0,
      maxWarnings: 0,
      fieldChecks: [
        { mrn: "LON202419", age: "68", unit: "Unit 2", roomBed: "253-A", sex: "M", physician: "Dinesh Sethi", diagnosis: "S98.122D" },
        { mrn: "LON202440", unit: "Unit 2", roomBed: "265-B", physician: "Dinesh Sethi", diagnosis: "J18.9" },
        { mrn: "200854", unit: "Unit 4", roomBed: "470-A", physician: "Dr. Nenad Grlic", diagnosis: "E11.40" },
      ],
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
  return residents.map((resident) => `${resident.fullName || resident.name || "Unknown"} | ${resident.mrn || "No MRN"} | ${resident.age || "No Age"} | ${resident.unit || "No Unit"} | ${resident.roomBed || resident.room || "No Room"} | ${resident.attendingPhysician || "No Physician"} | ${resident.primaryDiagnosis || "No Diagnosis"}`);
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

    for (const check of fixture.expected.fieldChecks || []) {
      const resident = result.residents.find((item) => item.mrn === check.mrn);
      assert(Boolean(resident), `Expected field check resident MRN ${check.mrn} was not parsed.`);
      for (const [field, expectedValue] of Object.entries(check)) {
        if (field === "mrn") continue;
        const actualValue = field === "physician" ? resident.attendingPhysician : field === "diagnosis" ? resident.primaryDiagnosis : resident[field];
        assert(actualValue === expectedValue, `Expected ${field} for MRN ${check.mrn} to be ${expectedValue}, got ${actualValue || "blank"}`);
      }
    }

    if (typeof fixture.expected.duplicateResidents === "number") {
      assert(result.summary.duplicateResidents === fixture.expected.duplicateResidents, `Expected ${fixture.expected.duplicateResidents} duplicate group(s), got ${result.summary.duplicateResidents}`);
    }

    if (typeof fixture.expected.minWarnings === "number") {
      assert(result.summary.residentsWithWarnings >= fixture.expected.minWarnings, `Expected at least ${fixture.expected.minWarnings} resident(s) with warnings, got ${result.summary.residentsWithWarnings}`);
    }

    if (typeof fixture.expected.maxWarnings === "number") {
      assert(result.summary.residentsWithWarnings <= fixture.expected.maxWarnings, `Expected at most ${fixture.expected.maxWarnings} resident(s) with warnings, got ${result.summary.residentsWithWarnings}`);
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
