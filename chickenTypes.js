export const CHICKEN_TYPES = {
    NORMAL: {
        id: 1,
        health: 4,
        speed: 2,
        points: 100,
        imageKey: 'chicken',
        shootProbability: 0.001,
        shootPattern: {
            type: 'straight',
            speed: 0.5,
            projectileSize: { width: 8, height: 12 }
        }
    },

    BOMBER: {
        id: 2,
        health: 8,
        speed: 1.8,
        points: 200,
        imageKey: 'chicken2',
        shootProbability: 0.0005,
        shootPattern: {
            type: 'spread',
            speed: 0.6,
            projectileSize: { width: 12, height: 16 },
            bulletCount: 3,
            spreadAngle: 30
        }
    },

    ARMORED: {
        id: 3,
        health: 12,
        speed: 1.5,
        points: 300,
        imageKey: 'chicken3',
        shootProbability: 0.0005,
        shootPattern: {
            type: 'triangle',
            speed: 2.4,
            projectileSize: { width: 24, height: 32 },
            spreadAngle: 30,
            damage: 2
        }
    },

    KAMIKAZE: {
        id: 4,
        health: 32,
        speed: 3,
        points: 150,
        imageKey: 'chicken4',
        shootProbability: 0.002,
        shootPattern: {
            type: 'bomb',
            speed: 3,
            projectileSize: { width: 15, height: 20 },
            bulletCount: 8,
            damage: 2
        },
        specialAbility: {
            type: 'bomb',
            bombCooldown: 120,
            bombPattern: {
                bulletCount: 8,
                speed: 3,
                size: { width: 15, height: 20 }
            }
        }
    },

    BOSS_MINION: {
        id: 5,
        health: 20,
        speed: 2,
        points: 400,
        imageKey: 'chicken5',
        shootProbability: 0.001,
        shootPattern: {
            type: 'spread',
            speed: 1.5,
            projectileSize: { width: 10, height: 14 },
            bulletCount: 3,
            spreadAngle: 45
        },
        specialAbility: {
            type: 'shield',
            shieldHealth: 100,
            shieldRegenThreshold: 3,
            bombPattern: {
                bulletCount: 8,
                speed: 2,
                size: { width: 10, height: 14 }
            }
        }
    },

    KAMIKAZE_BOMBER: {
        id: 6,
        health: 40,
        speed: 1.5,
        points: 500,
        imageKey: 'chicken6',
        shootProbability: 0.0005,
        shootPattern: {
            type: 'bomb_spread',
            speed: 0.5,
            projectileSize: { width: 12, height: 16 },
            bulletCount: 8
        },
        specialAbility: {
            type: 'bomb_spread',
            cooldown: 1800
        }
    },

    LASER_CHICKEN: {
        id: 7,
        health: 30,
        speed: 1.8,
        points: 600,
        imageKey: 'chicken7',
        shootProbability: 0.0015,
        shootPattern: {
            type: 'laser',
            speed: 2,
            projectileSize: { width: 4, height: 20 },
            burstCount: 5,
            burstDelay: 100
        },
        specialAbility: {
            laserCount: 4,
            glowIntensity: 10,
            spiralAmplitude: 20,
            spiralFrequency: 0.1,
            rotationSpeed: 0.05,
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
        }
    },

    BOSS: {
        id: 8,
        health: 200,
        speed: 1,
        points: 2000,
        imageKey: 'boss',
        shootProbability: 0.004,
        shootPattern: {
            type: 'boss_attack',
            speed: 1.2,
            projectileSize: { width: 15, height: 20 },
            bulletCount: 12
        },
        specialAbility: {
            type: 'shield',
            cooldown: 3000,
            shieldDuration: 1500,
            shieldHealth: 20
        }
    }
};

export const getChickenTypeById = (id) => {
    const type = Object.values(CHICKEN_TYPES).find(type => type.id === id);
    if (!type) {
        console.error('Invalid chicken type id:', id);
        return CHICKEN_TYPES.NORMAL; // Fallback to normal type
    }
    return type;
};

export const createChickenPattern = (pattern, level = 1) => {
    // Ví dụ một số mẫu đội hình gà
    const patterns = {
        basic: [
            [1, 1, 1, 1, 1],
            [2, 2, 2, 2, 2],
            [1, 1, 1, 1, 1]
        ],
        
        advanced: [
            [2, 1, 6, 1, 2],  // Thêm gà tàng hình vào giữa
            [1, 3, 3, 3, 1],
            [2, 1, 2, 1, 2]
        ],
        
        expert: [
            [3, 2, 3, 2, 3],
            [6, 4, 4, 4, 6],  // Thm gà tàng hình vào hai bên
            [3, 2, 3, 2, 3]
        ],
        
        boss: [
            [2, 6, 5, 6, 2],  // Thêm gà tàng hình bảo vệ boss
            [1, 3, 3, 3, 1],
            [2, 2, 4, 2, 2]
        ]
    };

    // Chọn mẫu dựa trên level
    if (level <= 3) return patterns.basic;
    if (level <= 6) return patterns.advanced;
    if (level <= 9) return patterns.expert;
    return patterns.boss;
};

