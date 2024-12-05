export class Drumstick {
    constructor(x, y, image) {
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 30;
        this.image = image;
        this.vy = -4 - Math.random() * 2;
        this.vx = (Math.random() - 0.5) * 2;
        this.gravity = 0.08;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.alpha = 1;
        this.fadeSpeed = 0.0005;
        this.bounceCount = 0;
        this.maxBounces = 2;
        this.elasticity = 0.4;
        this.isCollected = false;
        this.isResting = false;
        this.restingDuration = 1000;
        this.restingTimer = 0;
        this.floatingOffset = 0;
        this.floatingSpeed = 0.02;
        this.restingOffset = 60;
        this.spinMultiplier = 0.5;
    }

    update(player, canvas) {
        if (this.isCollected) return false;

        if (this.isResting) {
            // Khi đã nằm yên
            this.restingTimer++;
            if (this.restingTimer > this.restingDuration) {
                this.alpha -= this.fadeSpeed;
            }

            // Thêm chuyển động lên xuống nhẹ nhàng
            this.floatingOffset = Math.sin(this.restingTimer * this.floatingSpeed) * 5;
            return this.alpha > 0;
        } else {
            // Cập nhật vị trí khi đang rơi
            this.x += this.vx;
            this.y += this.vy;
            this.vy += this.gravity;

            // Tốc độ xoay tỷ lệ với vận tốc nhưng chậm hơn
            this.rotationSpeed = (this.vx * 0.03 + this.vy * 0.01) * this.spinMultiplier;
            this.rotation += this.rotationSpeed;

            // Xử lý va chạm với biên màn hình
            if (this.x < 0) {
                this.x = 0;
                this.vx = Math.abs(this.vx) * this.elasticity;
                this.spinMultiplier *= -0.6;
            } else if (this.x > canvas.width - this.width) {
                this.x = canvas.width - this.width;
                this.vx = -Math.abs(this.vx) * this.elasticity;
                this.spinMultiplier *= -0.6;
            }

            // Xử lý va chạm với đáy màn hình
            const restingHeight = canvas.height - this.height - this.restingOffset;
            if (this.y > restingHeight) {
                if (this.bounceCount < this.maxBounces) {
                    // Nảy lên với hiệu ứng chậm hơn
                    const impactSpeed = Math.abs(this.vy);
                    this.vy = -impactSpeed * this.elasticity;
                    this.vx *= 0.85;
                    this.bounceCount++;
                    this.y = restingHeight;
                    
                    // Điều chỉnh xoay dựa trên tốc độ va chạm nhưng chậm hơn
                    this.spinMultiplier = (this.vx > 0 ? 1 : -1) * (impactSpeed * 0.05);
                    
                    // Giảm độ đàn hồi ít hơn sau mỗi lần nảy
                    this.elasticity *= 0.95;
                } else {
                    // Chuyển sang trạng thái nằm yên
                    this.isResting = true;
                    this.y = restingHeight;
                    this.vy = 0;
                    this.vx = 0;
                    this.rotationSpeed = 0;
                    this.rotation = 0;
                }
            }
            return true;
        }
    }

    draw(ctx) {
        if (!this.image || !this.image.complete) {
            console.error('Drumstick image not loaded:', this.image);
            return;
        }
        
        ctx.save();
        ctx.globalAlpha = this.alpha;
        
        // Di chuyển đến vị trí của đùi gà và xoay, thêm offset khi đang nằm yên
        const drawY = this.y + (this.isResting ? this.floatingOffset : 0);
        ctx.translate(this.x + this.width/2, drawY + this.height/2);
        ctx.rotate(this.rotation);
        
        // Vẽ đùi gà
        try {
            ctx.drawImage(
                this.image,
                -this.width/2,
                -this.height/2,
                this.width,
                this.height
            );

            // Vẽ hiệu ứng sáng khi đang nằm yên
            if (this.isResting) {
                const glowIntensity = (Math.sin(Date.now() * 0.005) + 1) * 0.3;
                ctx.shadowColor = 'rgba(255, 255, 255, ' + glowIntensity + ')';
                ctx.shadowBlur = 15;
                ctx.drawImage(
                    this.image,
                    -this.width/2,
                    -this.height/2,
                    this.width,
                    this.height
                );
            }
        } catch (error) {
            console.error('Error drawing drumstick:', error);
        }
        
        ctx.restore();
    }
}

export function createDrumsticks(x, y, count, image) {
    const drumsticks = [];
    for (let i = 0; i < count; i++) {
        drumsticks.push(new Drumstick(x, y, image));
    }
    return drumsticks;
} 