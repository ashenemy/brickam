import type { RegisterDtoAccountType } from './registerDtoAccountType';
import type { RegisterDtoRole } from './registerDtoRole';

export interface RegisterDto {
  /** Телефон Армении (+374XXXXXXXX) */
  phone: string;
  /** @minLength 8 */
  password: string;
  name: string;
  role: RegisterDtoRole;
  accountType?: RegisterDtoAccountType;
}
