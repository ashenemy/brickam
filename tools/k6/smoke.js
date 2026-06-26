// Brickam — k6 smoke-тест: быстрый прогон ключевых публичных GET-эндпоинтов.
// Цель — убедиться, что прод/стейджинг отвечает (health + базовые публичные роуты).
// Запуск:  k6 run -e BASE_URL=https://example.com tools/k6/smoke.js
//
// Примечание: __ENV/__VU и импорты 'k6/...' — глобалы/модули рантайма k6 (не Node).

import { check, group } from 'k6';
import http from 'k6/http';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export const options = {
    vus: 1,
    iterations: 1,
    thresholds: {
        // smoke падает при любой ошибке или медленном ответе.
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<800'],
    },
};

export default function () {
    group('health', () => {
        const live = http.get(`${BASE_URL}/api/health/live`);
        check(live, { 'live 200': (r) => r.status === 200 });

        const ready = http.get(`${BASE_URL}/api/health/ready`);
        // ready может быть 200 или 503 (если Mongo/Redis недоступны) — оба валидны как «ответ».
        check(ready, { 'ready отвечает': (r) => r.status === 200 || r.status === 503 });
    });

    group('public catalog', () => {
        const products = http.get(`${BASE_URL}/api/v1/catalog/products?page=1&limit=10`);
        check(products, { 'products 200': (r) => r.status === 200 });

        const categories = http.get(`${BASE_URL}/api/v1/catalog/categories`);
        check(categories, { 'categories 200': (r) => r.status === 200 });
    });
}
