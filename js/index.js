/*
一、初始化整个页面，创建一个2d平面对象，创建星粒，子弹，小行星，舰艇对象
二、变量定义（共同属性，游戏对象，按键），游戏规则收缩框,实话时得分统计
三、游戏动画效果
    1.网页加载完毕后立刻执行的操作
       ①浏览器宽度的变化
       ②键盘按键的变化（按下和释放）
       ③舰艇，子弹，小行星，星粒对象创建
    2.实现动画效果
       1）舰艇，星粒，小行星，子弹变化操作
       2）舰艇行动时生成推力星粒，小行星生成
       3）碰撞检测（需要检测碰撞距离）
       4）子弹击中小行星
       5）舰艇被小行星砸中
    3.击中后：小行星炸裂，裂后分解大小形态
    4.画面呈现：舰艇，星粒，子弹，小行星，射击扫描线，射击画面呈现
四、飞机被毁：游戏重置（小行星重置），结束统计面板：统计最终分数，展示相应评价
五、星空背景
*/

// 初始化页面，返回一个新对象
var Pool = (
    function() {
        var create = function(type, size) {
            var obj = Object.create(def); //创建一个新对象
            obj.init(type, size); //初始化特定类型的对象   （对象，大小）
            return obj
        };
        var def = {
            _type: null,
            _size: null,
            _pointer: null,
            _elements: null,
            init: function(type, size) { //初始化整个网页
                this._type = type;
                this._size = size;
                this._pointer = size;
                this._elements = [];
                var i = 0;
                var length = this._size;
                for (i; i < length; ++i) { this._elements[i] = this._type.create() }
            },
            // 获取标签对象
            getElement: function() { if (this._pointer > 0) return this._elements[--this._pointer]; return null }, //xxx:function/变量  --- 类似于class的理解方式，执行效率相对也是高的
            // 添加标签对象
            disposeElement: function(obj) { this._elements[this._pointer++] = obj }
        };
        return { create: create }
    }());

//创建一个平面向量对象
var Vec2D = (function() {
    var create = function(x, y) {
        var obj = Object.create(def); //def参数被赋值到新对象
        obj.setXY(x, y);
        return obj
    };

    var def = {
        _x: 1,
        _y: 0,
        getX: function() { return this._x },
        setX: function(value) { this._x = value },
        getY: function() { return this._y },
        setY: function(value) { this._y = value },
        setXY: function(x, y) {
            this._x = x;
            this._y = y
        },
        getLength: function() { return Math.sqrt(this._x * this._x + this._y * this._y) },
        setLength: function(length) {
            var angle = this.getAngle();
            this._x = Math.cos(angle) * length;
            this._y = Math.sin(angle) * length
        },
        getAngle: function() { return Math.atan2(this._y, this._x) },
        setAngle: function(angle) {
            var length = this.getLength();
            this._x = Math.cos(angle) * length;
            this._y = Math.sin(angle) * length
        },
        add: function(vector) {
            this._x += vector.getX();
            this._y += vector.getY()
        },
        sub: function(vector) {
            this._x -= vector.getX();
            this._y -= vector.getY()
        },
        mul: function(value) {
            this._x *= value;
            this._y *= value
        },
        div: function(value) {
            this._x /= value;
            this._y /= value
        }
    };
    return { create: create }
}());

//创建一个2d星粒的对象
var Particle = (function() {
    var create = function() {
        var obj = Object.create(def);
        obj.radius = 2;
        obj.color = '#FFF';
        obj.lifeSpan = 0;
        obj.fric = 0.98;
        obj.pos = Vec2D.create(0, 0);
        obj.vel = Vec2D.create(0, 0);
        obj.blacklisted = false;
        return obj
    };
    var def = {
        radius: null,
        color: null,
        lifeSpan: null, //生命值
        fric: null, //摩擦系数
        pos: null, //位置
        vel: null, //速度
        blacklisted: null, //黑名单
        update: function() {
            this.pos.add(this.vel);
            this.vel.mul(this.fric);
            this.radius -= 0.1;
            if (this.radius < 0.1) this.radius = 0.1;
            if (this.lifeSpan-- < 0) { this.blacklisted = true }
        },
        reset: function() { this.blacklisted = false }
    };
    return { create: create }
}());

