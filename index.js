const fs = require("fs");
const path = require("path");
const readline = require("readline");

var program;
var storage = {
  $: null,
  $if: "",
  $key: null,
  get $width() {
    return process.stdout.columns;
  },
  get $height() {
    return process.stdout.rows;
  },
  $keymode: null,
  $printfg: null,
  $printbg: null,
  $printstyle: null,
};
var full = -1;
var goLine = null;
const outputProgram = false;
const minifyProgram = false;
process.stdin.setEncoding("utf8");

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
    MOD: (a, b) => {
      return a % b;
    },
  },
};

async function main() {
  // Get file to read
  var filename = process.argv[2];
  var dir = __dirname.split("\\").join("/");
  if (!filename || filename === ".") {
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
    error("File not exist");
  }
  storage.$dir = filename.split("\\").join("/");

  // Read file
  const file = fs.readFileSync(filename).toString().split("\r\n").join("\n");
  program = formatFile(file);

  // Output / Minify file
  if (outputProgram || process.argv.includes("-o")) {
    fs.writeFileSync(
      __dirname + "/output.json",
      JSON.stringify(program, null, 2),
    );
    console.log("Output File Saved");
    return;
  }
  if (minifyProgram || process.argv.includes("-m")) {
    if (filename.split(".").slice(-2, -1)[0] !== "min") {
      minify(filename);
      console.log("Minified File");
      return;
    }
    error("Cannot minify a .min file");
  }

  // Run commands
  var formingArray = { name: null };
  Full: for (full = 0; full < program.length; full++) {
    if (!program[full]) {
      continue;
    }

    Line: for (var line = 0; line < program[full].lines.length; line++) {
      if (goLine) {
        line = goLine;
        goLine = null;
      }

      var args = program[full].lines[line].args;

      // Continue to add to array of open
      if (formingArray.name) {
        if (args[0].toUpperCase() === "CLOSE") {
          storage[formingArray.name] = formingArray.items;
          formingArray = { name: null };
          continue Line;
        }
        for (var i in args) {
          formingArray.items.push(parseValue(args[i]));
        }
        continue Line;
      }

      if (!args || !args[0]) {
        continue;
      }

      // Check if statement
      if (
        (storage.$if.includes("0") || storage.$if.includes("E")) &&
        ["IF"].includes(args[0].toUpperCase())
      ) {
        storage.$if += "?";
        continue Line;
      }
      if (
        args[0].startsWith("::") ||
        ((storage.$if.includes("0") || storage.$if.includes("E")) &&
          !["IF", "ELSEIF", "ELSE", "END"].includes(args[0].toUpperCase()))
      ) {
        if (args[0].toUpperCase() === "GOTO") {
          storage.$if = "";
        }
        continue Line;
      }
      if (args[0].toUpperCase() === "GOTO") {
        storage.$if = "";
      }

      var rawCmd = args[0];
      var cmd = rawCmd.toUpperCase();
      args = args.slice(1);

      // Math commands (1 / 2 argument)
      if (math.single[cmd]) {
        var a = parseValue(args[0]);

        if (typeof a !== "number") {
          error(`Cannot use '${cmd}' operator on non-number type`, a);
        }

        var c = math.single[cmd](a);
        saveStorage(c, args);
        continue Line;
      }

      if (math.double[cmd]) {
        var a = parseValue(args[0]);
        var b = parseValue(args[1]);

        if (typeof a !== "number") {
          error(`Cannot use '${cmd}' operator on non-number type`, a);
        }
        if (typeof b !== "number") {
          error(`Cannot use '${cmd}' operator on non-number type`, b);
        }

        var c = math.double[cmd](a, b);
        saveStorage(c, args);
        continue Line;
      }

      switch (cmd) {
        case "PRINT": // Print text to terminal
          {
            printLine(args);
          }
          break;

        case "GOTO": // Go to a line in file
          {
            if (args[0] == undefined) {
              error("Label not stated", rawCmd);
            }

            if (args[0].startsWith(":")) {
              if (isNaN(parseInt(args[0].slice(1)))) {
                error("Cannot move to non-number line", args[0]);
              }
              full = parseInt(args[0].slice(1)) - 2;
              continue Full;
            }

            var value = parseValue(args[0], true);
            if (value === Infinity) {
              value = args[0];
            }
            I: for (var i = full; i >= 0; i--) {
              if (!program[i]) {
                continue I;
              }
              J: for (
                var j = full === i ? line - 1 : program[i].lines.length - 1;
                j >= 0;
                j--
              ) {
                if (!program[i].lines[j]) {
                  continue J;
                }
                if (
                  program[i].lines[j].args[0].toUpperCase() === "LABEL" &&
                  program[i].lines[j].args[1] == value
                ) {
                  full = i - 1;
                  goLine = j;
                  continue Full;
                }
              }
            }

            I: for (var i = full; i < program.length; i++) {
              if (!program[i]) {
                continue I;
              }
              J: for (var j = 0; j < program[i].lines.length; j++) {
                if (!program[i].lines[j]) {
                  continue J;
                }
                if (
                  program[i].lines[j].args[0].toUpperCase() === "LABEL" &&
                  program[i].lines[j].args[1] === value
                ) {
                  full = i - 1;
                  goLine = j;
                  continue Full;
                }
              }
            }

            if (args[0] && args[0].startsWith("$")) {
              if (typeof value === "string") {
                value = `"${value}"`;
              }
              error("Unknown label", `${args[0]} (${value})`);
            }
            error("Unknown label", `${args[0]}`);
          }
          break;

        case "SET": // Set variable
          {
            if (!args[0]) {
              error("No variable stated");
            }
            storage[args[0]] = parseValue(args[1]);
          }
          break;

        case "IF": // If statement
          {
            storage.$if += solveIf(
              parseValue(args[0]),
              parseValue(args[2]),
              args[1],
            )
              ? "1"
              : "0";
          }
          break;

        case "ELSEIF": // If statement if previous not true
          {
            if (storage.$if.endsWith("0")) {
              storage.$if =
                storage.$if.slice(0, -1) +
                (solveIf(parseValue(args[0]), parseValue(args[2]), args[1])
                  ? "1"
                  : "0");
            } else {
              if (!storage.$if.endsWith("E")) {
                storage.$if += "E";
              }
            }
          }
          break;

        case "ELSE": // Negate if condition
          {
            if (storage.$if.endsWith("E")) {
              storage.$if = storage.$if.slice(0, -1);
            }
            storage.$if =
              storage.$if.slice(0, -1) +
              (storage.$if.slice(-1) === "1" ? "0" : "1");
          }
          break;

        case "END": // Close if statement
          {
            if (storage.$if.length <= 0) {
              error("Cannot use 'END' without IF statement", rawCmd);
            }
            storage.$if = storage.$if.slice(0, -1);
          }
          break;

        case "ARRAY": // Start an array
          {
            formingArray = { name: args[0], items: [] };

            I: for (var i = 1; i < args.length; i++) {
              if (args[i].toUpperCase() === "CLOSE") {
                storage[formingArray.name] = formingArray.items;
                formingArray = { name: null };
                break I;
              }

              formingArray.items.push(parseValue(args[i]));
            }
          }
          break;

        case "RAND": // Get random 0 or 1
          {
            saveStorage(Math.random() >= 0.5, args);
          }
          break;

        case "LEN": // Get length of string / Array
          {
            saveStorage(parseValue(args[0]).length, args);
          }
          break;

        case "EXIT": // Terminate program
          {
            process.exit();
          }
          break;

        case "GIVE": // Append / Push value to array
          {
            if (!args[0]) {
              error("No array stated", args[0]);
            }
            var array = parseValue(args[0]);
            if (!(array instanceof Array)) {
              error("Variable is not array", args[0]);
            }
            array.push(parseValue(args[1]));
            storage[args[0]] = array;
          }
          break;

        case "CON": // Concatenate strings
          {
            var a = parseValue(args[0]);
            var b = parseValue(args[1]);
            if (typeof a === "number") {
              a = a.toString();
            }
            if (typeof b === "number") {
              b = b.toString();
            }
            if (typeof a !== "string") {
              error("Cannot concatenate non-string values", a);
            }
            if (typeof b !== "string") {
              error("Cannot concatenate non-string values", b);
            }
            saveStorage(a + b, args);
          }
          break;

        case "INPUT": // Get user input from terminal
          {
            saveStorage(
              await input(args[0] === undefined ? "" : parseValue(args[0])),
              args,
            );
          }
          break;

        case "READ": // Read file
          {
            var filename = parseValue(args[0]);
            if (!filename) {
              error("No file stated", args[0]);
            }
            if (filename[1] !== ":") {
              if (filename.startsWith("./")) {
                filename = filename.slice(1);
              } else if (!filename.startsWith("/")) {
                filename = "/" + filename;
              }
              filename =
                storage.$dir.split("/").slice(0, -1).join("/") + filename;
            }

            if (!fs.existsSync(filename)) {
              error("File not exist", args[0]);
            }

            saveStorage(
              fs.readFileSync(filename).toString().split("\r\n").join("\n"),
              args,
            );
          }
          break;

        case "WRITE": // Write file
          {
            var filename = parseValue(args[0]);
            if (!filename) {
              error("No file stated", args[0]);
            }
            if (filename[1] !== ":") {
              if (filename.startsWith("./")) {
                filename = filename.slice(1);
              } else if (!filename.startsWith("/")) {
                filename = "/" + filename;
              }
              filename =
                storage.$dir.split("/").slice(0, -1).join("/") + filename;
            }

            var value = parseValue(args[1]);
            if (!value && value !== 0) {
              value = "";
            }
            fs.writeFileSync(filename, value);
          }
          break;

        case "CLEAR": // Clear terminal
          {
            console.log("\n".repeat(Math.max(0, process.stdout.rows - 1)));
            readline.cursorTo(process.stdout, 0, 0);
            readline.clearScreenDown(process.stdout);
          }
          break;

        case "HALT": // Sleep for time in milliseconds
          {
            if (args[0]) {
              var value = parseValue(args[0]);
              if (typeof value !== "number") {
                error("Cannot halt program for non-number time", args[1]);
              }
              await new Promise(resolve => {
                setTimeout(resolve, value);
              });
            } else {
              process.stdin.resume();
            }
          }
          break;

        case "KEYMODE":
          {
            var value = parseValue(args[0]);
            if (typeof value !== "number" || value < 0 || value > 1) {
              error("Unknown key mode", args[0]);
            }
            storage.$keymode = value;

            switch (storage.$keymode) {
              case 1:
                {
                  process.stdin.setRawMode(true);
                  process.stdin.on("data", function (key) {
                    if (storage.$keymode !== 1) {
                      return;
                    }
                    if (key === "\u0003") {
                      process.exit();
                    }
                    var replace = {
                      "\u{1B}[A": "Up",
                      "\u{1B}[B": "Down",
                      "\u{1B}[C": "Right",
                      "\u{1B}[D": "Left",
                      "\u{0D}": "Enter",
                      "\u{08}": "BackSpace",
                    };

                    if (replace[key]) {
                      key = replace[key];
                    }
                    if (outputProgram) {
                      fs.writeFileSync(
                        __dirname + "/key.txt",
                        key.codePointAt(undefined).toString(16),
                      );
                    }
                    storage.$key = key;
                  });
                }
                break;
              default: {
                process.stdin.setRawMode(false);
              }
            }
          }
          break;

        case "LABEL": // Used at GOTO command
          break;
        default: {
          error("Unknown command", rawCmd);
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
    console.error(`\n! ERROR\n    ${str}\n    Unknown\n`);
  } else if (full === -1) {
    console.error(`\n! ERROR\n    ${str}\n`);
  } else {
    var fullLine = program[full].full;
    while (fullLine.startsWith(" ")) {
      fullLine = fullLine.slice(1);
    }
    if (fullLine.length > 70) {
      fullLine = fullLine.slice(0, 70) + "...";
    }
    if (!data) {
      console.error(
        `\n! ERROR\n    ${str}\n    At Line ${full + 1}\n        ${fullLine}\n`,
      );
    } else {
      console.error(
        `\n! ERROR\n    ${str}\n    At Line ${
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
    var rl = require("readline").createInterface(process.stdin, process.stdout);
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
      program.push({ full: current });
      current = [];
      continue;
    }
    current += file[i];
  }
  program.push({ full: current });

  for (var i in program) {
    if (!program[i].full[0]) {
      program[i] = null;
      continue;
    }

    program[i].lines = [];

    var current = "";
    var inQuote = false;
    for (var j = 0; j < program[i].full.length; j++) {
      if (program[i].full[j] === '"') {
        inQuote = !inQuote;
      } else if (
        (program[i].full[j] === ";" ||
          program[i].full.slice(j, j + 2) === "::") &&
        !inQuote
      ) {
        while (current.startsWith(" ")) {
          current = current.slice(1);
        }
        if (current) {
          program[i].lines.push({ line: current });
        }
        current = program[i].full.slice(j, j + 2) === "::" ? ":" : "";
        continue;
      }
      current += program[i].full[j];
    }
    while (current.startsWith(" ")) {
      current = current.slice(1);
    }
    if (current) {
      program[i].lines.push({ line: current });
    }

    for (var j in program[i].lines) {
      var line = program[i].lines[j].line;
      program[i].lines[j].args = [];

      var current = "";
      var inQuote = false;
      for (var k = 0; k < line.length; k++) {
        if (line[k] === '"') {
          inQuote = !inQuote;
        }
        if (
          (line[k] === " " ||
            line.slice(k + 1, k + 3) === ">>" ||
            line.slice(k - 1, k + 1) === ">>") &&
          !inQuote
        ) {
          if (line.slice(k + 1, k + 3) === ">>" && line[k] !== " ") {
            current += line[k];
          }
          if (line.slice(k - 1, k + 1) === ">>") {
            current += ">";
          }
          while (current.startsWith(" ")) {
            current = current.slice(1);
          }
          if (current) {
            if (current.startsWith("::")) {
              program[i].lines[j].args.push("::");
              if (current.slice(2)) {
                program[i].lines[j].args.push(current.slice(2));
              }
            } else {
              program[i].lines[j].args.push(current);
            }
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
        if (current.startsWith("::")) {
          program[i].lines[j].args.push("::");
          if (current.slice(2)) {
            program[i].lines[j].args.push(current.slice(2));
          }
        } else {
          program[i].lines[j].args.push(current);
        }
      }
    }
  }

  return program;
}

// Parse value into data types
function parseValue(raw, allowPlain) {
  if (raw == undefined) {
    return null;
  }

  if (raw === "$") {
    return storage;
  }

  if (raw.startsWith("$")) {
    var name = raw.slice(1).split(":")[0];
    var value;
    if (name[0] === "$" && !isNaN(parseInt(name.slice(1)))) {
      value = process.argv[parseInt(name.slice(1)) + 3];
      if (value === undefined) {
        value = null;
      }
    } else {
      if (!Object.keys(storage).includes(name)) {
        error("Unknown variable", raw);
      }
      value = storage[name];
    }
    if (raw.includes(":")) {
      var index = raw.split(":")[1];

      // Get multi index
      if (index.includes("~")) {
        var start = index.split("~")[0];
        var end = index.split("~")[1];

        if (!start && !end) {
          error("Cannot get null index", raw);
        }
        if (start && end) {
          start = parseValue(start);
          end = parseValue(end);
          if (
            typeof start !== "number" ||
            start % 1 ||
            typeof end !== "number" ||
            end % 1
          ) {
            error("Cannot use non-integer type in multi index", raw);
          }
          return value.slice(start, end);
        }

        if (start) {
          start = parseValue(start);
          if (typeof start !== "number" || start % 1) {
            error("Cannot use non-integer type in multi index", raw);
          }
          return value.slice(start);
        }

        if (end) {
          end = parseValue(end);
          if (typeof end !== "number" || end % 1) {
            error("Cannot use non-integer type in multi index", raw);
          }
          return value.slice(0, end);
        }
      }

      if (value == null) {
        error("Cannot get index of non-string or non-array", raw);
      }
      var index = parseValue(raw.split(":")[1]);
      if (typeof index !== "number" || index % 1) {
        error("Cannot use non-integer type in multi index", raw);
      }

      if (index < 0) {
        index += value.length;
      }
      var value = value[index];
      if (value === undefined) {
        return null;
      }
      return value;
    }
    return value;
  }

  if (raw.startsWith('"')) {
    if (!raw.endsWith('"')) {
      error("Unclosed string", raw);
    }
    var str = raw.slice(1, -1);
    var replace = { "~n": "\n", "~x1b": "\x1b", "~~": "~" };
    for (var i in replace) {
      str = str.split(i).join(replace[i]);
    }
    return str;
  }

  if (raw.toUpperCase() === "TRU") {
    return true;
  }
  if (raw.toUpperCase() === "FLS") {
    return false;
  }
  if (raw.toUpperCase() === "NUL") {
    return null;
  }

  if (allowPlain) {
    return Infinity;
  }

  if (
    !isNaN(parseFloat(raw)) &&
    /^[\+\-]?\d*\.?\d+(?:[Ee][\+\-]?\d+)?$/.test(raw)
  ) {
    if (parseFloat(raw) % 1) {
      return parseFloat(raw);
    }

    return parseInt(raw);
  }
  error("Unknown value type", raw);
}

// Parse color as terminal code
function parseColor(string, isBg) {
  if (!string) {
    return "";
  }
  if (string.startsWith("#")) {
    string = string.slice(1);
  }
  if (string.length === 3) {
    return `\x1b[${isBg ? 48 : 38};2;${parseInt(
      string[0].repeat(2),
      16,
    )};${parseInt(string[1].repeat(2), 16)};${parseInt(
      string[2].repeat(2),
      16,
    )}m`;
  }
  return `\x1b[${isBg ? 48 : 38};2;${parseInt(
    string.slice(0, 2),
    16,
  )};${parseInt(string.slice(2, 4), 16)};${parseInt(string.slice(4, 6), 16)}m`;
}

// Parse style information as terminal code
function parseStyle(string) {
  if (!string) {
    return "";
  }
  var output = "";
  for (var i in string) {
    var digit = { B: 1, I: 3, U: 4 }[storage.$printstyle[i]];
    if (digit) {
      output += `\x1b[${digit}m`;
    }
  }
  return output;
}

// Print arguments to console
function printLine(args) {
  if (args.length >= 1) {
    var value =
      args.length === 1
        ? printValue(args[0])
        : args.map(i => printValue(i)).join("");

    console.log(
      parseColor(storage.$printfg) +
        parseColor(storage.$printbg, true) +
        parseStyle(storage.$printstyle) +
        value +
        "\x1b[0m",
    );
  } else {
    console.log();
  }
}

// Return printable value
function printValue(value, iteration) {
  if (!iteration) {
    value = parseValue(value);
  }

  if (value instanceof Array) {
    value = value
      .map(
        i =>
          "  ".repeat((iteration || 0) + 1) +
          printValue(i, (iteration || 0) + 1),
      )
      .join("\n");

    return (
      "\x1b[38;2;80;80;80m[\x1b[0m\n" +
      value +
      "\n" +
      "  ".repeat(iteration || 0) +
      "\x1b[38;2;80;80;80m]\x1b[0m"
    );
  }

  if (value === null) {
    return "\x1b[1mNUL\x1b[0m";
  }
  if (value === true) {
    return "\x1b[1mTRU\x1b[0m";
  }
  if (value === false) {
    return "\x1b[1mFLS\x1b[0m";
  }
  if (typeof value === "number") {
    return `\x1b[38;2;255;200;80m${value}\x1b[0m`;
  }

  if (iteration && typeof value === "string") {
    var replace = { "\n": "~n", "\x1b": "~x1b", "~": "~~" };
    for (var i in replace) {
      value = value.split(i).join(replace[i]);
    }
  }

  return value;
}

// Solve if statement
function solveIf(a, b, o) {
  var c = false;
  switch (o && o.toUpperCase()) {
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
    case "&":
      c = a && b;
      break;
    case "|":
      c = a || b;
      break;
    default:
      error("Unknown conditional operator", o);
  }
  return c;
}

// Save variable to storage
function saveStorage(value, args) {
  if (args.slice(-1)[0] === ">>") {
    error("No output variable stated");
  }

  if (args.slice(-2)[0] !== ">>") {
    storage.$ = value;
    return;
  }

  if (!args.slice(-1)[0]) {
    error("No output variable stated");
  }
  storage[args.slice(-1)[0]] = value;
}

// Create .min.tloc file
function minify(filename) {
  var minified = [];

  // Rename variables and labels
  var renameVar = {};
  var renameLabel = {};
  I: for (var i = 0; i < program.length; i++) {
    if (!program[i]) {
      continue I;
    }
    J: for (var j = 0; j < program[i].lines.length; j++) {
      if (
        !program[i].lines[j] ||
        program[i].lines[j].args[0].startsWith("::")
      ) {
        continue J;
      }

      var args = [];
      K: for (var k = 0; k < program[i].lines[j].args.length; k++) {
        var arg = program[i].lines[j].args[k];
        if (
          (k + 1 >= program[i].lines[j].args.length &&
            program[i].lines[j].args[k - 1] === ">>") ||
          (k === 1 && program[i].lines[j].args[0].toUpperCase() === "SET") ||
          (k === 1 && program[i].lines[j].args[0].toUpperCase() === "ARRAY")
        ) {
          if (!arg.startsWith("$")) {
            if (!renameVar[arg]) {
              renameVar[arg] = Object.keys(renameVar).length.toString(36);
            }
            arg = renameVar[arg];
          }
        } else if (arg.startsWith("$") && !arg.startsWith("$$")) {
          if (arg.includes(":")) {
            var value = arg.split(":")[0].slice(1);

            if (!renameVar[value]) {
              renameVar[value] = Object.keys(renameVar).length.toString(36);
            }

            var index = arg.split(":")[1];
            if (index.includes("~")) {
              index = index.split("~");
              if (index[0]) {
                if (index[0].startsWith("$") && !index[0].startsWith("$$")) {
                  if (!renameVar[index[0].slice(1)]) {
                    renameVar[index[0].slice(1)] =
                      Object.keys(renameVar).length.toString(36);
                  }
                  index[0] = "$" + renameVar[index[0].slice(1)];
                }
              }
              if (index[1]) {
                if (index[1].startsWith("$") && !index[1].startsWith("$$")) {
                  if (!renameVar[index[1].slice(1)]) {
                    renameVar[index[1].slice(1)] =
                      Object.keys(renameVar).length.toString(36);
                  }
                  index[1] = "$" + renameVar[index[1].slice(1)];
                }
              }

              arg = "$" + renameVar[value] + ":" + index[0] + "~" + index[1];
            } else {
              if (index.startsWith("$") && !index.startsWith("$$")) {
                if (!renameVar[index.slice(1)]) {
                  renameVar[index.slice(1)] =
                    Object.keys(renameVar).length.toString(36);
                }
                index = "$" + renameVar[index.slice(1)];
              }

              arg = "$" + renameVar[value] + ":" + index;
            }
          } else {
            if (!renameVar[arg.slice(1)]) {
              renameVar[arg.slice(1)] =
                Object.keys(renameVar).length.toString(36);
            }
            arg = "$" + renameVar[arg.slice(1)];
          }
        } else if (
          k === 1 &&
          program[i].lines[j].args[0].toUpperCase() === "LABEL"
        ) {
          if (!renameLabel[arg]) {
            renameLabel[arg] = Object.keys(renameLabel).length.toString(36);
          }
          arg = renameLabel[arg];
        } else if (
          k === 1 &&
          program[i].lines[j].args[0].toUpperCase() === "GOTO"
        ) {
          if (!renameLabel[arg]) {
            renameLabel[arg] = Object.keys(renameLabel).length.toString(36);
          }
          arg = renameLabel[arg];
        }
        args.push(arg);
      }
      minified.push(args);
    }
  }

  // Remove linebreaks and redundent characters
  var output = [];
  for (var i = 0; i < minified.length; i++) {
    output.push(minified[i].join(" "));
  }
  output = output.join(";").split(" >> ").join(">>");

  fs.writeFileSync(
    filename.split(".").slice(0, -1).join(".") +
      ".min." +
      filename.split(".").slice(-1)[0],
    output,
  );
}
