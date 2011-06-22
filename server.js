#!/usr/bin/env node
var express = require("express");
var args = require("argsparser").parse();
var app = express.createServer();
var path = require("path");
var fs = require("fs");
var stylus = require("stylus");
var jade = require("jade");
var coffeeScript = require("coffee-script");
var walk = require("walk");

var cwd = process.cwd();

var extend = function(defaults, options) {
  for (var key in defaults) {
    if (options[key]) defaults[key] = options[key];
  }
};

var build = "debug";
var config = require(__dirname+"/config");
if (path.existsSync(cwd+"/config.js")) {
  customConfig = require(cwd+"/config");
  extend(config, customConfig);
}

var port = 3000;

var options = { 
  debug: false,
  phonegap: false,
  config: config[build],
  build: build,
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
  //proc.spawn("cp", [__dirname+"/config.js", destination]);
} else if (args["--generate"]) {
  var b = args["--generate"];
  if (typeof b === "string")
    build = b.toLowerCase();
  options.config = config[build];
  options.build = build;
  options.debug = (build != "release");

  var findFiles = function(dir, search, cb) {
    var files = [];
    var walker = walk.walkSync(dir);

    walker.on("file", function(root, fileStats, next) {
      if (fileStats.name.match(search)) {
        files.push(root+"/"+fileStats.name);
      }
      next();
    });
    walker.on("end", function() {
      cb(files);
    });
  };

  var generateStylus = function() {
    var compileFile = function(file) {
      fs.readFile(file, 'utf8', function(err, str) {
        stylus(str).set('filename', file).set('compress', true).render(function(err, css) {
          var cssFile = file.replace(".styl", ".css");
          fs.writeFile(cssFile, css, function(err) {
            console.log("Created: "+cssFile);
          });
        });
      });
    };
    findFiles(cwd, /\.styl$/, function(files) {
      files.forEach(compileFile);
    });
  };


  var generateCoffee = function() { 
    var compileFile = function(file) {
      fs.readFile(file, 'utf8', function(err, str) {
        var js = coffeeScript.compile(str);
        var jsFile = file.replace(".coffee", ".js");
        fs.writeFile(jsFile, js, function(err) {
          console.log("Created: "+jsFile);
        });
      });
    };
    findFiles(cwd, /\.coffee$/, function(files) {
      files.forEach(compileFile); 
    });

  };

  var generateIndex = function() {
    options.phonegap = true;
    var file = cwd+"/templates/index.jade";
    jade.renderFile(file, { locals: options }, function(err, html) {
      if (err)
        throw err;
      fs.writeFile(cwd+"/index.html", html, function(err) {
        console.log("Created: index.html");
      });
    });
  };

  generateStylus();
  generateCoffee();
  generateIndex();

    
} else {
  options.config = config.web;
  options.build = "web";
  app.configure(function() {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(app.router);

    app.set("views", cwd+"/templates");
    app.set("view engine", config.settings.templateEngine);
    app.set("view options", { layout: false });

    var stylusCompile = function(str, path) {
      return stylus(str).set('filename', path).set('compress', true);
    };
    var stylus = require("stylus");
    app.use(stylus.middleware({
      src: cwd,
      dest: cwd,
      compile: stylusCompile
    }));

    app.use(express.compiler({ src: cwd, dest: cwd, enable: ['coffeescript']}));

    app.use("/ui", express.static(cwd+"/ui"));
    app.use("/app", express.static(cwd+"/app"));
    app.use(express.static(cwd));

    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  });

  app.get("/", function(req, res) { 
    res.render("index", { locals: options });
  });
  app.listen(port, "0.0.0.0");
  console.log("Server started on port " + port);
}