// 创建一个2d子弹的对象
var Bullet = (function() {
    var create = function() {
        var obj = Object.create(def);
        obj.radius = 4;
        obj.color = '#' + Math.floor(Math.random() * 16777215).toString(16); //随机颜色子弹生成
        obj.pos = Vec2D.create(0, 0);
        obj.vel = Vec2D.create(0, 0);
        obj.blacklisted = false;
        return obj
    };
    var def = { radius: null, color: null, pos: null, vel: null, blacklisted: null, update: function() { this.pos.add(this.vel) }, reset: function() { this.blacklisted = false } };
    return { create: create }
}());

// 创建一个2d小行星对象
var Asteroid = (function() {
    var create = function() {
        var obj = Object.create(def);
        obj.radius = 40;
        obj.color = '#' + Math.floor(Math.random() * 16777215).toString(16); //随机颜色小行星生成
        obj.pos = Vec2D.create(0, 0);
        obj.vel = Vec2D.create(0, 0);
        obj.blacklisted = false;
        obj.type = 'b';
        obj.sides = parseInt(Math.random() * 8 + 3); //任意生成3~10边形小行星
        obj.angle = 0;
        obj.angleVel = (1 - Math.random() * 2) * 0.01; //小行星转速
        return obj
    };
    var def = {
        radius: null,
        color: null,
        pos: null,
        vel: null,
        blacklisted: null,
        type: null,
        sides: null,
        angle: null,
        angleVel: null,
        update: function() {
            this.pos.add(this.vel);
            this.angle += this.angleVel
        },
        reset: function() { this.blacklisted = false }
    };
    return { create: create }
}());

// 创建一个2d舰艇对象
var Ship = (function() {
    var create = function(x, y, ref) {
        var obj = Object.create(def);
        obj.ref = ref;
        obj.angle = 0;
        obj.pos = Vec2D.create(x, y);
        obj.vel = Vec2D.create(0, 0);
        obj.thrust = Vec2D.create(0, 0); //推力
        obj.idle = false; //空闲
        obj.radius = 8;
        obj.idleDelay = 0;
        return obj
    };
    var def = {
        angle: null,
        pos: null,
        vel: null,
        thrust: null,
        ref: null,
        bulletDelay: null,
        idle: null,
        radius: null,
        update: function() {
            this.vel.add(this.thrust);
            this.pos.add(this.vel);
            if (this.vel.getLength() > 5) this.vel.setLength(5);
            ++this.bulletDelay;
            if (this.idle) {
                if (++this.idleDelay > 120) {
                    this.idleDelay = 0;
                    this.idle = false;
                    this.ref.resetGame()
                }
            }
        },
        shoot: function() {
            if (this.bulletDelay > 8) {
                this.ref.generateShot();
                this.bulletDelay = 0
            }
        }
    };
    return { create: create }
}());

//共同属性
var canvas;
var context;
var screenWidth;
var screenHeight;
var doublePI = Math.PI * 2;
//游戏对象
var ship;
var particlePool;
var particles;
var bulletPool;
var bullets;
var asteroidPool;
var asteroids;
var hScan;
var asteroidVelFactor = 0;
// 按键
var keyLeft = false;
var keyUp = false;
var keyRight = false;
var keyDown = false;
var keySpace = false;


//游戏规则折叠框
function onTileClick() {
    var content = document.getElementById("content");
    content.style.height = content.offsetHeight === 280 ? 0 + 'px' : 280 + 'px';
}

