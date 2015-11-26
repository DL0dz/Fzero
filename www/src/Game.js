/* globals Phaser:false */
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
    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
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
    this.load.spritesheet('player', 'asset/surferCat.png', 50, 72);
    this.load.spritesheet('shark', 'asset/shark.png', 100, 80);

  },

  create: function () {
    this.stage.backgroundColor = '#66CCFF';
    //this.sea = this.add.tileSprite(0, 0, 1024, 768, 'sea');
    this.setupPlayer();
    this.setupEnemies();

    this.cursors = this.input.keyboard.createCursorKeys();

  },

  update: function () {
    this.checkCollisions();
    this.processPlayerInput();
    this.spawnEnemies();
  },

  render: function () {
    // this.sharkPool.forEachAlive(this.renderGroup, this);
    // this.game.debug.body(this.player);
  },

  renderGroup: function (member) {
    this.game.debug.body(member);
  },

  setupPlayer: function(){
    this.player = this.add.sprite(this.world.centerX, this.world.centerY, 'player');
    this.player.anchor.setTo(0.5, 0.5);
    this.physics.enable(this.player, Phaser.Physics.ARCADE);
    this.player.body.collideWorldBounds = true;
    this.player.speed = 200;
    this.player.body.setSize(36, 64, 2, 0);
    this.player.animations.add('surf', [1], 20, true);
    this.player.animations.add('surfLeft', [0], 20, true);
    this.player.animations.add('surfRight', [2], 20, true);
    this.player.play('surf');

  },

  setupEnemies: function(){
    this.nextEnemyAt = 0;
    this.enemyDelay = 3000;

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

  checkCollisions: function () {
    this.physics.arcade.overlap(this.player, this.sharkPool, this.sharkEatPlayer, null, this);
  },

  processPlayerInput: function() {
    this.player.body.velocity.x = 0;
    this.player.body.velocity.y = 0;

    if (this.cursors.left.isDown) {
      this.player.play('surfLeft');
      this.player.body.velocity.x = -this.player.speed;
    } else if (this.cursors.right.isDown) {
      this.player.play('surfRight');
      this.player.body.velocity.x = this.player.speed;
    } else {
      this.player.play('surf');
    }
    if (this.cursors.up.isDown) {
      this.player.body.velocity.y = -this.player.speed;
    } else if (this.cursors.down.isDown) {
      this.player.body.velocity.y = this.player.speed;
    }

    // en global (caca), nous ne sommes pas parvenu à le récupérer dans spawnEnemies
    playerPos.x = this.player.x;
    playerPos.y = this.player.y;
  },

  spawnEnemies: function () {
    // on réduit l'intervalle d'appartion des ennemis très légèrement à chaque frame
    if (this.enemyDelay > 500) {
      this.enemyDelay -= 0.2;
    }

    if (this.nextEnemyAt < this.time.now && this.sharkPool.countDead() > 0) {
      this.nextEnemyAt = this.time.now + this.enemyDelay;
      var shark = this.sharkPool.getFirstExists(false);
      shark.speed = 120;
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

  sharkEatPlayer: function () {
    this.player.kill();
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


};
