import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import { User } from "../models/User.js";

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function signup(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }
  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: hashed,
  });
  const token = signToken(user);
  return res.status(201).json({
    token,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}

export async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const token = signToken(user);
  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

export async function me(req, res) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  return res.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
}
