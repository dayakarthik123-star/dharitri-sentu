import fs from 'node:fs';

let content = fs.readFileSync('src/features/landlocker/LandLockerPage.tsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Add import
if (!content.includes("import { BuyerLandVault } from './BuyerLandVault';")) {
  content = content.replace(
    "import { LandLockerCategory, LandLockerDocument } from '../../types';",
    "import { LandLockerCategory, LandLockerDocument } from '../../types';\nimport { BuyerLandVault } from './BuyerLandVault';"
  );
}

// 2. Find the modal start and end
const modalStartStr = '{/* In-App DigiLocker Consent Modal */}';
const modalEndStr = '      {/* In-App DigiLocker Consent Modal */}';

const modalIdx = content.indexOf(modalStartStr);
if (modalIdx === -1) {
  console.error('Could not find modal start');
  process.exit(1);
}

// From modalIdx to the closing `      )}\n    </div>`
const lastDivIdx = content.lastIndexOf('    </div>\n  );');
if (lastDivIdx === -1) {
  console.error('Could not find lastDivIdx');
  process.exit(1);
}

const modalBlock = content.slice(modalIdx, lastDivIdx).trim();

// Create renderDigiLockerModal
const modalFunction = `  const renderDigiLockerModal = () => (
    ${modalBlock}
  );`;

// Remove original modal block from the bottom
let beforeModal = content.slice(0, modalIdx);
let afterModal = `      {renderDigiLockerModal()}\n    </div>\n  );\n};`;

// Insert buyer role check right after workspaceTabs definition
const tabsEndStr = '  ];\n\n  return (';
const tabsEndIdx = beforeModal.indexOf(tabsEndStr);

if (tabsEndIdx === -1) {
  console.error('Could not find tabsEndStr');
  process.exit(1);
}

const buyerBranch = `  ];

  ${modalFunction}

  if (currentUser?.role === 'buyer') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-cream pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-teagreen">
              Buyer Land Vault · MeriPehchaan DigiLocker · Statutory Due-Diligence
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-evergreen mt-1">
              Buyer Land Vault & Document Toolkit
            </h1>
            <p className="text-xs sm:text-sm text-secondarytext mt-1">
              Verify your buyer identity with MeriPehchaan, inspect shared seller deeds with zero-knowledge cryptographic hashes, and track the 5-point Assam land due-diligence audit.
            </p>
          </div>
        </div>

        {digilockerNotice && (
          <div
            role="status"
            className="p-4 rounded-2xl bg-palesky border border-mistyblue text-xs text-evergreen flex flex-wrap items-center justify-between gap-3 shadow-sm"
          >
            <div className="space-y-1">
              <div className="font-bold">
                🏛️ DigiLocker / API Setu Adapter ({DIGILOCKER_API_SETU_BASE_URL})
              </div>
              <p className="text-maintext font-medium">{digilockerNotice}</p>
            </div>
            <button
              type="button"
              onClick={() => setDigilockerNotice(null)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-cream text-secondarytext font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        <BuyerLandVault
          isDigiLockerConnected={isDigiLockerConnected}
          onConnectDigiLocker={handleConnectDigiLocker}
          documents={enrichedDocuments}
          currentUser={currentUser}
          showToast={showToast}
          t={t}
        />

        {renderDigiLockerModal()}
      </div>
    );
  }

  return (`;

const updatedContent = beforeModal.slice(0, tabsEndIdx) + buyerBranch + beforeModal.slice(tabsEndIdx + tabsEndStr.length) + afterModal;

fs.writeFileSync('src/features/landlocker/LandLockerPage.tsx', updatedContent, 'utf8');
console.log('LandLockerPage updated successfully!');