//实现动画效果，请求动画帧，指定在更新动画以进行下一次重绘时要调用的函数，用来兼容不同浏览器
window.getAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) { window.setTimeout(callback, 16.6) };

//全局变量
var oBox = document.getElementById("box"),
    oScore = document.getElementById("score"),
    oRe = document.getElementById("restart"),

    allReChild = oRe.children;

//初始界面的点击事件
function exe() {
    oBox.score = 0; //得分清零
    clearMap();
    //restart按钮
    allReChild[2].onclick = function(ev) {
        oRe.style.display = "none";
        oScore.innerHTML = 0;
    };
}


//隐藏和清理
function clearMap() {
    oScore.style.display = "block";
}


// 网页加载完毕后立刻执行的操作
window.onload = function() {
    canvas = document.getElementById('canvas'); //返回对拥有canvas的第一个对象的引用
    context = canvas.getContext('2d'); //指定了二维绘图，提供了用于在画布上2d绘图的方法和属性
    window.onresize();
    keyboardInit();
    particleInit();
    bulletInit();
    asteroidInit();
    shipInit();
    exe();
    loop()
};

//监听浏览器宽度的变化----自适应窗口宽度
window.onresize = function() {
    if (!canvas) return;
    screenWidth = canvas.clientWidth;
    screenHeight = canvas.clientHeight;
    canvas.width = screenWidth;
    canvas.height = screenHeight;
    hScan = (screenHeight / 4) >> 0
};

//监听键盘按键的变化
function keyboardInit() {
    // 指定事件在用户按下某个按键时发生
    window.onkeydown = function(e) {
        switch (e.keyCode) {
            case 65: //A or ←
            case 37:
                keyLeft = true;
                break;
            case 87: //W or ↑
            case 38:
                keyUp = true;
                break;
            case 68: //D or →
            case 39:
                keyRight = true;
                break;
            case 32: //空格 or K
            case 75:
                keySpace = true;
                break
        }
        e.preventDefault() //阻止控件默认事件，比如当你点击带有href值的a标签时,元素响应click事件后，还会发生页面跳转，加上后：浏览器只会响应click事件，不会发生跳转
    };

    // 指定事件在用户释放某个按键时发生
    window.onkeyup = function(e) {
        switch (e.keyCode) {
            case 65:
            case 37:
                keyLeft = false;
                break;
            case 87:
            case 38:
                keyUp = false;
                break;
            case 68:
            case 39:
                keyRight = false;
                break;
            case 75:
            case 32:
                keySpace = false;
                break
        }
        e.preventDefault()
    }
}

// 创建星粒
function particleInit() {
    particlePool = Pool.create(Particle, 120);
    particles = []
}

// 创建子弹
function bulletInit() {
    bulletPool = Pool.create(Bullet, 60);
    bullets = []
}

// 创建小行星
function asteroidInit() {
    asteroidPool = Pool.create(Asteroid, 60);
    asteroids = []
}

// 设置舰艇起始位置，此为屏幕中心
function shipInit() { ship = Ship.create(screenWidth >> 1, screenHeight >> 1, this) }


// 实现动画效果
function loop() {
    updateShip();
    updateParticles();
    updateBullets();
    updateAsteroids();
    checkCollisions();
    render();
    getAnimationFrame(loop) //形成了递归调用，设置应为这个函数多用在持续的动画中
}

//舰艇操作监听
function updateShip() {
    ship.update();
    if (ship.idle) return;
    if (keySpace) ship.shoot();
    if (keyLeft) ship.angle -= 0.1;
    if (keyRight) ship.angle += 0.1;
    if (keyUp) {
        ship.thrust.setLength(0.1);
        ship.thrust.setAngle(ship.angle);
        generateThrustParticle()
    } else {
        ship.vel.mul(0.94);
        ship.thrust.setLength(0)
    }
    if (ship.pos.getX() > screenWidth) ship.pos.setX(0);
    else if (ship.pos.getX() < 0) ship.pos.setX(screenWidth);
    if (ship.pos.getY() > screenHeight) ship.pos.setY(0);
    else if (ship.pos.getY() < 0) ship.pos.setY(screenHeight)
}

