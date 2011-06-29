var smoosh = require("smoosh");
var fs = require("fs");
var path = require("path");

var smoosher = function(configFile, env) {
  if (!configFile) configFile = "smoosh.json";

  if (!path.existsSync(configFile))
    return;
  env = env || process.env.NODE_ENV || "development";

  var sm = smoosh.config(configFile);
  var smooshConfig = sm.get(); 
  if (env == "production")
    sm.build();

  var formatRegEx = /\{([^}]+)\}/g;
  var format = function(s, args) {
    return s.replace(formatRegEx, function(_, match){ return args[match]; }); 
  }; 
  var formats = {
    'CSS': '<link rel="stylesheet" href="{file}"/>',
    'JAVASCRIPT': '<script src="{file}"></script>'
  };

  var execute = function(config, type) {
    var out = [];
    var files;
    if (env == "development") {
      files = smooshConfig[type].UNPACKAGED[config];
    } else {
      files = [smooshConfig[type].COMPRESSED[config]];
    }
    for (var i = 0, c = files.length; i < c; i++) {
      var item = files[i];
      out.push(format(formats[type], { file: item }));
    }
    return out.join('');
  };
  return {
    css: function(config) { return execute(config, "CSS"); },
    js: function(config) { return execute(config, "JAVASCRIPT"); }
  };
};

module.exports = smoosher;
