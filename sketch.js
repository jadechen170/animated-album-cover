var soundFile;
var amplitude;
var fft;

var backgroundColor = '#000000';
var colors = ['#075170', '#d51254', '#96a2ac', '#e98e84', '#df4e71', '#d4204c', '#7a92c2'];
var songs = ['Sweather Weather', 'Dream of You', 'One Day' ];
var artists = ['the neighborhood', 'chung ha', 'omoinotake' ];
var songFiles = ['sweather_weather.mp3', 'dream_of_you.mp3', 'one_day.mp3']

var bigMin = 15;
var midMin = 50;
var smallMin = 5;

var beatHoldFrames = 30;
var beatThreshold = 0.11;
var beatCutoff = 0;
var beatDecayRate = 0.98;
var framesSinceLastBeat = 0;

var angle = 0;
var cur = 0;
var soundFile = [];
var playing = false;
var font;
var instructions = ['Press enter to play / change song', ' ' ];

function preload() {
  for (let i = 0; i < songFiles.length; i++) {
    soundFile[i] = loadSound('music/'+songFiles[i]);
  }
  font = loadFont('fonts/Rubik_Light.ttf');
}

function setup() {
  c = createCanvas(600,600);
  noStroke();
  ellipseMode(CENTER);
  rectMode(CENTER);
  angleMode(DEGREES);
}

function draw() {

  if (playing == false) {
    amplitude = new p5.Amplitude();

    curSong = soundFile[cur];
    curSong.play();

    amplitude.setInput(curSong);
    amplitude.smooth(0.9);

    fft = new p5.FFT(0.8, 1024);
    fft.setInput(curSong);

    playing = true;
  }

  background(backgroundColor);

  var spectrum = fft.analyze();
  var highMid = fft.getEnergy("treble");
  var level = amplitude.getLevel();

  detectBeat(level);

  // distort the rectangle based based on the amp
  var distortBig = map(level, 0, 1, 0, 1000);
  var distortMid = map(level, 0, 1, 0, 500);
  var distortSmall = map(level, 0, 1, 0, 100);

  drawBeatCircles(distortBig, distortMid, distortSmall);
  drawRotateLine(highMid);
  drawCurve(spectrum);


  textFont(font);
  fill('#ffffff');
  
  push(); 
  textSize(14);
  textAlign(CENTER);
  text(instructions[0], width/2, 20);
  pop();
  
  push();
  textSize(32);
  text(songs[cur], width / 2, 4 * height / 5);
  textSize(16);
  text(artists[cur], width / 2, 4 * height / 5 + 30);
  pop();
}

function keyPressed() {
  if (keyCode == RETURN || keyCode == ENTER) {
    curSong.stop();
    playing = false;
    paused = true;
    instructions.splice(0,1);
    cur = (cur + 1) % songFiles.length;
    curSong = loadSound(songFiles[cur]);
    curSong.play();
  }
}

function drawCurve(spectrum) {
  var scaledSpectrum = splitOctaves(spectrum, 3);
  var len = scaledSpectrum.length;

  // draw shape
  push();
  noFill();
  stroke('#ffffff');
  strokeWeight(2);
  translate(0, height / 4)
  beginShape();
  var start = map(smoothPoint(scaledSpectrum, i), 0, 255, height / 2, 0);
  curveVertex(0, start);
  for (var i = 0; i < len; i++) {
    var point = smoothPoint(scaledSpectrum, i);
    var x = map(i, 0, len - 1, 0, width);
    var y = map(point, 0, 255, height / 2, 0);
    curveVertex(x, y);
  }
  curveVertex(width,y);
  endShape();

  beginShape();
  stroke('#7a92c2');
  curveVertex(0, start - 10);
  for (var i = 0; i < len; i++) {
    var point = smoothPoint(scaledSpectrum, i);
    var x = map(i, 0, len - 1, 0, width);
    var y = map(point, 0, 255, height / 2, 0) - 10;
    curveVertex(x, y);
  }
  curveVertex(width,y);
  endShape();

  pop();
}

