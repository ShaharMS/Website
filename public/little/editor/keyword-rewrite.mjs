// Lex source once and rewrite exact keyword tokens, never strings or comments.
export function keywordChanges(source, before, after, definitions) {
    const tokens = [];
    let i = 0;
    const add = (type, start) => tokens.push({type, from: start, to: i, text: source.slice(start, i)});
    while (i < source.length) {
        const start = i;
        if (/\s/u.test(source[i])) {i++; continue;}
        if (source.startsWith('"""', i)) {
            i += 3;
            while (i < source.length && !source.startsWith('"""', i)) {if (source[i] === '\\') i++; i++;}
            i = Math.min(source.length, i + 3); add('opaque', start); continue;
        }
        if (source.startsWith('//', i)) {while (i < source.length && source[i] !== '\n') i++; add('opaque', start); continue;}
        if (source.startsWith('/*', i)) {i += 2; while (i < source.length && !source.startsWith('*/', i)) i++; i = Math.min(source.length, i + 2); add('opaque', start); continue;}
        if (source[i] === '"' || source[i] === "'") {
            const quote = source[i++];
            while (i < source.length) {const ch = source[i++]; if (ch === '\\') i++; else if (ch === quote) break;}
            i = Math.min(i, source.length); add('opaque', start); continue;
        }
        const number = source.slice(i).match(/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
        if (number) {i += number[0].length; add('number', start); continue;}
        const word = source.slice(i).match(/^[\p{L}_][\p{L}\p{N}_]*/u);
        if (word) {i += word[0].length; add('word', start); continue;}
        const signs = source.slice(i).match(/^[.+*=<>!&|%\/:?~-]+/);
        i += signs ? signs[0].length : 1;
        add('sign', start);
    }
    const aliases = new Map(definitions.map(([key, , , kind]) => [before[key], {key, kind}]));
    const meaningful = tokens.filter(token => token.type !== 'opaque');
    const isDeclaration = index => {
        const token = meaningful[index], previous = meaningful[index - 1], next = meaningful[index + 1];
        return token && [before.VARIABLE_DECLARATION, before.FUNCTION_DECLARATION].includes(token.text) &&
            ![before.PROPERTY_ACCESS_SIGN, '?.'].includes(previous?.text) && next &&
            !/[\r\n]/.test(source.slice(token.to, next.from));
    };
    const declared = new Set();
    meaningful.forEach((token, index) => {
        if (isDeclaration(index) && meaningful[index + 1]?.type === 'word') declared.add(meaningful[index + 1].text);
    });
    const changes = [];
    meaningful.forEach((token, index) => {
        const alias = aliases.get(token.text);
        if (!alias || after[alias.key] === token.text) return;
        const previous = meaningful[index - 1];
        if (previous && [before.PROPERTY_ACCESS_SIGN, '?.'].includes(previous.text)) return;
        if (isDeclaration(index - 1)) return;
        if (['variableName.function', 'typeName'].includes(alias.kind) && declared.has(token.text)) return;
        if (token.type === 'word' || alias.key === 'PROPERTY_ACCESS_SIGN') changes.push({from: token.from, to: token.to, insert: after[alias.key]});
    });
    return changes;
}
export function applyKeywordChanges(source, changes) {
    for (const change of changes.slice().reverse()) source = source.slice(0, change.from) + change.insert + source.slice(change.to);
    return source;
}
