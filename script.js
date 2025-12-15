// Pong simples
// Controles: mouse + setas para o paddle esquerdo. Direita = IA.
// Espaço = pause/resume. R = reset.

(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const leftScoreEl = document.getElementById('leftScore');
  const rightScoreEl = document.getElementById('rightScore');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');

  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;

  const paddleWidth = 12;
  const paddleHeight = 100;
  const paddleOffset = 20;
  const ballRadius = 9;
  const maxBounceAngle = Math.PI / 3;

  let leftScore = 0;
  let rightScore = 0;

  const leftPaddle = {
    x: paddleOffset,
    y: (HEIGHT - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 8,
    dy: 0,
  };

  const rightPaddle = {
    x: WIDTH - paddleOffset - paddleWidth,
    y: (HEIGHT - paddleHeight) / 2,
    width: paddleWidth,
    height: paddleHeight,
    speed: 5,
  };

  let ball = {
    x: WIDTH / 2,
    y: HEIGHT / 2,
    radius: ballRadius,
    speed: 6,
    dx: 6,
    dy: 0,
  };

  let running = false;
  let paused = false;
  let lastTime = null;
  let keys = { ArrowUp: false, ArrowDown: false };
  let mouseY = null;

  function resetBall(servingToRight = true) {
    ball.x = WIDTH / 2;
    ball.y = HEIGHT / 2;
    ball.speed = 6;
    const angle = (Math.random() * Math.PI / 4) - (Math.PI / 8);
    ball.dx = (servingToRight ? 1 : -1) * ball.speed * Math.cos(angle);
    ball.dy = ball.speed * Math.sin(angle);
  }

  function resetGame() {
    leftScore = 0;
    rightScore = 0;
    leftScoreEl.textContent = leftScore;
    rightScoreEl.textContent = rightScore;
    leftPaddle.y = (HEIGHT - paddleHeight) / 2;
    rightPaddle.y = (HEIGHT - paddleHeight) / 2;
    resetBall(true);
    paused = false;
    running = true;
    lastTime = null;
    pauseBtn.textContent = 'Pause';
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseY = e.clientY - rect.top;
    leftPaddle.y = mouseY - leftPaddle.height / 2;
    clampPaddles();
  });

  canvas.addEventListener('mouseenter', () => canvas.style.cursor = 'none');
  canvas.addEventListener('mouseleave', () => {
    canvas.style.cursor = 'default';
    mouseY = null;
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      togglePause();
      return;
    }
    if (e.key === 'r' || e.key === 'R') {
      resetGame();
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      keys[e.key] = true;
    }
  });
  window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      keys[e.key] = false;
    }
  });

  startBtn.addEventListener('click', () => resetGame());
  pauseBtn.addEventListener('click', togglePause);
  canvas.addEventListener('click', () => {
    if (!running) resetGame();
    else togglePause();
  });

  function togglePause() {
    if (!running) return;
    paused = !paused;
    pauseBtn.textContent = paused ? 'Resume' : 'Pause';
    if (!paused) {
      lastTime = null;
      requestAnimationFrame(loop);
    }
  }

  function clampPaddles() {
    if (leftPaddle.y < 0) leftPaddle.y = 0;
    if (leftPaddle.y + leftPaddle.height > HEIGHT) leftPaddle.y = HEIGHT - leftPaddle.height;
    if (rightPaddle.y < 0) rightPaddle.y = 0;
    if (rightPaddle.y + rightPaddle.height > HEIGHT) rightPaddle.y = HEIGHT - rightPaddle.height;
  }

  function update(dt) {
    if (mouseY === null) {
      if (keys.ArrowUp) leftPaddle.y -= leftPaddle.speed;
      if (keys.ArrowDown) leftPaddle.y += leftPaddle.speed;
      clampPaddles();
    }

    const reaction = 0.98;
    const targetY = ball.y - rightPaddle.height / 2;
    const diff = targetY - rightPaddle.y;
    let aiMove = diff * 0.12;
    aiMove = Math.max(-rightPaddle.speed, Math.min(rightPaddle.speed, aiMove));
    aiMove *= reaction;
    rightPaddle.y += aiMove;
    clampPaddles();

    ball.x += ball.dx;
    ball.y += ball.dy;

    if (ball.y - ball.radius <= 0) {
      ball.y = ball.radius;
      ball.dy = -ball.dy;
    } else if (ball.y + ball.radius >= HEIGHT) {
      ball.y = HEIGHT - ball.radius;
      ball.dy = -ball.dy;
    }

    if (ball.x - ball.radius <= leftPaddle.x + leftPaddle.width) {
      if (ball.y >= leftPaddle.y && ball.y <= leftPaddle.y + leftPaddle.height) {
        ball.x = leftPaddle.x + leftPaddle.width + ball.radius;
        handlePaddleBounce(leftPaddle, false);
      }
    }

    if (ball.x + ball.radius >= rightPaddle.x) {
      if (ball.y >= rightPaddle.y && ball.y <= rightPaddle.y + rightPaddle.height) {
        ball.x = rightPaddle.x - ball.radius;
        handlePaddleBounce(rightPaddle, true);
      }
    }

    if (ball.x + ball.radius < 0) {
      rightScore++;
      rightScoreEl.textContent = rightScore;
      resetBall(true);
    } else if (ball.x - ball.radius > WIDTH) {
      leftScore++;
      leftScoreEl.textContent = leftScore;
      resetBall(false);
    }
  }

  function handlePaddleBounce(paddle, isRightPaddle) {
    const relativeIntersectY = (ball.y - (paddle.y + paddle.height / 2));
    const normalizedRelativeIntersectionY = relativeIntersectY / (paddle.height / 2);
    const bounceAngle = normalizedRelativeIntersectionY * maxBounceAngle;
    ball.speed = Math.min(16, ball.speed + 0.4);
    const direction = isRightPaddle ? -1 : 1;
    ball.dx = direction * ball.speed * Math.cos(bounceAngle);
    ball.dy = ball.speed * Math.sin(bounceAngle);
  }

  function drawNet() {
    const segment = 12;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let y = 0; y < HEIGHT; y += segment * 2) {
      ctx.fillRect(WIDTH / 2 - 1, y, 2, segment);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawNet();
    ctx.fillStyle = '#e6eef8';
    roundRect(ctx, leftPaddle.x, leftPaddle.y, leftPaddle.width, leftPaddle.height, 6, true, false);
    roundRect(ctx, rightPaddle.x, rightPaddle.y, rightPaddle.width, rightPaddle.height, 6, true, false);
    drawBall(ball.x, ball.y, ball.radius);
  }

  function drawBall(x, y, r) {
    const grad = ctx.createRadialGradient(x - r/3, y - r/3, r*0.1, x, y, r);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#22c1c3');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  function loop(timestamp) {
    if (!running) return;
    if (paused) return;
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(32, timestamp - lastTime);
    lastTime = timestamp;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  resetBall(true);
  draw();
  canvas.focus();
})();
