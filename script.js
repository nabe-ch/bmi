let chartInstance = null;
let currentFilter = '1month';

document.addEventListener('DOMContentLoaded', () => {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('logDate').value = today;
  
  // ▼▼▼ 追加：保存されている入力値があれば復元 ▼▼▼
  const savedHeight = localStorage.getItem('savedHeight');
  if (savedHeight) document.getElementById('height').value = savedHeight;

  const savedCurrentWeight = localStorage.getItem('savedCurrentWeight');
  if (savedCurrentWeight) document.getElementById('currentWeight').value = savedCurrentWeight;

  const savedTarget = localStorage.getItem('savedTargetWeight');
  if (savedTarget) document.getElementById('targetWeight').value = savedTarget;

  const savedDays = localStorage.getItem('savedDays');
  if (savedDays) document.getElementById('dietDays').value = savedDays;
  // ▲▲▲ ここまで追加 ▲▲▲

  setupInputRestrictions();
  loadChartData();
});

// ==========================================
// 入力制限 (5文字制限・マイナス無効)
// ==========================================
function setupInputRestrictions() {
  const decimalInputs = document.querySelectorAll('.strict-decimal');
  const intInputs = document.querySelectorAll('.strict-int');

  decimalInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
    });
    input.addEventListener('input', (e) => {
      if (e.target.value.length > 5) {
        e.target.value = e.target.value.slice(0, 5);
      }
    });
  });

  intInputs.forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
    });
    input.addEventListener('input', (e) => {
      if (e.target.value.length > 3) {
        e.target.value = e.target.value.slice(0, 3);
      }
    });
  });
}

// ==========================================
// 計算ロジック
// ==========================================
function calculateStatus() {
  const height = parseFloat(document.getElementById('height').value);
  const weight = parseFloat(document.getElementById('currentWeight').value);

  if (!height || !weight) return alert("身長と体重を入力してください。");

  // ▼▼▼ 追加：身長と体重をローカル保存 ▼▼▼
  localStorage.setItem('savedHeight', height);
  localStorage.setItem('savedCurrentWeight', weight);

  const heightM = height / 100;
  const bmi = weight / (heightM * heightM);

  let statusText = "";
  if (bmi < 18.5) statusText = "低体重 (痩せ型)";
  else if (bmi < 25) statusText = "普通体重 (適正)";
  else if (bmi < 30) statusText = "肥満 (1度)";
  else if (bmi < 35) statusText = "肥満 (2度)";
  else if (bmi < 40) statusText = "肥満 (3度)";
  else statusText = "肥満 (4度)";

  document.getElementById('bmiValue').innerText = bmi.toFixed(1);
  document.getElementById('obesityLevel').innerText = statusText;
  document.getElementById('statusResult').classList.remove('hidden');

  calculateExercises(weight);
}

function calculateTarget() {
  const currentWeight = parseFloat(document.getElementById('currentWeight').value);
  const targetWeight = parseFloat(document.getElementById('targetWeight').value);
  const days = parseInt(document.getElementById('dietDays').value);

  if (!currentWeight || !targetWeight || !days) return alert("数値を入力してください。");
  if (currentWeight - targetWeight <= 0) return alert("目標体重は現在の体重より軽く設定してください。");

  // ▼▼▼ 変更：すべての目標値・現状値を保存してグラフを更新 ▼▼▼
  localStorage.setItem('savedCurrentWeight', currentWeight);
  localStorage.setItem('savedTargetWeight', targetWeight);
  localStorage.setItem('savedDays', days);
  loadChartData(); 

  const weightDiff = currentWeight - targetWeight;
  const totalCalories = weightDiff * 7200;
  
  const dailyDeficit = Math.round(totalCalories / days);
  const weeklyDeficit = dailyDeficit * 7;

  document.getElementById('dailyDeficit').innerText = `${dailyDeficit.toLocaleString()} kcal`;
  document.getElementById('weeklyDeficit').innerText = `${weeklyDeficit.toLocaleString()} kcal`;

  let msg = "";
  if (dailyDeficit < 200) {
    msg = "おにぎり1個分の我慢、または【ウォーキング30〜40分】！余裕のペースですね🍙🚶‍♂️";
  } else if (dailyDeficit < 400) {
    msg = "菓子パン1個を断ち切るか、【ジョギング40分】の覚悟を！☕️🏃‍♀️";
  } else if (dailyDeficit < 700) {
    msg = "ラーメン大盛り1杯分のマイナス！食事の見直し＋【毎日の運動】の組み合わせが必須です🔥";
  } else {
    msg = "少しハードな目標です！期間を延ばすか、【HIITなどの激しい運動】を取り入れましょう！💦";
  }
  
  document.getElementById('uniqueMessage').innerText = msg;
  document.getElementById('targetResult').classList.remove('hidden');
}

