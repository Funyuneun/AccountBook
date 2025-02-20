let rowCount = 1;
let itemOptions = []; // 儲存從 Google Sheets 取得的項目選項
const scriptUrl = "https://script.google.com/macros/s/AKfycbznllpLnhuXFDf_5zlx4UDYY-ownczQpVbe9aNyAH5cl7A2qvMm0moTFa-7aI51dpT7/exec";

// 計算金額總和
function updateTotalAmount() {
    let totalAmount = 0;
    document.querySelectorAll('.amount').forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val)) totalAmount += val;
    });
    document.getElementById('total-amount').innerText = `◖總金額：${totalAmount} 元◗`;
    checkExpenseData();
}

// 初始載入時檢查
window.onload = function () {
    checkExpenseData();
    fetchItemOptions();
    // 為第一筆的「項目」欄位啟用自動完成
    const firstItem = document.getElementById("item-1");
    if (firstItem) {
        setupAutocompleteForItem(firstItem);
    }
};

// 檢查是否有填寫支出資料，並更新提交按鈕狀態
function checkExpenseData() {
    let hasExpense = false;
    for (let i = 1; i <= rowCount; i++) {
        const amount = document.getElementById(`amount-${i}`)?.value;
        if (amount) {
            hasExpense = true;
            break;
        }
    }
    const submitButton = document.querySelector('.submit-button');
    submitButton.disabled = !hasExpense;
}

// 切換該行金額欄計算功能的按鈕列
function toggleCalculator(rowId) {
    let panel = document.getElementById(`buttonPanel-${rowId}`);
    let input = document.getElementById(`amount-${rowId}`);
    panel.classList.toggle("active");
    input.focus();
}

// 插入運算符號，若 symbol 為 '()' 則插入括號並將光標定位在中間
function insertSymbol(rowId, symbol) {
    let input = document.getElementById(`amount-${rowId}`);
    let start = input.selectionStart;
    let end = input.selectionEnd;
    let text = input.value;
    if (symbol === '()') {
        input.value = text.slice(0, start) + "()" + text.slice(end);
        input.selectionStart = input.selectionEnd = start + 1;
    } else {
        input.value = text.slice(0, start) + symbol + text.slice(end);
        input.selectionStart = input.selectionEnd = start + symbol.length;
    }
    input.focus();
}

// 計算輸入運算式的結果（四捨五入、負數轉 0）
function calculateResult(rowId) {
    let input = document.getElementById(`amount-${rowId}`);
    try {
        let result = eval(input.value);
        result = Math.round(result);
        if (result < 0 || isNaN(result)) result = 0;
        input.value = result;
    } catch (e) {
        input.value = "錯誤";
    }
    input.focus();
    updateTotalAmount();
}

// 清空該行金額輸入欄
function clearInput(rowId) {
    let input = document.getElementById(`amount-${rowId}`);
    input.value = "";
    input.focus();
}

// 當點擊頁面其他區域時，隱藏所有計算按鈕列（但排除 toggle 按鈕點擊）
document.addEventListener("click", function (event) {
    document.querySelectorAll(".buttons").forEach(panel => {
        if (!panel.contains(event.target) && !event.target.classList.contains("toggle-button")) {
            panel.classList.remove("active");
        }
    });
});

// 在 script.js 添加以下函數
function handleAmountEnter(event, input) {
    if (event.key === 'Enter') {
        event.preventDefault(); // 阻止默認換行行為
        try {
            const result = eval(input.value.replace(/[^0-9+\-*/().]/g, '')); // 安全過濾
            input.value = parseFloat(result.toFixed(2)); // 保留兩位小數
            updateTotalAmount();
        } catch (e) {
            alert('計算錯誤，請輸入有效算式 (例如：100+50*2)');
            input.value = '';
        }
        input.focus(); // 保持焦點在當前輸入框
    }
}

