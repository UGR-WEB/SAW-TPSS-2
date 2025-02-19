import { questions } from './questions.js';

export class Quiz {
    constructor() {
        // Sabit değerler
        this.questions = questions;
        this.totalLevels = 3;
        this.questionsPerLevel = 20;
        this.timePerQuestion = 25;
        this.pointsPerQuestion = 5;
        this.passingScore = 70;

        // Durum değişkenleri
        this.currentLevel = 1;
        this.currentQuestion = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = this.timePerQuestion;
        this.userAnswers = new Array(this.questionsPerLevel).fill(null);

        // DOM elementlerini başlat
        this.initializeElements();
        
        // Event listener'ları ekle
        this.initializeEventListeners();
        
        // Warning overlay'i oluştur
        this.createWarningOverlay();
        
        // İlk soruyu yükle
        this.loadQuestion();
        this.startTimer();
    }

    initializeElements() {
        // Quiz elementleri
        this.quizContainer = document.querySelector('.container');
        this.resultContainer = document.getElementById('result-container');
        
        // Bilgi elementleri
        this.levelElement = document.getElementById('level');
        this.questionNumberElement = document.getElementById('question-number');
        this.scoreElement = document.getElementById('score');
        this.timeElement = document.getElementById('time');
        
        // Soru elementleri
        this.questionImage = document.getElementById('question-image');
        this.optionsContainer = document.getElementById('options');
        this.marker = document.getElementById('marker');
        
        // Navigasyon butonları
        this.prevButton = document.getElementById('prev-btn');
        this.nextButton = document.getElementById('next-btn');
    }

    initializeEventListeners() {
        this.prevButton.addEventListener('click', () => this.previousQuestion());
        this.nextButton.addEventListener('click', () => this.nextQuestion());
        
        // Resim üzerine tıklama
        this.questionImage.parentElement.addEventListener('click', (e) => {
            if (this.userAnswers[this.currentQuestion]?.option !== 'Bagaj TEMİZ') {
                const rect = e.target.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.placeMarker(x, y);
            }
        });
    }

    createWarningOverlay() {
        this.warningOverlay = document.querySelector('.warning-overlay');
    }

    loadQuestion() {
        const currentLevelQuestions = this.questions.find(l => l.level === this.currentLevel);
        const question = currentLevelQuestions.questions[this.currentQuestion];

        // Resmi yükle
        const img = new Image();
    img.onload = () => {
        this.questionImage.src = img.src;
        console.log('Resim başarıyla yüklendi:', question.image);
    };
    img.onerror = (error) => {
        console.error('Resim yüklenemedi:', question.image, error);
        this.questionImage.src = ''; // Hata durumunda boş resim
    };
    img.src = question.image;
        
        // Bilgileri güncelle
        this.levelElement.textContent = this.currentLevel;
        this.questionNumberElement.textContent = this.currentQuestion + 1;
        
        // Seçenekleri yükle
        this.loadOptions(question.options);
        
        // Marker'ı sıfırla
        this.marker.classList.add('hidden');
        
        // Önceki cevabı geri yükle
        this.restoreUserAnswer();
        
        // Navigasyon butonlarını güncelle
        this.updateNavigationButtons();
    }

