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
            i = Math.min(i, source.length); add('string', start); continue;
        }
        const number = source.slice(i).match(/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/);
        if (number) {i += number[0].length; add('number', start); continue;}
        const word = source.slice(i).match(/^[\p{L}_][\p{L}\p{N}\p{M}_]*/u);
        if (word) {i += word[0].length; add('word', start); continue;}
        const signs = source.slice(i).match(/^[.+*=<>!&|%\/:?~-]+/);
        i += signs ? signs[0].length : 1;
        add('sign', start);
    }
    const aliases = new Map();
    for (const [key, , , kind, scope='global'] of definitions) {const list = aliases.get(before[key]) || []; list.push({key,kind,scope}); aliases.set(before[key],list);}
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
    const inferred = new Map();
    meaningful.forEach((token,index) => {
        if (!isDeclaration(index)) return;
        const name=meaningful[index+1]?.text;
        let value=meaningful[index+2];
        if (value?.text === before.TYPE_DECL_OR_CAST) value=meaningful[index+3];
        else if (value?.text === '=') value=meaningful[index+3];
        const group=value?.type === 'string' ? 'STRING' : value?.type === 'number' ? 'FLOAT' : value?.text === before.TYPE_ARRAY ? 'ARRAY' : value?.text === before.TYPE_STRING ? 'STRING' : value?.text === before.TYPE_MEMORY ? 'MEMORY' : null;
        if(group) inferred.set(name,group);
    });
    const changes = [];
    meaningful.forEach((token, index) => {
        const previous = meaningful[index - 1];
        const member = previous && [before.PROPERTY_ACCESS_SIGN, '?.'].includes(previous.text);
        if (member && before.TYPE_CAST_FUNCTION_PREFIX && token.type==='word') {
            for (const [key,,,kind] of definitions) if (kind==='typeName' && token.text===before.TYPE_CAST_FUNCTION_PREFIX+before[key]) {
                const insert=after.TYPE_CAST_FUNCTION_PREFIX+after[key];
                if(insert!==token.text) changes.push({from:token.from,to:token.to,insert});
                return;
            }
        }
        const candidates = aliases.get(token.text);
        if (!candidates || token.type === 'string') return;
        let matching=candidates.filter(candidate => member ? candidate.scope === 'member' : candidate.scope !== 'member');
        if(member) {
            const receiver=meaningful[index-2];
            const group=receiver?.type === 'string' ? 'STRING' : receiver?.type === 'number' ? 'FLOAT' : inferred.get(receiver?.text) || (receiver?.text===before.TYPE_ARRAY?'ARRAY':receiver?.text===before.TYPE_MEMORY?'MEMORY':null);
            if(group) matching=matching.filter(candidate=>!candidate.key.startsWith('STDLIB__') || candidate.key.startsWith('STDLIB__'+group+'_'));
            else if(new Set(matching.map(candidate=>after[candidate.key])).size>1) return;
        }
        if(token.type==='sign' && matching.length>1) {
            const unary=!previous || previous.type==='sign' && ![')',']'].includes(previous.text);
            const desired=token.text===before.ADD_SIGN?(unary?'POSITIVE_SIGN':'ADD_SIGN'):token.text===before.SUBTRACT_SIGN?(unary?'NEGATE_SIGN':'SUBTRACT_SIGN'):token.text===before.FACTORIAL_SIGN?(unary?'NOT_SIGN':'FACTORIAL_SIGN'):null;
            if(desired && matching.some(candidate=>candidate.key===desired)) matching=matching.filter(candidate=>candidate.key===desired);
        }
        const alias = matching.find(candidate=>after[candidate.key]!==token.text);
        if (!alias) return;
        if (isDeclaration(index - 1)) return;
        if (['variableName.function', 'typeName'].includes(alias.kind) && declared.has(token.text)) return;
        if (token.type === 'word' || alias.kind === 'operator') changes.push({from: token.from, to: token.to, insert: after[alias.key]});
    });
    return changes;
}
export function applyKeywordChanges(source, changes) {
    for (const change of changes.slice().reverse()) source = source.slice(0, change.from) + change.insert + source.slice(change.to);
    return source;
}
