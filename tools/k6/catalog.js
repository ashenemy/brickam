// Brickam — k6 нагрузочный тест каталога: GET /api/v1/catalog/products.
// Самый горячий публичный роут (листинг товаров). Ramp-up VU по этапам.
// Запуск:  k6 run -e BASE_URL=https://example.com tools/k6/catalog.js
//
// Примечание: __ENV и импорты 'k6/...' — глобал/модули рантайма k6 (не Node).

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Кастомная метрика — длительность только запроса списка товаров.
const productsLatency = new Trend('products_latency', true);

export const options = {
    scenarios: {
        catalog_browse: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 20 }, // разогрев
                { duration: '1m', target: 50 }, // плато
                { duration: '1m', target: 100 }, // пик
                { duration: '30s', target: 0 }, // спад
            ],
            gracefulRampDown: '10s',
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.02'],
        products_latency: ['p(95)<600', 'p(99)<1200'],
    },
};

// Имитируем пагинацию/фильтры по разным страницам.
const PAGES = [1, 2, 3, 4, 5];

export default function () {
    const page = PAGES[Math.floor(Math.random() * PAGES.length)];
    const res = http.get(`${BASE_URL}/api/v1/catalog/products?page=${page}&limit=24`, {
        tags: { name: 'catalog_products' }, // группировка метрик по имени, а не по URL
    });

    productsLatency.add(res.timings.duration);
    check(res, {
        'status 200': (r) => r.status === 200,
        'есть тело': (r) => !!r.body && r.body.length > 0,
    });

    sleep(Math.random() * 1.5 + 0.5); // think-time 0.5–2s
}
