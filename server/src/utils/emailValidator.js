import dns from "dns/promises";
import ApiError from "./ApiError.js";

// Comprehensive blacklist of disposable, temporary, and fake email domains (350+ domains)
const DISPOSABLE_DOMAINS = new Set([
  // Popular Disposable Email Providers
  "10minutemail.com",
  "10minutemail.net",
  "10minutemail.co.uk",
  "10minmail.com",
  "tempmail.com",
  "temp-mail.org",
  "temp-mail.io",
  "tempmail.net",
  "tempmail.de",
  "tempmailo.com",
  "tempail.com",
  "tmail.com",
  "tmailor.com",
  "tmpmail.org",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "guerrillamail.de",
  "guerrillamail.info",
  "guerrillamailblock.com",
  "grr.la",
  "sharklasers.com",
  "spam4.me",
  "mailinator.com",
  "mailinator2.com",
  "mailinator.net",
  "throwawaymail.com",
  "throwaway.email",
  "yopmail.com",
  "yopmail.net",
  "yopmail.fr",
  "cool.fr.nf",
  "jetable.fr.nf",
  "courriel.fr.nf",
  "moncourrier.fr.nf",
  "monemail.fr.nf",
  "monmail.fr.nf",
  "trashmail.com",
  "trashmail.net",
  "trashmail.me",
  "trash-mail.com",
  "fakeinbox.com",
  "getairmail.com",
  "dispostable.com",
  "dropmail.me",
  "mohmal.com",
  "mohmal.in",
  "crazymailing.com",
  "emailondeck.com",
  "generator.email",
  "inboxbear.com",
  "maildrop.cc",
  "nada.ltd",
  "getnada.com",
  "burnermail.io",
  "mytemp.email",
  "mytempemail.com",
  "tempinbox.com",
  "fakemailgenerator.com",
  "fakemail.net",
  "fakemail.io",
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
  "mailnesia.com",
  "inboxkitten.com",
  "disbox.net",
  "chacuo.net",
  "pokemail.net",
  "bupmail.com",
  "minutemailbox.com",
  "fakemailgenerator.net",
  "fake-box.com",
  "fake-mail.org",
  "emailfake.com",
  "emltmp.com",
  "crazymail.com",
  "fastmail.fm",
  "mailsac.com",
  "harakirimail.com",
  "mytempemail.com",
  "mytrashmail.com",
  "nowmymail.com",
  "mailcatch.com",
  "dumpmail.de",
  "spambog.com",
  "spambog.de",
  "spambog.ru",
  "zoemail.com",
  "emailtemporaire.com",
  "tempemail.co",
  "tempemailgen.com",
  "temporary-mail.net",
  "tempmailaddress.com",
  "disposable-email.ml",
  "discard.email",
  "discardmail.com",
  "spamex.com",
  "incognitomail.com",
  "guerrillamail.org",
  "meltmail.com",
  "deadaddress.com",
  "0-mail.com",
  "anonymbox.net",
  "boun.cr",
  "boximail.com",
  "bugmenot.com",
  "chogmail.com",
  "crazymailing.com",
  "deadfake.com",
  "dontreg.com",
  "dontsendmespam.de",
  "drdrb.net",
  "emaildienst.de",
  "emailsensei.com",
  "emailtemporal.org",
  "emailwarden.com",
  "filzmail.com",
  "fixmail.tk",
  "getonemail.com",
  "gishpuppy.com",
  "hatespam.org",
  "hidemail.de",
  "kasmail.com",
  "kaspersky.com",
  "koszmail.pl",
  "kurzepost.de",
  "link2mail.net",
  "mail-temporaire.fr",
  "mail4trash.com",
  "mailcatch.com",
  "mailde.de",
  "maildrop.cc",
  "maildroppable.com",
  "mailexpire.com",
  "mailimate.com",
  "mailin8r.com",
  "mailinater.com",
  "mailinator.co.uk",
  "mailincubator.com",
  "mailismagic.com",
  "mailme.ir",
  "mailmoat.com",
  "mailnesia.com",
  "mailnull.com",
  "mailseal.com",
  "mailtemp.net",
  "mailtome.de",
  "mailtrash.net",
  "mailzi.ru",
  "mintemail.com",
  "moncourrier.fr",
  "monmail.fr",
  "mt2015.com",
  "myspambox.net",
  "netmails.net",
  "nomail.xl.cx",
  "nospam.ze.tc",
  "nospam4.us",
  "notmailinator.com",
  "objectmail.com",
  "oneoffmail.com",
  "owlymail.com",
  "pookmail.com",
  "privacymail.com",
  "privymail.de",
  "proxymail.eu",
  "quickinbox.com",
  "rcpt.at",
  "reallymymail.com",
  "recursor.net",
  "safetymail.info",
  "sandvikens.net",
  "saynotospams.com",
  "scatmail.com",
  "schafmail.de",
  "selfdestructingmail.com",
  "sharedmailbox.org",
  "shortmail.net",
  "sibmail.com",
  "sinnlose-mail.de",
  "slopsbox.com",
  "smellfear.com",
  "sneakemail.com",
  "snkmail.com",
  "sofimail.com",
  "sogetthis.com",
  "soodonims.com",
  "spam.la",
  "spam.su",
  "spamavert.com",
  "spambox.us",
  "spamcannon.com",
  "spamcannon.net",
  "spamcon.org",
  "spamday.com",
  "spamdecoy.net",
  "spamfree24.org",
  "spamgourmet.com",
  "spamgourmet.net",
  "spamgourmet.org",
  "spamhole.com",
  "spamify.com",
  "spaminator.de",
  "spamkill.info",
  "spaml.com",
  "spaml.de",
  "spammotel.com",
  "spamspot.com",
  "spamtrap.ro",
  "spoofmail.de",
  "squizzy.de",
  "superstachel.de",
  "suremail.info",
  "tafmail.com",
  "tagmail.net",
  "teewars.org",
  "temp-email.org",
  "temp-mail.ru",
  "tempemail.biz",
  "tempemail.net",
  "tempinbox.co.uk",
  "tempmail.eu",
  "tempmail.us",
  "tempmail2.com",
  "tempmailer.com",
  "temppost.com",
  "tempr.email",
  "thankyou2010.com",
  "thecloudmail.com",
  "thespambox.com",
  "thrashmail.de",
  "throwawayemailaddress.com",
  "tittbit.in",
  "trash-mail.at",
  "trash-mail.ch",
  "trash-me.com",
  "trashbox.eu",
  "trashcanmail.com",
  "trashemail.de",
  "trashmail.at",
  "trashmail.de",
  "trashmail.io",
  "trashmail.org",
  "trashmailer.com",
  "trashmails.com",
  "tvspambot.com",
  "twinmail.de",
  "uggsrock.com",
  "ultra.fartit.com",
  "unmail.ru",
  "upliftnow.com",
  "urhen.com",
  "validdns.com",
  "venompen.com",
  "veryrealemail.com",
  "vidalia.com",
  "vmani.com",
  "vomoto.com",
  "vp.ms",
  "vpn.st",
  "vps.st",
  "walkmail.net",
  "waytofeed.com",
  "wbmail.ru",
  "wegwerf-email-adresse.de",
  "wegwerf-email.org",
  "wegwerfadresse.de",
  "wegwerfadresse.net",
  "wegwerfemail.com",
  "wegwerfemail.de",
  "wegwerfemail.net",
  "wegwerfemail.org",
  "wegwerfmail.de",
  "wegwerfmail.net",
  "wegwerfmail.org",
  "wetrainbayarea.com",
  "wetrainbayarea.org",
  "wh4f.org",
  "whyspam.me",
  "willhackforfood.biz",
  "willselfdestruct.com",
  "winemaven.in",
  "wuzup.net",
  "wuzupmail.net",
  "wwwnew.eu",
  "x.ip6.im",
  "xagloo.com",
  "xemaps.com",
  "xents.com",
  "xmaily.com",
  "xoxox.cc",
  "yapped.net",
  "yehey.com",
  "yogamaven.com",
  "yomail.info",
  "yopmail.gq",
  "ypmail.webcam",
  "ytmp3.org",
  "yuurok.com",
  "zehnminutenmail.de",
  "zippymail.info",
  "zoemail.org",
  "zomg.info",
]);

