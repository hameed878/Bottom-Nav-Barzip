import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { Request } from "express";
import { sendOtpEmail } from "../lib/maileroo";

declare module "express-session" {
  interface SessionData {
    userId?: number;
  }
}

const router: IRouter = Router();

// In-memory OTP store: email -> { code, expires, purpose }
const otpStore = new Map<string, { code: string; expires: number; purpose: string }>();

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function uniqueReferralCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = generateReferralCode();
    const existing = await db.select().from(usersTable).where(eq(usersTable.referralCode, code)).limit(1);
    if (existing.length === 0) return code;
  }
  throw new Error("Could not generate unique referral code");
}

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    username: user.username,
    email: user.email ?? null,
    phone: user.phone ?? null,
    balancePkr: user.balancePkr,
    walletBalance: user.walletBalance,
    totalTrade: user.totalTrade,
    frozenTrade: user.frozenTrade,
    vipLevel: user.vipLevel,
    referralCode: user.referralCode,
  };
}

router.post("/auth/register", async (req: Request, res) => {
  try {
    const { username, password, email, phone, invitationCode } = req.body as Record<string, string>;

    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({ ok: false, error: "Username and password are required" });
    }
    if (username.length < 3) {
      return res.status(400).json({ ok: false, error: "Username must be at least 3 characters" });
    }
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: "Password must be at least 6 characters" });
    }

    const existing = await db.select().from(usersTable).where(eq(usersTable.username, username.trim())).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ ok: false, error: "Username already taken" });
    }

    let invitedBy: number | undefined;
    if (invitationCode?.trim()) {
      const inviter = await db.select().from(usersTable).where(eq(usersTable.referralCode, invitationCode.trim().toUpperCase())).limit(1);
      if (inviter.length === 0) {
        return res.status(400).json({ ok: false, error: "Invalid invitation code" });
      }
      invitedBy = inviter[0].id;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const referralCode = await uniqueReferralCode();

    const [user] = await db.insert(usersTable).values({
      username: username.trim(),
      passwordHash,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      referralCode,
      invitedBy: invitedBy ?? null,
    }).returning();

    req.session.userId = user.id;
    return res.json({ ok: true, user: serializeUser(user) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Registration failed" });
  }
});

router.post("/auth/login", async (req: Request, res) => {
  try {
    const { username, password } = req.body as Record<string, string>;

    if (!username?.trim() || !password?.trim()) {
      return res.status(400).json({ ok: false, error: "Username and password are required" });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username.trim())).limit(1);
    if (!user) {
      return res.status(401).json({ ok: false, error: "Invalid username or password" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ ok: false, error: "Invalid username or password" });
    }

    req.session.userId = user.id;
    return res.json({ ok: true, user: serializeUser(user) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Login failed" });
  }
});

router.post("/auth/logout", (req: Request, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get("/auth/me", async (req: Request, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ ok: false, error: "Not authenticated" });
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    if (!user) {
      req.session.destroy(() => {});
      return res.status(401).json({ ok: false, error: "User not found" });
    }
    return res.json({ ok: true, user: serializeUser(user) });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to get user" });
  }
});

// ─── Change Login Password (logged in, requires old password) ─────────────────
router.post("/auth/change-password", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });
  try {
    const { oldPassword, newPassword } = req.body as Record<string, string>;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ ok: false, error: "Old and new password required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ ok: false, error: "New password must be at least 6 characters" });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const valid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!valid) return res.status(400).json({ ok: false, error: "Old password is incorrect" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));

    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to change password" });
  }
});

