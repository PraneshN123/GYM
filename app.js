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
for (let i = -3; i <= 3; i++) {
  const d = new Date(today);
  d.setDate(today.getDate() + i);
  const dateStr = toLocalISODate(d);

  bookings.push({
    id: `b_${i}_1`, date: dateStr, hour: 8, durationMinutes: 60,
    trainerId: 'alex', locationId: 'downtown', serviceId: 'pt', clientId: 'c1',
    status: 'Scheduled', notes: 'Focus on lower body.'
  });

  bookings.push({
    id: `b_${i}_2`, date: dateStr, hour: 10, durationMinutes: 60,
    trainerId: 'jordan', locationId: 'westside', serviceId: 'group', clientId: 'c2',
    status: 'Confirmed', notes: 'Max capacity 15.'
  });

  if (i === 0) {
    bookings.push({
      id: `b_today_3`, date: dateStr, hour: 14, durationMinutes: 30,
      trainerId: 'sarah', locationId: 'downtown', serviceId: 'intro', clientId: 'c3',
      status: 'Attended', notes: 'First time client.'
    });
    // Extra booking at 8AM today to test View More
    bookings.push({
      id: `b_today_4`, date: dateStr, hour: 8, durationMinutes: 60,
      trainerId: 'sarah', locationId: 'downtown', serviceId: 'group', clientId: 'c3',
      status: 'Scheduled', notes: 'Morning group stretch.'
    });
    bookings.push({
      id: `b_today_5`, date: dateStr, hour: 8, durationMinutes: 60,
      trainerId: 'jordan', locationId: 'westside', serviceId: 'intro', clientId: 'c2',
      status: 'Confirmed', notes: 'Orientation session.'
    });
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
  updateControlsUI();
  const grid = document.getElementById('scheduleGrid');
  grid.innerHTML = '';
  if (state.view === 'day') renderDayView(grid);
  else if (state.view === 'week') renderWeekView(grid);
  else if (state.view === 'month') renderMonthView(grid);
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
  'Scheduled':    { icon: 'event',         bg: 'bg-gold/10',     border: 'border-gold/40',     text: 'text-gold-dark dark:text-gold' },
  'Confirmed':    { icon: 'check_circle',  bg: 'bg-green-500/10', border: 'border-green-500/40', text: 'text-green-600 dark:text-green-400' },
  'Attended':     { icon: 'how_to_reg',    bg: 'bg-blue-500/10',  border: 'border-blue-500/40',  text: 'text-blue-600 dark:text-blue-400' },
  'Not Attended': { icon: 'person_off',    bg: 'bg-orange-500/10',border: 'border-orange-500/40',text: 'text-orange-600 dark:text-orange-400' },
  'Reschedule':   { icon: 'event_repeat',  bg: 'bg-gold/10',     border: 'border-gold/40',     text: 'text-gold-dark dark:text-gold' },
  'Cancel':       { icon: 'cancel',        bg: 'bg-red-500/10',   border: 'border-red-500/40',   text: 'text-red-600 dark:text-red-400' },
  'Intro Won':    { icon: 'emoji_events',  bg: 'bg-purple-500/10',border: 'border-purple-500/40',text: 'text-purple-600 dark:text-purple-400' },
  'Intro Lost':   { icon: 'mood_bad',      bg: 'bg-gray-500/10',  border: 'border-gray-500/40',  text: 'text-gray-500 dark:text-gray-400' }
};

function getStatusStyle(status) {
  return STATUS_MAP[status] || STATUS_MAP['Scheduled'];
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

  for (let h = 8; h <= 18; h++) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h;
    const hourBookings = filtered.filter(b => b.hour === h);

    const slotEl = document.createElement('div');
    slotEl.className = 'flex gap-4 md:gap-6 border-b border-gold/10 py-3 items-start';

    let html = `<div class="w-14 md:w-16 text-right text-gold-dark dark:text-gold font-label-caps text-label-caps pt-2 shrink-0">${displayHour} ${ampm}</div>`;

    if (hourBookings.length === 0) {
      html += `<div class="flex-1 border border-dashed border-gold/10 rounded-lg flex items-center justify-center text-charcoal-light/40 dark:text-gold/20 text-xs py-6 hover:border-gold/30 transition-colors cursor-pointer">Empty Slot</div>`;
    } else {
      // ALL bookings render as uniform small tiles in a single inline row
      const MAX_VISIBLE = 5;
      html += `<div class="flex-1 flex flex-col gap-2">`;
      html += `<div class="flex flex-wrap gap-2" id="slot-tiles-${h}">`;
      hourBookings.slice(0, MAX_VISIBLE).forEach(b => { html += tileHtml(b); });
      html += `</div>`;

      if (hourBookings.length > MAX_VISIBLE) {
        html += `<div class="expandable-wrapper" id="slot-expanded-${h}">`;
        html += `<div class="expandable-inner flex flex-wrap gap-2 pt-2">`;
        hourBookings.slice(MAX_VISIBLE).forEach(b => { html += tileHtml(b); });
        html += `</div></div>`;
        html += `<button class="text-xs font-bold text-gold-dark dark:text-gold hover:opacity-80 transition-opacity flex items-center gap-1 mt-2" onclick="toggleViewMore(${h}, event)"><span class="material-symbols-outlined text-sm">expand_more</span> View ${hourBookings.length - MAX_VISIBLE} More</button>`;
      }
      html += `</div>`;
    }

    slotEl.innerHTML = html;
    container.appendChild(slotEl);
  }
  attachCardListeners(container);
}

