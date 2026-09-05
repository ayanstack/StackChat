import dns from "dns/promises";
import ApiError from "./ApiError.js";

// Comprehensive list of disposable/temporary/fake email domains
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamailblock.com",
  "mailinator.com",
  "throwawaymail.com",
  "yopmail.com",
  "yopmail.net",
  "trashmail.com",
  "trashmail.net",
  "fakeinbox.com",
  "sharklasers.com",
  "getairmail.com",
  "dispostable.com",
  "dropmail.me",
  "mohmal.com",
  "crazymailing.com",
  "emailondeck.com",
  "generator.email",
  "inboxbear.com",
  "maildrop.cc",
  "nada.ltd",
  "getnada.com",
  "burnermail.io",
  "mytemp.email",
  "tempail.com",
  "fakemailgenerator.com",
  "fakemail.net",
  "trash-mail.com",
  "mohmal.in",
  "disposablemail.com",
  "armyspy.com",
  "cuvox.de",
  "dayrep.com",
  "fleckens.hu",
  "gustr.com",
  "jourrapide.com",
  "rhyta.com",
  "superrito.com",
  "teleworm.us",
  "einrot.com",
]);

// Well-known trusted email domains that are definitely genuine
const TRUSTED_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "ymail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.com",
  "zoho.com",
  "aol.com",
]);

/**
 * Validates whether an email address belongs to a real, deliverable domain.
 * Blocks disposable domains, syntax errors, and domains without MX records.
 * 
 * @param {string} email 
 * @returns {Promise<string>} Normalized lowercase email if valid
 * @throws {ApiError} If email is fake, disposable, or invalid
 */
export async function validateOriginalEmail(email) {
  if (!email || typeof email !== "string") {
    throw ApiError.badRequest("Please provide a valid email address");
  }

  const normalized = email.toLowerCase().trim();

  // Basic regex validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
  const match = normalized.match(emailRegex);

  if (!match) {
    throw ApiError.badRequest("Please enter a valid email address format");
  }

  const domain = match[1];

  // 1. Check against disposable/temp email domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    throw ApiError.badRequest(
      "Disposable or temporary email addresses are not allowed. Please use your genuine email (e.g. Gmail, Outlook, Yahoo)."
    );
  }

  // 2. If it's a known trusted domain, accept immediately
  if (TRUSTED_DOMAINS.has(domain)) {
    return normalized;
  }

  // 3. For any other custom/company domain, verify DNS MX records exist
  try {
    const mxRecords = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DNS timeout")), 3000)
      ),
    ]);

    if (!mxRecords || mxRecords.length === 0) {
      throw ApiError.badRequest(
        "The email domain does not have active mail servers. Please use a real email address."
      );
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.badRequest(
      "Invalid or unreachable email domain. Please use a genuine email provider."
    );
  }

  return normalized;
}
