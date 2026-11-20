export class GameHub {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.activeGame = 'snake';
    this.score = 0;
    this.highScore = Number(localStorage.getItem('l1veabl3_highscore') || 0);
    this.loopId = null;

    document.getElementById('game-high').textContent = this.highScore;

    document.querySelectorAll('.game-switch').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.game-switch').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activeGame = btn.dataset.game;
        this.start();
      });
    });

    document.getElementById('start-game-btn').addEventListener('click', () => this.start());
    this.bindInputs();
  }

  updateScore(pts) {
    this.score = pts;
    document.getElementById('game-score').textContent = this.score;
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('l1veabl3_highscore', this.highScore);
      document.getElementById('game-high').textContent = this.highScore;
    }
  }

  bindInputs() {
    window.addEventListener('keydown', (e) => {
      if (this.activeGame === 'snake') {
        if (e.key === 'ArrowUp' && this.dy === 0) { this.dx = 0; this.dy = -20; }
        if (e.key === 'ArrowDown' && this.dy === 0) { this.dx = 0; this.dy = 20; }
        if (e.key === 'ArrowLeft' && this.dx === 0) { this.dx = -20; this.dy = 0; }
        if (e.key === 'ArrowRight' && this.dx === 0) { this.dx = 20; this.dy = 0; }
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      if (this.activeGame === 'pong') {
        const rect = this.canvas.getBoundingClientRect();
        this.paddleY = Math.max(0, Math.min(320, e.clientY - rect.top - 40));
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.activeGame !== 'clicker' || !this.target) return;
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (Math.hypot(mx - this.target.x, my - this.target.y) <= this.target.r) {
        this.updateScore(this.score + 10);
        this.spawnTarget();
      }
    });
  }

  start() {
    clearInterval(this.loopId);
    this.updateScore(0);

    if (this.activeGame === 'snake') {
      this.snake = [{ x: 200, y: 200 }];
      this.dx = 20;
      this.dy = 0;
      this.food = { x: 300, y: 200 };
      this.loopId = setInterval(() => this.tickSnake(), 105);
    } else if (this.activeGame === 'clicker') {
      this.spawnTarget();
      this.loopId = setInterval(() => this.drawClicker(), 30);
    } else if (this.activeGame === 'pong') {
      this.paddleY = 160;
      this.ball = { x: 270, y: 200, vx: 5, vy: 4 };
      this.loopId = setInterval(() => this.tickPong(), 20);
    }
  }

  tickSnake() {
    const head = { x: this.snake.x + this.dx, y: this.snake.y + this.dy };
    if (head.x < 0 || head.x >= 540 || head.y < 0 || head.y >= 400 ||
        this.snake.some(s => s.x === head.x && s.y === head.y)) {
      clearInterval(this.loopId);
      this.ctx.fillStyle = '#ef4444';
      this.ctx.font = 'bold 28px sans-serif';
      this.ctx.fillText('GAME OVER', 185, 200);
      return;
    }

    this.snake.unshift(head);
    if (head.x === this.food.x && head.y === this.food.y) {
      this.updateScore(this.score + 10);
      this.food = {
        x: Math.floor(Math.random() * 27) * 20,
        y: Math.floor(Math.random() * 20) * 20
      };
    } else {
      this.snake.pop();
    }

    this.ctx.fillStyle = '#07080c';
    this.ctx.fillRect(0, 0, 540, 400);
    this.ctx.fillStyle = '#ec4899';
    this.ctx.fillRect(this.food.x, this.food.y, 18, 18);
    this.ctx.fillStyle = '#6366f1';
    this.snake.forEach(part => this.ctx.fillRect(part.x, part.y, 18, 18));
  }

  spawnTarget() {
    this.target = { x: 40 + Math.random() * 460, y: 40 + Math.random() * 320, r: 22 };
  }

  drawClicker() {
    this.ctx.fillStyle = '#07080c';
    this.ctx.fillRect(0, 0, 540, 400);
    this.ctx.beginPath();
    this.ctx.arc(this.target.x, this.target.y, this.target.r, 0, Math.PI * 2);
    this.ctx.fillStyle = '#10b981';
    this.ctx.fill();
  }

  tickPong() {
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    if (this.ball.y <= 8 || this.ball.y >= 392) this.ball.vy *= -1;
    if (this.ball.x >= 532) this.ball.vx *= -1;

    if (this.ball.x <= 24 && this.ball.y >= this.paddleY && this.ball.y <= this.paddleY + 80) {
      this.ball.vx = Math.abs(this.ball.vx) + 0.3;
      this.updateScore(this.score + 10);
    } else if (this.ball.x < 0) {
      clearInterval(this.loopId);
      this.ctx.fillStyle = '#ef4444';
      this.ctx.font = 'bold 28px sans-serif';
      this.ctx.fillText('MISSED!', 210, 200);
      return;
    }

    this.ctx.fillStyle = '#07080c';
    this.ctx.fillRect(0, 0, 540, 400);
    this.ctx.fillStyle = '#6366f1';
    this.ctx.fillRect(10, this.paddleY, 12, 80);
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, 8, 0, Math.PI * 2);
    this.ctx.fillStyle = '#facc15';
    this.ctx.fill();
  }
}