// ===== TILE (Status-colored, uniform small card) =====
function tileHtml(b) {
  const trainer = trainers.find(t => t.id === b.trainerId)?.name || '?';
  const client = clients.find(c => c.id === b.clientId)?.name || '?';
  const s = getStatusStyle(b.status);

  return `<div class="booking-card cursor-pointer ${s.bg} ${s.border} border rounded-lg px-3 py-2 min-w-[140px] max-w-[220px] hover:brightness-125 transition-all flex items-center gap-2" data-id="${b.id}">
    <span class="material-symbols-outlined ${s.text} text-[18px] shrink-0">${s.icon}</span>
    <div class="min-w-0 flex-1">
      <div class="text-xs font-bold text-pure-black dark:text-white truncate">${client}</div>
      <div class="text-[10px] text-charcoal-light dark:text-muted-grey truncate">${trainer} · ${b.status}</div>
    </div>
  </div>`;
}

window.toggleViewMore = function (hour, e) {
  const expanded = document.getElementById(`slot-expanded-${hour}`);
  if (!expanded) return;
  expanded.classList.toggle('expanded');
  const btn = e ? e.currentTarget : event.currentTarget;
  const innerCount = expanded.querySelector('.expandable-inner').children.length;
  if (!expanded.classList.contains('expanded')) {
    btn.innerHTML = `<span class="material-symbols-outlined text-sm">expand_more</span> View ${innerCount} More`;
  } else {
    btn.innerHTML = `<span class="material-symbols-outlined text-sm">expand_less</span> View Less`;
  }
};

