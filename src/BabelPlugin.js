function Plugin(babel) {
	const t = babel.types;
	const tryStack = [];
	// Traverses specific expression types and marks a CallExpression in tail position
	function markTailCall(expr) {
		if (expr.type === "CallExpression") {
			expr.isTailCall = true;
		} else if (expr.type === "SequenceExpression" && expr.expressions.length > 0) {
			return markTailCall(expr.expressions[expr.expressions.length - 1]);
		} else if (expr.type === "LogicalExpression") {
			if (expr.operator === "&&" || expr.operator === "||")
				return markTailCall(expr.right);
		} else if (expr.type === "ConditionalExpression") {
			markTailCall(expr.consequent);
			return markTailCall(expr.alternate);
		}
	}
	function addTailCallBool(seqExp) {
		seqExp.expressions[0].argument.arguments.push(t.booleanLiteral(true));
	}
	// HzTokens are unique single-instance objects for wrapping user instructions and data.
	// Type 1: Invocation Tokens,
	// Wrap userland functors and any operands needed to invoke them.
	// Type 2: Data Tokens,
	// Wrap arbitrary userland datum when returning or yielding.
	// Instruction Token: Function call without arguments
	function hzCall(callee) {
		return t.sequenceExpression([
			t.yieldExpression(
				t.callExpression(
					t.memberExpression(
						t.identifier("hzUserLib"),
						t.identifier("call")
					),
					[
						callee
					]
				)
			)
		]);
	}
	// Instruction Token: Function call with arguments
	function hzCallArgs(name, argsArray) {
		const seqExp = hzCall(name);
		seqExp.expressions[0].argument.callee.property.name = "callArgs";
		seqExp.expressions[0].argument.arguments.push(t.arrayExpression(argsArray));
		return seqExp;
	}
	// Instruction Token: Method call without arguments
	function hzCallMethod(object, prop) {
		return t.sequenceExpression([
			t.yieldExpression(
				t.callExpression(
					t.memberExpression(
						t.identifier("hzUserLib"),
						t.identifier("callMethod")
					),
					[
						object,
						t.stringLiteral(prop.name)
					]
				)
			)
		]);
	}
	// Instruction Token: Method call with arguments
	function hzCallMethodArgs(object, prop, argsArray) {
		const seqExp = hzCallMethod(object, prop);
		seqExp.expressions[0].argument.callee.property.name = "callMethodArgs";
		seqExp.expressions[0].argument.arguments.push(t.arrayExpression(argsArray));
		return seqExp;
	}
	// Instruction Token: Constructor call without arguments
	function hzNew(callee) {
		const seqExp = hzCall(callee);
		seqExp.expressions[0].argument.callee.property.name = "new";
		return seqExp;
	}
	// Instruction Token: Constructor call with arguments
	function hzNewArgs(name, argsArray) {
		const seqExp = hzNew(name);
		seqExp.expressions[0].argument.arguments.push(t.arrayExpression(argsArray));
		seqExp.expressions[0].argument.callee.property.name = "newArgs";
		return seqExp;
	}
	// Instruction Token: Method constructor call without arguments
	function hzNewMethod(object, prop) {
		const seqExp = hzCallMethod(object, prop);
		seqExp.expressions[0].argument.callee.property.name = "newMethod";
		return seqExp;
	}
	// Instruction Token: Method constructor call with arguments
	function hzNewMethodArgs(object, prop, argsArray) {
		const seqExp = hzNewMethod(object, prop);
		seqExp.expressions[0].argument.arguments.push(t.arrayExpression(argsArray));
		seqExp.expressions[0].argument.callee.property.name = "newMethodArgs";
		return seqExp;
	}
	// Instruction Token: Return without argument
	function hzReturn() {
		return t.memberExpression(
			t.identifier("hzUserLib"),
			t.identifier("return")
		);
	}
	// Instruction Token: Return with argument
	function hzReturnArg(argExp) {
		const memberExp = hzReturn();
		const callExp = t.callExpression(memberExp, [argExp]);
		memberExp.property.name = "returnValue";
		return callExp;
	}
	// Instruction Token: Yield without argument
	function hzYield() {
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzUserLib"),
				t.identifier("yield")
			),
			[t.ObjectExpression([
				t.ObjectProperty(t.identifier("value"), t.identifier("undefined")),
				t.ObjectProperty(t.identifier("done"), t.BooleanLiteral(false))
			])]
		);
	}
	// Instruction Token: Yield with argument
	function hzYieldArg(argExp) {
		const callExp = hzYield();
		callExp.callee.property.name = "yieldValue";
		callExp.arguments[0].properties[0].value = argExp;
		return callExp;
	}
	// Instruction Token: Spawn without arguments
	function hzSpawn(spawnExp) {
		if (spawnExp.arguments[0].type === "CallExpression") {
			spawnExp.arguments = [spawnExp.arguments[0].callee];
		} else {
			spawnExp.arguments = [spawnExp.arguments[0]];
		}
		return t.yieldExpression(
			spawnExp
		);
	}
	// Instruction Token: Spawn with arguments
	function hzSpawnArgs(spawnExp) {
		const args = spawnExp.arguments[0].arguments;
		spawnExp = hzSpawn(spawnExp);
		spawnExp.argument.arguments.push(t.arrayExpression(args));
		spawnExp.argument.callee.property.name = "spawnArgs";
		return spawnExp;
	}
	// Instruction Token: Spawn method without arguments
	function hzSpawnMethod(spawnExp) {
		spawnExp.arguments = [
			spawnExp.arguments[0].callee.object,
			t.stringLiteral(spawnExp.arguments[0].callee.property.name)
		];
		spawnExp.callee.property.name = "spawnMethod";
		return t.yieldExpression(
			spawnExp
		);
	}
	// Instruction Token: Spawn method with arguments
	function hzSpawnMethodArgs(spawnExp) {
		const args = spawnExp.arguments[0].arguments;
		spawnExp = hzSpawnMethod(spawnExp);
		spawnExp.argument.arguments.push(t.arrayExpression(args));
		spawnExp.argument.callee.property.name = "spawnMethodArgs";
		return spawnExp;
	}
	// Instruction Token: Loop interruption token
	function loopInterruptor(path) {
		if (path.node.body.type !== "BlockStatement") {
			if (path.node.body.type === "EmptyStatement") {
				path.node.body = t.blockStatement([]);
			} else {
				if (Array.isArray(path.node.body)) {
					path.node.body = t.blockStatement(path.node.body);
				} else {
					path.node.body = t.blockStatement([path.node.body]);
				}
			}
		}
		path.node.body.body.unshift(t.expressionStatement(
			t.yieldExpression(t.memberExpression(
				t.identifier("hzUserLib"),
				t.identifier("loopYield")
			))
		));
	}
	// Function call, declaration, and expression detours enable dynamic call site interception.
	// FunctionExpression detour
	function hzCoroutine(funcExp) {
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzUserLib"),
				t.identifier("hookCoroutine")
			),
			[funcExp]
		);
	}
	// ArrowFunctionExpression detour
	function hzArrowCoroutine(funcExp) {
		funcExp.type = "FunctionExpression";
		if (funcExp.body.type !== "BlockStatement") {
			funcExp.body = t.blockStatement([
				t.expressionStatement(
					t.yieldExpression(hzReturnArg(funcExp.body)))
			]);
		}
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzUserLib"),
				t.identifier("hookArrowCoroutine")
			),
			[
				funcExp,
				t.identifier("this")
			]
		);
	}
	// Generator FunctionExpression detour
	function hzGenerator(funcExp) {
		return t.callExpression(
			t.memberExpression(
				t.identifier("hzUserLib"),
				t.identifier("hookGenerator")
			),
			[funcExp]
		);
	}
	// FunctionDeclaration detour
	function declareHzCoroutine(funcDec) {
		return t.variableDeclaration("var", [
			t.variableDeclarator(
				funcDec.id,
				hzCoroutine(t.functionExpression(
					null,
					funcDec.params,
					funcDec.body,
					true
				))
			)
		]);
	}
	// Generator FunctionDeclaration detour
	function declareHzGenerator(funcDec) {
		return t.variableDeclaration("var", [
			t.variableDeclarator(
				funcDec.id,
				hzGenerator(t.functionExpression(
					null,
					funcDec.params,
					funcDec.body,
					true
				))
			)
		]);
	}
	const visitor = {
		// These all nsert a yield & HzToken at the top of loops
		// Useful for interrupting loops which make few function calls
		"WhileStatement": {
			exit: loopInterruptor
		},
		"DoWhileStatement": {
			exit: loopInterruptor
		},
		"ForStatement": {
			exit: loopInterruptor
		},
		"ForOfStatement": {
			exit: loopInterruptor
		},
		"ForInStatement": {
			exit: loopInterruptor
		},
		// Detours a FunctionExpression
		"FunctionExpression": {
			exit: function (path) {
				if (path.node.generator) path.replaceWith(hzGenerator(path.node));
				else path.replaceWith(hzCoroutine(path.node));
				path.node.arguments[0].generator = true;
				path.skip();
			}
		},
		// Detours an ArrowFunctionExpression
		"ArrowFunctionExpression": {
			exit: function (path) {
				path.replaceWith(hzArrowCoroutine(path.node));
				path.node.arguments[0].generator = true;
				path.skip();
			}
		},
		// Detours a FunctionDeclaration.
		// Changes it to a FunctionExpression and assigns it to a variable, moving it tp the top of the block
		"FunctionDeclaration": {
			exit: function (path) {
				if (path.node.generator) var varDec = declareHzGenerator(path.node);
				else var varDec = declareHzCoroutine(path.node);
				path.node.generator = true;
				const parentPath = path.getFunctionParent();
				if (Array.isArray(parentPath.node.body)) parentPath.node.body.unshift(varDec);
				else parentPath.node.body.body.unshift(varDec);
				path.remove();
			}
		},
		// Transforms a NewExpression into an Instruction Token
		"NewExpression": {
			exit: function (path) {
				if (path.node.callee.type === "MemberExpression") {
					if (path.node.arguments.length === 0) {
						path.replaceWith(hzNewMethod(
							path.node.callee.object,
							path.node.callee.property
						));
					} else {
						path.replaceWith(hzNewMethodArgs(
							path.node.callee.object,
							path.node.callee.property,
							path.node.arguments
						));
					}
				} else {
					if (path.node.arguments.length === 0) {
						path.replaceWith(hzNew(
							path.node.callee
						));
					} else {
						path.replaceWith(hzNewArgs(
							path.node.callee,
							path.node.arguments
						));
					}
				}
				path.skip();
			}
		},
		// Checks if the CallExpression is a partially transformed "spawn" HzToken from Acorn.
		// If so, it completes the transformation of arguments and wraps the HzToken in a yield.
		// If the argument is a FunctionExpression then it is detoured.
		"CallExpression": {
			enter: function (path) {
				if (path.node.callee.type === "MemberExpression" &&
					path.node.callee.object.type === "Identifier" &&
					path.node.callee.object.name === "hzUserLib" &&
					path.node.callee.property.type === "Identifier" &&
					path.node.callee.property.name === "spawn"
				) {
					if (path.node.arguments[0].type === "CallExpression") {
						if (path.node.arguments[0].callee.type === "MemberExpression") {
							if (path.node.arguments[0].arguments.length > 0) {
								path.replaceWith(hzSpawnMethodArgs(path.node));
							} else {
								path.replaceWith(hzSpawnMethod(path.node));
							}
						} else {
							if (path.node.arguments[0].arguments.length > 0) {
								path.replaceWith(hzSpawnArgs(path.node));
							} else {
								path.replaceWith(hzSpawn(path.node));
							}
						}
					} else {
						path.replaceWith(hzSpawn(path.node));
					}
					const callee = path.node.argument.arguments[0];
					if (callee.type === "FunctionExpression"
						|| callee.type === "ArrowFunctionExpression") {
						if (callee.generator) {
							path.node.argument.arguments[0] = hzGenerator(callee);
						} else {
							path.node.argument.arguments[0] = hzCoroutine(callee);
							callee.generator = true;
						}
					}
					path.skip();
				}
			},
			// Transforms a CallExpression into an Instruction Token.
			// Checks if the CallExpression is a proper tail call and marks the HzToken if so.
			exit: function (path) {
				const isTailCall = "isTailCall" in path.node;
				if (path.node.callee.type === "MemberExpression") {
					if (path.node.arguments.length === 0) {
						path.replaceWith(hzCallMethod(
							path.node.callee.object,
							path.node.callee.property
						));
					} else {
						path.replaceWith(hzCallMethodArgs(
							path.node.callee.object,
							path.node.callee.property,
							path.node.arguments
						));
					}
				} else {
					if (path.node.arguments.length === 0) {
						path.replaceWith(hzCall(
							path.node.callee
						));
					} else {
						path.replaceWith(hzCallArgs(
							path.node.callee,
							path.node.arguments
						));
					}
				}
				// Add Tail Call Optimization marker boolean to the HzToken
				if (isTailCall) {
					// Check for TCO validity if the call is within a TryStatement
					if (tryStack.length > 0) {
						const tryData = tryStack[tryStack.length - 1];
						if (path.getFunctionParent().node === tryData.functionParent) {
							if (
								tryData.blockType === "finalizer"
								|| tryData.blockType === "catch"
							) {
								addTailCallBool(path.node);
							}
						} else {
							addTailCallBool(path.node);
						}
					} else {
						addTailCallBool(path.node);
					}
				}
				path.skip();
			}
		},
		"ReturnStatement": {
			// Finds and marks a CallExpression if it is in the tail position
			enter: function (path) {
				if (path.node.argument !== null) markTailCall(path.node.argument);
			},
			// Transforms a ReturnStatement into an Instruction Token
			exit: function (path) {
				if (path.node.argument === null) path.node.argument = hzReturn();
				else path.node.argument = hzReturnArg(path.node.argument);
				if (path.getFunctionParent().node.generator) path.node.argument.arguments = [t.ObjectExpression([
					t.ObjectProperty(
						t.identifier("value"),
						path.node.argument.arguments[0]
					),
					t.ObjectProperty(
						t.identifier("done"),
						t.BooleanLiteral(true)
					)
				])];
			}
		},
		"BlockStatement": {
			// Records entry into the "finalizer" block of a TryStatement
			enter: function (path) {
				if (tryStack.length > 0 && tryStack[tryStack.length - 1].blockType === null) {
					const stmtParent = path.getStatementParent();
					if (stmtParent.node.type === "TryStatement") {
						if (stmtParent.node.finalizer === path.node)
							tryStack[tryStack.length - 1].blockType = "finalizer";
						else if (stmtParent.node.handler.body === path.node)
							tryStack[tryStack.length - 1].blockType = "catch";
					}
				}
			},
			// Records exit out of the "finalizer" block of a TryStatement
			exit: function (path) {
				if (tryStack.length > 0 && tryStack[tryStack.length - 1].blockType !== null) {
					const stmtParent = path.getStatementParent();
					if (stmtParent.node.type === "TryStatement") {
						if (
							stmtParent.node.finalizer === path.node
							|| stmtParent.node.handler.body === path.node
						) {
							tryStack[tryStack.length - 1].blockType = null;
						}
					}
				}
			}
		},
		"TryStatement": {
			// Records entry into a TryStatement
			enter: function (path) {
				tryStack.push({
					functionParent: path.getFunctionParent().node,
					blockType: null
				});
			},
			// Records exit out of a TryStatement
			exit: function (path) {
				if (tryStack.length > 0) tryStack.pop();
			}
		},
		"YieldExpression": {
			// Transforms a YieldExpression into an Instruction Token
			exit: function (path) {
				if (path.node.argument === null) path.node.argument = hzYield();
				else path.node.argument = hzYieldArg(path.node.argument);
			}
		}
	};
	return { visitor: visitor };
};
module.exports = Plugin;