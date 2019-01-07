# HertzScript Coroutine Compiler

[![NPM](https://nodei.co/npm/hertzscript-compiler.png)](https://nodei.co/npm/hertzscript-compiler/)

The HertzScript compiler produces preemptible JavaScript coroutines which conform to the HertzScript specification.

The [HertzScript Dispatcher](https://github.com/Floofies/hertzscript-dispatcher) can be used to execute the compiled code.

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

### Return Value

The function returns a string which is the compiled JavaScript code.

### Function Parameters

```JavaScript
hzCompile( source [, module  = false [, standalone = false [, spawn = false ]]]);
```

`source`

- The input JavaScript source code you would like to compile.

`module` (*Optional*)

- If `true` then the compiled source code will be output as a HertzScript module. Defaults to `false`.

`standalone` (*Optional*)

- If `true` then the compiled source code will be output as a self-running HertzScript module. Defaults to `false`.

`spawn` (*Optional*)

- If `true` then `compileSpawn.js` will be used to detect and compile the `spawn` keyword. Defaults to `false`.

## Command-Line Interface

`bin/compileCLI.js` imports `src/compile.js` and `src/compileSpawn.js`, wrapping them in a simple command-line interface.

You can invoke the interface script like so, shown here with the `spawn` compiler turned on and the ouput code running in `--standalone` mode:

```bash
echo "spawn console.log('Hello World!');" | node ./bin/compileCLI.js --spawn -s
```

You can also supply input and output paths with the `-i` and `-o` parameters:

```bash
node ./bin/compileCLI.js --spawn -s -i path/to/my/script.js -o path/to/my/script.hz.js
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