// ─── Send OTP Code to Email ───────────────────────────────────────────────────
router.post("/auth/send-code", async (req: Request, res) => {
  try {
    const { email, purpose } = req.body as { email: string; purpose: string };
    if (!email?.trim()) return res.status(400).json({ ok: false, error: "Email is required" });

    const validPurposes = ["forgot-password", "update-email", "update-phone"];
    if (!validPurposes.includes(purpose)) {
      return res.status(400).json({ ok: false, error: "Invalid purpose" });
    }

    // For forgot-password, verify the email belongs to an account
    if (purpose === "forgot-password") {
      const [user] = await db.select({ id: usersTable.id })
        .from(usersTable)
        .where(eq(usersTable.email, email.trim().toLowerCase()))
        .limit(1);
      if (!user) {
        return res.status(404).json({ ok: false, error: "No account found with this email" });
      }
    }

    const code = generateOtp();
    const key = email.trim().toLowerCase();
    otpStore.set(key, { code, expires: Date.now() + 10 * 60 * 1000, purpose });

    try {
      const mailPurpose = purpose === "update-phone" ? "forgot-number" : purpose as "forgot-password" | "update-email";
      await sendOtpEmail(key, mailPurpose, code);
      req.log.info({ email: key, purpose }, "OTP email sent via Maileroo");
    } catch (mailErr) {
      req.log.error({ err: mailErr }, "Failed to send OTP email via Maileroo");
      otpStore.delete(key);
      return res.status(500).json({ ok: false, error: "Failed to send verification email. Please try again." });
    }

    return res.json({
      ok: true,
      message: "Verification code sent to email",
      ...(process.env.NODE_ENV !== "production" && { devCode: code }),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to send code" });
  }
});

// ─── Forgot Password: Verify OTP + Reset ─────────────────────────────────────
router.post("/auth/forgot-password", async (req: Request, res) => {
  try {
    const { email, code, newPassword } = req.body as Record<string, string>;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ ok: false, error: "Email, code and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ ok: false, error: "Password must be at least 6 characters" });
    }

    const key = email.trim().toLowerCase();
    const stored = otpStore.get(key);

    if (!stored || stored.purpose !== "forgot-password") {
      return res.status(400).json({ ok: false, error: "No code was sent to this email. Request a new one." });
    }
    if (Date.now() > stored.expires) {
      otpStore.delete(key);
      return res.status(400).json({ ok: false, error: "Code has expired. Request a new one." });
    }
    if (stored.code !== code.trim()) {
      return res.status(400).json({ ok: false, error: "Incorrect verification code" });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, key)).limit(1);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));
    otpStore.delete(key);

    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to reset password" });
  }
});

// ─── Update Phone Number (direct, no OTP since no SMS API) ───────────────────
router.post("/auth/update-phone", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });
  try {
    const { phone } = req.body as { phone: string };
    if (!phone?.trim()) return res.status(400).json({ ok: false, error: "Phone number is required" });

    await db.update(usersTable).set({ phone: phone.trim() }).where(eq(usersTable.id, req.session.userId));

    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to update phone" });
  }
});

// ─── Update Email: step 1 send OTP to new email, step 2 verify + save ────────
router.post("/auth/update-email", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });
  try {
    const { newEmail, code } = req.body as { newEmail: string; code?: string };
    if (!newEmail?.trim()) return res.status(400).json({ ok: false, error: "Email is required" });

    const key = newEmail.trim().toLowerCase();

    if (!code) {
      // Step 1: send OTP to the new email
      const otpCode = generateOtp();
      otpStore.set(key, { code: otpCode, expires: Date.now() + 10 * 60 * 1000, purpose: "update-email" });
      try {
        await sendOtpEmail(key, "update-email", otpCode);
        req.log.info({ newEmail: key }, "OTP email sent via Maileroo for email update");
      } catch (mailErr) {
        req.log.error({ err: mailErr }, "Failed to send OTP email via Maileroo");
        otpStore.delete(key);
        return res.status(500).json({ ok: false, error: "Failed to send verification email. Please try again." });
      }
      return res.json({
        ok: true,
        message: "Verification code sent",
        ...(process.env.NODE_ENV !== "production" && { devCode: otpCode }),
      });
    }

    // Step 2: verify OTP + update
    const stored = otpStore.get(key);
    if (!stored || stored.purpose !== "update-email") {
      return res.status(400).json({ ok: false, error: "No code was sent to this email. Request again." });
    }
    if (Date.now() > stored.expires) {
      otpStore.delete(key);
      return res.status(400).json({ ok: false, error: "Code has expired. Request again." });
    }
    if (stored.code !== code.trim()) {
      return res.status(400).json({ ok: false, error: "Incorrect verification code" });
    }

    await db.update(usersTable).set({ email: key }).where(eq(usersTable.id, req.session.userId));
    otpStore.delete(key);

    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to update email" });
  }
});

