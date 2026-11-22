import fs from 'node:fs';

let content = fs.readFileSync('src/features/admin/DashboardsAndAdmin.tsx', 'utf8').replace(/\r\n/g, '\n');

// 1. Add import
if (!content.includes("import { AccountSecuritySettingsPanel } from '../profile/AccountSecuritySettingsPanel';")) {
  content = "import { AccountSecuritySettingsPanel } from '../profile/AccountSecuritySettingsPanel';\n" + content;
}

// 2. Update BuyerDashboardPage activeTab type
content = content.replace(
  "  const [activeTab, setActiveTab] = useState<\n    'saved' | 'explore' | 'passport' | 'compare' | 'enquiries' | 'verification' | 'faqs'\n  >('saved');",
  "  const [activeTab, setActiveTab] = useState<\n    'saved' | 'explore' | 'passport' | 'compare' | 'enquiries' | 'verification' | 'faqs' | 'settings'\n  >('saved');"
);

// 3. Add settings tab to BuyerDashboardPage tabs list
const buyerOldTabs = `          { id: 'verification', label: \`📋 Due Diligence Checklists (\${cases.length})\` },
          { id: 'faqs', label: '❓ Buyer FAQs & Guidance' },
        ].map((tab) => (`;

const buyerNewTabs = `          { id: 'verification', label: \`📋 Due Diligence Checklists (\${cases.length})\` },
          { id: 'faqs', label: '❓ Buyer FAQs & Guidance' },
          { id: 'settings', label: '⚙️ Account & Security Settings' },
        ].map((tab) => (`;

content = content.replace(buyerOldTabs, buyerNewTabs);

// 4. Add render block for Buyer settings tab before the closing div of BuyerDashboardPage
// Search for end of FAQS tab in BuyerDashboardPage: `{activeTab === 'faqs' && (`
const buyerFaqsMarker = "{activeTab === 'faqs' && (";
const buyerFaqsIdx = content.indexOf(buyerFaqsMarker);
if (buyerFaqsIdx === -1) {
  console.error('Could not find buyerFaqsMarker');
  process.exit(1);
}

// Find the closing of this tab and end of BuyerDashboardPage: `export const SellerDashboardPage`
const sellerStartMarker = 'export const SellerDashboardPage: React.FC = () => {';
const sellerStartIdx = content.indexOf(sellerStartMarker);
if (sellerStartIdx === -1) {
  console.error('Could not find sellerStartMarker');
  process.exit(1);
}

const beforeSeller = content.slice(0, sellerStartIdx);
const lastDivBeforeSeller = beforeSeller.lastIndexOf('    </div>\n  );\n};\n\n');

if (lastDivBeforeSeller === -1) {
  console.error('Could not find lastDivBeforeSeller');
  process.exit(1);
}

const buyerSettingsBlock = `      {activeTab === 'settings' && (
        <div className="space-y-6">
          <AccountSecuritySettingsPanel />
        </div>
      )}\n`;

content = content.slice(0, lastDivBeforeSeller) + buyerSettingsBlock + content.slice(lastDivBeforeSeller);

// 5. Update SellerDashboardPage activeTab type
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'listings' | 'enquiries' | 'documents' | 'faqs'>('listings');",
  "const [activeTab, setActiveTab] = useState<'listings' | 'enquiries' | 'documents' | 'faqs' | 'settings'>('listings');"
);

// 6. Add settings tab to SellerDashboardPage tabs list
const sellerOldTabs = `          { id: 'documents', label: \`🔒 LandLocker Document Permissions (\${documents.length})\` },
          { id: 'faqs', label: '❓ Seller FAQs & Guidelines' },
        ].map((tab) => (`;

const sellerNewTabs = `          { id: 'documents', label: \`🔒 LandLocker Document Permissions (\${documents.length})\` },
          { id: 'faqs', label: '❓ Seller FAQs & Guidelines' },
          { id: 'settings', label: '⚙️ Account & Security Settings' },
        ].map((tab) => (`;

content = content.replace(sellerOldTabs, sellerNewTabs);

// 7. Add render block for Seller settings tab
const sellerFaqsMarker = "{activeTab === 'faqs' && (";
const lastSellerFaqsIdx = content.lastIndexOf(sellerFaqsMarker);
if (lastSellerFaqsIdx === -1) {
  console.error('Could not find lastSellerFaqsIdx');
  process.exit(1);
}

// Find end of SellerDashboardPage: `export const ReviewerAdminConsolePage`
const reviewerMarker = 'export const ReviewerAdminConsolePage: React.FC = () => {';
const reviewerIdx = content.indexOf(reviewerMarker);
if (reviewerIdx === -1) {
  console.error('Could not find reviewerMarker');
  process.exit(1);
}

const beforeReviewer = content.slice(0, reviewerIdx);
const lastDivBeforeReviewer = beforeReviewer.lastIndexOf('    </div>\n  );\n};\n\n');
if (lastDivBeforeReviewer === -1) {
  console.error('Could not find lastDivBeforeReviewer');
  process.exit(1);
}

const sellerSettingsBlock = `      {activeTab === 'settings' && (
        <div className="space-y-6">
          <AccountSecuritySettingsPanel />
        </div>
      )}\n`;

content = content.slice(0, lastDivBeforeReviewer) + sellerSettingsBlock + content.slice(lastDivBeforeReviewer);

fs.writeFileSync('src/features/admin/DashboardsAndAdmin.tsx', content, 'utf8');
console.log('DashboardsAndAdmin.tsx updated successfully!');
