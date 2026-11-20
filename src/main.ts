import { HouseBuilder3D } from './house3d';
// @ts-ignore
import { GameHub } from './gameHub.js';

// Tab Navigation
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    const tabId = (btn as HTMLElement).dataset.tab;
    document.getElementById(`tab-${tabId}`)?.classList.add('active');
    window.dispatchEvent(new Event('resize'));
  });
});

// Initialize 3D House & Game Hub
new HouseBuilder3D('three-container');
const arcade = new GameHub('game-canvas');
arcade.start();

// Daily Routines
interface Routine { id: number; text: string; time: string; done: boolean; }
let routines: Routine[] = JSON.parse(localStorage.getItem('l1veabl3_routines') || '[]');

function renderRoutines() {
  const list = document.getElementById('routine-list')!;
  list.innerHTML = '';
  routines.forEach((r) => {
    const li = document.createElement('li');
    li.className = `card-item ${r.done ? 'done' : ''}`;
    li.innerHTML = `
      <span><strong>[${r.time}]</strong> ${r.text}</span>
      <div>
        <button data-toggle="${r.id}">${r.done ? 'Undo' : 'Complete'}</button>
        <button class="danger" data-del="${r.id}">✕</button>
      </div>
    `;
    list.appendChild(li);
  });

  const doneCount = routines.filter((r) => r.done).length;
  const pct = routines.length ? Math.round((doneCount / routines.length) * 100) : 0;
  document.getElementById('routine-progress-text')!.textContent = `${pct}% Done`;
  document.getElementById('routine-progress-fill')!.style.width = `${pct}%`;
  localStorage.setItem('l1veabl3_routines', JSON.stringify(routines));
}

document.getElementById('add-routine-btn')?.addEventListener('click', () => {
  const input = document.getElementById('routine-input') as HTMLInputElement;
  const time = (document.getElementById('routine-time') as HTMLSelectElement).value;
  if (!input.value.trim()) return;
  routines.push({ id: Date.now(), text: input.value.trim(), time, done: false });
  input.value = '';
  renderRoutines();
});

document.getElementById('routine-list')?.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.dataset.toggle) {
    const id = Number(target.dataset.toggle);
    routines = routines.map((r) => (r.id === id ? { ...r, done: !r.done } : r));
    renderRoutines();
  }
  if (target.dataset.del) {
    const id = Number(target.dataset.del);
    routines = routines.filter((r) => r.id !== id);
    renderRoutines();
  }
});

renderRoutines();

// Smart Interactive Calendar
interface CalEvent { title: string; priority: string; }
let eventsMap: Record<string, CalEvent[]> = JSON.parse(localStorage.getItem('l1veabl3_calendar') || '{}');
let selectedDay = '2026-11-20';

function renderCalendar() {
  const grid = document.getElementById('calendar-grid')!;
  grid.innerHTML = '';
  for (let day = 1; day <= 30; day++) {
    const dateKey = `2026-11-${String(day).padStart(2, '0')}`;
    const cell = document.createElement('div');
    cell.className = `cal-day ${dateKey === selectedDay ? 'selected' : ''}`;
    const dayEvents = eventsMap[dateKey] || [];
    cell.innerHTML = `
      <strong>Nov ${day}</strong>
      <div>${dayEvents.map((ev) => `<div class="event-dot">${ev.title}</div>`).join('')}</div>
    `;
    cell.addEventListener('click', () => {
      selectedDay = dateKey;
      renderCalendar();
      renderDayDrawer();
    });
    grid.appendChild(cell);
  }
}

function renderDayDrawer() {
  document.getElementById('selected-date-label')!.textContent = `Schedule for ${selectedDay}`;
  const list = document.getElementById('day-events-list')!;
  const items = eventsMap[selectedDay] || [];
  list.innerHTML = items.map((ev) => `<li class="card-item"><span>${ev.title} (${ev.priority})</span></li>`).join('');
}

document.getElementById('save-event-btn')?.addEventListener('click', () => {
  const titleEl = document.getElementById('event-title') as HTMLInputElement;
  const prioEl = document.getElementById('event-priority') as HTMLSelectElement;
  if (!titleEl.value.trim()) return;
  if (!eventsMap[selectedDay]) eventsMap[selectedDay] = [];
  eventsMap[selectedDay].push({ title: titleEl.value.trim(), priority: prioEl.value });
  titleEl.value = '';
  localStorage.setItem('l1veabl3_calendar', JSON.stringify(eventsMap));
  renderCalendar();
  renderDayDrawer();
});

document.getElementById('smart-auto-schedule')?.addEventListener('click', () => {
  for (let day = 1; day <= 30; day++) {
    const dateKey = `2026-11-${String(day).padStart(2, '0')}`;
    if (!eventsMap[dateKey] || eventsMap[dateKey].length === 0) {
      eventsMap[dateKey] = [{ title: '⚡ Smart Deep-Work Block', priority: 'high' }];
      selectedDay = dateKey;
      localStorage.setItem('l1veabl3_calendar', JSON.stringify(eventsMap));
      renderCalendar();
      renderDayDrawer();
      break;
    }
  }
});

renderCalendar();
renderDayDrawer();
