# Vision showcase images

The page reuses the existing Vision documentation outputs under `/vision/docs/`.

`harris-corners.png` and `hough-lines.png` use the same valve input and the shipped Haxe-compiled Vision 2.2.0 runtime. Harris options: relativeThreshold=.025, minimumDistance=8, maxCorners=35. Hough options: threshold=22, length=22, gap=3. The JSON files retain the actual detected points and segments.

The Harris point overlay uses clipped 2px circles to keep edge markers within the image. Detection results are unchanged. No example is AI-generated.
