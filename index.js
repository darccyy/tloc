const fs = require("fs");
const path = require("path");

var data, lines, vars, labels;

async function main() {
  file = process.argv[2] || "index.tloc";
  lines = fs.readFileSync(path.join(__dirname, `${file}`)).toString().split(";");
  vars = {};
  labels = {};

  for (i = 3; i < process.argv.length; i++) {
    vars["$" + (i - 3)] = getValue(process.argv[i]);
  }

  I: for (i = 0; i < lines.length; i++) {
    lines[i] = lines[i].split("\r\n");
    temp = [];
    for (j = 0; j < lines[i].length; j++) {
      if (lines[i][j]) {
        temp.push(lines[i][j]);
      }
    }
    lines[i] = temp.join("");
    if (lines[i].split(" ").join("").startsWith("::")) {
      continue;
    }
    comps = lines[i].split(" ");
    cmd = comps[0];
    if (!cmd) {
      cmd = comps[1];
      comps = comps.slice(1, comps.length);
    }
    if (checkIf(lines[i])) {
      if (cmd) {
        cmd = cmd.toLowerCase();
        // console.log(vars);
        switch (cmd) {
          case "print": {
            if (comps[1]) {
              console.log(" >", getValue(comps[1]));
            }
          }; break;
          case "set": {
            if (comps[1]) {
              value = comps[2];
              vars[comps[1]] = getValue(value);
            }
          }; break;
          case "op": {
            if (comps[1] && comps[2]) {
              if (["not"].includes(comps[1]) || comps[3]) {
                value = runOp(comps[1], getValue(comps[2]), getValue(comps[3]));
                if (isNaN(value) && parseFloat(value) == value) {
                  value = null;
                }
                returnValue(lines[i], value);
              }
            }
          }; break;
          case "rand": {
            returnValue(lines[i], Math.random() >= 0.5);
          }; break;
          case "label": {
            labels[getValue(comps[1])] = i;
          }; break;
          case "go": {
            i = labels[getValue(comps[1])];
          }; break;
          case "terminate": {
            break I;
          }; break;
          case "halt": {
            if (comps[1]) {
              await sleep(getValue(comps[1]));
            }
          }; break;
          default: {
            console.log(`ERR: Unknown command '${cmd}'`);
          };
        }
      }
    }
  }
}

main();

function getValue(str) {
  if (!str) {
    return null;
  }
  vals = {"TRU": true, "FLS": false, "NUL": null};
  if (Object.keys(vals).includes(str)) {
    return vals[str];
  }
  if (str[0] == '"' && str[str.length - 1] == '"') {
    return str.substring(1, str.length - 1);
  }
  if (str[0] == "~" && str[str.length - 1] == "~") {
    return parseFloat(str.substring(1, str.length - 1));
  }
  if (str[0] == "$") {
    if (Object.keys(vars).includes(str.substring(1, str.length))) {
      return vars[str.substring(1, str.length)];
    } else {
      return null;
    }
  }
}

function checkIf(line) {
  comps1 = line.split("?");
  if (!comps1[1]) {
    return true;
  }
  comps1 = comps1[comps1.length - 1].split(" ");
  a = getValue(comps1[2]);
  b = getValue(comps1[3]);
  if (getValue(comps1[1]) === true) {
    return true;
  }
  return runOp(comps1[1], a, b);
}

function runOp(type, a, b) {
  switch (type) {
    case "add": return a + b;
    case "sub": return a - b;
    case "mul": return a * b;
    case "div": return a / b;
    case "pow": return a ** b;
    case "mod": return a % b;
    case "con": return "" + a + b;

    case "not": return !a;
    case "and": return a && b;
    case "or": return a || b;
    case "nand": return !(a && b);
    case "nor": return !(a || b);
    case "xor": return (a || b) && !(a && b);
    case "xnor": return !((a || b) && !(a && b));

    case "lt": return a < b;
    case "gt": return a > b;
    case "elt": return a <= b;
    case "egt": return a >= b;
    case "eq": return a === b;
    case "nlt": return a >= b;
    case "ngt": return a <= b;
    case "nelt": return a > b;
    case "negt": return a < b;
    case "neq": return a !== b;
  }
  return false;
}

function returnValue(line, value) {
  key = line.split(">");
  if (key.length < 2) {
    key = "$";
  } else {
    key = key[key.length - 1];
    temp = "";
    for (j = 0; j < key.length; j++) {
      if (key[j] != " ") {
        temp += key[j];
      }
    }
    key = temp;
  }
  if (!key) {
    key = "$";
  }
  vars[key] = value;
}

function sleep(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time * 1000);
  });
}