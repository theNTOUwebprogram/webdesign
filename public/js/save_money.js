let chartInstance = null;
let pieChartInstance = null;
let account_name;
let ciphertext;
let currentDisplayMonth = new Date(); // 當前顯示的月份

function changeFont() {
    const selectedFont = document.getElementById("fontSelector").value;
    document.body.style.fontFamily = selectedFont;

    if (chartInstance) {
        chartInstance.options.plugins.title.font.family = selectedFont;
        chartInstance.options.plugins.legend.labels.font.family = selectedFont;
        chartInstance.update();
    }

    if (pieChartInstance) {
        pieChartInstance.options.plugins.title.font.family = selectedFont;
        pieChartInstance.options.plugins.legend.labels.font.family = selectedFont;
        pieChartInstance.update();
    }
}

function renderChart() {
    let encryptedData = localStorage.getItem(account_name + "-expenses");
    let data = data_decrypt(encryptedData);

    // 獲取當前月份的天數
    const daysInMonth = new Date(
        currentDisplayMonth.getFullYear(),
        currentDisplayMonth.getMonth() + 1,
        0
    ).getDate();

    const selectedMonthData = getMonthlyData(data, currentDisplayMonth, false);
    const selectedMonthWithScheduled = getMonthlyData(data, currentDisplayMonth, true);

    const lastMonth = new Date(currentDisplayMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthData = getMonthlyData(data, lastMonth, false);

    const ctx = document.getElementById("lineChart").getContext("2d");

    if (chartInstance) {
        chartInstance.data.labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        chartInstance.data.datasets[0].data = selectedMonthData.slice(0, daysInMonth);
        chartInstance.data.datasets[1].data = lastMonthData.slice(0, daysInMonth);
        chartInstance.data.datasets[2].data = selectedMonthWithScheduled.slice(0, daysInMonth);
        chartInstance.options.plugins.title.text =
            `${currentDisplayMonth.getFullYear()}年${currentDisplayMonth.getMonth() + 1}月支出趨勢圖`;
        chartInstance.update();
    } else {
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: daysInMonth }, (_, i) => i + 1),
                datasets: [
                    {
                        label: "本月 (實際收支)",
                        data: selectedMonthData.slice(0, daysInMonth),
                        borderColor: "orange",
                        fill: false
                    },
                    {
                        label: "上月 (實際收支)",
                        data: lastMonthData.slice(0, daysInMonth),
                        borderColor: "yellow",
                        fill: false
                    },
                    {
                        label: "本月 (含預約紀錄)",
                        data: selectedMonthWithScheduled.slice(0, daysInMonth),
                        borderColor: "blue",
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '日期 (日)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: '金額 (元)'
                        },
                        ticks: {
                            stepSize: 1000
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            font: {
                                family: "Arial"
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: "月支出趨勢圖",
                        font: {
                            family: "Arial"
                        }
                    }
                }
            }
        });
    }
}
// 初始化，填充下拉選單
function initializeCategorySelector() {
    let encryptedData = localStorage.getItem(account_name + "-expenses");
    let data = data_decrypt(encryptedData);
    const uniqueCategories = Array.from(new Set(data.map(expense => expense.category)));
    const selectElement = document.getElementById("category-select");
    selectElement.innerHTML = ""; // 確保不會重複添加選項
    const allOption = document.createElement("option");
    allOption.value = "";
    allOption.textContent = "全部";
    selectElement.appendChild(allOption);
    uniqueCategories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        selectElement.appendChild(option);
    });

    // 監聽下拉選單的變化
    selectElement.addEventListener("change", () => {
        generateComparison(selectElement.value);
    });

    // 初次生成圖表
    generateComparison("");
}
// 根據選擇的類別生成圖表
function generateComparison(selectedCategory) {
    let encryptedData = localStorage.getItem(account_name + "-expenses");
    let data = data_decrypt(encryptedData);

    // 使用 currentDisplayMonth 作為當前月份
    const currentMonth = currentDisplayMonth.toISOString().slice(0, 7);

    // 計算上個月
    const lastMonth = new Date(currentDisplayMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);

    // 過濾本月與上月數據
    const currentMonthData = data.filter(
        expense =>
            expense.date.startsWith(currentMonth) &&
            (selectedCategory === "" || expense.category === selectedCategory)
    );
    const lastMonthData = data.filter(
        expense =>
            expense.date.startsWith(lastMonthStr) &&
            (selectedCategory === "" || expense.category === selectedCategory)
    );

    // 計算每個類別的支出總額
    function calculateCategoryTotals(expenses) {
        return expenses.reduce((totals, expense) => {
            if (!totals[expense.category]) {
                totals[expense.category] = 0;
            }
            const amount = expense.category === "薪水" ?
                expense.amount : Math.abs(expense.amount);
            totals[expense.category] += amount;
            return totals;
        }, {});
    }

    const currentMonthTotals = calculateCategoryTotals(currentMonthData);
    const lastMonthTotals = calculateCategoryTotals(lastMonthData);

    // 獲取類別（僅擇的類別或全部）
    const allCategories = selectedCategory
        ? [selectedCategory]
        : Array.from(new Set([...Object.keys(currentMonthTotals), ...Object.keys(lastMonthTotals)]));

    // 准備圖表數據
    const currentMonthValues = allCategories.map(category => currentMonthTotals[category] || 0);
    const lastMonthValues = allCategories.map(category => lastMonthTotals[category] || 0);

    // 計算百分比變化
    const percentageChanges = allCategories.map(category => {
        const lastMonthValue = lastMonthTotals[category] || 0;
        const currentMonthValue = currentMonthTotals[category] || 0;
        if (lastMonthValue === 0) {
            return currentMonthValue === 0 ? 0 : 100; // 如果上月和本月都是 0，變化為 0%；如果上月是 0，本月非 0，變化為 100%
        }
        return ((currentMonthValue - lastMonthValue) / Math.abs(lastMonthValue)) * 100;
    });

    // 檢查是否有現存的圖表，並銷毀它
    const chartCanvas = document.getElementById("comparison-chart");
    if (chartCanvas.chartInstance) {
        chartCanvas.chartInstance.destroy();
    }
    const ctx = document.getElementById("comparison-chart").getContext("2d");
    const currentChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: allCategories,
            datasets: [
                {
                    label: "本月",
                    data: currentMonthValues,
                    backgroundColor: "orange",
                    borderWidth: 1,
                    borderRadius: 15, // 設定柱狀圖圓角
                    borderSkipped: false, // 使柱狀圖的頭尾圓潤
                },
                {
                    label: "上月",
                    data: lastMonthValues,
                    backgroundColor: "yellow",
                    borderWidth: 1,
                    borderRadius: 15,
                    borderSkipped: false,
                },
            ],
        },
        options: {
            indexAxis: "y", // 橫向柱狀圖
            responsive: true,

            scales: {
                x: {
                    beginAtZero: true,
                    reverse: true, // X 軸反轉，實現由右到左
                },
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
    // 保存當前圖表實例到畫布元素
    document.getElementById("comparison-chart").chartInstance = currentChart;
    // 顯示百分比比結果
    const comparisonResult = allCategories
        .map((category, index) => {
            const percentage = percentageChanges[index].toFixed(2); // 保留兩位小數
            return `${category}: ${percentage >= 0 ? "+" : ""}${percentage}%`;
        })
        .join("<br>");
    document.getElementById("comparison-result").innerHTML = "比較結果（百分比）：<br>" + comparisonResult;
}

function addExpenseWithCategory(category) {
    const expenseDate = document.getElementById("expenseDate").value;
    const expenseAmount = parseFloat(document.getElementById("expenseAmount").value);
    const expenseNote = document.getElementById("expenseNote").value || "無備註";
    const today = new Date().toISOString().split("T")[0];

    if (!expenseAmount || isNaN(expenseAmount)) {
        alert("請輸入有效的金額！");
        return;
    }

    if (!expenseDate) {
        alert("請選擇日期！");
        return;
    }

    const isIncome = category === "薪水" || category === "bonus";
    const expenseType = expenseDate > today ? "scheduled" : "actual";

    const expense = {
        date: expenseDate,
        amount: isIncome ? Math.abs(expenseAmount) : -Math.abs(expenseAmount),
        category: category,
        note: expenseNote,
        type: expenseType
    };

    let encryptedData = localStorage.getItem(account_name + "-expenses");
    let data = data_decrypt(encryptedData);
    data.push(expense);
    ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), account_name+"-expenses").toString();
    localStorage.setItem(account_name+"-expenses", ciphertext);

    alert( expenseType === "scheduled" ? "預約支出/收入已新增！" : "支出/收入已新增！");

    // 清空表單輸入欄位
    document.getElementById("expenseDate").value = today;
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseNote").value = "";

    // 更新視圖
    renderTodayExpenses();
    displaySummary();
    renderChart();
    renderPieChart();
    initializeCategorySelector();
}

