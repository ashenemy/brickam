// Scope обязателен и = имя проекта Nx (один app/один package).
// scope-enum можно автогенерировать: см. tools/hooks/gen-scope-enum.mjs (опционально).
module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'scope-empty': [2, 'never'],
        'subject-case': [0],
    },
};
