document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

// ===== MOCK DATA =====
const trainers = [
  { id: 'alex', name: 'Alex Rivers' },
  { id: 'jordan', name: 'Jordan Lee' },
  { id: 'sarah', name: 'Sarah Jenkins' }
];

const locations = [
  { id: 'downtown', name: 'Downtown Studio' },
  { id: 'westside', name: 'Westside Gym' }
];

const services = [
  { id: 'pt', name: '1-on-1 Training', color: 'gold' },
  { id: 'group', name: 'Group Class', color: 'gold-dark' },
  { id: 'intro', name: 'Introductory Slot', color: 'gold-light' }
];

const clients = [
  { id: 'c1', name: 'Mike Thompson' },
  { id: 'c2', name: 'Emma Watson' },
  { id: 'c3', name: 'David Chen' }
];

const bookings = [];
const today = new Date();

// Helper to get a random item from array
function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const statusOptions = ['Scheduled', 'Confirmed', 'Attended', 'Not Attended', 'Cancelled', 'Waiting List', 'Rescheduled'];
const notesPool = [
  'Focus on lower body strength.', 'Cardio intensive session.', 'First time client orientation.', 
  'Client requested mobility focus.', 'Recovery and stretching.', 'High Intensity Interval Training.', 
  'Preparing for upcoming marathon.', 'Post-injury rehab focus.', 'Group strength circuit.', 
  'Nutrition and diet consultation included.'
];

let bookingIdCounter = 1;

// Generate rich data for a 28-day window (-14 to +14 days)
for (let i = -14; i <= 14; i++) {
  const d = new Date(today);
  d.setDate(today.getDate() + i);
  const dateStr = toLocalISODate(d);
  const isWeekend = d.getDay() === 0 || d.getDay() === 6;

  // Decide how many bookings to generate for this day (more on weekdays, fewer on weekends)
  const numBookings = isWeekend ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 8) + 4;

  for (let j = 0; j < numBookings; j++) {
    const hour = Math.floor(Math.random() * 10) + 8; // 8 AM to 5 PM
    const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
    
    bookings.push({
      id: `b_auto_${bookingIdCounter++}`,
      date: dateStr,
      hour: hour,
      minute: minute,
      durationMinutes: Math.random() > 0.5 ? 60 : 30,
      trainerId: getRandom(trainers).id,
      locationId: getRandom(locations).id,
      serviceId: getRandom(services).id,
      clientId: getRandom(clients).id,
      status: getRandom(statusOptions),
      notes: getRandom(notesPool)
    });
  }

  // Inject a high-density "stress test" block for the current day AND tomorrow to test "View More" robustly
  if (i === 0 || i === 1) {
    for (let k = 1; k <= 8; k++) {
      bookings.push({
        id: `b_stress_${i}_${k}`,
        date: dateStr,
        hour: 10, // Peak time 10 AM
        minute: (k % 4) * 15, // Mix of 00, 15, 30, 45
        durationMinutes: 45,
        trainerId: k % 2 === 0 ? 'alex' : 'sarah',
        locationId: 'downtown',
        serviceId: 'group',
        clientId: getRandom(clients).id,
        status: k === 1 ? 'Confirmed' : 'Waiting List',
        notes: `Group class capacity overflow test #${k}`
      });
    }
  }
}

// ===== STATE =====
let state = {
  currentDate: new Date(),
  view: 'day',
  location: 'all',
  trainer: 'all',
  service: 'all',
  client: 'all'
};

// ===== INIT =====
function initApp() {
  positionThemeToggle();
  window.addEventListener('resize', positionThemeToggle);
  bindControls();
  initThemeToggle();
  initInfoPopup();
  initCustomDropdowns();
  renderGrid();

  // Loader transition
  const loader = document.getElementById('loadingOverlay');

  // After short artificial delay, hide loader
  setTimeout(() => {
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.style.display = 'none';
      }, 500); // match css transition time
    }
  }, 600);
}

// Move info icon + theme toggle between heading (mobile) and controls-right (desktop)
function positionThemeToggle() {
  const toggle = document.getElementById('themeToggleWrapper');
  const infoWrapper = document.getElementById('infoIconWrapper');
  const headingSlot = document.getElementById('headingRightSlot');
  const controlsRight = document.querySelector('.controls-right');
  if (!toggle || !headingSlot || !controlsRight) return;

  if (window.innerWidth < 768) {
    // Mobile: move both into heading row
    if (infoWrapper && infoWrapper.parentElement !== headingSlot) {
      headingSlot.appendChild(infoWrapper);
    }
    if (toggle.parentElement !== headingSlot) {
      headingSlot.appendChild(toggle);
      toggle.style.display = 'flex';
    }
  } else {
    // Desktop: move both back into controls-right
    if (infoWrapper && infoWrapper.parentElement !== controlsRight) {
      controlsRight.insertBefore(infoWrapper, controlsRight.firstChild);
    }
    if (toggle.parentElement !== controlsRight) {
      controlsRight.appendChild(toggle);
    }
  }
}

// ===== INFO POPUP (Status Legend) =====
function initInfoPopup() {
  const btn = document.getElementById('infoIconBtn');
  const popup = document.getElementById('infoPopup');
  const closeBtn = document.getElementById('closeInfoPopup');
  if (!btn || !popup) return;

  renderStatusLegend();

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    popup.classList.toggle('hidden');
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      popup.classList.add('hidden');
    });
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!popup.classList.contains('hidden') && !popup.contains(e.target) && e.target !== btn && !btn.contains(e.target)) {
      popup.classList.add('hidden');
    }
  });
}

