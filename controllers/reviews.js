const Campground = require('../models/campground');
const Review = require('../models/review');

module.exports.createReview = async (req, res) => {
    const { id } = req.params;
    if (!id) {
        return res.redirect('/campgrounds');
    }

    const campground = await Campground.findById(id);
    if (!campground) {
        return res.redirect('/campgrounds');
    }

    const review = new Review(req.body.review);
    review.author = req.user._id;

    campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success', 'レビューを投稿しました');
    res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'レビューを削除しました');
    res.redirect(`/campgrounds/${id}`);
};