//星粒操作监听
function updateParticles() {
    var i = particles.length - 1;
    for (i; i > -1; --i) {
        var p = particles[i];
        if (p.blacklisted) {
            p.reset();
            particles.splice(particles.indexOf(p), 1);
            particlePool.disposeElement(p);
            continue
        }
        p.update()
    }
}

// 子弹操作监听
function updateBullets() {
    var i = bullets.length - 1;
    for (i; i > -1; --i) {
        var b = bullets[i];
        if (b.blacklisted) {
            b.reset();
            bullets.splice(bullets.indexOf(b), 1);
            bulletPool.disposeElement(b);
            continue
        }
        b.update();
        if (b.pos.getX() > screenWidth) b.blacklisted = true;
        else if (b.pos.getX() < 0) b.blacklisted = true;
        if (b.pos.getY() > screenHeight) b.blacklisted = true;
        else if (b.pos.getY() < 0) b.blacklisted = true
    }
}
// 小行星操作监听
function updateAsteroids() {
    var i = asteroids.length - 1;
    for (i; i > -1; --i) {
        var a = asteroids[i];
        if (a.blacklisted) {
            a.reset();
            asteroids.splice(asteroids.indexOf(a), 1);
            asteroidPool.disposeElement(a);
            continue
        }
        a.update();
        if (a.pos.getX() > screenWidth + a.radius) a.pos.setX(-a.radius);
        else if (a.pos.getX() < -a.radius) a.pos.setX(screenWidth + a.radius);
        if (a.pos.getY() > screenHeight + a.radius) a.pos.setY(-a.radius);
        else if (a.pos.getY() < -a.radius) a.pos.setY(screenHeight + a.radius)
    }
    if (asteroids.length < 5) {
        var factor = (Math.random() * 2) >> 0;
        generateAsteroid(screenWidth * factor, screenHeight * factor, 60, 'b')
    }
}


//生成推力星粒
function generateThrustParticle() {
    var p = particlePool.getElement();
    if (!p) return; //如果粒子池没有更多元素，将返回“null”
    p.radius = Math.random() * 3 + 2;
    p.color = '#' + Math.floor(Math.random() * 16777215).toString(16);
    p.lifeSpan = 80;
    p.pos.setXY(ship.pos.getX() + Math.cos(ship.angle) * -14, ship.pos.getY() + Math.sin(ship.angle) * -14);
    p.vel.setLength(8 / p.radius);
    p.vel.setAngle(ship.angle + (1 - Math.random() * 2) * (Math.PI / 18));
    p.vel.mul(-1);
    particles[particles.length] = p //等价于particles.push(p)
}

// 生成小行星
function generateAsteroid(x, y, radius, type) {
    var a = asteroidPool.getElement();
    if (!a) return;
    a.radius = radius;
    a.type = type;
    a.pos.setXY(x, y);
    a.vel.setLength(1 + asteroidVelFactor);
    a.vel.setAngle(Math.random() * (Math.PI * 2));
    asteroids[asteroids.length] = a;
    asteroidVelFactor += 0.025 //小行星运动速度
}

//碰撞检测
function checkCollisions() {
    checkBulletAsteroidCollisions(); //子弹与小行星
    checkShipAsteroidCollisions() //舰艇与小行星
}

//子弹与小行星碰撞检测操作
function checkBulletAsteroidCollisions() {
    var i = bullets.length - 1;
    var j;
    for (i; i > -1; --i) {
        j = asteroids.length - 1;
        for (j; j > -1; --j) {
            var b = bullets[i];
            var a = asteroids[j];
            if (checkDistanceCollision(b, a)) { //碰撞检测
                b.blacklisted = true;
                destroyAsteroid(a) //小行星炸裂
                oBox.score++;
                oScore.innerHTML = oBox.score;
            }
        }
    }
}

