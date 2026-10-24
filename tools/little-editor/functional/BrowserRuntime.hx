import little.Little;
import little.KeywordConfig;
import little.tools.PrepareRun;
import little.interpreter.Interpreter;
import little.tools.PrettyPrinter;
@:expose("LittleBrowser")
class BrowserRuntime {
 static function main() {}
 public static function run(code:String, overrides:Dynamic):Dynamic {
  Little.keywords = new KeywordConfig();
  if (overrides != null) for (key in Reflect.fields(overrides)) if (Reflect.hasField(Little.keywords,key)) Reflect.setField(Little.keywords,key,Reflect.field(overrides,key));
  Little.reset(); PrepareRun.prepared = false;
  js.Syntax.code("{0}.print = function(item) { var s = String(item) + '\\n'; if (this.stdout.output.length + s.length > 100000) throw new Error('Output limit reached.'); this.stdout.output += s; }",Little.runtime);
  try {
   final declaration = Little.keywords.VARIABLE_DECLARATION;
   final castKeyword = Little.keywords.TYPE_DECL_OR_CAST;
   // Upstream standard-library signatures still spell these two DSL words literally.
   Little.keywords.VARIABLE_DECLARATION = "define";
   Little.keywords.TYPE_DECL_OR_CAST = "as";
   PrepareRun.addTypes(); PrepareRun.addSigns(); PrepareRun.addFunctions(); PrepareRun.addConditions(); PrepareRun.addProps();
   Little.keywords.VARIABLE_DECLARATION = declaration;
   Little.keywords.TYPE_DECL_OR_CAST = castKeyword;
   Little.plugin.registerFunction(Little.keywords.PRINT_FUNCTION_NAME, null, [little.interpreter.Tokens.InterpTokens.VariableDeclaration(little.interpreter.Tokens.InterpTokens.Identifier("item"), null)], params -> {
    final value = params[0].objectValue;
    final text = switch value {case Characters(s): s; default: PrettyPrinter.stringifyInterpreter(value);};
    if (Little.runtime.stdout.output.length + text.length > 100000) throw "Output limit reached.";
    Little.runtime.stdout.output += text + "\n";
    Little.runtime.stdout.stdoutTokens.push(value);
    return little.interpreter.Tokens.InterpTokens.NullValue;
   },Little.keywords.TYPE_DYNAMIC);
   final tokens = Little.compile(code);
   final ast = PrettyPrinter.printInterpreterAst(tokens);
   Interpreter.run(tokens);
   return {output:Little.runtime.stdout.output,error:Little.runtime.errorThrown,ast:ast};
  } catch(e:Dynamic) {return {output:Little.runtime.stdout.output,error:true,message:Little.runtime.errorThrown && Little.runtime.stdout.output.length>0 ? null : Std.string(e)};}
 }
}
