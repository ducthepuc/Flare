import React from 'react';
import Editor from "@monaco-editor/react";

export function ExampleCode({
    code,
    onChange
}) {
    return (
        <div>
            <h4>Example Code</h4>
            <div className="mb-2">
                <Editor
                    defaultLanguage="python"
                    width="100%"
                    height="250px"
                    onChange={onChange}
                    options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        contextmenu: true
                    }}
                    value={code}
                    theme="vs-dark"
                />
            </div>
        </div>
    );
} 