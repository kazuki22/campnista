mapboxgl.accessToken = mapToken;

// デフォルト座標（東京）
const defaultCoordinates = [139.6917, 35.6895];
const coordinates = (campground.geometry && campground.geometry.coordinates)
    ? campground.geometry.coordinates
    : defaultCoordinates;

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/light-v11',
    center: coordinates,
    zoom: 9,
});

map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

new mapboxgl.Marker()
    .setLngLat(coordinates)
    .setPopup(
        new mapboxgl.Popup({ offset: 10 })
            .setHTML(
                `<h4>${campground.title}</h4><p>${campground.location}</p>`
            )
    )
    .addTo(map);