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
        KeyEvent            = brackets.getModule("utils/KeyEvent"),
        StringUtils         = brackets.getModule("utils/StringUtils");
    
    // Features:
    // - Pressing Enter inside a block comment automatically inserts a correctly indented "*" prefix on the new line
    
    // TODO:
    // - typing /* should auto-insert */ after cursor
    //
    // - pressing enter just after /* or /** should insert "\n<prefix>* \n<prefix> */" and place cursor on middle line -- ONLY IF
    //   there's either (a) no */ found before EOF, or there's another /* found before the first */ is encountered (i.e. only if
    //   the comment opened here doesn't appear to have been closed yet)
    //
    // - pressing enter just after /** (or just typing the second "*"?) should include auto-generated "@param {} <argname>" blocks
    //   if next line includes function-like code (via regexp)
    //   (see https://github.com/davidderaedt/annotate-extension ?)
    //
    // - gesture to re-word-wrap a comment block
    //
    // - pressing enter in *middle* of //-style comment should split it onto second line with // prefix
    
    
    function handleEnterKey(editor) {
        var cursor = editor.getCursorPos();
        var token = editor._codeMirror.getTokenAt(cursor);
//        console.log(token);
        
        if (token.className === "comment") {
            // But are we in a BLOCK comment?
            // For now, we do a dumb approximation: does the line start with /* or *, and the last chars to left of cursor aren't */ ?
            var line = editor.document.getLine(cursor.line);
            var prefixMatch = line.match(/^\s*(\*|\/\*)/);
            if (prefixMatch) {
                if (!StringUtils.endsWith(token.string, "*/") || cursor.ch < token.end) {
                    var prefix;
                    if (prefixMatch[1] === "*") {
                        prefix = prefixMatch[0];
                    } else {
                        prefix = prefixMatch[0].replace("/", " "); // if on first line, don't reinsert /* on 2nd line
                    }
                    editor.document.replaceRange("\n" + prefix + " ", cursor);
                    return true;
                }
            }
        }
    }
    
    function handleKeyPress(event) {
        if (event.keyCode === KeyEvent.DOM_VK_RETURN) {
            var editor = EditorManager.getFocusedEditor();
            if (editor) {
                if (editor.getModeForSelection() === "javascript") { // start with just JS... later should do anything block-commentable
                    if (handleEnterKey(editor)) {
                        event.stopPropagation(); // don't let CM also handle it
                        event.preventDefault();  // including via natively editing its hidden textarea
                    }
                }
            }
        }
    }
    

    // Attach Enter key listener
    $("#editor-holder")[0].addEventListener("keydown", handleKeyPress, true);
    
});