(function() {
  const url = "тут ваша url";
  const updateInterval = 1000000;
  const container = document.createElement('div');
  container.id = 'light-outage-timer';
  container.style.position = 'relative';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.backgroundColor = 'rgb(153 153 153 / 22%)';
  container.style.color = 'rgb(86 237 3)';
  container.style.textShadow = 'rgb(0 0 0) 1px 1px 1px';
  container.style.zIndex = '9999';
  container.style.boxSizing = 'border-box';
  container.style.textAlign = 'center';
  container.style.fontFamily = 'Arial, sans-serif';
  container.style.fontSize = '14px';
  const masthead = document.querySelector('ytd-masthead');
  const mwHead = document.querySelector('#mw-head');
  if (masthead || mwHead) {
    if (masthead) {
      masthead.insertBefore(container, masthead.firstChild);
    } else {
      mwHead.insertBefore(container, mwHead.firstChild);
    }
  } else {
    document.body.insertBefore(container, document.body.firstChild);
  }
  const statusElem = document.createElement('span');
  statusElem.id = 'status';
  container.appendChild(statusElem);
  const countdownElem = document.createElement('span');
  countdownElem.id = 'countdown';
  countdownElem.style.marginLeft = '10px';
  container.appendChild(countdownElem);
  function fetchDataAndUpdateTimer() {
    chrome.runtime.sendMessage({ action: "fetchData", url }, (response) => {
      if (response.success) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(response.data, 'text/html');
        const periods = [];
        const items = doc.querySelectorAll('.grafik_string_list_item');
        items.forEach(item => {
          try {
            const startStr = item.querySelectorAll('b')[0].textContent.trim();
            const endStr = item.querySelectorAll('b')[1].textContent.trim();
            const start = parseTime(startStr);
            const end = parseTime(endStr);
            periods.push({ start, end });
          } catch (error) {
            console.error('Error parsing item:', error);
          }
        });
        if (periods.length > 0) {
          updateTimer(periods);
        } else {
          displayStatus('Немає даних про періоди відключень');
        }
      } else {
        console.error('Error fetching data:', response.error);
        displayStatus('Помилка завантаження даних');
      }
    });
  }
  function updateTimer(periods) {
    const now = new Date();
    const currentPeriod = periods.find(period => now >= period.start && now <= period.end);
    if (currentPeriod) {
      const remaining = Math.round((currentPeriod.end - now) / 1000);
      startCountdown(remaining, 'До кінця відключення залишилось:');
    } else {
      const nextPeriod = periods.find(period => period.start > now);
      if (nextPeriod) {
        const remaining = Math.round((nextPeriod.start - now) / 1000);
        startCountdown(remaining, 'Світло буде ще:');
      } else {
        displayStatus('Сьогодні більше немає відключень');
      }
    }
  }
  function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    const now = new Date();
    now.setHours(hours, minutes, 0, 0);
    return now;
  }
  function startCountdown(seconds, statusText) {
    const statusElem = document.getElementById('status');
    const countdownElem = document.getElementById('countdown');
    statusElem.textContent = statusText;
    countdownElem.textContent = ' ' + formatTime(seconds);
    const interval = setInterval(() => {
      seconds--;
      countdownElem.textContent = ' ' + formatTime(seconds);
      if (seconds <= 0) {
        clearInterval(interval);
        fetchDataAndUpdateTimer();
      }
    }, 1000);
  }
  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  function displayStatus(message) {
    const statusElem = document.getElementById('status');
    statusElem.textContent = message;
  }
  fetchDataAndUpdateTimer();
  setInterval(fetchDataAndUpdateTimer, updateInterval);
})();
