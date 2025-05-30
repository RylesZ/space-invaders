// Escena del menú como clase
class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    preload() {
        this.load.image('background', 'https://labs.phaser.io/assets/skies/space3.png');
    }

    create() {
        this.add.image(300, 225, 'background').setScale(0.75);
        this.add.text(300, 100, 'Space Invaders', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(300, 200, 'Controles:\nOrdenador: WASD para mover, Espacio para disparar', { fontSize: '12px', fill: '#fff', align: 'center' }).setOrigin(0.5);
        this.add.text(300, 300, 'Presiona ESPACIO para empezar', { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('GameScene'));
    }
}

// Escena del juego como clase
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.load.on('filecomplete', (key) => {
            console.log(`Asset cargado: ${key}`);
        });
        this.load.on('loaderror', (file) => {
            console.error(`Error cargando asset: ${file.key}`);
        });

        this.load.image('player', 'assets/player.png');
        this.load.image('enemy', 'assets/enemy.png');
        this.load.image('bullet', 'assets/bullet.png');
        this.load.image('enemy_shot', 'assets/enemy_shot.png');
    }

    create() {
        this.add.rectangle(300, 225, 600, 450, 0x000000);

        // Jugador
        this.player = this.physics.add.sprite(300, 400, 'player').setScale(0.1);
        this.player.setCollideWorldBounds(true);
        this.player.lives = 3;
        this.player.isInvulnerable = false;
        this.player.setSize(this.player.width * 0.2, this.player.height * 0.2);

        // Grupo de enemigos
        this.enemies = this.physics.add.group();
        const rows = 2;
        const cols = 5;
        const enemySpacing = 100;
        const startX = 100;
        const startY = 20;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                let enemy = this.enemies.create(startX + j * enemySpacing, startY + i * enemySpacing, 'enemy').setScale(0.1);
                enemy.setSize(enemy.width * 0.2, enemy.height * 0.2);
            }
        }

        // Disparos
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();

        // Texto
        this.score = 0;
        this.scoreText = this.add.text(10, 10, 'Puntuación: 0', { fontSize: '12px', fill: '#fff' });
        this.livesText = this.add.text(10, 25, 'Vidas: 3', { fontSize: '12px', fill: '#fff' });

        // Controles (WASD y Espacio)
        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shoot: Phaser.Input.Keyboard.KeyCodes.SPACE
        });

        // Disparos del enemigo (aleatorio entre los enemigos activos)
        this.time.addEvent({
            delay: 1500,
            callback: () => {
                let activeEnemies = this.enemies.getChildren().filter(enemy => enemy.active);
                if (activeEnemies.length > 0) {
                    let randomEnemy = Phaser.Utils.Array.GetRandom(activeEnemies);
                    let bullet = this.enemyBullets.create(randomEnemy.x, randomEnemy.y + 10, 'enemy_shot').setScale(0.2);
                    if (bullet) {
                        bullet.setVelocityY(200);
                        console.log("Bala enemiga creada");
                    } else {
                        console.log("Error: No se pudo crear la bala enemiga");
                    }
                }
            },
            loop: true
        });

        // Colisiones
        this.physics.add.overlap(this.bullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, this.loseLife, null, this);

        // Movimiento colectivo de enemigos
        this.enemiesDirection = 1;
        this.enemiesVerticalSpeed = 0.5;

        // Depuración inicial
        console.log("Juego iniciado, controles registrados:", this.keys);
    }

    update() {
        // Depuración de teclas
        if (this.keys.left.isDown) console.log("Tecla A presionada");
        if (this.keys.right.isDown) console.log("Tecla D presionada");
        if (this.keys.up.isDown) console.log("Tecla W presionada");
        if (this.keys.down.isDown) console.log("Tecla S presionada");
        if (Phaser.Input.Keyboard.JustDown(this.keys.shoot)) {
            console.log("Tecla Espacio presionada - Intentando disparar");
            this.shootBullet();
        }

        // Movimiento del jugador con WASD
        if (this.keys.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.keys.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.keys.up.isDown) {
            this.player.setVelocityY(-200);
        } else if (this.keys.down.isDown) {
            this.player.setVelocityY(200);
        } else {
            this.player.setVelocityY(0);
        }

        // Movimiento colectivo de enemigos
        let edgeReached = false;
        this.enemies.getChildren().forEach(enemy => {
            enemy.x += this.enemiesDirection * 1;
            enemy.y += this.enemiesVerticalSpeed;
            if (enemy.x > 550 || enemy.x < 50) {
                edgeReached = true;
            }
            if (enemy.y > 250) {
                this.enemiesVerticalSpeed = -1;
            }
            if (enemy.y < 10) { // Límite superior
                this.enemiesVerticalSpeed = 0.5; // Vuelve a descender
            }
        });

        if (edgeReached) {
            this.enemiesDirection *= -1;
            this.enemiesVerticalSpeed = 0.5;
            this.enemies.getChildren().forEach(enemy => enemy.y += 10);
        }

        // Limpiar balas
        this.bullets.getChildren().forEach(bullet => {
            if (bullet.y < 0) bullet.destroy();
        });
        this.enemyBullets.getChildren().forEach(bullet => {
            if (bullet.y > 450) bullet.destroy();
        });
    }

    shootBullet() {
        console.log("Función shootBullet ejecutada");
        let bullet = this.bullets.create(this.player.x, this.player.y - 10, 'bullet').setScale(0.05).setTint(0x00ff00);
        if (bullet) {
            bullet.setVelocityY(-300);
            console.log("Bala del jugador creada");
        } else {
            console.log("Error: No se pudo crear la bala del jugador - Verifica que bullet.png esté cargado");
        }
    }

    hitEnemy(bullet, enemy) {
        bullet.destroy();
        enemy.destroy();
        this.score += 10;
        this.scoreText.setText('Puntuación: ' + this.score);
        if (this.enemies.countActive() === 0) {
            this.gameOver('¡Ganaste!');
        }
    }

    loseLife(player, enemyBullet) {
        if (this.player.isInvulnerable) return;

        if (enemyBullet) enemyBullet.destroy();
        this.player.lives--;
        this.livesText.setText('Vidas: ' + this.player.lives);

        this.player.isInvulnerable = true;
        this.tweens.add({
            targets: this.player,
            alpha: 0,
            duration: 200,
            repeat: 5,
            yoyo: true,
            onComplete: () => {
                this.player.setAlpha(1);
                this.player.isInvulnerable = false;
            }
        });

        if (this.player.lives <= 0) {
            this.gameOver('Game Over');
        }
    }

    gameOver(message) {
        this.physics.pause();
        this.add.text(300, 225, message, { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(300, 275, 'Presiona ESPACIO para reiniciar', { fontSize: '12px', fill: '#fff' }).setOrigin(0.5);
        this.input.keyboard.on('keydown-SPACE', () => this.scene.start('MenuScene'));
    }
}

// Configura y crea el juego después de definir las escenas
const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 450,
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: { debug: true }
    },
    scene: [MenuScene, GameScene]
};

const game = new Phaser.Game(config);