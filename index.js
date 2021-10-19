const fs = require("fs");
const path = require("path");

var program;
var storage = {$if: false, $: null};
var full = -1;
var goLine = null;

const math = {
  single: {
    FLR: a => {
      return Math.floor(a);
    },
    RND: a => {
      return Math.round(a);
    },
    CEL: a => {
      return Math.ceil(a);
    },
  },

  double: {
    ADD: (a, b) => {
      return a + b;
    },
    SUB: (a, b) => {
      return a - b;
    },
    MUL: (a, b) => {
      return a * b;
    },
    DIV: (a, b) => {
      return a / b;
    },
    POW: (a, b) => {
      return a ** b;
    },
    NRT: (a, b) => {
      if (!b) {
        b = 2;
      }
      return a ** (1 / b);
    },
    LOG: (a, b) => {
      if (!b) {
        b = 1;
      }
      return Math.log(a) / Math.log(b);
    },
  },
};

async function main() {
  // Get file to read
  var filename = process.argv[2];
  var dir = __dirname.split("\\").join("/");
  if (!filename) {
    filename = dir + "/index.tloc";
  } else if (filename[1] !== ":") {
    if (filename.startsWith("./")) {
      filename = filename.slice(1);
    } else if (!filename.startsWith("/")) {
      filename = "/" + filename;
    }
    filename = dir + filename;
  }

  if (!fs.existsSync(filename)) {
    error("File not Exist");
  }
  storage.$dir = filename.split("/").slice(0, -1).join("/");

  // Read file
  const file = fs
    .readFileSync(filename)
    .toString()
    .split("\r\n")
    .join("\n");
  program = formatFile(file);
  // fs.writeFileSync(
  //   __dirname + "/output.json",
  //   JSON.stringify(program, null, 2),
  // );

  var formingArray = {name: null};
  Full: for (full = 0; full < program.length; full++) {
    if (!program[full]) {
      continue;
    }

    Line: for (
      var line = 0;
      line < program[full].lines.length;
      line++
    ) {
      if (goLine) {
        line = goLine;
        goLine = null;
      }

      var args = program[full].lines[line].args;

      if (formingArray.name) {
        if (args[0].toUpperCase() === "CLOSE") {
          storage[formingArray.name] = formingArray.items;
          formingArray = {name: null};
          continue Line;
        }
        formingArray.items.push(parseValue(args.join(" ")));
        continue Line;
      }

      if (!args || !args[0]) {
        continue;
      }
      if (args[0] === "?") {
        if (!storage.$if) {
          continue Line;
        }
        args = args.slice(1);
      }

      var cmd = args[0].toUpperCase();
      args = args.slice(1);

      if (math.single[cmd]) {
        var a = parseValue(args[0]);

        if (typeof a !== "number") {
          error(
            `Cannot use '${cmd}' Operator on Non-Number type`,
            a,
          );
        }

        var c = math.single[cmd](a);
        saveStorage(c, args);
        continue Line;
      }

      if (math.double[cmd]) {
        var a = parseValue(args[0]);
        var b = parseValue(args[1]);

        if (typeof a !== "number") {
          error(
            `Cannot use '${cmd}' Operator on Non-Number type`,
            a,
          );
        }
        if (typeof b !== "number") {
          error(
            `Cannot use '${cmd}' Operator on Non-Number type`,
            b,
          );
        }

        var c = math.double[cmd](a, b);
        saveStorage(c, args);
        continue Line;
      }

      switch (cmd) {
        case "PRINT": // Print text to terminal
          {
            console.log(args.map(parseValue).join(""));
          }
          break;

        case "GOTO": // Go to a line in file
          {
            if (args[0].startsWith(":")) {
              if (isNaN(parseInt(args[0].slice(1)))) {
                error(
                  "Cannot Move to Non-Number line",
                  args[0],
                );
              }
              full = parseInt(args[0].slice(1)) - 2;
              continue Full;
            }

            var value = parseValue(args[0]);
            I: for (var i = full; i >= 0; i--) {
              if (!program[i]) {
                continue I;
              }
              J: for (
                var j = 0;
                j < program[i].lines.length;
                j++
              ) {
                if (!program[i].lines[j]) {
                  continue J;
                }
                if (
                  program[i].lines[
                    j
                  ].args[0].toUpperCase() === "LABEL"
                ) {
                  if (
                    program[i].lines[j].args[1] === value
                  ) {
                    full = i - 1;
                    goLine = j;
                    continue Full;
                  }
                }
              }
            }

            I: for (var i = full; i < program.length; i++) {
              if (!program[i]) {
                continue I;
              }
              J: for (
                var j = 0;
                j < program[i].lines.length;
                j++
              ) {
                if (!program[i].lines[j]) {
                  continue J;
                }
                if (
                  program[i].lines[
                    j
                  ].args[0].toUpperCase() === "LABEL"
                ) {
                  if (
                    program[i].lines[j].args[1] === value
                  ) {
                    full = i - 1;
                    goLine = j;
                    continue Full;
                  }
                }
              }
            }

            if (typeof value === "string") {
              value = `"${value}"`;
            }
            error("Unknown Label", `${args[0]} (${value})`);
          }
          break;

        case "SET": // Set variable
          {
            if (args[0]) {
              if (args[0].startsWith("$")) {
                error("Cannot Assign Constant Variable");
              }
              storage[args[0]] = parseValue(args[1]);
            }
          }
          break;

        case "IF": // If statement
          {
            var a = parseValue(args[0]);
            var b = parseValue(args[2]);
            var c = false;
            switch (args[1]) {
              case "<":
                c = a < b;
                break;
              case ">":
                c = a > b;
                break;
              case "<=":
                c = a <= b;
                break;
              case ">=":
                c = a >= b;
                break;
              case "=":
                c = a === b;
                break;
              case "!=":
                c = a !== b;
                break;
              default:
                error(
                  "Unknown Conditional Operator",
                  args[1],
                );
            }
            storage.$if = c;
          }
          break;

        case "ARRAY": // Start an array
          {
            formingArray = {name: args[0], items: []};

            I: for (var i = 1; i < args.length; i++) {
              if (args[i].toUpperCase() === "CLOSE") {
                storage[formingArray.name] =
                  formingArray.items;
                formingArray = {name: null};
                break I;
              }

              formingArray.items.push(parseValue(args[i]));
            }
          }
          break;

        case "RAND": // Get random 0 or 1
          {
            saveStorage(Math.round(Math.random()), args);
          }
          break;

        case "LEN": // Get length of string / Array
          {
            saveStorage(parseValue(args[0]).length, args);
          }
          break;

        case "END": // Terminate program
          {
            process.exit();
          }
          break;

        case "GIVE": // Append / Push value to array
          {
            if (!args[0]) {
              error("No Array Stated", args[0]);
            }
            var array = parseValue(args[0]);
            if (!(array instanceof Array)) {
              error("Variable is not Array", args[0]);
            }
            array.push(parseValue(args[1]));
            storage[args[0]] = array;
          }
          break;

        case "CON": // Concatenate strings
          {
            var a = parseValue(args[0]);
            var b = parseValue(args[1]);
            if (typeof a !== "string") {
              error(
                "Cannot Concatenate Non-String Values",
                a,
              );
            }
            if (typeof b !== "string") {
              error(
                "Cannot Concatenate Non-String Values",
                b,
              );
            }
            saveStorage(a + b, args);
          }
          break;

        case "INPUT": // Get user input from terminal
          {
            saveStorage(
              await input(
                args[0] === undefined
                  ? ""
                  : parseValue(args[0]),
              ),
              args,
            );
          }
          break;

        case "READ": // Read file
          {
            var filename = parseValue(args[0]);
            if (!filename) {
              error("No File Stated", args[0]);
            }
            if (filename[1] !== ":") {
              if (filename.startsWith("./")) {
                filename = filename.slice(1);
              } else if (!filename.startsWith("/")) {
                filename = "/" + filename;
              }
              filename = storage.$dir + filename;
            }
            if (!fs.existsSync(filename)) {
              error("File not Exist", args[0]);
            }

            saveStorage(
              fs
                .readFileSync(filename)
                .toString()
                .split("\r\n")
                .join("\n"),
              args,
            );
          }
          break;

        case "WRITE": // Write file
          {
            var filename = parseValue(args[0]);
            if (!filename) {
              error("No File Stated", args[0]);
            }
            if (filename[1] !== ":") {
              if (filename.startsWith("./")) {
                filename = filename.slice(1);
              } else if (!filename.startsWith("/")) {
                filename = "/" + filename;
              }
              filename = storage.$dir + filename;
            }

            var value = parseValue(args[1]);
            if (!value && value !== 0) {
              value = "";
            }
            fs.writeFileSync(filename, value);
          }
          break;

        case "ELSE": // Negate if condition
          {
            storage.$if = !storage.$if;
          }
          break;

        case "::": // Comment
        case "LABEL": // Used at GOTO command
          break;
        default: {
          error("Unknown Command", cmd);
        }
      }
    }
  }
  full = -1;
}
main();