// ===== UTILITIES =====
function toLocalISODate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateDisplay(date) {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// ===== THEME TOGGLE (Gold & Black Only) =====
function initThemeToggle() {
  const wrapper = document.getElementById('themeToggleWrapper');
  const knob = document.getElementById('themeToggleKnob');
  const icon = document.getElementById('themeToggleIcon');
  const text = document.getElementById('themeToggleText');
  const darkBg = document.getElementById('darkThemeBg');
  const lightBg = document.getElementById('lightThemeBg');
  const html = document.documentElement;

  wrapper.addEventListener('click', () => {
    html.classList.add('theme-transition');
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');

    if (isDark) {
      knob.classList.replace('translate-x-[0px]', 'translate-x-[28px]');
      icon.innerText = 'dark_mode';
      if (text) text.innerText = 'Dark Mode';
      darkBg.classList.remove('opacity-0');
      darkBg.classList.add('opacity-100');
      lightBg.classList.remove('opacity-100');
      lightBg.classList.add('opacity-0');
    } else {
      knob.classList.replace('translate-x-[28px]', 'translate-x-[0px]');
      icon.innerText = 'light_mode';
      if (text) text.innerText = 'Light Mode';
      darkBg.classList.remove('opacity-100');
      darkBg.classList.add('opacity-0');
      lightBg.classList.remove('opacity-0');
      lightBg.classList.add('opacity-100');
    }

    setTimeout(() => {
      html.classList.remove('theme-transition');
    }, 500);
  });
}

// ===== CUSTOM SEARCHABLE DROPDOWNS =====
function initCustomDropdowns() {
  const configs = [
    { id: 'filter-location', data: locations, stateKey: 'location', allLabel: 'All Locations' },
    { id: 'filter-trainer', data: trainers, stateKey: 'trainer', allLabel: 'All Trainers' },
    { id: 'filter-service', data: services, stateKey: 'service', allLabel: 'All Services' },
    { id: 'filter-client', data: clients, stateKey: 'client', allLabel: 'All Clients' }
  ];

  configs.forEach(cfg => {
    const container = document.getElementById(cfg.id);
    if (!container) return;

    const trigger = container.querySelector('.dropdown-trigger');
    const menu = container.querySelector('.dropdown-menu');
    const searchInput = container.querySelector('.dropdown-search');
    const optionsContainer = container.querySelector('.dropdown-options');
    const selectedText = container.querySelector('.selected-text');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpening = menu.classList.contains('opacity-0');
      closeAllDropdowns(menu);
      
      if (isOpening) {
        menu.classList.remove('opacity-0', 'invisible', 'translate-y-[-10px]', 'scale-95');
        menu.classList.add('opacity-100', 'visible', 'translate-y-0', 'scale-100');
        searchInput.value = '';
        renderOptions();
        searchInput.focus();
      } else {
        menu.classList.add('opacity-0', 'invisible', 'translate-y-[-10px]', 'scale-95');
        menu.classList.remove('opacity-100', 'visible', 'translate-y-0', 'scale-100');
      }
    });

    menu.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    const renderOptions = (filterText = '') => {
      optionsContainer.innerHTML = '';
      if (cfg.allLabel.toLowerCase().includes(filterText.toLowerCase())) {
        optionsContainer.appendChild(makeOptionEl('all', cfg.allLabel, cfg, selectedText, searchInput, menu));
      }
      cfg.data
        .filter(item => item.name.toLowerCase().includes(filterText.toLowerCase()))
        .forEach(item => {
          optionsContainer.appendChild(makeOptionEl(item.id, item.name, cfg, selectedText, searchInput, menu));
        });
    };

    searchInput.addEventListener('input', (e) => renderOptions(e.target.value));
    renderOptions();
  });

  document.addEventListener('click', () => closeAllDropdowns());
}

function makeOptionEl(value, label, cfg, selectedText, searchInput, menu) {
  const el = document.createElement('div');
  const isSelected = state[cfg.stateKey] === value;
  el.className = `p-2 text-sm cursor-pointer rounded hover:bg-gold/10 transition-colors ${isSelected ? 'font-bold text-gold-dark dark:text-gold' : 'text-charcoal dark:text-muted-white'}`;
  el.innerText = label;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    state[cfg.stateKey] = value;
    selectedText.innerText = label;
    menu.classList.add('opacity-0', 'invisible', 'translate-y-[-10px]', 'scale-95');
    menu.classList.remove('opacity-100', 'visible', 'translate-y-0', 'scale-100');
    searchInput.value = '';
    renderGrid();
  });
  return el;
}

function closeAllDropdowns(except = null) {
  document.querySelectorAll('.dropdown-menu').forEach(m => {
    if (m !== except) {
      m.classList.add('opacity-0', 'invisible', 'translate-y-[-10px]', 'scale-95');
      m.classList.remove('opacity-100', 'visible', 'translate-y-0', 'scale-100');
    }
  });
}

// ===== RENDERING =====
function renderGrid() {
  let dayExpanded = document.querySelector('.day-row-wrapper.focus-active');
  let weekExpanded = document.querySelector('.week-row-wrapper.focus-active');
  let expDayHr = dayExpanded ? dayExpanded.id.split('-').pop() : null;
  let expWeekHr = weekExpanded ? weekExpanded.id.split('-').pop() : null;

  updateControlsUI();
  const grid = document.getElementById('scheduleGrid');
  grid.innerHTML = '';
  if (state.view === 'day') renderDayView(grid);
  else if (state.view === 'week') renderWeekView(grid);
  else if (state.view === 'month') renderMonthView(grid);

  if (state.view === 'day' && expDayHr) {
    const expanded = document.getElementById(`slot-expanded-${expDayHr}`);
    const rowContainer = document.getElementById(`day-row-container-${expDayHr}`);
    if (expanded && rowContainer) {
      expanded.classList.add('expanded');
      rowContainer.classList.add('focus-active');
      const topSection = rowContainer.querySelector('.top-section');
      if (topSection) topSection.style.display = 'none';
      document.querySelectorAll('.day-row-wrapper').forEach(row => {
        if (row.id !== `day-row-container-${expDayHr}`) row.style.display = 'none';
      });
      const btn = rowContainer.querySelector('button');
      if (btn) btn.innerHTML = `<span class="material-symbols-outlined text-sm mr-1">expand_less</span>Collapse`;
    }
  } else if (state.view === 'week' && expWeekHr) {
    const expanded = document.getElementById(`week-expanded-${expWeekHr}`);
    const rowContainer = document.getElementById(`week-row-container-${expWeekHr}`);
    if (expanded && rowContainer) {
      expanded.classList.add('expanded');
      rowContainer.classList.add('focus-active');
      const topSection = rowContainer.querySelector('.top-section');
      if (topSection) topSection.style.display = 'none';
      document.querySelectorAll('.week-row-wrapper').forEach(row => {
        if (row.id !== `week-row-container-${expWeekHr}`) row.style.display = 'none';
      });
      const btn = rowContainer.querySelector('button');
      if (btn) btn.innerHTML = `<span class="material-symbols-outlined text-sm mr-1">expand_less</span>Collapse`;
    }
  }
}

function updateControlsUI() {
  document.getElementById('currentDateDisplay').innerText = formatDateDisplay(state.currentDate);
  const slider = document.getElementById('viewToggleSlider');
  
  document.querySelectorAll('#viewToggles button').forEach(btn => {
    if (btn.dataset.view === state.view) {
      btn.className = 'view-toggle-btn relative z-10 py-1.5 text-label-caps font-label-caps text-pure-black font-bold rounded-lg transition-colors duration-300';
      // Defer slider position measurement to next frame so CSS widths are applied
      requestAnimationFrame(() => {
        if (slider) {
          slider.style.width = `${btn.offsetWidth}px`;
          slider.style.transform = `translateX(${btn.offsetLeft}px)`;
        }
      });
    } else {
      btn.className = 'view-toggle-btn relative z-10 py-1.5 text-label-caps font-label-caps text-muted-grey hover:text-gold-dark dark:hover:text-gold rounded-lg transition-colors duration-300';
    }
  });
}

