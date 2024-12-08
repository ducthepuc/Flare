import React from 'react';
import Editor from "@monaco-editor/react";

export function AcceptedAnswers({
    answers,
    onAdd,
    onRemove,
    onChange
}) {
    return (
        <div>
            <h4>Accepted Answers</h4>
            {answers.map((answer, answerIndex) => (
                <div key={answerIndex} className="flex items-center mb-2">
                    <div style={{ width: '100%' }}>
                        <Editor
                            defaultLanguage="python"
                            width="100%"
                            height="250px"
                            onChange={(value) => onChange(answerIndex, value)}
                            options={{
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                contextmenu: true
                            }}
                            value={answer.code}
                            theme="vs-dark"
                        />
                    </div>
                    <button
                        onClick={() => onRemove(answerIndex)}
                        className="text-red-500 hover:text-red-700 ml-2"
                    >
                        X
                    </button>
                </div>
            ))}
            <button
                onClick={onAdd}
                className="px-4 py-2 mb-4 text-white bg-blue-500 rounded-md hover:bg-blue-600"
            >
                Add Accepted Answer
            </button>
        </div>
    );
}