// Throw error
function error(str, data) {
  if (!str) {
    str = "Unknown";
  }

  if (!full && full !== 0) {
    console.error(
      `\n! FATAL ERROR\n    ${str}\n    Unknown\n`,
    );
  } else if (full === -1) {
    console.error(`\n! FATAL ERROR\n    ${str}\n`);
  } else {
    var fullLine = program[full].full;
    while (fullLine.startsWith(" ")) {
      fullLine = fullLine.slice(1);
    }
    if (!data) {
      console.error(
        `\n! FATAL ERROR\n    ${str}\n    At Line ${
          full + 1
        }\n        ${fullLine}\n`,
      );
    } else {
      console.error(
        `\n! FATAL ERROR\n    ${str}\n    At Line ${
          full + 1
        }\n        ${fullLine}\n        >> ${data}\n`,
      );
    }
  }

  process.exit();
}

// Input text to console
function input(prompt) {
  return new Promise(resolve => {
    var rl = require("readline").createInterface(
      process.stdin,
      process.stdout,
    );
    rl.question(prompt, res => {
      resolve(res);
      rl.close();
    });
  });
}

// Format file
function formatFile(file) {
  var program = [];
  var current = [];
  for (var i in file) {
    if (file[i] === "\n") {
      program.push({full: current});
      current = [];
      continue;
    }
    current += file[i];
  }
  program.push({full: current});

  for (var i in program) {
    if (!program[i].full[0]) {
      program[i] = null;
      continue;
    }

    program[i].lines = [];

    var current = "";
    var inQuote = false;
    for (var j in program[i].full) {
      if (program[i].full[j] === '"') {
        inQuote = !inQuote;
      } else if (
        (program[i].full[j] === ";" ||
          program[i].full[j] === "?") &&
        !inQuote
      ) {
        while (current.startsWith(" ")) {
          current = current.slice(1);
        }
        if (current) {
          program[i].lines.push({line: current});
        }
        current = program[i].full[j] === "?" ? "?" : "";
        continue;
      }
      current += program[i].full[j];
    }
    while (current.startsWith(" ")) {
      current = current.slice(1);
    }
    if (current) {
      program[i].lines.push({line: current});
    }

    for (var j in program[i].lines) {
      var line = program[i].lines[j].line;
      program[i].lines[j].args = [];

      var current = "";
      var inQuote = false;
      for (var k in line) {
        if (line[k] === '"') {
          inQuote = !inQuote;
        } else if (line[k] === " " && !inQuote) {
          while (current.startsWith(" ")) {
            current = current.slice(1);
          }
          if (current) {
            program[i].lines[j].args.push(current);
          }
          current = "";
          continue;
        }
        current += line[k];
      }
      while (current.startsWith(" ")) {
        current = current.slice(1);
      }
      if (current) {
        program[i].lines[j].args.push(current);
      }
    }
  }

  return program;
}

