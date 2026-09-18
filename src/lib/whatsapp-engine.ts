const SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";

/**
 * Returns current connection status, QR code data URL (if waiting for scan), and connected phone number.
 */
export async function getWhatsAppStatus(): Promise<{
  isConnected: boolean;
  qrCode: string | null;
  phoneNumber: string | null;
}> {
  try {
    const res = await fetch(`${SERVICE_URL}/status`, {
      method: "GET",
      cache: "no-store",
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e: any) {
    console.warn("WhatsApp Service not reachable at", SERVICE_URL);
  }
  return { isConnected: false, qrCode: null, phoneNumber: null };
}

/**
 * Requests the engine to regenerate a QR code or reconnect.
 */
export async function initWhatsAppEngine(forceRestart = false): Promise<void> {
  try {
    await fetch(`${SERVICE_URL}/restart`, {
      method: "POST",
      cache: "no-store",
    });
  } catch (e) {}
}

/**
 * Sends a message silently in the background in < 0.3s.
 */
export async function sendWhatsAppMessage(
  phone: string,
  text: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "91" + cleanPhone;
    } else if (cleanPhone.length > 10 && !cleanPhone.startsWith("91")) {
      cleanPhone = "91" + cleanPhone.slice(-10);
    }

    if (!cleanPhone || cleanPhone.length < 10) {
      return { success: false, error: "Invalid phone number" };
    }

    const res = await fetch(`${SERVICE_URL}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: cleanPhone, message: text }),
      cache: "no-store",
    });

    const data = await res.json();
    return data;
  } catch (err: any) {
    console.error("WhatsApp Engine client error:", err);
    return {
      success: false,
      error: "WhatsApp service is initializing. Please try again in a moment.",
    };
  }
}

/**
 * Disconnects session and clears auth folder so a new number can be paired.
 */
export async function logoutWhatsApp(): Promise<boolean> {
  try {
    const res = await fetch(`${SERVICE_URL}/logout`, {
      method: "POST",
      cache: "no-store",
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}
