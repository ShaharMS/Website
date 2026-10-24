export const keywordDefinitions = [
    ['VARIABLE_DECLARATION', 'define', 'Variable declaration', 'definitionKeyword'],
    ['FUNCTION_DECLARATION', 'action', 'Function declaration', 'definitionKeyword'],
    ['NULL_VALUE', 'nothing', 'Null value', 'definitionKeyword'],
    ['RUN_CODE_FUNCTION_NAME', 'run', 'Run code function', 'variableName.function'],
    ['TYPE_DECL_OR_CAST', 'as', 'Type declaration or cast', 'keyword'],
    ['TYPE_FLOAT', 'Decimal', 'Decimal type', 'typeName'],
    ['TYPE_BOOLEAN', 'Boolean', 'Boolean type', 'typeName'],
    ['TYPE_STRING', 'Characters', 'String type', 'typeName'],
    ['TYPE_MODULE', 'Type', 'Module type', 'typeName'],
    ['FUNCTION_RETURN', 'return', 'Function return', 'keyword'],
    ['READ_FUNCTION_NAME', 'read', 'Read function', 'variableName.function'],
    ['TYPE_DYNAMIC', 'Anything', 'Dynamic type', 'typeName'],
    ['PROPERTY_ACCESS_SIGN', '.', 'Property access', 'operator'],
    ['TRUE_VALUE', 'true', 'True value', 'definitionKeyword'],
    ['TYPE_INT', 'Number', 'Integer type', 'typeName'],
    ['FALSE_VALUE', 'false', 'False value', 'definitionKeyword'],
    ['RAISE_ERROR_FUNCTION_NAME', 'error', 'Raise error function', 'variableName.function'],
    ['TYPE_SIGN', 'Sign', 'Sign type', 'typeName'],
    ['PRINT_FUNCTION_NAME', 'print', 'Print function', 'variableName.function']
];
export const defaultKeywords = Object.fromEntries(keywordDefinitions.map(([key, value]) => [key, value]));
export function normalizeKeywords(overrides = {}) {
    const values = {};
    for (const [key, fallback, label] of keywordDefinitions) {
        const value = String(overrides[key] ?? '').trim() || fallback;
        if (key === 'PROPERTY_ACCESS_SIGN' ? /\s|["(){}]/u.test(value) : !/^[\p{L}_][\p{L}\p{N}_]*$/u.test(value)) {
            return {values, error: `${label}: use ${key === 'PROPERTY_ACCESS_SIGN' ? 'a single delimiter without spaces' : 'one word without spaces'}.`, field: key};
        }
        if (Object.values(values).includes(value)) return {values, error: `${label}: this name is already used by another keyword.`, field: key};
        values[key] = value;
    }
    return {values, error: null};
}
export function exampleForKeyword(field, k) {
    const define = k.VARIABLE_DECLARATION, print = k.PRINT_FUNCTION_NAME, as = k.TYPE_DECL_OR_CAST;
    const samples = {
        VARIABLE_DECLARATION: `${define} x = 8`,
        FUNCTION_DECLARATION: `${k.FUNCTION_DECLARATION} twice(${define} x) = {\n  ${k.FUNCTION_RETURN} x * 2\n}`,
        NULL_VALUE: `${define} x = ${k.NULL_VALUE}`,
        RUN_CODE_FUNCTION_NAME: `${k.RUN_CODE_FUNCTION_NAME}("${print}(8)")`,
        TYPE_DECL_OR_CAST: `${define} x ${as} ${k.TYPE_INT} = 8`,
        FUNCTION_RETURN: `${k.FUNCTION_DECLARATION} answer() = { ${k.FUNCTION_RETURN} 42 }`,
        READ_FUNCTION_NAME: `${define} x = ${k.READ_FUNCTION_NAME}("Your name?")`,
        PROPERTY_ACCESS_SIGN: `${define} kind = 8${k.PROPERTY_ACCESS_SIGN}type`,
        TRUE_VALUE: `${define} x = ${k.TRUE_VALUE}`,
        FALSE_VALUE: `${define} x = ${k.FALSE_VALUE}`,
        RAISE_ERROR_FUNCTION_NAME: `${k.RAISE_ERROR_FUNCTION_NAME}("Something went wrong")`,
        PRINT_FUNCTION_NAME: `${print}("Hello!")`
    };
    return samples[field] || `${define} x ${as} ${k[field]} = ${field === 'TYPE_STRING' ? '"Hello"' : field === 'TYPE_BOOLEAN' ? k.TRUE_VALUE : field === 'TYPE_DYNAMIC' ? k.NULL_VALUE : field === 'TYPE_MODULE' ? k.TYPE_BOOLEAN : field === 'TYPE_SIGN' ? '+' : field === 'TYPE_FLOAT' ? '8.5' : '8'}`;
}
export function makeExample(k) {
    return `"""Edit the greeting or the number"""\n${k.PRINT_FUNCTION_NAME}("Hello from Little!")\n\n${k.VARIABLE_DECLARATION} answer = 6 * 7\n${k.PRINT_FUNCTION_NAME}(answer)`;
}
