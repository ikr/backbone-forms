/**
 * Builds the distribution files from /src
 * 
 * Includes code from Miller Medeiros, http://blog.millermedeiros.com/node-js-as-a-build-script/
 */

// CONFIG
var outputDir = __dirname + '/../distribution',
    srcDir = __dirname + '/../src',
    templateDir = __dirname + '/templates',
    eol = '\n',
    fileEncoding = 'utf-8';


// DEPENDENCIES
var fs = require('fs'),
    util = require('util'),
    _ = require('underscore'),
    uglifyJS = require('uglify-js');


// SETTINGS
// Use mustache template tags
_.templateSettings.interpolate = /\{\{(.+?)\}\}/g;


// TASKS
/**
 * Build the output by concatenating files and optionally wrapping them in a template
 *
 * @param {String[]} fileList         File paths, relative to current directory
 * @param {String} outputPath         Relative path to output file
 * @param {Object} [options]
 *
 * @param {String} [options.template] Template for adding headers/footers etc. Content will inserted in place of a {{body}} tag
 * @param {Object} [options.data]     Date to populate template tags (in {{tag}} format)
 */
function build(fileList, outputPath, options) {
  var out = fileList.map(function(filePath) {
    filePath = filePath;

    return fs.readFileSync(filePath, fileEncoding);
  });

  var content = out.join(eol);

  if (options && options.template) {
    var data = _.extend(options.data, {
      body: content
    });

    var templateString = fs.readFileSync(options.template, fileEncoding);

    content = _.template(templateString, data);
  }

  fs.writeFileSync(outputPath, content);

  console.log('READY: ' + outputPath);
}

/**
 * Minify files using UglifyJS
 * @param {String} srcPath          Relative path to source file
 * @param {outputPath} outputPath   Relative path to output file
 */
function uglify(srcPath, outputPath) {
  var parse = uglifyJS.parser.parse,
      uglify = uglifyJS.uglify;

  var output = parse(fs.readFileSync(srcPath, fileEncoding));

  output = uglify.ast_mangle(output);
  output = uglify.ast_squeeze(output);

  fs.writeFileSync(outputPath, uglify.gen_code(output), fileEncoding);
  
  console.log('READY: ' + outputPath);
}

/**
 * Copy a file from one directory to another. Used for moving CSS and templates
 * etc. into the distribution directory
 *
 * @param {String} srcPath
 * @param {String} outputPath
 */
function copy(srcPath, outputPath) {
  var srcFile = fs.createReadStream(srcPath),
      outputFile = fs.createWriteStream(outputPath);

  util.pump(srcFile, outputFile);

  console.log('READY: ' + outputPath);
}


// RUN
var fileList = [
  srcDir + '/form.js',
  srcDir + '/templates.js',
  srcDir + '/helpers.js',
  srcDir + '/validators.js',
  srcDir + '/field.js',
  srcDir + '/editors.js',
  srcDir + '/setup.js'
];

var templateData = {
  version: '0.9.0'
};

//Main file
build(fileList, outputDir + '/backbone-forms.js', {
  template: templateDir + '/backbone-forms.js',
  data: templateData
});
uglify(outputDir + '/backbone-forms.js', outputDir + '/backbone-forms.min.js');


//File for AMD (requireJS)
build(fileList, outputDir + '/backbone-forms.amd.js', {
  template: templateDir + '/backbone-forms.amd.js',
  data: templateData
});
uglify(outputDir + '/backbone-forms.amd.js', outputDir + '/backbone-forms.amd.min.js');


//Make folders if they don't exist
try {
  fs.mkdirSync(outputDir + '/templates');
} catch (e) {}

try {
  fs.mkdirSync(outputDir + '/editors');
} catch (e) {}

//Copy other files over to distribution
copy(srcDir + '/backbone-forms.css', outputDir + '/backbone-forms.css');
copy(srcDir + '/editors/jquery-ui.js', outputDir + '/editors/jquery-ui.js');
uglify(srcDir + '/editors/jquery-ui.js', outputDir + '/editors/jquery-ui.min.js');
copy(srcDir + '/templates/bootstrap.js', outputDir + '/templates/bootstrap.js');
copy(srcDir + '/templates/minimal.js', outputDir + '/templates/minimal.js');