// ===== STATUS COLOR MAP =====
const STATUS_MAP = {
  // Main statuses
  'Available':               { icon: 'event_available',   bg: 'bg-[#3b82f6]/10', border: 'border-[#3b82f6]/40', text: 'text-[#3b82f6]', dot: '#3b82f6' }, // Blue
  'Scheduled':               { icon: 'event',             bg: 'bg-[#a855f7]/10', border: 'border-[#a855f7]/40', text: 'text-[#a855f7]', dot: '#a855f7' }, // Purple
  'Rescheduled':             { icon: 'event_repeat',      bg: 'bg-[#f97316]/10', border: 'border-[#f97316]/40', text: 'text-[#f97316]', dot: '#f97316' }, // Orange
  'Confirmed':               { icon: 'check_circle',      bg: 'bg-[#22c55e]/10', border: 'border-[#22c55e]/40', text: 'text-[#22c55e]', dot: '#22c55e' }, // Green
  'Attended':                { icon: 'how_to_reg',        bg: 'bg-[#06b6d4]/10', border: 'border-[#06b6d4]/40', text: 'text-[#06b6d4]', dot: '#06b6d4' }, // Cyan
  'Not Attended':            { icon: 'person_off',        bg: 'bg-[#831843]/10', border: 'border-[#831843]/40', text: 'text-[#831843]', dot: '#831843' }, // Deep Burgundy
  'Cancelled':               { icon: 'cancel',            bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/40', text: 'text-[#ef4444]', dot: '#ef4444' }, // Red
  'Waiting List':            { icon: 'list_alt',          bg: 'bg-[#eab308]/10', border: 'border-[#eab308]/40', text: 'text-[#eab308]', dot: '#eab308' }, // Yellow
  'Waiting List cancelled':  { icon: 'playlist_remove',   bg: 'bg-[#64748b]/10', border: 'border-[#64748b]/40', text: 'text-[#64748b]', dot: '#64748b' }, // Slate Grey

  // Additional statuses
  'Leave':                   { icon: 'beach_access',      bg: 'bg-[#f472b6]/10', border: 'border-[#f472b6]/40', text: 'text-[#f472b6]', dot: '#f472b6' }, // Pink
  'Maintenance':             { icon: 'build',             bg: 'bg-[#000000]/10', border: 'border-[#000000]/40', text: 'text-[#000000] dark:text-[#a1a1aa]', dot: '#000000' }, // Black
  'Staff Meeting':           { icon: 'groups',            bg: 'bg-[#14b8a6]/10', border: 'border-[#14b8a6]/40', text: 'text-[#14b8a6]', dot: '#14b8a6' }, // Teal
  'Trainer Not Available':   { icon: 'event_busy',        bg: 'bg-[#4338ca]/10', border: 'border-[#4338ca]/40', text: 'text-[#4338ca]', dot: '#4338ca' }, // Dark Indigo
  'Off':                     { icon: 'do_not_disturb_on', bg: 'bg-[#d1d5db]/10', border: 'border-[#d1d5db]/40', text: 'text-[#9ca3af] dark:text-[#d1d5db]', dot: '#d1d5db' }, // Light Grey
  'Holiday':                 { icon: 'celebration',       bg: 'bg-[#b45309]/10', border: 'border-[#b45309]/40', text: 'text-[#b45309]', dot: '#b45309' }, // Bronze
  'Trainer Break':           { icon: 'free_breakfast',    bg: 'bg-[#84cc16]/10', border: 'border-[#84cc16]/40', text: 'text-[#84cc16]', dot: '#84cc16' }, // Lime
  'Confirmed Checked In':    { icon: 'task_alt',          bg: 'bg-[#166534]/10', border: 'border-[#166534]/40', text: 'text-[#166534]', dot: '#166534' }, // Dark Green
  'Trainer Unavailable':     { icon: 'event_busy',        bg: 'bg-[#451a03]/10', border: 'border-[#451a03]/40', text: 'text-[#451a03]', dot: '#451a03' }, // Dark Brown
  'Fresh Booking Cancelled': { icon: 'event_busy',        bg: 'bg-[#fca5a5]/10', border: 'border-[#fca5a5]/40', text: 'text-[#fca5a5]', dot: '#fca5a5' }, // Salmon
  'Introductory Spot':       { icon: 'stars',             bg: 'bg-[#1e3a8a]/10', border: 'border-[#1e3a8a]/40', text: 'text-[#1e3a8a]', dot: '#1e3a8a' }  // Navy Blue
};

function getStatusStyle(status) {
  return STATUS_MAP[status] || STATUS_MAP['Scheduled'];
}

function renderStatusLegend() {
  const body = document.getElementById('infoPopupBody');
  if (!body) return;
  body.innerHTML = '';
  Object.keys(STATUS_MAP).forEach(statusName => {
    const s = STATUS_MAP[statusName];
    body.innerHTML += `<div class="info-status-item"><span class="material-symbols-outlined ${s.text} text-[16px]">${s.icon}</span><span class="info-status-dot" style="background:${s.dot}"></span><span>${statusName}</span></div>`;
  });
}

// ===== DAY VIEW =====
function renderDayView(container) {
  const dateStr = toLocalISODate(state.currentDate);
  const filtered = bookings.filter(b =>
    b.date === dateStr &&
    (state.location === 'all' || b.locationId === state.location) &&
    (state.trainer === 'all' || b.trainerId === state.trainer) &&
    (state.service === 'all' || b.serviceId === state.service) &&
    (state.client === 'all' || b.clientId === state.client)
  );

  const wrapper = document.createElement('div');
  wrapper.className = 'day-grid-wrapper w-full';

  for (let h = 8; h <= 18; h++) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h;
    const hourBookings = filtered.filter(b => b.hour === h);

    const slotEl = document.createElement('div');
    slotEl.className = 'day-row-wrapper flex flex-col border-b border-gold/10 py-3';
    slotEl.id = `day-row-container-${h}`;

    let topHtml = `<div class="top-section flex gap-4 md:gap-6 items-start w-full transition-all">`;
    topHtml += `<div class="w-14 md:w-16 text-right text-gold-dark dark:text-gold font-label-caps text-label-caps pt-2 shrink-0">${displayHour} ${ampm}</div>`;

    if (hourBookings.length === 0) {
      topHtml += `<div class="flex-1 border border-dashed border-gold/10 rounded-lg flex items-center justify-center text-charcoal-light/40 dark:text-gold/20 text-xs py-6 hover:border-gold/30 transition-colors cursor-pointer">Empty Slot</div>`;
      topHtml += `</div>`;
      slotEl.innerHTML = topHtml;
    } else {
      const MAX_VISIBLE = 5;
      topHtml += `<div class="flex-1 flex flex-col gap-2 relative">`;
      topHtml += `<div class="summary-tiles flex flex-wrap gap-2 transition-all" id="slot-tiles-${h}">`;
      hourBookings.forEach((b, index) => {
         let tileStr = tileHtml(b);
         if (index >= MAX_VISIBLE) {
            tileStr = tileStr.replace('booking-card ', 'booking-card day-extra-tile transition-all duration-500 ease-out max-h-0 !min-w-0 !max-w-0 opacity-0 overflow-hidden !p-0 !border-0 !m-0 ');
         }
         topHtml += tileStr;
      });
      topHtml += `</div></div></div>`; // Close flex-1 and top-section

      let rowHtml = topHtml;

      if (hourBookings.length > MAX_VISIBLE) {
        rowHtml += `<div class="flex gap-4 md:gap-6 w-full mt-1 mb-2 relative z-10">`;
        rowHtml += `<div class="w-14 md:w-16 shrink-0"></div>`; // Spacer for time label
        rowHtml += `<div class="flex-1 flex justify-center">`;
        rowHtml += `<button class="text-xs font-bold text-gold-dark dark:text-gold hover:opacity-80 transition-opacity flex justify-center items-center text-center gap-1 bg-gold/5 px-4 py-1.5 rounded-full" onclick="toggleViewMore(${h}, event, ${hourBookings.length - MAX_VISIBLE})">
            <span class="material-symbols-outlined text-sm mr-1">expand_more</span>Expand ${hourBookings.length - MAX_VISIBLE}
          </button>`;
        rowHtml += `</div></div>`;
      }
      slotEl.innerHTML = rowHtml;
    }
    wrapper.appendChild(slotEl);
  }
  container.appendChild(wrapper);
  attachCardListeners(container);
}

// ===== TILE (Status-colored, uniform small card) =====
function tileHtml(b, showDay = false) {
  const trainer = trainers.find(t => t.id === b.trainerId)?.name || '?';
  const client = clients.find(c => c.id === b.clientId)?.name || '?';
  const s = getStatusStyle(b.status);

  let subText = `${trainer} · ${b.status}`;
  if (showDay) {
    const [y, m, d] = b.date.split('-');
    const dateObj = new Date(y, m - 1, d);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    subText = `${dayName} · ${trainer} · ${b.status}`;
  }

  return `<div class="booking-card cursor-pointer ${s.bg} ${s.border} border rounded-lg px-3 py-2 min-w-[140px] max-w-[220px] hover:brightness-125 transition-all flex items-center gap-2" data-id="${b.id}">
    <span class="material-symbols-outlined ${s.text} text-[18px] shrink-0">${s.icon}</span>
    <div class="min-w-0 flex-1">
      <div class="text-xs font-bold text-pure-black dark:text-white truncate">${client}</div>
      <div class="text-[10px] text-charcoal-light dark:text-muted-grey truncate">${subText}</div>
    </div>
  </div>`;
}

window.toggleViewMore = function (hour, e, count) {
  const targetRowId = `day-row-container-${hour}`;
  const rowContainer = document.getElementById(targetRowId);
  if (!rowContainer) return;
  
  const isCurrentlyExpanded = rowContainer.classList.contains('day-row-expanded');
  const btn = e ? e.currentTarget : event.currentTarget;
  
  rowContainer.classList.toggle('day-row-expanded');
  
  const extraTiles = rowContainer.querySelectorAll('.day-extra-tile');
  extraTiles.forEach(t => {
     if (isCurrentlyExpanded) {
        t.classList.add('max-h-0', '!min-w-0', '!max-w-0', 'opacity-0', '!p-0', '!border-0', '!m-0');
        t.classList.remove('max-h-[200px]', 'opacity-100');
     } else {
        t.classList.remove('max-h-0', '!min-w-0', '!max-w-0', 'opacity-0', '!p-0', '!border-0', '!m-0');
        t.classList.add('max-h-[200px]', 'opacity-100');
     }
  });
  
  if (!isCurrentlyExpanded) {
    btn.innerHTML = `<span class="material-symbols-outlined text-sm mr-1">expand_less</span>Collapse`;
  } else {
    btn.innerHTML = `<span class="material-symbols-outlined text-sm mr-1">expand_more</span>Expand ${count}`;
  }
};

window.toggleWeekRowMoreHorizontal = function (hour, e, count) {
  const targetRowId = `week-row-container-${hour}`;
  const rowContainer = document.getElementById(targetRowId);
  if (!rowContainer) return;
  
  const isCurrentlyExpanded = rowContainer.classList.contains('week-row-expanded');
  const container = rowContainer.closest('.week-grid-wrapper');
  const btn = e ? e.currentTarget : event.currentTarget;
  
  if (container) {
    container.style.transition = 'opacity 0.2s ease-in-out';
    container.style.opacity = '0';
    
    setTimeout(() => {
      rowContainer.classList.toggle('week-row-expanded');
      rowContainer.classList.toggle('focus-active');

      // Toggle extra tiles
      const extraTiles = rowContainer.querySelectorAll('.week-extra-tile');
      extraTiles.forEach(t => {
         if (isCurrentlyExpanded) {
            t.classList.add('max-h-0', '!min-w-0', '!max-w-0', 'opacity-0', '!p-0', '!border-0', '!m-0');
            t.classList.remove('max-h-[200px]', 'opacity-100');
         } else {
            t.classList.remove('max-h-0', '!min-w-0', '!max-w-0', 'opacity-0', '!p-0', '!border-0', '!m-0');
            t.classList.add('max-h-[200px]', 'opacity-100');
         }
      });
      
      document.querySelectorAll('.week-row-wrapper').forEach(row => {
        if (row.id !== targetRowId) {
          row.style.display = isCurrentlyExpanded ? 'flex' : 'none';
        }
      });
      
      if (!isCurrentlyExpanded) {
        btn.innerHTML = `<span class="material-symbols-outlined text-sm mr-1">expand_less</span>Collapse`;
      } else {
        btn.innerHTML = `<span class="material-symbols-outlined text-sm mr-1">expand_more</span>Expand ${count}`;
      }
      
      container.style.opacity = '1';
    }, 200);
  }
};

window.toggleColumnMore = function(id, count, e) {
  e.stopPropagation();
  const tiles = document.getElementById(`tiles-${id}`);
  const btn = e.currentTarget;
  if (!tiles) return;
  tiles.classList.toggle('week-expanded');
  if (tiles.classList.contains('week-expanded')) {
    btn.innerHTML = `<span class="material-symbols-outlined text-[12px]">expand_less</span>`;
  } else {
    btn.innerHTML = `+${count} Expand <span class="material-symbols-outlined text-[12px]">expand_more</span>`;
  }
};

// ===== CARD (used in Week view compact) =====
function cardHtml(b, compact) {
  const trainer = trainers.find(t => t.id === b.trainerId)?.name || '?';
  const client = clients.find(c => c.id === b.clientId)?.name || '?';
  const s = getStatusStyle(b.status);
  return `<div class="booking-card cursor-pointer ${s.bg} ${s.border} border border-l-2 rounded p-1.5 hover:brightness-125 transition-all" data-id="${b.id}">
    <div class="flex items-center gap-1">
      <span class="material-symbols-outlined ${s.text} text-[14px]">${s.icon}</span>
      <span class="text-[10px] font-bold text-pure-black dark:text-white truncate">${client}</span>
    </div>
  </div>`;
}

function attachCardListeners(container) {
  container.querySelectorAll('.booking-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const booking = bookings.find(b => b.id === e.currentTarget.dataset.id);
      if (booking) openBookingModal(booking);
    });
  });
}

