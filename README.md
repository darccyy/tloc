# The Language of Cringe (TLOC)

A terrible programming language created by me.

/tiːlɒk/

# How to use

1. Download the files.

2. Make sure you have Node.JS installed.

3. Run the command `npm start`
4. This will run the `index.tloc` file

5. To run example scripts, use `node . example/filename.tloc`, with `filename`
   - Example scripts:
   1. `array` - Array / List
   1. `function` - Function / Label
   1. `upper` - Upper Case String
   1. `mod` - Modulo Formula
   1. `random` - Random Number Function
   1. `stringify` - Stringify Number
   1. `import` - Importing File
   1. `hangman` - Hangman Game
   1. `rps` - Rock, Paper, Scissors Game

# Data Values

## String

Basic string of characters.

Marker: `"..."` Eg. `"abc"`, `"Def 123"`

## Number

Number. Includes integers and floats.

Marker: `.` Eg. `.12`, `.0.47`

## Boolean

Boolean value (true or false)

Values: `TRU`, `FLS`

## Null

Non-value. Not zero or empty string.

Value: `NUL`

# Commands

Commands can be either uppercase or lowercase

## PRINT

Simply outputs the value.

### Usage

```
PRINT value;
```

[Full Example](/example/test.tloc)

### Arguments

`value`: Any data type (Converts to string)

## SET

Sets a variable to a value

### Usage

```
SET var value;
```

[Full Example](/example/test.tloc)

### Arguments:

`var`: Name of variable. Do not use data markers such as `$` or `"..."`. Unable to set variables starting with `$` (Called with `$$var`) as that is reserved for process variables

`value`: Any data type

## OP

The operation command.

### Usage

```
OP operator value1 value2;

OP operator value1 value2 >> var;
```

[Full Example](/example/test.tloc)

### Arguments

`operator`: The type of operator (see below)

`value1`, `value2`: Both input values, typically number. `value2` is not needed for `NOT` and `BOOL` operations.

`var`: Output variable. Leave blank to set to temp variable `$$`

### Operations:

`ADD`: Adds numbers

`SUB`: Subtracts numbers

`MUL`: Multiplies numbers

`DIV`: Divides numbers

`POW`: Power / Exponent

`MOD`: Modulo (Modulus) operation

`CON`: Concatenates strings (converts numbers to string)

---

`BOOL`: Returns boolean value of binary (0 | 1) = (TRU | FLS)

`NOT`: Not gate

`AND`: And gate

`OR`: Or gate

`NAND`: Nand gate

`NOR`: Nor gate

`XOR`: Xor gate

`XNOR`: Xnor gate

---

`LT`: Less than (<)

`GT`: Greater than (>)

`ELT`: Equal or less than (<=)

`EGT`: Equal or greater than (>=)

`EQ`: Equal to (=)

`NLT`: Not less than (!<)

`NGT`: Not greater than (!>)

`NELT`: Not equal or less than (!<=)

`NEGT`: Not equal or greater than (!>=)

`NEQ`: Not eqal (!=)

---

`ROUN`: Round function

`FLOR`: Floor function

`CEIL`: Ceiling function

## RAND

Returns random boolean `TRU` or `FLS`

[Full Example](/example/random.tloc)

### Usage

```
RAND;

RAND >> var;
```

### Arguments

`var`: Output variable. Leave blank to set to temp variable `$$`

## LABEL

Creates a label or marker to refer to by `GO` command. All label commands are hoisted, and therefore you cannot create multiple labels with the same name.

### Usage

```
LABEL name;
```

[Full Example](/example/test.tloc)

### Arguments

`name`: Label name. Can be string. `"..."` string markers are unnecessary. Same rules as `LABEL`, but with variables

## GO

Moves code runner to line number of `LABEL` command reference

### Usage

```
GO name;
```

[Full Example](/example/test.tloc)

### Arguments

`name`: Label name. Plain text

## DISSOLVE

Terminates program and immediatly quits

[Full Example](/example/test.tloc)

### Usage

```
DISSOLVE;
```

## HALT

Waits a certain time before continuing program

### Usage

```
HALT time;
```

### Arguments

`time`: Time to wait in seconds (number)

## PEN

Writes to a file. Creates one if there is none

### Usage

```
PEN file contents;
```

### Arguments

`file`: Name of file to write to (string)

`contents`: Contents of file (string / number)

## SCAN

Reads a file.

### Usage

```
SCAN file;

SCAN file >> var;
```

### Arguments

`file`: Name of file to write to (string)

`var`: Output variable. Leave blank to set to temp variable `$$`

## IMPORT

Imports the contents of a file to the current file.

The imported file must be written in `tloc`, but does not need to have `.tloc` extension. It must be in the same directory as the index file. To go back a folder, use `../` in the path.

Preferably use at the start of the file, as it is unable to be used with variables, and is hoisted before labels.

The import function will essentially replace itself with the code in that file.

### Usage

```
IMPORT file;
```

Example

```
IMPORT file.tloc;
IMPORT ../../two_folders_back.tloc;
IMPORT folder/other_folder/important123.txt;
IMPORT /file_other.tloc;
```

Full Example
[(Index file)](/example/import.tloc)
[(Imported file)](/example/random.tloc)

### Arguments

`file`: Plain text. Cannot be variable.

# Process Variables

Process variables are variables that are called with `$$` Double dollar instead of `$` Single dollar, and cannot be changed.

`$$dir`: Directory of `tloc` file being executed (Eg. `file.tloc`) **NOT** executor file (`index.js`)

`$$direx`: Directory of executor file (`index.js`) **NOT** `tloc` file (Eg. `index.tloc`)

`$$`: Temporary variable. Default variable to return from command

- Eg. (These pairs of lines complete the same task)

```
OP ADD .1 .2;`
PRINT $$;

OP ADD .1 .2 >> varname;`
PRINT $varname;
```

`$$0`, `$$1`, ect. Integer variables: Arguments used in initial run command.

- Eg.
- `node . . abc 123` <!-- Add npm support -->
- `$$0` = `"abc"`, `$$1` = `"123"`

# Other

All variables are on global scope.

Semicolon (`;`) is used to seperate commands. If a new command is on a new line, then it is not needed.

- Eg.

```
PRINT "Blah blah"
PRINT "Abc";
PRINT "foo"; RAND; PRINT $$
```

Indentations and blank lines are not necessary, but they might help to read.

- Eg.

```
LABEL upper;
  LEN $_str >> len;
  LEN $low >> lenLow;
  SET new "";

  SET i .0;
  LABEL i;
    SET char $_str:$i;

    SET j .0;
    LABEL j;

      SET char $up:$j ? EQ $low:$j $_str:$i;

      ...
```

> VS

```
LABEL upper;
LEN $_str >> len;
LEN $low >> lenLow;
SET new "";
SET i .0;
LABEL i;
SET char $_str:$i;
SET j .0;
LABEL j;
SET char $up:$j ? EQ $low:$j $_str:$i;

...
```

Comments: Use by adding `::` to the start of the line. Use `;` semicolon to end comment.

- Eg.

```
:: Comment here

:: Comment also here; PRINT "Blah"; :: Comment
```

# To Do

Add non-conflicting labels for imported modules (`GO filename:labelname`)

### Created by [darcy](https://github.com/darccyy)
