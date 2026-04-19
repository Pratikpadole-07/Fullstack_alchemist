import jwt from "jsonwebtoken";

const secret = () => process.env.JWT_SECRET || "dev-insecure-change-me";

export function signToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, secret(), { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, secret());
}
