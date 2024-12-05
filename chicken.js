import { CHICKEN_TYPES, getChickenBehavior, createChickenPattern } from './chickenTypes.js';

class Chicken {
    constructor(x, y, width, height, typeId, boundaries, images) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = CHICKEN_TYPES[Object.keys(CHICKEN_TYPES).find(key => 
            CHICKEN_TYPES[key].id === typeId)];
        this.boundaries = boundaries;
        this.images = images;
        
        this.direction = 1;
        this.wingAngle = 0;
        this.wingSpeed = 0.05;
        this.wingOffset = Math.random() * Math.PI * 2;
        this.health = this.type.health;
        this.hitEffect = 0;
        this.hitOffsetX = 0;
        this.hitOffsetY = 0;
        this.shakeAmount = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.maxSpeed = this.type.speed * 0.8;
        this.acceleration = 0.05;
        this.deceleration = 0.98;
        
        this.behavior = getChickenBehavior(this.type);
        this.customState = {}; // Để lưu trữ state đặc biệt cho từng loại gà
        
        this.baseX = x; // Vị trí cơ bản để tính toán chuyển động sin
        this.baseY = y;
        this.phase = Math.random() * Math.PI * 2; // Pha ngẫu nhiên cho mỗi con gà
        this.horizontalAmplitude = width * 0.5; // Biên độ dao động ngang
        this.verticalAmplitude = height * 0.3; // Biên độ dao động dọc
        this.horizontalFrequency = 0.02; // Tần số dao động ngang
        this.verticalFrequency = 0.015; // Tần số dao động dọc
        this.moveTimer = 0;

        // Gán ảnh dựa vào loại gà
        switch (this.type.id) {
            case 1: // NORMAL
                this.imageKey = 'chicken';
                break;
            case 2: // BOMBER
                this.imageKey = 'chicken2';
                break;
            case 3: // ARMORED
                this.imageKey = 'chicken3';
                break;
            case 4: // KAMIKAZE
                this.imageKey = 'chicken4';
                break;
            case 5: // BOSS_MINION
                this.imageKey = 'chicken5';
                this.width = width * 5;
                this.height = height * 5;
                this.customState = {
                    shieldTimer: 0,
                    shieldActive: true,
                    shieldHealth: 100,
                    shieldRegenThreshold: 3,
                    bombTimer: 0
                };
                if (this.type.specialAbility && this.type.specialAbility.shieldHealth) {
                    this.customState.shieldHealth = this.type.specialAbility.shieldHealth;
                }
                break;
            case 6: // KAMIKAZE_BOMBER
                this.imageKey = 'chicken6';
                this.width *= 3;
                this.height *= 3;
                this.horizontalAmplitude = 0;
                this.verticalAmplitude = height * 0.3;
                this.horizontalFrequency = 0;
                this.verticalFrequency = 0.025;
                this.maxSpeed = this.type.speed;
                this.customState = {
                    bombTimer: 0
                };
                break;
            case 7: // SNIPER_CHICKEN
                this.imageKey = 'chicken7';
                this.width = width * 6;
                this.height = height * 6;
                this.horizontalAmplitude = width * 0.3;
                this.verticalAmplitude = height * 0.2;
                this.horizontalFrequency = 0.01;
                this.verticalFrequency = 0.008;
                this.maxSpeed = this.type.speed || 1.8;
                this.laserRotation = 0;
                this.spiralTimer = 0;
                this.spiralActive = false;
                this.spiralCooldown = 0;
                this.currentLaserLength = 400;
                this.extendTimer = 0;
                this.hasLaser = true;
                this.movementState = {
                    teleportTimer: 0,
                    dashTimer: 0,
                    isDashing: false,
                    dashDirection: { x: 0, y: 0 },
                    currentPositionTimer: 0,
                    currentPosition: 'center',
                    targetPosition: null,
                    isMoving: false,
                    fadeAlpha: 1,
                    nextPositions: ['left', 'right']
                };

                // Thêm kiểm tra specialAbility
                if (!this.type.specialAbility) {
                    this.type.specialAbility = {
                        laserCount: 4,
                        glowIntensity: 10,
                        spiralAmplitude: 20,
                        spiralFrequency: 0.1,
                        rotationSpeed: 0.002,
                        movementPatterns: {
                            positions: {
                                left: 0.2,
                                center: 0.5,
                                right: 0.8,
                                verticalRange: 0.3
                            },
                            positionHoldTime: 120,
                            teleportCooldown: 180,
                            dashCooldown: 120,
                            dashDuration: 30,
                            dashSpeed: 5
                        }
                    };
                } else {
                    this.type.specialAbility.rotationSpeed = 0.002;
                }
                break;
            case 8: // BOSS
                this.imageKey = 'boss';
                this.width *= 6; 
                this.height *= 6;
                this.horizontalAmplitude = width * 0.4;
                this.verticalAmplitude = height * 0.2;
                this.horizontalFrequency = 0.005;
                this.verticalFrequency = 0.003;
                
                // Khởi tạo các thuộc tính quan trọng
                this.currentPhase = 'normal';
                this.phaseTimer = 0;
                this.shootTimer = 0;  // Đảm bảo timer bắt đầu từ 0
                this.eggs = [];
                
                // Di chuyển Boss lên cao hơn một chút
                this.y = this.boundaries.minY + 100;
                break;
            default:
                this.imageKey = 'chicken';
        }
        