// 新增一行
function addRow() {
    rowCount++;
    const formRows = document.getElementById('form-rows');
    const newRow = document.createElement('div');
    newRow.classList.add('row');
    newRow.id = `row-${rowCount}`;
    newRow.innerHTML = `
        <div class="row-top">
            <div class="form-group" style="flex: 2;">
                <label for="amount-${rowCount}"><i class="ri-money-dollar-circle-fill"></i> 金額 *</label>
                <div class="amount-container">
        <input type="text" id="amount-${rowCount}" class="amount" name="amount[]" required 
    onkeydown="handleAmountEnter(event, this)"
    oninput="updateTotalAmount()">
                    <button type="button" class="toggle-button" onclick="toggleCalculator(${rowCount})">🧮</button>
                </div>
                <div class="buttons" id="buttonPanel-${rowCount}">
                    <button type="button" onclick="insertSymbol(${rowCount}, '+')"><i class="ri-add-line"></i></button>
                    <button type="button" onclick="insertSymbol(${rowCount}, '-')"><i class="ri-subtract-line"></i></button>
                    <button type="button" onclick="insertSymbol(${rowCount}, '*')"><i class="ri-close-line"></i></button>
                    <button type="button" onclick="insertSymbol(${rowCount}, '/')"><i class="ri-divide-line"></i></button>
                    <button type="button" onclick="insertSymbol(${rowCount}, '()')"><i class="ri-brackets-line"></i></button>
                    <button type="button" onclick="calculateResult(${rowCount})"><i class="ri-equal-line"></i></button>
                    <button type="button" onclick="clearInput(${rowCount})"><i class="ri-delete-back-2-fill"></i></button>
                </div>
            </div>
            <div class="form-group" style="flex: 1;">
                <label for="category-${rowCount}"><i class="ri-bookmark-3-fill"></i> 類型*<span class="info-icon" onclick="showCategoryInfo()">ℹ️</span></label>
                <select id="category-${rowCount}" class="category" name="category[]" required>
                                <option value="">-- 支出類別 --</option>
                                <option value="伙食費">🍔伙食費</option>
                                <option value="日用品">👕日用品</option>
                                <option value="醫療費">💊醫藥品</option>
                                <option value="交際費">🎭交際費</option>
                                <option value="娛樂費">😀娛樂費</option>
                                <option value="特別費">💎特別費</option>
                                <option value="其它">➕其它</option>
                            </select>
            </div>
        </div>
        <div class="row-middle">
            <div class="form-group" style="flex: 2">
                <label for="item-${rowCount}"><i class="ri-file-list-3-fill"></i> 項目</label>
                <div class="autocomplete-wrapper" style="position: relative;">
                    <input type="text" id="item-${rowCount}" class="item" name="item[]" autocomplete="off">
                    <div class="autocomplete-dropdown" style="display: none; position: absolute; background-color: #f9f9f9; min-width: 100%; box-shadow: 0px 8px 16px rgba(0,0,0,0.2); z-index: 100;"></div>
                </div>
            </div>
            <div class="form-group">
                <label for="payment-${rowCount}"><i class="ri-refund-fill"></i> 支付</label>
                <select id="payment-${rowCount}" class="payment" name="payment[]">
                    <option value="">-- 支付方式 --</option>
                    <option value="台新">台新</option>
                    <option value="現金">現金</option>
                    <option value="一銀">一銀</option>
                    <option value="中信">中信</option>
                </select>
            </div>
        </div>
        <div class="row-bottom">
            <div class="form-group merchant-group">
                <label for="merchant-${rowCount}"><i class="ri-store-3-fill"></i> 商家　</label>
                <select id="merchant-${rowCount}" class="merchant" name="merchant[]" onchange="toggleOtherMerchantInput(this)">
                    <option value="">-- 購買商家 --</option>
                    <option value="全家">全家</option>
                    <option value="里仁">里仁</option>
                    <option value="全聯">全聯</option>
                    <option value="蝦皮">蝦皮</option>
                    <option value="德克士">德克士</option>
                    <option value="麥當勞">麥當勞</option>
                    <option value="7-11">7-11</option>
                    <option value="PChome">PChome</option>
                    <option value="其他">其他</option>
                </select>
                <input type="text" class="otherMerchant" name="otherMerchant[]" style="display:none;" placeholder="請填寫商家名稱">
            </div>
            <button type="button" class="remove-btn" onclick="removeRow(${rowCount})"><i class="ri-delete-bin-line"></i> 刪除</button>
        </div>
    `;
    formRows.appendChild(newRow);
    checkExpenseData();
    const newItem = document.getElementById(`item-${rowCount}`);
    if (newItem) {
        setupAutocompleteForItem(newItem);
    }
}