//舰艇与小行星碰撞操作
function checkShipAsteroidCollisions() {
    var i = asteroids.length - 1;
    for (i; i > -1; --i) {
        var a = asteroids[i];
        var s = ship;
        if (checkDistanceCollision(a, s)) {
            if (s.idle) return;
            s.idle = restart();
            oBox.score = 0; //得分清零
            clearMap();
            generateShipExplosion(); //舰艇爆炸,游戏重置
            destroyAsteroid(a) //小行星炸裂
        }
    }
}

// 发生舰艇爆炸
function generateShipExplosion() {
    var i = 18;
    for (i; i > -1; --i) {
        var p = particlePool.getElement();
        if (!p) return;
        p.radius = Math.random() * 6 + 2;
        p.lifeSpan = 80;
        p.color = '#FFF';
        p.vel.setLength(20 / p.radius);
        p.vel.setAngle(ship.angle + (1 - Math.random() * 2) * doublePI);
        p.pos.setXY(ship.pos.getX() + Math.cos(p.vel.getAngle()) * (ship.radius * 0.8), ship.pos.getY() + Math.sin(p.vel.getAngle()) * (ship.radius * 0.8));
        particles[particles.length] = p
    }
}

// 检测碰撞距离
function checkDistanceCollision(obj1, obj2) { var vx = obj1.pos.getX() - obj2.pos.getX(); var vy = obj1.pos.getY() - obj2.pos.getY(); var vec = Vec2D.create(vx, vy); if (vec.getLength() < obj1.radius + obj2.radius) { return true } return false }

// 小行星被破坏后操作
function destroyAsteroid(asteroid) {
    asteroid.blacklisted = true;
    generateAsteroidExplosion(asteroid); //小行星炸裂
    resolveAsteroidType(asteroid) //炸裂小行星分解方式
}

// 发生小行星炸裂
function generateAsteroidExplosion(asteroid) {
    var i = 18;
    for (i; i > -1; --i) {
        var p = particlePool.getElement();
        if (!p) return;
        p.radius = Math.random() * (asteroid.radius >> 2) + 2;
        p.lifeSpan = 80;
        p.color = '#' + Math.floor(Math.random() * 16777215).toString(16);;
        p.vel.setLength(20 / p.radius);
        p.vel.setAngle(ship.angle + (1 - Math.random() * 2) * doublePI);
        p.pos.setXY(asteroid.pos.getX() + Math.cos(p.vel.getAngle()) * (asteroid.radius * 0.8), asteroid.pos.getY() + Math.sin(p.vel.getAngle()) * (asteroid.radius * 0.8));
        particles[particles.length] = p
    }
}
//炸裂小行星分解方式（大小比例）
function resolveAsteroidType(asteroid) {
    switch (asteroid.type) { //小行星被击中后一分为二，再击中二分为四，再击中消失
        case 'b':
            generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 40, 'm'); //第一次击中后效果
            generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 40, 'm');
            break;
        case 'm':
            generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 20, 's'); //第二次击中后效果，结束再分裂
            generateAsteroid(asteroid.pos.getX(), asteroid.pos.getY(), 20, 's');
            break
    }
}

//画面呈现
function render() {
    context.fillStyle = '#151415'; //背景底色，canvas.fillStyle=color：绘图填充色的 CSS 颜色值
    context.globalAlpha = 0.4; //背景透明度0.0~1.0
    context.fillRect(0, 0, screenWidth, screenHeight); //绘制“已填色”的矩形的位置大小
    context.globalAlpha = 1.0; //对象透明度
    renderShip();
    renderParticles();
    renderBullets();
    renderAsteroids();
    renderScanlines()
}

