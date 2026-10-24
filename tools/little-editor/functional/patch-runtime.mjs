import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
export async function patchLittleRuntime(sourceRoot) {
 const replacements=[
 ['little/tools/Plugins.hx','null => Block([','[] => Block(['],
 ['little/interpreter/memory/Storage.hx','storage[i + j] = j > b.length ? 0 : b[j];','storage[i + j] = b == null || j >= b.length ? 0 : b[j];'],
 ['little/tools/Conversion.hx','obj.key = toHaxeValue(value.value);','Reflect.setField(obj, key, toHaxeValue(value.value));'],
 ['little/tools/PrepareRun.hx','var arrayRef = Conversion.toHaxeValue(params[1]).parameter(0);','var arrayRef:Map<String, {documentation:String, value:InterpTokens}> = params[1].parameter(0);'],
 ['little/tools/PrepareRun.hx','arrayType != Little.memory.constants.INT || arrayType != Little.memory.constants.FLOAT || arrayType != Little.memory.constants.BOOL','arrayType != Little.memory.constants.INT && arrayType != Little.memory.constants.FLOAT && arrayType != Little.memory.constants.BOOL'],
 ['little/tools/PrepareRun.hx','for (i in 0...array.length) { byteArray.setUInt8(i, array[i].getUInt8(i)); }','for (i in 0...array.length) { byteArray.setUInt8(i, arrayType == Little.memory.constants.INT ? array[i].getInt32(0) : arrayType == Little.memory.constants.FLOAT ? Std.int(array[i].getDouble(0)) : array[i].getUInt8(0)); }'],
 ['little/interpreter/Interpreter.hx','_pattern == null || fit(givenPattern, _pattern)','_pattern == null || _pattern.length == 0 || fit(givenPattern, _pattern)']
 ];
 for(const [file,before,after] of replacements){const target=path.join(sourceRoot,'src',file);let source=await readFile(target,'utf8');if(source.includes(before)) source=source.replace(before,after);else if(!source.includes(after))throw new Error('Little patch context changed: '+file);await writeFile(target,source);}
}
