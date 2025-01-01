const coin_image = new Image();
coin_image.src = "images/coin.png";
const format = /^[a-zA-Z]+\d+$/;
let user = [];

function start() {
    // 使用 jQuery 獲取 DOM 元素
    const accountInput = $("#accountInput");
    const passwordInput = $("#passwordInput");
    const have_account = $("#have_account");
    const create_account = $("#create_account");
    const delete_account = $("#delete_account");
    const coin = $("#coin");
    const user_name = $("#user_name");

    let temp = "";
    coin.attr("src", coin_image.src); // 設置圖片來源

    // 獲取 localStorage 的鍵並處理
    for (let i = 0; i < localStorage.length; i++) {
        user.push(localStorage.key(i));
    }
    $.each(user, function (_, str) {
        const match = str.match(/^(.*)-user$/);
        if (match) {
            temp += `<h1 class="user_block">${match[1]}</h1>`;
        }
    });
    user_name.html(temp); // 更新用戶區塊

    // 綁定按鈕事件
    have_account.on("click", () => login(accountInput, passwordInput));
    create_account.on("click", () => {
        window.open('create.html', '_self');
    });
    delete_account.on("click", () => deleteAccount(accountInput, passwordInput));
}

function login(accountInput, passwordInput) {
    const account = accountInput.val();
    const password = passwordInput.val();
    let flag = 0;

    if (account === "" && password === "") {
        alert("請輸入帳號及密碼");
    } else if (account === "") {
        alert("請輸入帳號");
    } else if (password === "") {
        alert("請輸入密碼");
    } else if (!format.test(password)) {
        alert("密碼格式錯誤，請重新輸入密碼");
        passwordInput.val("");
    } else {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const storedPassword = CryptoJS.AES.decrypt(localStorage.getItem(key), key).toString(CryptoJS.enc.Utf8);

            if (key === `${account}-user` && storedPassword === password) {
                alert("登入成功");
                accountInput.val("");
                passwordInput.val("");
                flag = 1;
                sendValue(account);
                break;
            } else if (key === `${account}-user`) {
                alert("密碼錯誤，請重新輸入密碼");
                passwordInput.val("");
                flag = 1;
                break;
            }
        }
        if (flag === 0) {
            alert("查無此帳號，請先創建帳號");
            accountInput.val("");
            passwordInput.val("");
            window.open('create.html', '_self');
        }
    }
}

function deleteAccount(accountInput, passwordInput) {
    const account = accountInput.val();
    const password = passwordInput.val();
    let flag = 0;

    if (account === "" && password === "") {
        alert("請輸入帳號及密碼");
    } else if (account === "") {
        alert("請輸入帳號");
    } else if (password === "") {
        alert("請輸入密碼");
    } else if (!format.test(password)) {
        alert("密碼格式錯誤，請重新輸入密碼");
        passwordInput.val("");
    } else {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const storedPassword = CryptoJS.AES.decrypt(localStorage.getItem(key), key).toString(CryptoJS.enc.Utf8);

            if (key === `${account}-user` && storedPassword === password) {
                alert("帳號已刪除");
                accountInput.val("");
                passwordInput.val("");
                flag = 1;
                localStorage.removeItem(`${account}-user`);
                localStorage.removeItem(`${account}-expenses`);
                location.reload();
                break;
            } else if (key === `${account}-user`) {
                alert("密碼錯誤，請重新輸入密碼");
                passwordInput.val("");
                flag = 1;
                break;
            }
        }
        if (flag === 0) {
            alert("查無此帳號，請重新輸入帳號及密碼");
            accountInput.val("");
            passwordInput.val("");
        }
    }
}

function sendValue(value) {
    const receiverWindow = window.open("save_money.html");

    if (!receiverWindow) {
        return;
    }

    const checkReady = setInterval(() => {
        if (receiverWindow && receiverWindow.document.readyState === "complete") {
            receiverWindow.postMessage(value, "*");
            clearInterval(checkReady);
        }
    }, 100);
}

// 使用 jQuery 在頁面加載完成後啟動
$(document).ready(start);