        // Điều chỉnh các thông số chuyển động dựa trên loại gà
        switch (this.type.id) {
            case 1: // NORMAL - chicken.png
                this.horizontalAmplitude = width * 0.5;
                this.verticalAmplitude = height * 0.3;
                this.horizontalFrequency = 0.02;
                this.verticalFrequency = 0.015;
                this.maxSpeed = this.type.speed * 0.8;
                break;
                
            case 2: // BOMBER - chicken2.png
                this.horizontalAmplitude = width * 0.4;
                this.verticalAmplitude = height * 0.35;
                this.horizontalFrequency = 0.018;
                this.verticalFrequency = 0.02;
                this.maxSpeed = this.type.speed * 0.75;
                break;
                
            case 3: // ARMORED - chicken3.png
                this.horizontalAmplitude = width * 0.3;
                this.verticalAmplitude = height * 0.2;
                this.horizontalFrequency = 0.015;
                this.verticalFrequency = 0.01;
                this.maxSpeed = this.type.speed * 0.6;
                break;
                
            case 4: // KAMIKAZE - chicken4.png
                this.horizontalAmplitude = width * 0.6;
                this.verticalAmplitude = height * 0.4;
                this.horizontalFrequency = 0.025;
                this.verticalFrequency = 0.02;
                this.maxSpeed = this.type.speed;
                this.diveActivationDistance = 300; // Khoảng cách kích hoạt lao xuống
                this.diveSpeed = 5; // Tốc độ lao xuống
                this.isDiving = false;
                this.player = null; // Sẽ được set sau
                break;
            
            case 5: // BOSS_MINION
                this.horizontalAmplitude = width * 0.7;
                this.verticalAmplitude = height * 0.5;
                this.horizontalFrequency = 0.03;
                this.verticalFrequency = 0.025;
                this.maxSpeed = this.type.speed;
                break;
            
            case 6: // KAMIKAZE_BOMBER
                this.horizontalAmplitude = width * 0.8;
                this.verticalAmplitude = height * 0.6;
                this.horizontalFrequency = 0.03;
                this.verticalFrequency = 0.025;
                this.maxSpeed = this.type.speed;
                this.customState = {
                    bombTimer: 0
                };
                break;
        }

        this.isDiving = false; // Thêm trạng thái lao xuống

        // Khởi tạo customState cho gà loại 5
        if (this.type.id === 5) {
            this.customState = {
                shieldTimer: 0,
                shieldActive: true,
                shieldHealth: this.type.specialAbility.shieldHealth,
                shieldRegenThreshold: 3,
                bombTimer: 0
            };
        } else if (this.type.id === 6) {
            this.customState = {
                bombTimer: 0
            };
        }

