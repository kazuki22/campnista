const mongoose = require('mongoose');
const cities = require('./cities');
const { descriptors, places } = require('./seedHelpers');
const Campground = require('../models/campground')

mongoose.set('strictQuery', false);

mongoose.connect('mongodb://localhost:27017/yelp-camp',
    { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('MongoDBコネクションOK！');
    })
    .catch(err => {
        console.log('MongoDBコネクションエラー！');
        console.log(err);
    });

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    for (let i = 0; i < 50; i++) {
        const randomCityIndex = Math.floor(Math.random() * cities.length);
        const price = Math.floor(Math.random() * 2000) + 1000;
        const camp = new Campground({
            author: '68415d88aa0b97f82da6fb7f',
            location: `${cities[randomCityIndex].prefecture}${cities[randomCityIndex].city}`,
            title: `${sample(descriptors)}・${sample(places)}`,
            description: 'ダミーデータ',
            price,
            geometry: {
                type: 'Point',
                coordinates: [
                    cities[randomCityIndex].longitude,
                    cities[randomCityIndex].latitude
                ]
            },
            images: [
                {
                    url: 'https://res.cloudinary.com/dqonpr0xm/image/upload/v1749304192/YelpCamp/ymglg0ezo5halfkcc6an.jpg',
                    filename: 'YelpCamp/ymglg0ezo5halfkcc6an',


                },
                {
                    url: 'https://res.cloudinary.com/dqonpr0xm/image/upload/v1749304193/YelpCamp/pazv17jwclnvzg5ojfio.jpg',
                    filename: 'YelpCamp/pazv17jwclnvzg5ojfio',

                }
            ]
        });
        await camp.save();
    }
};

seedDB().then(() => {
    mongoose.connection.close();
});