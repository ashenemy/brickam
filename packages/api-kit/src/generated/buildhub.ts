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







@Injectable({ providedIn: 'root' })
export class BuildHubAPIService {
  private readonly http = inject(HttpClient);
 healthControllerCheck<TData = void>( options?: HttpClientBodyOptions): Observable<TData>;
 healthControllerCheck<TData = void>( options?: HttpClientEventOptions): Observable<HttpEvent<TData>>;
 healthControllerCheck<TData = void>( options?: HttpClientResponseOptions): Observable<AngularHttpResponse<TData>>;
  healthControllerCheck<TData = void>(
     options?: HttpClientObserveOptions): Observable<TData | HttpEvent<TData> | AngularHttpResponse<TData>> {
    if (options?.observe === 'events') {
      return this.http.get<TData>(
      `/health`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'events',
      }
    );
    }

    if (options?.observe === 'response') {
      return this.http.get<TData>(
      `/health`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'response',
      }
    );
    }

    return this.http.get<TData>(
      `/health`,{
        ...(options as Omit<NonNullable<typeof options>, 'observe'>),
        observe: 'body',
      }
    );
  }

};
