
// バリデーション用のスクリプト
(() => {
    'use strict'

    // バリデーションが必要なフォームを取得
    const forms = document.querySelectorAll('.validated-form')

    // 各フォームに対してバリデーションを適用
    Array.from(forms).forEach(form => {
        form.addEventListener('submit', event => {
            if (!form.checkValidity()) {
                event.preventDefault()
                event.stopPropagation()
            }

            form.classList.add('was-validated')
        }, false)
    })
})()
