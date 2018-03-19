let restaurants,
    neighborhoods,
    cuisines;
var map;
var markers = [];


DBHelper.serviceWorker();
DBHelper.fetchReviews();

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
    fetchNeighborhoods();
    fetchCuisines();
});
/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
};

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
};

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
};

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
};

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    let loc = {
        lat: 40.722216,
        lng: -73.987501
    };
    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
    });
    updateRestaurants();
};

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    })
};

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    self.markers.forEach(m => m.setMap(null));
    self.markers = [];
    self.restaurants = restaurants;
};

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
    lazyLoad();
};

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
    const li = document.createElement('li');

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.alt = restaurant.alt;
    image.setAttribute('data-src', DBHelper.imageUrlForRestaurant(restaurant));
    li.append(image);

    const name = document.createElement('h3');
    name.innerHTML = restaurant.name;
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.setAttribute('aria-label', 'View details about ' + restaurant.name + ' restaurant');
    more.href = DBHelper.urlForRestaurant(restaurant);
    li.append(more);

    const favorite = document.createElement('div');
    favorite.addEventListener('click', togFav);
    favorite.addEventListener('keydown', togFavKey);
    favorite.setAttribute('data-id', restaurant.id);
    favorite.className = `favorite-icon ${restaurant.is_favorite ? 'checked' : ''}`;
    favorite.setAttribute('aria-checked', !!restaurant.is_favorite);
    favorite.setAttribute('aria-label', 'Mark restaurant as favorite');
    favorite.setAttribute('tabindex', 0);
    favorite.setAttribute('role', "checkbox");
    favorite.innerHTML = restaurant.is_favorite ? '<i class="fas fa-star fa-2x"></i>' : '<i class="far fa-star fa-2x"></i>';

    li.append(favorite);

    return li
};

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
        google.maps.event.addListener(marker, 'click', () => {
            window.location.href = marker.url
        });
        self.markers.push(marker);
    });
};

/**
 * SkipLink
 */
skipTo = (e) => {
    const skipContainer = document.getElementById(e);
    skipContainer.focus();
};

/**
 * Toggle favorite restaurant
 */
togFav = (e) => {
    const iconBox = e.target.parentNode;
    const id = iconBox.dataset.id;
    if (iconBox.classList.contains('checked')) {
        iconBox.innerHTML = '<i class="far fa-star fa-2x"></i>';
        iconBox.classList.remove('checked');
        iconBox.setAttribute('aria-checked', false);
        DBHelper.addFavoriteRestaurant(id, false)
    } else {
        iconBox.innerHTML = '<i class="fas fa-star fa-2x"></i>';
        iconBox.classList.add('checked');
        iconBox.setAttribute('aria-checked', true);
        DBHelper.addFavoriteRestaurant(id, true)
    }
};
togFavKey = (e) => {
    if (e.keyCode  === 32) {
        e.preventDefault();
        const iconBox = e.target;
        const id = iconBox.dataset.id;
        if (iconBox.classList.contains('checked')) {
            iconBox.innerHTML = '<i class="far fa-star fa-2x"></i>';
            iconBox.classList.remove('checked');
            iconBox.setAttribute('aria-checked', false);
            DBHelper.addFavoriteRestaurant(id, false)
        } else {
            iconBox.innerHTML = '<i class="fas fa-star fa-2x"></i>';
            iconBox.classList.add('checked');
            iconBox.setAttribute('aria-checked', true);
            DBHelper.addFavoriteRestaurant(id, true)
        }
    }
};

/**
 * Lazy loading
 */
lazyLoad = () => {
    const imgs = document.querySelectorAll('img[data-src]');
    imgs.forEach( img => {
        img.setAttribute('src', img.getAttribute('data-src'));
        img.onload = () => {
            img.removeAttribute('data-src');
        };
    });
};
