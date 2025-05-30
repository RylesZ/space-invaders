const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 450,
    parent: 'gameCanvas',
    physics: {
        default: 'arcade',
        arcade: { debug: false } // Desactiva les caixes de hitbox
    },
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);

class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }
    preload() {
        this.load.image('player', 'assets/player.png');
        this.load.image('enemy', 'assets/enemy.png');
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('enemy_shot', 'assets/enemy_shot.png');
    }
    create() {
        this.add.rectangle(0, 0, 600, 450, 0x000000).setOrigin(0);
        this.add.text(300, 200, 'Space Invaders', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
        this.add.text(300, 250, 'WASD per moure, Espai per disparar', { fontSize: '16px', color: '#fff' }).setOrigin(0.5);
        this.add.text(300, 300, 'Prem Espai per començar', { fontSize: '16px', color: '#fff' }).setOrigin(0.5);
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }
    create() {
        this.player = this.physics.add.sprite(300, 400, 'player').setScale(0.1);
        this.player.setSize(this.player.width * 0.2, this.player.height * 0.2);
        this.player.setCollideWorldBounds(true);

        this.enemies = this.physics.add.group();
        const rows = 2, cols = 5, enemySpacing = 100, startX = 100, startY = 20;
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                let enemy = this.enemies.create(startX + j * enemySpacing, startY + i * enemySpacing, 'enemy').setScale(0.1);
                enemy.setSize(enemy.width * 0.2, enemy.height * 0.2);
            }
        }

        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        this.cursors = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shoot: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        this.score = 0;
        this.lives = 3;
        this.scoreText = this.add.text(10, 10, 'Puntuació: 0', { fontSize: '16px', color: '#fff' });
        this.livesText = this.add.text(10, 30, 'Vides: 3', { fontSize: '16px', color: '#fff' });

        this.isInvulnerable = false;
        this.lastEnemyShot = 0;
        this.enemiesDirection = 1;
        this.enemiesVerticalSpeed = 0.5;

        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.enemyBullets, this.player, this.hitPlayer, null, this);
    }
    update(time) {
        if (this.cursors.left.isDown) this.player.setVelocityX(-200);
        else if (this.cursors.right.isDown) this.player.setVelocityX(200);
        else if (this.cursors.up.isDown) this.player.setVelocityY(-200);
        else if (this.cursors.down.isDown) this.player.setVelocityY(200);
        else {
            this.player.setVelocityX(0);
            this.player.setVelocityY(0);
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.shoot)) {
            let bullet = this.bullets.create(this.player.x, this.player.y - 20, 'bullet').setScale(0.05);
            bullet.setVelocityY(-400);
        }

        if (time - this.lastEnemyShot > 1500) {
            let enemy = this.enemies.getChildren()[Math.floor(Math.random() * this.enemies.getLength())];
            if (enemy) {
                let shot = this.enemyBullets.create(enemy.x, enemy.y + 20, 'enemy_shot').setScale(0.05);
                shot.setVelocityY(200);
                this.lastEnemyShot = time;
            }
        }

        let edgeReached = false;
        this.enemies.getChildren().forEach(enemy => {
            enemy.x += this.enemiesDirection * 1;
            enemy.y += this.enemiesVerticalSpeed;
            if (enemy.x > 550 || enemy.x < 50) edgeReached = true;
            if (enemy.y > 250) this.enemiesVerticalSpeed = -1;
            if (enemy.y < 10) this.enemiesVerticalSpeed = 0.5;
        });
        if (edgeReached) this.enemiesDirection *= -1;

        if (this.enemies.countActive() === 0) {
            this.add.text(300, 225, '¡Has guanyat!', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
            this.scene.pause();
        }
    }
    hitEnemy(bullet, enemy) {
        bullet.destroy();
        enemy.destroy();
        this.score += 10;
        this.scoreText.setText('Puntuació: ' + this.score);
    }
    hitPlayer(player, enemyBullet) {
        enemyBullet.destroy();
        if (!this.isInvulnerable) {
            this.lives -= 1;
            this.livesText.setText('Vides: ' + this.lives);
            this.isInvulnerable = true;
            this.player.setAlpha(0.5);
            this.time.delayedCall(2000, () => {
                this.isInvulnerable = false;
                this.player.setAlpha(1);
            });
            if (this.lives <= 0) {
                this.add.text(300, 225, 'Fi del joc', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
                this.scene.pause();
            }
        }
    }
}