function splitOctaves(spectrum, slicesPerOctave) {
  var scaledSpectrum = [];
  var len = spectrum.length;

  // default to thirds
  var n = slicesPerOctave || 3;
  var nthRootOfTwo = Math.pow(2, 1 / n);

  // the last N bins get their own 
  var lowestBin = slicesPerOctave;

  var binIndex = len - 1;
  var i = binIndex;


  while (i > lowestBin) {
    var nextBinIndex = round(binIndex / nthRootOfTwo);

    if (nextBinIndex === 1) return;

    var total = 0;
    var numBins = 0;

    // add up all of the values for the frequencies
    for (i = binIndex; i > nextBinIndex; i--) {
      total += spectrum[i];
      numBins++;
    }

    // divide total sum by number of bins
    var energy = total / numBins;
    scaledSpectrum.push(energy);

    // keep the loop going
    binIndex = nextBinIndex;
  }

  // add the lowest bins at the end
  for (var j = i; j > 0; j--) {
    scaledSpectrum.push(spectrum[j]);
  }

  // reverse so that array has same order as original array (low to high frequencies)
  scaledSpectrum.reverse();

  return scaledSpectrum;
}

function smoothPoint(spectrum, index, numberOfNeighbors) {

  // default to 2 neighbors on either side
  var neighbors = numberOfNeighbors || 2;
  var len = spectrum.length;

  var val = 0;

  // start below the index
  var indexMinusNeighbors = index - neighbors;
  var smoothedPoints = 0;

  for (var i = indexMinusNeighbors; i < (index + neighbors) && i < len; i++) {
    // if there is a point at spectrum[i], tally it
    if (typeof(spectrum[i]) !== 'undefined') {
      val += spectrum[i];
      smoothedPoints++;
    }
  }

  val = val / smoothedPoints;

  return val;
}

function drawRotateLine(highMid) {
  var mapOne = map(highMid, 0, 255, 0, 400);
  var mapTwo = map(highMid, 0, 255, 0, 300);
  var mapThree = map(highMid, 0, 255, 0, 200);

  rotatingLines(5 * width / 8, height / 9, 10, mapThree);
  rotatingLines(width - 10, height - 10, 30, mapOne);
  rotatingLines(-10, height / 2, 30, mapThree);
}

function rotatingLines(x, y, radius, mapping) {
  push();
  translate(x, y);

  let dif = 8;
  let pieces = 35;

  rotate(angle);
  for (i = 0; i < pieces; i++) {
    rotate(360 / pieces);
    stroke(colors[i % 3 + 4]);
    line(0, radius, 0, max(radius + mapping + dif, radius));
    dif = -dif;
  }
  angle += 0.1;
  pop();
}

function detectBeat(level) {
  if (level > beatCutoff && level > beatThreshold) {
    // onBeat();
    beatCutoff = level * 1.2;
    framesSinceLastBeat = 0;
  } else {
    if (framesSinceLastBeat <= beatHoldFrames) {
      framesSinceLastBeat++;
    } else {
      beatCutoff *= beatDecayRate;
      beatCutoff = Math.max(beatCutoff, beatThreshold);
    }
  }
}

function drawBeatCircles(distortBig, distortMid, distortSmall) {
  // top circle
  push();
  fill(colors[0]);
  ellipse(0, 0, bigMin + distortBig);
  noFill();
  stroke(colors[0]);
  ellipse(0, 0, bigMin + distortBig + 50);
  strokeWeight(2);
  ellipse(0, 0, bigMin + distortBig + 70);
  pop();

  // middle circle
  fill(colors[1]);
  ellipse(3 * width / 4, height / 2, midMin + distortMid);

  // bottom circle  
  push();
  noFill();
  stroke(colors[2]);
  ellipse(width / 4, 7 * height / 8, midMin + distortMid);
  strokeWeight(8);
  ellipse(width / 4, 7 * height / 8, midMin + distortMid + 40);
  pop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(0);
}