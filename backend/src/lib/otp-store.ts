// Singleton store for OTPs to be shared between send and verify routes
// Note: In production serverless environments, this should be replaced by a database or Redis
export interface OtpEntry {
  otp: string;
  expires: number;
  name?: string;
}
export const otpStore = new Map<string, OtpEntry>();