function calculateExercises(weight) {
  document.getElementById('calJog').innerText = Math.round(7.0 * weight * 1.05) + " kcal";
  document.getElementById('calWalk').innerText = Math.round(4.3 * weight * 1.05) + " kcal";
  document.getElementById('calHiit').innerText = Math.round(8.0 * weight * 1.05) + " kcal";
  document.getElementById('calMuscle').innerText = Math.round(3.5 * weight * 1.05) + " kcal";
}

// ==========================================
// データ保存とグラフ描画（目標体重ライン追加）
// ==========================================
function saveDailyLog() {
  const date = document.getElementById('logDate').value;
  const weight = parseFloat(document.getElementById('logWeight').value);
  if (!date || !weight) return alert("日付と体重を入力してください。");

  let logs = JSON.parse(localStorage.getItem('fitnessLogs')) || {};
  logs[date] = weight;
  
  const sortedLogs = Object.keys(logs).sort().reduce((acc, key) => {
    acc[key] = logs[key];
    return acc;
  }, {});

  localStorage.setItem('fitnessLogs', JSON.stringify(sortedLogs));
  loadChartData();
}

function deleteLatestLog() {
  let logs = JSON.parse(localStorage.getItem('fitnessLogs')) || {};
  const dates = Object.keys(logs).sort();
  if (dates.length === 0) return alert("削除するデータがありません。");

  const latestDate = dates[dates.length - 1];
  if (confirm(`${latestDate} の記録を削除しますか？`)) {
    delete logs[latestDate];
    localStorage.setItem('fitnessLogs', JSON.stringify(logs));
    loadChartData();
  }
}

function clearData() {
  if (confirm("本当にすべての履歴データを削除しますか？（目標体重などの入力データもリセットされます）")) {
    localStorage.clear(); // ▼変更：一つずつ消すのではなく、すべて一括クリアにしました
    
    // 入力欄もクリア
    document.getElementById('height').value = "";
    document.getElementById('currentWeight').value = "";
    document.getElementById('targetWeight').value = "";
    document.getElementById('dietDays').value = "";
    
    loadChartData();
  }
}

function setChartFilter(range) {
  currentFilter = range;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  loadChartData();
}

function loadChartData() {
  const logs = JSON.parse(localStorage.getItem('fitnessLogs')) || {};
  let dates = Object.keys(logs);
  
  if (dates.length === 0) {
    if (chartInstance) chartInstance.destroy();
    return;
  }

  const today = new Date();
  let cutoffDate = new Date();

  if (currentFilter === '1week') cutoffDate.setDate(today.getDate() - 7);
  else if (currentFilter === '1month') cutoffDate.setMonth(today.getMonth() - 1);
  else if (currentFilter === '3months') cutoffDate.setMonth(today.getMonth() - 3);
  else if (currentFilter === '6months') cutoffDate.setMonth(today.getMonth() - 6);
  else if (currentFilter === '1year') cutoffDate.setFullYear(today.getFullYear() - 1);
  
  const cutoffTime = cutoffDate.getTime();
  const filteredDates = [];
  const filteredWeights = [];
  
  dates.forEach(date => {
    if (new Date(date).getTime() >= cutoffTime) {
      filteredDates.push(date);
      filteredWeights.push(logs[date]);
    }
  });

  const datasets = [{
    label: '体重 (kg)',
    data: filteredWeights,
    borderColor: '#FF7B54',
    backgroundColor: 'rgba(255, 123, 84, 0.2)',
    borderWidth: 3,
    pointBackgroundColor: '#FFB26B',
    pointRadius: 5,
    fill: true,
    tension: 0.3
  }];

  const savedTarget = localStorage.getItem('savedTargetWeight');
  let yMinVals = [...filteredWeights];
  let yMaxVals = [...filteredWeights];

  if (savedTarget && filteredDates.length > 0) {
    const targetW = parseFloat(savedTarget);
    const targetData = filteredDates.map(() => targetW);
    datasets.push({
      label: '目標体重 (kg)',
      data: targetData,
      borderColor: '#4CAF50',
      borderDash: [5, 5],
      borderWidth: 2,
      pointRadius: 0,
      fill: false
    });
    yMinVals.push(targetW);
    yMaxVals.push(targetW);
  }

  const ctx = document.getElementById('weightChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: filteredDates,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: yMinVals.length > 0 ? Math.floor(Math.min(...yMinVals)) - 2 : 0,
          max: yMaxVals.length > 0 ? Math.ceil(Math.max(...yMaxVals)) + 2 : 100
        }
      }
    }
  });
}