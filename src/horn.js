export default class Horn {
  /**
   * A drawable spinning, floating horn.
   * @constructor
   * @param {CanvasRenderingContext2D} context - The rendering context being 
   * drawn to.
   * @param {HTMLImageElement} image - the image to be drawn.
   * @param {Object} options - an optional options object.
   */
  constructor(context, image, options = {}) {
    // Assert context exists because it is manditory
    if (context instanceof CanvasRenderingContext2D) {
      this.context = context;
    } else {
      throw new TypeError(
        `Expected context to be a CanvasRenderingContext2D. Found: ${typeof context}`
      );
    }

    // Assert image exists because it is manditory
    if (image instanceof HTMLImageElement) {
      this.image = image;
    } else {
      throw new TypeError(
        `Expected image to be a HTMLImageElement. Found: ${typeof image}`
      );
    }

    const { width: canvasWidth, height: canvasHeight } = context.canvas;
    // Create an offset in the range of [-1/4pi, 1/4pi]
    const angleOffset = (Math.random() - 0.5) * (Math.PI / 2);
    // The speed to be used as the magnitiude of the velocity vector.
    const speed = Math.random() * canvasWidth;
    // Which side of the screen the horn is going to appear on
    const isLeft = Math.random() < 0.5;
    // An angle pointing right if it is spawning on the left side, or vice-versa
    // with the offset added
    const angle = Math.PI * (isLeft + 0.5) + angleOffset;
    // The aspect ratio of the image in case the height is not specified in the
    // options object
    const aspectRatio = image.height / image.width;

    const {
      // width in pixels
      width = 48,
      // height in pixels
      height = width * aspectRatio,
      // minimum time to live in milliseconds
      minTTL = 3000,
      // maximum time to live in milliseconds
      maxTTL = 5000,
      // maximum rotation speed in rotations per second
      maxRotationSpeed = 4,
    } = options;

    this.width = width;
    this.height = height;

    this.createdAt = performance.now();

    this.timeToLive = minTTL + Math.random() * (maxTTL - minTTL);

    this.position = {
      x: isLeft * canvasWidth,
      // somewhere in them middle half
      y: canvasHeight / 2 + (Math.random() - 0.5) * (canvasHeight / 2),
    };

    // create a unit vector from the angle, multiplied by the speed
    this.velocity = {
      x: Math.sin(angle) * speed,
      y: Math.cos(angle) * speed,
    };

    // multiply the rotation speed by a number in the range of [-2pi, 2pi]
    this.rotationSpeed = (Math.random() * 4 - 2) * Math.PI * maxRotationSpeed;
    this.rotation = 0;
  }

  /**
   * Checks if the horn is still "alive" and should update.
   * @returns {Boolean}
   */
  shouldUpdate() {
    return performance.now() - this.createdAt < this.timeToLive;
  }

  /**
   * Updates the positional properies of the horn.
   * @param {Number} deltaTime - the time in milliseconds since last update.
   */
  update(deltaTime) {
    const { position, velocity, rotationSpeed } = this;
    const dtInSeconds = deltaTime / 1000;

    position.x += velocity.x * dtInSeconds;
    position.y += velocity.y * dtInSeconds;

    this.rotation += rotationSpeed * dtInSeconds;
  }

  /**
   * Draws the horn to the rendering context.
   */
  draw() {
    const { context, position, rotation, image, width, height } = this;
    context.save();

    context.translate(position.x, position.y);
    context.rotate(rotation);

    // Draw the image with the center of the image at the current origin
    context.drawImage(image, -width / 2, -height / 2, width, height);

    context.restore();
  }
}