// 刪除指定行
function removeRow(rowId) {
    const row = document.getElementById(`row-${rowId}`);
    row.remove();
    updateTotalAmount(); // 刪除行後更新總金額
    checkExpenseData();
}

// 切换商家输入框的显示状态
function toggleOtherMerchantInput(selectElement) {
    const row = selectElement.closest('.row');
    const otherMerchantInput = row.querySelector('.otherMerchant');

    if (selectElement.value === "其他") {
        otherMerchantInput.style.display = "block"; // 显示输入框
        otherMerchantInput.required = true; // 设置为必填
    } else {
        otherMerchantInput.style.display = "none"; // 隐藏输入框
        otherMerchantInput.required = false; // 取消必填
    }
}

// 處理表單提交
document.getElementById('expenseForm').onsubmit = function (event) {
    event.preventDefault();

    // 顯示 Loading 效果
    document.getElementById('loading').style.display = 'flex';

    const formData = new FormData(event.target);
    const expenseItems = document.querySelectorAll('.row');
    let submittedCount = 0;

    expenseItems.forEach(item => {
        let merchantValue = item.querySelector('.merchant').value;
        const otherMerchantValue = item.querySelector('.otherMerchant').value;

        if (merchantValue === '其他' && otherMerchantValue) {
            merchantValue = otherMerchantValue;
        }

        const params = new URLSearchParams({
            category: item.querySelector('.category').value,
            item: item.querySelector('.item').value,
            amount: item.querySelector('.amount').value,
            payment: item.querySelector('.payment').value,
            merchant: merchantValue,
        }).toString();

        fetch(scriptUrl + "?action=add&" + params)
            .then(response => response.text())
            .then(data => {
                submittedCount++;
                if (submittedCount === expenseItems.length) {
                    // 隱藏 Loading 效果
                    document.getElementById('loading').style.display = 'none';

                    document.getElementById('expenseForm').style.display = 'none';
                    document.getElementById('overlay').style.display = 'flex';
                }
            })
            .catch(error => {
                // 隱藏 Loading 效果
                document.getElementById('loading').style.display = 'none';

                alert('提交時發生錯誤，請稍後再試');
                console.error('Error:', error);
            });
    });
};

// 清空表單資料
function clearForm() {
    for (let i = 1; i <= rowCount; i++) {
        document.getElementById(`item-${i}`).value = '';
        document.getElementById(`amount-${i}`).value = '';
        document.getElementById(`category-${i}`).value = ''; // 清空類別選擇
        document.getElementById(`payment-${i}`).value = ''; // 清空支付方式選擇
        document.getElementById(`merchant-${i}`).value = ''; // 清空商家選擇
        const otherMerchantInput = document.getElementById(`merchant-${i}`).closest('.row').querySelector('.otherMerchant');
        if (otherMerchantInput) {
            otherMerchantInput.style.display = 'none'; // 隱藏 "其他商家" 輸入框
            otherMerchantInput.value = ''; // 清空 "其他商家" 輸入框的值
        }
    }
    updateTotalAmount(); // 清空後更新總金額
}