    loadOptions(options) {
        this.optionsContainer.innerHTML = '';
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option;
            button.addEventListener('click', () => this.handleOptionClick(button));
            this.optionsContainer.appendChild(button);
        });
    }

    handleOptionClick(button) {
        const buttons = this.optionsContainer.querySelectorAll('.option-btn');
        buttons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');

        const selectedOption = button.textContent;
        
        if (selectedOption === 'Bagaj TEMİZ') {
            this.marker.classList.add('hidden');
        }

        this.userAnswers[this.currentQuestion] = {
            option: selectedOption,
            marked: selectedOption === 'Bagaj TEMİZ' ? true : false
        };

        this.updateNavigationButtons();
    }

    placeMarker(x, y) {
        this.marker.style.left = `${x}px`;
        this.marker.style.top = `${y}px`;
        this.marker.classList.remove('hidden');
        
        if (this.userAnswers[this.currentQuestion]) {
            this.userAnswers[this.currentQuestion].marked = true;
        }
        
        this.updateNavigationButtons();
    }

    restoreUserAnswer() {
        const answer = this.userAnswers[this.currentQuestion];
        if (!answer) return;

        const button = Array.from(this.optionsContainer.querySelectorAll('.option-btn'))
            .find(btn => btn.textContent === answer.option);
        if (button) {
            button.classList.add('selected');
        }
    }

    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timeLeft = this.timePerQuestion;
        this.updateTimer();

        this.timer = setInterval(() => {
            this.timeLeft--;
            this.updateTimer();

            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.nextQuestion();
            }
        }, 1000);
    }

    updateTimer() {
        this.timeElement.textContent = this.timeLeft;
        
        if (this.timeLeft <= 10) {
            this.timeElement.parentElement.classList.add('warning');
            this.warningOverlay.classList.add('active');
        } else {
            this.timeElement.parentElement.classList.remove('warning');
            this.warningOverlay.classList.remove('active');
        }
    }

    resetTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        this.startTimer();
    }

    updateNavigationButtons() {
        this.prevButton.disabled = this.currentQuestion === 0;
        this.nextButton.disabled = !this.canProceedToNext();
    }

    canProceedToNext() {
        const answer = this.userAnswers[this.currentQuestion];
        if (!answer) return false;
        
        if (answer.option === 'Bagaj TEMİZ') return true;
        return answer.marked === true;
    }

    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.loadQuestion();
            this.resetTimer();
        }
    }

    nextQuestion() {
        if (this.currentQuestion < this.questionsPerLevel - 1) {
            if (this.checkAnswer()) {
                this.score += this.pointsPerQuestion;
                this.scoreElement.textContent = this.score;
            }
            this.currentQuestion++;
            this.loadQuestion();
            this.resetTimer();
        } else {
            this.showResults();
        }
    }

    checkAnswer() {
        const level = this.questions.find(l => l.level === this.currentLevel);
        const question = level.questions[this.currentQuestion];
        const userAnswer = this.userAnswers[this.currentQuestion];

        if (!userAnswer) return false;
        return userAnswer.option === question.correctOption;
    }

    showResults() {
        if (this.timer) {
            clearInterval(this.timer);
        }

        this.quizContainer.classList.add('hidden');
        this.resultContainer.classList.remove('hidden');

        const finalScore = this.score;
        const maxScore = this.questionsPerLevel * this.pointsPerQuestion;
        const scorePercentage = (finalScore / maxScore) * 100;

        document.getElementById('result-level').textContent = this.currentLevel;
        document.getElementById('final-score').textContent = 
            `${finalScore} / ${maxScore} (${scorePercentage.toFixed(1)}%)`;

        const passed = scorePercentage >= this.passingScore;
        const passFailText = document.getElementById('pass-fail-text');
        const nextLevelBtn = document.getElementById('next-level-btn');
        const retryBtn = document.getElementById('retry-btn');

        nextLevelBtn.classList.add('hidden');
        retryBtn.classList.add('hidden');

        if (passed) {
            passFailText.textContent = 'Tebrikler! Seviyeyi başarıyla tamamladınız.';
            if (this.currentLevel < this.totalLevels) {
                nextLevelBtn.classList.remove('hidden');
                nextLevelBtn.onclick = () => this.nextLevel();
            } else {
                passFailText.textContent = 'Tebrikler! Tüm seviyeleri tamamladınız!';
                retryBtn.textContent = 'Baştan Başla';
                retryBtn.classList.remove('hidden');
                retryBtn.onclick = () => this.restartQuiz();
            }
        } else {
            passFailText.textContent = 'Üzgünüm, seviyeyi geçemediniz. Tekrar deneyiniz.';
            retryBtn.textContent = 'Tekrar Dene';
            retryBtn.classList.remove('hidden');
            retryBtn.onclick = () => this.retryLevel();
        }
    }

    nextLevel() {
        this.currentLevel++;
        this.currentQuestion = 0;
        this.score = 0;
        this.userAnswers = new Array(this.questionsPerLevel).fill(null);
        
        this.resultContainer.classList.add('hidden');
        this.quizContainer.classList.remove('hidden');
        
        this.loadQuestion();
        this.startTimer();
    }

    retryLevel() {
        this.currentQuestion = 0;
        this.score = 0;
        this.userAnswers = new Array(this.questionsPerLevel).fill(null);
        
        this.resultContainer.classList.add('hidden');
        this.quizContainer.classList.remove('hidden');
        
        this.loadQuestion();
        this.startTimer();
    }

    restartQuiz() {
        this.currentLevel = 1;
        this.currentQuestion = 0;
        this.score = 0;
        this.userAnswers = new Array(this.questionsPerLevel).fill(null);
        
        this.resultContainer.classList.add('hidden');
        this.quizContainer.classList.remove('hidden');
        
        this.loadQuestion();
        this.startTimer();
    }

    cleanup() {
        if (this.timer) {
            clearInterval(this.timer);
        }
    }
}