// ==========================
// كامل: script.js — تحميل أسماء الفرق من CSV وجلب الصور من teams_images
// ==========================
document.addEventListener('DOMContentLoaded', () => {

  const displayEl = document.getElementById('todayDateDisplay');
  const manualDateEl = document.getElementById('manualDate');
  const editBtn = document.getElementById('editDateBtn');
  const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

  function updateDateDisplay(date){
    displayEl.textContent = `${days[date.getDay()]} ${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
  }
  let currentDate = new Date();
  updateDateDisplay(currentDate);

  editBtn.addEventListener('click', () => {
    manualDateEl.style.display = 'inline-block';
    manualDateEl.valueAsDate = currentDate;
  });

  manualDateEl.addEventListener('change', () => {
    const selected = new Date(manualDateEl.value);
    if (!isNaN(selected)) {
      currentDate = selected;
      updateDateDisplay(currentDate);
    }
  });

  const leaguesCSV = 'csv/leagues.csv';
  const commentatorsCSV = 'csv/commentators.csv';
  const channelsCSV = 'csv/channels.csv';
  const teamsCSVFolder = 'csv/teams/';

  let leagues = [], teams = {}, commentators = [], channels = [], showBtns = true;
  let matches = [], editIndex = null, isNextDay = false;

  populateLeagues();
  fetchCommentators();
  fetchChannels();

  setTimeout(() => {
    if (window.$ && $.fn && $.fn.select2) {
      $('#leagueSelect, #homeTeam, #awayTeam, #commentator, #channel').select2({
        width: '100%',
        dir: 'rtl',
        language: { noResults: () => "لا توجد نتائج مطابقة" }
      });
    }
  }, 800);

  function fetchCSV(url, callback){
    Papa.parse(url, { download: true, header: true, complete: r => callback(r.data) });
  }

  function populateLeagues(){
    fetchCSV(leaguesCSV, data => {
      leagues = data;
      const leagueSelect = document.getElementById('leagueSelect');
      leagueSelect.innerHTML = leagues.map(l => `<option value='${l.code}'>${l.name}</option>`).join('');
      // load teams for first league if exists
      if (leagueSelect.value) loadTeams(leagueSelect.value);
    });
  }

  // ------------------------------
  // تحميل الفرق: نولّد مسار الصورة باستخدام window.location.origin
  // ------------------------------
  function loadTeams(leagueCode, cb){
    fetchCSV(`${teamsCSVFolder}${leagueCode}_teams.csv`, data => {
      teams[leagueCode] = data;

      const home = document.getElementById('homeTeam');
      const away = document.getElementById('awayTeam');

      // نستخدم window.location.origin كـ base لكي يصبح المسار مطلقاً على نفس الدومين
      const origin = window.location.origin.replace(/\/$/, '');

      home.innerHTML = away.innerHTML = data.map(t => {
        // اسم الصورة يجب أن يطابق اسم الفريق تماماً كما في CSV مع الامتداد .png
        const imgPath = `${origin}/teams_images/${t.name}.png`;
        return `<option value="${t.name}" data-img="${imgPath}">${t.name}</option>`;
      }).join('');

      updatePreview(home, 'homePreview');
      updatePreview(away, 'awayPreview');

      setTimeout(() => {
        if (window.$ && $.fn && $.fn.select2) {
          $('#homeTeam, #awayTeam').off('change').select2({ width: '100%', dir: 'rtl' });
          $('#homeTeam, #awayTeam').on('change', function(){
            updatePreview(this, this.id === 'homeTeam' ? 'homePreview' : 'awayPreview');
          });
        } else {
          // native change handlers fallback
          home.addEventListener('change', () => updatePreview(home, 'homePreview'));
          away.addEventListener('change', () => updatePreview(away, 'awayPreview'));
        }
        if (typeof cb === 'function') cb();
      }, 120);
    });
  }

  function fetchCommentators(){
    fetchCSV(commentatorsCSV, data => {
      document.getElementById('commentator').innerHTML = data.map(c => `<option>${c.name}</option>`).join('');
    });
  }

  function fetchChannels(){
    fetchCSV(channelsCSV, data => {
      channels = data;
      document.getElementById('channel').innerHTML = data.map(c => `<option value="${c.name}" data-logo="${c.logo}">${c.name}</option>`).join('');
    });
  }

  // دالة مساعدة (تبقى متاحة لكن لن نستخدمها لحفظ الصور الآن)
  function toBase64(url, callback){
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      canvas.getContext('2d').drawImage(img,0,0);
      callback(canvas.toDataURL());
    };
    img.onerror = () => callback('');
    img.src = url;
  }

  // عرض معاينة الشعار باستخدام رابط مباشر
  function updatePreview(selectEl, previewId){
    const s = selectEl.selectedOptions ? selectEl.selectedOptions[0] : selectEl;
    const img = s?.dataset?.img || '';
    const prev = document.getElementById(previewId);
    if (!img) { prev.innerHTML = '⚽'; return; }

    const logo = new Image();
    logo.onload = () => {
      prev.innerHTML = `<img src="${img}" style="max-height:50px;">`;
    };
    logo.onerror = () => {
      prev.innerHTML = '⚽';
    };
    // تعيين src أخيراً (المتصفح سيعالج الترميز إن لزم)
    logo.src = img;
  }

  // لو تغير الدوري من الـ select
  document.getElementById('leagueSelect').addEventListener('change', e => loadTeams(e.target.value));

  // تحميل مباريات مخزنة
  if (localStorage.getItem('matches')) {
    try {
      matches = JSON.parse(localStorage.getItem('matches')) || [];
    } catch(e){ matches = []; }
    render();
  }

  document.getElementById('nextDayBtn').onclick = () => {
    isNextDay = !isNextDay;
    document.getElementById('nextDayState').textContent = isNextDay ? '✅' : '❌';
  };

  // ------------------------------
  // إضافة مباراة: نخزن روابط الصور (URL) مباشرة، لا تحويل Base64
  // ------------------------------
  document.getElementById('addMatch').onclick = () => {
    const league = document.getElementById('leagueSelect').value;
    const home = document.getElementById('homeTeam').value;
    const away = document.getElementById('awayTeam').value;
    const time = document.getElementById('matchTime').value;
    const comm = document.getElementById('commentator').value;
    const chan = document.getElementById('channel').value;

    if (!time) { alert('ادخل وقت المباراة'); return; }

    const homeImg = document.getElementById('homeTeam').selectedOptions[0].dataset.img || '';
    const awayImg = document.getElementById('awayTeam').selectedOptions[0].dataset.img || '';
    const chanLogoUrl = channels.find(c => c.name === chan)?.logo || '';

    // نخزن الروابط مباشرة
    const newMatch = { league, home, away, time, comm, chan, homeImg, awayImg, chanLogo: chanLogoUrl, nextDay: isNextDay };

    if (editIndex !== null) {
      matches.splice(editIndex, 0, newMatch);
      editIndex = null;
    } else {
      matches.push(newMatch);
    }

    localStorage.setItem('matches', JSON.stringify(matches));
    render();
    document.getElementById('matchTime').value = '';
    isNextDay = false;
    document.getElementById('nextDayState').textContent = '❌';
  };

  function render(){
    const matchesContainer = document.getElementById('matchesContainer');
    matchesContainer.innerHTML = '';

    leagues.forEach(l => {
      const leagueMatches = matches.filter(m => m.league === l.code);
      if (leagueMatches.length > 0) {
        const section = document.createElement('div'); section.className = 'matches-section';
        const header = document.createElement('div'); header.className = 'section-header';
        const extraLogo = l.extraLogo || l.extra || '';
        header.innerHTML = `<img src="${extraLogo}" class="extra-logo-header"> <img src="${l.logo}" style="width:24px;height:24px"> ${l.name}`;
        section.appendChild(header);

        leagueMatches.forEach(m => {
          const card = document.createElement('div'); card.className = 'match-card';
          card.style.background = l.color || '#fdfdfd';

          const [hours, minutes] = m.time.split(':');
          let displayHours = parseInt(hours, 10);
          const ampm = displayHours >= 12 ? 'م' : 'ص';
          displayHours = displayHours % 12 || 12;

          let bottomHTML = '';
          if (m.comm || m.chanLogo) {
            bottomHTML = `
              <div class="meta" style="min-height:24px;display:flex;align-items:center;justify-content:center;position:relative;">
                ${m.chanLogo ? `<img src="${m.chanLogo}" style="position:absolute;left:6px;height:30px;object-fit:contain;" alt="${m.chan}">` : ''}
                ${m.comm ? `<div style="flex:1;text-align:center;font-weight:500;color:#efeded;">🎙️ ${m.comm}</div>` : ''}
              </div>`;
          }

          card.innerHTML = `
            <div class="match_row">
              <div class="team hometeam">
                <span class="the_team">${m.home}</span>
                <img src="${m.homeImg}" class="team_logo" alt="${m.home}">
              </div>
              <div class="middle_column">
                <div class="the_time">
                  <span>${displayHours}:${minutes}</span>
                  <span>${ampm}</span>
                </div>
                ${m.nextDay ? "<div class='next-day-label'>(اليوم التالي)</div>" : ""}
              </div>
              <div class="team awayteam">
                <img src="${m.awayImg}" class="team_logo" alt="${m.away}">
                <span class="the_team">${m.away}</span>
              </div>
            </div>
            ${bottomHTML}
            <div class="action-btns" style="display:${showBtns ? 'flex' : 'none'}">
              <button onclick="editMatch(${matches.indexOf(m)})">✏️ تعديل</button>
              <button onclick="deleteMatch(${matches.indexOf(m)})">🗑️ حذف</button>
            </div>`;

          section.appendChild(card);
        });

        matchesContainer.appendChild(section);
      }
    });
  }

  window.editMatch = (index) => {
    if (editIndex !== null) { alert('يوجد تعديل مفتوح حالياً'); return; }
    const m = matches[index];

    $('#leagueSelect').val(m.league).trigger('change.select2');
    loadTeams(m.league, () => {
      $('#homeTeam').val(m.home).trigger('change.select2');
      $('#awayTeam').val(m.away).trigger('change.select2');
      $('#commentator').val(m.comm).trigger('change.select2');
      $('#channel').val(m.chan).trigger('change.select2');
      document.getElementById('matchTime').value = m.time;

      editIndex = index;
      matches.splice(index, 1);
      localStorage.setItem('matches', JSON.stringify(matches));
      render();
    });
  };

  window.deleteMatch = (index) => {
    if (confirm('هل تريد حذف هذه المباراة؟')) {
      matches.splice(index, 1);
      localStorage.setItem('matches', JSON.stringify(matches));
      render();
    }
  };

  document.getElementById('toggleBtns').addEventListener('click', () => { showBtns = !showBtns; render(); });
  document.getElementById('deleteAll').addEventListener('click', () => {
    if (confirm('حذف جميع المباريات؟')) { matches = []; localStorage.setItem('matches', '[]'); render(); }
  });

  document.getElementById('downloadTable').addEventListener('click', () => {
    html2canvas(document.querySelector('.matches-wrapper'), { useCORS: true, allowTaint: true }).then(canvas => {
      const link = document.getElementById('downloadLink');
      link.href = canvas.toDataURL('image/png');
      link.download = `matches_${currentDate.getTime()}.png`;
      link.click();
    });
  });

}); // end DOMContentLoaded

// تسجيل Service Worker (يبقى كما هو)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(err => console.warn('SW reg failed', err));
}
