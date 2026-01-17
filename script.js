const buttonColors = ["red", "blue", "green", "yellow"];

let gamePattern = [];
let userClickedPattern = [];
let started = false;
let level = 0;

document.addEventListener("keydown", () => {
    if (!started) {
        nextSequence();
        started = true;
    }
});

document.querySelectorAll(".btn").forEach(btn => {
    btn.addEventListener("click", function () {
        const userColor = this.id;
        userClickedPattern.push(userColor);
        playSound(userColor);
        animatePress(userColor);
        checkAnswer(userClickedPattern.length - 1);
    });
});

function nextSequence() {
    userClickedPattern = [];
    level++;
    document.getElementById("level-title").innerText = `Level ${level}`;

    const randomColor = buttonColors[Math.floor(Math.random() * 4)];
    gamePattern.push(randomColor);

    const btn = document.getElementById(randomColor);
    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 200);

    playSound(randomColor);
}

function checkAnswer(currentLevel) {
    if (gamePattern[currentLevel] === userClickedPattern[currentLevel]) {
        if (userClickedPattern.length === gamePattern.length) {
            setTimeout(nextSequence, 1000);
        }
    } else {
        playSound("wrong");
        document.body.classList.add("game-over");
        document.getElementById("level-title").innerText =
            "Game Over, Press Any Key to Restart";

        setTimeout(() => {
            document.body.classList.remove("game-over");
        }, 200);

        startOver();
    }
}

function playSound(name) {
    const audio = new Audio(`https://s3.amazonaws.com/freecodecamp/simonSound${buttonColors.indexOf(name) + 1}.mp3`);
    if (name === "wrong") {
        audio.src = "https://www.soundjay.com/button/sounds/button-10.mp3";
    }
    audio.play();
}

function animatePress(color) {
    const btn = document.getElementById(color);
    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 100);
}

function startOver() {
    level = 0;
    gamePattern = [];
    started = false;
}