// 舰艇呈现
function renderShip() {
    if (ship.idle) return;
    context.save();
    context.translate(ship.pos.getX() >> 0, ship.pos.getY() >> 0);
    context.rotate(ship.angle);
    context.strokeStyle = '#FFF'; //舰艇颜色
    context.lineWidth = (Math.random() > 0.9) ? 2 : 1; //闪亮频度2和线条粗细1
    context.beginPath();
    //舰艇图形绘制
    context.moveTo(10, 0);
    context.lineTo(-10, -10);
    context.lineTo(-10, 10);
    context.lineTo(10, 0);

    context.stroke(); //绘制一条路径,stroke() 方法会实际地绘制出通过 moveTo() 和 lineTo() 方法定义的路径。
    context.closePath(); //创建从当前点到开始点的路径
    context.restore() //恢复之前保存的绘图状态,用于重置
}

// 星粒呈现
function renderParticles() {
    var i = particles.length - 1;
    for (i; i > -1; --i) {
        var p = particles[i];
        context.beginPath();
        context.strokeStyle = p.color;
        context.arc(p.pos.getX() >> 0, p.pos.getY() >> 0, p.radius, 0, doublePI);
        if (Math.random() > 0.4) context.stroke();
        context.closePath()
    }
}

// 子弹呈现
function renderBullets() {
    var i = bullets.length - 1;
    for (i; i > -1; --i) {
        var b = bullets[i];
        context.beginPath();
        context.strokeStyle = b.color;
        context.arc(b.pos.getX() >> 0, b.pos.getY() >> 0, b.radius, 0, doublePI);
        if (Math.random() > 0.2) context.stroke();
        context.closePath()
    }
}

