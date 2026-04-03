const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadConfig(configPath, callback) {
  fs.readFile(configPath, 'utf8', function(err, data) {
    if (err) {
      callback(new Error('Failed to read config: ' + err.message));
      return;
    }
    try {
      var config = JSON.parse(data);
      callback(null, config);
    } catch (parseErr) {
      callback(new Error('Invalid JSON in config: ' + parseErr.message));
    }
  });
}

function processUsers(usersPath, outputPath, callback) {
  fs.readFile(usersPath, 'utf8', function(err, rawData) {
    if (err) {
      callback(new Error('Failed to read users file: ' + err.message));
      return;
    }
    try {
      var users = JSON.parse(rawData);
    } catch (parseErr) {
      callback(new Error('Invalid JSON in users file: ' + parseErr.message));
      return;
    }

    var processed = [];
    var pending = users.length;
    if (pending === 0) {
      callback(null, []);
      return;
    }

    users.forEach(function(user, index) {
      hashPassword(user.password, function(err, hashedPassword) {
        if (err) {
          callback(new Error('Failed to hash password for user ' + user.name + ': ' + err.message));
          return;
        }
        processed[index] = {
          id: user.id,
          name: user.name,
          email: user.email,
          password: hashedPassword,
          createdAt: new Date().toISOString()
        };
        pending--;
        if (pending === 0) {
          var output = JSON.stringify(processed, null, 2);
          fs.writeFile(outputPath, output, 'utf8', function(err) {
            if (err) {
              callback(new Error('Failed to write output: ' + err.message));
              return;
            }
            callback(null, processed);
          });
        }
      });
    });
  });
}

function hashPassword(password, callback) {
  crypto.randomBytes(16, function(err, salt) {
    if (err) {
      callback(err);
      return;
    }
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', function(err, derivedKey) {
      if (err) {
        callback(err);
        return;
      }
      var hash = salt.toString('hex') + ':' + derivedKey.toString('hex');
      callback(null, hash);
    });
  });
}

function migrateData(srcDir, destDir, callback) {
  fs.readdir(srcDir, function(err, files) {
    if (err) {
      callback(new Error('Failed to read source directory: ' + err.message));
      return;
    }
    var jsonFiles = files.filter(function(f) { return path.extname(f) === '.json'; });
    var migrated = 0;
    var errors = [];

    if (jsonFiles.length === 0) {
      callback(null, { migrated: 0, errors: [] });
      return;
    }

    jsonFiles.forEach(function(file) {
      var srcPath = path.join(srcDir, file);
      var destPath = path.join(destDir, file);

      fs.readFile(srcPath, 'utf8', function(err, content) {
        if (err) {
          errors.push({ file: file, error: err.message });
          migrated++;
          if (migrated === jsonFiles.length) {
            callback(null, { migrated: migrated - errors.length, errors: errors });
          }
          return;
        }
        fs.writeFile(destPath, content, 'utf8', function(err) {
          if (err) {
            errors.push({ file: file, error: err.message });
          }
          migrated++;
          if (migrated === jsonFiles.length) {
            callback(null, { migrated: migrated - errors.length, errors: errors });
          }
        });
      });
    });
  });
}

module.exports = { loadConfig, processUsers, hashPassword, migrateData };