// ===== WEEK VIEW =====
// Week view shows ONLY the 1st tile per cell. Remaining are hidden behind a "+N" badge.
function renderWeekView(container) {
  const startOfWeek = getStartOfWeek(state.currentDate);

  // Wrap everything in a scrollable container for mobile
  const wrapper = document.createElement('div');
  wrapper.className = 'week-grid-wrapper';
  const inner = document.createElement('div');
  inner.className = 'week-grid-inner';

  // Header row
  const header = document.createElement('div');
  header.className = 'flex gap-1 border-b border-gold/20 pb-1.5 mb-1.5 sticky top-0 z-40 bg-muted-white dark:bg-pure-black pt-1 shadow-sm dark:shadow-none';
  let headerHtml = `<div class="w-14 md:w-16 shrink-0"></div>`;

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDates.push(toLocalISODate(d));

    const isToday = d.toDateString() === today.toDateString();
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    
    headerHtml += `
      <div class="week-header-cell flex-1 flex flex-col items-center justify-center ${isToday ? 'text-gold-dark dark:text-gold' : 'text-charcoal-light dark:text-muted-grey'} cursor-pointer hover:bg-gold/5 transition-colors rounded py-0.5" onclick="goToDate('${toLocalISODate(d)}')">
        <span class="text-[9px] md:text-[10px] uppercase font-bold tracking-widest opacity-70 pointer-events-none leading-none mb-1">${dayName}</span>
        <span class="text-[14px] md:text-base font-black ${isToday ? 'w-6 h-6 md:w-7 md:h-7 flex items-center justify-center bg-gold-dark/10 dark:bg-gold/10 rounded-full' : ''} transition-transform pointer-events-none leading-none">${dayNum}</span>
      </div>
    `;
  }
  header.innerHTML = headerHtml;
  inner.appendChild(header);

  // Time rows
  for (let h = 8; h <= 18; h++) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h;
    const row = document.createElement('div');
    row.className = 'week-row-wrapper flex flex-col border-b border-gold/5 py-1 relative';
    row.id = `week-row-container-${h}`;

    let topHtml = `<div class="top-section flex gap-1 w-full transition-all pt-1 pb-2">`;
    topHtml += `<div class="w-14 md:w-16 text-right text-gold-dark dark:text-gold font-label-caps text-label-caps pt-1 pr-2 shrink-0 text-[10px] md:text-label-caps">${displayHour} ${ampm}</div>`;

    let allHiddenBookings = [];

    weekDates.forEach(dateStr => {
      const hourBookings = bookings.filter(b =>
        b.date === dateStr && b.hour === h &&
        (state.location === 'all' || b.locationId === state.location) &&
        (state.trainer === 'all' || b.trainerId === state.trainer) &&
        (state.service === 'all' || b.serviceId === state.service) &&
        (state.client === 'all' || b.clientId === state.client)
      );

      // min-w-0 guarantees the column NEVER stretches wider than its flex fraction!
      topHtml += `<div class="flex-1 min-w-0 flex flex-col gap-1 items-center">`;

      if (hourBookings.length === 0) {
        // Empty cell – subtle dashed indicator
        topHtml += `<div class="w-full flex-1 border border-dashed border-gold/5 rounded min-h-[30px]"></div>`;
      } else {
        // Summary card
        topHtml += `<div class="week-cell-tiles summary-tiles flex flex-col h-full w-full gap-2 transition-all" id="tiles-${h}-${dateStr}">`;
        hourBookings.forEach((b, index) => {
           let tileStr = tileHtml(b, false);
           if (index > 0) {
             tileStr = tileStr.replace('booking-card ', 'booking-card week-extra-tile transition-all duration-500 ease-out max-h-0 !min-w-0 !max-w-0 opacity-0 overflow-hidden !p-0 !border-0 !m-0 ');
           }
           topHtml += tileStr;
        });
        topHtml += `</div>`;
      }
      topHtml += `</div>`;
    });

    topHtml += `</div>`; // Close flex row

    let rowHtml = topHtml;
    
    // We only create an expansion area if ANY column has > 1 booking
    let maxColBookings = 0;
    let totalExtraCount = 0;
    weekDates.forEach(dateStr => {
      const colBookings = bookings.filter(b => b.date === dateStr && b.hour === h &&
        (state.location === 'all' || b.locationId === state.location) &&
        (state.trainer === 'all' || b.trainerId === state.trainer) &&
        (state.service === 'all' || b.serviceId === state.service) &&
        (state.client === 'all' || b.clientId === state.client));
      if (colBookings.length > maxColBookings) maxColBookings = colBookings.length;
      if (colBookings.length > 1) totalExtraCount += (colBookings.length - 1);
    });

    if (maxColBookings > 1) {
      // The Expand Button
      rowHtml += `<div class="flex gap-1 w-full mt-1 mb-2 relative z-10">`;
      rowHtml += `<div class="w-14 md:w-16 shrink-0"></div>`; // Spacer for time label
      rowHtml += `<div class="flex-1 flex justify-center">`;
      rowHtml += `<button class="text-xs font-bold text-gold-dark dark:text-gold hover:opacity-80 transition-opacity flex justify-center items-center text-center gap-1 bg-gold/5 px-4 py-1.5 rounded-full" onclick="toggleWeekRowMoreHorizontal(${h}, event, ${totalExtraCount})">
          <span class="material-symbols-outlined text-sm mr-1">expand_more</span>Expand ${totalExtraCount}
        </button>`;
      rowHtml += `</div></div>`;
    }

    row.innerHTML = rowHtml;
    inner.appendChild(row);
  }

  wrapper.appendChild(inner);
  container.appendChild(wrapper);
  attachCardListeners(container);
}

