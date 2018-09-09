// Mandelbrot Set in GLSL
// Created by John Lynch - Sep 2018;
// License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
const float SCALE_PER_FRAME = 1.003;
const vec4 white = vec4(1., 1., 1., 1.);
const vec4 black = vec4(0., 0., 0., 1.);
const vec4 orange = vec4(1.0, 0.4, 0., 1.);
const vec4 cyan = vec4(0., 0.8, 1.0, 1.);
const vec4 magenta = vec4(1.0, 0., 1.0, 1.);
const vec4 gold = vec4(1.0, 0.84, 0.66, 1.);

vec4[] cols = vec4[](black, cyan, black, gold, black, orange, black, cyan, black, orange, black);
int numFirstColours = 12;
bool modifiedColours = true;

float aspectRatio;
vec2 zMin;    // corners of the region of the Complex plane we're looking at
vec2 zMax;
vec2 zSpan;
vec2 zIncr;

const float escapeRadius = 6.0;
const float escapeRadius2 = 36.0;
float exponent = 2.;
int maxIterations = 256;

void updateGeometryVars() {
    zSpan = zMax - zMin;
    zIncr = zSpan / iResolution.xy;
}

vec2 xyToPixel(vec2 z, vec2 zMin, vec2 zMax) {
    return (z - zMin) / (zMax - zMin) * iResolution.xy;
}

vec2 pixelToXy(vec2 pixel, vec2 zMin, vec2 zMax) {
    return pixel / iResolution.xy * (zMax - zMin) + zMin;
}
// For the scale fn it doesn't reall pay to be functional as I'd have to return an array of two vec2s (not
// sure if the compiler will let me) or pass zMin & zMax by reference as an "inout" argument; so think I'll
// just let scale() update the global variables...
void scale(float factor) {
    vec2 halfDiag = (zMax - zMin) / 2.0;
    vec2 centre = zMin + halfDiag;
    zMin = centre - halfDiag / factor;
    zMax = centre + halfDiag / factor;
    updateGeometryVars();
}
    

vec2 f(vec2 z, vec2 w) {

    return vec2(z.x * z.x - z.y * z.y, 2. * z.x * z.y) + w;
}

float iterate(vec2 z) {
    int numIts = 0;
    float realIts = 0.;
    vec2 z0 = z;
    float zAbs = z.x * z.x + z.y * z.y;
    float zAbsPrevious = zAbs;
    while (numIts < maxIterations && zAbs < escapeRadius) {
        numIts++;
        z = f(z, z0);
        zAbsPrevious = zAbs;
        zAbs = z.x * z.x + z.y * z.y;
    }
    if (zAbs < escapeRadius) {
        realIts = float(numIts + 1) - (log(log(zAbs + 1.) + 1.) / log(log(escapeRadius + 1.) + 1.));
    }
    else {
        float far = max(exponent, log(zAbs) / log(zAbsPrevious));
        realIts = float(numIts) - (log(log(zAbs)) - log(log(escapeRadius))) / log(far);
    }
    return ++realIts;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    // I'd like to declare these three outside of this main method, but can't find a 
    // way to keep the compiler happy. :(
    aspectRatio = iResolution.x / iResolution.y;
    zMin = vec2(-1.2 * aspectRatio - 1.6, -1.2);    // corners of the region of the Complex plane we're looking at
    zMax = vec2(1.2* aspectRatio - 1.6, 1.2);
        
    scale(pow(SCALE_PER_FRAME, float(iFrame)));
        // the below code now handled in updateGeometryVars();
    // vec2 zSpan = zMax - zMin;  // size of the region of the Complex plane we're looking at
    // vec2 zIncr = zSpan / iResolution.xy;       // the distance in complex number terms between each point iterated
   
    vec2 z = pixelToXy(fragCoord.xy, zMin, zMax);
    float its = iterate(z);
    float nfc = float(numFirstColours);
    float colourMappingFactor = (nfc - 1.) / float(maxIterations); 
    
    float colourIndex = modifiedColours ? mod(its, nfc) : mod(its * colourMappingFactor, nfc); // map iteration count to a colour
    int firstColourIndex = int(floor(colourIndex));
    float interpolationFactor = mod(colourIndex, 1.);
    
    // slight hack here, in case iteration value is over max 
    // (may not actually need this...)
    if (firstColourIndex >= numFirstColours) {
        firstColourIndex = numFirstColours - 1;
        interpolationFactor = 1.;
    }
    // another hack!
    if (firstColourIndex < 0) {
        firstColourIndex = 0;
    }

    vec4 col = mix(cols[firstColourIndex], cols[int(mod(float(firstColourIndex + 1), float(cols.length())))], interpolationFactor);
    fragColor = col;
}

