import fs from 'node:fs';

let content = fs.readFileSync('src/app/AppContext.tsx', 'utf8').replace(/\r\n/g, '\n');

const oldReply = `  const replyToEnquiry = (enquiryId: string, message: string) => {
    if (API_MODE && (!state.currentUser || state.currentUser.role !== 'seller')) { showToast('Sign in with the seller account to reply to enquiries.'); return; }
    const sender = state.currentUser || {
      email: 'seller@demo.dharitrisentu.test',
      name: 'Pranabjyoti Kalita (Seller)',
      role: 'seller' as UserRole,
    };
    setState((prev) => {
      const updated = prev.enquiries.map((enq) => {
        if (enq.id !== enquiryId) return enq;
        return {
          ...enq,
          status: 'Replied' as const,
          replies: [
            ...enq.replies,
            {
              id: \`rep-\${Date.now()}\`,
              senderEmail: sender.email,
              senderName: sender.name,
              senderRole: sender.role,
              message,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      });
      return { ...prev, enquiries: updated };
    });
    showToast('Reply sent to buyer');
  };`;

const newReply = `  const replyToEnquiry = (enquiryId: string, message: string) => {
    const sender = state.currentUser || {
      email: 'seller@demo.dharitrisentu.test',
      name: 'Pranabjyoti Kalita (Seller)',
      role: 'seller' as UserRole,
    };
    setState((prev) => {
      const updated = prev.enquiries.map((enq) => {
        if (enq.id !== enquiryId) return enq;
        return {
          ...enq,
          status: 'Replied' as const,
          replies: [
            ...enq.replies,
            {
              id: \`rep-\${Date.now()}\`,
              senderEmail: sender.email,
              senderName: sender.name,
              senderRole: sender.role,
              message,
              timestamp: new Date().toISOString(),
            },
          ],
        };
      });
      return { ...prev, enquiries: updated };
    });

    if (API_MODE) {
      apiRequest('/api/notifications/seller-reply', {
        method: 'POST',
        body: JSON.stringify({ enquiryId, message, senderName: sender.name, senderEmail: sender.email }),
      }).catch((err) => console.warn('Reply notification error:', err));
    }
    showToast('Reply dispatched to buyer & notification sent');
  };`;

if (!content.includes(oldReply)) {
  console.error('Target reply block not found');
  process.exit(1);
}

content = content.replace(oldReply, newReply);
fs.writeFileSync('src/app/AppContext.tsx', content, 'utf8');
console.log('AppContext replyToEnquiry updated successfully!');