// ===== MONTH VIEW =====
function renderMonthView(container) {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

  let html = `<div class="grid grid-cols-7 gap-1 md:gap-2 pb-2 mb-2 sticky top-0 z-40 bg-muted-white dark:bg-pure-black pt-2 md:pt-4 border-b border-gold/10">`;
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(d => {
    html += `<div class="text-center font-bold text-gold-dark dark:text-gold text-xs md:text-sm pb-2 border-b border-gold/20">${d}</div>`;
  });
  html += `</div><div class="grid grid-cols-7 gap-1 md:gap-2">`;

  for (let i = 0; i < startingDay; i++) {
    html += `<div class="min-h-[60px] md:min-h-[90px] bg-pure-black/5 dark:bg-pure-black/30 border border-gold/5 rounded-lg"></div>`;
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const d = new Date(year, month, day);
    const dateStr = toLocalISODate(d);
    const dayBookings = bookings.filter(b => 
      b.date === dateStr &&
      (state.location === 'all' || b.locationId === state.location) &&
      (state.trainer === 'all' || b.trainerId === state.trainer) &&
      (state.service === 'all' || b.serviceId === state.service) &&
      (state.client === 'all' || b.clientId === state.client)
    );
    const isToday = dateStr === toLocalISODate(today);

    const onClick = `onclick="handleMonthDayClick(${year}, ${month}, ${day})"`;
    html += `<div class="min-h-[60px] md:min-h-[90px] bg-white dark:bg-pure-black border ${isToday ? 'border-gold' : dayBookings.length > 0 ? 'border-gold/30' : 'border-gold/10'} rounded-lg p-1 md:p-2 hover:border-gold/50 transition-colors cursor-pointer" ${onClick}>
      <div class="text-right text-xs ${isToday ? 'text-gold-dark dark:text-gold font-bold' : 'text-charcoal-light dark:text-muted-grey'}">${day}</div>
      ${dayBookings.length > 0 ? `<div class="mt-1 text-center bg-gold/10 text-gold-dark dark:text-gold rounded text-[10px] md:text-xs py-0.5">${dayBookings.length} <span class="hidden sm:inline">Session${dayBookings.length > 1 ? 's' : ''}</span></div>` : ''}
    </div>`;
  }

  html += `</div>`;
  container.innerHTML = html;
}

