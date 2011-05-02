var express = require("express");
var args = require("argsparser").parse();
var app = express.createServer();
var path = require("path");
var fs = require("fs");

var cwd = process.cwd();

var build = "debug";
var config = null;
if (path.existsSync(cwd+"/config.js"))
    config = require(cwd+"/config");
else
    config = require(__dirname+"/config");

var port = 3000;
if (args["--build"]) {
	var b = args["--build"];
	if (typeof b === "string")
		build = b;
    port = 3003;
}

if (args["--startapp"]) {
    var source = __dirname+"/structure";
    var destination = cwd+"/";
    require("child_process").spawn("cp", ['-r', source, destination]);
} else {
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

        if (config.settings.useStylus) {
            var stylus = require("stylus");
            app.use("/ui", stylus.middleware({
                src: cwd + '/ui',
                dest: cwd + '/ui',
                compile: stylusCompile
            }));
        }

        var compiledDir = cwd+"/compiled";
        app.use("/compiled", express.compiler({ src: cwd+"/app", dest: compiledDir, enable: ['less', 'coffeescript']}));
        app.use("/compiled", express.static(compiledDir));

        app.use("/ui", express.static(cwd+"/ui"));
        app.use("/app", express.static(cwd+"/app"));

        app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    });


    app.get("/", function(req, res) { 

        locals = { 
            debug: false,
            phonegap: true,
            config: config[build],
            weinre: function(server, port) {
                if (!port)
                    port = 8080;
                return '<script>(function(e){e.setAttribute("src","http://'+server+':'+port+'/target/target-script-min.js");document.getElementsByTagName("body")[0].appendChild(e);})(document.createElement("script"))</script>';
            }
        };

        res.render("index", { locals: locals }, function(err, html) {
            fs.writeFile("index.html", html, function(err) {
                console.log(err);
            });
        });
        locals.phonegap = false;
        res.render("index", { locals: locals });
    });

    app.get("/build", function(req, res) {
        fs.readFile("index.html", function(err, data) {
          res.send(data);
        });
    });

    app.listen(port, "0.0.0.0");

    if (args['--build']) {
        console.log("Building index.html");
        var http = require("http");
        http.get({ host: 'localhost', path: '/', port: port }, function(res) {
            app.close();
        });
        
    } else {
        console.log("Server started on port " + port);
    }
}