// 繼續填寫表單
function continueFilling() {
    // 隱藏遮罩和彈窗
    document.getElementById('overlay').style.display = 'none';

    // 重新顯示表單
    document.getElementById('expenseForm').style.display = 'block';

    // 重置表單
    document.getElementById('expenseForm').reset();

    // 清空表單
    clearForm();
}

// 查看家計簿
function viewSpreadsheet() {
    window.open('https://docs.google.com/spreadsheets/d/1-9jGuyXQsBmb_R_YgcFcGaEE0cmjNplfklivnRHoZ9E/edit?gid=187669044#gid=187669044', '_blank');
}

// 顯示測試彈跳視窗
function showTestPopup() {
    document.getElementById('overlay').style.display = 'flex';
}

// 顯示類型說明彈跳視窗
function showCategoryInfo() {
    document.getElementById('categoryInfoOverlay').style.display = 'flex';
}

// 隱藏類型說明彈跳視窗
function hideCategoryInfo() {
    document.getElementById('categoryInfoOverlay').style.display = 'none';
}

// 表單驗證：高亮顯示第一個未填寫的必填欄位
document.getElementById('expenseForm').addEventListener('invalid', function (event) {
    event.preventDefault(); // 阻止表單預設提交行為

    // 找到第一個未填寫的必填項目
    const firstInvalidField = event.target.querySelector(':invalid');

    if (firstInvalidField) {
        // 將該項目滾動到螢幕可見區域
        firstInvalidField.scrollIntoView({
            behavior: 'smooth'
        });
    }
});

// iOS 全螢幕顯示
if (window.navigator.standalone) {
    document.documentElement.requestFullscreen();
}

// ===== 以下為「項目」欄位自動完成功能 =====

// 從 Apps Script 取得「項目」欄位的選項（去重且排序後）
function fetchItemOptions() {
    fetch(scriptUrl + "?action=getDropdownOptions")
        .then(response => response.json())
        .then(data => {
            itemOptions = data;
            // 如果有項目輸入框正聚焦，更新其下拉選單
            const activeInput = document.activeElement;
            if (activeInput && activeInput.classList.contains("item")) {
                filterItemOptions(activeInput);
            }
        })
        .catch(error => console.error("Error fetching item options:", error));
}

function showItemDropdown(inputEl) {
    const wrapper = inputEl.parentElement;
    const dropdown = wrapper.querySelector(".autocomplete-dropdown");
    dropdown.innerHTML = "";
    if (itemOptions.length === 0) {
        const div = document.createElement("div");
        div.textContent = "🔄️讀取中...";
        div.style.padding = "8px";
        dropdown.appendChild(div);
        dropdown.style.display = "block";
        return;
    }
    let filterValue = inputEl.value;
    let filteredOptions = itemOptions.filter(option => option.includes(filterValue));
    filteredOptions.forEach(option => {
        const div = document.createElement("div");
        div.textContent = option;
        div.style.padding = "8px";
        div.style.cursor = "pointer";
        div.onclick = function () {
            inputEl.value = option;
            dropdown.style.display = "none";
        };
        dropdown.appendChild(div);
    });
    dropdown.style.display = filteredOptions.length > 0 ? "block" : "none";
}

function filterItemOptions(inputEl) {
    showItemDropdown(inputEl);
}

function setupAutocompleteForItem(inputEl) {
    inputEl.addEventListener("focus", function () {
        showItemDropdown(inputEl);
    });
    inputEl.addEventListener("input", function () {
        filterItemOptions(inputEl);
    });
}

// 當點擊頁面其他區域時，隱藏所有 autocomplete 下拉選單
document.addEventListener("click", function (event) {
    document.querySelectorAll(".autocomplete-wrapper").forEach(wrapper => {
        if (!wrapper.contains(event.target)) {
            const dropdown = wrapper.querySelector(".autocomplete-dropdown");
            if (dropdown) {
                dropdown.style.display = "none";
            }
        }
    });
});
