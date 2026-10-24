import vision.Vision;
import vision.ds.Image;
import vision.ds.Color;
import vision.ds.Matrix2D;
import vision.ds.TransformationMatrix2D;
import vision.ds.Kernel2D;
import vision.ds.Line2D;
import vision.ds.IntPoint2D;
import js.lib.Uint8Array;
import js.lib.ArrayBuffer;
@:expose("BrowserVision")
class BrowserVision {
 static function main() {}
 static function number(p:Dynamic,key:String,fallback:Float):Float {final v=Reflect.field(p,key);return v==null?fallback:Std.parseFloat(Std.string(v));}
 static function integer(p:Dynamic,key:String,fallback:Int):Int return Std.int(number(p,key,fallback));
 static function boolean(p:Dynamic,key:String,fallback:Bool):Bool return Reflect.hasField(p,key)?Reflect.field(p,key):fallback;
 static function color(p:Dynamic,key:String,fallback:Int):Color {final v=Reflect.field(p,key);if(v==null)return fallback; final str=Std.string(v);return cast (str.charAt(0)=="#"?Std.parseInt("0xFF"+str.substr(1)):Std.parseInt(str));}
 static function input(width:Int,height:Int,buffer:ArrayBuffer):Image {
  final image=new Image(width,height);final bytes=new Uint8Array(buffer);var i=0;
  for(y in 0...height)for(x in 0...width){image.setPixel(x,y,cast ((bytes[i+3]<<24)|(bytes[i]<<16)|(bytes[i+1]<<8)|bytes[i+2]));i+=4;}
  return image;
 }
 static function secondary(data:Dynamic,width:Int,height:Int):Image {var other=input(data.width,data.height,data.buffer);return other.resize(width,height);}
 public static function run(request:Dynamic):Dynamic {
  if(request.width<1||request.height<1||request.width*request.height>16000000)throw "Image exceeds the browser workspace size limit.";
  if(["resize","carve"].indexOf(request.operation)!=-1 && number(request.params,"width",request.width)*number(request.params,"height",request.height)>16000000)throw "Requested output exceeds 16 megapixels; choose smaller dimensions.";
  var image=input(request.width,request.height,request.buffer);final p:Dynamic=request.params==null?{}:request.params;
  var metadata:Dynamic={};final operation:String=request.operation;
  final n=(key:String,value:Float)->number(p,key,value);final i=(key:String,value:Int)->integer(p,key,value);final b=(key:String,value:Bool)->boolean(p,key,value);
  final c=(key:String,value:Int)->color(p,key,value);
  final tint=c("color",0xFFFF0000);
  switch(operation) {
   case "invert":image=Vision.invert(image);
   case "grayscale":image=Vision.grayscale(image,b("simple",false));
   case "sepia":image=Vision.sepia(image,n("strength",.25));
   case "blackAndWhite":image=Vision.blackAndWhite(image,i("threshold",128));
   case "contrast":image=Vision.contrast(image);
   case "tint":image=Vision.tint(image,tint,n("percentage",50));
   case "combine":image=Vision.combine(image,secondary(request.secondary,image.width,image.height),n("percentage",50));
   case "smooth":image=Vision.smooth(image,n("strength",.1),b("alpha",false),i("radius",1),b("circular",true),i("iterations",1));
   case "pixelate":image=Vision.pixelate(image,b("average",true),i("size",8),b("alpha",true));
   case "posterize":image=Vision.posterize(image,i("bits",4),b("alpha",true));
   case "sharpen":image=Vision.sharpen(image);
   case "deepfry":image=Vision.deepfry(image,i("iterations",2));
   case "vignette":image=Vision.vignette(image,n("strength",.2),n("intensity",1),b("ratio",false),c("color",0xFF000000));
   case "fisheyeDistortion":image=Vision.fisheyeDistortion(image,n("strength",1.5));
   case "barrelDistortion":image=Vision.barrelDistortion(image,n("strength",.2));
   case "pincushionDistortion":image=Vision.pincushionDistortion(image,n("strength",.2));
   case "mustacheDistortion":image=Vision.mustacheDistortion(image,n("amplitude",.2));
   case "dilate":image=Vision.dilate(image,i("radius",2),cast i("order",cast vision.ds.specifics.ColorImportanceOrder.RedGreenBlue),b("circular",true));
   case "erode":image=Vision.erode(image,i("radius",2),cast i("order",cast vision.ds.specifics.ColorImportanceOrder.RedGreenBlue),b("circular",true));
   case "saltAndPepperNoise":image=Vision.saltAndPepperNoise(image,n("percentage",25));
   case "dropOutNoise":image=Vision.dropOutNoise(image,n("percentage",5),i("threshold",128));
   case "whiteNoise":image=Vision.whiteNoise(image,n("percentage",25),cast i("range",16));
   case "normalize":image=Vision.normalize(image,c("start",0xFF000000),c("end",0xFFFFFFFF));
   case "limitColorRanges":image=Vision.limitColorRanges(image,c("start",0xFF000000),c("end",0xFFFFFFFF));
   case "replaceColorRanges":image=Vision.replaceColorRanges(image,[{rangeStart:c("start",0xFF000000),rangeEnd:c("end",0xFF888888),replacement:tint}]);
   case "filterForColorChannel":image=Vision.filterForColorChannel(image,cast i("channel",0xFF0000));
   case "convolve":
    final kernel:Kernel2D=p.kernel=="Custom"?Kernel2D.Custom(cast p.matrix):Type.createEnum(Kernel2D,p.kernel==null?"Sharpen":p.kernel);
    image=Vision.convolve(image,kernel);
   case "affineTransform","projectiveTransform":
    final values:Array<Array<Float>>=p.matrix==null?[[1.,0.,0.],[0.,1.,0.],[0.,0.,1.]]:cast p.matrix;
    final matrix:TransformationMatrix2D=(values:Matrix2D);
    image=operation=="affineTransform"?Vision.affineTransform(image,matrix):Vision.projectiveTransform(image,matrix);
   case "nearestNeighborBlur":image=Vision.nearestNeighborBlur(image,i("iterations",1));
   case "gaussianBlur":image=Vision.gaussianBlur(image,n("sigma",1),cast i("kernel",5),b("fast",false));
   case "medianBlur":image=Vision.medianBlur(image,i("kernel",5));
   case "sobelEdgeDiffOperator":image=Vision.sobelEdgeDiffOperator(image);
   case "perwittEdgeDiffOperator":image=Vision.perwittEdgeDiffOperator(image);
   case "robertEdgeDiffOperator":image=Vision.robertEdgeDiffOperator(image);
   case "laplacianEdgeDiffOperator":image=Vision.laplacianEdgeDiffOperator(image,b("positive",true));
   case "cannyEdgeDetection":image=Vision.cannyEdgeDetection(image,n("sigma",1),cast i("kernel",5),n("low",.05),n("high",.2));
   case "sobelEdgeDetection":image=Vision.sobelEdgeDetection(image,n("threshold",500));
   case "perwittEdgeDetection":image=Vision.perwittEdgeDetection(image,n("threshold",100));
   case "laplacianOfGaussianEdgeDetection":image=Vision.laplacianOfGaussianEdgeDetection(image,i("threshold",2),b("positive",true),n("sigma",1),cast i("kernel",3));
   case "convolutionRidgeDetection":image=Vision.convolutionRidgeDetection(image,c("start",0xFF444444),c("end",0xFFBBBBBB),b("refine",false));
   case "bilateralDenoise":image=Vision.bilateralDenoise(image,n("sigma",.8),n("intensity",50));
   case "kmeansPosterize":image=Vision.kmeansPosterize(image,i("colors",8));
   case "kmeansGroupImageColors":
    final groups=Vision.kmeansGroupImageColors(image,i("colors",8),b("alpha",false));
    metadata={clusters:[for(group in groups){color:"0x"+StringTools.hex(group.centroid,8),pixels:group.items.length}]};
   case "simpleImageSimilarity":metadata={similarity:Vision.simpleImageSimilarity(image,secondary(request.secondary,image.width,image.height),cast i("scoring",1))};
   case "simpleLine2DDetection","houghLineSegmentDetection":
    final lines=operation=="simpleLine2DDetection"?Vision.simpleLine2DDetection(image,n("accuracy",50),n("length",10)):Vision.houghLineSegmentDetection(image,i("threshold",20),n("length",10),n("gap",2));
    metadata={lines:[for(line in lines){x1:line.start.x,y1:line.start.y,x2:line.end.x,y2:line.end.y}]};
    for(line in lines)image.drawLine2D(line,tint);
   case "houghCircleDetection","mapHoughCircles":
    final options=new vision.ds.specifics.HoughCircleOptions();
    if(p.options!=null)for(key in Reflect.fields(p.options))Reflect.setField(options,key,Reflect.field(p.options,key));
    final circles=Vision.houghCircleDetection(image,options);metadata={circles:circles};image=Vision.mapHoughCircles(image,circles,tint);
   case "harrisCorners":
    final options=new vision.ds.specifics.HarrisCornerOptions();
    if(p.options!=null)for(key in Reflect.fields(p.options))Reflect.setField(options,key,Reflect.field(p.options,key));
    final points=Vision.harrisCorners(image,options);metadata={corners:[for(point in points){x:point.x,y:point.y}]};for(point in points)image.drawCircle(point.x,point.y,3,tint);
   case "harrisCornerResponse":
    final options=new vision.ds.specifics.HarrisResponseOptions();if(p.options!=null)for(key in Reflect.fields(p.options))Reflect.setField(options,key,Reflect.field(p.options,key));
    final response=Vision.harrisCornerResponse(image,options);var max=0.;
    for(y in 0...image.height)for(x in 0...image.width)max=Math.max(max,Math.abs(response.get(x,y)));
    metadata={maximumResponse:max};
    for(y in 0...image.height)for(x in 0...image.width){final v=Std.int(max==0?0:Math.abs(response.get(x,y))/max*255);image.setPixel(x,y,cast(0xFF000000|(v<<16)|(v<<8)|v));}
   case "carve":image=Vision.carve(image,i("width",Std.int(image.width*.8)),i("height",image.height));
   case "resize":image=image.resize(i("width",image.width),i("height",image.height),cast i("algorithm",1));
   case "rotate":image=image.rotate(n("angle",90),true,b("expand",true));
   case "mirror":image=image.mirror();
   case "flip":image=image.flip();
   case "crop":image=image.getImagePortion({x:i("x",0),y:i("y",0),width:i("width",Std.int(image.width/2)),height:i("height",Std.int(image.height/2))});
   case "drawLine":image.drawLine(i("x",0),i("y",0),i("x2",image.width-1),i("y2",image.height-1),tint);
   case "drawRect":image.drawRect(i("x",10),i("y",10),i("width",50),i("height",40),tint);
   case "fillRect":image.fillRect(i("x",10),i("y",10),i("width",50),i("height",40),tint);
   case "drawCircle":image.drawCircle(i("x",50),i("y",50),i("radius",20),tint);
   case "fillCircle":image.fillCircle(i("x",50),i("y",50),i("radius",20),tint);
   case "drawEllipse":image.drawEllipse(i("x",50),i("y",50),i("rx",30),i("ry",20),tint);
   case "fillEllipse":image.fillEllipse(i("x",50),i("y",50),i("rx",30),i("ry",20),tint);
   case "fillColor":image.fillColor({x:i("x",0),y:i("y",0)},tint);
   case "fillUntilColor":image.fillUntilColor({x:i("x",0),y:i("y",0)},tint,c("border",0xFF000000));
   case "setPixel":image.setPixel(i("x",0),i("y",0),tint);
   case "drawQuadraticBezier":image.drawQuadraticBezier(new Line2D({x:i("x",0),y:i("y",0)},{x:i("x2",image.width-1),y:i("y2",image.height-1)}),{x:i("cx",Std.int(image.width/2)),y:i("cy",0)},tint);
   case "drawCubicBezier":image.drawCubicBezier(new Line2D({x:i("x",0),y:i("y",0)},{x:i("x2",image.width-1),y:i("y2",image.height-1)}),{x:i("cx",0),y:i("cy",image.height-1)},{x:i("cx2",image.width-1),y:i("cy2",0)},tint);
   case "brush":
    final lines:Array<Array<Int>>=p.lines;final radius=i("radius",2);
    for(line in lines){final steps=Std.int(Math.max(Math.abs(line[2]-line[0]),Math.abs(line[3]-line[1])))+1;for(step in 0...steps){final t=step/steps;image.fillCircle(Std.int(line[0]+(line[2]-line[0])*t),Std.int(line[1]+(line[3]-line[1])*t),radius,tint);}}
   default:throw 'Unknown operation: '+operation;
  }
  final bytes=new Uint8Array(image.width*image.height*4);var offset=0;
  for(y in 0...image.height)for(x in 0...image.width){final pixel=image.getPixel(x,y);bytes[offset++]=pixel.red;bytes[offset++]=pixel.green;bytes[offset++]=pixel.blue;bytes[offset++]=pixel.alpha;}
  return {width:image.width,height:image.height,buffer:bytes.buffer,metadata:metadata};
 }
}
