import sys.io.File;
import vision.Vision;
import vision.tools.ImageTools;

class DistortionExamples {
    static function main() {
        var args = Sys.args();
        var image = vision.helpers.FormatImageLoader.png(File.getBytes(args[0]));
        ImageTools.saveToFile(Vision.barrelDistortion(image.clone()), args[1] + '/valve-barrelDistortion.png');
        ImageTools.saveToFile(Vision.pincushionDistortion(image.clone()), args[1] + '/valve-pincushionDistortion.png');
        ImageTools.saveToFile(Vision.mustacheDistortion(image.clone()), args[1] + '/valve-mustacheDistortion.png');
    }
}
