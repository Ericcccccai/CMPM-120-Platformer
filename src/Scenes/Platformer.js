class Platformer extends Phaser.Scene {
    constructor() {
        super("platformerScene");
    }

    init() {
        // variables and settings
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 1.8;
        this.wasGrounded = false;
    }

    create() {

        this.lastFootstepTime = 0;
        // Create a new tilemap game object which uses 18x18 pixel tiles, and is
        // 45 tiles wide and 25 tiles tall.
        this.map = this.add.tilemap("platformerLevel1", 18, 18, 135, 25);

        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tileset = [
            this.map.addTilesetImage("Basic", "tilemap_tiles"),
            this.map.addTilesetImage("Extra1", "tilemap_tiles_farm"),
            this.map.addTilesetImage("sky", "tilemap_tiles_sky")
        ];

        // Create a layer
        this.map.createLayer("Sky", this.tileset, 0, 0); // draw order only
        this.map.createLayer("Interactions", this.tileset, 0, 0); // draw order only
        this.groundLayer = this.map.createLayer("Ground_and_Platform", this.tileset, 0, 0); // assign this one
        this.waterLayer = this.map.createLayer("Water", this.tileset, 0, 0);

        // this.animatedTiles = this.sys.animatedTiles;
        // this.animatedTiles.init(this.map);



        // Make it collidable
        this.groundLayer.setCollisionByProperty({
            collides: true
        });

        // TODO: Add createFromObjects here
        // Find coins in the "Objects" layer in Phaser
        // Look for them by finding objects with the name "coin"
        // Assign the coin texture from the tilemap_sheet sprite sheet
        // Phaser docs:
        // https://newdocs.phaser.io/docs/3.80.0/focus/Phaser.Tilemaps.Tilemap-createFromObjects

        this.coins = this.map.createFromObjects("Objects", {
            name: "Coin",
            key: "tilemap_sheet",
            frame: 151
        });
        

        // TODO: Add turn into Arcade Physics here
        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 150, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(true);

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.groundLayer);

        // TODO: Add coin collision handler
        // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
        });
        

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // TODO: Add movement vfx here
        // movement vfx

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['dirt_01.png', 'dirt_02.png'],
            // TODO: Try: add random: true
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();

        // Jump particle effect
        my.vfx.jump = this.add.particles(0, 0, "kenny-particles", {
            frame: ['circle_05.png'],
            scale: { start: 0.05, end: 0.15 },
            lifespan: 400,
            speedY: { min: -100, max: -200 },
            speedX: { min: -50, max: 50 },
            alpha: { start: 1, end: 0 }
        });
        my.vfx.jump.stop();

        // Land particle effect
        my.vfx.land = this.add.particles(0, 0, "kenny-particles", {
            frame: ['circle_04.png'],
            scale: { start: 0.1, end: 0 },
            lifespan: 300,
            speedY: { min: -50, max: -100 },
            speedX: { min: -30, max: 30 },
            alpha: { start: 1, end: 0 }
        });
        my.vfx.land.stop();

        // TODO: add camera code here
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        // Create flag from object layer
        this.flag1 = this.map.createFromObjects("Objects", {
            name: "FlagUp",
            key: "tilemap_sheet",
            frame: 111
        });
        this.physics.world.enable(this.flag1, Phaser.Physics.Arcade.STATIC_BODY);
        this.flagGroup1 = this.add.group(this.flag1);

        // Add flag overlap detection
        this.physics.add.overlap(my.sprite.player, this.flagGroup1, () => {
            this.scene.start("endScene");
        });

        // Create flag from object layer
        this.flag2 = this.map.createFromObjects("Objects", {
            name: "FlagDown",
            key: "tilemap_sheet",
            frame: 131
        });
        this.physics.world.enable(this.flag2, Phaser.Physics.Arcade.STATIC_BODY);
        this.flagGroup = this.add.group(this.flag2);
        
        // Add flag overlap detection
        this.physics.add.overlap(my.sprite.player, this.flagGroup, () => {
            this.scene.start("endScene");
        });

    }

    update() {
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();

            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // TODO: add particle following code here
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-10, my.sprite.player.displayHeight/2-5, false);

            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);

            // Only play smoke effect if touching the ground

            if (my.sprite.player.body.blocked.down) {

                my.vfx.walking.start();
                this.playFootstepSound();

            }

        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // TODO: have the vfx stop playing
            my.vfx.walking.stop();
        }

        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        // Land particle (detect falling to grounded transition)
        if (!this.wasGrounded && my.sprite.player.body.blocked.down) {
            my.vfx.land.emitParticleAt(my.sprite.player.x, my.sprite.player.y + 10);
        }
        this.wasGrounded = my.sprite.player.body.blocked.down;

        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
            my.vfx.jump.emitParticleAt(my.sprite.player.x, my.sprite.player.y + 10);
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }

    playFootstepSound() {
        const index = Phaser.Math.Between(0, 4);
        console.log(`Playing footstep${index}`);
        this.sound.play(`footstep${index}`, { volume: 0.4 });
    }
    
}

class EndScene extends Phaser.Scene {
    constructor() {
        super("endScene");
    }

    create() {
        this.add.text(100, 100, "🏁 You Win!", {
            fontSize: '32px',
            fill: '#ffffff'
        });

        this.input.keyboard.once("keydown-R", () => {
            this.scene.start("platformerScene");
        });
    }
}
