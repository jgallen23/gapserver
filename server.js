var express = require("express");
var args = require("argsparser").parse();
var app = express.createServer();
var path = require("path");
var fs = require("fs");
var stylus = require("stylus");
var jade = require("jade");

var cwd = process.cwd();

var build = "debug";
var config = null;
if (path.existsSync(cwd+"/config.js"))
  config = require(cwd+"/config");
else
  config = require(__dirname+"/config");

var port = 3000;

var options = { 
  debug: true,
  phonegap: false,
  config: config[build],
  weinre: function(server, port) {
    if (!port)
      port = 8080;
    return '<script>(function(e){e.setAttribute("src","http://'+server+':'+port+'/target/target-script-min.js");document.getElementsByTagName("body")[0].appendChild(e);})(document.createElement("script"))</script>';
  }
};

if (args["--startapp"]) {
  var source = __dirname+"/structure/";
  var destination = cwd+"/";
  var proc = require("child_process");
  proc.spawn("cp", ['-r', source, destination]);
  proc.spawn("cp", [__dirname+"/config.js", destination]);
} else if (args["--generate"]) {
  var b = args["--generate"];
  if (typeof b === "string")
    build = b.toLowerCase();
  options.config = config[build];
  options.debug = (build != "release");

  //generate stylus files
  var generateStylus = function() {
    var compileFile = function(file) {
      console.log(file);
      fs.readFile(file, 'utf8', function(err, str) {
        stylus(str).set('filename', file).set('compress', true).render(function(err, css) {
          var cssFile = file.replace(".styl", ".css");
          fs.writeFile(cssFile, css, function(err) {
            console.log("Created: "+cssFile);
          });
        });
      });
    };
    var dir = cwd+"/ui/stylesheets";
    fs.readdir(dir, function(err, files) {
      files.filter(function(path){
        return path.match(/\.styl$/);
      }).map(function(path){
        return dir + '/' + path;
      }).forEach(compileFile);
    });
  };


  var generateIndex = function() {
    options.phonegap = true;
    var file = cwd+"/templates/index.jade";
    jade.renderFile(file, { locals: options }, function(err, html) {
      if (err)
        throw err
      fs.writeFile(cwd+"/index.html", html, function(err) {
        console.log("Created: index.html");
      });
    });
  };

  generateStylus();
  generateIndex();

    
} else {
  options.config = config.web;
  app.configure(function() {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);

    app.set("views", cwd+"/templates");
    app.set("view engine", config.settings.templateEngine);
    app.set("view options", { layout: false, open: "{{", close: "}}" });

    var stylusCompile = function(str, path) {
      return stylus(str).set('filename', path).set('compress', true);
    };
    var stylus = require("stylus");
    app.use("/ui", stylus.middleware({
      src: cwd + '/ui',
      dest: cwd + '/ui',
      compile: stylusCompile
    }));

    app.use("/app", express.compiler({ src: cwd+"/app", dest: cwd+"/app", enable: ['coffeescript']}));

    app.use("/ui", express.static(cwd+"/ui"));
    app.use("/app", express.static(cwd+"/app"));

    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.get("/", function(req, res) { 
    res.render("index", { locals: options });
  });
  app.listen(port, "0.0.0.0");
  console.log("Server started on port " + port);
}



