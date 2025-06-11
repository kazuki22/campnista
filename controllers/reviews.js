const Campground = require('../models/campground');
const Review = require('../models/review');

module.exports.createReview = async (req, res) => {
    console.log(`[REVIEW] Creating review for campground: ${req.params.id}`);
    console.log(`[REVIEW] User: ${req.user ? req.user.username : 'null'}`);
    console.log(`[REVIEW] Review data:`, req.body.review);

    const { id } = req.params;
    if (!id) {
        req.flash('error', 'キャンプ場IDが見つかりません');
        return res.redirect('/campgrounds');
    }

    const campground = await Campground.findById(id);
    if (!campground) {
        req.flash('error', 'キャンプ場が見つかりません');
        return res.redirect('/campgrounds');
    }

    if (!req.user) {
        req.flash('error', 'ログインが必要です');
        return res.redirect('/login');
    }

    const review = new Review(req.body.review);
    review.author = req.user._id;

    campground.reviews.push(review);
    await review.save();
    await campground.save();
    console.log(`[REVIEW] Review saved successfully`);
    req.flash('success', 'レビューを投稿しました');
    // セッション保存を確実にする
    req.session.save((saveErr) => {
        if (saveErr) {
            console.error('Session save error after review:', saveErr);
        }
        return res.redirect(`/campgrounds/${campground._id}`);
    });
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'レビューを削除しました');
    return res.redirect(`/campgrounds/${id}`);
};