        this.eggs = []; // Thêm mảng eggs
    }

    update() {
        this.moveTimer++;
        
        // Giảm bombTimer nếu có
        if (this.customState && this.customState.bombTimer > 0) {
            this.customState.bombTimer--;
        }
        
        // Xử lý behavior đặc biệt nếu có
        if (this.behavior) {
            const behaviorResult = this.behavior(this, this.player);
            if (behaviorResult) {
                if (behaviorResult.isDiving) {
                    this.isDiving = true;
                    this.velocityX = behaviorResult.vx;
                    this.velocityY = behaviorResult.vy;
                }
                if (behaviorResult.hasShield !== undefined) {
                    this.customState.shieldActive = behaviorResult.hasShield;
                }
                if (behaviorResult.shouldBomb) {
                    this.shootBomb();
                }
                if (behaviorResult.holdingEgg !== undefined) {
                    this.customState.holdingEgg = behaviorResult.holdingEgg;
                }
                this.currentSpeedMultiplier = behaviorResult.speedMultiplier || 1;
                this.alpha = behaviorResult.alpha !== undefined ? behaviorResult.alpha : 1;
            }
        }

        if (this.isDiving) {
            // Nếu đang trong trạng thái lao xuống
            this.x += this.velocityX;
            this.y += this.velocityY;
            
            // Kiểm tra va chạm với biên
            if (this.x < this.boundaries.minX || 
                this.x > this.boundaries.maxX || 
                this.y > this.boundaries.maxY ||
                this.y < this.boundaries.minY) {
                
                // Nếu là gà kamikaze bomber thì nổ ra trứng khi chạm biên
                if (this.type.id === 6) {
                    const pattern = this.type.specialAbility.bombPattern;
                    for (let i = 0; i < pattern.bulletCount; i++) {
                        const angle = (Math.PI * 2 / pattern.bulletCount) * i;
                        this.eggs.push({
                            x: this.x + this.width/2,
                            y: this.y + this.height/2,
                            width: pattern.size.width,
                            height: pattern.size.height,
                            speed: pattern.speed,
                            type: 'radial',
                            vx: Math.cos(angle) * pattern.speed,
                            vy: Math.sin(angle) * pattern.speed,
                            damage: this.type.specialAbility.eggDamage
                        });
                    }
                }
                return true; // Báo hiệu xóa gà
            }
            return false;
        } else {
            // Tính toán chuyển động sin với các thông số riêng cho từng loại
            let horizontalOffset = Math.sin(this.moveTimer * this.horizontalFrequency + this.phase) * this.horizontalAmplitude;
            let verticalOffset = Math.sin(this.moveTimer * this.verticalFrequency + this.phase) * this.verticalAmplitude;

            // Điều chỉnh chuyển động theo từng loại gà
            switch (this.type.id) {
                case 2: // BOMBER - chuyển động chậm rãi, nặng nề
                    horizontalOffset *= 0.9;
                    verticalOffset *= Math.cos(this.moveTimer * 0.015);
                    break;
                    
                case 3: // ARMORED - chuyển động rất nặng nề
                    horizontalOffset *= Math.cos(this.moveTimer * 0.01);
                    verticalOffset *= 0.8;
                    break;
                    
                case 4: // KAMIKAZE - chuyển động nhanh, không đều
                    horizontalOffset *= (1 + Math.sin(this.moveTimer * 0.03) * 0.2);
                    verticalOffset *= (1 + Math.cos(this.moveTimer * 0.04) * 0.2);
                    break;
                
                case 5: // BOSS_MINION - chuyển động nhanh và không đều
                    horizontalOffset *= (1 + Math.sin(this.moveTimer * 0.04) * 0.3);
                    verticalOffset *= (1 + Math.cos(this.moveTimer * 0.05) * 0.3);
                    break;
            }

            // Cập nhật vị trí
            this.baseX += this.velocityX * (this.currentSpeedMultiplier || 1);
            const newX = this.baseX + horizontalOffset;
            const newY = this.baseY + verticalOffset;

            // Kiểm tra biên
            const margin = this.width * 0.5;
            let needsDirectionChange = false;
            
            if (newX < this.boundaries.minX + margin || newX > this.boundaries.maxX - this.width - margin) {
                needsDirectionChange = true;
            } else {
                this.x = newX;
                this.y = newY;
            }

            // Cập nhật góc cánh theo từng loại gà
            let wingSpeed;
            switch (this.type.id) {
                case 2: // BOMBER
                    wingSpeed = 0.09;
                    break;
                case 3: // ARMORED
                    wingSpeed = 0.07;
                    break;
                case 4: // KAMIKAZE
                    wingSpeed = 0.12;
                    break;
                case 5: // BOSS_MINION
                    wingSpeed = 0.15;
                    break;
                default: // NORMAL
                    wingSpeed = 0.1;
            }
            this.wingAngle = Math.sin(this.moveTimer * wingSpeed) * Math.PI/6;

            // Xử lý hiệu ứng hit
            if (this.hitEffect > 0) {
                this.hitEffect--;
                this.hitOffsetX *= 0.85;
                this.hitOffsetY *= 0.85;
                this.shakeAmount *= 0.85;
            }

            // Cập nhật timer khiên
            if (this.type.id === 5 && !this.customState.shieldActive) {
                if (this.customState.shieldTimer > 0) {
                    this.customState.shieldTimer--;
                    if (this.customState.shieldTimer <= 0) {
                        // Kích hoạt lại khiên khi hết cooldown
                        this.customState.shieldActive = true;
                        this.customState.shieldHealth = this.type.specialAbility.shieldHealth;
                    }
                }
            }

            if (this.type.id === 7) {
                // Xử lý teleport và dash
                if (!this.movementState.isDashing && !this.movementState.isMoving) {
                    this.movementState.currentPositionTimer++;
                    
                    if (this.movementState.currentPositionTimer >= this.type.specialAbility.movementPatterns.positionHoldTime) {
                        // Luân phiên giữa teleport và dash
                        if (this.movementState.teleportTimer <= 0) {
                            this.teleport();
                        } else if (this.movementState.dashTimer <= 0) {
                            this.initiateDash();
                        }
                    }
                }

                // Xử lý dash đang diễn ra
                if (this.movementState.isDashing) {
                    const newX = this.x + this.movementState.dashDirection.x * 
                        this.type.specialAbility.movementPatterns.dashSpeed;
                    
                    // Kiểm tra giới hạn màn hình trước khi di chuyển
                    if (newX >= this.boundaries.minX && 
                        newX <= this.boundaries.maxX - this.width) {
                        this.x = newX;
                    }
                    
                    this.movementState.dashTimer--;
                    if (this.movementState.dashTimer <= 0) {
                        this.movementState.isDashing = false;
                        this.movementState.dashTimer = this.type.specialAbility.movementPatterns.dashCooldown;
                        this.movementState.currentPositionTimer = 0;
                        
                        // Cập nhật vị trí hiện tại
                        this.movementState.currentPosition = this.movementState.nextPositions[0];
                        this.movementState.nextPositions.push(this.movementState.nextPositions.shift());
                    }
                }

                // Giảm cooldown timers
                if (this.movementState.teleportTimer > 0) this.movementState.teleportTimer--;
                if (this.movementState.dashTimer > 0) this.movementState.dashTimer--;

                // Giữ trong giới hạn màn hình
                this.x = Math.max(this.boundaries.minX, 
                    Math.min(this.x, this.boundaries.maxX - this.width));
                this.y = Math.max(this.boundaries.minY, 
                    Math.min(this.y, this.boundaries.maxY - this.height));

                // Cập nhật vị trí cơ bản cho chuyển động sin
                this.baseX = this.x;
                this.baseY = this.y;
            }

            if (this.type.id === 8) {
                if (Math.random() < this.type.shootProbability) {
                    if (!this.eggs) {
                        this.eggs = [];
                    }
                    
                    // Bắn 8 hướng
                    const pattern = this.type.shootPattern;
                    for (let i = 0; i < pattern.bulletCount; i++) {
                        const angle = (Math.PI * 2 / pattern.bulletCount) * i;
                        this.eggs.push({
                            x: this.x + this.width/2,
                            y: this.y + this.height/2,
                            width: pattern.projectileSize.width,
                            height: pattern.projectileSize.height,
                            speed: pattern.speed,
                            type: 'radial',
                            vx: Math.cos(angle) * pattern.speed,
                            vy: Math.sin(angle) * pattern.speed
                        });
                    }
                }
            }

            return needsDirectionChange;
        }
    }

    hit() {
        // Xử lý cho gà loại 7
        if (this.type.id === 7) {
            this.health--;
            this.hitEffect = 10;
            const dx = Math.random() - 0.5;
            const dist = Math.sqrt(dx * dx);
            this.hitOffsetX = (dx / dist) * 10;
            this.hitOffsetY = -25;
            this.shakeAmount = 8;

            // Kích hoạt hiệu ứng laser khi bị bắn
            this.spiralActive = true;
            this.spiralTimer = this.type.specialAbility.spiralDuration;
            this.extendTimer = this.type.specialAbility.extendDuration;
            this.spiralCooldown = 0; // Reset cooldown

            return this.health <= 0;
        }

        // Xử lý cho các loại gà khác
        if (this.type.id === 5) {
            // Luôn tạo hiệu ứng hit
            this.hitEffect = 10;
            const dx = Math.random() - 0.5;
            const dist = Math.sqrt(dx * dx);
            this.hitOffsetX = (dx / dist) * 10;
            this.hitOffsetY = -25;
            this.shakeAmount = 8;

            // Nếu còn khiên, chỉ giảm máu khiên
            if (this.customState?.shieldActive) {
                this.customState.shieldHealth--;
                if (this.customState.shieldHealth <= 0) {
                    this.customState.shieldActive = false;
                }
                return false; // Không chết khi còn khiên
            } else {
                // Nếu không còn khiên thì chết luôn
                this.health = 0;
                return true;
            }
        }

        this.health--;
        this.hitEffect = 10;
        const dx = Math.random() - 0.5;
        const dist = Math.sqrt(dx * dx);
        this.hitOffsetX = (dx / dist) * 10;
        this.hitOffsetY = -25;
        this.shakeAmount = 8;
        return this.health <= 0;
    }

    changeDirection() {
        this.direction *= -1;
        this.velocityX = this.maxSpeed * this.direction;
        this.baseY = Math.min(this.baseY + 20, this.boundaries.maxY);
        
        // Reset phase để tránh chuyển động đột ng
        this.phase = this.moveTimer * this.horizontalFrequency;
    }

    canShoot() {
        return Math.random() < this.type.shootProbability;
    }

    getShootPattern(player) {
        if (!this.type.shootPattern) return null;

        const pattern = this.type.shootPattern;
        switch (pattern.type) {
            case 'targeted':
                // Tính toán hướng bắn về pha player
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return {
                    directionX: (dx / distance) * pattern.accuracy,
                    speed: pattern.speed,
                    size: pattern.projectileSize
                };
            // Thêm các pattern khác ở đây
            default:
                return {
                    directionX: 0,
                    speed: pattern.speed,
                    size: pattern.projectileSize
                };
        }
    }

    draw(ctx) {
        if (this.type.id === 7) {
            ctx.globalAlpha = this.movementState.fadeAlpha;
        }
        
        ctx.save();
        const shakeX = this.shakeAmount ? (Math.random() - 0.5) * this.shakeAmount : 0;
        const shakeY = this.shakeAmount ? (Math.random() - 0.5) * this.shakeAmount : 0;
        
        // Vẽ laser trước khi translate để vẽ gà
        if (this.type.id === 7 && this.hasLaser) {
            const centerX = this.x + this.width / 2 + this.hitOffsetX + shakeX;
            const centerY = this.y + this.height / 2 + this.hitOffsetY + shakeY;
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(this.laserRotation);

            const laserCount = this.type.specialAbility.laserCount;
            const glowIntensity = this.type.specialAbility.glowIntensity;

            for (let i = 0; i < laserCount; i++) {
                const angle = (Math.PI * 2 / laserCount) * i;
                
                ctx.save();
                ctx.rotate(angle);
                
                // Vẽ laser với hiệu ứng xoắn
                const gradient = ctx.createLinearGradient(0, 0, this.currentLaserLength, 0);
                gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
                gradient.addColorStop(0.7, 'rgba(255, 0, 0, 0.4)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

                ctx.beginPath();
                if (this.spiralActive) {
                    // Vẽ đường xoắn khi kích hoạt
                    const points = 100;
                    const amplitude = this.type.specialAbility.spiralAmplitude;
                    const frequency = this.type.specialAbility.spiralFrequency;
                    
                    ctx.moveTo(0, 0);
                    for (let j = 0; j <= points; j++) {
                        const x = (j / points) * this.currentLaserLength;
                        const y = Math.sin(x * frequency + this.laserRotation) * 
                            (amplitude * (x / this.currentLaserLength));
                        ctx.lineTo(x, y);
                    }
                } else {
                    // Vẽ laser thẳng bình thường
                    ctx.moveTo(0, 0);
                    ctx.lineTo(this.currentLaserLength, 0);
                }

                // Vẽ hiệu ứng phát sáng nền
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = glowIntensity;
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.lineWidth = 8;
                ctx.stroke();
                
                // Vẽ laser chính
                ctx.shadowBlur = glowIntensity / 2;
                ctx.strokeStyle = gradient;
                ctx.lineWidth = 3;
                ctx.stroke();

                // Vẽ lõi laser
                ctx.shadowBlur = glowIntensity * 1.5;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1;
                ctx.stroke();

                ctx.restore();
            }
            ctx.restore();

            // Cp nhật góc quay
            this.laserRotation += this.type.specialAbility.rotationSpeed;
        }

        // Tiếp tục vẽ gà
        ctx.translate(
            this.x + this.width / 2 + this.hitOffsetX + shakeX,
            this.y + this.height / 2 + this.hitOffsetY + shakeY
        );
        
        if (this.direction < 0) {
            ctx.scale(-1, 1);
        }
        
        // Vẽ con gà
        ctx.drawImage(
            this.images[this.imageKey],
            -this.width / 2,
            -this.width / 2,
            this.width,
            this.height
        );

        // Vẽ trứng nếu gà 6 đang cầm trứng
        if (this.type.id === 6 && this.customState && this.customState.holdingEgg) {
            ctx.drawImage(
                this.images.egg,
                0,
                this.height/3,
                this.width/2,
                this.height/2
            );
        }

        ctx.restore();

        // Draw shield cho BOSS_MINION
        if (this.type.id === 5 && this.customState.shieldActive) {
            this.drawShield(ctx);
        }

        ctx.globalAlpha = 1; // Reset alpha

        if (this.type.id === 8) {
            // Vẽ thanh máu
            const healthBarWidth = this.width * 1.2;
            const healthBarHeight = 15;
            const healthPercentage = this.health / this.type.health;
            
            // Vẽ nền của thanh máu
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(
                this.x + (this.width - healthBarWidth)/2,
                this.y - healthBarHeight - 10,
                healthBarWidth,
                healthBarHeight
            );
            
            // Vẽ thanh máu hiện tại
            ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
            ctx.fillRect(
                this.x + (this.width - healthBarWidth)/2,
                this.y - healthBarHeight - 10,
                healthBarWidth * healthPercentage,
                healthBarHeight
            );

            // Vẽ phần trăm máu
            ctx.save();
            ctx.font = 'bold 14px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText(
                `${Math.floor(healthPercentage * 100)}%`,
                this.x + this.width/2,
                this.y - healthBarHeight - 2
            );
            ctx.restore();

            // Vẽ laser trong phase desperate
            if (this.currentPhase === 'desperate' && this.laserTimer > 0) {
                const phase = this.type.specialAbility.phases.desperate;
                ctx.save();
                ctx.translate(this.x + this.width/2, this.y + this.height/2);
                ctx.rotate(this.laserRotation);
                
                const gradient = ctx.createLinearGradient(0, 0, 1000, 0);
                gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, -phase.laserBeam.width/2, 1000, phase.laserBeam.width);
                
                ctx.restore();
            }
        }
    }

    drawShield(ctx) {
        // Calculate pulsing effect
        const pulse = Math.sin(this.moveTimer * 0.1) * 2;

        // Create a radial gradient for the shield
        const gradient = ctx.createRadialGradient(
            this.x + this.width / 2, 
            this.y + this.height / 2, 
            this.width / 2 - 10 + pulse, 
            this.x + this.width / 2, 
            this.y + this.height / 2, 
            this.width / 2 + 15 + pulse
        );
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
        gradient.addColorStop(0.7, 'rgba(0, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

        // Draw the shield with the gradient
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 15 + pulse, 0, Math.PI * 2);
        ctx.fill();

        // Draw a clear border around the shield
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 15 + pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Draw shield health bar
        const shieldHealthRatio = this.customState.shieldHealth / this.type.specialAbility.shieldHealth;
        ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
        ctx.fillRect(this.x, this.y - 10, this.width * shieldHealthRatio, 5);
    }

    shootBomb() {
        if (!this.customState.bombTimer) {
            this.customState.bombTimer = 0;
        }

        if (this.customState.bombTimer <= 0) {
            // Tạo 8 viên đạn theo hnh tròn
            const pattern = this.type.specialAbility.bombPattern;
            for (let i = 0; i < pattern.bulletCount; i++) {
                const angle = (Math.PI * 2 / pattern.bulletCount) * i;
                this.eggs.push({
                    x: this.x + this.width/2,
                    y: this.y + this.height/2,
                    width: pattern.size.width,
                    height: pattern.size.height,
                    speed: pattern.speed,
                    type: 'radial',
                    vx: Math.cos(angle) * pattern.speed,
                    vy: Math.sin(angle) * pattern.speed
                });
            }
            this.customState.bombTimer = this.type.specialAbility.bombCooldown;
        }
    }

    teleport() {
        if (this.type.id !== 7) return;

        // Chọn vị trí tiếp theo từ mảng nextPositions
        const nextPosition = this.movementState.nextPositions.shift();
        this.movementState.nextPositions.push(this.movementState.currentPosition);
        this.movementState.currentPosition = nextPosition;

        // Tính toán vị trí mới dựa trên tỷ lệ màn hình
        const positions = this.type.specialAbility.movementPatterns.positions;
        const newX = this.boundaries.minX + 
            (this.boundaries.maxX - this.boundaries.minX) * positions[nextPosition];
        const newY = this.boundaries.minY + 
            (this.boundaries.maxY - this.boundaries.minY) * 
            (positions.verticalRange * Math.random());

        // Hiệu ứng fade out
        this.movementState.fadeAlpha = 0;
        setTimeout(() => {
            this.x = newX - this.width/2; // Căn giữa
            this.y = newY;
            this.baseX = this.x;
            this.baseY = this.y;
            // Hiệu ứng fade in
            this.movementState.fadeAlpha = 1;
        }, 100);

        this.movementState.teleportTimer = this.type.specialAbility.movementPatterns.teleportCooldown;
        this.movementState.currentPositionTimer = 0;
    }

    initiateDash() {
        if (this.type.id !== 7) return;

        // Tính hướng dash dựa trên vị trí tiếp theo
        const positions = this.type.specialAbility.movementPatterns.positions;
        const nextPosition = this.movementState.nextPositions[0];
        const targetX = this.boundaries.minX + 
            (this.boundaries.maxX - this.boundaries.minX) * positions[nextPosition];
        
        // Tính vector hướng
        const dx = targetX - (this.x + this.width/2);
        const dy = 0; // Chỉ dash ngang
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.movementState.dashDirection = {
            x: dx / distance,
            y: dy / distance
        };

        this.movementState.isDashing = true;
        this.movementState.dashTimer = this.type.specialAbility.movementPatterns.dashDuration;
    }
}

