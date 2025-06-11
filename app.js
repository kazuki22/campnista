if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
};

const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./utils/ExpressError');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');

const mongoSanitize = require('express-mongo-sanitize');
const MongoStore = require('connect-mongo');

const userRoutes = require('./routes/users');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
mongoose.set('strictQuery', false);

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';

// MongoDB接続設定をクリーンアップ
const connectDB = async () => {
    try {
        await mongoose.connect(dbUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('⚠️  App will continue without database connection');
    }
};

connectDB();

const db = mongoose.connection;
db.on("error", (error) => {
    console.error("MongoDB connection error:", error.message);
    // 連続エラーを防ぐため、エラーログの出力回数を制限
});
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(mongoSanitize());

let store;
try {
    store = MongoStore.create({
        mongoUrl: dbUrl,
        touchAfter: 24 * 60 * 60,  // 24時間ごとにセッションを更新
        crypto: {
            secret: process.env.SECRET || 'mysecret'
        }
    });

    store.on('error', function (e) {
        console.log('SESSION STORE ERROR', e);
    });
} catch (error) {
    console.error('Failed to create MongoDB session store:', error);
    store = null;  // メモリーストアにフォールバック
}

const sessionConfig = {
    store: store,
    name: 'session',
    secret: process.env.SECRET || 'mysecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // Render.comでの問題を回避するため、secureをfalseに設定
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
};

app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());
app.use(helmet({
    contentSecurityPolicy: false,
}));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);

    // レスポンス送信をトラック
    const originalRender = res.render;
    const originalRedirect = res.redirect;
    const originalSend = res.send;

    res.render = function (...args) {
        if (res.headersSent) {
            console.log(`[RENDER BLOCKED] ${req.path} - headers already sent`);
            return;
        }
        console.log(`[RENDER] ${req.path} - ${args[0]}`);
        return originalRender.apply(this, args);
    };

    res.redirect = function (...args) {
        if (res.headersSent) {
            console.log(`[REDIRECT BLOCKED] ${req.path} - headers already sent`);
            return;
        }
        console.log(`[REDIRECT] ${req.path} -> ${args[0]}`);
        return originalRedirect.apply(this, args);
    };

    res.send = function (...args) {
        console.log(`[SEND] ${req.path}`);
        return originalSend.apply(this, args);
    };

    // 確実にlocalsを設定
    try {
        res.locals.currentUser = req.user || null;
        res.locals.success = req.flash ? req.flash('success') : [];
        res.locals.error = req.flash ? req.flash('error') : [];

        // デバッグ用：ユーザー認証状態をログ
        if (req.path === '/campgrounds' && req.method === 'GET') {
            console.log(`[AUTH] User: ${req.user ? req.user.username : 'Not logged in'}`);
            console.log(`[AUTH] Session ID: ${req.sessionID}`);
        }
    } catch (error) {
        console.error('Error setting locals:', error);
        res.locals.currentUser = null;
        res.locals.success = [];
        res.locals.error = [];
    }
    next();
});

app.get('/', (req, res) => {
    res.render('home');
});

// robots.txtを追加してSEOクローラーエラーを防止
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send('User-agent: *\nDisallow:');
});

app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    console.error(`[ERROR] ${req.path}:`, err.message);
    console.error(`[ERROR STACK]:`, err.stack);
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!';

    // レスポンスが既に送信されているかチェック
    if (res.headersSent) {
        console.error('[ERROR] Headers already sent, delegating to default Express error handler');
        return next(err);
    }

    res.status(statusCode).render('error', { err });
});

app.listen(3000, () => {
    console.log('Serving on port 3000');
});