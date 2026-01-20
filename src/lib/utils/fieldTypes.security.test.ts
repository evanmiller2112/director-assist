/**
 * Security Tests for Computed Field Formula Validation
 *
 * Issue #166: Document and mitigate eval() usage in computed field evaluation
 *
 * RED Phase (TDD): These tests define expected security behavior before implementation.
 * Tests should FAIL until validateFormulaForEval() is implemented in fieldTypes.ts
 *
 * These tests validate that computed field formulas are properly sanitized to prevent:
 * 1. Arbitrary code execution via eval()
 * 2. Access to global objects (window, document, process, etc.)
 * 3. Function calls and constructor injection
 * 4. Prototype pollution and property access
 * 5. Control flow manipulation
 *
 * The validation should allow only safe mathematical and logical expressions while
 * blocking any patterns that could be exploited for malicious purposes.
 */

import { describe, it, expect } from 'vitest';
import { validateFormulaForEval, evaluateComputedField } from './fieldTypes';
import type { ComputedFieldConfig } from '$lib/types';

describe('fieldTypes - validateFormulaForEval function', () => {
	describe('Safe Formulas - Simple Arithmetic', () => {
		it('should accept simple addition', () => {
			const formula = '10 + 5';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept simple subtraction', () => {
			const formula = '50 - 20';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept simple multiplication', () => {
			const formula = '5 * 10';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept simple division', () => {
			const formula = '100 / 4';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept expressions with parentheses', () => {
			const formula = '(10 + 5) * 2';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept complex arithmetic expressions', () => {
			const formula = '((10 + 5) * 2) - (8 / 4)';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});
	});

	describe('Safe Formulas - Comparison Operators', () => {
		it('should accept greater than comparison', () => {
			const formula = '5 > 3';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept less than comparison', () => {
			const formula = '3 < 5';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept equality comparison', () => {
			const formula = '5 == 5';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept inequality comparison', () => {
			const formula = '5 != 3';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept greater than or equal comparison', () => {
			const formula = '5 >= 5';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept less than or equal comparison', () => {
			const formula = '3 <= 5';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});
	});

	describe('Safe Formulas - Numeric Literals', () => {
		it('should accept positive integers', () => {
			const formula = '42';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept negative integers', () => {
			const formula = '-5 + 10';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept decimal numbers', () => {
			const formula = '3.14159 * 2';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept zero', () => {
			const formula = '0 + 1';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});
	});

	describe('Safe Formulas - Quoted Strings', () => {
		it('should accept double-quoted strings', () => {
			const formula = '"Hello" + " " + "World"';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept single-quoted strings', () => {
			const formula = "'Hello' + ' ' + 'World'";
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept strings with spaces', () => {
			const formula = '"Level 5 Wizard"';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept empty strings', () => {
			const formula = '""';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});
	});

	describe('Safe Formulas - Complex Expressions', () => {
		it('should accept formula with multiple operations and parentheses', () => {
			const formula = '((10 + 5) * 2) / 3 + 7';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept formula with mixed comparison and arithmetic', () => {
			const formula = '(10 + 5) > (3 * 4)';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept formula with string concatenation and arithmetic', () => {
			const formula = '"Result: " + (5 + 3)';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});
	});

	describe('Dangerous Patterns - Function Calls', () => {
		it('should reject alert() function call', () => {
			const formula = 'alert(1)';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('function call');
		});

		it('should reject eval() function call', () => {
			const formula = 'eval("malicious code")';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('function call');
		});

		it('should reject console.log() function call', () => {
			const formula = 'console.log("attack")';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('function call');
		});

		it('should reject Function() constructor', () => {
			const formula = 'Function("return alert(1)")()';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toMatch(/function call|constructor/i);
		});

		it('should reject setTimeout', () => {
			const formula = 'setTimeout(alert, 100)';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('function call');
		});

		it('should reject setInterval', () => {
			const formula = 'setInterval(() => {}, 100)';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toMatch(/function call|arrow function/i);
		});

		it('should reject arbitrary function names', () => {
			const formula = 'someFunction(123)';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('function call');
		});

		it('should reject Math functions that could be exploited', () => {
			const formula = 'Math.random()';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toMatch(/property access|function call/i);
		});
	});

	describe('Dangerous Patterns - Property Access', () => {
		it('should reject window.location access', () => {
			const formula = 'window.location';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('property access');
		});

		it('should reject document.cookie access', () => {
			const formula = 'document.cookie';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('property access');
		});

		it('should reject __proto__ access', () => {
			const formula = '{}.__proto__';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toMatch(/property access|object literal/i);
		});

		it('should reject constructor access', () => {
			const formula = '[].constructor';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toMatch(/property access|array literal/i);
		});

		it('should reject prototype access', () => {
			const formula = 'Object.prototype';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('property access');
		});

		it('should reject process.env access', () => {
			const formula = 'process.env.SECRET';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('property access');
		});

		it('should reject global object access', () => {
			const formula = 'global.something';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('property access');
		});

		it('should reject bracket notation property access', () => {
			const formula = 'window["location"]';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('property access');
		});
	});

	describe('Dangerous Patterns - JavaScript Keywords', () => {
		it('should reject function keyword', () => {
			const formula = 'function() { return 1; }';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject return keyword', () => {
			const formula = 'return 1';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject var keyword', () => {
			const formula = 'var x = 1';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject let keyword', () => {
			const formula = 'let x = 1';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject const keyword', () => {
			const formula = 'const x = 1';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject new keyword', () => {
			const formula = 'new Date()';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject this keyword', () => {
			const formula = 'this.value';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toMatch(/keyword|property access/i);
		});

		it('should reject import keyword', () => {
			const formula = 'import("module")';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject export keyword', () => {
			const formula = 'export default 1';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject class keyword', () => {
			const formula = 'class MyClass {}';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject async keyword', () => {
			const formula = 'async () => {}';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toMatch(/keyword|arrow function/i);
		});

		it('should reject await keyword', () => {
			const formula = 'await promise';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject yield keyword', () => {
			const formula = 'yield value';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});
	});

	describe('Dangerous Patterns - Template Literals', () => {
		it('should reject template literals with backticks', () => {
			const formula = '`template ${code}`';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('template literal');
		});

		it('should reject template literals with expressions', () => {
			const formula = '`Result: ${1 + 1}`';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('template literal');
		});

		it('should reject nested template literals', () => {
			const formula = '`outer ${`inner`}`';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('template literal');
		});
	});

	describe('Dangerous Patterns - Assignment Operators', () => {
		it('should reject assignment operator =', () => {
			const formula = 'x = 1';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('assignment');
		});

		it('should reject compound assignment +=', () => {
			const formula = 'x += 1';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('assignment');
		});

		it('should reject compound assignment -=', () => {
			const formula = 'x -= 1';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('assignment');
		});

		it('should reject compound assignment *=', () => {
			const formula = 'x *= 2';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('assignment');
		});

		it('should reject compound assignment /=', () => {
			const formula = 'x /= 2';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('assignment');
		});
	});

	describe('Dangerous Patterns - Array and Object Literals', () => {
		it('should reject array literals', () => {
			const formula = '[1, 2, 3]';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('array literal');
		});

		it('should reject empty array literals', () => {
			const formula = '[]';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('array literal');
		});

		it('should reject object literals', () => {
			const formula = '{a: 1, b: 2}';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('object literal');
		});

		it('should reject empty object literals', () => {
			const formula = '{}';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('object literal');
		});
	});

	describe('Dangerous Patterns - Control Flow', () => {
		it('should reject semicolons', () => {
			const formula = '1; 2';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('semicolon');
		});

		it('should reject if statements', () => {
			const formula = 'if (true) 1';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject for loops', () => {
			const formula = 'for(let i=0; i<10; i++)';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject while loops', () => {
			const formula = 'while(true)';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject switch statements', () => {
			const formula = 'switch(x) { case 1: break; }';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});

		it('should reject try-catch blocks', () => {
			const formula = 'try { 1 } catch(e) {}';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('keyword');
		});
	});

	describe('Dangerous Patterns - Comments', () => {
		it('should reject single-line comments', () => {
			const formula = '1 + 1 // comment';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('comment');
		});

		it('should reject multi-line comments', () => {
			const formula = '1 + /* comment */ 1';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('comment');
		});
	});

	describe('Edge Cases - Empty and Whitespace', () => {
		it('should accept empty formula', () => {
			const formula = '';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe('');
		});

		it('should accept whitespace-only formula', () => {
			const formula = '   ';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe('   ');
		});

		it('should accept formula with extra whitespace', () => {
			const formula = '  10  +  5  ';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe('  10  +  5  ');
		});
	});

	describe('Edge Cases - Decimal vs Property Access', () => {
		it('should accept decimal numbers with dot', () => {
			const formula = '3.14 + 2.5';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should reject identifier followed by dot', () => {
			const formula = 'obj.property';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('property access');
		});

		it('should accept multiple decimal numbers', () => {
			const formula = '1.5 + 2.3 + 3.7';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});
	});

	describe('Edge Cases - Comparison vs Assignment', () => {
		it('should accept == for comparison', () => {
			const formula = '5 == 5';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should reject single = for assignment', () => {
			const formula = 'x = 5';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(false);
			expect(result.error).toContain('assignment');
		});

		it('should accept != for inequality', () => {
			const formula = '5 != 3';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept >= for greater or equal', () => {
			const formula = '5 >= 3';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});

		it('should accept <= for less or equal', () => {
			const formula = '3 <= 5';
			const result = validateFormulaForEval(formula);

			expect(result.isValid).toBe(true);
			expect(result.sanitized).toBe(formula);
		});
	});
});

