let chartInstance = null;
let pieChartInstance = null;

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
    const data = JSON.parse(localStorage.getItem("expenses")) || [];
    const thisMonth = getMonthlyData(data, new Date(), true);
    const lastMonth = getMonthlyData(data, new Date(new Date().setMonth(new Date().getMonth() - 1)), true);

    // 包含預約扣款與實際支出的資料
    const thisMonthWithScheduled = getMonthlyData(data, new Date(), false);

    const ctx = document.getElementById("lineChart").getContext("2d");

    if (chartInstance) {
        chartInstance.data.datasets[0].data = thisMonth;
        chartInstance.data.datasets[1].data = lastMonth;
        chartInstance.data.datasets[2].data = thisMonthWithScheduled;
        chartInstance.update();
    } else {
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: 31 }, (_, i) => i + 1),
                datasets: [
                    {
                        label: "本月 (實際支出)",
                        data: thisMonth,
                        borderColor: "orange",
                        fill: false
                    },
                    {
                        label: "上月 (實際支出)",
                        data: lastMonth,
                        borderColor: "yellow",
                        fill: false
                    },
                    {
                        label: "本月 (含預約扣款)",
                        data: thisMonthWithScheduled,
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
    const data = JSON.parse(localStorage.getItem("expenses")) || [];
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
    const data = JSON.parse(localStorage.getItem("expenses")) || [];
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7); // 本月
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        .toISOString()
        .slice(0, 7); // 上月

    // 濾本月與上月數據
    const currentMonthData = data.filter(
        expense =>
            expense.date.startsWith(currentMonth) &&
            (selectedCategory === "" || expense.category === selectedCategory)
    );
    const lastMonthData = data.filter(
        expense =>
            expense.date.startsWith(lastMonth) &&
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

    // 獲取類別（僅選擇的類別或全部）
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
    // 顯示百分比比較結果
    const comparisonResult = allCategories
        .map((category, index) => {
            const percentage = percentageChanges[index].toFixed(2); // 保留兩位小數
            return `${category}: ${percentage >= 0 ? "+" : ""}${percentage}%`;
        })
        .join("<br>");
    document.getElementById("comparison-result").innerHTML = "比較結果（百分比）：<br>" + comparisonResult;
}

// 初始化
initializeCategorySelector();



function addExpense() {
    const expenseAmount = parseFloat(document.getElementById("expenseAmount").value);
    const expenseNote = document.getElementById("expenseNote").value || "無備註";
    const expenseCategory = document.querySelector("input[name='expenseCategory']:checked");

    if (!expenseAmount || isNaN(expenseAmount)) {
        alert("請輸入有效的金額！");
        return;
    }

    if (!expenseCategory) {
        alert("請選擇一個類別！");
        return;
    }

    const isSalary = expenseCategory.value === "薪水";

    const expense = {
        date: new Date().toISOString().split("T")[0],
        amount: isSalary ? Math.abs(expenseAmount) : -Math.abs(expenseAmount),
        category: expenseCategory.value,
        note: expenseNote,
        type: "actual" // 實際支出
    };

    let data = JSON.parse(localStorage.getItem("expenses")) || [];
    data.push(expense);
    localStorage.setItem("expenses", JSON.stringify(data));

    alert("支出已新增！");

    // 清空表單輸入欄位
    document.getElementById("expenseAmount").value = "";
    document.getElementById("expenseNote").value = "";
    if (expenseCategory) {
        expenseCategory.checked = false; // 清除選中類別
    }

    // 更新視圖
    renderTodayExpenses();
    displaySummary();
    renderChart();
    renderPieChart();
}


function addScheduledExpense() {
    const scheduledDateInput = document.getElementById("scheduledDate");
    const scheduledDate = scheduledDateInput.value;
    const scheduledAmount = parseFloat(document.getElementById("scheduledAmount").value);
    const scheduledCategoryInput = document.getElementById("scheduledCategory");
    const scheduledCategory = scheduledCategoryInput ? scheduledCategoryInput.value : "預約扣款";
    const scheduledNote = document.getElementById("scheduledNote").value || "無備註";

    // 日期檢查 - 前端限制
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 今日日期重置時間為 00:00:00
    const inputDate = new Date(scheduledDate);

    if (!scheduledDate || inputDate <= today) {
        alert("預約扣款的日期不能為當日或之前！請重新輸入有效日期。");
        return;
    }

    // 金額檢查
    if (isNaN(scheduledAmount) || scheduledAmount <= 0) {
        alert("請輸入有效的扣款金額！");
        return;
    }

    // 建立預約扣款資料
    const scheduledExpense = {
        date: scheduledDate,
        amount: -Math.abs(scheduledAmount),
        note: scheduledNote,
        category: scheduledCategory,
        type: "scheduled"
    };

    // 儲存本地資料
    let data = JSON.parse(localStorage.getItem("expenses")) || [];
    data.push(scheduledExpense);
    localStorage.setItem("expenses", JSON.stringify(data));

    alert("預約扣款已成功新增！");
    renderChart();
    renderPieChart(); // 即時更新圓餅圖
    renderScheduledExpenses(); // 即時更新預約列表
    displaySummary();
}

// 在 HTML 輸入中直接限制日期選擇
document.addEventListener("DOMContentLoaded", () => {
    const scheduledDateInput = document.getElementById("scheduledDate");
    const today = new Date().toISOString().split("T")[0]; // 取得今日的 YYYY-MM-DD 格式
    scheduledDateInput.setAttribute("min", today); // 限制最小日期為今日
});


function renderChart() {
    const data = JSON.parse(localStorage.getItem("expenses")) || [];
    const thisMonthActual = getMonthlyData(data, new Date(), false); // 僅實際支出
    const thisMonthWithScheduled = getMonthlyData(data, new Date(), true); // 包含預約扣款
    const lastMonth = getMonthlyData(data, new Date(new Date().setMonth(new Date().getMonth() - 1)), false);

    const ctx = document.getElementById("lineChart").getContext("2d");

    if (chartInstance) {
        chartInstance.data.datasets[0].data = thisMonthActual;
        chartInstance.data.datasets[1].data = lastMonth;
        chartInstance.data.datasets[2].data = thisMonthWithScheduled;
        chartInstance.update();
    } else {
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({ length: 31 }, (_, i) => i + 1),
                datasets: [
                    {
                        label: "本月 (實際支出)",
                        data: thisMonthActual,
                        borderColor: "orange",
                        fill: false
                    },
                    {
                        label: "上月 (實際支出)",
                        data: lastMonth,
                        borderColor: "yellow",
                        fill: false
                    },
                    {
                        label: "本月 (含預約扣款)",
                        data: thisMonthWithScheduled,
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

function addScheduledExpense() {
    const scheduledDate = document.getElementById("scheduledDate").value;
    const scheduledAmount = parseFloat(document.getElementById("scheduledAmount").value);
    const scheduledCategoryInput = document.getElementById("scheduledCategory");
    const scheduledCategory = scheduledCategoryInput ? scheduledCategoryInput.value : "預約扣款";
    const scheduledNote = document.getElementById("scheduledNote").value || "無備註";

    if (!scheduledDate || isNaN(scheduledAmount) || !scheduledCategory) {
        alert("請輸入有效的日期、金額與類別！");
        return;
    }

    const scheduledExpense = {
        date: scheduledDate,
        amount: -Math.abs(scheduledAmount),
        note: scheduledNote,
        category: scheduledCategory,
        type: "scheduled"
    };

    let data = JSON.parse(localStorage.getItem("expenses")) || [];
    data.push(scheduledExpense);
    localStorage.setItem("expenses", JSON.stringify(data));

    alert("預約扣款已新增");
    renderChart();
    renderPieChart(); // 即時更新圓餅圖
    renderScheduledExpenses(); // 即時更新預約列表
    displaySummary();
}


function getMonthlyData(data, date, includeScheduled) {
    const month = date.toISOString().slice(0, 7);
    const today = new Date().toISOString().split("T")[0];
    const dailyTotals = Array(31).fill(0);

    data.filter(expense => expense.date.startsWith(month))
        .forEach(expense => {
            const day = parseInt(expense.date.split("-")[2]);
            if (!includeScheduled && expense.type === "scheduled" && expense.date !== today) return; // 當日預約扣款計入
            dailyTotals[day - 1] += expense.amount;
        });

    return dailyTotals;
}

function renderPieChart() {
    const data = JSON.parse(localStorage.getItem("expenses")) || [];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().split("T")[0];

    // 過濾當月資料，並將當日的預約扣款計入實際支出
    const filteredData = data.filter(expense => {
        if (expense.category === "薪水") return false; // 排除薪水
        if (expense.type === "scheduled" && expense.date === today) return true; // 當日預約扣款計入
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
                    backgroundColor: ["#640D5F", "#D91656", "#EB5B00", "#FFB200", "#0066CC"],
                    hoverOffset: 4
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
    const data = JSON.parse(localStorage.getItem("expenses")) || [];

    // 按日期升序排列
    const sortedExpenses = data.sort((a, b) => new Date(a.date) - new Date(b.date));

    const expenseList = document.getElementById("expenseList");

    // 生成支出列表，顯示日期、類型、金額和備註
    expenseList.innerHTML = sortedExpenses.map((expense, index) =>
        `<div>
    <input type="checkbox" id="expense-${index}">
    <strong>${expense.date}</strong> (${expense.type === "scheduled" ? "預約扣款" : "實際支出"}) -
    ${expense.category}: ${Math.abs(expense.amount)} 元 - ${expense.note}
</div>`
    ).join("");
}


function clearSelected() {
    const checkboxes = document.querySelectorAll("input[type='checkbox']:checked");
    let data = JSON.parse(localStorage.getItem("expenses")) || [];

    checkboxes.forEach(checkbox => {
        const index = checkbox.id.split("-")[1];
        data.splice(index, 1); // 根據索引除對應支出
    });

    localStorage.setItem("expenses", JSON.stringify(data));
    renderTodayExpenses(); // 重新渲染支出列表
    displaySummary(); // 更新月總結
    renderChart(); // 更新折線圖
    renderPieChart(); // 更新圓餅圖
}

function renderScheduledExpenses() {
    const data = JSON.parse(localStorage.getItem("expenses")) || [];
    const scheduledExpenses = data.filter(expense => expense.type === "scheduled");

    const scheduledList = document.getElementById("scheduledList");

    if (scheduledExpenses.length === 0) {
        scheduledList.innerHTML = "<p>目前無預約扣款項目。</p>";
        return;
    }

    scheduledList.innerHTML = scheduledExpenses.map((expense, index) => `
<div>
    <input type="checkbox" id="scheduled-${index}">
    日期：${expense.date}，類型：${expense.category}，金額：${Math.abs(expense.amount)} 元
</div>
`).join("");
}

function displaySummary() {
    const data = JSON.parse(localStorage.getItem("expenses")) || [];
    const today = new Date();
    const month = today.toISOString().slice(0, 7);
    const todayDate = today.toISOString().split("T")[0];

    // 當月資料
    const monthlyExpenses = data.filter(expense => expense.date.startsWith(month));

    // 獲取薪水總額
    const salary = monthlyExpenses
        .filter(expense => expense.category === "薪水" && expense.type === "actual")
        .reduce((sum, expense) => sum + expense.amount, 0);

    // 實際支出 (負數，非薪水)
    const actualExpenses = monthlyExpenses
        .filter(expense => expense.type === "actual" && expense.category !== "薪水")
        .reduce((sum, expense) => sum + expense.amount, 0);

    // 當日預約扣款 (負)
    const todayScheduledExpenses = data
        .filter(expense => expense.type === "scheduled" && expense.date === todayDate)
        .reduce((sum, expense) => sum + expense.amount, 0);

    // 剩餘金額 = 薪水 - 實際支出 - 當日預約扣款
    const remaining = salary - Math.abs(actualExpenses) - Math.abs(todayScheduledExpenses);

    // 更新顯示
    document.getElementById("todayDate").textContent = "今日日期：" + todayDate;
    document.getElementById("monthlyTotal").textContent = "本月總消費金額：" + Math.abs(actualExpenses + todayScheduledExpenses) + " 元";
    document.getElementById("monthlyRemaining").textContent = "本月剩餘金額：" + remaining + " 元";
}


function init() {
    const data = JSON.parse(localStorage.getItem("expenses")) || [];
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
        localStorage.setItem("expenses", JSON.stringify(data)); // 保存變更
    }

    // 依次更新視圖
    renderTodayExpenses();
    displaySummary();
    renderChart();
    renderPieChart(); // 確保圓餅圖更新
    renderScheduledExpenses(); // 更新預約扣款列表
}

init();

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