window.handleMonthDayClick = function(year, month, day) {
  state.currentDate = new Date(year, month, day);
  state.view = 'day';
  renderGrid();
};

window.goToDate = function(dateStr) {
  // Parse local ISO string back to date carefully avoiding timezone offset issues
  const parts = dateStr.split('-');
  state.currentDate = new Date(parts[0], parts[1] - 1, parts[2]);
  state.view = 'day';
  renderGrid();
};




// ===== CONTROLS =====
function bindControls() {
  document.querySelectorAll('#viewToggles button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.view === 'day') {
        // Double as a "Today" button
        state.currentDate = new Date();
      }
      state.view = btn.dataset.view;
      renderGrid();
    });
  });

  document.getElementById('prevDateBtn').addEventListener('click', () => {
    if (state.view === 'day') state.currentDate.setDate(state.currentDate.getDate() - 1);
    else if (state.view === 'week') state.currentDate.setDate(state.currentDate.getDate() - 7);
    else state.currentDate.setMonth(state.currentDate.getMonth() - 1);
    renderGrid();
  });

  document.getElementById('nextDateBtn').addEventListener('click', () => {
    if (state.view === 'day') state.currentDate.setDate(state.currentDate.getDate() + 1);
    else if (state.view === 'week') state.currentDate.setDate(state.currentDate.getDate() + 7);
    else state.currentDate.setMonth(state.currentDate.getMonth() + 1);
    renderGrid();
  });



  // Custom Calendar Dropdown
  document.getElementById('calendarDateToggle').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCalendarDropdown();
  });
  initCalendarDropdown();
}

// ===== CUSTOM CALENDAR DROPDOWN =====
let calPopupDate = new Date();

function initCalendarDropdown() {
  document.getElementById('calPopupPrev').addEventListener('click', (e) => {
    e.stopPropagation();
    calPopupDate.setMonth(calPopupDate.getMonth() - 1);
    renderCalendarDays();
  });

  document.getElementById('calPopupNext').addEventListener('click', (e) => {
    e.stopPropagation();
    calPopupDate.setMonth(calPopupDate.getMonth() + 1);
    renderCalendarDays();
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const wrapper = document.getElementById('calendarDateWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
      document.getElementById('calendarDropdown').classList.add('hidden');
    }
  });
}

function toggleCalendarDropdown() {
  const dd = document.getElementById('calendarDropdown');
  const isHidden = dd.classList.contains('hidden');
  if (isHidden) {
    calPopupDate = new Date(state.currentDate);
    renderCalendarDays();
    dd.classList.remove('hidden');
  } else {
    dd.classList.add('hidden');
  }
}

function renderCalendarDays() {
  const year = calPopupDate.getFullYear();
  const month = calPopupDate.getMonth();
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  document.getElementById('calPopupTitle').innerText = `${monthNames[month]} ${year}`;

  const grid = document.getElementById('calPopupGrid');
  grid.innerHTML = '';

  const rawFirstDay = new Date(year, month, 1).getDay();
  const firstDay = rawFirstDay === 0 ? 6 : rawFirstDay - 1;
  const lastDate = new Date(year, month + 1, 0).getDate();
  const prevLastDate = new Date(year, month, 0).getDate();

  const todayStr = toLocalISODate(new Date());
  const selectedStr = toLocalISODate(state.currentDate);

  // Previous month filler
  for (let i = firstDay - 1; i >= 0; i--) {
    const el = document.createElement('div');
    el.className = 'text-center py-2 text-charcoal-light/30 dark:text-muted-grey/30 text-sm rounded';
    el.innerText = prevLastDate - i;
    grid.appendChild(el);
  }

  // Current month days
  for (let d = 1; d <= lastDate; d++) {
    const dateStr = toLocalISODate(new Date(year, month, d));
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedStr;

    const el = document.createElement('div');
    let cls = 'text-center py-2 text-sm rounded cursor-pointer transition-all hover:bg-gold/20 ';
    if (isSelected) {
      cls += 'bg-gold text-pure-black font-bold rounded-lg shadow-[0_0_12px_rgba(229,200,121,0.4)]';
    } else if (isToday) {
      cls += 'text-gold-dark dark:text-gold font-bold border border-gold/30';
    } else {
      cls += 'text-pure-black dark:text-muted-white hover:text-gold-dark dark:hover:text-gold';
    }
    el.className = cls;
    el.innerText = d;
    el.addEventListener('click', () => {
      state.currentDate = new Date(year, month, d);
      document.getElementById('calendarDropdown').classList.add('hidden');
      renderGrid();
    });
    grid.appendChild(el);
  }

  // Next month filler
  const totalCells = firstDay + lastDate;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    const el = document.createElement('div');
    el.className = 'text-center py-2 text-charcoal-light/30 dark:text-muted-grey/30 text-sm rounded';
    el.innerText = i;
    grid.appendChild(el);
  }
}

// ===== MODAL =====
const modal = document.getElementById('bookingModal');
let activeBookingId = null;

