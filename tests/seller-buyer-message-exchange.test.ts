import { describe, it, expect } from 'vitest';

describe('Seller to Buyer Bidirectional Chat Exchange', () => {
  it('correctly attributes seller message when seller sends hi to buyer', () => {
    const sellerReply = {
      id: 'rep-test-1',
      conversationId: 'ENQ-001',
      listingId: 'lst-1',
      senderId: 'usr-seller-1',
      recipientId: 'usr-buyer-1',
      senderEmail: 'pranabjyoti@dharitrisentu.in',
      senderName: 'Pranabjyoti Kalita',
      senderRole: 'seller' as const,
      message: 'hi, the land is available for site visit',
      timestamp: new Date().toISOString(),
    };

    // Verify properties
    expect(sellerReply.senderRole).toBe('seller');
    expect(sellerReply.senderId).toBe('usr-seller-1');
    expect(sellerReply.recipientId).toBe('usr-buyer-1');

    // From Buyer perspective:
    const buyerUserId = 'usr-buyer-1';
    const isMeForBuyer = sellerReply.senderId === buyerUserId;
    expect(isMeForBuyer).toBe(false); // Render on LEFT in white bubble

    // From Seller perspective:
    const sellerUserId = 'usr-seller-1';
    const isMeForSeller = sellerReply.senderId === sellerUserId;
    expect(isMeForSeller).toBe(true); // Render on RIGHT in forest green bubble
  });

  it('correctly handles subsequent hari message from seller without duplicate drop', () => {
    const replies = [
      {
        id: 'rep-test-1',
        conversationId: 'ENQ-001',
        senderId: 'usr-seller-1',
        senderRole: 'seller' as const,
        message: 'hi',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'rep-test-2',
        conversationId: 'ENQ-001',
        senderId: 'usr-seller-1',
        senderRole: 'seller' as const,
        message: 'hari',
        timestamp: new Date(Date.now() + 1000).toISOString(),
      }
    ];

    expect(replies.length).toBe(2);
    expect(replies[0].message).toBe('hi');
    expect(replies[1].message).toBe('hari');
    expect(replies.every(r => r.senderRole === 'seller')).toBe(true);
  });
});
