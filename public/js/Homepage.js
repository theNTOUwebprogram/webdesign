const coin_image = new Image();
coin_image.src = "images/coin.png";
let accountInput;
let passwordInput;
let have_account;
let new_account;
let delete_account;
let format = /^[a-zA-Z]+\d+$/;
let user = [];
let user_name;



function start() {
    accountInput = document.getElementById("accountInput");
    passwordInput = document.getElementById("passwordInput");
    have_account= document.getElementById("have_account");
    new_account = document.getElementById("new_account");
    delete_account = document.getElementById("delete_account");
    coin = document.getElementById("coin");
    user_name = document.getElementById("user_name");
    let temp = "";
    coin.src = coin_image.src;
    
    for (let i = 0; i < localStorage.length; i++) {
        user.push(localStorage.key(i));
    }
    user.forEach(str => {
        const match = str.match(/^(.*)-user$/);
        
        if (match) {
            temp += `<h1 class="user_block">${match[1]}</h1>`;
        }
    })
    user_name.innerHTML = temp;
    
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
            if ((localStorage.key(i) === (account + "-user")) && (CryptoJS.AES.decrypt(localStorage.getItem(account + "-user"), localStorage.key(i)).toString(CryptoJS.enc.Utf8) ===  password)) {  
                window.alert("登入成功");
                accountInput.value = "";
                passwordInput.value = "";
                flag = 1;
                sendValue(account);
                break;
            }
            else if (localStorage.key(i) === (account + "-user")) {
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
    let key = CryptoJS.AES.encrypt(password, (account + "-user")).toString();
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
            if (localStorage.key(i) === (account + "-user") ) {
                flag = 1;
                break;
            }
        }
        if (flag == 1) {
            window.alert("帳號名稱已被使用，請重新輸入帳號及密碼");
        }
        else {
            localStorage.setItem(account + "-user", key);
            window.alert("帳號創建成功\n帳號:" + account + "\n密碼:" + password);
            sendValue(account);
        }
        accountInput.value = "";
        passwordInput.value = "";
        location.reload();
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
            if ((localStorage.key(i) === (account + "-user")) && (CryptoJS.AES.decrypt(localStorage.getItem(account + "-user"), localStorage.key(i)).toString(CryptoJS.enc.Utf8) ===  password)) {  
                window.alert("帳號已刪除");
                accountInput.value = "";
                passwordInput.value = "";
                flag = 1;
                localStorage.removeItem(account + "-user");
                localStorage.removeItem(account + "-expenses");
                location.reload();
                break;
            }
            else if (localStorage.key(i) === (account + "-user")) {
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