//小行星呈现
function renderAsteroids() {
    var i = asteroids.length - 1;
    for (i; i > -1; --i) {
        var a = asteroids[i];
        context.beginPath();
        context.lineWidth = (Math.random() > 0.2) ? 4 : 3;
        context.strokeStyle = a.color;
        var j = a.sides;
        context.moveTo((a.pos.getX() + Math.cos(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0, (a.pos.getY() + Math.sin(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0);
        for (j; j > -1; --j) { context.lineTo((a.pos.getX() + Math.cos(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0, (a.pos.getY() + Math.sin(doublePI * (j / a.sides) + a.angle) * a.radius) >> 0) }
        if (Math.random() > 0.2) context.stroke();
        context.closePath()
    }
}

// 扫描线呈现
function renderScanlines() {
    var i = hScan;
    context.globalAlpha = 0.05;
    context.lineWidth = 1;
    for (i; i > -1; --i) {
        context.beginPath();
        context.moveTo(0, i * 4);
        context.lineTo(screenWidth, i * 4);
        context.strokeStyle = (Math.random() > 0.0001) ? '#FFF' : '#222';
        context.stroke()
    }
    context.globalAlpha = 1
}

// 射击呈现
function generateShot() {
    var b = bulletPool.getElement();
    if (!b) return;
    b.radius = 1; //子弹大小
    b.pos.setXY(ship.pos.getX() + Math.cos(ship.angle) * 14, ship.pos.getY() + Math.sin(ship.angle) * 14);
    b.vel.setLength(8); //子弹发射速度
    b.vel.setAngle(ship.angle);
    bullets[bullets.length] = b
}

// 游戏重置
function resetGame() {
    asteroidVelFactor = 0;
    ship.pos.setXY(screenWidth >> 1, screenHeight >> 1);
    ship.vel.setXY(0, 0);
    resetAsteroids()
}

// 小行星重置
function resetAsteroids() {
    var i = asteroids.length - 1;
    for (i; i > -1; --i) {
        var a = asteroids[i];
        a.blacklisted = true
    }
}

//结算+重新开始
function restart() {
    oScore.style.display = "none";

    var s = oBox.score;
    var honor;
    var i = true;
    if (s < 10) {
        honor = "菜得...算了我不想说了...懂得都懂";
    } else if (s < 30) {
        honor = "革命尚未成功，同志仍需努力！";
    } else if (s < 40) {
        honor = "稍微有点姿色行了,倒不必美的如此完美！";
    } else if (s < 50) {
        honor = "矮油，还不错嘛！至今还为自己的帅坚强的活着！";
    } else if (s < 60) {
        honor = "您真是风靡万千少女，刺激帅哥市场之貌啊！";
    } else if (s < 80) {
        honor = "每一帧都如此令人心动，过分美丽也是违法的！";
    } else if (s < 100) {
        honor = "我觉得世界上所有的褒义词都适合你";
    } else if (s < 150) {
        honor = "";
    } else {
        honor = "你将永远顺利以至于不需要任何人的保护！";
    }
    oRe.style.display = "block";
    allReChild[0].children[0].innerHTML = s;
    allReChild[1].children[0].innerHTML = honor;
    return i;
}

// 星空背景
"use strict";
canvas = document.getElementById('canvas'),
    ctx = canvas.getContext('2d'),
    w = canvas.width = window.innerWidth,
    h = canvas.height = window.innerHeight,

    hue = 217,
    stars = [],
    count = 0,
    maxStars = 1400;

// Thanks @jackrugile for the performance tip! http://codepen.io/jackrugile/pen/BjBGoM
// Cache gradient
var canvas2 = document.createElement('canvas'),
    ctx2 = canvas2.getContext('2d');
canvas2.width = 100;
canvas2.height = 100;
var half = canvas2.width / 2,
    gradient2 = ctx2.createRadialGradient(half, half, 0, half, half, half);
gradient2.addColorStop(0.025, '#fff');
gradient2.addColorStop(0.1, 'hsl(' + hue + ', 61%, 33%)');
gradient2.addColorStop(0.25, 'hsl(' + hue + ', 64%, 6%)');
gradient2.addColorStop(1, 'transparent');

ctx2.fillStyle = gradient2;
ctx2.beginPath();
ctx2.arc(half, half, half, 0, Math.PI * 2);
ctx2.fill();

// End cache

function random(min, max) {
    if (arguments.length < 2) {
        max = min;
        min = 0;
    }

    if (min > max) {
        var hold = max;
        max = min;
        min = hold;
    }

    return Math.floor(Math.random() * (max - min + 1)) + min;
}

var Star = function() {

    this.orbitRadius = random(w / 2 - 50);
    this.radius = random(100, this.orbitRadius) / 10;
    this.orbitX = w / 2;
    this.orbitY = h / 2;
    this.timePassed = random(0, maxStars);
    this.speed = random(this.orbitRadius) / 900000;
    this.alpha = random(2, 10) / 10;

    count++;
    stars[count] = this;
}

Star.prototype.draw = function() {
    var x = Math.sin(this.timePassed + 1) * this.orbitRadius + this.orbitX,
        y = Math.cos(this.timePassed) * this.orbitRadius / 2 + this.orbitY,
        twinkle = random(10);

    if (twinkle === 1 && this.alpha > 0) {
        this.alpha -= 0.05;
    } else if (twinkle === 2 && this.alpha < 1) {
        this.alpha += 0.05;
    }

    ctx.globalAlpha = this.alpha;
    ctx.drawImage(canvas2, x - this.radius / 2, y - this.radius / 2, this.radius, this.radius);
    this.timePassed += this.speed;
}

for (var i = 0; i < maxStars; i++) {
    new Star();
}

function animation() {
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = 'hsla(' + hue + ', 64%, 6%, 1)';
    ctx.fillRect(0, 0, w, h)

    ctx.globalCompositeOperation = 'lighter';
    for (var i = 1, l = stars.length; i < l; i++) {
        stars[i].draw();
    };

    window.requestAnimationFrame(animation);
}

animation();