import fs from 'node:fs';

let content = fs.readFileSync('src/components/Header.tsx', 'utf8');

const oldGroups = `  const groups: MenuGroup[] = useMemo(() => {
    if (currentUser?.role === 'reviewer') return [
      { labelKey: 'drawerReviewWorkspace', items: [
        { labelKey: 'drawerHome', path: '/', icon: Home },
        { labelKey: 'drawerOfficialDashboard', path: '/official/dashboard', icon: LayoutDashboard },
        { labelKey: 'drawerReviewCases', path: '/official/reviews', icon: ClipboardCheck },
        { labelKey: 'drawerDiscrepancyRegister', path: '/official/discrepancies', icon: ScanSearch },
        { labelKey: 'drawerLandLockerReviews', path: '/official/landlocker', icon: FolderLock },
        { labelKey: 'drawerTrustPassport', path: '/passport/lst-1', icon: FileCheck2 },
        { labelKey: 'drawerAuditHistory', path: '/official/audit', icon: ShieldCheck },
      ] },
      { labelKey: 'drawerAccount', items: [
        { labelKey: 'drawerProfileSettings', path: '/profile', icon: UserRound },
        { labelKey: 'drawerAbout', path: '/about', icon: CircleHelp },
      ] },
    ];
    if (currentUser?.role === 'seller') return [
      { labelKey: 'drawerSellerWorkspace', items: [
        { labelKey: 'drawerHome', path: '/', icon: Home },
        { labelKey: 'drawerSellerDashboard', path: '/dashboard/seller', icon: LayoutDashboard },
        { labelKey: 'drawerMyProperties', path: '/dashboard/seller', icon: Store },
        { labelKey: 'drawerCreateListing', path: '/sell/new', icon: Plus },
        { labelKey: 'drawerLandLocker', path: '/landlocker', icon: FolderLock },
        { labelKey: 'drawerDueDiligence', path: '/cases', icon: ClipboardCheck },
      ] },
      { labelKey: 'drawerDiscover', items: [
        { labelKey: 'drawerTrustPassport', path: '/passport/lst-1', icon: FileCheck2 },
        { labelKey: 'drawerTrustCentre', path: '/trust-centre', icon: ShieldCheck },
        { labelKey: 'drawerAskAI', path: '/assistant', icon: Sparkles },
      ] },
      { labelKey: 'drawerAccount', items: [{ labelKey: 'drawerProfileSettings', path: '/profile', icon: UserRound }] },
    ];
    if (currentUser?.role === 'buyer') return [
      { labelKey: 'drawerBuyerWorkspace', items: [
        { labelKey: 'drawerHome', path: '/', icon: Home },
        { labelKey: 'drawerBuyerDashboard', path: '/dashboard/buyer', icon: LayoutDashboard },
        { labelKey: 'drawerExploreLand', path: '/explore', icon: MapPinned },
        { labelKey: 'drawerPriceExplorer', path: '/price-explorer', icon: BarChart3 },
        { labelKey: 'drawerDueDiligence', path: '/cases', icon: ClipboardCheck },
        { labelKey: 'drawerLandLocker', path: '/landlocker', icon: FolderLock },
      ] },
      { labelKey: 'drawerTrustDocuments', items: [
        { labelKey: 'drawerTrustPassport', path: '/passport/lst-1', icon: FileCheck2 },
        { labelKey: 'drawerTrustCentre', path: '/trust-centre', icon: ShieldCheck },
        { labelKey: 'drawerAskAI', path: '/assistant', icon: Sparkles },
      ] },
      { labelKey: 'drawerAccount', items: [{ labelKey: 'drawerProfileSettings', path: '/profile', icon: UserRound }] },
    ];
    return [
      { labelKey: 'drawerDiscover', items: [
        { labelKey: 'drawerHome', path: '/', icon: Home },
        { labelKey: 'drawerExploreLand', path: '/explore', icon: MapPinned },
        { labelKey: 'drawerPriceExplorer', path: '/price-explorer', icon: BarChart3 },
      ] },
      { labelKey: 'drawerTrustDocuments', items: [
        { labelKey: 'drawerTrustCentre', path: '/trust-centre', icon: ShieldCheck },
        { labelKey: 'drawerTrustPassport', path: '/passport/lst-1', icon: FileCheck2 },
        { labelKey: 'drawerDueDiligence', path: '/due-diligence', icon: ClipboardCheck },
      ] },
      { labelKey: 'drawerLearn', items: [
        { labelKey: 'drawerAskAI', path: '/assistant', icon: Sparkles },
        { labelKey: 'drawerForBuyers', path: '/buyers', icon: UserRound },
        { labelKey: 'drawerForSellers', path: '/sellers', icon: Store },
        { labelKey: 'drawerAbout', path: '/about', icon: CircleHelp },
      ] },
    ];
  }, [currentUser?.role, t]);`;

