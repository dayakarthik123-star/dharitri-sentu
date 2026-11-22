import fs from 'node:fs';

let content = fs.readFileSync('src/app/AppContext.tsx', 'utf8');

const target1 = `  submitEnquiry: (listingId: string, subject: string, message: string) => void;`;
const repl1 = `  submitEnquiry: (
    listingId: string,
    subject: string,
    message: string,
    buyerDetails?: { name?: string; email?: string; phone?: string }
  ) => void;`;

content = content.replace(target1, repl1);

const searchBlock = `  const submitEnquiry = (listingId: string, subject: string, message: string) => {
    if (API_MODE && (!state.currentUser || state.currentUser.role !== 'buyer')) { showToast('Sign in with a buyer account to contact the seller.'); return; }
    const listing = state.listings.find((l) => l.id === listingId);
    if (!listing) return;
    const buyer = state.currentUser || {
      email: 'buyer@demo.dharitrisentu.test',
      name: 'Ananya Baruah (Buyer)',
      role: 'buyer' as UserRole,
    };
    const newEnq: Enquiry = {
      id: \`ENQ-00\${state.enquiries.length + 1}\`,
      listingId: listing.id,
      parcelId: listing.parcelId,
      listingTitle: listing.title,
      buyerEmail: buyer.email,
      buyerName: buyer.name,
      sellerEmail: listing.sellerEmail,
      subject,
      message,
      status: 'Sent',
      createdAt: new Date().toISOString(),
      replies: [],
    };
    const audit: AuditEvent = {
      id: \`AUD-\${Date.now()}\`,
      timestamp: new Date().toISOString(),
      actorEmail: buyer.email,
      actorRole: 'buyer',
      actionType: 'ENQUIRY_SENT',
      targetId: newEnq.id,
      summary: \`Buyer sent enquiry "\${subject}" regarding \${listing.title}.\`,
    };
    setState((prev) => ({
      ...prev,
      enquiries: [newEnq, ...prev.enquiries],
      auditEvents: [audit, ...prev.auditEvents],
    }));
    showToast(\`Enquiry sent to seller for \${listing.title}\`);
  };`;

const newBlock = `  const submitEnquiry = (
    listingId: string,
    subject: string,
    message: string,
    buyerDetails?: { name?: string; email?: string; phone?: string }
  ) => {
    const listing = state.listings.find((l) => l.id === listingId);
    if (!listing) return;
    const buyerEmail = buyerDetails?.email || state.currentUser?.email || 'buyer@demo.dharitrisentu.test';
    const buyerName = buyerDetails?.name || state.currentUser?.name || 'Ananya Baruah (Buyer)';
    const buyerPhone = buyerDetails?.phone || '';
    const newEnq: Enquiry = {
      id: \`ENQ-00\${state.enquiries.length + 1}\`,
      listingId: listing.id,
      parcelId: listing.parcelId,
      listingTitle: listing.title,
      buyerEmail,
      buyerName,
      buyerPhone,
      sellerEmail: listing.sellerEmail,
      subject,
      message,
      status: 'Sent',
      createdAt: new Date().toISOString(),
      replies: [],
    };
    const audit: AuditEvent = {
      id: \`AUD-\${Date.now()}\`,
      timestamp: new Date().toISOString(),
      actorEmail: buyerEmail,
      actorRole: (state.currentUser?.role || 'buyer') as UserRole,
      actionType: 'ENQUIRY_SENT',
      targetId: newEnq.id,
      summary: \`Buyer sent enquiry "\${subject}" regarding \${listing.title}.\`,
    };
    setState((prev) => ({
      ...prev,
      enquiries: [newEnq, ...prev.enquiries],
      auditEvents: [audit, ...prev.auditEvents],
    }));
    showToast(\`Enquiry sent to seller for \${listing.title}\`);
  };`;

// normalize line endings for match
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedSearch = searchBlock.replace(/\r\n/g, '\n');
const normalizedNew = newBlock.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedSearch)) {
  const updated = normalizedContent.replace(normalizedSearch, normalizedNew);
  fs.writeFileSync('src/app/AppContext.tsx', updated, 'utf8');
  console.log('Successfully updated AppContext.tsx');
} else {
  console.error('Target block not found in AppContext.tsx');
}
