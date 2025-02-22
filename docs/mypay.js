let rowCount = 1;
let itemOptions = []; // 儲存從 Google Sheets 取得的項目選項
const scriptUrl = "https://script.google.com/macros/s/AKfycbznllpLnhuXFDf_5zlx4UDYY-ownczQpVbe9aNyAH5cl7A2qvMm0moTFa-7aI51dpT7/exec";

// 通用的 fetchData 函式
async function fetchData(parameters) {
  const { action, updateData, updateOptions } = parameters;
  let apiUrl = scriptUrl;
  if (action) {
    apiUrl += `?action=${action}`;
  }
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // 更新月份、本月預算、本月花銷的顯示
    if (updateData) {
      document.getElementById("month").textContent = data.month || "未獲取";
      document.getElementById("expense").textContent = data.expense || "未獲取";
      document.getElementById("spending").textContent = data.spending || "未獲取";
    }

    // 更新下拉選項資料（例如項目選項）
    if (updateOptions && data) {
      itemOptions = data;
      // 如果有項目輸入框正聚焦，更新其下拉選單
      const activeInput = document.activeElement;
      if (activeInput && activeInput.classList.contains("item")) {
        filterItemOptions(activeInput);
      }
    }
  } catch (error) {
    console.error("發生錯誤：", error);
  }
}

// 計算金額總和
function updateTotalAmount() {
  let totalAmount = 0;
  document.querySelectorAll('.amount').forEach(input => {
    const val = parseFloat(input.value);
    if (!isNaN(val)) totalAmount += val;
  });
  document.getElementById('total-amount').innerText = `總金額：${totalAmount} 元`;
  checkExpenseData();
}

// 初始載入時執行
window.onload = function () {
  checkExpenseData();
  // 抓取下拉選項資料
  fetchData({
    action: 'getDropdownOptions',
    updateOptions: true
  });
  // 抓取月份、本月預算與本月花銷資料
  fetchData({
    action: 'getMonthlyStats',
    updateData: true
  });
  // 每 30 秒更新一次月份統計資料
  setInterval(() => {
    fetchData({
      action: 'getMonthlyStats',
      updateData: true
    });
  }, 30000);
  // 自動新增第一筆資料
  addRow();
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

// 切換金額欄計算功能的按鈕列
function toggleCalculator(rowId) {
  let panel = document.getElementById(`buttonPanel-${rowId}`);
  let input = document.getElementById(`amount-${rowId}`);
  panel.classList.toggle("active");
  input.focus();
}

// 插入運算符號
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

// 計算運算結果
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

// 當點擊頁面其他區域時，隱藏所有計算按鈕列
document.addEventListener("click", function (event) {
  document.querySelectorAll(".buttons").forEach(panel => {
    if (!panel.contains(event.target) && !event.target.classList.contains("toggle-button")) {
      panel.classList.remove("active");
    }
  });
});

// 處理 Enter 鍵以計算金額
function handleAmountEnter(event, input) {
  if (event.key === 'Enter') {
    event.preventDefault();
    try {
      const result = eval(input.value.replace(/[^0-9+\-*/().]/g, ''));
      input.value = parseFloat(result.toFixed(2));
      updateTotalAmount();
    } catch (e) {
      alert('計算錯誤，請輸入有效算式 (例如：100+50*2)');
      input.value = '';
    }
    input.focus();
  }
}

// 使用 <template> 定義新增行，並複製內容
function addRow() {
  rowCount++;
  const template = document.getElementById("rowTemplate");
  // 複製 template 的內容
  const clone = template.content.cloneNode(true);
  // 將複製出來的第一個元素轉換成 HTML 字串，並替換所有 {rowId} 為 rowCount
  let html = clone.firstElementChild.outerHTML.replace(/{rowId}/g, rowCount);
  // 利用暫存 div 將字串轉回 DOM 節點
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const newRow = tempDiv.firstElementChild;
  document.getElementById("form-rows").appendChild(newRow);
  checkExpenseData();
  // 為新增的「項目」欄位啟用 autocomplete 功能
  const newItem = newRow.querySelector(`#item-${rowCount}`);
  if (newItem) {
    setupAutocompleteForItem(newItem);
  }
}

// 刪除指定行
function removeRow(rowId) {
  const row = document.getElementById(`row-${rowId}`);
  row.remove();
  updateTotalAmount();
  checkExpenseData();
}

// 切換商家輸入框的顯示狀態
function toggleOtherMerchantInput(selectElement) {
  const row = selectElement.closest('.row');
  const otherMerchantInput = row.querySelector('.otherMerchant');
  if (selectElement.value === "其他") {
    otherMerchantInput.style.display = "block";
    otherMerchantInput.required = true;
  } else {
    otherMerchantInput.style.display = "none";
    otherMerchantInput.required = false;
  }
}

// 表單提交處理
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
    fetch(`${scriptUrl}?action=add&${params}`)
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
    document.getElementById(`category-${i}`).value = '';
    document.getElementById(`payment-${i}`).value = '';
    document.getElementById(`merchant-${i}`).value = '';
    const otherMerchantInput = document.getElementById(`merchant-${i}`).closest('.row').querySelector('.otherMerchant');
    if (otherMerchantInput) {
      otherMerchantInput.style.display = 'none';
      otherMerchantInput.value = '';
    }
  }
  updateTotalAmount();
}

// 繼續填寫表單
function continueFilling() {
  document.getElementById('overlay').style.display = 'none';
  document.getElementById('expenseForm').style.display = 'block';
  document.getElementById('expenseForm').reset();
  clearForm();
}

// 查看家計簿
function viewSpreadsheet() {
  window.open('https://docs.google.com/spreadsheets/d/1-9jGuyXQsBmb_R_YgcFcGaEE0cmjNplfklivnRHoZ9E/edit?gid=187669044', '_blank');
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
  event.preventDefault();
  const firstInvalidField = event.target.querySelector(':invalid');
  if (firstInvalidField) {
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

function fetchItemOptions() {
  fetchData({
    action: 'getDropdownOptions',
    updateOptions: true
  });
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