// 在頁面載入時設置日期預設值為今天
document.addEventListener("DOMContentLoaded", () => {
    const expenseDateInput = document.getElementById("expenseDate");
    const today = new Date().toISOString().split("T")[0];
    expenseDateInput.value = today;
});

function renderPieChart() {
    let encryptedData = localStorage.getItem(account_name + "-expenses");
    let data = data_decrypt(encryptedData);
    // 使用 currentDisplayMonth 替代當前月份
    const currentMonth = currentDisplayMonth.toISOString().slice(0, 7);
    const today = new Date().toISOString().split("T")[0];

    // 過濾選中月份的資料
    const filteredData = data.filter(expense => {
        if (expense.category === "薪水") return false;
        if (expense.type === "scheduled" && expense.date === today) return true;
        return expense.date.startsWith(currentMonth);
    });

    // 計算類別總支出
    const categoryTotals = {};
    filteredData.forEach(expense => {
        categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + Math.abs(expense.amount);
    });

    const ctx = document.getElementById("pieChart").getContext("2d");

    if (pieChartInstance) {
        pieChartInstance.data.labels = Object.keys(categoryTotals);
        pieChartInstance.data.datasets[0].data = Object.values(categoryTotals);
        pieChartInstance.update();
    } else {
        pieChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
                    backgroundColor: ["#640D5F", "#D91656", "#EB5B00", "#FFB200", "#0066CC","#8B3A62","#F06277","#FF914D","#FFD966","#0082C8"],   
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "top",
                        labels: {
                            font: {
                                family: "Arial"
                            }
                        }
                    },
                    title: {
                        display: true,
                        text: "本月支出比例 (含今日預約扣款)",
                        font: {
                            family: "Arial"
                        }
                    }
                }
            }
        });
    }
}


