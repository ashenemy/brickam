// BuildHub — k6 сценарий checkout: реалистичный путь покупателя.
//   1) login (телефон+пароль) — API ставит httpOnly-cookie И возвращает токены в теле
//   2) GET каталога — выбрать товар
//   3) POST /cart/items — добавить в корзину
//   4) POST /orders/checkout — оформить заказ (идемпотентно по Idempotency-Key)
//
// Аутентификация: API работает в dual-mode (cookie ИЛИ Bearer). k6 хранит
// cookie автоматически (cookie jar на VU), но прод за reverse-proxy может ставить
// Secure-cookie — чтобы не зависеть от этого, дополнительно шлём Bearer из тела.
//
// Запуск (нужны реально существующие учётки!):
//   k6 run -e BASE_URL=https://example.com \
//          -e USER_PHONE=+37400000000 -e USER_PASSWORD=secret \
//          -e PRODUCT_ID=<id товара> tools/k6/checkout.js
//
// Примечание: __ENV/__VU/__ITER и импорты 'k6/...' — глобалы/модули рантайма k6 (не Node).

import { check, group, sleep } from 'k6';
import http from 'k6/http';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const USER_PHONE = __ENV.USER_PHONE || '+37400000000';
const USER_PASSWORD = __ENV.USER_PASSWORD || 'Password123!';
// Если PRODUCT_ID не задан — берём первый товар из листинга на лету.
const PRODUCT_ID_ENV = __ENV.PRODUCT_ID || '';

const checkoutOk = new Counter('checkout_success');
const checkoutFail = new Counter('checkout_failed');

export const options = {
    scenarios: {
        buyer_flow: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 10 },
                { duration: '1m', target: 25 },
                { duration: '30s', target: 0 },
            ],
            gracefulRampDown: '15s',
        },
    },
    thresholds: {
        http_req_failed: ['rate<0.05'],
        http_req_duration: ['p(95)<1500'],
        checkout_failed: ['count<10'],
    },
};

const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Уникальный ключ идемпотентности на попытку checkout (VU+ITER+время).
function idempotencyKey() {
    return `k6-${__VU}-${__ITER}-${Date.now()}`;
}

export default function () {
    let accessToken = null;
    let productId = PRODUCT_ID_ENV;

    group('1. login', () => {
        const res = http.post(
            `${BASE_URL}/api/v1/auth/login`,
            JSON.stringify({ phone: USER_PHONE, password: USER_PASSWORD }),
            { headers: JSON_HEADERS, tags: { name: 'auth_login' } },
        );
        check(res, { 'login 200': (r) => r.status === 200 });
        try {
            const body = res.json();
            if (body?.tokens?.accessToken) {
                accessToken = body.tokens.accessToken;
            }
        } catch (_e) {
            // тело может быть не-JSON при ошибке — cookie jar всё равно подхватит сессию
        }
    });

    // Заголовок авторизации (Bearer) если токен пришёл; иначе полагаемся на cookie jar.
    const authHeaders = accessToken
        ? { ...JSON_HEADERS, Authorization: `Bearer ${accessToken}` }
        : { ...JSON_HEADERS };

    group('2. browse catalog', () => {
        const res = http.get(`${BASE_URL}/api/v1/catalog/products?page=1&limit=24`, {
            tags: { name: 'catalog_products' },
        });
        check(res, { 'catalog 200': (r) => r.status === 200 });

        if (!productId) {
            try {
                const body = res.json();
                const items = (body && (body.items || body.data)) || [];
                if (items.length > 0) {
                    productId = items[0].id || items[0]._id;
                }
            } catch (_e) {
                // оставим productId пустым — checkout-группа просто пропустится
            }
        }
    });

    sleep(Math.random() + 0.5);

    group('3. add to cart', () => {
        if (!productId) return;
        const res = http.post(
            `${BASE_URL}/api/v1/cart/items`,
            JSON.stringify({ productId, qty: 1 }),
            { headers: authHeaders, tags: { name: 'cart_add' } },
        );
        check(res, { 'add to cart 2xx': (r) => r.status >= 200 && r.status < 300 });
    });

    sleep(Math.random() + 0.5);

    group('4. checkout', () => {
        if (!productId) return;
        const res = http.post(
            `${BASE_URL}/api/v1/orders/checkout`,
            JSON.stringify({ paymentMethod: 'arca', deliveryMethod: 'pickup' }),
            {
                headers: { ...authHeaders, 'Idempotency-Key': idempotencyKey() },
                tags: { name: 'orders_checkout' },
            },
        );
        const ok = check(res, {
            'checkout 2xx': (r) => r.status >= 200 && r.status < 300,
        });
        if (ok) {
            checkoutOk.add(1);
        } else {
            checkoutFail.add(1);
        }
    });

    sleep(1);
}
