// Генерация типобезопасного Angular-клиента api-kit из OpenAPI-спеки сервера.
// Спека экспортируется скриптом tools/openapi/export-openapi.mjs.
export default {
    buildhub: {
        input: './packages/api-kit/openapi.json',
        output: {
            target: './packages/api-kit/src/generated/buildhub.ts',
            schemas: './packages/api-kit/src/generated/model',
            client: 'angular',
            clean: true,
            override: {
                header: false,
            },
        },
    },
};
