const coin_image = new Image();
coin_image.src = "coin.png";
let accountInput;
let passwordInput;
let have_account;
let new_account;
let delete_account;
let format = /^[a-zA-Z]+\d+$/;



function start() {
    accountInput = document.getElementById("accountInput");
    passwordInput = document.getElementById("passwordInput");
    have_account= document.getElementById("have_account");
    new_account = document.getElementById("new_account");
    delete_account = document.getElementById("delete_account");
    coin = document.getElementById("coin");
    coin.src = coin_image.src;
    
    have_account.addEventListener("click", login, false);
    new_account.addEventListener("click", generateAccount, false);
    delete_account.addEventListener("click",deleteAccount, false);
}

function login() {
    let account = accountInput.value;
    let password = passwordInput.value;
    let flag = 0;
    if ((account === "") && (password === "")) {
        window.alert("請輸入帳號及密碼");
    }
    else if (account === "") {
        window.alert("請輸入帳號");
    }
    else if (password === "") {
        window.alert("請輸入密碼");
    }
    else if (!format.test(password)) {
        window.alert("密碼格式錯誤，請重新輸入密碼");
        passwordInput.value = "";
    }
    else {
        for (let i = 0; i < localStorage.length; i++) {
            if ((localStorage.key(i) === account ) && (CryptoJS.AES.decrypt(localStorage.getItem(account), localStorage.key(i)).toString(CryptoJS.enc.Utf8) ===  password)) {  
                window.alert("登入成功");
                accountInput.value = "";
                passwordInput.value = "";
                flag = 1;
                sendValue(localStorage.key(i));
                break;
            }
            else if (localStorage.key(i) === account) {
                window.alert("密碼錯誤，請重新輸入密碼");
                passwordInput.value = "";
                flag = 1;
                break;
            }
        }
        if (flag == 0) {
            window.alert("查無此帳號，請重新輸入帳號及密碼");
            accountInput.value = "";
            passwordInput.value = "";
        }
    }
    
}

function generateAccount() {
    let account = accountInput.value;
    let password = passwordInput.value;
    let key = CryptoJS.AES.encrypt(password, account).toString();
    let flag = 0;
    if ((account === "") && (password === "")) {
        window.alert("請輸入帳號及密碼");
    }
    else if (account === "") {
        window.alert("請輸入帳號");
    }
    else if (password === "") {
        window.alert("請輸入密碼");
    }
    else if (!format.test(password)) {
        window.alert("密碼格式錯誤，請重新輸入密碼");
        passwordInput.value = "";
    }
    else {
        for (let i = 0; i < localStorage.length; i++) {
            if (localStorage.key(i) === account ) {
                flag = 1;
                break;
            }
        }
        if (flag == 1) {
            window.alert("帳號名稱已被使用，請重新輸入帳號及密碼");
        }
        else {
            localStorage.setItem(account, key);
            window.alert("帳號創建成功\n帳號:" + account + "\n密碼:" + password);
            sendValue(localStorage.key(account));
        }
        accountInput.value = "";
        passwordInput.value = "";
    }
    
}

function deleteAccount() {
    let account = accountInput.value;
    let password = passwordInput.value;
    let flag = 0;
    if ((account === "") && (password === "")) {
        window.alert("請輸入帳號及密碼");
    }
    else if (account === "") {
        window.alert("請輸入帳號");
    }
    else if (password === "") {
        window.alert("請輸入密碼");
    }
    else if (!format.test(password)) {
        window.alert("密碼格式錯誤，請重新輸入密碼");
        passwordInput.value = "";
    }
    else {
        for (let i = 0; i < localStorage.length; i++) {
            if ((localStorage.key(i) === account ) && (CryptoJS.AES.decrypt(localStorage.getItem(account), localStorage.key(i)).toString(CryptoJS.enc.Utf8) ===  password)) {  
                window.alert("帳號已刪除");
                accountInput.value = "";
                passwordInput.value = "";
                flag = 1;
                localStorage.removeItem(account);
                break;
            }
            else if (localStorage.key(i) === account) {
                window.alert("密碼錯誤，請重新輸入密碼");
                passwordInput.value = "";
                flag = 1;
                break;
            }
        }
        if (flag == 0) {
            window.alert("查無此帳號，請重新輸入帳號及密碼");
            accountInput.value = "";
            passwordInput.value = "";
        }
    }
}

function sendValue(value) {
    const receiverWindow = window.open("save_money.html"); // 開啟另一個頁面

    if (!receiverWindow) {
        return;
    }

    // 確保目標頁面完全載入後執行 postMessage
    const checkReady = setInterval(() => {
        if (receiverWindow && receiverWindow.document.readyState === "complete") {
            receiverWindow.postMessage(value, "*"); // 傳遞數據
            clearInterval(checkReady); // 停止檢查
        }
    }, 100);
}

window.addEventListener("load", start, false);