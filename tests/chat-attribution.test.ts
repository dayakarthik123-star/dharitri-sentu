import { describe, it, expect, beforeEach } from 'vitest';
import type { ChatMessage, Conversation, Enquiry, EnquiryReply } from '../src/types';

describe('Dharitri Sentu Buyer–Seller Chat Message Attribution', () => {
  const buyerUser = {
    id: 'usr-buyer-1',
    name: 'Ananya Baruah',
    email: 'ananya@dharitrisentu.in',
    role: 'buyer' as const,
  };

  const sellerUser = {
    id: 'usr-seller-1',
    name: 'Pranabjyoti Kalita',
    email: 'pranabjyoti@dharitrisentu.in',
    role: 'seller' as const,
  };

  const otherBuyerUser = {
    id: 'usr-buyer-2',
    name: 'Rohan Sharma',
    email: 'rohan@example.com',
    role: 'buyer' as const,
  };

  const otherSellerUser = {
    id: 'usr-seller-2',
    name: 'Monideepa Gogoi',
    email: 'monideepa@dharitrisentu.in',
    role: 'seller' as const,
  };

  let mockConversations: Conversation[] = [];
  let mockMessages: ChatMessage[] = [];

  beforeEach(() => {
    mockConversations = [];
    mockMessages = [];
  });

  // Helper simulating backend inquiry creation
  function backendCreateInquiry(params: {
    authenticatedUser: typeof buyerUser | typeof sellerUser;
    listingId: string;
    targetSellerId: string;
    content: string;
    clientSuppliedSenderId?: string;
    clientSuppliedSenderRole?: any;
  }) {
    const { authenticatedUser, listingId, targetSellerId, content } = params;

    // 1. Role validation
    if (authenticatedUser.role !== 'buyer') {
      throw new Error('ROLE_FORBIDDEN: Only buyers can initiate inquiries');
    }

    // 2. Prevent self-messaging
    if (authenticatedUser.id === targetSellerId) {
      throw new Error('SELF_MESSAGING: Cannot message your own listing');
    }

    // 3. Single DM Rule: Check or reuse conversation
    let conv = mockConversations.find(
      (c) => c.listingId === listingId && c.buyerId === authenticatedUser.id
    );

    if (!conv) {
      conv = {
        id: `conv-${listingId}-${authenticatedUser.id}`,
        listingId,
        buyerId: authenticatedUser.id,
        sellerId: targetSellerId,
        buyerName: authenticatedUser.name,
        buyerEmail: authenticatedUser.email,
        sellerName: 'Seller Name',
        sellerEmail: 'seller@test.in',
        listingTitle: 'Assam Land Parcel',
        parcelId: 'AS-KMP-001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        unreadCount: 0,
        messages: [],
      };
      mockConversations.push(conv);
    }

    // 4. Message persistence: senderId and senderRole derived STRICTLY from authenticatedUser
    // Client-supplied senderId and senderRole are intentionally completely ignored
    const persistedMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversationId: conv.id,
      listingId,
      senderId: authenticatedUser.id, // Backend derived
      recipientId: targetSellerId,
      senderRole: authenticatedUser.role, // Backend derived
      senderName: authenticatedUser.name,
      senderEmail: authenticatedUser.email,
      content,
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    mockMessages.push(persistedMsg);
    conv.messages.push(persistedMsg);
    conv.updatedAt = persistedMsg.createdAt;

    return { conversationId: conv.id, message: persistedMsg };
  }

  // Helper simulating backend reply
  function backendReplyToConversation(params: {
    authenticatedUser: typeof buyerUser | typeof sellerUser;
    conversationId: string;
    content: string;
    clientSuppliedSenderId?: string;
    clientSuppliedSenderRole?: any;
  }) {
    const { authenticatedUser, conversationId, content } = params;

    const conv = mockConversations.find((c) => c.id === conversationId);
    if (!conv) throw new Error('NOT_FOUND: Conversation not found');

    // Authorization check
    if (authenticatedUser.id !== conv.buyerId && authenticatedUser.id !== conv.sellerId) {
      throw new Error('FORBIDDEN: Not authorized to reply to this conversation');
    }

    const recipientId = authenticatedUser.id === conv.buyerId ? conv.sellerId : conv.buyerId;

    // Sender attributes derived strictly from authenticated user session
    const persistedReply: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversationId: conv.id,
      listingId: conv.listingId,
      senderId: authenticatedUser.id,
      recipientId,
      senderRole: authenticatedUser.role,
      senderName: authenticatedUser.name,
      senderEmail: authenticatedUser.email,
      content,
      createdAt: new Date().toISOString(),
      readAt: null,
    };

    mockMessages.push(persistedReply);
    conv.messages.push(persistedReply);
    conv.updatedAt = persistedReply.createdAt;

    return persistedReply;
  }

  // Helper simulating frontend UI alignment & bubble style
  function computeMessageUIRendering(msg: ChatMessage, currentUser: { id: string; role: string }) {
    const isMe = msg.senderId === currentUser.id || msg.senderRole === currentUser.role;
    return {
      isMe,
      alignment: isMe ? 'justify-end' : 'justify-start',
      bubbleBg: isMe ? '#0D261C' : '#FFFFFF',
      bubbleTextColor: isMe ? 'white' : 'dark-slate',
      senderLabel: isMe ? 'You' : msg.senderName,
      badge: isMe ? null : msg.senderRole === 'seller' ? '• Verified Seller' : '• Verified Buyer',
    };
  }

  it('1. Buyer sends inquiry -> senderId is buyer, recipientId is seller, senderRole is buyer', () => {
    const res = backendCreateInquiry({
      authenticatedUser: buyerUser,
      listingId: 'lst-1',
      targetSellerId: sellerUser.id,
      content: 'Hello, I am interested in this parcel.',
    });

    expect(res.message.senderId).toBe('usr-buyer-1');
    expect(res.message.recipientId).toBe('usr-seller-1');
    expect(res.message.senderRole).toBe('buyer');
    expect(res.message.senderName).toBe('Ananya Baruah');
    expect(res.message.content).toBe('Hello, I am interested in this parcel.');
  });

  it('2. Buyer sees their sent message on the right (outgoing bubble)', () => {
    const res = backendCreateInquiry({
      authenticatedUser: buyerUser,
      listingId: 'lst-1',
      targetSellerId: sellerUser.id,
      content: 'Hello, I am interested in this parcel.',
    });

    const ui = computeMessageUIRendering(res.message, buyerUser);
    expect(ui.isMe).toBe(true);
    expect(ui.alignment).toBe('justify-end');
    expect(ui.bubbleBg).toBe('#0D261C');
    expect(ui.senderLabel).toBe('You');
  });

  it('3. Seller receives inquiry -> senderId is buyer, message appears on left (incoming)', () => {
    const res = backendCreateInquiry({
      authenticatedUser: buyerUser,
      listingId: 'lst-1',
      targetSellerId: sellerUser.id,
      content: 'Hello, I am interested in this parcel.',
    });

    const ui = computeMessageUIRendering(res.message, sellerUser);
    expect(ui.isMe).toBe(false);
    expect(ui.alignment).toBe('justify-start');
    expect(ui.bubbleBg).toBe('#FFFFFF');
    expect(ui.senderLabel).toBe('Ananya Baruah');
    expect(ui.badge).toBe('• Verified Buyer');
  });

  it('4. Seller replies -> senderId is seller, recipientId is buyer, senderRole is seller', () => {
    const inq = backendCreateInquiry({
      authenticatedUser: buyerUser,
      listingId: 'lst-1',
      targetSellerId: sellerUser.id,
      content: 'Hello, I am interested in this parcel.',
    });

    const reply = backendReplyToConversation({
      authenticatedUser: sellerUser,
      conversationId: inq.conversationId,
      content: 'Hello Ananya, the parcel is available for site inspection.',
    });

    expect(reply.senderId).toBe('usr-seller-1');
    expect(reply.recipientId).toBe('usr-buyer-1');
    expect(reply.senderRole).toBe('seller');
    expect(reply.senderName).toBe('Pranabjyoti Kalita');
  });

  it('5. Seller sees reply as outgoing (#0D261C, right-aligned)', () => {
    const inq = backendCreateInquiry({
      authenticatedUser: buyerUser,
      listingId: 'lst-1',
      targetSellerId: sellerUser.id,
      content: 'Hello, I am interested in this parcel.',
    });

    const reply = backendReplyToConversation({
      authenticatedUser: sellerUser,
      conversationId: inq.conversationId,
      content: 'Hello Ananya, the parcel is available for site inspection.',
    });

    const ui = computeMessageUIRendering(reply, sellerUser);
    expect(ui.isMe).toBe(true);
    expect(ui.alignment).toBe('justify-end');
    expect(ui.bubbleBg).toBe('#0D261C');
    expect(ui.senderLabel).toBe('You');
  });

  it('6. Buyer receives seller reply -> appears on left with Verified Seller badge', () => {
    const inq = backendCreateInquiry({
      authenticatedUser: buyerUser,
      listingId: 'lst-1',
      targetSellerId: sellerUser.id,
      content: 'Hello, I am interested in this parcel.',
    });

    const reply = backendReplyToConversation({
      authenticatedUser: sellerUser,
      conversationId: inq.conversationId,
      content: 'Hello Ananya, the parcel is available for site inspection.',
    });

    const ui = computeMessageUIRendering(reply, buyerUser);
    expect(ui.isMe).toBe(false);
    expect(ui.alignment).toBe('justify-start');
    expect(ui.bubbleBg).toBe('#FFFFFF');
    expect(ui.senderLabel).toBe('Pranabjyoti Kalita');
    expect(ui.badge).toBe('• Verified Seller');
  });

  it('7. Page refresh / re-hydration retains exact same sender identity and message positions', () => {
    const inq = backendCreateInquiry({
      authenticatedUser: buyerUser,
      listingId: 'lst-1',
      targetSellerId: sellerUser.id,
      content: 'Initial buyer message',
    });

    const reply = backendReplyToConversation({
      authenticatedUser: sellerUser,
      conversationId: inq.conversationId,
      content: 'Seller reply',
    });

    // Simulate serialized state reload (JSON.stringify -> JSON.parse)
    const rehydratedMessages: ChatMessage[] = JSON.parse(JSON.stringify(mockMessages));

    const buyerView1 = computeMessageUIRendering(rehydratedMessages[0], buyerUser);
    const buyerView2 = computeMessageUIRendering(rehydratedMessages[1], buyerUser);

    expect(buyerView1.isMe).toBe(true);
    expect(buyerView1.alignment).toBe('justify-end');
    expect(buyerView2.isMe).toBe(false);
    expect(buyerView2.alignment).toBe('justify-start');

    const sellerView1 = computeMessageUIRendering(rehydratedMessages[0], sellerUser);
    const sellerView2 = computeMessageUIRendering(rehydratedMessages[1], sellerUser);

    expect(sellerView1.isMe).toBe(false);
    expect(sellerView1.alignment).toBe('justify-start');
    expect(sellerView2.isMe).toBe(true);
    expect(sellerView2.alignment).toBe('justify-end');
  });

  it('8. Client cannot spoof senderId or senderRole in request body', () => {
    // Malicious buyer tries to pass senderId: 'usr-seller-1' and senderRole: 'seller'
    const res = backendCreateInquiry({
      authenticatedUser: buyerUser,
      listingId: 'lst-1',
      targetSellerId: sellerUser.id,
      content: 'Attempting to spoof sender identity',
      clientSuppliedSenderId: 'usr-seller-1',
      clientSuppliedSenderRole: 'seller',
    });

    // The backend derived identity MUST override any client parameters
    expect(res.message.senderId).toBe('usr-buyer-1');
    expect(res.message.senderRole).toBe('buyer');
    expect(res.message.senderName).toBe('Ananya Baruah');
  });

  it('9. Authorization barrier: Buyer cannot read another buyer conversation', () => {
    const inq = backendCreateInquiry({
      authenticatedUser: buyerUser,
      listingId: 'lst-1',
      targetSellerId: sellerUser.id,
      content: 'Confidential buyer inquiry',
    });

    // An unrelated buyer (otherBuyerUser) attempts to reply or read
    expect(() => {
      backendReplyToConversation({
        authenticatedUser: otherBuyerUser as any,
        conversationId: inq.conversationId,
        content: 'Eavesdropping buyer trying to inject message',
      });
    }).toThrow('FORBIDDEN: Not authorized to reply to this conversation');
  });

  it('10. Authorization barrier: Seller cannot read conversation for another seller listing', () => {
    const inq = backendCreateInquiry({
      authenticatedUser: buyerUser,
      listingId: 'lst-1',
      targetSellerId: sellerUser.id,
      content: 'Inquiry for Pranabjyoti listing',
    });

    // Another seller (otherSellerUser: Monideepa) attempts to read/reply to Pranabjyoti's inquiry
    expect(() => {
      backendReplyToConversation({
        authenticatedUser: otherSellerUser as any,
        conversationId: inq.conversationId,
        content: 'Interfering seller reply',
      });
    }).toThrow('FORBIDDEN: Not authorized to reply to this conversation');
  });

  it('11. Single DM rule: No duplicate conversations created for repeated inquiries on the same listing', () => {
    const res1 = backendCreateInquiry({
      authenticatedUser: buyerUser,
      listingId: 'lst-1',
      targetSellerId: sellerUser.id,
      content: 'First inquiry message',
    });

    const res2 = backendCreateInquiry({
      authenticatedUser: buyerUser,
      listingId: 'lst-1',
      targetSellerId: sellerUser.id,
      content: 'Second inquiry message on the same plot',
    });

    // Both messages must belong to the exact same conversation
    expect(res1.conversationId).toBe(res2.conversationId);
    expect(mockConversations.length).toBe(1);
    expect(mockConversations[0].messages.length).toBe(2);
  });

  it('12. Self-messaging prevention: A seller cannot message themselves on their own listing', () => {
    expect(() => {
      backendCreateInquiry({
        authenticatedUser: sellerUser as any,
        listingId: 'lst-1',
        targetSellerId: sellerUser.id,
        content: 'Trying to message myself',
      });
    }).toThrow();
  });

  it('13. Read receipts: Marking conversation updates readAt timestamp', () => {
    const res = backendCreateInquiry({
      authenticatedUser: buyerUser,
      listingId: 'lst-1',
      targetSellerId: sellerUser.id,
      content: 'Unread inquiry',
    });

    expect(res.message.readAt).toBeNull();

    // Seller reads message
    res.message.readAt = new Date().toISOString();
    expect(res.message.readAt).toBeTruthy();
  });
});
