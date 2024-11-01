import jwt from "jsonwebtoken";

interface TokenPayload {
  [key: string]: string;
}

interface TokenOptions {
  expiresIn?: string | number; // e.g., '1h', '1d', '7d'
}
export class TokenGenerator {
  private static readonly SECRET_KEY = process.env.JWT_SECRET_KEY || "your-secret-key";

  /**
   * Generates a JWT token
   */
  static async generateJWT(payload: TokenPayload, options: TokenOptions = {}): Promise<string> {
    try {
      const { expiresIn = "1d" } = options;
      const token = await jwt.sign(payload, this.SECRET_KEY, { algorithm: "HS256", expiresIn });

      return token;
    } catch (error) {
      console.error("Error generating token:", error);
      throw new Error("Failed to generate token");
    }
  }

  /**
   * Verifies a JWT token
   */
  static async verifyJWT(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.SECRET_KEY);
      return decoded as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error("Token has expired");
      }
      throw new Error("Invalid token");
    }
  }
}
