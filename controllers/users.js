const User = require('../models/user');

module.exports.renderRegisterForm = (req, res) => {
    res.render('users/register');
};

module.exports.register = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username, displayName: username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, (err) => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Campnista!');
            // セッション保存を確実にする
            req.session.save((saveErr) => {
                if (saveErr) {
                    console.error('Session save error:', saveErr);
                    return next(saveErr);
                }
                return res.redirect('/campgrounds');
            });
        });
    } catch (e) {
        req.flash('error', e.message);
        return res.redirect('/register');
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render('users/login');
};

module.exports.login = (req, res) => {
    req.flash('success', 'おかえりなさい！');
    const redirectUrl = res.locals.returnTo || '/campgrounds';
    delete req.session.returnTo;
    // セッション保存を確実にする
    req.session.save((saveErr) => {
        if (saveErr) {
            console.error('Session save error:', saveErr);
        }
        return res.redirect(redirectUrl);
    });
};

module.exports.logout = (req, res, next) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        req.flash('success', 'ログアウトしました');
        return res.redirect('/campgrounds');
    });
};