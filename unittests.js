/*
 * Copyright (c) 2013 Peter Flynn.
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */


/*jslint vars: true, plusplus: true, devel: true, browser: true, nomen: true, indent: 4 */
/*global define, brackets, describe, it, expect, beforeEach, afterEach */

define(function (require, exports, module) {
    "use strict";

    // Modules from the SpecRunner window
    var SpecRunnerUtils  = brackets.getModule("spec/SpecRunnerUtils");
    
    // Extension module to test
    var main = require("main");
    
    
    /**
     * @param {string} string  Containing "|" cursor position indicator
     * @return {pos: {line:number, ch:number}, string: string}
     */
    function unpack(string) {
        var cursorI = string.indexOf("|");
        expect(cursorI).toBeGreaterThan(-1);
        expect(string.indexOf("|", cursorI + 1)).toBe(-1);
        
        var line = 0, lineStart = -1;
        while (lineStart < cursorI) {
            var nextLine = string.indexOf("\n", lineStart + 1);
            if (nextLine === -1 || nextLine > cursorI) {
                break;
            } else {
                line++;
                lineStart = nextLine;
            }
        }
        
        return {
            pos: { line: line, ch: cursorI - lineStart - 1 },
            string: string.substr(0, cursorI) + string.substr(cursorI + 1)
        };
    }
    
    function test(beforeShorthand, afterShorthand) {
        var before = unpack(beforeShorthand);
        var after = unpack(afterShorthand);
        
        var mock = SpecRunnerUtils.createMockEditor(before.string, "javascript");
        mock.editor.setCursorPos(before.pos.line, before.pos.ch);
        var handled = main.handleEnterKey(mock.editor);
        expect(handled).toBeTruthy();
        
        expect(mock.editor.document.getText()).toEqual(after.string);
        expect(mock.editor.getCursorPos()).toEqual(after.pos);
        
        SpecRunnerUtils.destroyMockEditor(mock.doc);
    }
    
    function expectPass(beforeShorthand) {
        var before = unpack(beforeShorthand);
        
        var mock = SpecRunnerUtils.createMockEditor(before.string, "javascript");
        mock.editor.setCursorPos(before.pos.line, before.pos.ch);
        var handled = main.handleEnterKey(mock.editor);
        expect(handled).toBeFalsy();
        
        expect(mock.editor.document.getText()).toEqual(before.string);
        expect(mock.editor.getCursorPos()).toEqual(before.pos);
        
        SpecRunnerUtils.destroyMockEditor(mock.doc);
    }
    

    describe("[pf] Reasonable comments", function () {
        
        it("self-test", function () {
            expect(unpack("|foo")).toEqual({ pos: {line: 0, ch: 0}, string: "foo" });
            expect(unpack("f|oo")).toEqual({ pos: {line: 0, ch: 1}, string: "foo" });
            expect(unpack("foo|")).toEqual({ pos: {line: 0, ch: 3}, string: "foo" });
            expect(unpack("|foo\n")).toEqual({ pos: {line: 0, ch: 0}, string: "foo\n" });
            expect(unpack("f|oo\n")).toEqual({ pos: {line: 0, ch: 1}, string: "foo\n" });
            expect(unpack("foo|\n")).toEqual({ pos: {line: 0, ch: 3}, string: "foo\n" });
            expect(unpack("\n|foo")).toEqual({ pos: {line: 1, ch: 0}, string: "\nfoo" });
            expect(unpack("\nf|oo")).toEqual({ pos: {line: 1, ch: 1}, string: "\nfoo" });
            expect(unpack("\nfoo|")).toEqual({ pos: {line: 1, ch: 3}, string: "\nfoo" });
            expect(unpack("foo\n|bar")).toEqual({ pos: {line: 1, ch: 0}, string: "foo\nbar" });
            expect(unpack("foo\nb|ar")).toEqual({ pos: {line: 1, ch: 1}, string: "foo\nbar" });
            expect(unpack("foo\nbar|")).toEqual({ pos: {line: 1, ch: 3}, string: "foo\nbar" });
        });
        
        
        // Newline in existing comment ------------------------------------------------------------

        it("simple test", function () {
            var bef, aft;
            
            bef = "/*|\n" +
                  " */";
            aft = "/*\n" +
                  " * |\n" +
                  " */";
            test(bef, aft);
            
            bef = "/**|\n" +
                  " */";
            aft = "/**\n" +
                  " * |\n" +
                  " */";
            test(bef, aft);
        });
        
        it("middle of comment", function () {
            var bef, aft;
            
            bef = "/*\n" +
                  " * |\n" +
                  " */";
            aft = "/*\n" +
                  " * \n" +
                  " * |\n" +
                  " */";
            test(bef, aft);
            
            bef = "/**\n" +
                  " * |\n" +
                  " */";
            aft = "/**\n" +
                  " * \n" +
                  " * |\n" +
                  " */";
            test(bef, aft);
        });
            
        it("proper indent", function () {
            var bef, aft;
            
            bef = "    /*|\n" +
                  "     */";
            aft = "    /*\n" +
                  "     * |\n" +
                  "     */";
            test(bef, aft);
            
            bef = "    /**\n" +
                  "     * |\n" +
                  "     */";
            aft = "    /**\n" +
                  "     * \n" +
                  "     * |\n" +
                  "     */";
            test(bef, aft);
        });
        
        it("cursor after text", function () {
            var bef, aft;
            
            bef = "/* here is text|\n" +
                  " */";
            aft = "/* here is text\n" +
                  " * |\n" +
                  " */";
            test(bef, aft);
            
            bef = "/* here is text|\n" +
                  " * and more\n" +
                  " */";
            aft = "/* here is text\n" +
                  " * |\n" +
                  " * and more\n" +
                  " */";
            test(bef, aft);
            
            bef = "/**\n" +
                  " * here is text|\n" +
                  " */";
            aft = "/**\n" +
                  " * here is text\n" +
                  " * |\n" +
                  " */";
            test(bef, aft);
        });
            
        it("cursor in mid-text", function () {
            var bef, aft;
            
            bef = "/**\n" +
                  " * foo|bar\n" +
                  " */";
            aft = "/**\n" +
                  " * foo\n" +
                  " * |bar\n" +
                  " */";
            test(bef, aft);
            
            // Note less than ideal whitespace in these next several cases...
            bef = "/**\n" +
                  " * here is |text\n" +
                  " */";
            aft = "/**\n" +
                  " * here is \n" +
                  " * |text\n" +
                  " */";
            test(bef, aft);
            
            bef = "/**\n" +
                  " * here is| text\n" +
                  " */";
            aft = "/**\n" +
                  " * here is\n" +
                  " * | text\n" +
                  " */";
            test(bef, aft);
            
            bef = "/**\n" +
                  " * here is |text\n" +
                  " * and more\n" +
                  " */";
            aft = "/**\n" +
                  " * here is \n" +
                  " * |text\n" +
                  " * and more\n" +
                  " */";
            test(bef, aft);
            
            bef = "/**\n" +
                  " * |here is text\n" +
                  " */";
            aft = "/**\n" +
                  " * \n" +
                  " * |here is text\n" +
                  " */";
            test(bef, aft);
            
            bef = "/* te|xt\n" +
                  " */";
            aft = "/* te\n" +
                  " * |xt\n" +
                  " */";
            test(bef, aft);
        });
        
        it("inside single-line comment", function () {
            var bef, aft;
            
            bef = "/*|*/";
            aft = "/*\n" +
                  " * |*/";
            test(bef, aft);
            
            bef = "/* | */";
            aft = "/* \n" +
                  " * | */";
            test(bef, aft);
            
            bef = "/* foo |bar */";
            aft = "/* foo \n" +
                  " * |bar */";
            test(bef, aft);
        });
        
        it("don't interfere with typing outside comment bounds", function () {
            var bef, aft;
            
            bef = "foo();| /* bar */";
            expectPass(bef);
            
            bef = "|/*\n" +
                  " * foo\n" +
                  " */\n" +
                  "bar();";
            expectPass(bef);
            
            bef = "/*\n" +
                  " * foo\n" +
                  " */|\n" +
                  "bar();";
            expectPass(bef);
        });
        
        it("don't interfere with typing inside commented-out code", function () {
            var bef, aft;
            
            bef = "/*\n" +
                  "|foo();\n" +
                  "bar();\n" +
                  "*/\n" +
                  "blah();";
            expectPass(bef);
            
            bef = "/*\n" +
                  "foo();|\n" +
                  "bar();\n" +
                  "*/\n" +
                  "blah();";
            expectPass(bef);
        });


        // Closing a comment ----------------------------------------------------------------------

        it("unclosed at end of document", function () {
            var bef, aft;
            
            bef = "/*|";
            aft = "/*\n" +
                  " * |\n" +
                  " */";
            test(bef, aft);
            
            bef = "/**|";
            aft = "/**\n" +
                  " * |\n" +
                  " */";
            test(bef, aft);
            
            bef = "/* foo|";
            aft = "/* foo\n" +
                  " * |\n" +
                  " */";
            test(bef, aft);
        });
        
        it("unclosed, followed by other comment", function () {
            var bef, aft;
            
            bef = "/*|\n" +
                  "foo();\n" +
                  "/* comment */\n" +
                  "bar();";
            aft = "/*\n" +
                  " * |\n" +
                  " */\n" +
                  "foo();\n" +
                  "/* comment */\n" +
                  "bar();";
            test(bef, aft);
        });
        
        it("closed, followed by other comment", function () {
            var bef, aft;
            
            bef = "/*|\n" +
                  "foo();*/\n" +
                  "/* comment */\n" +
                  "bar();";
            aft = "/*\n" +
                  " * |\n" +
                  "foo();*/\n" +
                  "/* comment */\n" +
                  "bar();";
            test(bef, aft);
        });
        


    }); // top-level describe()
    
});
