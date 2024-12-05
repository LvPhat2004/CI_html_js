import { ChickenManager } from './chicken.js';
import { LEVELS, MESSAGES } from './levels.js';
import { createDrumsticks } from './drumstick.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Could not get canvas context!');
            return;
        }
        this.images = {};
        this.drumsticks = [];
        this.loadImages().then(() => {
            this.setCanvasSize();
            this.currentLevel = 1;
            this.notifications = [];
            this.init();
            this.bindEvents();
            this.gameLoop();
            this.levelTransitioning = false;
            this.bulletGradients = {};
            this.waveCache = {
                angles: new Array(50).fill(0).map((_, i) => (i / 50) * Math.PI * 2),
                sinTable: new Array(360).fill(0).map((_, i) => Math.sin(i * Math.PI / 180))
            };
            this.explosions = [];
            this.currentWave = 0;
            this.drumstickCount = 0;
            this.missileCount = 0;
            this.DRUMSTICKS_PER_MISSILE = 50;
            this.brokenEggs = [];
        });
    }

    loadImages() {
        // Khởi tạo tất cả các Image objects
        const imageList = {
            chicken: 'img/chicken.png',
            chicken2: 'img/chicken2.png',
            player: 'img/player.png',
            egg: 'img/egg.png',
            eggBroken: 'img/eggbroken.png',
            chicken3: 'img/chicken3.png',
            explode: 'img/explode.gif',
            feather: 'img/long.png',
            chicken4: 'img/chicken4.png',
            chicken5: 'img/chicken5.png',
            giftBox: 'img/gif.png',
            giftBox2: 'img/gif2.png',
            giftBox3: 'img/gif3.png',
            chicken6: 'img/chicken6.png',
            chicken_invisible: 'img/chicken_invisible.png',
            chicken7: 'img/chicken7.png',
            boss: 'img/Boss.png',
            drumstick: 'img/duiga.png'
        };

        const promises = Object.entries(imageList).map(([key, src]) => {
            this.images[key] = new Image();
            this.images[key].src = src;
            return new Promise((resolve, reject) => {
                this.images[key].onload = resolve;
                this.images[key].onerror = () => {
                    console.error(`Failed to load image: ${src}`);
                    reject(new Error(`Failed to load image: ${src}`));
                };
            });
        });

        return Promise.all(promises).catch(error => {
            console.error('Error loading images:', error);
        });
    }

    setCanvasSize() {
        console.log('Setting canvas size...');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        console.log('New canvas size:', this.canvas.width, this.canvas.height);
        
        if(this.player) {
            this.player.x = this.canvas.width / 2 - this.player.width / 2;
            this.player.y = this.canvas.height - 100;
        }
        
        // Cập nhật lại boundaries khi resize
        this.boundaries = {
            minX: 30,
            maxX: this.canvas.width - 30,
            minY: 30,
            maxY: this.canvas.height - 80
        };
    }

    init() {
        this.player = {
            x: this.canvas.width / 2 - 20,
            y: this.canvas.height - 80,
            width: 40,
            height: 40,
            speed: this.canvas.width / 360,
            recoilOffset: 0,
            recoilRecovery: 0.8,
            minY: this.canvas.height * 0.1,
            maxY: this.canvas.height - 80,
            tilt: 0,
            maxTilt: 0.15,
            tiltSpeed: 0.05,
            tiltRecovery: 0.85,
            thrustPower: 1,
            minX: 0,
            maxX: this.canvas.width - 50,
            lives: 5,
            isExploding: false,
            explodeTimer: 0,
            explodeDuration: 360,
            respawnTimer: 0,
            respawnDuration: 180,
            respawnPoint: {
                x: this.canvas.width / 2 - 25,
                y: this.canvas.height - 100
            },
            isInvincible: false,
            shieldRadius: 28,
            shieldRotation: 0,
            explosionParticles: [],
            maxExplosionParticles: 25,
            explosionRings: [],
            explosionFlashes: [],
            maxRings: 3,
            maxParticles: 30,
            maxFlashes: 8,
            explosionDebris: [],
            maxDebris: 15,
            weaponLevel: 1,
            maxWeaponLevel: 20,  // Tăng max level lên 20
            weaponType: 'normal', // Đổi lại từ 'lightning' thành 'normal'
        };
        this.bullets = [];
        this.chickens = [];
        this.eggs = [];
        this.explosions = [];
        this.score = 0;
        this.gameOver = false;
        this.keys = {};
        
        this.boundaries = {
            minX: 30,
            maxX: this.canvas.width - 30,
            minY: 30,
            maxY: this.canvas.height - 80
        };

        this.chickenManager = new ChickenManager(
            this.boundaries, 
            this.canvas, 
            LEVELS[this.currentLevel - 1].waves[0].pattern, // Đảm bảo pattern đầu tiên được truyền vào
            this.images
        );
        this.chickens = this.chickenManager.getChickens();
        this.chickenManager.setPlayer(this.player);

        this.stars = [];
        const starCount = (this.canvas.width * this.canvas.height) / 6000;
        for(let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 3 + 2
            });
        }

        this.shootCooldown = 0;
        this.shootDelay = 35;
        this.brokenEggs = [];

        this.feathers = [];

        this.showNotification(MESSAGES.levelStart(LEVELS[this.currentLevel - 1]));
        this.giftBoxes = [];
        this.initLevel();

        // Thêm console.log để debug
        console.log('Current Level:', this.currentLevel);
        console.log('Current Wave Pattern:', LEVELS[this.currentLevel - 1].waves[0].pattern);
        console.log('Boundaries:', this.boundaries);
        console.log('Canvas size:', this.canvas.width, this.canvas.height);
    }

    bindEvents() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if(e.code === 'Space' && this.gameOver) {
                this.init();
            }
            // Thêm xử lý phím M để bắn tên lửa
            if(e.code === 'KeyM' && this.missileCount > 0) {
                this.launchMissile();
            }
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });

        window.addEventListener('resize', () => {
            this.setCanvasSize();
        });
    }

    shoot() {
        if (this.gameOver || this.shootCooldown > 0 || this.player.isExploding) return;

        const baseBulletConfig = {
            x: this.player.x + this.player.width / 2,
            y: this.player.y,
            width: 6,
            height: 50,
            speed: 8,
            type: this.player.weaponType
        };

        const bullets = [];
        const level = this.player.weaponLevel;

        if (this.player.weaponType === 'wave') {
            const level = this.player.weaponLevel;
            // Giảm kích thước cơ bản và tăng trưởng của đạn wave
            const baseWidth = this.canvas.width * 0.15; // Giảm từ 0.3 xuống 0.15 (15% màn hình)
            const waveWidth = baseWidth + (level * this.canvas.width * 0.01); // Giảm tăng trưởng từ 0.025 xuống 0.01
            const segments = Math.min(Math.floor(level / 2) + 3, 10);
            const amplitude = 30 + (level * 2);
            
            bullets.push({
                ...baseBulletConfig,
                x: this.player.x + this.player.width/2,
                y: this.player.y,
                width: waveWidth,
                height: 10,
                amplitude: amplitude,
                phase: 0,
                frequency: 0.1,
                power: 100, // Tăng từ 10 lên 100
                segments: segments,
                maxHeight: this.canvas.height * 0.4,
                progress: 0,
                expandSpeed: 0.03 + (level * 0.001),
                maxRadius: waveWidth * (0.6 + (level * 0.03)),
                startRadius: 20,
                type: 'wave',
                damage: 100 + Math.floor(level / 5) * 50, // Tăng từ 10 lên 100 và tăng 50 mỗi 5 level
                damageRadius: waveWidth
            });
        } else if (this.player.weaponType === 'lightning') {
            // Lightning weapon levels
            const bulletCount = Math.min(Math.floor(level / 3) + 1, 6);
            const spreadAngle = (level * 2) * (Math.PI / 180);

            for (let i = 0; i < bulletCount; i++) {
                let angle = 0;
                if (bulletCount > 1) {
                    angle = spreadAngle * (i / (bulletCount - 1) - 0.5);
                }
                
                bullets.push({
                    ...baseBulletConfig,
                    angle: angle,
                    power: 10 + Math.floor(level / 5) * 5, // Tăng sát thương cơ bản lên 10 và +5 mỗi 5 level
                    chainCount: Math.min(Math.floor(level / 5) + 1, 4),
                    chainRange: 120 + (level * 8),
                    speed: 12,
                    damage: 10 + Math.floor(level / 5) * 5 // Thêm thuộc tính damage để đồng bộ với các loại đạn khác
                });
            }
        } else {
            // Normal weapon levels
            switch (level) {
                case 1:
                    bullets.push({ ...baseBulletConfig });
                    break;
                case 2:
                    bullets.push(
                        { ...baseBulletConfig, x: baseBulletConfig.x - 8 },
                        { ...baseBulletConfig, x: baseBulletConfig.x + 8 }
                    );
                    break;
                case 3:
                    bullets.push(
                        { ...baseBulletConfig, x: baseBulletConfig.x - 12 },
                        { ...baseBulletConfig },
                        { ...baseBulletConfig, x: baseBulletConfig.x + 12 }
                    );
                    break;
                case 4:
                    bullets.push(
                        { ...baseBulletConfig, x: baseBulletConfig.x - 16 },
                        { ...baseBulletConfig, x: baseBulletConfig.x - 8 },
                        { ...baseBulletConfig, x: baseBulletConfig.x + 8 },
                        { ...baseBulletConfig, x: baseBulletConfig.x + 16 }
                    );
                    break;
                default:
                    // Levels 5-20: Giảm số lượng và góc bắn
                    const bulletCount = Math.min(Math.floor(level / 3) + 3, 8);
                    const spreadAngle = (level * 1.5) * (Math.PI / 180);

                    for (let i = 0; i < bulletCount; i++) {
                        let angle = 0;
                        if (bulletCount > 1) {
                            angle = spreadAngle * (i / (bulletCount - 1) - 0.5);
                        }
                        
                        bullets.push({
                            ...baseBulletConfig,
                            angle: angle,
                            power: 1 + (level * 0.1)
                        });
                    }
                    break;
            }
        }

        bullets.forEach(bullet => {
            if (bullet.angle) {
                const speed = bullet.speed;
                bullet.vx = Math.sin(bullet.angle) * speed;
                bullet.vy = -Math.cos(bullet.angle) * speed;
            } else {
                bullet.vx = 0;
                bullet.vy = -bullet.speed;
            }
            this.bullets.push(bullet);
        });

        this.shootCooldown = this.shootDelay;
        this.player.recoilOffset = 10;
    }

    update() {
        if(this.gameOver) return;

        if(this.shootCooldown > 0) {
            this.shootCooldown--;
        }

        if(this.keys['Space'] && this.shootCooldown === 0) {
            this.shoot();
        }

        if(!this.player.isExploding) {
            if(this.keys['ArrowLeft'] || this.keys['KeyA']) {
                if(this.player.x > this.player.minX) {
                    this.player.x -= this.player.speed;
                }
                this.player.tilt = Math.max(-this.player.maxTilt, 
                    this.player.tilt - this.player.tiltSpeed);
            }
            else if(this.keys['ArrowRight'] || this.keys['KeyD']) {
                if(this.player.x < this.player.maxX) {
                    this.player.x += this.player.speed;
                }
                this.player.tilt = Math.min(this.player.maxTilt, 
                    this.player.tilt + this.player.tiltSpeed);
            }
            else {
                this.player.tilt *= this.player.tiltRecovery;
            }

            if(this.keys['ArrowUp'] || this.keys['KeyW']) {
                if(this.player.y > this.player.minY) {
                    this.player.y -= this.player.speed * 0.8;
                }
                this.player.thrustPower = 1.5;
            } else if(this.keys['ArrowDown'] || this.keys['KeyS']) {
                if(this.player.y < this.player.maxY) {
                    this.player.y += this.player.speed * 0.8;
                }
                this.player.thrustPower = 0.7;
            } else {
                this.player.thrustPower = 1;
            }
        }

        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            if (bullet.type === 'lightning') {
                // Tìm gà gần nhất
                let nearestChicken = null;
                let minDistance = Infinity;
                
                this.chickens.forEach(chicken => {
                    const dx = chicken.x + chicken.width/2 - bullet.x;
                    const dy = chicken.y + chicken.height/2 - bullet.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestChicken = chicken;
                    }
                });

                if (nearestChicken) {
                    // Tính hướng đến mục tiêu
                    const targetX = nearestChicken.x + nearestChicken.width/2;
                    const targetY = nearestChicken.y + nearestChicken.height/2;
                    const dx = targetX - bullet.x;
                    const dy = targetY - bullet.y;
                    const angle = Math.atan2(dy, dx);
                    
                    // Tốc độ đuổi theo mục tiêu
                    const speed = 12; // Tăng tốc độ đạn sét
                    bullet.x += Math.cos(angle) * speed;
                    bullet.y += Math.sin(angle) * speed;
                    
                    // Lưu góc để vẽ hiệu ứng
                    bullet.angle = angle;
                    
                    return true;
                }
            }
            // Xử lý các loại đạn khác
            bullet.y -= bullet.speed * Math.cos(bullet.angle || 0);
            bullet.x += bullet.speed * Math.sin(bullet.angle || 0);
            
            return bullet.y > 0;
        });

        this.chickenManager.update();

        // Thêm eggs từ chickens vào mảng eggs của game
        this.chickens.forEach(chicken => {
            if (chicken.eggs && chicken.eggs.length > 0) {
                console.log("Adding eggs from chicken:", chicken.type.id, chicken.eggs.length);
                this.eggs.push(...chicken.eggs);
                chicken.eggs = []; // Clear eggs của chicken sau khi đã thêm vào game
            }
        });

        this.chickens.forEach(chicken => {
            if (chicken.type.id === 6) { // Gà thả boom
                if (!chicken.bombTimer) chicken.bombTimer = 0;
                chicken.bombTimer++;
                
                if (chicken.bombTimer >= chicken.type.bombCooldown) {
                    chicken.bombTimer = 0;
                    
                    // Tính hướng đến player
                    const dx = this.player.x - chicken.x;
                    const dy = this.player.y - chicken.y;
                    const angle = Math.atan2(dy, dx);
                    
                    // Thả một quả bomb nhắm thẳng vào player
                    this.eggs.push({
                        x: chicken.x + chicken.width/2,
                        y: chicken.y + chicken.height,
                        width: 20,
                        height: 25,
                        speed: 4,
                        type: 'bomb',
                        vx: Math.cos(angle) * 4,
                        vy: Math.sin(angle) * 4,
                        rotation: angle,
                        explosionTimer: 45, // Giảm thời gian nổ xuống
                        hasExploded: false,
                        isTargeting: true // Đánh dấu là bomb nhắm mục tiêu
                    });

                    // Thả thêm các bomb phụ theo hình tròn
                    const bombCount = 6;
                    for(let i = 0; i < bombCount; i++) {
                        const spreadAngle = angle + (Math.PI * 2 / bombCount) * i;
                        this.eggs.push({
                            x: chicken.x + chicken.width/2,
                            y: chicken.y + chicken.height,
                            width: 15,
                            height: 20,
                            speed: 3,
                            type: 'bomb',
                            vx: Math.cos(spreadAngle) * 3,
                            vy: Math.sin(spreadAngle) * 3,
                            rotation: spreadAngle,
                            explosionTimer: 60,
                            hasExploded: false
                        });
                    }
                }
            }
            else if (Math.random() < (chicken.type.shootProbability || 0.01)) {
                switch(chicken.type.id) {
                    case 1: // NORMAL
                        this.eggs.push({
                            x: chicken.x + chicken.width/2,
                            y: chicken.y + chicken.height,
                            width: 10,
                            height: 15,
                            speed: 2,
                            type: 'straight'
                        });
                        break;
                    case 2: // BOMBER
                        const dx = this.player.x + this.player.width/2 - (chicken.x + chicken.width/2);
                        const dy = this.player.y - chicken.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        this.eggs.push({
                            x: chicken.x + chicken.width/2,
                            y: chicken.y + chicken.height,
                            width: 12,
                            height: 18,
                            speed: 1,
                            type: 'targeted',
                            directionX: (dx / distance)
                        });
                        break;
                    case 3: // ARMORED
                        const baseSpeed = 3;
                        this.eggs.push({
                            x: chicken.x + chicken.width/2,
                            y: chicken.y + chicken.height,
                            width: 12,
                            height: 16,
                            speed: baseSpeed,
                            type: 'straight'
                        });
                        
                        this.eggs.push({
                            x: chicken.x + chicken.width/2,
                            y: chicken.y + chicken.height,
                            width: 12,
                            height: 16,
                            speed: baseSpeed,
                            type: 'angled',
                            vx: -1.5,
                            vy: baseSpeed
                        });
                        
                        this.eggs.push({
                            x: chicken.x + chicken.width/2,
                            y: chicken.y + chicken.height,
                            width: 12,
                            height: 16,
                            speed: baseSpeed,
                            type: 'angled',
                            vx: 1.5,
                            vy: baseSpeed
                        });
                        break;
                    case 5: // BOSS_MINION - Thêm case xử lý cho gà loại 5
                        // Bắn đạn thng như gà thường
                        this.eggs.push({
                            x: chicken.x + chicken.width/2,
                            y: chicken.y + chicken.height,
                            width: 10,
                            height: 15,
                            speed: 2,
                            type: 'straight'
                        });

                        // Thêm xác suất thả bomb
                        if (Math.random() < 0.2) { // 20% cơ hội thả bomb
                            const pattern = chicken.type.specialAbility.bombPattern;
                            for (let i = 0; i < pattern.bulletCount; i++) {
                                const angle = (Math.PI * 2 / pattern.bulletCount) * i;
                                this.eggs.push({
                                    x: chicken.x + chicken.width/2,
                                    y: chicken.y + chicken.height/2,
                                    width: pattern.size.width,
                                    height: pattern.size.height,
                                    speed: pattern.speed,
                                    type: 'radial',
                                    vx: Math.cos(angle) * pattern.speed,
                                    vy: Math.sin(angle) * pattern.speed
                                });
                            }
                        }
                        break;
                }
            }
        });

        this.eggs.forEach((egg, index) => {
            if (egg.type === 'straight') {
                egg.y += egg.speed;
            } 
            else if (egg.type === 'targeted') {
                egg.y += egg.speed;
                egg.x += egg.directionX * egg.speed;
            }
            else if (egg.type === 'angled') {
                egg.x += egg.vx;
                egg.y += egg.vy;
            }
            else if (egg.type === 'radial') {
                egg.x += egg.vx;
                egg.y += egg.vy;
            }
            else if (egg.type === 'normal' || egg.type === 'explosive' || egg.type === 'homing' || egg.type === 'splitting') {
                // Xử lý đạn homing - theo dõi player
                if (egg.type === 'homing' && egg.targetPlayer && this.player) {
                    const dx = this.player.x - egg.x;
                    const dy = this.player.y - egg.y;
                    const angle = Math.atan2(dy, dx);
                    egg.vx += Math.cos(angle) * egg.homingStrength;
                    egg.vy += Math.sin(angle) * egg.homingStrength;
                }

                // Di chuyển đạn
                egg.x += egg.vx;
                egg.y += egg.vy;

                // Xử lý đạn nổ
                if (egg.type === 'explosive' && egg.explosionTimer > 0) {
                    egg.explosionTimer--;
                    if (egg.explosionTimer <= 0 && !egg.hasExploded) {
                        // Tạo vụ nổ
                        this.explosions.push({
                            x: egg.x,
                            y: egg.y,
                            radius: egg.explosionRadius,
                            alpha: 1,
                            timer: 30
                        });
                        egg.hasExploded = true;
                        this.eggs.splice(index, 1);
                    }
                }

                // Xử lý đạn phân tách
                if (egg.type === 'splitting' && egg.splitTimer > 0) {
                    egg.splitTimer--;
                    if (egg.splitTimer <= 0) {
                        // Tạo các đạn con
                        const angleStep = (Math.PI * 2) / egg.splitCount;
                        for (let i = 0; i < egg.splitCount; i++) {
                            const angle = i * angleStep;
                            this.eggs.push({
                                x: egg.x,
                                y: egg.y,
                                width: egg.width * 0.6,
                                height: egg.height * 0.6,
                                speed: egg.speed * 0.8,
                                type: 'normal',
                                vx: Math.cos(angle) * egg.speed * 0.8,
                                vy: Math.sin(angle) * egg.speed * 0.8
                            });
                        }
                        this.eggs.splice(index, 1);
                    }
                }
            }

            // Kiểm tra đạn ra khỏi màn hình
            if (egg.y > this.canvas.height || 
                egg.y < 0 || 
                egg.x < 0 || 
                egg.x > this.canvas.width) {
                this.eggs.splice(index, 1);
            }
        });

        this.brokenEggs.forEach((egg, index) => {
            // Cập nhật vị trí nếu có vận tốc
            if (egg.vx !== undefined) {
                egg.x += egg.vx;
                egg.y += egg.vy;
                egg.vy += 0.1; // Gravity
                egg.rotation += egg.rotationSpeed || 0;

                // Kiểm tra va chạm với player
                if (!this.player.isInvincible && !this.player.isExploding) {
                    const dx = (this.player.x + this.player.width/2) - egg.x;
                    const dy = (this.player.y + this.player.height/2) - egg.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < (this.player.width + egg.width) / 3) {
                        this.player.lives--;
                        if (this.player.lives <= 0) {
                            this.gameOver = true;
                        } else {
                            this.player.isExploding = true;
                            this.player.explodeTimer = this.player.explodeDuration;
                            
                            // Thêm hiệu ứng nổ
                            for (let i = 0; i < 5; i++) {
                                this.explosions.push({
                                    x: this.player.x + Math.random() * this.player.width,
                                    y: this.player.y + Math.random() * this.player.height,
                                    width: 30,
                                    height: 30,
                                    alpha: 1.0
                                });
                            }
                        }
                        // Xóa mảnh vỡ sau khi va chạm
                        this.brokenEggs.splice(index, 1);
                    }
                }
            }

            egg.timer--;
            if(egg.timer <= 0) {
                egg.alpha -= egg.timer === 900 ? 0.005 : 0.01;
                if(egg.alpha <= 0) {
                    this.brokenEggs.splice(index, 1);
                }
            }
        });

        this.checkCollisions();

        this.stars.forEach(star => {
            star.y += star.speed;
            if(star.y > this.canvas.height) {
                star.y = 0;
                star.x = Math.random() * this.canvas.width;
            }
        });

        this.chickens.forEach(chicken => {
            if(chicken.hitEffect > 0) {
                chicken.hitEffect--;
                chicken.hitOffsetX *= 0.85;
                chicken.hitOffsetY *= 0.85;
                chicken.shakeAmount *= 0.85;
            }
        });

        if(this.player.recoilOffset > 0) {
            this.player.recoilOffset *= this.player.recoilRecovery;
        }

        if (this.feathers.length > 0) {
            this.feathers.forEach((feather, index) => {
                feather.x += feather.vx;
                feather.y += feather.vy;
                feather.vy += feather.gravity;
                feather.rotation += feather.rotationSpeed;
                feather.alpha -= 0.01;
                
                if(feather.alpha <= 0) {
                    this.feathers.splice(index, 1);
                }
            });
        }

        this.updateNotifications();
        this.checkLevelComplete();

        // Update gift boxes
        this.giftBoxes.forEach((giftBox, index) => {
            giftBox.y += giftBox.speed;

            // Check if the player is close enough to collect the gift box
            const dx = giftBox.x - (this.player.x + this.player.width / 2);
            const dy = giftBox.y - (this.player.y + this.player.height / 2);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 50) { // Adjust this value for proximity
                if (giftBox.type === 'powerup') {
                    // Power up: tăng 3 level
                    this.player.weaponLevel = Math.min(this.player.weaponLevel + 3, this.player.maxWeaponLevel);
                } else if (giftBox.type === this.player.weaponType) {
                    // Nếu cùng loại thì tăng 1 level
                    this.player.weaponLevel = Math.min(this.player.weaponLevel + 1, this.player.maxWeaponLevel);
                } else {
                    // Nếu khác loại thì đổi loại
                    this.player.weaponType = giftBox.type;
                }
                this.giftBoxes.splice(index, 1);
            }

            // Remove gift box if it goes off-screen
            if (giftBox.y > this.canvas.height) {
                this.giftBoxes.splice(index, 1);
            }
        });

        // Trong phương thức update, thêm xử lý chuyển động cho gà loại 6
        this.chickens.forEach(chicken => {
            if (chicken.type.id === 6) {
                // Khởi tạo các thuộc tính chuyển động nếu chưa có
                if (!chicken.moveDirection) {
                    chicken.moveDirection = 1;
                    chicken.moveSpeed = 3;
                    chicken.minX = this.boundaries.minX + 50;
                    chicken.maxX = this.boundaries.maxX - 50 - chicken.width;
                }

                // Di chuyển qua lại
                chicken.x += chicken.moveSpeed * chicken.moveDirection;

                // Đổi hướng khi chạm biên
                if (chicken.x <= chicken.minX) {
                    chicken.moveDirection = 1;
                    chicken.x = chicken.minX;
                } else if (chicken.x >= chicken.maxX) {
                    chicken.moveDirection = -1;
                    chicken.x = chicken.maxX;
                }

                // Cập nhật baseX để các hiệu ứng khác hoạt động đúng
                chicken.baseX = chicken.x;
            }
        });

        if(this.player.isExploding) {
            if(this.player.explosionRings.length < this.player.maxRings) {
                this.player.explosionRings.push({
                    x: this.player.x + this.player.width/2,
                    y: this.player.y + this.player.height/2,
                    radius: 0,
                    maxRadius: this.player.width * (2 + Math.random()),
                    speed: 3 + Math.random() * 2,
                    alpha: 1
                });
            }

            if(this.player.explosionParticles.length < this.player.maxParticles) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 2 + Math.random() * 4;
                this.player.explosionParticles.push({
                    x: this.player.x + this.player.width/2,
                    y: this.player.y + this.player.height/2,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    size: 3 + Math.random() * 3,
                    alpha: 1,
                    gravity: 0.1,
                    color: `hsl(${30 + Math.random() * 30}, 100%, 50%)`
                });
            }

            // Cập nhật các hiệu ứng nổ
            this.player.explosionRings.forEach((ring, index) => {
                ring.radius += ring.speed;
                ring.alpha -= 0.02;
                if(ring.alpha <= 0 || ring.radius >= ring.maxRadius) {
                    this.player.explosionRings.splice(index, 1);
                }
            });

            this.player.explosionParticles.forEach((particle, index) => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += particle.gravity;
                particle.alpha -= 0.01;
                if(particle.alpha <= 0) {
                    this.player.explosionParticles.splice(index, 1);
                }
            });

            this.player.explodeTimer--;
            if(this.player.explodeTimer <= 0) {
                this.player.isExploding = false;
                this.player.explosionParticles = [];
                this.player.explosionRings = [];
                this.player.respawnTimer = this.player.respawnDuration;
                this.player.isInvincible = true;
                this.player.x = this.player.respawnPoint.x;
                this.player.y = this.player.respawnPoint.y;
            }
        }

        if(this.player.respawnTimer > 0) {
            this.player.respawnTimer--;
            this.player.shieldRotation += 0.05;
            if(this.player.respawnTimer <= 0) {
                this.player.isInvincible = false;
            }
        }

        // Cập nhật đùi gà
        this.drumsticks = this.drumsticks.filter(drumstick => 
            drumstick.update(this.player, this.canvas)
        );

        // Cập nhật vị trí trứng và kiểm tra va chạm với viền
        this.eggs = this.eggs.filter(egg => {
            egg.y += egg.speed || 1; // Giảm từ 3 xuống 1
            
            // Kiểm tra va chạm với viền màn hình
            if (egg.x < 0 || egg.x > this.canvas.width || egg.y > this.player.y + this.player.height/2) {
                // Thêm hiệu ứng trứng vỡ
                this.brokenEggs.push({
                    x: egg.x,
                    y: Math.min(egg.y, this.player.y + this.player.height/2),
                    width: egg.width * 3.5,
                    height: egg.height * 3,
                    alpha: 1.0,
                    timer: 180
                });
                return false;
            }
            return true;
        });
    }

    checkCollisions() {
        // Kiểm tra va chạm giữa đạn và gà
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            for (let j = this.chickens.length - 1; j >= 0; j--) {
                const chicken = this.chickens[j];
                
                if (this.isColliding(bullet, chicken)) {
                    // Xóa đạn
                    this.bullets.splice(i, 1);

                    // Tạo hiệu ứng rung lắc và lông
                    chicken.hitEffect = 10;
                    chicken.hitOffsetX = (Math.random() - 0.5) * 10;
                    chicken.hitOffsetY = -25;
                    chicken.shakeAmount = 8;

                    // Xử lý sát thương
                    if (chicken.type.id === 5 && chicken.customState.shieldActive) {
                        chicken.customState.shieldHealth -= bullet.type === 'normal' ? 2 : 1;
                        if (chicken.customState.shieldHealth <= 0) {
                            chicken.customState.shieldActive = false;
                        }
                    } else {
                        if (bullet.type === 'normal') {
                            chicken.health -= 2;
                        } else {
                            chicken.health--;
                        }
                    }

                    // Tạo hiệu ứng lông
                    const featherCount = bullet.type === 'normal' ? 6 : 4;
                    for (let k = 0; k < featherCount; k++) {
                        const angle = (Math.PI * 2 / featherCount) * k + Math.random() * 0.5;
                        const speed = bullet.type === 'normal' ? 1.5 + Math.random() * 2.5 : 1 + Math.random() * 2;
                        this.feathers.push({
                            x: chicken.x + chicken.width / 2,
                            y: chicken.y + chicken.height / 2,
                            rotation: Math.random() * Math.PI * 2,
                            rotationSpeed: (Math.random() - 0.5) * 0.2,
                            vx: Math.cos(angle) * speed,
                            vy: Math.sin(angle) * speed - 1,
                            gravity: 0.05,
                            alpha: 1,
                            size: chicken.width * 0.3
                        });
                    }

                    // Kiểm tra gà chết
                    if (chicken.health <= 0) {
                        // Cộng điểm
                        this.score += chicken.type.points;

                        // Tạo hiệu ứng lông khi chết
                        for (let k = 0; k < 15; k++) {
                            const angle = (Math.PI * 2 / 15) * k + Math.random() * 0.5;
                            const speed = 2 + Math.random() * 3;
                            this.feathers.push({
                                x: chicken.x + chicken.width / 2,
                                y: chicken.y + chicken.height / 2,
                                rotation: Math.random() * Math.PI * 2,
                                rotationSpeed: (Math.random() - 0.5) * 0.3,
                                vx: Math.cos(angle) * speed,
                                vy: Math.sin(angle) * speed - 2,
                                gravity: 0.05,
                                alpha: 1,
                                size: chicken.width * 0.4
                            });
                        }

                        // Xử lý rơi gift box và giảm level
                        const dropChance = Math.random();
                        if (dropChance < 0.075) { // Giảm từ 0.15 (15%) xuống 0.075 (7.5%)
                            const currentWeaponType = this.player.weaponType;
                            const randomValue = Math.random();
                            
                            if (randomValue < 0.6) { // 60% của 7.5% = 4.5% cơ hội rơi cùng loại vũ khí
                                this.giftBoxes.push({
                                    x: chicken.x + chicken.width/2,
                                    y: chicken.y + chicken.height/2,
                                    width: 30,
                                    height: 30,
                                    speed: 2,
                                    type: currentWeaponType,
                                    image: currentWeaponType === 'normal' ? this.images.giftBox :
                                          currentWeaponType === 'lightning' ? this.images.giftBox2 :
                                          this.images.giftBox3
                                });
                            } 
                            else if (randomValue < 0.8) { // 20% của 7.5% = 1.5% cơ hội đổi loại vũ khí
                                const otherTypes = ['normal', 'lightning', 'wave'].filter(t => t !== currentWeaponType);
                                const newType = otherTypes[Math.floor(Math.random() * otherTypes.length)];
                                this.giftBoxes.push({
                                    x: chicken.x + chicken.width/2,
                                    y: chicken.y + chicken.height/2,
                                    width: 30,
                                    height: 30,
                                    speed: 2,
                                    type: newType,
                                    image: newType === 'normal' ? this.images.giftBox :
                                          newType === 'lightning' ? this.images.giftBox2 :
                                          this.images.giftBox3
                                });
                            }
                            else { // 20% của 7.5% = 1.5% cơ hội powerup
                                this.giftBoxes.push({
                                    x: chicken.x + chicken.width/2,
                                    y: chicken.y + chicken.height/2,
                                    width: 30,
                                    height: 30,
                                    speed: 2,
                                    type: 'powerup',
                                    image: this.images.giftBox
                                });
                            }
                        }

                        // Xóa gà
                        this.chickens.splice(j, 1);

                        // Thêm đùi gà dựa trên loại gà
                        const drumstickCount = Math.min(Math.ceil(chicken.type.id * 1.5), 8);
                        console.log('Creating drumsticks:', {
                            count: drumstickCount,
                            x: chicken.x + chicken.width/2,
                            y: chicken.y + chicken.height/2,
                            image: this.images.drumstick
                        });
                        const newDrumsticks = createDrumsticks(
                            chicken.x + chicken.width/2,
                            chicken.y + chicken.height/2,
                            drumstickCount,
                            this.images.drumstick
                        );
                        console.log('Created drumsticks:', newDrumsticks);
                        this.drumsticks.push(...newDrumsticks);
                    }
                    break;
                }
            }
        }

        // Kiểm tra va chạm giữa trứng và player
        this.eggs.forEach((egg, index) => {
            if (!this.player.isInvincible && !this.player.isExploding) {
                if (this.isColliding(egg, this.player)) {
                    // Xóa trứng
                    this.eggs.splice(index, 1);

                    // Tính sát thương dựa trên loại đạn
                    const damage = egg.damage || 1; // Mặc định là 1 nếu không có thuộc tính damage
                    
                    // Giảm mạng theo sát thương
                    this.player.lives -= damage;
                    
                    // Giảm 30% level vũ khí khi chết
                    this.player.weaponLevel = Math.max(1, Math.floor(this.player.weaponLevel * 0.7));
                    
                    if (this.player.lives <= 0) {
                        this.gameOver = true;
                    } else {
                        // Bắt đầu hiệu ứng nổ
                        this.player.isExploding = true;
                        this.player.explodeTimer = this.player.explodeDuration;
                        
                        // Thêm hiệu ứng nổ
                        for (let i = 0; i < 5; i++) {
                            this.explosions.push({
                                x: this.player.x + Math.random() * this.player.width,
                                y: this.player.y + Math.random() * this.player.height,
                                width: 30,
                                height: 30,
                                alpha: 1.0
                            });
                        }
                    }

                    // Thêm hiu ứng vỡ trứng
                    this.brokenEggs.push({
                        x: egg.x,
                        y: egg.y,
                        width: egg.width * 3.5,
                        height: egg.height * 3,
                        alpha: 1.0,
                        timer: 180
                    });
                }
            }
        });

        // Kiểm tra va chạm với laser của gà 7
        this.chickens.forEach(chicken => {
            if (chicken.type.id === 7 && chicken.hasLaser && !this.player.isInvincible && !this.player.isExploding) {
                const laserCount = chicken.type.specialAbility.laserCount;
                const centerX = chicken.x + chicken.width/2;
                const centerY = chicken.y + chicken.height/2;
                
                // Kiểm tra từng tia laser
                for (let i = 0; i < laserCount; i++) {
                    const angle = chicken.laserRotation + (Math.PI * 2 / laserCount) * i;
                    
                    // Tính điểm cuối của laser
                    let endX, endY;
                    if (chicken.spiralActive) {
                        // Kiểm tra va chạm với laser xoắn
                        const points = 100;
                        const amplitude = chicken.type.specialAbility.spiralAmplitude;
                        const frequency = chicken.type.specialAbility.spiralFrequency;
                        
                        for (let j = 0; j <= points; j++) {
                            const distance = (j / points) * chicken.currentLaserLength;
                            const spiralX = Math.cos(angle) * distance;
                            const spiralY = Math.sin(angle) * distance;
                            const waveOffset = Math.sin(distance * frequency + chicken.laserRotation) * 
                                (amplitude * (distance / chicken.currentLaserLength));
                            
                            endX = centerX + spiralX - Math.sin(angle) * waveOffset;
                            endY = centerY + spiralY + Math.cos(angle) * waveOffset;
                            
                            // Kiểm tra khoảng cách từ player đến điểm laser
                            const playerCenterX = this.player.x + this.player.width/2;
                            const playerCenterY = this.player.y + this.player.height/2;
                            const dx = playerCenterX - endX;
                            const dy = playerCenterY - endY;
                            const distance2 = Math.sqrt(dx * dx + dy * dy);
                            
                            if (distance2 < this.player.width/2) {
                                this.player.lives--;
                                if (this.player.lives <= 0) {
                                    this.gameOver = true;
                                } else {
                                    this.player.isExploding = true;
                                    this.player.explodeTimer = this.player.explodeDuration;
                                    
                                    // Thêm hiệu ứng nổ
                                    for (let k = 0; k < 5; k++) {
                                        this.explosions.push({
                                            x: this.player.x + Math.random() * this.player.width,
                                            y: this.player.y + Math.random() * this.player.height,
                                            width: 30,
                                            height: 30,
                                            alpha: 1.0
                                        });
                                    }
                                }
                                return; // Thoát ngay khi phát hiện va chạm
                            }
                        }
                    } else {
                        // Kiểm tra va chạm với laser thẳng
                        endX = centerX + Math.cos(angle) * chicken.currentLaserLength;
                        endY = centerY + Math.sin(angle) * chicken.currentLaserLength;
                        
                        // Kiểm tra va chạm b���ng cách tính khoảng cách từ player đến đường thẳng laser
                        const playerCenterX = this.player.x + this.player.width/2;
                        const playerCenterY = this.player.y + this.player.height/2;
                        
                        const distance = this.pointToLineDistance(
                            playerCenterX, playerCenterY,
                            centerX, centerY,
                            endX, endY
                        );
                        
                        if (distance < this.player.width/3) {
                            this.player.lives--;
                            if (this.player.lives <= 0) {
                                this.gameOver = true;
                            } else {
                                this.player.isExploding = true;
                                this.player.explodeTimer = this.player.explodeDuration;
                                
                                // Thêm hiệu ứng nổ
                                for (let k = 0; k < 5; k++) {
                                    this.explosions.push({
                                        x: this.player.x + Math.random() * this.player.width,
                                        y: this.player.y + Math.random() * this.player.height,
                                        width: 30,
                                        height: 30,
                                        alpha: 1.0
                                    });
                                }
                            }
                            return; // Thoát ngay khi phát hiện va chạm
                        }
                    }
                }
            }
        });

        // Kiểm tra va chm đạn với gà
        this.bullets.forEach((bullet, i) => {
            if (bullet.type === 'wave') {
                this.chickens.forEach((chicken, j) => {
                    const dx = chicken.x + chicken.width/2 - bullet.x;
                    const dy = chicken.y + chicken.height/2 - bullet.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    const effectiveRadius = bullet.maxRadius * bullet.progress;
                    
                    if (distance < effectiveRadius) {
                        // Gây sát thương trực tiếp từ thuộc tính damage của đạn
                        chicken.health -= bullet.damage;
                        
                        if (chicken.health <= 0) {
                            this.score += chicken.type.points;
                            this.createExplosionEffects(chicken);
                            this.chickens.splice(j, 1);
                        }
                    }
                });
            } else {
                // Xử lý va chạm cho các loại đạn khác (giữ nguyên code cũ)
                this.chickens.forEach((chicken, j) => {
                    // ... code cũ ...
                });
            }
        });

        // Thêm xử lý va chạm với gift boxes
        this.giftBoxes.forEach((giftBox, index) => {
            if (this.isColliding(this.player, giftBox)) {
                if (giftBox.type === 'powerup') {
                    // Tăng level vũ khí hiện tại
                    this.player.weaponLevel = Math.min(this.player.weaponLevel + 1, this.player.maxWeaponLevel);
                } else {
                    // Nếu là gift box vũ khí
                    if (giftBox.type !== this.player.weaponType) {
                        // Chuyển sang loại vũ khí mới và tăng 2 level
                        this.player.weaponType = giftBox.type;
                        this.player.weaponLevel = Math.min(this.player.weaponLevel + 2, this.player.maxWeaponLevel);
                    } else {
                        // Nếu cùng loại vũ khí thì chỉ tăng 1 level
                        this.player.weaponLevel = Math.min(this.player.weaponLevel + 1, this.player.maxWeaponLevel);
                    }
                }
                
                // Hiệu ứng khi nhặt gift box
                this.createPowerupEffect(giftBox.x, giftBox.y, giftBox.type);
                
                // Xóa gift box
                this.giftBoxes.splice(index, 1);
            }
        });

        // Trong phương thức checkCollisions
        this.drumsticks = this.drumsticks.filter(drumstick => {
            if (!drumstick.isCollected && this.isColliding(drumstick, this.player)) {
                this.drumstickCount++;
                // Kiểm tra và tạo tên lửa nếu đủ điều kiện
                if (this.drumstickCount >= this.DRUMSTICKS_PER_MISSILE) {
                    this.drumstickCount -= this.DRUMSTICKS_PER_MISSILE;
                    this.missileCount++;
                    // Hiệu ứng khi tạo tên lửa
                    this.showNotification({
                        title: "Missile Created!",
                        subtitle: "Press M to launch",
                        message: `Missiles: ${this.missileCount}`,
                        duration: 2000
                    });
                }
                return false; // Xóa đùi gà sau khi nhặt
            }
            return true; // Giữ lại đùi gà nếu chưa nhặt
        });
    }

    isColliding(rect1, rect2) {
        const centerX1 = rect1.x + rect1.width/2;
        const centerY1 = rect1.y + rect1.height/2;
        const centerX2 = rect2.x + rect2.width/2;
        const centerY2 = rect2.y + rect2.height/2;
        
        const dx = centerX1 - centerX2;
        const dy = centerY1 - centerY2;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const allowedDistance = (rect1.width + rect2.width) / 3;
        
        return distance < allowedDistance;
    }

    draw() {
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, '#000033');
        bgGradient.addColorStop(1, '#000066');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.stars.forEach(star => {
            const brightness = 0.5 + Math.random() * 0.5;
            this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();

            if(Math.random() < 0.1) {
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${brightness * 0.5})`;
                this.ctx.lineWidth = 0.5;
                this.ctx.beginPath();
                this.ctx.moveTo(star.x - star.size * 2, star.y);
                this.ctx.lineTo(star.x + star.size * 2, star.y);
                this.ctx.moveTo(star.x, star.y - star.size * 2);
                this.ctx.lineTo(star.x, star.y + star.size * 2);
                this.ctx.stroke();
            }
        });

        for(let i = 0; i < 3; i++) {
            const y = (Date.now() * 0.1 + i * 500) % this.canvas.height;
            const gradient = this.ctx.createLinearGradient(0, y, 0, y + 100);
            gradient.addColorStop(0, 'rgba(100, 100, 255, 0)');
            gradient.addColorStop(0.5, 'rgba(100, 100, 255, 0.05)');
            gradient.addColorStop(1, 'rgba(100, 100, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, y, this.canvas.width, 100);
        }

        this.brokenEggs.forEach(egg => {
            this.ctx.save();
            this.ctx.globalAlpha = egg.alpha;

            if(egg.vx !== undefined) {
                egg.x += egg.vx;
                egg.y += egg.vy;
                egg.vy += 0.1;
                egg.rotation += egg.rotationSpeed;
                this.ctx.translate(egg.x, egg.y);
                this.ctx.rotate(egg.rotation);
            }

            this.ctx.drawImage(
                this.images.eggBroken,
                egg.vx !== undefined ? -egg.width/2 : egg.x - egg.width/2,
                egg.vx !== undefined ? -egg.height/2 : egg.y - egg.height/2,
                egg.width,
                egg.height
            );
            this.ctx.restore();
        });

        this.feathers.forEach(feather => {
            this.ctx.save();
            this.ctx.translate(feather.x, feather.y);
            this.ctx.rotate(feather.rotation);
            this.ctx.globalAlpha = feather.alpha;
            
            this.ctx.drawImage(
                this.images.feather,
                -feather.size/2,
                -feather.size/2,
                feather.size,
                feather.size
            );
            
            this.ctx.restore();
        });

        this.bullets.forEach(bullet => {
            this.drawBullet(bullet);
        });

        this.explosions.forEach((explosion, index) => {
            this.ctx.globalAlpha = explosion.alpha;
            
            this.ctx.fillStyle = '#ff4444';
            this.ctx.beginPath();
            this.ctx.arc(
                explosion.x + explosion.width/2,
                explosion.y + explosion.height/2,
                explosion.width/2,
                0, Math.PI * 2
            );
            this.ctx.fill();
            
            this.ctx.strokeStyle = '#ff0';
            for(let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                this.ctx.beginPath();
                this.ctx.moveTo(
                    explosion.x + explosion.width/2,
                    explosion.y + explosion.height/2
                );
                this.ctx.lineTo(
                    explosion.x + explosion.width/2 + Math.cos(angle) * explosion.width,
                    explosion.y + explosion.height/2 + Math.sin(angle) * explosion.height
                );
                this.ctx.stroke();
            }
            
            this.ctx.globalAlpha = 1.0;
            explosion.alpha -= 0.02;
            if(explosion.alpha <= 0) {
                this.explosions.splice(index, 1);
            }
        });

        // Draw UI
        this.ctx.save();
        
        // Vẽ các chỉ số theo thứ tự từ trái sang phải
        const startX = 10;  // Giảm vị trí bắt đầu
        const topY = 25;    // Tăng khoảng cách từ top để dễ nhìn
        let currentX = startX;

        // 1. Lives (Mạng)
        this.ctx.fillStyle = '#ff3366';
        this.ctx.font = '20px bootstrap-icons'; // Giảm font size
        this.ctx.textAlign = 'left';
        this.ctx.shadowColor = '#ff3366';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('❤️', currentX, topY);
        this.ctx.font = 'bold 20px "Be Vietnam Pro"';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`x${this.player.lives}`, currentX + 25, topY);
        currentX += 60; // Giảm khoảng cách

        // 2. Weapon Level
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '20px bootstrap-icons';
        this.ctx.shadowColor = '#00ff00';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('⚔️', currentX, topY);
        this.ctx.font = 'bold 20px "Be Vietnam Pro"';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`${this.player.weaponLevel}`, currentX + 25, topY);
        currentX += 60;

        // 3. Drumstick Count
        this.ctx.fillStyle = '#ffa500';
        this.ctx.font = '20px bootstrap-icons';
        this.ctx.shadowColor = '#ffa500';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('🍗', currentX, topY);
        this.ctx.font = 'bold 20px "Be Vietnam Pro"';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`${this.drumstickCount}/${this.DRUMSTICKS_PER_MISSILE}`, currentX + 25, topY);
        currentX += 100;

        // 4. Missile Count
        this.ctx.fillStyle = '#ff4444';
        this.ctx.font = '20px bootstrap-icons';
        this.ctx.shadowColor = '#ff4444';
        this.ctx.shadowBlur = 10;
        this.ctx.fillText('🚀', currentX, topY);
        this.ctx.font = 'bold 20px "Be Vietnam Pro"';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(`x${this.missileCount}`, currentX + 25, topY);
        currentX += 80;

        // 5. Wave (giữa màn hình)
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = 'bold 20px "Be Vietnam Pro"';
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ffd700';
        this.ctx.fillText(`MÀN ${this.currentLevel}`, this.canvas.width / 2, topY);

        // 6. Score (Điểm số - bên phải)
        this.ctx.fillStyle = '#ffd700';
        this.ctx.font = '20px bootstrap-icons';
        this.ctx.textAlign = 'right';
        this.ctx.shadowColor = '#ffd700';
        this.ctx.shadowBlur = 10;
        const scoreX = this.canvas.width - 20; // Cách mép phải 20px
        this.ctx.fillText('⭐', scoreX - 80, topY);
        this.ctx.font = 'bold 20px "Be Vietnam Pro"';
        this.ctx.fillStyle = '#fff';
        this.ctx.fillText(this.score.toString().padStart(6, '0'), scoreX, topY);

        this.ctx.restore();

        this.feathers.forEach(feather => {
            this.ctx.save();
            this.ctx.translate(feather.x, feather.y);
            this.ctx.rotate(feather.rotation);
            this.ctx.globalAlpha = feather.alpha;
            
            this.ctx.drawImage(
                this.images.feather,
                -feather.size/2,
                -feather.size/2,
                feather.size,
                feather.size
            );
            
            this.ctx.restore();
        });

        this.drawNotifications();
        
        if(this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '40px Arial';
            this.ctx.fillText('GAME OVER', this.canvas.width/2 - 100, this.canvas.height/2);
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press SPACE to restart', this.canvas.width/2 - 90, this.canvas.height/2 + 40);
        }

        // Draw gift boxes
        this.giftBoxes.forEach(giftBox => {
            this.ctx.drawImage(
                giftBox.image, // Use the stored image
                giftBox.x - giftBox.width / 2,
                giftBox.y - giftBox.height / 2,
                giftBox.width,
                giftBox.height
            );
        });

        this.chickens.forEach(chicken => {
            chicken.draw(this.ctx);
        });

        this.eggs.forEach(egg => {
            if (egg.type === 'bomb') {
                this.ctx.save();
                
                // Vẽ hiệu ứng cảnh báo khi sắp nổ
                if (egg.explosionTimer < 30) {
                    this.ctx.shadowBlur = 20;
                    this.ctx.shadowColor = 'red';
                    const warningAlpha = (Math.sin(Date.now() * 0.02) + 1) / 2;
                    this.ctx.strokeStyle = `rgba(255, 0, 0, ${warningAlpha})`;
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.arc(egg.x, egg.y, 15, 0, Math.PI * 2);
                    this.ctx.stroke();
                }

                // Vẽ boom với hiệu ứng xoay
                this.ctx.translate(egg.x, egg.y);
                this.ctx.rotate(egg.rotation);
                this.ctx.drawImage(
                    this.images.egg,
                    -egg.width/2,
                    -egg.height/2,
                    egg.width,
                    egg.height
                );
                
                this.ctx.restore();
            } else {
                this.ctx.save();
                
                // Vẽ tất cả các loại đạn của Boss bằng hình trứng
                if (egg.type === 'normal' || egg.type === 'explosive' || egg.type === 'homing' || egg.type === 'splitting') {
                    // Thêm hiệu ứng glow cho trứng
                    this.ctx.shadowColor = '#ff0000';
                    this.ctx.shadowBlur = 15;
                    
                    // Xoay trứng theo hướng bay
                    this.ctx.translate(egg.x, egg.y);
                    this.ctx.rotate(Math.atan2(egg.vy, egg.vx) + Math.PI/2);
                    
                    // Vẽ trứng với màu sắc khác nhau tùy loại
                    this.ctx.globalAlpha = 0.8;
                    switch(egg.type) {
                        case 'explosive':
                            this.ctx.fillStyle = '#ff4444';
                            break;
                        case 'homing':
                            this.ctx.fillStyle = '#ff00ff';
                            break;
                        case 'splitting':
                            this.ctx.fillStyle = '#ffff00';
                            break;
                        default:
                            this.ctx.fillStyle = '#ff0000';
                    }
                    
                    // Vẽ trứng
                    this.ctx.drawImage(
                        this.images.egg,
                        -egg.width,
                        -egg.height,
                        egg.width * 2,
                        egg.height * 2
                    );
                } else {
                    // Vẽ trứng thường
                    this.ctx.drawImage(
                        this.images.egg,
                        egg.x - egg.width/2,
                        egg.y - egg.height/2,
                        egg.width * 2,
                        egg.height * 2
                    );
                }
                
                this.ctx.restore();
            }
        });

        // Vẽ các vụ nổ
        this.explosions.forEach((explosion, index) => {
            if (explosion.timer > 0) {
                explosion.timer--;
                const gradient = this.ctx.createRadialGradient(
                    explosion.x, explosion.y, 0,
                    explosion.x, explosion.y, explosion.radius
                );
                gradient.addColorStop(0, `rgba(255, 200, 0, ${explosion.alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 100, 0, ${explosion.alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
                this.ctx.fill();

                explosion.alpha *= 0.9;
            } else {
                this.explosions.splice(index, 1);
            }
        });

        // Vẽ player
        if(!this.player.isExploding) {
            if(this.player.isInvincible) {
                this.ctx.save();
                this.ctx.translate(
                    this.player.x + this.player.width/2,
                    this.player.y + this.player.height/2
                );
                this.ctx.rotate(this.player.shieldRotation);
                
                this.ctx.beginPath();
                this.ctx.arc(0, 0, this.player.shieldRadius, 0, Math.PI * 2);
                this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
                
                for(let i = 0; i < 8; i++) {
                    const angle = (Math.PI * 2 / 8) * i;
                    this.ctx.beginPath();
                    this.ctx.moveTo(
                        Math.cos(angle) * (this.player.shieldRadius - 5),
                        Math.sin(angle) * (this.player.shieldRadius - 5)
                    );
                    this.ctx.lineTo(
                        Math.cos(angle) * (this.player.shieldRadius + 5),
                        Math.sin(angle) * (this.player.shieldRadius + 5)
                    );
                    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
                    this.ctx.stroke();
                }
                
                this.ctx.restore();
            }

            this.ctx.save();
            this.ctx.translate(
                this.player.x + this.player.width/2,
                this.player.y + this.player.height/2 + this.player.recoilOffset
            );
            this.ctx.rotate(this.player.tilt);

            const engineFlame = Math.random() * 8;
            for(let i = 0; i < 3; i++) {
                const flameGradient = this.ctx.createLinearGradient(
                    0, this.player.height/2,
                    0, this.player.height/2 + (15 + engineFlame) * this.player.thrustPower
                );
                flameGradient.addColorStop(0, '#ff0000');
                flameGradient.addColorStop(0.4, '#ff6600');
                flameGradient.addColorStop(1, '#ffff00');

                this.ctx.fillStyle = flameGradient;
                
                this.ctx.beginPath();
                const flameWidth = 8;
                const flameHeight = (12 + engineFlame) * this.player.thrustPower;
                const x = -10 + i * 10;
                
                this.ctx.ellipse(
                    x,
                    this.player.height/2 + flameHeight/2,
                    flameWidth/2,
                    flameHeight,
                    0,
                    0, Math.PI * 2
                );
                this.ctx.fill();

                const glowGradient = this.ctx.createRadialGradient(
                    x, this.player.height/2 + flameHeight/2,
                    0,
                    x, this.player.height/2 + flameHeight/2,
                    flameWidth * this.player.thrustPower
                );
                glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                this.ctx.fillStyle = glowGradient;
                this.ctx.fill();
            }

            this.ctx.drawImage(
                this.images.player,
                -this.player.width/2,
                -this.player.height/2,
                this.player.width,
                this.player.height
            );
            
            this.ctx.restore();
        } else {
            // Vẽ hiệu ứng nổ
            this.ctx.save();
            
            this.player.explosionRings.forEach(ring => {
                const gradient = this.ctx.createRadialGradient(
                    ring.x, ring.y, 0,
                    ring.x, ring.y, ring.radius
                );
                gradient.addColorStop(0, `rgba(255, 200, 0, ${ring.alpha})`);
                gradient.addColorStop(0.5, `rgba(255, 100, 0, ${ring.alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);

                this.ctx.beginPath();
                this.ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            });

            this.player.explosionParticles.forEach(particle => {
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `${particle.color.replace(')', `, ${particle.alpha})`)}`;
                this.ctx.fill();
            });

            this.ctx.restore();
        }

        // Draw gift boxes
        this.giftBoxes.forEach(giftBox => {
            this.ctx.drawImage(
                giftBox.image,
                giftBox.x - giftBox.width / 2,
                giftBox.y - giftBox.height / 2,
                giftBox.width,
                giftBox.height
            );
        });

        // Vẽ đùi gà
        this.drumsticks.forEach(drumstick => drumstick.draw(this.ctx));

        // Vẽ trứng vỡ
        this.brokenEggs.forEach((egg, index) => {
            this.ctx.save();
            this.ctx.globalAlpha = egg.alpha;
            this.ctx.drawImage(
                this.images.eggBroken,
                egg.x - egg.width/2,
                egg.y - egg.height/2,
                egg.width,
                egg.height
            );
            this.ctx.restore();

            egg.timer--;
            egg.alpha = egg.timer / 180;
            if (egg.timer <= 0) {
                this.brokenEggs.splice(index, 1);
            }
        });
    }

    drawBullet(bullet) {
        if (bullet.type === 'wave') {
            this.ctx.save();
            
            const radiusProgress = Math.pow(bullet.progress, 0.7);
            const currentRadius = bullet.startRadius + (bullet.maxRadius - bullet.startRadius) * radiusProgress;
            
            // Translate đến vị trí đạn
            this.ctx.translate(bullet.x, bullet.y);

            // Vẽ vòng sóng xung kích chính
            const shockwaveCount = 2;
            for (let i = 0; i < shockwaveCount; i++) {
                const shockwaveRadius = currentRadius * (1 - i * 0.2);
                const opacity = (1 - bullet.progress) * (1 - i * 0.3);
                
                // Vẽ vòng sóng xung kích với hiệu ứng méo
                this.ctx.beginPath();
                for (let angle = 0; angle <= Math.PI * 2; angle += Math.PI / 180) {
                    const distortion = Math.sin(angle * 8 + bullet.phase * 2) * (20 * (1 - bullet.progress));
                    const radius = shockwaveRadius + distortion;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    if (angle === 0) this.ctx.moveTo(x, y);
                    else this.ctx.lineTo(x, y);
                }
                this.ctx.closePath();

                // Vẽ viền sáng
                this.ctx.strokeStyle = `rgba(0, 255, 255, ${opacity * 0.8})`;
                this.ctx.lineWidth = 8 * (1 - bullet.progress);
                this.ctx.stroke();

                // Vẽ fill với gradient
                const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, shockwaveRadius);
                gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.5})`);
                gradient.addColorStop(0.3, `rgba(0, 255, 255, ${opacity * 0.3})`);
                gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
                this.ctx.fillStyle = gradient;
                this.ctx.fill();
            }

            // Vẽ các tia năng lượng phát ra
            const energyRayCount = 16;
            for (let i = 0; i < energyRayCount; i++) {
                const angle = (i * Math.PI * 2 / energyRayCount) + bullet.phase;
                const rayLength = currentRadius * 1.2;
                
                this.ctx.save();
                this.ctx.rotate(angle);
                
                // Gradient cho tia năng lượng
                const rayGradient = this.ctx.createLinearGradient(0, 0, rayLength, 0);
                rayGradient.addColorStop(0, `rgba(255, 255, 255, ${(1 - bullet.progress) * 0.8})`);
                rayGradient.addColorStop(0.3, `rgba(0, 255, 255, ${(1 - bullet.progress) * 0.5})`);
                rayGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
                
                this.ctx.fillStyle = rayGradient;
                this.ctx.fillRect(0, -2, rayLength, 4);
                this.ctx.restore();
            }

            // Vẽ hiệu ứng plasma ở trung tâm
            const coreSize = 40 * (1 - bullet.progress * 0.5);
            const plasmaGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, coreSize);
            plasmaGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            plasmaGradient.addColorStop(0.2, 'rgba(0, 255, 255, 0.7)');
            plasmaGradient.addColorStop(0.4, 'rgba(0, 255, 255, 0.4)');
            plasmaGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

            this.ctx.beginPath();
            this.ctx.arc(0, 0, coreSize, 0, Math.PI * 2);
            this.ctx.fillStyle = plasmaGradient;
            this.ctx.fill();

            // Vẽ các particle năng lượng
            const particleCount = Math.floor(30 * (1 - bullet.progress));
            for (let i = 0; i < particleCount; i++) {
                const particleAngle = Math.random() * Math.PI * 2;
                const particleDistance = Math.random() * currentRadius;
                const particleSize = (5 + Math.random() * 5) * (1 - bullet.progress);
                const x = Math.cos(particleAngle) * particleDistance;
                const y = Math.sin(particleAngle) * particleDistance;

                // Vẽ particle với glow effect
                this.ctx.beginPath();
                this.ctx.arc(x, y, particleSize, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(0, 255, 255, ${(1 - bullet.progress) * 0.6})`;
                this.ctx.shadowColor = 'rgba(0, 255, 255, 0.8)';
                this.ctx.shadowBlur = 10;
                this.ctx.fill();
            }

            // Thêm hiệu ứng glow tổng thể
            this.ctx.globalCompositeOperation = 'screen';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(0, 255, 255, ${(1 - bullet.progress) * 0.2})`;
            this.ctx.fill();

            this.ctx.restore();
        } else if (bullet.type === 'lightning') {
            this.ctx.save();
            
            // Vẽ hiệu ứng phát sáng
            this.ctx.shadowColor = '#00ffff';
            this.ctx.shadowBlur = 15;
            
            // Tính toán điểm bắt đầu (từ player)
            const startX = this.player.x + this.player.width/2;
            const startY = this.player.y;
            
            // Tạo đường dẫn chính của tia st
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            
            // Tạo các điểm zigzag giữa player và mục tiêu
            const targetX = bullet.x;
            const targetY = bullet.y;
            const dx = targetX - startX;
            const dy = targetY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const segments = 5;
            const maxOffset = 20; // Độ lệch tối đa của zigzag
            
            let prevX = startX;
            let prevY = startY;
            
            for (let i = 1; i <= segments; i++) {
                const ratio = i / segments;
                const baseX = startX + dx * ratio;
                const baseY = startY + dy * ratio;
                
                const perpX = -dy / distance;
                const perpY = dx / distance;
                const offset = (Math.random() - 0.5) * maxOffset;
                
                const zigzagX = baseX + perpX * offset;
                const zigzagY = baseY + perpY * offset;
                
                this.ctx.lineTo(zigzagX, zigzagY);
                
                if (Math.random() < 0.7) {
                    const branchLength = maxOffset * 0.8;
                    const branchOffset = (Math.random() - 0.5) * Math.PI/4;
                    const angle = Math.atan2(zigzagY - prevY, zigzagX - prevX) + branchOffset;
                    
                    this.ctx.save();
                    this.ctx.beginPath();
                    this.ctx.moveTo(zigzagX, zigzagY);
                    this.ctx.lineTo(
                        zigzagX + Math.cos(angle) * branchLength,
                        zigzagY + Math.sin(angle) * branchLength
                    );
                    this.ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                    this.ctx.restore();
                }
                
                prevX = zigzagX;
                prevY = zigzagY;
            }
            
            // Vẽ tia sét chính
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
            
            this.ctx.strokeStyle = '#00ffff';
            this.ctx.lineWidth = 1.5;
            this.ctx.stroke();
            
            this.ctx.restore();
        } else {
            // Normal bullet
            this.ctx.save();
            
            // Tạo gradient cho đạn
            const gradient = this.ctx.createLinearGradient(
                bullet.x, bullet.y,
                bullet.x, bullet.y + bullet.height
            );
            gradient.addColorStop(0, '#ff0');
            gradient.addColorStop(0.5, '#ffa500');
            gradient.addColorStop(1, '#f00');

            // Vẽ đạn với hiệu ứng phát sáng
            this.ctx.shadowColor = 'rgba(255, 165, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);

            // Vẽ viền sáng
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(bullet.x - bullet.width / 2, bullet.y, bullet.width, bullet.height);

            this.ctx.restore();
        }
    }

    gameLoop() {
        // Kiểm tra xem tất cả ảnh đã load xong chưa
        if (!this.images.drumstick || !this.images.drumstick.complete) {
            requestAnimationFrame(() => this.gameLoop());
            return;
        }

        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    showNotification(notification) {
        this.notifications.push({
            ...notification,
            startTime: Date.now(),
            alpha: 0,
            y: 50  // Điều chỉnh offset ban đầu
        });
    }

    updateNotifications() {
        this.notifications.forEach((notification, index) => {
            const elapsed = Date.now() - notification.startTime;
            
            // Hiệu ứng fade in
            if (elapsed < 500) {
                notification.alpha = elapsed / 500;
                notification.y = 50 - (elapsed / 500) * 50; // Di chuyển lên trên
            }
            // Hiệu ứng fade out
            else if (notification.duration > 0 && elapsed > notification.duration - 500) {
                notification.alpha = (notification.duration - elapsed) / 500;
                notification.y = -(notification.duration - elapsed) / 500 * 50; // Di chuyển xuống
            }
            // Hiển thị bình thường
            else {
                notification.alpha = 1;
                notification.y = 0;
            }

            // Xóa thông báo hết hạn
            if (notification.duration > 0 && elapsed > notification.duration) {
                this.notifications.splice(index, 1);
            }
        });
    }

    drawNotifications() {
        this.ctx.save();
        this.notifications.forEach(notification => {
            this.ctx.font = `bold 24px "${notification.font || 'Be Vietnam Pro'}"`;
            this.ctx.globalAlpha = notification.alpha;
            
            const centerY = this.canvas.height / 2 - 100;
            const y = centerY + notification.y;

            this.ctx.textAlign = 'center';
            
            // Title
            this.ctx.fillStyle = '#fff';
            this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
            this.ctx.shadowBlur = 15;
            this.ctx.fillText(notification.title, this.canvas.width/2, y + 40);

            // Subtitle
            this.ctx.shadowBlur = 10;
            this.ctx.fillStyle = '#ffd700';
            this.ctx.fillText(notification.subtitle, this.canvas.width/2, y + 80);

            // Message
            this.ctx.shadowBlur = 5;
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText(notification.message, this.canvas.width/2, y + 120);
        });
        this.ctx.restore();
    }

    checkLevelComplete() {
        if (!this.levelTransitioning) {
            const remainingChickens = this.chickenManager.getChickens().length;
            
            if (remainingChickens === 0) {
                const currentLevel = LEVELS[this.currentLevel - 1];
                if (!currentLevel || !currentLevel.waves) {
                    console.error('Invalid level data');
                    return;
                }
                
                if (this.currentWave < currentLevel.waves.length - 1) {
                    // Còn wave tiếp theo trong level hiện tại
                    this.currentWave++;
                    this.levelTransitioning = true;
                    
                    // Hi���n thị thông báo hoàn thành wave
                    this.showNotification(MESSAGES.waveComplete);
                    
                    setTimeout(() => {
                        this.initWave();
                        this.levelTransitioning = false;
                    }, 2000);
                } else {
                    // Đã hoàn thành tất cả wave trong level
                    this.levelTransitioning = true;
                    console.log('Level complete, transitioning to next level');
                    this.showNotification(MESSAGES.levelComplete(currentLevel));
                    
                    setTimeout(() => {
                        this.currentLevel++;
                        if (this.currentLevel <= LEVELS.length) {
                            this.initLevel();
                            this.showNotification(MESSAGES.levelStart(LEVELS[this.currentLevel - 1]));
                        } else {
                            this.showNotification(MESSAGES.gameComplete);
                            this.gameOver = true;
                        }
                        this.levelTransitioning = false;
                    }, 2000);
                }
            }
        }
    }

    initLevel() {
        // Đặt lại các trạng thái trò chơi
        this.bullets = [];
        this.eggs = [];
        this.explosions = [];
        this.brokenEggs = [];
        this.feathers = [];
        this.currentWave = 0;
        
        // Khởi tạo lại gà với mẫu đầu tiên của level
        const level = LEVELS[this.currentLevel - 1];
        if (!level) {
            console.error('Level not found:', this.currentLevel);
            return;
        }
        
        this.initWave();
    }

    initWave() {
        const level = LEVELS[this.currentLevel - 1];
        if (!level) {
            console.error('Level not found:', this.currentLevel);
            return;
        }

        if (!level.waves) {
            console.error('No waves found for level:', this.currentLevel);
            return;
        }

        const wave = level.waves[this.currentWave];
        if (!wave) {
            console.error('Wave not found:', this.currentWave);
            return;
        }

        if (!wave.pattern) {
            console.error('No pattern found for wave:', this.currentWave);
            return;
        }

        this.chickenManager = new ChickenManager(this.boundaries, this.canvas, wave.pattern, this.images);
        this.chickens = this.chickenManager.getChickens();
        this.chickenManager.setPlayer(this.player);
    }

    // Thêm hàm tính khoảng cch từ điểm đến đường thẳng
    pointToLineDistance(x, y, x1, y1, x2, y2) {
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        let param = -1;
        
        if (len_sq != 0) {
            param = dot / len_sq;
        }

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Thêm hàm mới để tạo hiệu ứng nổ
    createExplosionEffects(chicken) {
        // Tạo hiệu ứng lông vũ
        for (let k = 0; k < 15; k++) {
            const angle = (Math.PI * 2 / 15) * k + Math.random() * 0.5;
            const speed = 2 + Math.random() * 3;
            this.feathers.push({
                x: chicken.x + chicken.width / 2,
                y: chicken.y + chicken.height / 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                gravity: 0.05,
                alpha: 1,
                size: chicken.width * 0.4
            });
        }

        // Xử lý rơi gift box với tỉ lệ 60%
        if (Math.random() < 0.60) { // Giảm từ 0.75 xuống 0.60 (60%)
            const currentWeaponType = this.player.weaponType;
            const randomValue = Math.random();

            if (randomValue < 0.7) { // 70% của 60% = 42% cơ hội powerup
                this.giftBoxes.push({
                    x: chicken.x + chicken.width/2,
                    y: chicken.y + chicken.height/2,
                    width: 30,
                    height: 30,
                    speed: 2,
                    type: 'powerup',
                    image: this.images.giftBox
                });
            } else { // 30% của 60% = 18% cơ hội đổi loại vũ khí
                const otherTypes = ['normal', 'lightning', 'màn'].filter(t => t !== currentWeaponType);
                const newType = otherTypes[Math.floor(Math.random() * otherTypes.length)];
                this.giftBoxes.push({
                    x: chicken.x + chicken.width/2,
                    y: chicken.y + chicken.height/2,
                    width: 30,
                    height: 30,
                    speed: 2,
                    type: newType,
                    image: newType === 'normal' ? this.images.giftBox :
                          newType === 'lightning' ? this.images.giftBox2 :
                          this.images.giftBox3
                });
            }
        }
    }

    // Thêm phương thức mới để tạo hiệu ứng khi nhặt gift box
    createPowerupEffect(x, y, type) {
        // Tạo particles cho hiệu ứng
        for (let i =0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const speed = 2 + Math.random() * 2;
            const color = type === 'normal' ? '#ffa500' :
                         type === 'lightning' ? '#00ffff' :
                         type === 'wave' ? '#ff00ff' : '#ffffff';
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 3,
                color: color,
                alpha: 1,
                life: 1
            });
        }

        // Sửa lại thông báo
        const message = type === 'powerup' ? 
            "Tăng Sức Mạnh!" : 
            `Đổi sang ${type === 'normal' ? 'Thường' : 
                       type === 'lightning' ? 'Sét' : 
                       type === 'wave' ? 'Sóng' : ''}!`;
        
        this.showNotification({
            title: type === 'powerup' ? "Tăng Sức Mạnh!" : "Đổi Vũ Khí!",
            subtitle: message,
            message: `Cấp ${this.player.weaponLevel}`,
            duration: 1500,
            font: '"Be Vietnam Pro"' // Thêm thuộc tính font
        });
    }

    // Thêm phương thức mới để xử lý bắn tên lửa
    launchMissile() {
        if (this.missileCount <= 0) return;
        
        this.missileCount--;
        // Tạo một vụ nổ lớn tiêu diệt tất cả gà trong màn hình
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        // Tạo hiệu ứng nổ lớn
        this.explosions.push({
            x: centerX,
            y: centerY,
            radius: Math.max(this.canvas.width, this.canvas.height),
            alpha: 1,
            timer: 60
        });

        // Tiêu diệt tất cả gà trên màn hình
        this.chickens.forEach(chicken => {
            chicken.health = 0;
            this.score += chicken.type.points;
            // Tạo hiệu ứng lông vũ cho mỗi con gà
            for (let k =0; k < 15; k++) {
                const angle = (Math.PI * 2 / 15) * k + Math.random() * 0.5;
                const speed = 2 + Math.random() * 3;
                this.feathers.push({
                    x: chicken.x + chicken.width / 2,
                    y: chicken.y + chicken.height / 2,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.3,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    gravity: 0.05,
                    alpha: 1,
                    size: chicken.width * 0.4
                });
            }
        });
        this.chickens = []; // Xóa tất cả gà

        // Thêm timeout để đợi hiệu ứng nổ hoàn thành
        setTimeout(() => {
            // Kiểm tra và chuyển màn
            const currentLevel = LEVELS[this.currentLevel - 1];
            if (!currentLevel || !currentLevel.waves) {
                console.error('Invalid level data');
                return;
            }
            
            if (this.currentWave < currentLevel.waves.length - 1) {
                // Còn wave tiếp theo trong level hiện tại
                this.currentWave++;
                this.levelTransitioning = true;
                
                // Hiển thị thông báo hoàn thành wave
                this.showNotification(MESSAGES.waveComplete);
                
                setTimeout(() => {
                    this.initWave();
                    this.levelTransitioning = false;
                }, 2000);
            } else {
                // Đã hoàn thành tất cả wave trong level
                this.levelTransitioning = true;
                console.log('Level complete, transitioning to next level');
                this.showNotification(MESSAGES.levelComplete(currentLevel));
                
                setTimeout(() => {
                    this.currentLevel++;
                    if (this.currentLevel <= LEVELS.length) {
                        this.initLevel();
                        this.showNotification(MESSAGES.levelStart(LEVELS[this.currentLevel - 1]));
                    } else {
                        this.showNotification(MESSAGES.gameComplete);
                        this.gameOver = true;
                    }
                    this.levelTransitioning = false;
                }, 2000);
            }
        }, 1000); // Đợi 1 giây cho hiệu ứng nổ
    }
}

window.addEventListener('load', async () => {
    const game = new Game();
    await game.loadImages();
}); 