/*
 * Copyright (c) 2012 Peter Flynn.
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


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, brackets, $ */

define(function (require, exports, module) {
    "use strict";
    
    // Brackets modules
    var EditorManager       = brackets.getModule("editor/EditorManager"),
        DocumentManager     = brackets.getModule("document/DocumentManager"),
        TokenUtils          = brackets.getModule("utils/TokenUtils"),
        KeyEvent            = brackets.getModule("utils/KeyEvent"),
        StringUtils         = brackets.getModule("utils/StringUtils");
    
    // Features:
    // - Pressing Enter inside a block comment automatically inserts a correctly indented "*" prefix on the new line
    // - Pressing Enter after /* automatically inserts the closing */ on the line after the cursor (so 2 new lines are inserted, total)
    //   (only if closing */ isn't already present)
    
    
    // TODO:
    // - typing /* should auto-insert */ after cursor
    //
    // - pressing Enter in `/* | foo` should keep the "foo" part (text from cursor to end of line) inside the comment
    //   (issue #2)
    //
    // - pressing enter just after /** (or just typing the second "*"?) should include auto-generated "@param {} <argname>" blocks
    //   if next line includes function-like code (via regexp)
    //   (see https://github.com/davidderaedt/annotate-extension ?)
    //
    // - pressing forward-delete at end of line inside a comment should delete comment prefix from next line as it gets merged with
    //   (appended to) current line
    //
    // - gesture to re-word-wrap a comment block
    //
    // - pressing enter in *middle* of //-style comment should split it onto second line with // prefix
    
    
    function handleEnterKey(editor) {
        var cursor = editor.getCursorPos();
        var token = editor._codeMirror.getTokenAt(cursor);
//        console.log(token);
        
        if (token.type === "comment") {
            // But are we in a BLOCK comment?
            // For now, we do a dumb approximation: does the line start with /* or *, and the last chars to left of cursor aren't */ ?
            var line = editor.document.getLine(cursor.line);
            var prefixMatch = line.match(/^\s*(\*|\/\*)/);
            if (prefixMatch) {
                if (!StringUtils.endsWith(token.string, "*/") || cursor.ch < token.end) {
                    var prefix, suffix;
                    if (prefixMatch[1] === "*") {
                        // Line other than first line
                        prefix = prefixMatch[0];
                        suffix = "";
                    } else {
                        // First line
                        prefix = prefixMatch[0].replace("/", " "); // don't reinsert /* on 2nd line
                        
                        // If comment doesn't appear to be closed, also insert */ on the line after the cursor. We assume this if
                        // there's either no */ found before EOF, or there's another /* found before the first */ is encountered
                        var restOfDoc = editor.document.getRange(cursor, { line: editor.lineCount(), ch: 0 });
                        var nextClose = restOfDoc.indexOf("*/");
                        var nextOpen  = restOfDoc.indexOf("/*");
                        if (nextClose === -1 || (nextClose > nextOpen && nextOpen !== -1)) {
                            suffix = "\n" + prefix + "/";
                        } else {
                            suffix = "";
                        }
                    }
                    editor.document.replaceRange("\n" + prefix + " " + suffix, cursor);
                    
                    cursor.line++;
                    cursor.ch = prefix.length + 1;
                    editor.setCursorPos(cursor.line, cursor.ch);
                    return true;
                }
            }
        }
    }
    
    function handleKeyPress(event) {
        if (event.keyCode === KeyEvent.DOM_VK_RETURN) {
            var editor = EditorManager.getFocusedEditor();
            if (editor) {
                // Only repond in block-commentable languages
                // (getModeAt() gets us the low-level mode, e.g. "css" rather than "text/x-less")
                var language = editor.getLanguageForSelection();
                if (language.getBlockCommentPrefix() === "/*" && language.getBlockCommentSuffix() === "*/") {
                    if (handleEnterKey(editor)) {
                        event.stopPropagation(); // don't let CM also handle it
                        event.preventDefault();  // including via natively editing its hidden textarea
                    }
                }
            }
        }
    }
    

    // Attach Enter key listener
    var editorHolder = $("#editor-holder")[0];
    if (editorHolder) {
        editorHolder.addEventListener("keydown", handleKeyPress, true);
    } else {
        console.warn("Unable to attach reasonable comments extension - assuming running in unit test window");
        // (could verify that by looking at the path the way ExtensionLoader does, but seems like overkill)
    }
    
    
    // For unit tests
    exports.handleEnterKey = handleEnterKey;
});