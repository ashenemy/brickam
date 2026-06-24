import {
  HttpClient,
  HttpHeaders,
  HttpResponse as AngularHttpResponse
} from '@angular/common/http';
import type {
  HttpContext,
  HttpEvent,
  HttpParams
} from '@angular/common/http';

import {
  Injectable,
  inject
} from '@angular/core';

import {
  Observable
} from 'rxjs';

import type {
  CategoryDto,
  CreateCategoryDto,
  CreateProductDto,
  CreateTemplateDto,
  ForgotDto,
  LoginDto,
  ProductDetailDto,
  ProductsControllerSearch200,
  ProductsControllerSearchParams,
  RefreshDto,
  RegisterDto,
  ResetDto,
  TemplatesControllerFindAllParams,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateTemplateDto,
  VerifyOtpDto
} from './model';

interface HttpClientOptions {
  readonly headers?: HttpHeaders | Record<string, string | string[]>;
  readonly context?: HttpContext;
  readonly params?:
        | HttpParams
      | Record<string, string | number | boolean | Array<string | number | boolean>>;
  readonly reportProgress?: boolean;
  readonly withCredentials?: boolean;
  readonly credentials?: RequestCredentials;
  readonly keepalive?: boolean;
  readonly priority?: RequestPriority;
  readonly cache?: RequestCache;
  readonly mode?: RequestMode;
  readonly redirect?: RequestRedirect;
  readonly referrer?: string;
  readonly integrity?: string;
  readonly referrerPolicy?: ReferrerPolicy;
  readonly transferCache?: {includeHeaders?: string[]} | boolean;
  readonly timeout?: number;
}

type HttpClientBodyOptions = HttpClientOptions & {
  readonly observe?: 'body';
};

type HttpClientEventOptions = HttpClientOptions & {
  readonly observe: 'events';
};

type HttpClientResponseOptions = HttpClientOptions & {
  readonly observe: 'response';
};

type HttpClientObserveOptions = HttpClientOptions & {
  readonly observe?: 'body' | 'events' | 'response';
};

type AngularHttpParamValue = string | number | boolean | Array<string | number | boolean>;
type AngularHttpParamValueWithNullable = AngularHttpParamValue | null;

function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys?: ReadonlySet<string>,
  preserveRequiredNullables?: false,
  passthroughKeys?: undefined,
): Record<string, AngularHttpParamValue>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> | undefined,
  preserveRequiredNullables: true,
  passthroughKeys?: undefined,
): Record<string, AngularHttpParamValueWithNullable>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> | undefined,
  preserveRequiredNullables: boolean | undefined,
  passthroughKeys: ReadonlySet<string>,
): Record<string, unknown>;
function filterParams(
  params: Record<string, unknown>,
  requiredNullableKeys: ReadonlySet<string> = new Set(),
  preserveRequiredNullables = false,
  passthroughKeys: ReadonlySet<string> = new Set(),
): Record<string, unknown> {
  const filteredParams: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (passthroughKeys.has(key)) {
      if (value !== undefined) {
        filteredParams[key] = value;
      }
      continue;
    }
    if (Array.isArray(value)) {
      const filtered = value.filter(
        (item) =>
          item != null &&
          (typeof item === 'string' ||
            typeof item === 'number' ||
            typeof item === 'boolean'),
      ) as Array<string | number | boolean>;
      if (filtered.length) {
        filteredParams[key] = filtered;
      }
    } else if (
      preserveRequiredNullables &&
      value === null &&
      requiredNullableKeys.has(key)
    ) {
      filteredParams[key] = null;
    } else if (
      value != null &&
      (typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean')
    ) {
      filteredParams[key] = value;
    }
  }
  return filteredParams;
}