class ChickenManager {
    constructor(boundaries, canvas, pattern, images) {
        // Thêm validation
        if (!boundaries || !canvas || !pattern || !images) {
            console.error('Missing required parameters for ChickenManager:', {
                boundaries: !!boundaries,
                canvas: !!canvas,
                pattern: !!pattern,
                images: !!images
            });
            return;
        }

        console.log('Initializing ChickenManager with pattern:', pattern);
        
        this.boundaries = boundaries;
        this.canvas = canvas;
        this.chickens = [];
        this.pattern = pattern;
        this.images = images;

        // Kiểm tra pattern hợp lệ
        if (!Array.isArray(pattern) || pattern.length === 0 || !Array.isArray(pattern[0])) {
            console.error('Invalid pattern format:', pattern);
            return;
        }

        // Tính toán kích thước grid
        const gridWidth = pattern[0].length;  // 4 ct
        const gridHeight = pattern.length;    // 4 hàng
        const chickenSize = this.canvas.width * 0.045;

        // Tính toán khoảng cách an toàn từ biên
        const safeMargin = this.canvas.width * 0.15; // Giảm margin xuống 15%
        const usableWidth = this.canvas.width - (safeMargin * 2);

        // Tính khoảng cách giữa các gà
        this.formationSpacing = {
            x: usableWidth / (gridWidth + 1) * 0.95, // Tăng khoảng cách ngang lên 95%
            y: 80  // Giảm khoảng cách dọc lên 80px
        };

        // Căn giữa formation và đẩy lên cao
        this.startPosition = {
            x: (this.canvas.width - (gridWidth - 1) * this.formationSpacing.x) / 2,
            y: this.boundaries.minY + 20  // Giảm v trí cao xuống 20px
        };

        // Điều chỉnh điểm kiểm soát cho đường cong Bezier
        this.controlPoints = {
            start: { x: this.canvas.width / 2, y: -100 },
            control1: { x: this.canvas.width * 0.8, y: this.canvas.height * 0.1 },  // Giảm độ cao
            control2: { x: this.canvas.width * 0.2, y: this.canvas.height * 0.2 }   // Giảm độ cao
        };

        this.formationComplete = false;
        this.formationOffset = 0;
        this.formationSpeed = 1;

        this.initializeChickens();
    }

