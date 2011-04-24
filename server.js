var express = require("express");
var args = require("argsparser").parse();
var app = express.createServer();
var path = require("path");

var cwd = process.cwd();

var config = null;
if (path.existsSync(cwd+"/config"))
    config = require(cwd+"/config");
else
    config = require(__dirname+"/config");


if (args["--build"]) {
    var fs = require("fs");
    var jade = require("jade");
    locals = { 
        debug: false,
        phonegap: true
    };

    jade.renderFile("templates/index.jade", { locals: locals }, function(err, html) {
        fs.writeFile("index.html", html, function(err) {
            console.log(err);
        });
    });

} else if (args["--startapp"]) {
    var source = __dirname+"/structure";
    var destination = cwd+"/";
    require("child_process").spawn("cp", ['-r', source, destination]);
} else {
    app.configure(function() {
        app.use(express.methodOverride());
        app.use(express.bodyParser());
        app.use(app.router);

        app.set("views", cwd+"/templates");
        app.set("view engine", config.templateEngine);
        app.set("view options", { layout: false, open: "{{", close: "}}" });


        var stylusCompile = function(str, path) {
            return stylus(str).set('filename', path).set('compress', true);
        };

        if (config.useStylus) {
            var stylus = require("stylus");
            app.use(stylus.middleware({
                src: __dirname + '/ui',
                dest: __dirname + '/ui',
                compile: stylusCompile
            }));
        }

        var compiledDir = cwd+"/compiled";
        app.use("/compiled", express.compiler({ src: cwd+"/app", dest: compiledDir, enable: ['less', 'coffeescript']}));
        app.use("/compiled", express.static(compiledDir));

        app.use("/ui", express.static(cwd+"/ui"));

        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });


    app.get("/", function(req, res) { 
        res.local("debug", false);
        res.local("phonegap", false);

        res.render("index");
    });

    app.get("/build", function(req, res) {
        fs.readFile("index.html", function(err, data) {
          res.send(data);
        });
    });

    console.log("Server started on port 3000");
    app.listen(3000, "0.0.0.0");
}


