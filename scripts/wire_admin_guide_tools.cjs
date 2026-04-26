const fs = require('fs');
const path = require('path');

const appPath = path.join(process.cwd(), 'src', 'App.tsx');
if (!fs.existsSync(appPath)) {
  console.error('src/App.tsx not found. Run this from the repo root.');
  process.exit(1);
}

let source = fs.readFileSync(appPath, 'utf8');
const original = source;

const importLine = 'import { AdminGuideTools } from "./components/AdminGuideTools";';
if (!source.includes(importLine)) {
  const anchor = 'import { VersionHistoryPanel } from "./components/VersionHistoryPanel";';
  if (!source.includes(anchor)) {
    console.error('Could not find VersionHistoryPanel import anchor. No changes made.');
    process.exit(1);
  }
  source = source.replace(anchor, `${anchor}\n${importLine}`);
}

const adminGuideToolsBlock = `
              <AdminGuideTools
                currentUserRole={currentUser?.role}
                facilities={facilities}
                currentFacilityId={currentFacilityId}
                setCurrentFacilityId={setCurrentFacilityId}
                setEditingFac={setEditingFac}
                setIsFacModalOpen={setIsFacModalOpen}
                deleteFacility={deleteFacility}
                users={users}
                setEditingUser={setEditingUser}
                setIsUserModalOpen={setIsUserModalOpen}
              />
`;

function removeExistingFacilityManagementCards(text) {
  function findMatchingCardEnd(src, cardStart) {
    let depth = 0;
    let i = cardStart;
    while (i < src.length) {
      const nextOpen = src.indexOf('<Card', i);
      const nextClose = src.indexOf('</Card>', i);
      if (nextClose === -1) return -1;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1;
        i = nextOpen + 5;
        continue;
      }
      depth -= 1;
      i = nextClose + '</Card>'.length;
      if (depth === 0) return i;
    }
    return -1;
  }

  let result = text;
  while (true) {
    const titleIndex = result.indexOf('title="Facility Management"');
    if (titleIndex < 0) break;
    const cardStart = result.lastIndexOf('<Card', titleIndex);
    if (cardStart < 0) break;
    const cardEnd = findMatchingCardEnd(result, cardStart);
    if (cardEnd < 0) break;
    result = result.slice(0, cardStart) + result.slice(cardEnd);
  }
  return result;
}

source = removeExistingFacilityManagementCards(source);

if (!source.includes('<AdminGuideTools')) {
  const versionPanel = '<VersionHistoryPanel currentUserRole={currentUser?.role} />';
  const versionPanelIndex = source.indexOf(versionPanel);
  if (versionPanelIndex < 0) {
    console.error('Could not find VersionHistoryPanel render point. No changes made.');
    process.exit(1);
  }
  const insertAt = versionPanelIndex + versionPanel.length;
  source = source.slice(0, insertAt) + adminGuideToolsBlock + source.slice(insertAt);
}

if (source === original) {
  console.log('No changes were needed.');
} else {
  fs.writeFileSync(appPath, source);
  console.log('AdminGuideTools wired under VersionHistoryPanel. Run npm run build next.');
}
