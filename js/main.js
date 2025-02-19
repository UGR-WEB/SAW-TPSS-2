import { Quiz } from './Quiz.js';

document.addEventListener('DOMContentLoaded', () => {
    const quiz = new Quiz();
    
    window.addEventListener('beforeunload', () => {
        quiz.cleanup();
    });
});