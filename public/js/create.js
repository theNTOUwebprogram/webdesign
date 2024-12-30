const format = /^[a-zA-Z]+\d+$/;

function start() {
    const accountInput = $("#accountInput");
    const passwordInput = $("#passwordInput");
    const new_account = $("#new_account");
    const back = $("#back");

    back.on("click", () => {window.open('index.html', '_self');});
    new_account.on("click", () => generateAccount(accountInput, passwordInput));
}

function generateAccount(accountInput, passwordInput) {
    const account = accountInput.val();
    const password = passwordInput.val();
    const key = CryptoJS.AES.encrypt(password, `${account}-user`).toString();
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
            if (localStorage.key(i) === `${account}-user`) {
                flag = 1;
                break;
            }
        }
        if (flag === 1) {
            alert("帳號名稱已被使用，請重新輸入帳號及密碼");
        } else {
            localStorage.setItem(`${account}-user`, key);
            alert(`帳號創建成功\n帳號: ${account}\n密碼: ${password}`);
            sendValue(account);
        }
        accountInput.val("");
        passwordInput.val("");
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

$(document).ready(start);