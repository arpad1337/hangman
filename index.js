const readline = require('readline');
const fs = require('fs');
const EventEmitter = require('events').EventEmitter;

const HANGMAN_EVENTS = {
    GAME_OVER: 'GAME_OVER'
};

class Hangman extends EventEmitter {
    constructor(readlineProvider, wordToGuess = "testing", guessesLeft = 5) {
        super();
        this.rl = readlineProvider;
        this.wordCount = wordToGuess.split(' ').length;
        this.guessesLeft = guessesLeft;
        this.originalWordToGuess = wordToGuess;
        this.wordToGuess = wordToGuess.toLowerCase();
        this.guessedWord = new Array(this.wordToGuess.length).fill('_').map((_, index) => {
            return (wordToGuess.charAt(index) === ' ') ? ' ' : '_';
        }).join('');
    }

    start() {
        if (this.wordCount > 1) {
            console.log(`Guess ${this.wordCount} word(s), you have ${this.guessesLeft} guesses left.`);
        } else {
            console.log(`Guess a ${this.wordToGuess.length} character long word, you have ${this.guessesLeft} guesses left.`);
        }
        this._continue();
    }

    _processLetter(originalLetter) {
        if (originalLetter.length !== 1) {
            console.error(`You should only pass 1 character at a time\n`);
        }
        const letter = originalLetter.toLowerCase();
        if (this.wordToGuess.indexOf(letter) > -1) {
            const newGuessedWordAsArray = this.guessedWord.split('');
            this.wordToGuess.split('').forEach((char, index) => {
                if (char === letter) {
                    newGuessedWordAsArray[index] = this.originalWordToGuess.charAt(index);
                }
            });
            this.guessedWord = newGuessedWordAsArray.join('');
            if (this.guessedWord === this.wordToGuess) {
                this._playerWon();
                return;
            }
            this._continue();
            return;
        }
        this._letterNotFound();
    }

    _letterNotFound() {
        this.guessesLeft--;
        if (this.guessesLeft === 0) {
            this._playerLost();
            return;
        }
        this._continue();
    }

    _continue() {
        console.log(`Current word: ${this.guessedWord}, remaining quesses: ${this.guessesLeft}`);
        this.rl.question(`Guess a letter:`, (letter) => {
            this._processLetter(letter.trim());
        });
    }

    _playerWon() {
        console.log(`You won!. The word was ${this.originalWordToGuess}`);
        this.emit(HANGMAN_EVENTS.GAME_OVER, true);
    }

    _playerLost() {
        console.log(`Game over. The word was ${this.originalWordToGuess}`);
        this.emit(HANGMAN_EVENTS.GAME_OVER, false);
    }
}

if (require.main === module) {
    const wordsFromFile = fs.readFileSync('words.txt').toString().split('\n');

    const wordsToGuess = [];
    for(let i = 0; i < 3; i++) {
        wordsToGuess.push(wordsFromFile[Math.floor((Math.random() * wordsFromFile.length))]);
    }

    const words = wordsToGuess.join(' ');

    const readlineProvider = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const game = new Hangman(readlineProvider, words);

    game.on(HANGMAN_EVENTS.GAME_OVER, (_) => {
        process.exit(0);
    });

    game.start();
} else {
    module.exports = Hangman;
}