function renderTodayExpenses() {
    let encryptedData = localStorage.getItem(account_name + "-expenses");
    let data = data_decrypt(encryptedData);
    
    const selectedMonth = currentDisplayMonth.toISOString().slice(0, 7); // 獲取選中月份 YYYY-MM 格式

    // 過濾中月份的支出
    const monthlyExpenses = data.filter(expense => expense.date.startsWith(selectedMonth));

    // 按日期升序排列
    const sortedExpenses = monthlyExpenses.sort((a, b) => new Date(a.date) - new Date(b.date));

    let expenseList = document.getElementById("expenseList");
    // 果該月沒有支出記
    if (sortedExpenses.length === 0) {
        expenseList.innerHTML = '<div class="no-expenses">本月尚無支出記錄</div>';
        
        return;
    }

    // 生成表格形式的支出列表
    const tableHTML = `
        <table class="expense-table">
            <thead>
                <tr>
                    <th>選擇</th>
                    <th>日期</th>
                    <th>類型</th>
                    <th>類別</th>
                    <th>金額</th>
                    <th>備註</th>
                </tr>
            </thead>
            <tbody>
                ${sortedExpenses.map((expense, index) => `
                    <tr>
                        <td><input type="checkbox" id="expense-${index}"></td>
                        <td>${expense.date}</td>
                        <td>${expense.category === "薪水" || expense.category === "bonus" ? "實際收入" : (expense.type === "scheduled" ? "預約扣款" : "實際支出")}</td>
                        <td>${expense.category}</td>
                        <td>${Math.abs(expense.amount)} 元</td>
                        <td>${expense.note}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    expenseList.innerHTML = tableHTML;
    
}