window.toggleWeekViewMore = function (dateStr, hour, e) {
  const tilesContainer = document.getElementById(`week-slot-tiles-${dateStr}-${hour}`);
  if (!tilesContainer) return;
  const isExpanded = tilesContainer.classList.contains('week-expanded');
  tilesContainer.classList.toggle('week-expanded');
  const btn = e ? e.currentTarget : event.currentTarget;
  const hiddenCount = tilesContainer.querySelectorAll('.week-hidden-cards .booking-card').length;
  if (isExpanded) {
    btn.innerHTML = `<span class="material-symbols-outlined text-[12px]">expand_more</span> +${hiddenCount}`;
  } else {
    btn.innerHTML = `<span class="material-symbols-outlined text-[12px]">expand_less</span> Less`;
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
  header.className = 'flex gap-1 border-b border-gold/20 pb-3 mb-3';
  let headerHtml = `<div class="w-14 md:w-16 shrink-0"></div>`;

  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    weekDates.push(toLocalISODate(d));
    const isToday = toLocalISODate(d) === toLocalISODate(today);
    headerHtml += `<div class="week-header-cell flex-1 text-center font-bold text-xs md:text-sm ${isToday ? 'text-gold-dark dark:text-gold' : 'text-charcoal-light dark:text-muted-grey'}">${d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</div>`;
  }
  header.innerHTML = headerHtml;
  inner.appendChild(header);

  // Time rows
  for (let h = 8; h <= 18; h++) {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : h;
    const row = document.createElement('div');
    row.className = 'week-row flex gap-1 min-h-[60px] md:min-h-[80px] border-b border-gold/5 py-1';

    let rowHtml = `<div class="w-14 md:w-16 text-right text-gold-dark dark:text-gold font-label-caps text-label-caps pt-1 pr-2 shrink-0 text-[10px] md:text-label-caps">${displayHour} ${ampm}</div>`;

    weekDates.forEach(dateStr => {
      const hourBookings = bookings.filter(b =>
        b.date === dateStr && b.hour === h &&
        (state.location === 'all' || b.locationId === state.location) &&
        (state.trainer === 'all' || b.trainerId === state.trainer) &&
        (state.service === 'all' || b.serviceId === state.service) &&
        (state.client === 'all' || b.clientId === state.client)
      );

      rowHtml += `<div class="flex-1 flex flex-col gap-1">`;

      if (hourBookings.length === 0) {
        // Empty cell – subtle dashed indicator
        rowHtml += `<div class="flex-1 border border-dashed border-gold/5 rounded min-h-[30px]"></div>`;
      } else {
        // First card always visible, rest inside animatable hidden wrapper
        rowHtml += `<div class="week-cell-tiles flex flex-col gap-1" id="week-slot-tiles-${dateStr}-${h}">`;
        rowHtml += cardHtml(hourBookings[0], true);
        
        // If more than 1 booking, show a "+N" badge to expand
        if (hourBookings.length > 1) {
          const extraCount = hourBookings.length - 1;
          rowHtml += `<button class="week-more-badge mt-0 w-full" onclick="toggleWeekViewMore('${dateStr}', ${h}, event)"><span class="material-symbols-outlined text-[12px]">expand_more</span> +${extraCount}</button>`;
        }

        if (hourBookings.length > 1) {
          rowHtml += `<div class="week-hidden-cards"><div class="week-hidden-inner"><div class="flex flex-col gap-1 p-1.5 max-h-[250px] overflow-y-auto custom-scrollbar">`;
          hourBookings.slice(1).forEach(b => { rowHtml += cardHtml(b, true); });
          rowHtml += `</div></div></div>`;
        }
        rowHtml += `</div>`;
      }
      rowHtml += `</div>`;
    });

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

  let html = `<div class="grid grid-cols-7 gap-1 md:gap-2">`;
  ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].forEach(d => {
    html += `<div class="text-center font-bold text-gold-dark dark:text-gold text-xs md:text-sm pb-2 border-b border-gold/20">${d}</div>`;
  });

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




// ===== CONTROLS =====
function bindControls() {
  document.querySelectorAll('#viewToggles button').forEach(btn => {
    btn.addEventListener('click', () => {
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
  const loc = locations.find(l => l.id === booking.locationId)?.name || 'Unknown';

  document.getElementById('modalTitle').innerText = `${client} — ${booking.status}`;
  document.getElementById('modalTime').innerText = `${booking.date} | ${booking.hour}:00`;
  document.getElementById('modalTrainer').innerText = trainer;
  document.getElementById('modalService').innerText = service;
  document.getElementById('modalLocation').innerText = loc;

  renderModalActions(booking);

  modal.classList.remove('hidden');
  requestAnimationFrame(() => {
    modal.classList.remove('opacity-0');
    modal.querySelector('div').classList.remove('scale-95');
  });
}

function renderModalActions(booking) {
  const grid = document.getElementById('modalActionsGrid');
  grid.innerHTML = '';

  const actions = [
    { label: 'Confirm', icon: 'check_circle', color: 'text-green-600 dark:text-green-400 border-green-500/30 hover:bg-green-500/10' },
    { label: 'Attended', icon: 'how_to_reg', color: 'text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/10' },
    { label: 'Not Attended', icon: 'person_off', color: 'text-orange-600 dark:text-orange-400 border-orange-500/30 hover:bg-orange-500/10' },
    { label: 'Reschedule', icon: 'event_repeat', color: 'text-gold-dark dark:text-gold border-gold/30 hover:bg-gold/10' },
    { label: 'Cancel', icon: 'cancel', color: 'text-red-600 dark:text-red-400 border-red-500/30 hover:bg-red-500/10' },
    { label: 'Intro Won', icon: 'emoji_events', color: 'text-purple-600 dark:text-purple-400 border-purple-500/30 hover:bg-purple-500/10' },
    { label: 'Intro Lost', icon: 'mood_bad', color: 'text-gray-500 dark:text-gray-400 border-gray-500/30 hover:bg-gray-500/10' },
    { label: 'Delete', icon: 'delete', color: 'text-red-600 border-red-600/30 hover:bg-red-600/10' }
  ];

  actions.forEach(act => {
    const btn = document.createElement('button');
    btn.className = `flex flex-col items-center justify-center gap-1 p-2 border rounded transition-colors ${act.color}`;
    btn.innerHTML = `<span class="material-symbols-outlined text-[20px]">${act.icon}</span><span class="text-[10px] font-bold uppercase tracking-wider">${act.label}</span>`;
    btn.addEventListener('click', () => handleBookingAction(booking.id, act.label));
    grid.appendChild(btn);
  });
}

function handleBookingAction(id, action) {
  const booking = bookings.find(b => b.id === id);
  if (!booking) return;

  if (action === 'Delete') {
    const idx = bookings.findIndex(b => b.id === id);
    bookings.splice(idx, 1);
  } else {
    booking.status = action === 'Confirm' ? 'Confirmed' : action;
  }

  closeModal();
  renderGrid();
}

document.getElementById('closeModalBtn').addEventListener('click', closeModal);
document.getElementById('cancelModalBtn').addEventListener('click', closeModal);

function closeModal() {
  modal.classList.add('opacity-0');
  modal.querySelector('div').classList.add('scale-95');
  setTimeout(() => modal.classList.add('hidden'), 300);
}