const newGroups = `  const groups: MenuGroup[] = useMemo(() => {
    if (currentUser?.role === 'reviewer') return [
      { labelKey: 'drawerReviewWorkspace', items: [
        { labelKey: 'drawerHome', path: '/', icon: Home },
        { labelKey: 'drawerOfficialDashboard', path: '/official/dashboard', icon: LayoutDashboard },
        { labelKey: 'drawerReviewCases', path: '/official/reviews', icon: ClipboardCheck },
        { labelKey: 'drawerDiscrepancyRegister', path: '/official/discrepancies', icon: ScanSearch },
        { labelKey: 'drawerLandLockerReviews', path: '/official/landlocker', icon: FolderLock },
        { labelKey: 'drawerAuditHistory', path: '/official/audit', icon: ShieldCheck },
      ] },
      { labelKey: 'drawerAccount', items: [
        { labelKey: 'drawerProfileSettings', path: '/profile', icon: UserRound },
        { labelKey: 'drawerAbout', path: '/about', icon: CircleHelp },
      ] },
    ];
    if (currentUser?.role === 'seller') return [
      { labelKey: 'drawerSellerWorkspace', items: [
        { labelKey: 'drawerHome', path: '/', icon: Home },
        { labelKey: 'drawerSellerDashboard', path: '/dashboard/seller', icon: LayoutDashboard },
        { labelKey: 'drawerMyProperties', path: '/dashboard/seller', icon: Store },
        { labelKey: 'drawerCreateListing', path: '/sell/new', icon: Plus },
        { labelKey: 'drawerLandLocker', path: '/landlocker', icon: FolderLock },
        { labelKey: 'drawerDueDiligence', path: '/cases', icon: ClipboardCheck },
      ] },
      { labelKey: 'drawerDiscover', items: [
        { labelKey: 'drawerAskAI', path: '/assistant', icon: Sparkles },
      ] },
      { labelKey: 'drawerAccount', items: [{ labelKey: 'drawerProfileSettings', path: '/profile', icon: UserRound }] },
    ];
    if (currentUser?.role === 'buyer') return [
      { labelKey: 'drawerBuyerWorkspace', items: [
        { labelKey: 'drawerHome', path: '/', icon: Home },
        { labelKey: 'drawerExploreLand', path: '/explore', icon: MapPinned },
        { labelKey: 'drawerBuyerDashboard', path: '/dashboard/buyer', icon: LayoutDashboard },
        { labelKey: 'drawerLandLocker', path: '/landlocker', icon: FolderLock },
        { labelKey: 'drawerDueDiligence', path: '/cases', icon: ClipboardCheck },
        { labelKey: 'drawerPriceExplorer', path: '/price-explorer', icon: BarChart3 },
        { labelKey: 'drawerAskAI', path: '/assistant', icon: Sparkles },
      ] },
      { labelKey: 'drawerAccount', items: [{ labelKey: 'drawerProfileSettings', path: '/profile', icon: UserRound }] },
    ];
    return [
      { labelKey: 'drawerDiscover', items: [
        { labelKey: 'drawerHome', path: '/', icon: Home },
        { labelKey: 'drawerExploreLand', path: '/explore', icon: MapPinned },
        { labelKey: 'drawerPriceExplorer', path: '/price-explorer', icon: BarChart3 },
        { labelKey: 'drawerDueDiligence', path: '/due-diligence', icon: ClipboardCheck },
      ] },
      { labelKey: 'drawerLearn', items: [
        { labelKey: 'drawerAskAI', path: '/assistant', icon: Sparkles },
        { labelKey: 'drawerForBuyers', path: '/buyers', icon: UserRound },
        { labelKey: 'drawerForSellers', path: '/sellers', icon: Store },
        { labelKey: 'drawerAbout', path: '/about', icon: CircleHelp },
      ] },
    ];
  }, [currentUser?.role, t]);`;

content = content.replace(/\r\n/g, '\n').replace(oldGroups.replace(/\r\n/g, '\n'), newGroups);
fs.writeFileSync('src/components/Header.tsx', content, 'utf8');
console.log('Header.tsx updated successfully');
