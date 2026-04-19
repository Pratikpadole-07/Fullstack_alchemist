import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Organizer from "../models/Organizer.js";
import { signToken } from "../utils/jwt.js";

function adminEmailMatch(email) {
  const a = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  return a && email.toLowerCase() === a;
}

export async function signup(req, res) {
  try {
    const { name, email, password, role = "user" } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, password required" });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: "Email already registered" });

    let finalRole = "user";
    if (role === "organizer") finalRole = "organizer";
    if (adminEmailMatch(email)) finalRole = "admin";

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role: finalRole });

    if (finalRole === "organizer") {
      await Organizer.create({ userId: user._id });
    }

    const token = signToken({ sub: user._id.toString(), role: user.role, email: user.email });
    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Signup failed" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "email and password required" });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });
    const token = signToken({ sub: user._id.toString(), role: user.role, email: user.email });
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Login failed" });
  }
}
