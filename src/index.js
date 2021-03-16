import Horn from "./horn.js";
import tmi from "tmi.js";

// TODO: Allow the user to configure the channel being connected to
const twitchChannel = "russ_money";

// the URLs to fetch the horn images from
const hornImageURLs = [
  "assets/images/horn.png",
  "assets/images/textHorn.png",
  "assets/images/clown.png",
  "https://static-cdn.jtvnw.net/emoticons/v2/303562626/default/dark/2.0",
];

// the URLs to fetch the horn audio files from
const hornAudioURLs = [
  "assets/sound/bikehorn.ogg", 
  "assets/sound/airhorn.ogg", 
  "assets/sound/airhorn2.ogg"
];

window.onload = async () => {
  const canvas = document.querySelector("#canvas");
  const canvasContext = canvas.getContext("2d");
  const audioContext = new AudioContext();
  let horns = [];

  const client = new tmi.Client({
    connection: { reconnect: true },
    channels: [twitchChannel],
  });

  // Download all the images and audio files, and connect to twitch,
  // at the same time
  const [
    hornImage,
    textHornImage,
    clownImage,
    twitchHornImage,
    bikeHornBuffer,
    airHornBuffer,
    airHorn2Buffer,
  ] = await Promise.all([
    ...hornImageURLs.map(fetchImage),
    ...hornAudioURLs.map(fetchAudioBuffer.bind(undefined, audioContext)),
    client.connect(),
  ]);

  client.on("message", handleMessage);

  resizeCanvasToDisplaySize(canvas);

  let lastTime = performance.now();

  // start the animation loop
  requestAnimationFrame(draw);

  /**
   * The core function of the animation loop.
   * @param {DOMHighResTimeStamp} time - Provided by requestAnimationFrame.
   */
  function draw(time) {
    // Make sure the canvas's buffer dimentions fit it's display dimentions.
    // We call it every tick as an alternative to the resize event to avoid the
    // wonkiness of the resize event
    resizeCanvasToDisplaySize(canvas);

    // Clear the entire canvas
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);

    // Remove horns that shouldn't update
    horns = horns.filter((horn) => horn.shouldUpdate());

    // Update and draw all of the "alive" horns
    const dt = time - lastTime;
    horns.forEach((horn) => {
      horn.update(dt);
      horn.draw();
    });

    lastTime = time;

    // Queue up the next iteration of the loop
    requestAnimationFrame(draw);
  }

  /**
   * The logic for handling twitch messages and therefore listening for when to
   * spawn horns. Listens for the tmi.js Message event.
   * @see {@link https://github.com/tmijs/docs/blob/gh-pages/_posts/v1.4.2/2019-03-03-Events.md#message}
   */
  function handleMessage(channel, userstate, message, self) {
    // Check if the message contains "russmoHORN" or "russmoHONK".
    // TODO: Allow the user to configure the trigger emotes.
    if (/russmoHORN|russmoHONK/.test(message)) {
      // Could be worth extacting this logic into a Role class that has a list
      // of images, sounds, and a isUserRole function that tests against the
      // userstate. However at the current scale that would create more
      // complexity than it'd remove.

      // Default to the "poverty horn" and the SS13 bikehorn noise.
      let image = textHornImage;
      let audioBuffer = bikeHornBuffer;

      const { badges } = userstate;

      // Check if the messager is the broadcaster.
      if (badges && badges.broadcaster) {
        image = clownImage;
        // Randomly pick between the two airhorn noises.
        audioBuffer = Math.random() > 0.5 ? airHornBuffer : airHorn2Buffer;
        // Check if the messager is a subscriber.
      } else if (userstate.subscriber) {
        // Randomly pick between the SS13 bikehorn icon, or the russmoHorn icon.
        image = Math.random() > 0.5 ? hornImage : twitchHornImage;
      }

      // Add a new horn to screen with the selected image.
      horns.push(new Horn(canvasContext, image));

      // Play the selected horn noise. Hopefully this will be the airhorn.
      playAudioBuffer(audioContext, audioBuffer);
    }
  }
};

/**
 * Fetch an image as an HTMLImageElement that is loaded before resolution.
 * @param {String} url - The address of the image to fetch.
 * @returns {HTMLImageElement}
 */
async function fetchImage(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const image = new Image();
  image.src = blobUrl;

  return image;
}

/**
 * Fetches an audio file as a decoded audio buffer.
 * @param {AudioContext} context - The context handling the audio file.
 * @param {String} url - The address of the sound file to fetch.
 * @returns {AudioBuffer}
 */
async function fetchAudioBuffer(context, url) {
  const res = await fetch(url);
  const rawBuffer = await res.arrayBuffer();
  return await context.decodeAudioData(rawBuffer);
}

/**
 * Plays a sound from an AudioBuffer.
 * @param {AudioContext} context - The context to play the file at.
 * @param {AudioBuffer} buffer - The sound to be played.
 */
function playAudioBuffer(context, buffer) {
  // AudioBufferSourceNodes can only be used once.
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.connect(context.destination);
  source.start();
}

/**
 * Resize a Canvas's buffer size to its display size.
 * @param {HTMLCanvasElement} canvas
 */
function resizeCanvasToDisplaySize(canvas) {
  // Ensure it needs to be resized before resizing.
  if (canvas.width !== canvas.clientWidth) {
    canvas.width = canvas.clientWidth;
  }
  if (canvas.height !== canvas.clientHeight) {
    canvas.height = canvas.clientHeight;
  }
}
