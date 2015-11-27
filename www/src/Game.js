/* globals Phaser:false */
var accelerometer = {};
// create BasicGame Class

var playerPos = {};

BasicGame = {

};

// create Game function in BasicGame
BasicGame.Game = function (game) {
};

// set Game function prototype
BasicGame.Game.prototype = {

  init: function () {
    // set up input max pointers
    this.input.maxPointers = 1;
    // set up stage disable visibility change
    this.stage.disableVisibilityChange = true;
    // Set up the scaling method used by the ScaleManager
    // Valid values for scaleMode are:
    // * EXACT_FIT
    // * NO_SCALE
    // * SHOW_ALL
    // * RESIZE
    // See http://docs.phaser.io/Phaser.ScaleManager.html for full document
    this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
    // If you wish to align your game in the middle of the page then you can
    // set this value to true. It will place a re-calculated margin-left
    // pixel value onto the canvas element which is updated on orientation /
    // resizing events. It doesn't care about any other DOM element that may
    // be on the page, it literally just sets the margin.
    this.scale.pageAlignHorizontally = true;
    this.scale.pageAlignVertically = true;
    // Force the orientation in landscape or portrait.
    // * Set first to true to force landscape.
    // * Set second to true to force portrait.
    this.scale.forceOrientation(false, true);
    // Sets the callback that will be called when the window resize event
    // occurs, or if set the parent container changes dimensions. Use this
    // to handle responsive game layout options. Note that the callback will
    // only be called if the ScaleManager.scaleMode is set to RESIZE.
    this.scale.setResizeCallback(this.gameResized, this);
    // Set screen size automatically based on the scaleMode. This is only
    // needed if ScaleMode is not set to RESIZE.
    this.scale.updateLayout(true);
    // Re-calculate scale mode and update screen size. This only applies if
    // ScaleMode is not set to RESIZE.
    this.scale.refresh();
  },

  preload: function () {
    // Here we load the assets required for our preloader (in this case a
    // background and a loading bar)
    //this.load.image('sea', 'asset/sea.jpg');
    this.load.spritesheet('player', 'asset/surferCat.png', 27, 36);
    this.load.audio('jaws', ['asset/main.ogg']);
    this.load.spritesheet('buoy', 'asset/buoy.png', 74, 14);
    this.load.spritesheet('shark', 'asset/shark.png', 100, 80);

    this.load.audio('lose', ['asset/lose.ogg']);
    this.load.audio('yeah', ['asset/buoy.ogg']);
  },

  create: function () {
    this.stage.backgroundColor = '#66CCFF';
    //this.sea = this.add.tileSprite(0, 0, 1024, 768, 'sea');
    this.setupPlayer();
    this.setupBuoys();
    this.setupEnemies();
    this.setupText();
    this.setupAudio();

    this.cursors = this.input.keyboard.createCursorKeys();

    this.music = this.add.audio('jaws');
    this.music.autoplay = true;
    this.music.loop = true;
    this.music.play();
  },

  update: function () {
    this.checkCollisions();
    this.processPlayerInput();
    this.spawnBuoys();
    this.spawnEnemies();
    this.processDelayedEffects();
    this.addToScore();
  },

  render: function () {
    //this.buoysPool.forEachAlive(this.renderGroup, this);
    //this.sharkPool.forEachAlive(this.renderGroup, this);
     this.game.debug.body(this.player);
  },

  renderGroup: function (member) {
    //this.game.debug.body(member);
  },

  setupPlayer: function(){
    this.player = this.add.sprite(this.world.centerX, this.world.centerY, 'player');
    this.player.anchor.setTo(0.5, 0.5);
    this.player.scale.setTo(1.5, 1.5);
    this.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.body.collideWorldBounds = true;
    this.player.speed = 120;
    this.player.body.setSize(27, 36, 1, 0);
    this.player.animations.add('surf', [1], 20, true);
    this.player.animations.add('surfLeft', [0], 20, true);
    this.player.animations.add('surfRight', [2], 20, true);
    this.player.animations.add('rotate', [3, 4, 5], 20, false);
    this.player.animations.add('died', [6], 20, true);
    this.player.play('surf');
  },

  setupBuoys: function(){
    this.nextBuoyAt = 1000;
    this.buoyDelay = 3000;

    this.buoysPool = this.add.group();
    this.buoysPool.enableBody = true;
    this.buoysPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.buoysPool.createMultiple(1, 'buoy');
    this.buoysPool.setAll('anchor.x', 0.5);
    this.buoysPool.setAll('anchor.y', 0.5);
    this.buoysPool.setAll('outOfBoundsKill', true);
    this.buoysPool.setAll('checkWorldBounds', true);
    this.buoysPool.speed = 250;

    // Set the animation for each sprite
    this.buoysPool.forEach(function (buoys) {
      buoys.body.setSize(20, 5, 0, 0);
      buoys.animations.add('display', [0], true);
    });

  },

  setupEnemies: function(){
    this.nextEnemyAt = 0;
    this.enemyDelay = 2000;

    this.sharkPool = this.add.group();
    this.sharkPool.enableBody = true;
    this.sharkPool.physicsBodyType = Phaser.Physics.ARCADE;
    this.sharkPool.createMultiple(5, 'shark');
    this.sharkPool.setAll('anchor.x', 0.5);
    this.sharkPool.setAll('anchor.y', 0.5);
    this.sharkPool.setAll('outOfBoundsKill', true);
    this.sharkPool.setAll('checkWorldBounds', true);
    this.sharkPool.speed = 120;

    // Set the animation for each sprite
    this.sharkPool.forEach(function (shark) {
      shark.body.setSize(50, 36, 15, 10);
      shark.animations.add('attack', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 7, false);
    });

  },

  setupAudio: function () {
    this.loseSFX = this.add.audio('lose');
    this.buoysSFX = this.add.audio('yeah');
  },

  setupText: function(){ // à mettre dans une fonction (pas le temps)
    this.score = 0;
    this.buoysScore = 0;

    this.instructions = this.add.text( this.world.centerX, this.world.height - 40,
      'Montre nous que tu n\'as pas besoin\nde te laisser pousser les cheveux\npour être un champion de la glisse !',
      { font: '20px monospace', fill: '#fff', align: 'center' }
    );
    this.instructions.anchor.setTo(0.5, 0.5);
    this.instExpire = this.time.now + 6000;

    this.instructions2 = this.add.text( this.world.centerX, this.world.height - 40,
      'Incline l\'appareil pour surfer !\nPasse entre les bouées.\n Et évite de te faire engloutir...',
      { font: '20px monospace', fill: 'red', align: 'center' }
    );
    this.instructions2.anchor.setTo(0.5, 0.5);
    this.instructions2.visible = false;

    this.finalInfos = this.add.text( this.world.centerX, this.world.centerY - 20,
      'Tu viens de nourrir les requins.\nMiam ! L\'aventure s\'arrête ici.',
      { font: '20px monospace', fill: '#fff', align: 'center' }
    );
    this.finalInfos.anchor.setTo(0.5, 0.5);
    this.finalInfos.visible = false;

    this.finalScore = this.add.text( this.world.centerX, this.world.centerY + 40,
      'Ton score : ' + this.score,
      { font: '32px monospace', fill: 'green', align: 'center' }
    );
    this.finalScore.anchor.setTo(0.5, 0.5);
    this.finalScore.visible = false;

    this.scoreText = this.add.text(
    this.world.centerX, 20, '' + this.score,
    { font: '20px monospace', fill: '#fff', align: 'center' }
    );
    this.scoreText.anchor.setTo(0.5, 0.5);
  },

  checkCollisions: function () {
    this.physics.arcade.overlap(this.player, this.sharkPool, this.sharkEatPlayer, null, this);
    this.physics.arcade.overlap(this.player, this.buoysPool, this.hitBuoys, null, this);
  },

  processPlayerInput: function() {
    this.player.body.velocity.x = 0;
    this.player.body.velocity.y = 0;

    // Gestion de l'accelerometer
    if (navigator.accelerometer) {
      navigator.accelerometer.watchAcceleration(function(acc) {
        accelerometer.x = acc.x;
        accelerometer.y = acc.y;
      }, null); // pas de frequency pour une meilleure perf

      if (accelerometer.x < 0) {
        this.player.play('surfRight');
        this.player.body.velocity.x = this.player.speed;
      } else if (accelerometer.x >= 0) {
        this.player.play('surfLeft');
        this.player.body.velocity.x = -this.player.speed;
      }

      if (accelerometer.x >= -1 && accelerometer.x <= 1) {
        this.player.play('rotate');
      }

      if(accelerometer.y < 0) {
        this.player.body.velocity.y = -this.player.speed;
      } else {
        this.player.body.velocity.y = this.player.speed;
      }

    }

    // en global (caca), nous ne sommes pas parvenu à le récupérer dans spawnEnemies
    playerPos.x = this.player.x;
    playerPos.y = this.player.y;
  },

  spawnEnemies: function () {
    if (this.time.now < 8000) {
      return;
    };
    // on réduit l'intervalle d'appartion des ennemis très légèrement à chaque frame
    if (this.enemyDelay > 500) {
      this.enemyDelay -= 0.4;
    }

    if (this.nextEnemyAt < this.time.now && this.sharkPool.countDead() > 0) {
      this.nextEnemyAt = this.time.now + this.enemyDelay;
      var shark = this.sharkPool.getFirstExists(false);
      shark.speed = 80;
      var startSharkX = this.rnd.integerInRange(0, this.world.width);
      var startSharkY = this.rnd.integerInRange(0, this.world.height);

      /*
      1 requin sur 4 en moyenne prendra une direction inverse et se dirigera vers l'extérieur du device
      Cela empêche le joueur de camper dans les coins sans ne jamais se faire toucher
      */
      var reverseSharkDirection = this.rnd.integerInRange(1, 4) < 1 ? true : false;

      var sharkDistanceToPlayerX = Math.abs(startSharkX - playerPos.x);
      var sharkDistanceToPlayerY = Math.abs(startSharkY - playerPos.y);

      // le requin ne doit pas apparaitre sur le joueur
      if (sharkDistanceToPlayerX > 20 && sharkDistanceToPlayerY > 20) {
        // Apparition du requin de manière aléatoire
        shark.reset(startSharkX, startSharkY);

        if (startSharkX <= (this.world.width/2)) {
          reverseSharkDirection ? this.sharkToLeft(shark) : this.sharkToRight(shark);
        } else {
          reverseSharkDirection ? this.sharkToRight(shark) : this.sharkToLeft(shark);
        }

        if (startSharkY <= (this.world.height/2)) {
          shark.body.velocity.y = reverseSharkDirection ? -shark.speed : shark.speed;
        } else {
          shark.body.velocity.y = reverseSharkDirection ? shark.speed : -shark.speed;
        }

        shark.play('attack', 7, false, true);
      }

    }

  },

  spawnBuoys: function () {
    this.nextBuoyAt = 0;
    this.buoyDelay = 5000;

    if (this.nextBuoyAt < this.time.now && this.buoysPool.countDead() > 0) {
      this.nextBuoyAt = this.time.now + this.buoyDelay;
      var buoy = this.buoysPool.getFirstExists(false);
      buoy.speed = 150;
      var startbuoyX = this.rnd.integerInRange(0, this.world.width);
      var startbuoyY = this.rnd.integerInRange(0, this.world.height);

      buoy.reset(this.rnd.integerInRange(25, this.world.width - buoy.width), 0)
      buoy.body.velocity.y = buoy.speed;
      buoy.play('display', 20, true, true);
    }

  },

  sharkEatPlayer: function () {
    navigator.vibrate([100, 30, 100]);
    this.player.kill();
    this.loseSFX.play();
  },


  sharkToLeft: function (shark) {
    // on inverse la position du sprite (mode mirroir)
    shark.scale.x *= shark.scale.x < 0 ? 1 : -1;
    // on déplace la zone de collision pour être en adéquation avec le sprite
    shark.body.setSize(50, 36, -10, 10);
    shark.body.velocity.x = -shark.speed;
  },

  sharkToRight: function (shark) {
    shark.body.setSize(50, 36, 15, 10);
    shark.scale.x *= shark.scale.x > 0 ? 1 : -1;
    shark.body.velocity.x = shark.speed;
  },


  processDelayedEffects: function () {
    if (this.instructions.exists && this.time.now > this.instExpire) {
      this.instructions.destroy();
      this.instructions2.visible = true;
    }

    if (this.instructions2.exists && this.time.now > this.instExpire*1.5) {
      this.instructions2.destroy();
    }

    if (!this.player.exists) {
      this.finalInfos.visible = true;
      this.finalScore.visible = true;
      this.scoreText.visible = false;
      this.finalScore.text = 'Ton score : ' + this.score;
    }
  },

  hitBuoys: function (player, buoy) {
    buoy.kill();
    this.buoysScore += 20;
    this.buoysSFX.play();
    player.play('rotate');

  },

  addToScore: function () {
    if (this.player.exists) {
      scoreFinal = this.score = Math.round(this.time.now*0.001) + this.buoysScore;
      this.scoreText.text = this.score;
    }
  },

};
