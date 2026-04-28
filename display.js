/* ============================================================
     VOICE NOTES PLAYER — APP LOGIC
     ============================================================ */

/* ----------------------------------------------------------
     1. CONFIG
     ---------------------------------------------------------- */
const WAV_FILES = [
  {name: 'Track 1', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec1.m4a' },
  {name: 'Track 2', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec2.m4a' },
  {name: 'Track 3', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec3.m4a' },
  {name: 'Track 4', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec4.m4a' },
  {name: 'Track 5', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec5.m4a' },
  {name: 'Track 6', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec6.m4a' },
  {name: 'Track 7', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec7.m4a' },
  {name: 'Track 8', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec8.m4a' },
  {name: 'Track 9', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec9.m4a' },
  {name: 'Track 10', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec10.m4a' },
  {name: 'Track 11', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec11.m4a' },
  {name: 'Track 12', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec12.m4a' },
  {name: 'Track 13', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec13.m4a' },
  {name: 'Track 14', path: 'C:\\Users\\lyare\\Downloads\\(No subject) (1)\\Rec14.m4a' },
];

/* ----------------------------------------------------------
     2. STATE
     ---------------------------------------------------------- */
const state = {
  notes: [],
  activeIndex: null,
  isPlaying: false,
};

/* ----------------------------------------------------------
     3. FILE LOADING LOGIC
     ---------------------------------------------------------- */
function loadStaticFiles() {
  WAV_FILES.forEach(f => {
    state.notes.push({ name: f.name, url: f.path, objectUrl: null });
  });
}

function loadFileObjects(fileList) {
  Array.from(fileList)
    .filter(f => f.name.toLowerCase().endsWith('.wav'))
    .forEach(f => {
      const existing = state.notes.find(n => n.name === f.name);
      if (existing?.objectUrl) URL.revokeObjectURL(existing.objectUrl);

      const url = URL.createObjectURL(f);
      if (existing) {
        existing.url = url;
        existing.objectUrl = url;
      } else {
        state.notes.push({ name: f.name, url, objectUrl: url });
      }
    });
  renderNoteList();
}

/* ----------------------------------------------------------
     4. AUDIO LOGIC
     ---------------------------------------------------------- */
const audio = document.getElementById('audio-engine');

function selectNote(index) {
  const note = state.notes[index];
  if (!note) return;

  state.activeIndex = index;
  audio.src = note.url;
  audio.load();
  audio.play().catch(err => console.warn('Playback error:', err));
  state.isPlaying = true;

  updateActiveRow();
  updatePlayerMeta(note.name);
  updateControls();
}

function togglePlayPause() {
  if (state.activeIndex === null) return;
  if (audio.paused) {
    audio.play();
    state.isPlaying = true;
  } else {
    audio.pause();
    state.isPlaying = false;
  }
  updateControls();
}

function seekRelative(seconds) {
  if (isNaN(audio.duration)) return;
  audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
}

function seekToFraction(fraction) {
  if (isNaN(audio.duration)) return;
  audio.currentTime = fraction * audio.duration;
}

function formatTime(s) {
  if (isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, '0');
  return `${m}:${sec}`;
}

/* ----------------------------------------------------------
     5. UI LOGIC
     ---------------------------------------------------------- */
const noteList       = document.getElementById('note-list');
const emptyState     = document.getElementById('empty-state');
const fileCount      = document.getElementById('file-count');
const nowPlayingName = document.getElementById('now-playing-name');
const progressFill   = document.getElementById('progress-fill');
const progressTrack  = document.getElementById('progress-track');
const timeCurrent    = document.getElementById('time-current');
const timeTotal      = document.getElementById('time-total');
const btnPlayPause   = document.getElementById('btn-play-pause');
const btnRewind      = document.getElementById('btn-rewind');
const btnForward     = document.getElementById('btn-forward');

function renderNoteList() {
  noteList.innerHTML = '';
  const count = state.notes.length;
  fileCount.textContent = `${count} file${count !== 1 ? 's' : ''}`;
  emptyState.style.display = count === 0 ? 'block' : 'none';

  state.notes.forEach((note, i) => {
    const li = document.createElement('li');
    li.className = 'note-item' + (i === state.activeIndex ? ' active' : '');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', i === state.activeIndex);
    li.dataset.index = i;

    const idx = document.createElement('span');
    idx.className = 'note-index';
    idx.textContent = String(i + 1).padStart(2, '0');

    const name = document.createElement('span');
    name.className = 'note-name';
    name.textContent = note.name.replace(/\.wav$/i, '');

    const dur = document.createElement('span');
    dur.className = 'note-duration';
    dur.id = `dur-${i}`;
    dur.textContent = '';

    const probe = new Audio();
    probe.preload = 'metadata';
    probe.src = note.url;
    probe.addEventListener('loadedmetadata', () => {
      dur.textContent = formatTime(probe.duration);
    }, { once: true });

    li.append(idx, name, dur);
    noteList.appendChild(li);
  });
}

function updateActiveRow() {
  noteList.querySelectorAll('.note-item').forEach((el, i) => {
    el.classList.toggle('active', i === state.activeIndex);
    el.setAttribute('aria-selected', i === state.activeIndex);
  });
}

function updatePlayerMeta(name) {
  nowPlayingName.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = name.replace(/\.wav$/i, '');
  nowPlayingName.appendChild(span);
}

function updateControls() {
  const hasNote = state.activeIndex !== null;
  btnPlayPause.disabled = !hasNote;
  btnRewind.disabled    = !hasNote;
  btnForward.disabled   = !hasNote;
  btnPlayPause.textContent = state.isPlaying ? 'Pause' : 'Play';
}

function updateProgress() {
  const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
  progressFill.style.width = `${pct}%`;
  progressTrack.setAttribute('aria-valuenow', Math.round(pct));
  timeCurrent.textContent = formatTime(audio.currentTime);
  timeTotal.textContent   = formatTime(audio.duration);
}

/* ----------------------------------------------------------
     6. EVENT WIRING
     ---------------------------------------------------------- */
noteList.addEventListener('click', e => {
  const item = e.target.closest('.note-item');
  if (!item) return;
  selectNote(Number(item.dataset.index));
});

btnPlayPause.addEventListener('click', togglePlayPause);
btnRewind.addEventListener('click', () => seekRelative(-5));
btnForward.addEventListener('click', () => seekRelative(5));

progressTrack.addEventListener('click', e => {
  const rect = progressTrack.getBoundingClientRect();
  seekToFraction((e.clientX - rect.left) / rect.width);
});

audio.addEventListener('timeupdate', updateProgress);

audio.addEventListener('ended', () => {
  state.isPlaying = false;
  updateControls();
  updateActiveRow();
});

document.getElementById('file-input').addEventListener('change', e => {
  loadFileObjects(e.target.files);
  e.target.value = '';
});

const listContainer = document.getElementById('list-container');
listContainer.addEventListener('dragover', e => {
  e.preventDefault();
  listContainer.style.outline = '2px solid var(--color-accent)';
});
listContainer.addEventListener('dragleave', () => {
  listContainer.style.outline = '';
});
listContainer.addEventListener('drop', e => {
  e.preventDefault();
  listContainer.style.outline = '';
  if (e.dataTransfer.files.length) loadFileObjects(e.dataTransfer.files);
});

/* ----------------------------------------------------------
     INIT
     ---------------------------------------------------------- */
loadStaticFiles();
renderNoteList();
updateControls();