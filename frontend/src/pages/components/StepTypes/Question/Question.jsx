import React from 'react';
import { AnswerOption } from './AnswerOption.jsx';
import {motion} from 'framer-motion';

export function Question({
                             step,
                             stepIndex,
                             handleStepChange,
                             handleAnswerChange,
                             toggleCorrectAnswer,
                             removeAnswerOption,
                             addAnswerOption,
                         }) {
    return (
        <div>
            <h3>{step.questionType === 'true-false' ? 'True/False Question' : 'Multiple Choice Question'}</h3>
            <motion.input
                type="text"
                placeholder="Question Text"
                value={step.questionText}
                onChange={(e) => handleStepChange(stepIndex, 'questionText', e.target.value)}
                style={{
                    width: '66%',
                    padding: '12px',
                    marginBottom: '16px',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    backgroundColor: '#333333',
                    color: 'white',
                    outline: 'none',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    fontSize: '16px',
                }}
                whileHover={{
                    backgroundColor: '#444444',
                }}
                whileFocus={{
                    backgroundColor: '#555555',
                    border: '1px solid #FF7F4F',
                }}
            />
            {step.answers.map((answer, answerIndex) => (
                <AnswerOption
                    key={answerIndex}
                    answer={answer}
                    index={answerIndex}
                    questionType={step.questionType}
                    onTextChange={(value) => handleAnswerChange(stepIndex, answerIndex, value)}
                    onCorrectChange={() => toggleCorrectAnswer(stepIndex, answerIndex)}
                    onRemove={() => removeAnswerOption(stepIndex, answerIndex)}
                />
            ))}
            <motion.button
                onClick={() => addAnswerOption(stepIndex)}
                style={{ padding: '10px 20px', cursor: 'pointer', background: 'radial-gradient(circle, rgba(10,96,214,1) 0%, rgba(0,14,255,1) 100%)', color:'white' }}
                whileHover={{scale: 1.1}}
            >
                Add Answer Option
            </motion.button>
        </div>
    );
}