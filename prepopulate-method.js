var path = require("path");
var fs = require("fs");
var corpus = String(fs.readFileSync(path.join(__dirname, "./corpus")));
console.log("\nInitializing spellchecker!\n");

/*
  Returns an object with each unique word in the input as a key,
  and the count of the number of occurances of that word as the value.
  (HINT: the code `text.toLowerCase().match(/[a-z]+/g)` will return an array
  of all lowercase words in the string.)
*/
function getWordCounts(text) {
  var wordsArray = text.toLowerCase().match(/[a-z]+/g);
  var resultObj = {};
  for(var i = 0; i < wordsArray.length; i++){
    if(resultObj.hasOwnProperty(wordsArray[i])){
      resultObj[wordsArray[i]]++;
    } else {
      resultObj[wordsArray[i]] = 1;
    }
  }
  return resultObj;
}

var COUNTS = getWordCounts(corpus);
var CORRECTIONS = {};

populateCorrections();

function populateCorrections () {
  var unit = 1;
  var start = process.hrtime()[unit];

  Object.keys(COUNTS).forEach(function (entry) {

    var editDistance1Results = editDistance1(entry);
    deepMerge(editDistance1Results, CORRECTIONS);

    Object.keys(editDistance1Results).forEach(function (word) { 
      var processed = editDistance2(word, Object.keys(editDistance1Results[word]));
      deepMerge(processed, CORRECTIONS);
    });

  })

  console.log("### Pre-Population completed -- Start: ", process.hrtime(),
              " End: ", process.hrtime(),
              " TOTAL: ", process.hrtime()[unit] - start);

  console.log("### CORRECTIONS Size: ", Object.keys(CORRECTIONS).length);

}

function deepMerge (src, dst) {
  for (i in src) {
    if (!dst[i]) {
      dst[i] = src[i]; 
    } else {
      if (typeof src[i] === "object") {
        deepMerge(src[i], dst[i])
      } else {
        dst[i] = src[i];
      }
    }
  }
}

function mergeCounts (src, dst) {
  for (i in src) {
    if (!dst[i]) {
      dst[i] = src[i]; 
    } else {
      dst[i] += src[i]; 
    }
  }
}

function editDistance1 (word) {
  var deletions = {};
  for (var i = 0; i < word.length; i++) {
    var entry = spliceSlice(word, i);
    // deletions[entry] ? deletions[entry] += 1 : deletions[entry] = 1;
    deletions[entry] = deletions[entry] ? deletions[entry] : {};
    deletions[entry][word] = true;
  }
  return deletions;
}

function editDistance2 (word, orig) {
  var deletions = {};
  for (var i = 0; i < word.length; i++) {
    var entry = spliceSlice(word, i);
    // deletions[entry] ? deletions[entry] += 1 : deletions[entry] = 1;
    deletions[entry] = deletions[entry] ? deletions[entry] : {};
    // deletions[entry][orig] = true;
    orig.forEach(function (val) {
      deletions[entry][val] = true;
      if (!val) console.log("val", val);
    });
  }
  return deletions;
}

function spliceSlice(str, index) {
  // We cannot pass negative indexes dirrectly to the 2nd slicing operation.
  if (index < 0) {
    index = str.length + index;
    if (index < 0) {
      index = 0;
    }
  }
  return str.slice(0, index) + str.slice(index + 1);
}

function correct (word, DEBUG) {
  var unit = 1;
  var start = process.hrtime()[unit];
  var end;
  var result = {};
  // var DEBUG = false;

  if (word in COUNTS) {
    if (DEBUG) console.log(word, " found in VALID list ", COUNTS[word]);
    result = { correct: true };

  } else if (word in CORRECTIONS) {
    if (DEBUG) console.log(word, " found in CORRECTIONS list ", CORRECTIONS[word]);
    if (DEBUG) console.log("Highest probability suggestion ", max(CORRECTIONS[word]));
    result = { correct: false, suggested: max(Object.keys(CORRECTIONS[word])), suggestions: Object.keys(CORRECTIONS[word]) };

  } else {
    if (DEBUG) console.log(word, " Not found.");
    result = { correct: false };
  }

  end = process.hrtime()[unit];

  if (DEBUG) console.log("Word: ", word,
              " Start Correction: ", start,
              " End Correction: ", end,
              " TOTAL: ", end - start);

  if (DEBUG || true) result.performance = end - start; 
  return result;
}

// Returns the value from the array with the highest chance of 
function max (array) {
  var max = "";
  var maxCount = 0;

  for (i = 0; i < array.length; i++) {
    var count = COUNTS[array[i]];

    if (count > maxCount) {
      maxCount = count;
      max = array[i];
    }
  }
  return max;
}

correct("test");
correct("absu");
correct("temptations");

// Start reading from stdin so we don't exit.
process.stdin.resume();
console.log("Input next word: ");
process.stdin.setEncoding('utf8');
// var util = require('util');

process.stdin.on('data', function (text) {
  console.log('received data:', text);//util.inspect(text));
  if (text === 'quit\n') {
    console.log('Bye Bye~');
    process.exit();
    
  } else {
    var word = text.replace(/\n/g,"")
    var result = correct(word, true);
    // console.log(result);

    if (result.correct) {
      console.log(word, " ? You're fine...");

    } else if (result.suggested) {
      console.log(word, "? Try one of these: ", result.suggestions.join(", "));
      console.log("But we recommend ", result.suggested);

    } else {
      console.log(word, " ? ... hmm ... never heard of that one");
    }

  }
});