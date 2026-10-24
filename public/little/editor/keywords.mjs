import functionalFields from './functional/keywords.json' with {type: 'json'};
const originalDefinitions = [
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
const classicExtra = [
 ['TYPE_VOID','Void','Void type','typeName'], ['TYPE_UNKNOWN','Unknown','Unknown type','typeName'],
 ['MAIN_MODULE_NAME','Main','Main module name','definitionKeyword'], ['REGISTERED_MODULE_NAME','Registered','Registered module name','definitionKeyword'],
 ['CONDITION__WHILE_LOOP','while','While loop','keyword'], ['CONDITION__FOR_LOOP','for','For loop','keyword'],
 ['CONDITION__IF','if','If condition','keyword'],
 ['FOR_LOOP_FROM','from','For: from','keyword'], ['FOR_LOOP_TO','to','For: to','keyword'], ['FOR_LOOP_JUMP','jump','For: step','keyword']
];
export const classicOperators = { '+':'ADD_SIGN', '-':'SUBTRACT_SIGN', '*':'MULTIPLY_SIGN', '/':'DIVIDE_SIGN', '^':'POW_SIGN', '√':'SQRT_SIGN', '!':'FACTORIAL_SIGN', '&&':'AND_SIGN', '||':'OR_SIGN', '^^':'XOR_SIGN', '==':'EQUALS_SIGN', '!=':'NOT_EQUALS_SIGN', '>':'LARGER_SIGN', '<':'SMALLER_SIGN', '>=':'LARGER_EQUALS_SIGN', '<=':'SMALLER_EQUALS_SIGN' };
export const classicFieldNames = new Set([...originalDefinitions,...classicExtra].map(row=>row[0]).concat(Object.values(classicOperators)));
export const functionalFieldNames = new Set(functionalFields.map(row=>row[0]));
const combined = new Map([...originalDefinitions,...classicExtra].map(row=>[row[0],row]));
for (const row of functionalFields) if (!combined.has(row[0])) combined.set(row[0],row);
export const keywordDefinitions = [...combined.values()].map(row=>[...row.slice(0,4), row[4] || (row[3] === 'operator' ? 'operator' : 'global')]);
export function supportedFields(profile='classic') {return profile === 'functional' ? functionalFieldNames : classicFieldNames;}
export const defaultKeywords = Object.fromEntries(keywordDefinitions.map(([key, value]) => [key, value]));
export function normalizeKeywords(overrides = {}, definitions = keywordDefinitions) {
    const values = {};
    for (const [key, fallback, label, kind, scope='global'] of definitions) {
        const value = String(overrides[key] ?? '').trim() || fallback;
        const operator = kind === 'operator';
        if (operator ? /[\s\p{L}\p{N}_"(){}\[\];,]/u.test(value) : !/^[\p{L}_][\p{L}\p{N}_]*$/u.test(value)) {
            return {values, error: `${label}: use ${operator ? 'an operator symbol without spaces' : 'one word without spaces'}.`, field: key};
        }
        if (scope === 'global') {
            const conflict = definitions.find(([other, original, , , otherScope='global']) => other !== key && values[other] === value && otherScope === 'global' && original !== fallback);
            if (conflict) return {values, error: `${label}: this name is already used by another keyword.`, field: key};
        }
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
        READ_FUNCTION_NAME: `${define} x = 8\n${print}(${k.READ_FUNCTION_NAME}("x"))`,
        PROPERTY_ACCESS_SIGN: `${define} kind = 8${k.PROPERTY_ACCESS_SIGN}type`,
        TRUE_VALUE: `${define} x = ${k.TRUE_VALUE}`,
        FALSE_VALUE: `${define} x = ${k.FALSE_VALUE}`,
        RAISE_ERROR_FUNCTION_NAME: `${k.RAISE_ERROR_FUNCTION_NAME}("Something went wrong")`,
        PRINT_FUNCTION_NAME: `${print}("Hello!")`
    };
    if (samples[field]) return samples[field];
    if (field === 'CONDITION__WHILE_LOOP') return `${define} i = 0\n${k[field]} (i < 3) { ${print}(i)\n i = i + 1 }`;
    if (['AND_SIGN','OR_SIGN','XOR_SIGN'].includes(field)) return `${print}(${k.TRUE_VALUE} ${k[field]} ${k.FALSE_VALUE})`;
    if (field === 'FACTORIAL_SIGN') return `${print}(3${k[field]})`;
    if (field === 'NOT_SIGN') return `${print}(${k[field]}${k.TRUE_VALUE})`;
    if (['NEGATE_SIGN','POSITIVE_SIGN','SQRT_SIGN'].includes(field)) return `${print}(${k[field]}9)`;
    if (field.startsWith('STDLIB__')) {
        const group=field.split('__')[1], name=field.split('__')[2];
        const args={toLowerCase:'()',toUpperCase:'()',trim:'()',substring:'(0, 2)',charAt:'(0)',split:'(",")',replace:'("a", "b")',remove:'("a")',contains:'("a")',indexOf:'("a")',lastIndexOf:'("a")',startsWith:'("a")',endsWith:'("a")',fromCharCode:'(65)',get:'(0)',set:'(0, 7)',allocate:'(16)',free:'(address)',read:'(address, 4)',write:'(address, bytes)'};
        return `${group==='STRING'?(name==='fromCharCode'?k.TYPE_STRING:'"hello"'):group==='ARRAY'?'items':group==='MEMORY'?k.TYPE_MEMORY:'8.5'}${k.PROPERTY_ACCESS_SIGN}${k[field]}${args[name]||''}`;
    }
    if (field==='INSTANTIATE_FUNCTION_NAME') return `${k.TYPE_ARRAY}${k.PROPERTY_ACCESS_SIGN}${k[field]}(${k.TYPE_INT}, 3)`;
    if (field==='TYPE_CAST_FUNCTION_PREFIX') return `8${k.PROPERTY_ACCESS_SIGN}${k[field]}${k.TYPE_STRING}()`;
    if (field.startsWith('OBJECT_')) return `8${k.PROPERTY_ACCESS_SIGN}${k[field]}`;
    if (field==='CONDITION__FOR_LOOP'||field.startsWith('FOR_LOOP_')) return `${k.CONDITION__FOR_LOOP} (${define} i ${k.FOR_LOOP_FROM} 0 ${k.FOR_LOOP_TO} 5 ${k.FOR_LOOP_JUMP} 1) { ${print}(i) }`;
    if (field==='CONDITION__ELSE') return `${k.CONDITION__IF} (${k.FALSE_VALUE}) {} ${k[field]} { ${print}(1) }`;
    if (keywordDefinitions.find(row=>row[0]===field)?.[3]==='operator') return `${print}(3 ${k[field]} 2)`;
    if (field.startsWith('CONDITION__')) return `${k[field]} (${k.TRUE_VALUE}) { ${print}(1) }`;
    if (field.startsWith('CONDITION_')||field.endsWith('MODULE_NAME')) return k[field];
    return samples[field] || `${define} x ${as} ${k[field]} = ${field === 'TYPE_STRING' ? '"Hello"' : field === 'TYPE_BOOLEAN' ? k.TRUE_VALUE : field === 'TYPE_DYNAMIC' ? k.NULL_VALUE : field === 'TYPE_MODULE' ? k.TYPE_BOOLEAN : field === 'TYPE_SIGN' ? '+' : field === 'TYPE_FLOAT' ? '8.5' : '8'}`;
}
export function makeExample(k) {
    return `"""Edit the greeting or the number"""\n${k.PRINT_FUNCTION_NAME}("Hello from Little!")\n\n${k.VARIABLE_DECLARATION} answer = 6 * 7\n${k.PRINT_FUNCTION_NAME}(answer)`;
}