// Parse value into data types
function parseValue(raw) {
  if (raw == undefined) {
    return null;
  }

  if (raw.startsWith("$")) {
    var name = raw.slice(1).split(":")[0];
    if (!Object.keys(storage).includes(name)) {
      error("Unknown Variable", raw);
    }
    if (raw.includes(":")) {
      return storage[name][parseValue(raw.split(":")[1])];
    }
    return storage[name];
  }

  if (raw.startsWith('"')) {
    if (!raw.endsWith('"')) {
      error("Unclosed String", raw);
    }
    var str = raw.slice(1, -1);
    var replace = {"\\n": "\n"};
    for (var i in replace) {
      str = str.split(i).join(replace[i]);
    }
    return str;
  }

  if (!isNaN(parseInt(raw))) {
    return parseInt(raw);
  }

  if (!isNaN(parseFloat(raw))) {
    return parseFloat(raw);
  }

  error("Unknown Value Type", raw);
}

// Save variable to storage
function saveStorage(value, args) {
  if (args.slice(-1)[0] === ">>") {
    error("No Output Variable Stated");
  }

  if (args.slice(-2)[0] !== ">>") {
    storage.$ = value;
    return;
  }

  if (!args.slice(-1)[0]) {
    error("No Output Variable Stated");
  }
  if (args.slice(-1)[0].startsWith("$")) {
    error("Cannot Assign Constant Variable");
  }
  storage[args.slice(-1)[0]] = value;
}
