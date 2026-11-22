import fs from 'node:fs';

let content = fs.readFileSync('src/features/landlocker/LandLockerPage.tsx', 'utf8').replace(/\r\n/g, '\n');

// Replace the invalid function declaration
const badFnStart = '    const renderDigiLockerModal = () => (\n    {/* In-App DigiLocker Consent Modal */}\n      {showConsentModal && (';
const goodFnStart = '  const renderDigiLockerModal = () => {\n    if (!showConsentModal) return null;\n    return (';

content = content.replace(badFnStart, goodFnStart);

// Replace the end of that function: `      )}\n  );` -> `    );\n  };`
const badFnEnd = '      )}\n  );';
const goodFnEnd = '    );\n  };';

content = content.replace(badFnEnd, goodFnEnd);

fs.writeFileSync('src/features/landlocker/LandLockerPage.tsx', content, 'utf8');
console.log('Fixed renderDigiLockerModal');
