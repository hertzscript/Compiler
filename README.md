# HertzScript Coroutine Compiler

[![NPM](https://nodei.co/npm/hertzscript-compiler.png)](https://nodei.co/npm/hertzscript-compiler/)

The HertzScript compiler produces preemptible JavaScript coroutines which conform to the HertzScript specification.

The [HertzScript Dispatcher](https://github.com/Floofies/hertzscript-dispatcher) can be used to execute the compiled code.

See the [HertzScript Specification](https://github.com/Floofies/hertzscript-specification) repository for more information.

# Usage

There are two different ways to use this:

1. Import the compiler module into your script.

2. Invoke `hzc` via terminal.

## `Compiler Module`

This module serves as the core of the HzScript compilation pipeline, and transforms JavaScript functions into instruction streams; all functions within a HzScript program are GeneratorFunctions which yield instructions.

Exported as a single function, you can invoke it like so:

```JavaScript
const hzCompile = require("hertzscript-compiler");
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

- If `true` then the `spawn` keyword compiler will be used to detect and compile the `spawn` keyword. Defaults to `false`.

## Command-Line Interface

The `hzc` command imports the compiler module and wraps it in a simple command-line interface.

You can invoke the interface script like so, shown here with the `spawn` compiler enabled and the ouput code wrapped in `--standalone` mode:

```bash
echo "spawn console.log('Hello World!')" | hzc --spawn -s
```

You can also supply input and output paths with the `-i` and `-o` parameters:

```bash
hzc -i path/to/my/script.js -o path/to/my/output.hz.js
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

- If set, then the `spawn` keyword compiler will be used to detect and compile the `spawn` keyword.