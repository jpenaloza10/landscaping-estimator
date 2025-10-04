import "express";

declare global {
  namespace Express {
    interface UserJwt {
      userId: number;
      email: string;
    }
    interface Request {
      user?: UserJwt;
    }
  }
}
