<<<<<<< HEAD
export const formatCourseData = (title, description, steps, tags) => {
=======
export const formatCourseData = (title, description, steps) => {
>>>>>>> 1311927426ed1e65952e143b703371fe5fe11e07
    return {
        title,
        description,
        tags: tags || [],
        elements: steps.map(step => {
            if (step.type === 'code-task') {
                return {
                    type: step.type,
                    task: step.task,
                    help: step.help,
                    exampleCode: step.exampleCode,
                    acceptedAnswers: step.acceptedAnswers.map(answer => answer.code)
                };
            } else if (step.type === 'lesson') {
                return {
                    type: 'lesson',
                    content: step.content.map(contentItem => ({
                        type: contentItem.type,
                        text: contentItem.text,
                    })),
                };
            } else if (step.type === 'question') {
                return {
                    type: 'question',
                    questionText: step.questionText,
                    answers: step.answers.map(answer => ({
                        text: answer.text,
                        correct: answer.correct,
                    })),
                };
            }
            return step;
        })
    };
};