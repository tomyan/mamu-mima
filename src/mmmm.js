
require.def(
    "mmmm",
    ["jquery"],
    function ($) {
    var StartFinishLine = function () {
        var StartFinishLine = function (x, y, dir) {
            this.x = x;
            this.y = y;
            this.dir = dir;
        };

        StartFinishLine.prototype.render = function (paper) {
            this.path = paper.path("M" + (this.x - 50) + " " + this.y + " L" + (this.x + 50) + " " + this.y).attr("stroke-dasharray", "--");
            this.path.rotate(this.dir);
        };

        return StartFinishLine;
    }();

    var Car = function () {
        var Car = function (x, y, dir) {
            this.x = x;
            this.y = y;
            this.dir = dir;
            this.speed = 0;
            this.acceleration = 2000;
            this.deceleration = 200;
            this.brakingDeceleration = 1000;
            this.topSpeed = 800;
        };

        Car.prototype.render = function (paper) {
            this.path = paper.path(
                "M" + (this.x - 20) + " " + (this.y + 20) + " "
                + "L" + (this.x - 20) + " " + (this.y) + " "
                + "L" + (this.x - 10) + " " + (this.y - 20) + " "
                + "L" + (this.x + 10) + " " + (this.y - 20) + " "
                + "L" + (this.x + 20) + " " + (this.y) + " "
                + "L" + (this.x + 20) + " " + (this.y + 20) + " "
                + "L" + (this.x - 20) + " " + (this.y + 20)
            );
            this.path.translate(-20, 0);
            this.path.rotate(this.dir);
       };

        Car.prototype.rotate = function (angle) {
            this.dir += angle;
            this.path.rotate(angle);
        };

        Car.prototype.tick = function (timeDiff, accelerating, braking) {
//            console.log('moving', accelerating, braking, this.speed > this.topSpeed);
            if (accelerating && ! braking && this.speed < this.topSpeed) {
                this.speed += this.acceleration * timeDiff;
                if (this.speed > this.topSpeed) {
                    this.speed = this.topSpeed;
                }
            }
            if (! accelerating && ! this.breaking) {
                this.speed -= this.deceleration * timeDiff;
                if (this.speed < 0) {
                    this.speed = 0;
                }
            }
            if (braking) {
                this.speed -= this.brakingDeceleration * timeDiff;
                if (this.speed < 0) {
                    this.speed = 0;
                }
            }
//            console.log('speed', this.speed);
            var distance = this.speed * timeDiff,
                radians  = (this.dir - 90) * Math.PI / 180,
                x = Math.round(Math.cos(radians) * distance),
                y = Math.round(Math.sin(radians) * distance);
            this.path.translate(x, y);
            if (this.scrollBackground) {
                this.scrollBackground.scrollLeft += x;
                this.scrollBackground.scrollTop += y;
            }
        };

        return Car;
    }();

    var Level = function () {
        var Level = function (x, y, builder) {
            this.x = x;
            this.y = y;
            this.builder = builder;
            this.toRender = [];
        };

        Level.prototype.createPaper = function (container) {
            container.width = this.x + 'px';
            container.height = this.y + 'px';
            return Raphael(container, this.x, this.y);
        };

        Level.prototype.setSize = function (x, y) {
            this.x = x;
            this.y = y;
        };

        Level.prototype.addStartFinishLine = function (x, y, dir) {
            this.toRender.push(this.startFinishLine = new StartFinishLine(x, y, dir));
        };

        Level.prototype.positionAtStart = function () {
            this.container.parentNode.scrollLeft = this.startFinishLine.x - Math.floor(this.container.parentNode.offsetWidth / 2);
            this.container.parentNode.scrollTop = this.startFinishLine.y - Math.floor(this.container.parentNode.offsetHeight / 2);
        };

        Level.prototype.render = function (paper) {
            this.builder.call(this, paper);
            for (var i = 0, l = this.toRender.length; i < l; i++) {
                this.toRender[i].render(paper);
            }
        };

        Level.prototype.addCar = function () {
            return new Car(this.startFinishLine.x, this.startFinishLine.y, this.startFinishLine.dir);
        };

        return Level;
    }();

    var Controller = function () {
        var Controller = function () {
            this.cars = [];
        };

        Controller.prototype.initLevel = function (level) {
            this.level = level;
            this.container = document.getElementById("level");
            this.paper = level.createPaper(this.container);
            level.render(this.paper);
            this.positionAtStart();
        };

        Controller.prototype.addCar = function () {
            var car = this.level.addCar();
            this.cars.push(car);
            car.render(this.paper);
            return car;
        };

        Controller.prototype.positionAtStart = function () {
            this.container.parentNode.scrollLeft = this.level.startFinishLine.x - Math.floor(this.container.parentNode.offsetWidth / 2);
            this.container.parentNode.scrollTop = this.level.startFinishLine.y - Math.floor(this.container.parentNode.offsetHeight / 2);
        };

        Controller.prototype.start = function () {
            this.accelerating = false;
            this.braking = false;
            this.turningLeft = false;
            this.turningRight = false;
            this.car = this.addCar();
            var controller = this;
            this.car.scrollBackground = this.container.parentNode;
            $(document).bind("keydown", function (e) {
                if (e.keyCode === 37) { // <-
                    controller.turningLeft = true;
                }
                else if (e.keyCode === 39) { // ->
                    controller.turningRight = true;
                }
                else if (e.keyCode === 38) { // ^
                    console.log('setting accelerating');
                    controller.accelerating = true;
                }
                else if (e.keyCode === 40) { // v
                    controller.braking = true;
                }
            });
            $(document).bind("keyup", function (e) {
                if (e.keyCode === 37) { // <-
                    controller.turningLeft = false;
                }
                else if (e.keyCode === 39) { // -
                    controller.turningRight = false;
                }
                else if (e.keyCode === 38) { // ^
                    controller.accelerating = false;
                }
                else if (e.keyCode === 40) { // v
                    controller.braking = false;
                }
            });

            var start = (new Date()).getTime(),
                oldNow,
                now = 0;
            setInterval(function () {
                oldNow = now;
                now = (new Date()).getTime() - start;
                var timeDiff = (now - oldNow) / 1000;
                if (controller.turningRight) {
                    controller.car.rotate(180 * timeDiff);
                }
                else if (controller.turningLeft) {
                    controller.car.rotate(-180 * timeDiff);
                }
                controller.car.tick(timeDiff, controller.accelerating, controller.braking);
            }, 40);
        };

        return Controller;
    }();

    var level1 = new Level(1200, 1200, function (paper) {

        // outside of track
        paper.path("M100 100 L1000 100 L1000 1000 L100 1000 L100 100");

        // inside of track
        paper.path("M170 170 L940 170 L940 940 L170 940 L170 170");

        this.addStartFinishLine(550, 135, 90);
    });

    var controller = new Controller();

    controller.initLevel(level1);
    controller.start();
});

