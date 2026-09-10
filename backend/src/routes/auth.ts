import { Router, Request, Response } from "express";
import { User } from "../models/User";
import { signToken } from "../lib/jwt";
import { authenticate } from "../middleware/auth";

const router = Router();

// ---- POST /api/auth/register ----
router.post("/register", async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body ?? {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: "password must be at least 8 characters" });
  }

  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const user = await User.create({
    name,
    email: String(email).toLowerCase(),
    password,
    // Never trust a client-supplied "admin" role blindly in a real prototype;
    // this default keeps new signups low-privilege.
    role: role === "admin" ? "viewer" : role || "viewer",
  });

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// ---- POST /api/auth/login ----
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = await User.findOne({ email: String(email).toLowerCase() }).select("+password");
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// ---- GET /api/auth/me ----
router.get("/me", authenticate, async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.sub);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

export default router;
