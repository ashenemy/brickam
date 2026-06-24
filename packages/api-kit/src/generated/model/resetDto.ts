
export interface ResetDto {
  phone: string;
  code: string;
  /** @minLength 8 */
  newPassword: string;
}