function clearSelected() {
    const checkboxes = document.querySelectorAll("input[type='checkbox']:checked");
    let encryptedData = localStorage.getItem(account_name + "-expenses");
    let data = data_decrypt(encryptedData);

    checkboxes.forEach(checkbox => {
        const index = checkbox.id.split("-")[1];
        data.splice(index, 1); // 根據索引除對應支出
    });

    ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), account_name+"-expenses").toString();
    localStorage.setItem(account_name+"-expenses", ciphertext);
    renderTodayExpenses(); // 重新渲支出列表
    displaySummary(); // 更新月總結
    renderChart(); // 更新折線圖
    renderPieChart(); // 更新圓餅圖
}

function displaySummary() {
    let encryptedData = localStorage.getItem(account_name + "-expenses");
    let data = data_decrypt(encryptedData);
    const today = new Date();
    const month = today.toISOString().slice(0, 7);
    const todayDate = today.toISOString().split("T")[0];

    // 當月資料
    const monthlyExpenses = data.filter(expense => expense.date.startsWith(month));

    // 獲取薪水和 bonus 總額
    const income = monthlyExpenses
        .filter(expense => (expense.category === "薪水" || expense.category === "bonus") && expense.type === "actual")
        .reduce((sum, expense) => sum + expense.amount, 0);

    // 實際支出 (負數，非薪水和非 bonus)
    const actualExpenses = monthlyExpenses
        .filter(expense => expense.type === "actual" && expense.category !== "薪水" && expense.category !== "bonus")
        .reduce((sum, expense) => sum + expense.amount, 0);

    // 當日預約扣款 (負)
    const todayScheduledExpenses = data
        .filter(expense => expense.type === "scheduled" && expense.date === todayDate)
        .reduce((sum, expense) => sum + expense.amount, 0);

    // 剩餘金額 = 收入(薪水+bonus) - 實際支出 - 當日預約扣款
    let remaining = income - Math.abs(actualExpenses) - Math.abs(todayScheduledExpenses);

    // 更新顯示
    document.getElementById("todayDate").textContent = "今日日期：" + todayDate;
    document.getElementById("monthlyTotal").textContent = "本月總消費金額：" + Math.abs(actualExpenses + todayScheduledExpenses) + " 元";
    document.getElementById("monthlyRemaining").textContent = "本月剩餘金額：" + remaining + " 元";
}


function init() {
    let encryptedData = localStorage.getItem(account_name + "-expenses");
    let data = data_decrypt(encryptedData);
    const today = new Date().toISOString().split("T")[0];

    // 檢查當日預約扣款，並將其轉為實際支出
    let updated = false;
    data.forEach(expense => {
        if (expense.type === "scheduled" && expense.date === today) {
            expense.type = "actual"; // 更新為實際支出
            updated = true;
        }
    });

    if (updated) {
        ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), account_name+"-expenses").toString();
        localStorage.setItem(account_name+"-expenses", ciphertext); // 保存變更
    }

    // 依次更新視圖
    generateComparison(document.getElementById("category-select").value);
    renderTodayExpenses();
    displaySummary();
    renderChart();
    renderPieChart(); // 確保圓餅圖更新
    updateMonthDisplay(); // 添加這行
    //renderScheduledExpenses(); // 更新預約扣款列表
    
}