function openBookingModal(booking) {
  activeBookingId = booking.id;
  const trainer = trainers.find(t => t.id === booking.trainerId)?.name || 'Unknown';
  const service = services.find(s => s.id === booking.serviceId)?.name || 'Unknown';
  const client = clients.find(c => c.id === booking.clientId)?.name || 'Unknown';

  const initials = client.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const initialsEl = document.getElementById('mainModalInitials');
  if (initialsEl) initialsEl.innerText = initials;

  document.getElementById('modalClientNameHeader').innerText = client;
  const s = getStatusStyle(booking.status);
  
  const badge = document.getElementById('modalStatusBadge');
  badge.innerText = booking.status;
  badge.className = `text-[10px] font-bold tracking-widest uppercase ${s.text}`;
  
  const dot = badge.previousElementSibling;
  dot.className = `w-1.5 h-1.5 rounded-full animate-pulse`;
  dot.style.backgroundColor = s.dot;
  dot.style.boxShadow = `0 0 8px ${s.dot}`;
  
  // Format Date and Time
  const d = new Date(booking.date);
  document.getElementById('modalDetailDate').innerText = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  
  const ampm = booking.hour >= 12 ? 'PM' : 'AM';
  const hr = booking.hour > 12 ? booking.hour - 12 : booking.hour;
  const endHrStr = booking.hour + 1 > 12 ? (booking.hour + 1) - 12 : (booking.hour + 1);
  const endAmpm = booking.hour + 1 >= 12 ? 'PM' : 'AM';
  document.getElementById('modalDetailTime').innerText = `${String(hr).padStart(2, '0')}:00 ${ampm} - ${String(endHrStr).padStart(2, '0')}:00 ${endAmpm}`;

  document.getElementById('modalDetailService').innerText = service;
  document.getElementById('modalDetailTrainer').innerText = trainer;

  const notesEl = document.getElementById('modalDetailNotes');
  const notesIcon = document.getElementById('modalDetailNotesIcon');
  if (booking.notes) {
    notesEl.innerText = booking.notes;
    notesIcon.innerText = 'notes';
  } else {
    notesEl.innerText = 'No Notes found.';
    notesIcon.innerText = 'block';
  }

  // Populate Client Details Table
  const table = document.getElementById('clientDetailsTable');
  const details = [
    { label: 'CLIENT EMAIL', icon: 'mail', value: `${client.toLowerCase().replace(' ', '')}@gmail.com` },
    { label: 'CLIENT CRM ID', icon: 'tag', value: '5747222000236766005' },
    { label: 'CLIENT NAME', icon: 'person', value: client },
    { label: 'SUBSCRIPTION NAME', icon: 'card_membership', value: `${service} - Online Special` },
    { label: 'CRM ID', icon: 'id_card', value: booking.clientId.replace('client', 'C') + '9827' },
    { label: 'Mobile', icon: 'phone_iphone', value: '+966 50 123 4567' },
    { label: 'Email', icon: 'mail', value: client.toLowerCase().replace(' ', '.') + '@example.com' },
    { label: 'Gender', icon: 'wc', value: 'Male' },
    { label: 'Age', icon: 'cake', value: '34' }
  ];

  table.innerHTML = details.map(d => `
    <div class="flex items-center justify-between px-1 py-1.5 border-b border-charcoal-light/10 dark:border-white/5 last:border-0">
      <span class="text-[11px] text-charcoal-light/70 dark:text-white/50">${d.label}</span>
      <span class="text-[11px] text-pure-black dark:text-white font-medium text-right max-w-[180px] truncate">${d.value}</span>
    </div>
  `).join('');

  renderModalActions(booking);

  modal.classList.remove('hidden');
  const inner = document.getElementById('bookingModalInner');
  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0');
    if (inner) inner.classList.remove('scale-95', 'opacity-0');
  });
}

function renderModalActions(booking) {
  const container = document.getElementById('modalButtonsContainer');
  container.innerHTML = '';

  const actions = [];
  
  if (booking.status === 'Scheduled' || booking.status === 'Reschedule') {
    actions.push({ label: 'Confirm', icon: 'check', class: 'bg-green-500/10 text-green-500' });
    actions.push({ label: 'Reschedule', icon: 'schedule', class: 'bg-gold/10 text-gold' });
    actions.push({ label: 'Cancel', icon: 'close', class: 'bg-red-500/10 text-red-500' });
    actions.push({ label: 'Trainer', icon: 'swap_horiz', class: 'bg-pure-black/5 dark:bg-white/5 text-pure-black/70 dark:text-white/70' });
    actions.push({ label: 'Service', icon: 'fitness_center', class: 'bg-pure-black/5 dark:bg-white/5 text-pure-black/70 dark:text-white/70' });
    actions.push({ label: 'Delete', icon: 'delete', class: 'bg-red-500/10 text-red-500' });
  } else {
    actions.push({ label: 'Attended', icon: 'how_to_reg', class: 'bg-green-500/10 text-green-500' });
    actions.push({ label: 'Not Attended', icon: 'person_off', class: 'bg-orange-500/10 text-orange-500' });
    actions.push({ label: 'Intro Won', icon: 'emoji_events', class: 'bg-purple-500/10 text-purple-500' });
    actions.push({ label: 'Intro Lost', icon: 'thumb_down', class: 'bg-gray-500/10 text-gray-500' });
    actions.push({ label: 'Reschedule', icon: 'schedule', class: 'bg-gold/10 text-gold' });
    actions.push({ label: 'Cancel', icon: 'close', class: 'bg-red-500/10 text-red-500' });
  }

  actions.forEach(act => {
    const btn = document.createElement('button');
    btn.className = `flex flex-col items-center justify-center py-2.5 border-r border-b border-charcoal-light/10 dark:border-[#2a2a2a] hover:bg-pure-black/[0.02] dark:hover:bg-white/[0.02] transition-colors [&:nth-child(3n)]:border-r-0`;
    btn.innerHTML = `
      <div class="w-8 h-8 rounded-full flex items-center justify-center mb-1 ${act.class}">
         <span class="material-symbols-outlined text-[16px]">${act.icon}</span>
      </div>
      <span class="text-[10px] text-pure-black/80 dark:text-white/80 tracking-wide">${act.label}</span>
    `;
    btn.addEventListener('click', () => handleBookingAction(booking.id, act.label));
    container.appendChild(btn);
  });

  // Wiring the Full Details toggle
  const toggleBtn = document.getElementById('toggleDetailsBtn');
  const detailsSection = document.getElementById('fullDetailsSection');
  
  if(toggleBtn && detailsSection) {
    // remove previous listeners to avoid duplicates
    const newToggleBtn = toggleBtn.cloneNode(true);
    toggleBtn.parentNode.replaceChild(newToggleBtn, toggleBtn);
    
    // Default closed state (re-apply in case it was left open)
    detailsSection.classList.remove('max-h-[800px]', 'md:w-[340px]', 'opacity-100');
    detailsSection.classList.add('max-h-0', 'md:w-0', 'opacity-0');
    
    let isExpanded = false;
    newToggleBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      const icon = newToggleBtn.querySelector('#toggleDetailsIcon');
      const leftPanel = document.getElementById('modalLeftPanel');
      
      if(isExpanded) {
        detailsSection.classList.remove('max-h-0', 'md:w-0', 'opacity-0');
        detailsSection.classList.add('max-h-[800px]', 'md:w-[340px]', 'opacity-100');
        leftPanel.classList.remove('border-transparent');
        leftPanel.classList.add('border-charcoal-light/10', 'dark:border-[#2a2a2a]');
        if (icon) {
           icon.innerText = 'arrow_back';
           icon.classList.add('rotate-180', '-rotate-90', 'md:rotate-180');
        }
        newToggleBtn.childNodes[0].nodeValue = 'Hide Details ';
      } else {
        detailsSection.classList.add('max-h-0', 'md:w-0', 'opacity-0');
        detailsSection.classList.remove('max-h-[800px]', 'md:w-[340px]', 'opacity-100');
        leftPanel.classList.add('border-transparent');
        leftPanel.classList.remove('border-charcoal-light/10', 'dark:border-[#2a2a2a]');
        if (icon) {
           icon.innerText = 'arrow_forward';
           icon.classList.remove('rotate-180', '-rotate-90', 'md:rotate-180');
        }
        newToggleBtn.childNodes[0].nodeValue = 'Full Details ';
      }
    });
  }
}

