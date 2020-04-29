'use strict';

function random(min, max) {
  let rand = min + Math.random() * (max + 1 - min);
  return Math.floor(rand);
}
class Analyze {
  constructor() {
    //Создание источника
    this.audio = new Audio();
    this.audio.src = 'track002.ogg';
    this.started = false;
    this.context = new AudioContext();
    
    /**
     * метод позволяет создать интерфейс для сбора, обработки или анализа 
     * аудио-данных при помощи js. У этого интерфейса есть свой обработчик 
     * событий и нас будет интересовать событие onaudioprocess, которое 
     * наступает, когда на вход передаются новые данные.
     * При вызове метод принимает три аргумента 
     * bufferSize — Размер буфера, 
     * numInputChannels — кол-во входных каналов в потоке, 
     * numOutputChannels — кол-во выходных каналов.
     */
    this.node = this.context.createScriptProcessor(2048, 1, 1);

    /**
     * Данный метод позволяет получить информацию о частотных и временных 
     * параметрах сигнала в виде массива данных. Мы должны будем присоединить 
     * наш анализатор к источнику аудио сигнала и к получателю звука.
     */
    this.analyser = this.context.createAnalyser();
    
    /**
     * Частота опроса
     */
    this.analyser.smoothingTimeConstant = 0.3; // частота опроса
    
    /**
     * Размерность преобразования Фурье. Кол-во будет равно fftSize/2
     */
    this.analyser.fftSize = 512;

    this.bands = new Uint8Array(this.analyser.frequencyBinCount);

  }
  start() {
    if (this.started) return;
    this.started = true;
    this.context.resume().then(() => {
      
      //отправляем на обработку в  AudioContext
      this.source = this.context.createMediaElementSource(this.audio);
      //связываем источник и анализатором
      this.source.connect(this.analyser);
      //связываем анализатор с интерфейсом, из которого он будет получать данные
      this.analyser.connect(this.node);
      //Связываем все с выходом
      this.node.connect(this.context.destination);
      this.source.connect(this.context.destination);
      //подписываемся на событие изменения входных данных
      this.node.onaudioprocess = () => {
        this.analyser.getByteFrequencyData(this.bands);
        if (!this.audio.paused) {
          if (typeof this.update === 'function') {
            return this.update(this.bands);
          } else {
            return 0;
          }
        }
      };
      this.audio.play();
    });
  }
}
class Particle {
  constructor(ctx) {
    this.x = random(0, ctx.canvas.width);
    this.y = random(0, ctx.canvas.height);
    this.level = random(1, 4);
    this.speed = random(0.5, 2);
    this.radius = random(10, 70);
    this.pulse = random(0.01, 0.1);
    this.color = [
      '#69D2E7',
      '#A7DBD8',
      '#E0E4CC',
      '#F38630',
      '#FA6900',
      '#FF4E50',
      '#F9D423',
    ][random(0, 6)]; //цвет частицы
    this.opacity = random(0.2, 1);
    this.band = Math.floor(random(1, 128));
    this.ctx = ctx;
  }
  draw() {
    const pulsar = Math.exp(this.pulse);
    const scale = pulsar * this.radius || this.radius;
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath(); //Начинает отрисовку фигуры
    ctx.arc(this.x, this.y, scale, 0, Math.PI * 2);
    ctx.fillStyle = this.color; //цвет
    ctx.globalAlpha = this.opacity / this.level; //прозрачность
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.color; //цвет рамки
    ctx.stroke();
    ctx.restore();
    this.move();
  }
  move() {
    this.y -= this.speed * this.level;
    //Возвращаем в начало частицы которые ушли за пределы холста
    if (this.y < -100) {
      this.y = this.ctx.canvas.height;
    }
  }
}

{
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const draw = function () {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((particle) => particle.draw());
  };

  //Создаем анализатор
  const analyzer = new Analyze();
  const particles = [];
  function createParticles() {
    for (let i = 0; i < 50; i++) {
      particles.push(new Particle(ctx));
    }
    //Добавляем элемент audio на страницу
    document.body.appendChild(analyzer.audio);
    analyzer.update = function (bands) {
      particles.forEach((particle) => {
        particle.pulse = bands[particle.band] / 256;
      });
    };
  }
  createParticles();
  setInterval(draw, 33);
  document.querySelector('button').addEventListener('click', function () {
    analyzer.start();
  });
}