@Injectable({ providedIn: 'root' })
export class BuildHubAPIService {
  private readonly http = inject(HttpClient);
 templatesControllerFindAll<TData = void>(params?: TemplatesControllerFindAllParams, options?: HttpClientBodyOptions): Observable<TData>;
 templatesControllerFindAll<TData = void>(params?: TemplatesControllerFindAllParams, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 templatesControllerFindAll<TData = void>(params?: TemplatesControllerFindAllParams, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  templatesControllerFindAll<TData = void>(
    params?: TemplatesControllerFindAllParams, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    const filteredParams = filterParams({...params, ...options?.params}, new Set<string>([]));

    if (options?.observe === 'events') {
      return this.http.get<TData>(
      `/api/templates`,{
    ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
        params: filteredParams,}
    );
    }

    if (options?.observe === 'response') {
      return this.http.get<TData>(
      `/api/templates`,{
    ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
        params: filteredParams,}
    );
    }

    return this.http.get<TData>(
      `/api/templates`,{
    ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
        params: filteredParams,}
    );
  }

 templatesControllerCreate<TData = void>(createTemplateDto: CreateTemplateDto, options?: HttpClientBodyOptions): Observable<TData>;
 templatesControllerCreate<TData = void>(createTemplateDto: CreateTemplateDto, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 templatesControllerCreate<TData = void>(createTemplateDto: CreateTemplateDto, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  templatesControllerCreate<TData = void>(
    createTemplateDto: CreateTemplateDto, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.post<TData>(
      `/api/templates`,
      createTemplateDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.post<TData>(
      `/api/templates`,
      createTemplateDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.post<TData>(
      `/api/templates`,
      createTemplateDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

 templatesControllerFindByKey<TData = void>(key: string, options?: HttpClientBodyOptions): Observable<TData>;
 templatesControllerFindByKey<TData = void>(key: string, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 templatesControllerFindByKey<TData = void>(key: string, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  templatesControllerFindByKey<TData = void>(
    key: string, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.get<TData>(
      `/api/templates/${key}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.get<TData>(
      `/api/templates/${key}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.get<TData>(
      `/api/templates/${key}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

 templatesControllerUpdate<TData = void>(key: string,
    updateTemplateDto: UpdateTemplateDto, options?: HttpClientBodyOptions): Observable<TData>;
 templatesControllerUpdate<TData = void>(key: string,
    updateTemplateDto: UpdateTemplateDto, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 templatesControllerUpdate<TData = void>(key: string,
    updateTemplateDto: UpdateTemplateDto, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  templatesControllerUpdate<TData = void>(
    key: string,
    updateTemplateDto: UpdateTemplateDto, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.patch<TData>(
      `/api/templates/${key}`,
      updateTemplateDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.patch<TData>(
      `/api/templates/${key}`,
      updateTemplateDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.patch<TData>(
      `/api/templates/${key}`,
      updateTemplateDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

 templatesControllerRemove<TData = void>(key: string, options?: HttpClientBodyOptions): Observable<TData>;
 templatesControllerRemove<TData = void>(key: string, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 templatesControllerRemove<TData = void>(key: string, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  templatesControllerRemove<TData = void>(
    key: string, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.delete<TData>(
      `/api/templates/${key}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.delete<TData>(
      `/api/templates/${key}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.delete<TData>(
      `/api/templates/${key}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

 usersControllerMe<TData = void>( options?: HttpClientBodyOptions): Observable<TData>;
 usersControllerMe<TData = void>( options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 usersControllerMe<TData = void>( options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  usersControllerMe<TData = void>(
     options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.get<TData>(
      `/api/users/me`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.get<TData>(
      `/api/users/me`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.get<TData>(
      `/api/users/me`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

/**
 * @summary Регистрация (телефон + пароль), отправляет OTP
 */
 authControllerRegister<TData = void>(registerDto: RegisterDto, options?: HttpClientBodyOptions): Observable<TData>;
 authControllerRegister<TData = void>(registerDto: RegisterDto, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 authControllerRegister<TData = void>(registerDto: RegisterDto, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  authControllerRegister<TData = void>(
    registerDto: RegisterDto, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.post<TData>(
      `/api/auth/register`,
      registerDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.post<TData>(
      `/api/auth/register`,
      registerDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.post<TData>(
      `/api/auth/register`,
      registerDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

/**
 * @summary Подтверждение телефона по OTP, выдаёт токены
 */
 authControllerVerifyOtp<TData = void>(verifyOtpDto: VerifyOtpDto, options?: HttpClientBodyOptions): Observable<TData>;
 authControllerVerifyOtp<TData = void>(verifyOtpDto: VerifyOtpDto, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 authControllerVerifyOtp<TData = void>(verifyOtpDto: VerifyOtpDto, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  authControllerVerifyOtp<TData = void>(
    verifyOtpDto: VerifyOtpDto, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.post<TData>(
      `/api/auth/verify-otp`,
      verifyOtpDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.post<TData>(
      `/api/auth/verify-otp`,
      verifyOtpDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.post<TData>(
      `/api/auth/verify-otp`,
      verifyOtpDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

/**
 * @summary Вход по телефону и паролю
 */
 authControllerLogin<TData = void>(loginDto: LoginDto, options?: HttpClientBodyOptions): Observable<TData>;
 authControllerLogin<TData = void>(loginDto: LoginDto, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 authControllerLogin<TData = void>(loginDto: LoginDto, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  authControllerLogin<TData = void>(
    loginDto: LoginDto, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.post<TData>(
      `/api/auth/login`,
      loginDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.post<TData>(
      `/api/auth/login`,
      loginDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.post<TData>(
      `/api/auth/login`,
      loginDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

/**
 * @summary Обновление пары токенов (ротация refresh)
 */
 authControllerRefresh<TData = void>(refreshDto: RefreshDto, options?: HttpClientBodyOptions): Observable<TData>;
 authControllerRefresh<TData = void>(refreshDto: RefreshDto, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 authControllerRefresh<TData = void>(refreshDto: RefreshDto, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  authControllerRefresh<TData = void>(
    refreshDto: RefreshDto, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.post<TData>(
      `/api/auth/refresh`,
      refreshDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.post<TData>(
      `/api/auth/refresh`,
      refreshDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.post<TData>(
      `/api/auth/refresh`,
      refreshDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

/**
 * @summary Запрос сброса пароля (отправляет OTP)
 */
 authControllerForgot<TData = void>(forgotDto: ForgotDto, options?: HttpClientBodyOptions): Observable<TData>;
 authControllerForgot<TData = void>(forgotDto: ForgotDto, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 authControllerForgot<TData = void>(forgotDto: ForgotDto, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  authControllerForgot<TData = void>(
    forgotDto: ForgotDto, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.post<TData>(
      `/api/auth/forgot`,
      forgotDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.post<TData>(
      `/api/auth/forgot`,
      forgotDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.post<TData>(
      `/api/auth/forgot`,
      forgotDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

/**
 * @summary Сброс пароля по OTP
 */
 authControllerReset<TData = void>(resetDto: ResetDto, options?: HttpClientBodyOptions): Observable<TData>;
 authControllerReset<TData = void>(resetDto: ResetDto, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 authControllerReset<TData = void>(resetDto: ResetDto, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  authControllerReset<TData = void>(
    resetDto: ResetDto, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.post<TData>(
      `/api/auth/reset`,
      resetDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.post<TData>(
      `/api/auth/reset`,
      resetDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.post<TData>(
      `/api/auth/reset`,
      resetDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

 categoriesControllerList<TData = CategoryDto[]>( options?: HttpClientBodyOptions): Observable<TData>;
 categoriesControllerList<TData = CategoryDto[]>( options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 categoriesControllerList<TData = CategoryDto[]>( options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  categoriesControllerList<TData = CategoryDto[]>(
     options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.get<TData>(
      `/api/catalog/categories`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.get<TData>(
      `/api/catalog/categories`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.get<TData>(
      `/api/catalog/categories`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

 categoriesControllerCreate<TData = CategoryDto>(createCategoryDto: CreateCategoryDto, options?: HttpClientBodyOptions): Observable<TData>;
 categoriesControllerCreate<TData = CategoryDto>(createCategoryDto: CreateCategoryDto, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 categoriesControllerCreate<TData = CategoryDto>(createCategoryDto: CreateCategoryDto, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  categoriesControllerCreate<TData = CategoryDto>(
    createCategoryDto: CreateCategoryDto, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.post<TData>(
      `/api/catalog/categories`,
      createCategoryDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.post<TData>(
      `/api/catalog/categories`,
      createCategoryDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.post<TData>(
      `/api/catalog/categories`,
      createCategoryDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

 categoriesControllerUpdate<TData = CategoryDto>(id: string,
    updateCategoryDto: UpdateCategoryDto, options?: HttpClientBodyOptions): Observable<TData>;
 categoriesControllerUpdate<TData = CategoryDto>(id: string,
    updateCategoryDto: UpdateCategoryDto, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 categoriesControllerUpdate<TData = CategoryDto>(id: string,
    updateCategoryDto: UpdateCategoryDto, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  categoriesControllerUpdate<TData = CategoryDto>(
    id: string,
    updateCategoryDto: UpdateCategoryDto, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.patch<TData>(
      `/api/catalog/categories/${id}`,
      updateCategoryDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.patch<TData>(
      `/api/catalog/categories/${id}`,
      updateCategoryDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.patch<TData>(
      `/api/catalog/categories/${id}`,
      updateCategoryDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

 categoriesControllerRemove<TData = void>(id: string, options?: HttpClientBodyOptions): Observable<TData>;
 categoriesControllerRemove<TData = void>(id: string, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 categoriesControllerRemove<TData = void>(id: string, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  categoriesControllerRemove<TData = void>(
    id: string, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.delete<TData>(
      `/api/catalog/categories/${id}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.delete<TData>(
      `/api/catalog/categories/${id}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.delete<TData>(
      `/api/catalog/categories/${id}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

 productsControllerSearch<TData = ProductsControllerSearch200>(params?: ProductsControllerSearchParams, options?: HttpClientBodyOptions): Observable<TData>;
 productsControllerSearch<TData = ProductsControllerSearch200>(params?: ProductsControllerSearchParams, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 productsControllerSearch<TData = ProductsControllerSearch200>(params?: ProductsControllerSearchParams, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  productsControllerSearch<TData = ProductsControllerSearch200>(
    params?: ProductsControllerSearchParams, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    const filteredParams = filterParams({...params, ...options?.params}, new Set<string>([]));

    if (options?.observe === 'events') {
      return this.http.get<TData>(
      `/api/catalog/products`,{
    ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
        params: filteredParams,}
    );
    }

    if (options?.observe === 'response') {
      return this.http.get<TData>(
      `/api/catalog/products`,{
    ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
        params: filteredParams,}
    );
    }

    return this.http.get<TData>(
      `/api/catalog/products`,{
    ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
        params: filteredParams,}
    );
  }

 productsControllerCreate<TData = ProductDetailDto>(createProductDto: CreateProductDto, options?: HttpClientBodyOptions): Observable<TData>;
 productsControllerCreate<TData = ProductDetailDto>(createProductDto: CreateProductDto, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 productsControllerCreate<TData = ProductDetailDto>(createProductDto: CreateProductDto, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  productsControllerCreate<TData = ProductDetailDto>(
    createProductDto: CreateProductDto, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.post<TData>(
      `/api/catalog/products`,
      createProductDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.post<TData>(
      `/api/catalog/products`,
      createProductDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.post<TData>(
      `/api/catalog/products`,
      createProductDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

 productsControllerGetBySlug<TData = ProductDetailDto>(slug: string, options?: HttpClientBodyOptions): Observable<TData>;
 productsControllerGetBySlug<TData = ProductDetailDto>(slug: string, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 productsControllerGetBySlug<TData = ProductDetailDto>(slug: string, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  productsControllerGetBySlug<TData = ProductDetailDto>(
    slug: string, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.get<TData>(
      `/api/catalog/products/${slug}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.get<TData>(
      `/api/catalog/products/${slug}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.get<TData>(
      `/api/catalog/products/${slug}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

 productsControllerUpdate<TData = ProductDetailDto>(id: string,
    updateProductDto: UpdateProductDto, options?: HttpClientBodyOptions): Observable<TData>;
 productsControllerUpdate<TData = ProductDetailDto>(id: string,
    updateProductDto: UpdateProductDto, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 productsControllerUpdate<TData = ProductDetailDto>(id: string,
    updateProductDto: UpdateProductDto, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  productsControllerUpdate<TData = ProductDetailDto>(
    id: string,
    updateProductDto: UpdateProductDto, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.patch<TData>(
      `/api/catalog/products/${id}`,
      updateProductDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.patch<TData>(
      `/api/catalog/products/${id}`,
      updateProductDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.patch<TData>(
      `/api/catalog/products/${id}`,
      updateProductDto,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

 productsControllerRemove<TData = void>(id: string, options?: HttpClientBodyOptions): Observable<TData>;
 productsControllerRemove<TData = void>(id: string, options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 productsControllerRemove<TData = void>(id: string, options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  productsControllerRemove<TData = void>(
    id: string, options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.delete<TData>(
      `/api/catalog/products/${id}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.delete<TData>(
      `/api/catalog/products/${id}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.delete<TData>(
      `/api/catalog/products/${id}`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

 healthControllerCheck<TData = void>( options?: HttpClientBodyOptions): Observable<TData>;
 healthControllerCheck<TData = void>( options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 healthControllerCheck<TData = void>( options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  healthControllerCheck<TData = void>(
     options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.get<TData>(
      `/api/health`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.get<TData>(
      `/api/health`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.get<TData>(
      `/api/health`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

};
