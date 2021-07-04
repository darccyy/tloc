const fs = require("fs");
const path = require("path");

var data, lines, vars, pVars, labels;

async function main() {
  file = process.argv[2];
  if (!file || file === ".") {
    file = "index.tloc";
  }
  lines = fs.readFileSync(path.join(__dirname, `${file}`)).toString().split(/;|\r\n/);
  vars = {};
  pVars = {
    dir: __dirname,
  };
  labels = {};

  for (i = 3; i < process.argv.length; i++) {
    pVars["$" + (i - 3)] = getValue(process.argv[i]);
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
    line = lines[i];
    comps = [];
    inner = {
      str: 0,
      arr: 0,
    };
    str = "";
    for (j = 0; j < line.length + 1; j++) {
      if (line[j] == "\"") {
        inner.str = (inner.str == 1 ? 0 : 1);
      } else if (!inner.str && line[j] == "[") {
        inner.arr ++;
      } else if (!inner.str && line[j] == "]") {
        inner.arr--;
      }
      if ((line[j] == " " || !line[j]) && !inner.str && !inner.arr) {
        comps.push(str);
        str = "";
      } else {
        str += line[j];
      }
    }
    cmd = comps[0];
    if (!cmd) {
      cmd = comps[1];
    }
    if (cmd) {
      cmd = cmd.toLowerCase();
      if (cmd === "label") {
        labels[comps[1]] = i;
      }
    }
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
    line = lines[i];
    comps = [];
    inner = {
      str: 0,
      arr: 0,
    };
    str = "";
    for (j = 0; j < line.length + 1; j++) {
      if (line[j] == "\"") {
        inner.str = (inner.str == 1 ? 0 : 1);
      } else if (!inner.str && line[j] == "[") {
        inner.arr ++;
      } else if (!inner.str && line[j] == "]") {
        inner.arr--;
      }
      if ((line[j] == " " || !line[j]) && !inner.str && !inner.arr) {
        comps.push(str);
        str = "";
      } else {
        str += line[j];
      }
    }
    cmd = comps[0];
    if (!cmd) {
      cmd = comps[1];
      comps = comps.slice(1, comps.length);
    }
    if (checkIf(lines[i])) {
      if (cmd) {
        cmd = cmd.toLowerCase();
        switch (cmd) {
          case "print": {
            if (comps[1]) {
              console.log(" >>", getValue(comps[1]));
            }
          }; break;
          case "set": {
            if (comps[1]) {
              if (comps[1][0] != "$") {
                value = comps[2];
                vars[comps[1]] = getValue(value);
              } else {
                console.log("ERR: Cannot create variable starting with '$'");
              }
            }
          }; break;
          case "op": {
            if (comps[1] && comps[2]) {
              if (["not", "bool", "roun", "flor", "ceil"].includes(comps[1].toLowerCase()) || comps[3]) {
                value = runOp(comps[1], getValue(comps[2]), getValue(comps[3]));
                if (isNaN(value) && parseFloat(value) == value) {
                  value = null;
                }
                returnValue(lines[i], value);
              }
            }
          }; break;
          case "len": {
            if (comps[1] && getValue(comps[1])) {
              value = getValue(comps[1]).length;
              if (isNaN(value)) {
                value = null;
              }
              returnValue(lines[i], value);
            }
          }; break;
          case "rand": {
            returnValue(lines[i], Math.random() >= 0.5);
          }; break;
          case "go": {
            i = labels[getValue(comps[1]) || comps[1]];
          }; break;
          case "label": break;
          case "dissolve": {
            break I;
          }; break;
          case "halt": {
            if (comps[1]) {
              await sleep(getValue(comps[1]));
            }
          }; break;
          case "pen": {
            if (comps[1]) {
              fs.writeFileSync(getValue(comps[1]), getValue(comps[2]) || "");
            }
          }; break;
          case "scan": {
            if (comps[1]) {
              returnValue(lines[i], fs.readFileSync(getValue(comps[1])).toString());
            }
          }; break;
          default: {
            console.log(`ERR: Unknown command '${cmd.toUpperCase()}'`);
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
  if (str.startsWith("\"") && str.endsWith("\"")) {
    return str.substring(1, str.length - 1);
  }
  if (str.startsWith("[") && str.endsWith("]")) {
    temp = str.substring(1, str.length - 1).split(",");
    arr = [];
    for (j = 0; j < temp.length; j++) {
      item = "";
      pastFirst = false;
      for (k = 0; k < temp[j].length; k++) {
        if (pastFirst || temp[j][k] != " ") {
          item += temp[j][k];
        } else {
          pastFirst = true;
        }
      }
      arr.push(getValue(item));
    }
    return arr;
  }
  if (str.startsWith(".")) {
    return parseFloat(str.substring(1, str.length));
  }
  if (str.startsWith("$$")) {
    if (str.includes(":")) {
      str = str.split(":");
    } else {
      str = [str];
    }
    if (Object.keys(pVars).includes(str.substring(1, str.length))) {
      item = pVars[str[0].substring(1, str[0].length)];
      if (str[1]) {
        item = item[getValue(str[1])];
      }
      return item;
    } else {
      console.error(`ERR: Unknown process variable '${str.substring(1, str.length)}'`);
      return;
    }
  }
  if (str.startsWith("$")) {
    if (str.includes(":")) {
      str = str.split(":");
    } else {
      str = [str];
    }
    if (Object.keys(vars).includes(str[0].substring(1, str[0].length))) {
      item = vars[str[0].substring(1, str[0].length)];
      if (str[1]) {
        item = item[getValue(str[1])];
      }
      return item;
    } else {
      console.error(`ERR: Unknown variable '${str[0].substring(1, str.length)}'`);
      return;
    }
  }
  return false;
}

function checkIf(line) {
  comps1 = line.split("?");
  if (!comps1[1]) {
    return true;
  }
  comps1 = comps1[comps1.length - 1].split(" ");
  temp = [];
  for (j = 0; j < comps1.length; j++) {
    if (comps1[j]) {
      temp.push(comps1[j]);
    }
  }
  comps1 = temp;
  a = getValue(comps1[1]);
  b = getValue(comps1[2]);
  if (getValue(comps1[0]) === true) {
    return true;
  }
  return runOp(comps1[0], a, b);
}

function runOp(type, a, b) {
  switch (type.toLowerCase()) {
    case "add": return a + b;
    case "sub": return a - b;
    case "mul": return a * b;
    case "div": return a / b;
    case "pow": return a ** b;
    case "log": return Math.log(a) / Math.log(b);
    case "mod": return a % b;
    case "con": return "" + a + b;

    case "bool": return a === 1 ? 1 : 0;
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

    case "roun": return Math.round(a);
    case "flor": return Math.floor(a);
    case "ceil": return Math.ceil(a);
  }
  return false;
}

function returnValue(line, value) {
  key = line.split(">>");
  if (key.length < 2) {
    pVars.$ = value;
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
    pVars.$ = value;
  } else {
    vars[key] = value;
  }
}

function sleep(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time * 1000);
  });
}