    initializeChickens() {
        let entryDelay = 0;

        this.pattern.forEach((row, rowIndex) => {
            row.forEach((chickenType, colIndex) => {
                if (chickenType > 0) {
                    const targetX = this.startPosition.x + colIndex * this.formationSpacing.x;
                    const targetY = this.startPosition.y + rowIndex * this.formationSpacing.y;

                    const chicken = new Chicken(
                        this.controlPoints.start.x,
                        this.controlPoints.start.y,
                        this.canvas.width * 0.045,
                        this.canvas.width * 0.045,
                        chickenType,
                        this.boundaries,
                        this.images
                    );

                    chicken.isEntering = true;
                    chicken.entryDelay = entryDelay;
                    chicken.targetX = targetX;
                    chicken.targetY = targetY;
                    chicken.entryProgress = 0;
                    chicken.entrySpeed = 0.01;

                    this.chickens.push(chicken);
                    entryDelay += 30;
                }
            });
        });
    }

    // Hàm tính điểm trn đường cong Bezier
    getBezierPoint(t, p0, p1, p2, p3) {
        const oneMinusT = 1 - t;
        return {
            x: Math.pow(oneMinusT, 3) * p0.x +
               3 * Math.pow(oneMinusT, 2) * t * p1.x +
               3 * oneMinusT * Math.pow(t, 2) * p2.x +
               Math.pow(t, 3) * p3.x,
            y: Math.pow(oneMinusT, 3) * p0.y +
               3 * Math.pow(oneMinusT, 2) * t * p1.y +
               3 * oneMinusT * Math.pow(t, 2) * p2.y +
               Math.pow(t, 3) * p3.y
        };
    }