// ── Send OTP to logged-in user's own email ────────────────────────────────────
router.post("/auth/send-code-me", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });
  try {
    const { purpose } = req.body as { purpose: string };
    if (!["reset-password", "verify-current-email"].includes(purpose)) {
      return res.status(400).json({ ok: false, error: "Invalid purpose" });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });
    if (!user.email) {
      return res.status(400).json({ ok: false, error: "No email address linked to your account." });
    }

    const code = generateOtp();
    const key = user.email.toLowerCase();
    otpStore.set(key, { code, expires: Date.now() + 10 * 60 * 1000, purpose });

    const mailPurpose = purpose === "reset-password" ? "forgot-password" : "update-email";
    try {
      await sendOtpEmail(key, mailPurpose as "forgot-password" | "update-email", code);
      req.log.info({ email: key, purpose }, "OTP sent via Maileroo");
    } catch (mailErr) {
      req.log.error({ err: mailErr }, "Maileroo error");
      otpStore.delete(key);
      return res.status(500).json({ ok: false, error: "Failed to send verification email." });
    }

    // Return masked email for display
    const [local, domain] = key.split("@");
    const maskedLocal = local.length <= 2
      ? local[0] + "*"
      : local[0] + "*".repeat(Math.min(local.length - 2, 4)) + local[local.length - 1];

    return res.json({
      ok: true,
      maskedEmail: maskedLocal + "@" + domain,
      ...(process.env.NODE_ENV !== "production" && { devCode: code }),
    });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to send code" });
  }
});

// ── Reset password via OTP (logged-in user, email already verified) ───────────
router.post("/auth/reset-password-otp", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });
  try {
    const { code, newPassword } = req.body as Record<string, string>;
    if (!code || !newPassword) {
      return res.status(400).json({ ok: false, error: "Code and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ ok: false, error: "Password must be at least 6 characters" });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    if (!user?.email) return res.status(404).json({ ok: false, error: "User or email not found" });

    const key = user.email.toLowerCase();
    const stored = otpStore.get(key);
    if (!stored || stored.purpose !== "reset-password") {
      return res.status(400).json({ ok: false, error: "No active code found. Request a new one." });
    }
    if (Date.now() > stored.expires) {
      otpStore.delete(key);
      return res.status(400).json({ ok: false, error: "Code has expired. Request a new one." });
    }
    if (stored.code !== code.trim()) {
      return res.status(400).json({ ok: false, error: "Incorrect verification code" });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.update(usersTable).set({ passwordHash: newHash }).where(eq(usersTable.id, user.id));
    otpStore.delete(key);

    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to reset password" });
  }
});

// ── Verify current-email OTP then set new email ───────────────────────────────
router.post("/auth/update-email-verified", async (req: Request, res) => {
  if (!req.session.userId) return res.status(401).json({ ok: false, error: "Unauthorized" });
  try {
    const { code, newEmail } = req.body as { code: string; newEmail: string };
    if (!code || !newEmail?.trim()) {
      return res.status(400).json({ ok: false, error: "Code and new email are required" });
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
    if (!user?.email) return res.status(404).json({ ok: false, error: "User or current email not found" });

    const key = user.email.toLowerCase();
    const stored = otpStore.get(key);
    if (!stored || stored.purpose !== "verify-current-email") {
      return res.status(400).json({ ok: false, error: "No active code found. Request a new one." });
    }
    if (Date.now() > stored.expires) {
      otpStore.delete(key);
      return res.status(400).json({ ok: false, error: "Code has expired. Request a new one." });
    }
    if (stored.code !== code.trim()) {
      return res.status(400).json({ ok: false, error: "Incorrect verification code" });
    }

    await db.update(usersTable).set({ email: newEmail.trim().toLowerCase() }).where(eq(usersTable.id, user.id));
    otpStore.delete(key);

    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err);
    return res.status(500).json({ ok: false, error: "Failed to update email" });
  }
});

export default router;
