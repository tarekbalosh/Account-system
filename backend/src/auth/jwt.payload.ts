// src/auth/jwt.payload.ts
export interface JwtPayload {
  sub: number; // user id
  email: string;
  role: string;
}