function showOtherCharts() {
    const additionalCharts = document.getElementById('additional-charts');
    const chartsContainer = document.querySelector('.charts-container');
    additionalCharts.classList.add('visible');
    chartsContainer.classList.add('expanded');
}

function hideOtherCharts() {
    const additionalCharts = document.getElementById('additional-charts');
    const chartsContainer = document.querySelector('.charts-container');
    additionalCharts.classList.remove('visible');
    chartsContainer.classList.remove('expanded');
}

function changeMonth(delta) {
    currentDisplayMonth.setMonth(currentDisplayMonth.getMonth() + delta);
    updateMonthDisplay();
    renderChart();
    renderPieChart();
    generateComparison(document.getElementById("category-select").value);
    renderTodayExpenses();
}

function updateMonthDisplay() {
    const monthNames = ["一月", "二月", "三月", "四月", "五月", "六月",
        "七月", "八月", "九月", "十月", "十一月", "十二月"];
    document.getElementById("currentMonthDisplay").textContent =
        `${currentDisplayMonth.getFullYear()}年 ${monthNames[currentDisplayMonth.getMonth()]}`;
}

function getMonthlyData(data, date, includeScheduled) {
    const month = date.toISOString().slice(0, 7);
    const today = new Date().toISOString().split("T")[0];
    const daysInMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
    ).getDate();

    const dailyTotals = Array(daysInMonth).fill(0);

    data.filter(expense => expense.date.startsWith(month))
        .forEach(expense => {
            const day = parseInt(expense.date.split("-")[2]);
            if (!includeScheduled && expense.type === "scheduled" && expense.date !== today) return;
            if (day <= daysInMonth) { // 確保日期在當月範圍內
                dailyTotals[day - 1] += expense.amount;
            }
        });

    return dailyTotals;
}

function addAmount(value) {
    const amountInput = document.getElementById("expenseAmount");
    const currentAmount = parseFloat(amountInput.value) || 0;
    amountInput.value = currentAmount + value;
}

function data_decrypt(encryptedData) {
    if (encryptedData) {
        return JSON.parse(CryptoJS.AES.decrypt(encryptedData, account_name+"-expenses").toString(CryptoJS.enc.Utf8));
    }
    else {
        return [];
    }
}

function getHoroscope() {
    const horoscope = document.getElementById("horoscope").value;
    const url = "horoscope?name=${horoscope}"; // 指向代理伺服器

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const resultDiv = document.getElementById("result");
            resultDiv.innerHTML = ""; // 清空之前的內容

            if (data.code === 200) {
                let h = document.createElement("h3");
                convertToTraditional(data.data.horoscope, h); // 使用轉繁體函數
                setTimeout(() => {
                    h.innerHTML += "分析";
                }, 700);
                resultDiv.appendChild(h);

                let text = document.createElement("p");
                convertToTraditional(data.data.contentFortune, text);
                resultDiv.appendChild(text);
            } else {
                resultDiv.innerHTML = `<p>太過頻繁，請十秒後再試。</p>`;
            }
        })
        .catch(error => {
            console.error("Error:", error);
            document.getElementById("result").innerHTML = '<p>查詢失敗，請稍後再試。</p>';
        });
}

function convertToTraditional(simplifiedText, parent) {
    const proxyUrl = "convert"; // 指向代理伺服器
    const data = {
        text: simplifiedText,
        converter: "Taiwan"
    };

    fetch(proxyUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        if (data.data.text === "白羊座") {
            data.data.text = "牡羊座";
        }
        parent.innerHTML += data.data.text;
    })
    .catch(error => console.error("Error:", error));
}

window.addEventListener("message", (event) => {
    account_name = event.data || "未接收到值";
    init();
});
window.addEventListener("load", initializeCategorySelector, false);

window.addEventListener("load", getHoroscope, false);
