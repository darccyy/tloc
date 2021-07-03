# The Language of Cringe (TLOC)

A terrible programming language created by me.

/tiːlɒk/

# How to use

1. Download the files.

2. Make sure you have Node.JS installed.

3. Run the command `npm start`
   
4. This will run the `index.tloc` file

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

### Arguments
`value`: Any data type (Converts to string)

## SET

Sets a variable to a value

### Usage

```
SET var value;
```

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

`NOT`: Not gate

`AND`: And gate

`OR`: Or gate

`NAND`: Nand gate

`NOR`: Nor gate

`XOR`: Xor gate

`XNOR`: Xnor gate

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

`BOOL`: Returns boolean value of binary (0 | 1) = (TRU | FLS)

## RAND

Returns random boolean `TRU` or `FLS`

### Usage

```
RAND;

RAND >> $var;
```

### Arguments

`var`: Output variable. Leave blank to set to temp variable `$$`

## LABEL

Creates a label or marker to refer to by `GO` command. All label commands are hoisted.

### Usage

```
LABEL name;
```

### Arguments

`name`: Label name. Must be string. `"..."` string markers are unnecessary

## GO

Moves code runner to line number of `LABEL` command reference

### Usage

```
GO name;
```

### Arguments

`name`: Label name. Must be string. `"..."` string markers are unnecessary

## DISSOLVE

Terminates program and immediatly quits

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

# Process Variables

`$$dir`: Directory of runner file (`index.js`) **NOT** Tloc file (`index.tloc`)

`$$`: Temporary variable. Default variable to return from command

`$0`, `$1`, ect. Integer variables: Arguments used in initial run command.

 - Eg.
 - `node index index.tloc abc 123` <!-- Add npm support -->
 - `$0` = `"abc"`, `$1` = `123`

# Other

Comments: Line comments only. Use by adding `::` to the start of the line.