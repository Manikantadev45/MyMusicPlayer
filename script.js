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
const disk = document.getElementById("disk");
const menuBtn = document.getElementById("menu-btn");
const songList = document.getElementById("song-list");
const songItems = document.getElementById("song-items");

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
    updateSongList(); // ✅ ensure song list updates
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
    playBtn.innerHTML = '<i class="fas fa-play"></i>';
    disk.style.animationPlayState = "paused";
  } else {
    audio.play();
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';
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
  disk.style.animationPlayState = "paused";
  playBtn.innerHTML = '<i class="fas fa-play"></i>';
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

  const scale = 1 + avg / 250;
  const glow = Math.min(avg * 1.5, 255);

  beatRing.style.transform = `translate(-50%, -50%) scale(${scale})`;
  beatRing.style.boxShadow = `0 0 ${glow / 2}px rgba(255, 55, 0, 0.8)`;
}

// ====== MENU: UPDATE SONG LIST ======
function updateSongList() {
  songItems.innerHTML = "";
  songs.forEach((song, index) => {
    const li = document.createElement("li");
    li.textContent = song.title;
    li.classList.add("song-item");
    li.addEventListener("click", () => {
      currentSongIndex = index;
      loadSong(index);
      if (!isPlaying) togglePlay(); // start playback if paused
      songList.classList.add("hidden");
    });
    songItems.appendChild(li);
  });
}

// ====== MENU BUTTON TOGGLE ======
menuBtn.addEventListener("click", () => {
  songList.classList.toggle("hidden");
});

// ====== CLOSE MENU WHEN CLICKING OUTSIDE ======
document.addEventListener("click", (e) => {
  if (!songList.contains(e.target) && !menuBtn.contains(e.target)) {
    songList.classList.add("hidden");
  }
});