    update() {
        let allInPosition = true;

        this.chickens.forEach(chicken => {
            if (chicken.isEntering) {
                allInPosition = false;
                if (chicken.entryDelay > 0) {
                    chicken.entryDelay--;
                    return;
                }

                chicken.entryProgress += chicken.entrySpeed;

                if (chicken.entryProgress < 1) {
                    const point = this.getBezierPoint(
                        chicken.entryProgress,
                        this.controlPoints.start,
                        this.controlPoints.control1,
                        this.controlPoints.control2,
                        { x: chicken.targetX, y: chicken.targetY }
                    );
                    chicken.x = point.x;
                    chicken.y = point.y;
                } else {
                    chicken.isEntering = false;
                    chicken.x = chicken.targetX;
                    chicken.y = chicken.targetY;
                    chicken.baseX = chicken.x;
                    chicken.baseY = chicken.y;
                }
            }
        });

        // Kiểm tra và cập nhật trạng thái formation
        if (allInPosition && !this.formationComplete) {
            this.formationComplete = true;
        }

        // Điều chỉnh giới hạn di chuyển của formation
        if (this.formationComplete) {
            this.formationOffset += this.formationSpeed;
            
            // Tăng biên độ di chuyển lên để phù hợp với khoảng cách xa hơn
            const maxOffset = this.formationSpacing.x * 0.3; // Tăng lên 30% spacing
            const movement = Math.sin(this.formationOffset * 0.02) * maxOffset;

            // Kiểm tra biên trước khi di chuyển
            const leftmost = this.startPosition.x + movement;
            const rightmost = this.startPosition.x + 
                (this.pattern[0].length - 1) * this.formationSpacing.x + movement;

            if (leftmost >= this.boundaries.minX + 50 && 
                rightmost <= this.boundaries.maxX - 50) {
                this.chickens.forEach(chicken => {
                    chicken.x = chicken.baseX + movement;
                });
            } else {
                this.formationSpeed *= -1;
            }
        }
    }

    getChickens() {
        return this.chickens;
    }

    removeChicken(index) {
        this.chickens.splice(index, 1);
    }

    setPlayer(player) {
        this.player = player;
        this.chickens.forEach(chicken => {
            chicken.player = player;
        });
    }
}

export { Chicken, ChickenManager }; 