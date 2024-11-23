function login() {
    const password = document.getElementById('passwordInput').value;
    redirectToPage(password);
}

function generateAccount() {
    const password = document.getElementById('passwordInput').value;
    if (password) {
        alert('帳號已生成！');
        redirectToPage(password);
    }
    else {
        alert('請先輸入密碼');
    }
}

function redirectToPage(password) {
    if (password === '111') {
        window.location.href = 'blue.html';
    }
    else if (password === '222') {
        window.location.href = 'red.html';
    }
    else {
        alert('密碼錯誤');
    }
}