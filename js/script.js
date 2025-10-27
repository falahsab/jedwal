// ==========================
// الكود الجافاسكربت الأساسي مع تعديل عرض المعلق والقناة
// ==========================
document.addEventListener('DOMContentLoaded',()=>{

const displayEl = document.getElementById('todayDateDisplay');
const manualDateEl = document.getElementById('manualDate');
const editBtn = document.getElementById('editDateBtn');
const days = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];

function updateDateDisplay(date){
  displayEl.textContent = `${days[date.getDay()]} ${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
}
let currentDate = new Date();
updateDateDisplay(currentDate);

editBtn.addEventListener('click',()=>{
  manualDateEl.style.display = 'inline-block';
  manualDateEl.valueAsDate = currentDate;
});

manualDateEl.addEventListener('change',()=>{
  const selected = new Date(manualDateEl.value);
  if(!isNaN(selected)) {
    currentDate = selected;
    updateDateDisplay(currentDate);
  }
});

// ==========================
// مسارات الملفات (نسبيّة من صفحة HTML)
// ==========================
const leaguesCSV='csv/leagues.csv';
const commentatorsCSV='csv/commentators.csv';
const channelsCSV='csv/channels.csv';
const teamsCSVFolder='teams/';
const extraLogosCSV='csv/extra_logos.csv';

let extraLogos = [];
let selectedExtraLogo = "";
let leagues=[], teams={}, commentators=[], channels=[], showBtns=true;
let matches=[], editIndex=null, isNextDay=false;

// ==========================
// دوال مساعدة
// ==========================
function fetchCSV(url,callback){
  Papa.parse(url,{download:true,header:true,complete:r=>callback(r.data)});
}

function toBase64(url, callback){
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => { 
    const canvas = document.createElement('canvas'); 
    canvas.width=img.width; 
    canvas.height=img.height; 
    canvas.getContext('2d').drawImage(img,0,0); 
    callback(canvas.toDataURL()); 
  };
  img.onerror = () => callback('');
  img.src = url;
}

function updatePreview(selectEl, previewId){
  const teamName = selectEl.value;
  const imgUrl = `teams_images/${teamName}.png`; // صور الفرق من مجلد teams_images/

  const previewEl = document.getElementById(previewId);
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0);
    previewEl.innerHTML = `<img src="${canvas.toDataURL()}" alt="${teamName}">`;
  };
  img.onerror = () => { previewEl.innerHTML = '⚽'; };
  img.src = imgUrl;
}

// ==========================
// تحميل البيانات
// ==========================
function populateLeagues(){
  fetchCSV(leaguesCSV, data=>{
    leagues=data;
    const leagueSelect=document.getElementById('leagueSelect');
    leagueSelect.innerHTML = leagues.map(l=>`
      <option value='${l.code}' data-logo='${l.logo}' data-color='${l.color||"#fdfdfd"}' data-extra='${l.extraLogo||""}'>
        ${l.name}
      </option>
    `).join('');
    loadTeams(leagueSelect.value);
  });
}

function loadTeams(leagueCode, cb){
  fetchCSV(`${teamsCSVFolder}${leagueCode}_teams.csv`, data=>{
    teams[leagueCode]=data;
    const homeTeam=document.getElementById('homeTeam');
    const awayTeam=document.getElementById('awayTeam');

    homeTeam.innerHTML=awayTeam.innerHTML=data.map(t=>`
      <option value='${t.name}' data-img='teams_images/${t.name}.png'>
        ${t.name}
      </option>
    `).join('');

    updatePreview(homeTeam,'homePreview'); 
    updatePreview(awayTeam,'awayPreview');

    setTimeout(()=>{
      $('#homeTeam, #awayTeam').off('change');
      $('#homeTeam, #awayTeam').select2({ width: '100%', dir: "rtl", language: { noResults: () => "لا توجد نتائج مطابقة" } });
      $('#homeTeam, #awayTeam').on('change', function() {
        updatePreview(this, this.id === 'homeTeam' ? 'homePreview' : 'awayPreview');
      });
      if(typeof cb === 'function') cb();
    }, 120);
  });
}

function fetchCommentators(){
  fetchCSV(commentatorsCSV, data=>{
    document.getElementById('commentator').innerHTML = data.map(c=>`<option>${c.name}</option>`).join('');
  });
}

function fetchChannels(){
  fetchCSV(channelsCSV, data=>{
    channels=data;
    document.getElementById('channel').innerHTML = data.map(c=>`<option value='${c.name}' data-logo='${c.logo}'>${c.name}</option>`).join('');
  });
}

function fetchExtraLogos(){
  fetchCSV(extraLogosCSV, data=>{
    extraLogos = data;
    const extraSelect = document.getElementById('extraLogoSelect');
    extraSelect.innerHTML = data.map(x=>`<option value="${x.logo}">${x.name}</option>`).join('');
    if (data.length > 0) {
      selectedExtraLogo = data[0].logo;
      document.getElementById('extraPreview').innerHTML = `<img src="${selectedExtraLogo}" alt="Extra" style="max-height:40px;">`;
    }
    $('#extraLogoSelect').select2({ width: '100%', dir: 'rtl', language: { noResults: () => "لا توجد نتائج مطابقة" } });
    $('#extraLogoSelect').on('change', function(){
      selectedExtraLogo = this.value;
      document.getElementById('extraPreview').innerHTML = `<img src="${selectedExtraLogo}" alt="Extra" style="max-height:40px;">`;
      render();
    });
  });
}

// ==========================
// الحدث الرئيسي
// ==========================
populateLeagues(); 
fetchCommentators(); 
fetchChannels();

setTimeout(()=>{
  $('#leagueSelect, #homeTeam, #awayTeam, #commentator, #channel').select2({width: '100%', dir: "rtl", language: { noResults: () => "لا توجد نتائج مطابقة" }});
  fetchExtraLogos();
  $('#leagueSelect').on('select2:select', function (e) {
    const leagueCode = e.params.data.id;
    loadTeams(leagueCode);
  });
}, 800);

// ==========================
// إضافة مباراة جديدة
// ==========================
document.getElementById('addMatch').onclick = () => {
  const league = document.getElementById('leagueSelect').value;
  const home = document.getElementById('homeTeam').value;
  const away = document.getElementById('awayTeam').value;
  const time = document.getElementById('matchTime').value;
  const comm = document.getElementById('commentator').value;
  const chan = document.getElementById('channel').value;
  let homeImg = document.getElementById('homeTeam').selectedOptions[0].dataset.img;
  let awayImg = document.getElementById('awayTeam').selectedOptions[0].dataset.img;

  if (!time) { alert('ادخل وقت المباراة'); return; }

  toBase64(homeImg, b64Home => {
    homeImg = b64Home;
    toBase64(awayImg, b64Away => {
      awayImg = b64Away;
      const chanLogoUrl = channels.find(c => c.name === chan)?.logo || '';
      toBase64(chanLogoUrl, b64Chan => {
        const newMatch = { league, home, away, time, comm, chan, homeImg, awayImg, chanLogo: b64Chan, nextDay: isNextDay };
        if (editIndex !== null) { matches.splice(editIndex, 0, newMatch); editIndex=null; } 
        else { matches.push(newMatch); }
        localStorage.setItem('matches', JSON.stringify(matches));
        render();
        document.getElementById('matchTime').value = '';
        isNextDay = false;
        document.getElementById('nextDayState').textContent = '❌';
      });
    });
  });
};

// ==========================
// عرض المباريات
// ==========================
function render(){
  const matchesContainer=document.getElementById('matchesContainer');
  matchesContainer.innerHTML='';
  leagues.forEach(l=>{
    const leagueMatches=matches.filter(m=>m.league===l.code);
    if(leagueMatches.length>0){
      const section=document.createElement('div'); section.className='matches-section';
      const header=document.createElement('div'); header.className='section-header';
      const extraLogo = selectedExtraLogo || l.extraLogo || l.extra;
      header.innerHTML=`<img src='${extraLogo}' class='extra-logo-header'> <img src='${l.logo}' style='width:24px;height:24px'> ${l.name}`;
      section.appendChild(header);

      leagueMatches.forEach((m)=>{
        const card=document.createElement('div'); 
        card.className='match-card'; 
        card.style.background=l.color||'#fdfdfd';
        const [hours, minutes] = m.time.split(':');
        let displayHours = parseInt(hours,10);
        const ampm = displayHours >= 12 ? 'م' : 'ص';
        displayHours = displayHours % 12 || 12;

        let bottomHTML = '';
        if(m.comm || m.chanLogo){
          bottomHTML = `
            <div class="meta" style="min-height: 24px; display:flex; align-items:center; justify-content:center; position:relative;">
              ${m.chanLogo ? `<img src="${m.chanLogo}" style="position:absolute; left:6px; height:30px; object-fit:contain;" alt="${m.chan}">` : ''}
              ${m.comm ? `<div style="flex:1; text-align:center; font-weight:500; color:#efeded;font-family:'Tajawal','Segoe UI',Tahoma,Arial,sans-serif;">🎙️ ${m.comm}</div>` : ''}
            </div>
          `;
        }

        card.innerHTML=`
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
          <div class="action-btns" style="display:${showBtns?'flex':'none'}">
            <button onclick="editMatch(${matches.indexOf(m)})">✏️ تعديل</button>
            <button onclick="deleteMatch(${matches.indexOf(m)})">🗑️ حذف</button>
          </div>
        `;
        section.appendChild(card);
      });

      matchesContainer.appendChild(section);
    }
  });
}

// ==========================
// أحداث تحرير وحذف
// ==========================
window.editMatch = (index) => {
  if (editIndex !== null) { alert('هناك بطاقة قيد التعديل حالياً!'); return; }
  const m = matches[index];
  $('#leagueSelect').val(m.league).trigger('change.select2');
  loadTeams(m.league, () => {
    $('#homeTeam').val(m.home).trigger('change.select2');
    $('#awayTeam').val(m.away).trigger('change.select2');
    $('#commentator').val(m.comm).trigger('change.select2');
    $('#channel').val(m.chan).trigger('change.select2');
    document.getElementById('matchTime').value = m.time;
    updatePreview(document.getElementById('homeTeam'),'homePreview');
    updatePreview(document.getElementById('awayTeam'),'awayPreview');
    editIndex = index;
    matches.splice(index, 1);
    localStorage.setItem('matches', JSON.stringify(matches));
    render();
  });
};

window.deleteMatch=(index)=>{
  if(confirm('هل تريد حذف هذه المباراة؟')){
    matches.splice(index,1); 
    localStorage.setItem('matches',JSON.stringify(matches)); 
    render();
  }
};

if(localStorage.getItem('matches')){
  matches=JSON.parse(localStorage.getItem('matches'));
  render();
}
document.getElementById('nextDayBtn').onclick=()=>{isNextDay=!isNextDay; document.getElementById('nextDayState').textContent=isNextDay?'✅':'❌';};

});
