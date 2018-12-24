# hertzscript-compiler

The HertzScript compiler produces preemptible JavaScript coroutines which conform to the HertzScript specification.

See the [HertzScript Specification](https://github.com/Floofies/hertzscript-specification) repository for more information.

# Usage

There are two different ways to use this:

1. Import `src/compile.js` and `src/compileSpawn.js` into your own script.

2. Invoke `bin/compileCLI.js` via terminal.

`src/compile.js` and `src/compileSpawn.js` are importable modules with simple interfaces.

## `compile.js`

This module serves as the core of the HzScript compilation pipeline, and transforms JavaScript functions into instruction streams; all functions within a HzScript program are GeneratorFunctions which yield instructions.

Exported as a single function, you can invoke it like so:

```JavaScript
const hzCompile = require("./src/compile.js");
const sourceCode = "console.log('Hello World!')";
const compiledCode = hzCompile(sourceCode);
```

### Function Parameters

```JavaScript
hzCompile( source [, module  = false [, standalone = false [, spawn = false ]]);
```

`source`

- The input JavaScript source code you would like to compile.

`module`

- If `true` then the compiled source code will be output as a HertzScript module. Defaults to `false`.

`standalone`

- If `true` then the compiled source code will be output as a self-running HertzScript module. Defaults to `false`.

`spawn`

- If `true` then `compileSpawn.js` will be used to detect and compile the `spawn` keyword. Defaults to `false`.

### Return Value

The function returns a string which is the compiled JavaScript code.


## `compileSpawn.js`

This module is used to detect and compile the `spawn` keyword before passing it to `src/compile.js`. Specifically, it changes all instances of the `spawn` keyword to normal method calls.

Exported as a single function, you can invoke it like so:

```JavaScript
const hzCompileSpawn = require("./src/compileSpawn.js");
const sourceCode = "spawn console.log('Hello World!')";
const compiledCode = hzCompileSpawn(sourceCode);
```

### Function Parameters

```JavaScript
hzCompile( source );
```

`source`

- The input JavaScript source code you would like to compile.

### Return Value

The function returns a string which is the compiled JavaScript code.

## Command-Line Interface

`bin/compileCLI.js` imports `src/compile.js` and `src/compileSpawn.js`, wrapping them in a simple command-line interface.

You can invoke the interface script like so:

```bash
node ./bin/compileCLI.js --spawn "spawn console.log('Hello World!');"
```

### Command-Line Options

`-s` (`--standalone`)

- If set, then the compiled source code will be output as a self-running HertzScript module

`-i` *path* (`--input`)

- This option supplies the text from the given filepath as the input JavaScript source code you would like to compile. If this option is set to nothing, or is not set at all, then the source code is consumed via the standard input of the terminal.

`-o` *path* (`--output`)

- This option specifies a filepath which the compiled source code will be saved to. If this option is set to nothing, or is not set at all, then the source code is returned via standard output into the terminal.

`-m` (`--module`)

- If set, then the compiled source code will be output as a HertzScript module.

`--spawn`

- If set, then `compileSpawn.js` will be used to detect and compile the `spawn` keyword.