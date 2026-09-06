  document.addEventListener('DOMContentLoaded', () => {

    // === إدارة التاريخ واليوم ===
    const siteHeaderDate = document.getElementById('siteHeaderDate');
    const posterDateDisplay = document.getElementById('posterDateDisplay');
    const manualDateEl = document.getElementById('manualDate');
    const editBtn = document.getElementById('editDateBtn');
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    let currentDate = new Date();
    function updateDateDisplay(date) {
      const formatted = `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      siteHeaderDate.textContent = formatted;
      posterDateDisplay.textContent = `📅 ${formatted}`;
    }
    updateDateDisplay(currentDate);

    editBtn.addEventListener('click', () => {
      manualDateEl.style.display = manualDateEl.style.display === 'none' ? 'block' : 'none';
      if (manualDateEl.style.display === 'block') {
        manualDateEl.valueAsDate = currentDate;
      }
    });

    manualDateEl.addEventListener('change', () => {
      const selected = new Date(manualDateEl.value);
      if (!isNaN(selected)) {
        currentDate = selected;
        updateDateDisplay(currentDate);
      }
    });

    // === إدارة ثيمات الدوريات العالمية ===
    const themeSelect = document.getElementById('themeSelect');
    const exportArea = document.getElementById('exportArea');

    // استعادة الثيم المحفوظ (الافتراضي: دوري أبطال أوروبا)
    const savedTheme = localStorage.getItem('selectedTheme') || 'theme-ucl';
    themeSelect.value = savedTheme;
    exportArea.className = savedTheme;

    themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      exportArea.className = theme;
      localStorage.setItem('selectedTheme', theme);
    });

    // === مسارات الملفات والمتغيرات العامة ===
    const leaguesCSV = 'csv/leagues.csv';
    const commentatorsCSV = 'csv/commentators.csv';
    const channelsCSV = 'csv/channels.csv';
    const teamsCSVFolder = 'teams/';
    const extraLogosCSV = 'csv/extra_logos.csv';
    const watermarkPath = 'img/yemen-sat-white.png';

    let leagues = [], teams = {}, commentators = [], channels = [], extraLogos = [];
    let selectedExtraLogo = "";
    let matches = JSON.parse(localStorage.getItem('matches') || '[]');
    let editMatchId = null;
    let isNextDay = false;
    let showBtns = true;

    // جلب ملفات CSV
    function loadCSV(url) {
      return new Promise((resolve) => {
        Papa.parse(url, {
          download: true,
          header: true,
          skipEmptyLines: true,
          complete: (res) => resolve(res.data || []),
          error: () => resolve([])
        });
      });
    }

    // تحويل الصور إلى Base64
    function toBase64(url) {
      return new Promise((resolve) => {
        if (!url || url.startsWith('data:')) {
          resolve(url || '');
          return;
        }
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            resolve(url);
          }
        };
        img.onerror = () => resolve(url);
        img.src = url;
      });
    }

    // توليد علامة مائية متباعدة بمسافات متساوية
    function createSpacedWatermark(url, logoSize = 34, gap = 55) {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const aspect = img.naturalHeight / img.naturalWidth || 1;
          const logoW = logoSize;
          const logoH = logoSize * aspect;

          const tileW = Math.round(logoW + gap);
          const tileH = Math.round(logoH + gap);

          const canvas = document.createElement('canvas');
          canvas.width = tileW;
          canvas.height = tileH;
          const ctx = canvas.getContext('2d');

          const x = (tileW - logoW) / 2;
          const y = (tileH - logoH) / 2;
          ctx.drawImage(img, x, y, logoW, logoH);

          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(url);
        img.src = url;
      });
    }

    // تحديث المعاينة للشعارات
    function updatePreview(selectEl, previewId, fallbackIcon) {
      if (!selectEl || !selectEl.selectedOptions || selectEl.selectedOptions.length === 0) {
        document.getElementById(previewId).innerHTML = fallbackIcon;
        return;
      }
      const img = selectEl.selectedOptions[0]?.dataset?.img;
      if (img) {
        document.getElementById(previewId).innerHTML = `<img src="${img}" alt="preview">`;
      } else {
        document.getElementById(previewId).innerHTML = fallbackIcon;
      }
    }

    // تحميل فرق الدوري المحدد
    async function loadTeams(leagueCode) {
      if (!teams[leagueCode]) {
        teams[leagueCode] = await loadCSV(`${teamsCSVFolder}${leagueCode}_teams.csv`);
      }
      const teamList = teams[leagueCode] || [];
      const homeTeam = document.getElementById('homeTeam');
      const awayTeam = document.getElementById('awayTeam');

      const optionsHtml = teamList.map(t => `<option value="${t.name}" data-img="${t.img || ''}">${t.name}</option>`).join('');
      homeTeam.innerHTML = optionsHtml;
      awayTeam.innerHTML = optionsHtml;

      $('#homeTeam').val($('#homeTeam option:first').val()).trigger('change');
      $('#awayTeam').val($('#awayTeam option:eq(1)').val() || $('#awayTeam option:first').val()).trigger('change');

      updatePreview(homeTeam, 'homePreview', '🏠');
      updatePreview(awayTeam, 'awayPreview', '⚽');
    }

    // تهيئة البيانات
    async function init() {
      $('#leagueSelect, #homeTeam, #awayTeam, #commentator, #channel, #extraLogoSelect').select2({
        width: '100%',
        dir: 'rtl',
        language: { noResults: () => "لا توجد نتائج مطابقة" }
      });

      // إنشاء العلامة المائية المتباعدة
      createSpacedWatermark(watermarkPath, 34, 55).then(b64 => {
        if (b64) {
          document.documentElement.style.setProperty('--watermark-url', `url(${b64})`);
        }
      });

      const [leaguesData, commsData, chansData, extrasData] = await Promise.all([
        loadCSV(leaguesCSV),
        loadCSV(commentatorsCSV),
        loadCSV(channelsCSV),
        loadCSV(extraLogosCSV)
      ]);

      leagues = leaguesData;
      commentators = commsData;
      channels = chansData;
      extraLogos = extrasData;

      // تعبئة الدوريات
      const leagueSelect = document.getElementById('leagueSelect');
      leagueSelect.innerHTML = leagues.map(l => 
        `<option value="${l.code}" data-logo="${l.logo || ''}" data-color="${l.color || ''}" data-extra="${l.extraLogo || ''}">${l.name}</option>`
      ).join('');

      // تعبئة المعلقين
      document.getElementById('commentator').innerHTML = commentators.map(c => `<option value="${c.name}">${c.name}</option>`).join('');

      // تعبئة القنوات
      document.getElementById('channel').innerHTML = channels.map(c => `<option value="${c.name}" data-logo="${c.logo || ''}">${c.name}</option>`).join('');

      // تعبئة الشعار الإضافي
      const extraSelect = document.getElementById('extraLogoSelect');
      extraSelect.innerHTML = extraLogos.map(x => `<option value="${x.logo}">${x.name}</option>`).join('');
      if (extraLogos.length > 0) {
        selectedExtraLogo = extraLogos[0].logo;
        document.getElementById('extraPreview').innerHTML = `<img src="${selectedExtraLogo}" alt="Extra">`;
      }

      $('#leagueSelect').on('select2:select', function () {
        loadTeams(this.value);
      });

      $('#homeTeam').on('change', function() { updatePreview(this, 'homePreview', '🏠'); });
      $('#awayTeam').on('change', function() { updatePreview(this, 'awayPreview', '⚽'); });

      $('#extraLogoSelect').on('change', function() {
        selectedExtraLogo = this.value;
        document.getElementById('extraPreview').innerHTML = `<img src="${selectedExtraLogo}" alt="Extra">`;
        render();
      });

      if (leagues.length > 0) {
        await loadTeams(leagues[0].code);
      }

      render();
    }

    // زر اليوم التالي
    document.getElementById('nextDayBtn').onclick = () => {
      isNextDay = !isNextDay;
      document.getElementById('nextDayState').textContent = isNextDay ? '✅' : '❌';
    };

    // إضافة أو حفظ تعديل مباراة
    document.getElementById('addMatch').onclick = async () => {
      const league = document.getElementById('leagueSelect').value;
      const home = document.getElementById('homeTeam').value;
      const away = document.getElementById('awayTeam').value;
      const time = document.getElementById('matchTime').value;
      const comm = document.getElementById('commentator').value;
      const chan = document.getElementById('channel').value;

      if (!time) {
        alert('⚠️ يرجى تحديد وقت المباراة أولاً');
        return;
      }

      if (home === away) {
        alert('⚠️ لا يمكن اختيار نفس الفريق كمضيف وضيف!');
        return;
      }

      const homeImgRaw = document.getElementById('homeTeam').selectedOptions[0]?.dataset?.img || '';
      const awayImgRaw = document.getElementById('awayTeam').selectedOptions[0]?.dataset?.img || '';
      const chanLogoRaw = channels.find(c => c.name === chan)?.logo || '';

      const [homeImg, awayImg, chanLogo] = await Promise.all([
        toBase64(homeImgRaw),
        toBase64(awayImgRaw),
        toBase64(chanLogoRaw)
      ]);

      if (editMatchId) {
        const idx = matches.findIndex(m => m.id === editMatchId);
        if (idx !== -1) {
          matches[idx] = { ...matches[idx], league, home, away, time, comm, chan, homeImg, awayImg, chanLogo, nextDay: isNextDay };
        }
        resetEditMode();
      } else {
        const newMatch = {
          id: 'm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          league, home, away, time, comm, chan,
          homeImg, awayImg, chanLogo,
          nextDay: isNextDay
        };
        matches.push(newMatch);
      }

      localStorage.setItem('matches', JSON.stringify(matches));
      render();

      document.getElementById('matchTime').value = '';
      isNextDay = false;
      document.getElementById('nextDayState').textContent = '❌';
    };

    // وضع التعديل
    window.editMatch = async (id) => {
      const match = matches.find(m => m.id === id);
      if (!match) return;

      editMatchId = id;
      document.getElementById('addMatch').textContent = '💾 حفظ التعديل';
      document.getElementById('addMatch').classList.add('btn-success');
      document.getElementById('cancelEditBtn').style.display = 'inline-flex';

      $('#leagueSelect').val(match.league).trigger('change');
      await loadTeams(match.league);

      $('#homeTeam').val(match.home).trigger('change');
      $('#awayTeam').val(match.away).trigger('change');
      $('#commentator').val(match.comm).trigger('change');
      $('#channel').val(match.chan).trigger('change');

      document.getElementById('matchTime').value = match.time;
      isNextDay = !!match.nextDay;
      document.getElementById('nextDayState').textContent = isNextDay ? '✅' : '❌';
    };

    function resetEditMode() {
      editMatchId = null;
      document.getElementById('addMatch').textContent = '➕ إضافة المباراة';
      document.getElementById('addMatch').classList.remove('btn-success');
      document.getElementById('cancelEditBtn').style.display = 'none';
      document.getElementById('matchTime').value = '';
    }

    document.getElementById('cancelEditBtn').onclick = resetEditMode;

    // حذف مباراة
    window.deleteMatch = (id) => {
      if (confirm('هل أنت متأكد من حذف هذه المباراة؟')) {
        matches = matches.filter(m => m.id !== id);
        localStorage.setItem('matches', JSON.stringify(matches));
        if (editMatchId === id) resetEditMode();
        render();
      }
    };

    // تفريغ الجدول
    document.getElementById('deleteAll').onclick = () => {
      if (matches.length === 0) return;
      if (confirm('⚠️ هل تريد حذف جميع المباريات الموجودة في الجدول؟')) {
        matches = [];
        localStorage.setItem('matches', '[]');
        resetEditMode();
        render();
      }
    };

    // إخفاء/إظهار الإجراءات
    document.getElementById('toggleBtns').onclick = () => {
      showBtns = !showBtns;
      render();
    };

    // تبديل ترتيب القسمين
    document.getElementById('swapSections').onclick = () => {
      const grid = document.querySelector('.grid');
      grid.appendChild(grid.firstElementChild);
    };

    // توليد وعرض بطاقات المباريات
    function render() {
      const container = document.getElementById('matchesContainer');
      container.innerHTML = '';

      if (matches.length === 0) {
        container.innerHTML = '<div class="empty-state">لا توجد مباريات مضافة حالياً.<br>أضف مبارياتك اليوم من النموذج وستظهر هنا فوراً!</div>';
        return;
      }

      leagues.forEach(l => {
        const leagueMatches = matches.filter(m => m.league === l.code);
        if (leagueMatches.length === 0) return;

        const section = document.createElement('div');
        section.className = 'matches-section';

        const header = document.createElement('div');
        header.className = 'section-header';
        
        const extraLogo = selectedExtraLogo || l.extraLogo || '';
        header.innerHTML = `
          <img src="${l.logo || ''}" style="width:24px;height:24px;object-fit:contain;" alt="">
          <span>${l.name}</span>
          ${extraLogo ? `<img src="${extraLogo}" class="extra-logo-header" alt="">` : ''}
        `;
        section.appendChild(header);

        leagueMatches.forEach(m => {
          const card = document.createElement('div');
          card.className = 'match-card';
          
          if (l.color && l.color !== '#fdfdfd') {
            card.style.backgroundColor = l.color;
          }

          const [hours, minutes] = (m.time || "00:00").split(':');
          let displayHours = parseInt(hours, 10);
          const ampm = displayHours >= 12 ? 'م' : 'ص';
          displayHours = displayHours % 12 || 12;

          let bottomHTML = '';
          if (m.comm || m.chanLogo) {
            bottomHTML = `
              <div class="meta">
                ${m.chanLogo ? `<img src="${m.chanLogo}" style="position:absolute; left:4px; height:24px; object-fit:contain;" alt="${m.chan}">` : ''}
                ${m.comm ? `<div style="flex:1; text-align:center; font-size:12.5px; font-weight:600; color:#ddd;">🎙️ ${m.comm}</div>` : ''}
              </div>
            `;
          }

          card.innerHTML = `
            <div class="match_row">
              <div class="team hometeam">
                <span class="the_team" title="${m.home}">${m.home}</span>
                <img src="${m.homeImg}" class="team_logo" alt="${m.home}">
              </div>
              
              <div class="middle_column">
                <div class="the_time">
                  <span style="font-size:12px; margin-right:2px;">${ampm}</span>
                  <span>${displayHours}:${minutes}</span>
                </div>
                ${m.nextDay ? "<span class='next-day-label'>(اليوم التالي)</span>" : ""}
              </div>

              <div class="team awayteam">
                <img src="${m.awayImg}" class="team_logo" alt="${m.away}">
                <span class="the_team" title="${m.away}">${m.away}</span>
              </div>
            </div>

            ${bottomHTML}

            <div class="action-btns" style="display: ${showBtns ? 'flex' : 'none'};">
              <button onclick="editMatch('${m.id}')" style="background:#f39c12; color:#fff;">✏️ تعديل</button>
              <button onclick="deleteMatch('${m.id}')" style="background:#e74c3c; color:#fff;">🗑️ حذف</button>
            </div>
          `;
          section.appendChild(card);
        });

        container.appendChild(section);
      });
    }

    // === تحميل الجدول كصورة Full HD بثيم البطولة وعلامة مائية متباعدة ===
    document.getElementById('downloadTable').addEventListener('click', async () => {
      const actionBtns = exportArea.querySelectorAll('.action-btns');
      actionBtns.forEach(btn => btn.style.display = 'none');

      exportArea.classList.add('export-mode');

      try {
        await document.fonts.ready;

        const computedBg = window.getComputedStyle(exportArea).backgroundColor || '#030818';

        const dataUrl = await htmlToImage.toPng(exportArea, {
          pixelRatio: 3,
          backgroundColor: computedBg
        });

        const link = document.createElement('a');
        link.download = `جدول_مباريات_${currentDate.toISOString().slice(0, 10)}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Error exporting image:', error);
        alert('حدث خطأ أثناء تصدير الصورة.');
      } finally {
        exportArea.classList.remove('export-mode');
        if (showBtns) {
          actionBtns.forEach(btn => btn.style.display = 'flex');
        }
      }
    });

    init();

    setTimeout(() => {
      const splash = document.getElementById('splash');
      splash.style.opacity = '0';
      setTimeout(() => splash.style.display = 'none', 600);
    }, 1200);

  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