function handleBookingAction(id, action) {
  const booking = bookings.find(b => b.id === id);
  if (!booking) return;

  if (action === 'Confirm') {
    openConfirmActionModal(booking);
    return;
  } else if (action === 'Delete') {
    const idx = bookings.findIndex(b => b.id === id);
    bookings.splice(idx, 1);
  } else if (action === 'Trainer' || action === 'Service' || action === 'Change Trainer' || action === 'Change Service') {
    // Just close for now or handle differently
  } else {
    let newStatus = action;
    if (action === 'Cancel') newStatus = 'Cancelled';
    if (action === 'Reschedule') newStatus = 'Rescheduled';
    if (action === 'Intro Won') newStatus = 'Attended';
    if (action === 'Intro Lost') newStatus = 'Not Attended';
    booking.status = newStatus;
  }

  closeModal();
  renderGrid();
}

document.getElementById('closeModalBtn').addEventListener('click', closeModal);
// cancelModalBtn was removed in the new html

function closeModal() {
  modal.classList.add('opacity-0');
  const inner = document.getElementById('bookingModalInner');
  if (inner) inner.classList.add('scale-95', 'opacity-0');
  setTimeout(() => modal.classList.add('hidden'), 400);
}

// ===== CONFIRM ACTION MODAL =====
const confirmActionModal = document.getElementById('confirmActionModal');
let bookingToConfirm = null;

function openConfirmActionModal(booking) {
  bookingToConfirm = booking;
  
  const trainer = trainers.find(t => t.id === booking.trainerId)?.name || 'Unknown';
  const service = services.find(s => s.id === booking.serviceId)?.name || 'Unknown';
  const client = clients.find(c => c.id === booking.clientId)?.name || 'Unknown';
  
  // Extract initials
  const initials = client.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  
  document.getElementById('confirmActionInitials').innerText = initials;
  document.getElementById('confirmActionTitle').innerText = client;
  document.getElementById('confirmActionService').innerText = service;
  
  const d = new Date(booking.date);
  const dateStr = d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  
  const ampm = booking.hour >= 12 ? 'PM' : 'AM';
  const hr = booking.hour > 12 ? booking.hour - 12 : booking.hour;
  const endHrStr = booking.hour + 1 > 12 ? (booking.hour + 1) - 12 : (booking.hour + 1);
  const endAmpm = booking.hour + 1 >= 12 ? 'PM' : 'AM';
  const timeStr = `${String(hr).padStart(2, '0')}:${booking.hour === hr ? '00' : '00'} ${ampm} - ${String(endHrStr).padStart(2, '0')}:00 ${endAmpm}`;
  
  document.getElementById('confirmActionDateTime').innerText = `${dateStr}, ${timeStr}`;
  document.getElementById('confirmActionTrainer').innerText = trainer;
  const s = getStatusStyle(booking.status);
  const statusEl = document.getElementById('confirmActionStatus');
  statusEl.innerHTML = `<span class="w-2 h-2 rounded-full animate-pulse" style="background-color: ${s.dot}; box-shadow: 0 0 8px ${s.dot};"></span> ${booking.status}`;
  statusEl.className = `text-[11px] font-bold tracking-wide flex items-center gap-1.5 ${s.text}`;
  
  document.getElementById('clientConfirmedToggle').checked = false;

  confirmActionModal.classList.remove('hidden');
  const inner = document.getElementById('confirmActionModalInner');
  requestAnimationFrame(() => {
    confirmActionModal.classList.remove('opacity-0');
    if(inner) inner.classList.remove('scale-95', 'opacity-0');
  });
}

document.getElementById('cancelConfirmActionBtn').addEventListener('click', closeConfirmActionModal);

function closeConfirmActionModal() {
  confirmActionModal.classList.add('opacity-0');
  const inner = document.getElementById('confirmActionModalInner');
  if(inner) inner.classList.add('scale-95', 'opacity-0');
  setTimeout(() => confirmActionModal.classList.add('hidden'), 300);
}

document.getElementById('submitConfirmActionBtn').addEventListener('click', () => {
  if (bookingToConfirm) {
    bookingToConfirm.status = 'Confirmed';
    renderGrid();
  }
  // 1. Trigger GPay Animation Overlay INSIDE the confirm modal
  const overlay = document.getElementById('gpaySuccessOverlay');
  const container = overlay.querySelector('.success-container');
  const glow = overlay.querySelector('.success-glow');
  const circle = overlay.querySelector('.success-circle');
  const check = overlay.querySelector('.success-check');
  const text = document.getElementById('successAnimationText');
  
  // Reset previous animations
  if (container) container.classList.remove('animate');
  if (glow) glow.classList.remove('animate');
  circle.classList.remove('animate');
  check.classList.remove('animate');
  text.classList.remove('gpay-text-animate');
  
  // Show overlay (use replace to ensure flex display works for centering)
  overlay.classList.replace('hidden', 'flex');
  requestAnimationFrame(() => {
    overlay.classList.remove('opacity-0');
    
    // Start drawing animations after a tiny delay
    setTimeout(() => {
      if (container) container.classList.add('animate');
      if (glow) glow.classList.add('animate');
      circle.classList.add('animate');
      check.classList.add('animate');
      text.classList.add('gpay-text-animate');
    }, 50);
  });
  
  // 3. Keep the checkmark on screen over the details for a satisfying 2 seconds, then clean up everything
  setTimeout(() => {
    // Fade out the entire modal to ensure the underlying form is never exposed again
    closeConfirmActionModal(); 
    closeModal(); 
    
    // Clean up overlay classes silently in the background
    setTimeout(() => {
      overlay.classList.add('opacity-0');
      overlay.classList.replace('flex', 'hidden');
    }, 500);
  }, 2000); 
});
