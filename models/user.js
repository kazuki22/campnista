const mongoose = require('mongoose');
const { Schema } = mongoose;
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: true
    }
});

userSchema.plugin(passportLocalMongoose, {
    errorMessages: {
        UserExistsError: 'そのユーザー名はすでに使われています。',
        MissingPasswordError: 'パスワードを入力してください。',
        AttemptTooManyError: 'ログイン試行回数が多すぎます。しばらくしてから再度お試しください。',
        NoSaltValueStored: 'パスワードが正しくありません。',
        IncorrectPasswordError: 'パスワードが正しくありません。',
        IncorrectUsernameError: 'ユーザー名が正しくありません。',
        MissingUsernameError: 'ユーザー名を入力してください。',
        MissingEmailError: 'メールアドレスを入力してください。',
    }
});

module.exports = mongoose.model('User', userSchema);