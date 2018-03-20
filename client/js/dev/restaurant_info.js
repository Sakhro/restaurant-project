let restaurant;
var map;

DBHelper.serviceWorker();
DBHelper.postReviewsFromDB();

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 16,
                center: restaurant.latlng,
                scrollwheel: false
            });
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
        }
    });
};

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant)
        });
    }
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
    const form = document.getElementById('review-form');
    form.setAttribute('data-id', restaurant.id);

    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const favorite = document.getElementById('favorite');
    favorite.addEventListener('click', togFav);
    favorite.addEventListener('keydown', togFavKey);
    favorite.setAttribute('data-id', restaurant.id);
    favorite.setAttribute('tabindex', 0);
    favorite.setAttribute('role', "checkbox");
    favorite.setAttribute('aria-label', 'Mark restaurant as favorite');
    favorite.className = `favorite-icon ${restaurant.is_favorite ? 'checked' : ''}`;
    favorite.setAttribute('aria-checked', !!restaurant.is_favorite);
    favorite.innerHTML = restaurant.is_favorite ? '<i class="fas fa-star fa-2x"></i>' : '<i class="far fa-star fa-2x"></i>';

    const address = document.getElementById('restaurant-address');
    address.innerHTML = '<i class="fas fa-map-marker-alt" aria-hidden="true"></i>' + restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.alt = restaurant.alt;
    image.src = DBHelper.imageUrlForRestaurant(restaurant);

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }
    // fill reviews
    fillReviewsHTML();
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        day.setAttribute('tabindex', 0);
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = '<i class="far fa-clock" aria-hidden="true"></i> ' + operatingHours[key];
        time.setAttribute('tabindex', 0);
        row.appendChild(time);

        hours.appendChild(row);
    }
};

/**
 * Get all reviews and add them to the webpage via HTML.
 */
fillReviewsHTML = (id = self.restaurant.id) => {
    const reviews = new Promise((resolve, reject) => {
        DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
            if (!reviews) {
                reject(error);
            }
            resolve(reviews);
        });
    });

    const container = document.getElementById('reviews-container');
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    title.id = 'reviews-title';
    container.appendChild(title);

    reviews.then(reviews => {
        if (!reviews) {
            const noReviews = document.createElement('p');
            noReviews.innerHTML = 'No reviews yet!';
            container.appendChild(noReviews);
            return;
        }
        const ul = document.getElementById('reviews-list');

        reviews.reverse().forEach(review => {
            ul.appendChild(createReviewHTML(review));
        });

        container.appendChild(ul);
    }).catch(error => console.error(error));
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
    const li = document.createElement('li');
    li.setAttribute('tabindex', 0);
    const header = document.createElement('header');
    header.className = 'review-header';

    const name = document.createElement('h4');
    name.innerHTML = review.name;
    name.className = 'review-name';
    header.appendChild(name);

    const date = document.createElement('p');
    const reviewDate = new Date(review.updatedAt);
    date.innerHTML = `${reviewDate.getDate()}.${reviewDate.getMonth()}.${reviewDate.getFullYear()}`;
    date.className = 'review-date';
    header.appendChild(date);

    li.appendChild(header);

    const rating = document.createElement('p');
    rating.innerHTML = `RATING: ${review.rating}`;
    rating.className = 'review-rating';
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant = self.restaurant) => {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
    if (!url)
        url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * SkipLink focus
 */
skipTo = e => {
    const skipContainer = document.getElementById(e);
    skipContainer.focus();
};

/**
 * Toggle favorite restaurant
 */

togFav = el => {
    const iconBox = el.target.parentNode;
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
    if (e.keyCode === 32) {
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
 * Submit review form
 */
submitReview = e => {
    e.preventDefault();


    const date = Date.now();
    const form = e.target;
    const id = parseInt(form.dataset.id);
    let review = {
        restaurant_id: id,
        createdAt: date,
        updatedAt: date
    };
    const formData = new FormData(form);

    for (const pair of formData) {
        review[pair[0]] = pair[1];
    }

    const button = form.getElementsByTagName('button');
    button[0].className = 'disabled';

    const spinner = document.getElementById('spinner');
    spinner.style.display = 'block';

    DBHelper.postSubmittedReview(review).then(() => {
        form.reset();
        button[0].classList.remove("disabled");
        spinner.style.display = 'none';
        const message = document.getElementById('submitted-message');
        message.style.display = 'block';
        setTimeout(() => {
            message.style.display = 'none';
        }, 5000)
    });

    const ul = document.getElementById('reviews-list');

    ul.prepend(createReviewHTML(review));
};
const form = document.getElementById('review-form');
form.addEventListener('submit', submitReview);

window.addEventListener('online', DBHelper.offlineMessage);
