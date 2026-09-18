"use client";

export interface WhatsAppBillItem {
  foodName: string;
  portionName: string;
  quantity: number;
  subtotal: number;
}

export interface WhatsAppBillPayload {
  id?: string;
  billNumber: number;
  orderReference: string;
  orderType: string;
  customerName?: string | null;
  customerPhone?: string | null;
  createdAt: string | Date;
  items: WhatsAppBillItem[];
  subtotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  status: string;
}

/**
 * Generates a super short, colorful, and highly attractive WhatsApp bill message.
 */
export function generateAttractiveShortMessage(bill: WhatsAppBillPayload): string {
  const hotelName = process.env.NEXT_PUBLIC_HOTEL_NAME || "HOTEL JB";
  const hotelAddress = process.env.NEXT_PUBLIC_HOTEL_ADDRESS || "Main Road, City Center";

  return `✨ *${hotelName.toUpperCase()}* ✨
━━━━━━━━━━━━━━━━━━
🙏 வணக்கம் *${bill.customerName || "அன்பான வாடிக்கையாளரே"}*!
நமது உணவகத்திற்கு வருகை தந்ததற்கு நன்றி! ❤️

🧾 *Bill No:* #${bill.billNumber} (${bill.orderReference})
💰 *Paid Total:* ₹${bill.totalAmount.toFixed(0)} (${bill.status || "PAID"})

🎁 *10% OFF Special Offer:*
அடுத்த முறை வரும்போது *10% தள்ளுபடி* பெற இந்த Promo Code-ஐ பயன்படுத்தவும்:
👉 Promo Code: *HOTEL10* 👈

📍 ${hotelAddress}
⭐ *மீண்டும் வருக! Have a wonderful day!* ⭐`;
}

/**
 * Dispatches WhatsApp bill receipt and offer.
 * - Opens direct WhatsApp link via anchor tag simulation to bypass popup blocker.
 * - Also notifies backend API for gateway logging.
 */
export async function sendWhatsAppBillAndOffer(
  bill: WhatsAppBillPayload,
  options: { manualOpen?: boolean } = {}
): Promise<boolean> {
  let phone = bill.customerPhone?.replace(/\D/g, "") || "";
  if (!phone || phone.length < 10) return false;

  // Trim to 10 digits if more than 10 digits without country code, or format to 91
  if (phone.length === 10) {
    phone = "91" + phone;
  } else if (phone.length > 10 && !phone.startsWith("91")) {
    phone = "91" + phone.slice(-10);
  }

  const message = generateAttractiveShortMessage(bill);

  const encoded = encodeURIComponent(message);
  const waUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;

  // 1. Manual Open (Only if explicitly clicked from receipt preview button)
  if (options.manualOpen && typeof window !== "undefined") {
    try {
      const link = document.createElement("a");
      link.href = waUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 500);
    } catch (e) {
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  }

  // 2. 100% Silent Background Dispatch via Self-Hosted Engine (Zero Tab Switching)
  try {
    fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone,
        message,
        billNumber: bill.billNumber,
        customerName: bill.customerName,
      }),
    }).catch((err) => console.warn("Background WhatsApp dispatch notice:", err));
  } catch {}

  return true;
}
