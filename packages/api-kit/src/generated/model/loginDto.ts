
export interface LoginDto {
  phone: string;
  password: string;
  /** Идентификатор устройства */
  deviceId?: string;
}