describe('fieldTypes - evaluateComputedField with security validation', () => {
	describe('Integration - Malicious Formula Injection', () => {
		it('should prevent alert() injection in formula', () => {
			const config: ComputedFieldConfig = {
				formula: 'alert(1)',
				dependencies: [],
				outputType: 'number'
			};

			const fields = {};

			expect(() => evaluateComputedField(config, fields)).toThrow(/validation failed|invalid formula/i);
		});

		it('should prevent eval() injection in formula', () => {
			const config: ComputedFieldConfig = {
				formula: 'eval("malicious")',
				dependencies: [],
				outputType: 'number'
			};

			const fields = {};

			expect(() => evaluateComputedField(config, fields)).toThrow(/validation failed|invalid formula/i);
		});

		it('should prevent property access injection in formula', () => {
			const config: ComputedFieldConfig = {
				formula: 'window.location',
				dependencies: [],
				outputType: 'text'
			};

			const fields = {};

			expect(() => evaluateComputedField(config, fields)).toThrow(/validation failed|invalid formula/i);
		});

		it('should prevent constructor access via formula', () => {
			const config: ComputedFieldConfig = {
				formula: '[].constructor',
				dependencies: [],
				outputType: 'text'
			};

			const fields = {};

			expect(() => evaluateComputedField(config, fields)).toThrow(/validation failed|invalid formula/i);
		});
	});

	describe('Integration - Malicious Field Value Injection', () => {
		it('should safely handle field values with quotes', () => {
			const config: ComputedFieldConfig = {
				formula: '10 + 5',
				dependencies: [],
				outputType: 'number'
			};

			// Even though the formula itself is safe, ensure field value injection is also prevented
			const fields = {};
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(15);
		});

		it('should prevent code injection via field values containing semicolons', () => {
			const config: ComputedFieldConfig = {
				formula: '"Name: " + "test"',
				dependencies: [],
				outputType: 'text'
			};

			const fields = {};
			const result = evaluateComputedField(config, fields);

			// Should not allow the semicolon to execute additional code
			expect(result).toBe('Name: test');
		});
	});

	describe('Integration - Real-world Attack Vectors', () => {
		it('should prevent prototype pollution via __proto__', () => {
			const config: ComputedFieldConfig = {
				formula: '{}.__proto__.polluted = "yes"',
				dependencies: [],
				outputType: 'text'
			};

			const fields = {};

			expect(() => evaluateComputedField(config, fields)).toThrow(/validation failed|invalid formula/i);
		});

		it('should prevent constructor hijacking', () => {
			const config: ComputedFieldConfig = {
				formula: '[].constructor.constructor("alert(1)")()',
				dependencies: [],
				outputType: 'text'
			};

			const fields = {};

			expect(() => evaluateComputedField(config, fields)).toThrow(/validation failed|invalid formula/i);
		});

		it('should prevent import() dynamic imports', () => {
			const config: ComputedFieldConfig = {
				formula: 'import("./malicious")',
				dependencies: [],
				outputType: 'text'
			};

			const fields = {};

			expect(() => evaluateComputedField(config, fields)).toThrow(/validation failed|invalid formula/i);
		});

		it('should prevent Function constructor usage', () => {
			const config: ComputedFieldConfig = {
				formula: 'Function("return alert(1)")()',
				dependencies: [],
				outputType: 'text'
			};

			const fields = {};

			expect(() => evaluateComputedField(config, fields)).toThrow(/validation failed|invalid formula/i);
		});

		it('should prevent nested eval via template literals', () => {
			const config: ComputedFieldConfig = {
				formula: '`${eval("1+1")}`',
				dependencies: [],
				outputType: 'text'
			};

			const fields = {};

			expect(() => evaluateComputedField(config, fields)).toThrow(/validation failed|invalid formula/i);
		});

		it('should prevent accessing global objects via bracket notation', () => {
			const config: ComputedFieldConfig = {
				formula: 'this["constructor"]["constructor"]("alert(1)")()',
				dependencies: [],
				outputType: 'text'
			};

			const fields = {};

			expect(() => evaluateComputedField(config, fields)).toThrow(/validation failed|invalid formula/i);
		});
	});

	describe('Integration - Safe Formulas Should Still Work', () => {
		it('should allow safe arithmetic formulas after validation', () => {
			const config: ComputedFieldConfig = {
				formula: '10 + 5',
				dependencies: [],
				outputType: 'number'
			};

			const fields = {};
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(15);
		});

		it('should allow safe comparison formulas after validation', () => {
			const config: ComputedFieldConfig = {
				formula: '10 > 5',
				dependencies: [],
				outputType: 'boolean'
			};

			const fields = {};
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(true);
		});

		it('should allow safe string concatenation after validation', () => {
			const config: ComputedFieldConfig = {
				formula: '"Hello" + " " + "World"',
				dependencies: [],
				outputType: 'text'
			};

			const fields = {};
			const result = evaluateComputedField(config, fields);

			expect(result).toBe('Hello World');
		});

		it('should allow complex safe formulas after validation', () => {
			const config: ComputedFieldConfig = {
				formula: '((10 + 5) * 2) - (8 / 4)',
				dependencies: [],
				outputType: 'number'
			};

			const fields = {};
			const result = evaluateComputedField(config, fields);

			expect(result).toBe(28);
		});
	});
});