export const getChickenBehavior = (type) => {
    const behaviors = {
        dive: (chicken, player) => {
            if (!player) return null;
            
            const dx = player.x - chicken.x;
            const dy = player.y - chicken.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < type.diveActivationDistance) {
                const angle = Math.atan2(dy, dx);
                return {
                    isDiving: true,
                    vx: Math.cos(angle) * type.diveSpeed,
                    vy: Math.sin(angle) * type.diveSpeed
                };
            }
            return null;
        },
        
        stealth: (chicken, player) => {
            // Khởi tạo state nếu chưa có
            if (chicken.customState.stealthTimer === undefined) {
                chicken.customState = {
                    stealthTimer: 0,
                    cooldownTimer: 0,
                    isStealthActive: false
                };
            }

            // Giảm thời gian đếm ngược
            if (chicken.customState.stealthTimer > 0) {
                chicken.customState.stealthTimer--;
                if (chicken.customState.stealthTimer === 0) {
                    chicken.customState.isStealthActive = false;
                    chicken.customState.cooldownTimer = type.stealthAbility.cooldown;
                }
            }

            if (chicken.customState.cooldownTimer > 0) {
                chicken.customState.cooldownTimer--;
            }

            // Kiểm tra kích hoạt tàng hình
            if (!chicken.customState.isStealthActive && chicken.customState.cooldownTimer === 0) {
                const dx = player.x - chicken.x;
                const dy = player.y - chicken.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < type.stealthAbility.triggerDistance) {
                    chicken.customState.isStealthActive = true;
                    chicken.customState.stealthTimer = type.stealthAbility.duration;
                    return {
                        speedMultiplier: type.stealthAbility.speedBoost,
                        alpha: 0.3  // Độ trong suốt khi tàng hình
                    };
                }
            }

            return {
                speedMultiplier: 1,
                alpha: chicken.customState.isStealthActive ? 0.3 : 1
            };
        },
        
        shield: (chicken, player) => {
            if (!chicken.customState.shieldTimer) {
                chicken.customState = {
                    shieldTimer: 0,
                    shieldActive: true,
                    shieldHealth: type.specialAbility.shieldHealth,
                    bombTimer: 0
                };
            }

            if (chicken.customState.shieldTimer > 0) {
                chicken.customState.shieldTimer--;
                if (chicken.customState.shieldTimer <= 0) {
                    chicken.customState.shieldActive = false;
                }
            }

            let shouldBomb = false;

            // Kích hoạt bomb khi shield bị phá vỡ
            if (chicken.customState.shieldActive === false && 
                chicken.customState.bombTimer <= 0) {
                shouldBomb = true;
            }

            // Hoặc kích hoạt bomb khi player ở gần
            if (player && chicken.customState.bombTimer <= 0) {
                const dx = player.x - chicken.x;
                const dy = player.y - chicken.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 200) { // Khoảng cách kích hoạt bomb
                    shouldBomb = true;
                }
            }

            return {
                hasShield: chicken.customState.shieldActive,
                shieldHealth: chicken.customState.shieldHealth,
                shouldBomb: shouldBomb
            };
        },
        
        bomb_spread: (chicken, player) => {
            if (!player) return null;

            // Khởi tạo state nếu chưa có
            if (!chicken.customState.bombTimer) {
                chicken.customState = {
                    bombTimer: 0
                };
            }

            // Giảm timer
            if (chicken.customState.bombTimer > 0) {
                chicken.customState.bombTimer--;
            }

            // Bắn khi hết cooldown
            if (chicken.customState.bombTimer <= 0) {
                // Bắn một vòng đạn
                for (let i = 0; i < type.shootPattern.bulletCount; i++) {
                    const angle = (Math.PI * 2 / type.shootPattern.bulletCount) * i;
                    chicken.eggs.push({
                        x: chicken.x + chicken.width/2,
                        y: chicken.y + chicken.height/2,
                        width: type.shootPattern.projectileSize.width,
                        height: type.shootPattern.projectileSize.height,
                        speed: type.shootPattern.speed,
                        type: 'radial',
                        vx: Math.cos(angle) * type.shootPattern.speed,
                        vy: Math.sin(angle) * type.shootPattern.speed
                    });
                }

                // Thêm một đn nhắm thng vào player
                const dx = player.x - chicken.x;
                const dy = player.y - chicken.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                chicken.eggs.push({
                    x: chicken.x + chicken.width/2,
                    y: chicken.y + chicken.height/2,
                    width: type.shootPattern.projectileSize.width * 1.5,
                    height: type.shootPattern.projectileSize.height * 1.5,
                    speed: type.shootPattern.speed * 1.5,
                    type: 'chase',
                    targetX: player.x,
                    targetY: player.y,
                    directPath: true
                });

                chicken.customState.bombTimer = type.specialAbility.cooldown;
            }

            return null;
        }
    };

    return type.specialAbility ? behaviors[type.specialAbility.type] : null;
}; 