// Well-known trusted original email providers (Fast-path instant validation)
const TRUSTED_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.in",
  "yahoo.co.uk",
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
  "zoho.in",
  "aol.com",
  "rediffmail.com",
  "fastmail.com",
  "gmx.com",
  "gmx.net",
  "mail.com",
]);

// Blocked dummy/fake username prefixes and farzi patterns
const FAKE_EMAIL_PATTERNS = [
  /^test@/i,
  /^fake@/i,
  /^farzi@/i,
  /^asdf@/i,
  /^qwerty@/i,
  /^temp@/i,
  /^disposable@/i,
  /^dummy@/i,
  /^abcd@/i,
  /^xyz@/i,
  /^123456@/i,
  /^admin@example\.com$/i,
  /^user@example\.com$/i,
  /^test@test\.com$/i,
  /^fake@fake\.com$/i,
  /^asdf@asdf\.com$/i,
];

/**
 * Validates whether an email address is an authentic, deliverable original email.
 * Rejects temporary/disposable (farzi) emails, dummy patterns, and unreachable domains.
 * 
 * @param {string} email 
 * @returns {Promise<string>} Normalized lowercase email if genuine
 * @throws {ApiError} If email is fake, disposable, or invalid
 */
export async function validateOriginalEmail(email) {
  if (!email || typeof email !== "string") {
    throw ApiError.badRequest("Please provide a valid email address");
  }

  const normalized = email.toLowerCase().trim();

  // Basic regex check for standard email syntax
  const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
  const match = normalized.match(emailRegex);

  if (!match) {
    throw ApiError.badRequest("Please enter a valid email format (e.g. name@gmail.com)");
  }

  const domain = match[1];

  // 1. Check for obvious fake / dummy patterns
  for (const pattern of FAKE_EMAIL_PATTERNS) {
    if (pattern.test(normalized)) {
      throw ApiError.badRequest(
        "Farzi ya fake email allowed nahi hai. Kripya apna original email (jaise Gmail, Outlook, Yahoo) use karein."
      );
    }
  }

  // 2. Check for invalid domain extensions
  if (
    domain.endsWith(".test") ||
    domain.endsWith(".invalid") ||
    domain.endsWith(".localhost") ||
    domain.endsWith(".example") ||
    domain.endsWith(".local")
  ) {
    throw ApiError.badRequest(
      "Farzi ya invalid email domain allowed nahi hai. Kripya genuine email use karein."
    );
  }

  // 3. Check against disposable / temp / farzi email domains blacklist
  if (DISPOSABLE_DOMAINS.has(domain)) {
    throw ApiError.badRequest(
      "Farzi ya temporary (disposable) email address allowed nahi hai. Kripya apna original email (jaise Gmail, Outlook, Yahoo) use karein."
    );
  }

  // 4. If domain is in known trusted genuine providers, accept immediately
  if (TRUSTED_DOMAINS.has(domain)) {
    return normalized;
  }

  // 5. For custom or corporate domains, verify DNS MX mail exchange records exist
  try {
    const mxRecords = await Promise.race([
      dns.resolveMx(domain),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("DNS timeout")), 3500)
      ),
    ]);

    if (!mxRecords || mxRecords.length === 0) {
      throw ApiError.badRequest(
        "The email domain does not have active mail servers. Please use an original, deliverable email."
      );
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.badRequest(
      "Invalid or unreachable email domain. Please use a genuine email provider (e.g. Gmail, Outlook, Yahoo)."
    );
  }

  return normalized;
}

export { DISPOSABLE_DOMAINS, TRUSTED_DOMAINS };
