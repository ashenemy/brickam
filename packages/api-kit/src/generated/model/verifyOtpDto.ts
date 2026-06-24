
export interface VerifyOtpDto {
  phone: string;
  /** OTP-код */
  code: string;
  /** Идентификатор устройства */
  deviceId?: string;
}
