let songs = [];
let currentSongIndex = 0;
let isPlaying = false;

const audio = new Audio();
const playBtn = document.getElementById("play");
const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const progressBar = document.getElementById("progress");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const titleEl = document.getElementById("song-title");
const artistEl = document.getElementById("song-artist");
const fileInput = document.getElementById("file-input");
const chooseBtn = document.getElementById("choose-btn");
const beatRing = document.getElementById("beat-ring");
const disk = document.getElementById("disk"); // New rotating CD element

// ====== AUDIO CONTEXT FOR BEAT VISUALIZER ======
let audioContext, analyser, source, dataArray;

// ====== CHOOSE SONGS ======
chooseBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (event) => {
  const files = Array.from(event.target.files);
  songs = files.map(file => ({
    title: file.name.replace(/\.[^/.]+$/, ""),
    artist: "Local File",
    src: URL.createObjectURL(file)
  }));

  if (songs.length > 0) {
    currentSongIndex = 0;
    loadSong(currentSongIndex);
  }
});

// ====== LOAD SONG ======
function loadSong(index) {
  const song = songs[index];
  if (!song) return;
  audio.src = song.src;
  titleEl.textContent = song.title;
  artistEl.textContent = song.artist || "Unknown Artist";
  progressBar.value = 0;
  currentTimeEl.textContent = "0:00";
  durationEl.textContent = "0:00";
  if (isPlaying) audio.play();
}

// ====== PLAY / PAUSE ======
function togglePlay() {
  if (songs.length === 0) return alert("Please select songs first!");

  if (isPlaying) {
    audio.pause();
    playBtn.innerHTML = "▶️";
    disk.style.animationPlayState = "paused";
  } else {
    audio.play();
    playBtn.innerHTML = "⏸️";
    disk.style.animationPlayState = "running";
    setupVisualizer();

    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume();
    }
  }

  isPlaying = !isPlaying;
}

// ====== PREV / NEXT ======
function prevSong() {
  if (songs.length === 0) return;
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  loadSong(currentSongIndex);
  if (isPlaying) audio.play();
}

function nextSong() {
  if (songs.length === 0) return;
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  loadSong(currentSongIndex);
  if (isPlaying) audio.play();
}

// ====== UPDATE PROGRESS ======
audio.addEventListener("timeupdate", () => {
  if (audio.duration) {
    progressBar.value = (audio.currentTime / audio.duration) * 100;
    currentTimeEl.textContent = formatTime(audio.currentTime);
    durationEl.textContent = formatTime(audio.duration);
  }
});

// ====== SEEK ======
progressBar.addEventListener("input", () => {
  if (audio.duration) {
    audio.currentTime = (progressBar.value / 100) * audio.duration;
  }
});

// ====== AUTO NEXT ======
audio.addEventListener("ended", () => {
  nextSong();
  disk.style.animationPlayState = "paused"; // Stop rotation
  playBtn.innerHTML = "▶️";
  isPlaying = false;
});

// ====== FORMAT TIME ======
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// ====== EVENT LISTENERS ======
playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", prevSong);
nextBtn.addEventListener("click", nextSong);

// ====== BEAT VISUALIZER ======
function setupVisualizer() {
  if (!audioContext) {
    audioContext = new AudioContext();
    source = audioContext.createMediaElementSource(audio);
    analyser = audioContext.createAnalyser();
    source.connect(analyser);
    analyser.connect(audioContext.destination);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    visualizeBeat();
  }
}

function visualizeBeat() {
  requestAnimationFrame(visualizeBeat);
  if (!analyser) return;

  analyser.getByteFrequencyData(dataArray);
  const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

  // Pulse scale and glow based on volume intensity
  const scale = 1 + avg / 250;
  const glow = Math.min(avg * 1.5, 255);

  beatRing.style.transform = `translate(-50%, -50%) scale(${scale})`;
  beatRing.style.boxShadow = `0 0 ${glow / 2}px rgba(0, 225, 255, 0.8)`;
}
