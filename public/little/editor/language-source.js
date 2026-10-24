import {StreamLanguage} from '@codemirror/language';
import grammar from './source/little.tmLanguage.json';
import {keywordDefinitions, supportedFields} from './keywords.mjs';

const rules = grammar.repository;
const words = name => rules[name].patterns[0].match.match(/\(([^()]+)\)/)[1].split('|');
const number = new RegExp('^(?:' + rules.numbers.patterns[0].match + ')');
export function createLanguage(keywords, profile='functional') {
    const styles = new Map();
    for (const [group, style] of [['keywords','keyword'],['keywords2','definitionKeyword'],['types','typeName']]) {
        words(group).forEach(word => styles.set(word, style));
    }
    for (const [, original] of keywordDefinitions) styles.delete(original);
    const active=keywordDefinitions.filter(row=>supportedFields(profile).has(row[0]));
    const members=new Map();
    for (const [key, , , style,scope] of active) (scope==='member'?members:styles).set(keywords[key], style);
    const operators=[...new Set(active.filter(row=>row[3]==='operator').map(row=>keywords[row[0]]))].sort((a,b)=>b.length-a.length);
    return StreamLanguage.define({
        startState: () => ({quote: false, documentation: false}),
        token(stream, state) {
            if (state.documentation) {while (!stream.eol()) {if (stream.match('"""')) {state.documentation = false; break;} stream.next();} return 'comment';}
            if (state.quote) {while (!stream.eol()) {const ch = stream.next(); if (ch === '\\') stream.next(); else if (ch === '"') {state.quote = false; break;}} return 'string';}
            if (stream.eatSpace()) return null;
            if (stream.match('"""')) {state.documentation = true; return 'comment';}
            if (stream.eat('"')) {state.quote = true; return 'string';}
            if (!/^[\p{L}_]/u.test(keywords.PROPERTY_ACCESS_SIGN) && stream.match(keywords.PROPERTY_ACCESS_SIGN)) return 'operator';
            if (stream.match(number)) return 'number';
            for(const sign of operators) if(stream.match(sign)) return 'operator';
            const word = stream.match(/[\p{L}_][\p{L}\p{N}\p{M}_]*/u);
            if (word) return (stream.string.slice(0,stream.start).trimEnd().endsWith(keywords.PROPERTY_ACCESS_SIGN) ? members.get(word[0]) : styles.get(word[0])) || (/^\s*\(/.test(stream.string.slice(stream.pos)) ? 'variableName.function' : 'variableName');
            if (stream.match(/[+*=<>!&|%\/-]+/)) return 'operator';
            stream.next(); return null;
        }
    });
}
