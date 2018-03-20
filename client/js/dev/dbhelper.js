/**
 * Common database helper functions.
 */
class DBHelper {

    /**
     * Database URL.
     * Change this to restaurants.json file location on your server.
     */
    static get DATABASE_URL() {
        const port = 1337; // Change this to your server port
        return `http://localhost:${port}/restaurants`;
    }

    /**
     * Register ServiceWorker
     */
    static serviceWorker() {
        if (!navigator.serviceWorker) return;
        navigator.serviceWorker.register('/sw.js').then(function () {
            console.log('Registration worked!');
        }).catch(function () {
            console.log('Registration failed!');
        });
    };

    /**
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        const idb = new IndexedDB();

        idb.getFromDB(callback).then(() => {

            fetch(DBHelper.DATABASE_URL)
                .then(data => {
                    data.json().then(restaurants => {
                        if (restaurants) {
                            idb.putRestaurantsToDB(restaurants);
                            callback(null, restaurants);
                        } else { // Restaurant does not exist in the database
                            callback('Restaurant does not exist', null);
                        }
                    })
                })
                .catch(error => {
                    callback(error, null);
                });
        });
    }

    /**
     * Fetch all reviews from the server and put them to the DB.
     */
    static fetchReviews() {
        const idb = new IndexedDB();

        fetch('http://localhost:1337/reviews/')
            .then(data => {
                data.json().then(reviews => {
                    if (reviews) {
                        idb.putReviewsToDB(reviews);
                    } else { // Reviews does not exist in the database
                        console.error('Reviews does not exist in the database')
                    }
                })
            })
            .catch(error => {
                console.error(error)
            });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        const idb = new IndexedDB();

        idb.getRestaurantFromDBbyId(id).then(data => {
            if (data) {
                callback(null, data);
                return;
            }
            fetch(`http://localhost:1337/restaurants/${id}`)
                .then(data => {
                    data.json().then(restaurant => {
                        if (restaurant) {
                            callback(null, restaurant);
                        } else { // Restaurant does not exist in the database
                            callback('Restaurant does not exist', null);
                        }
                    })
                }).catch(error => {
                callback(error, null);
            });
        });
    }

    /**
     * Fetch all reviews for specific restaurant
     */
    static fetchReviewsByRestaurantId(id, callback) {
        const idb = new IndexedDB();

        idb.getReviewsFromDBbyRestaurantId(id).then(reviews => {
            if (reviews.length > 0) {
                callback(null, reviews);
                return;
            }
            fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`)
                .then(data => {
                    data.json().then(reviews => {
                        if (reviews) {
                            idb.putReviewsToDB(reviews);
                            callback(null, reviews);
                        } else { // Reviews does not exist in the database
                            callback('Reviews does not exist', null);
                        }
                    })
                }).catch(error => {
                callback(error, null);
            });
        });
    }

    /**
     * Fetch restaurants by a cuisine type with proper error handling.
     */
    static fetchRestaurantByCuisine(cuisine, callback) {
        // Fetch all restaurants  with proper error handling
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given cuisine type
                const results = restaurants.filter(r => r.cuisine_type == cuisine);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a neighborhood with proper error handling.
     */
    static fetchRestaurantByNeighborhood(neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Filter restaurants to have only given neighborhood
                const results = restaurants.filter(r => r.neighborhood == neighborhood);
                callback(null, results);
            }
        });
    }

    /**
     * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
     */
    static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                let results = restaurants;
                if (cuisine != 'all') { // filter by cuisine
                    results = results.filter(r => r.cuisine_type == cuisine);
                }
                if (neighborhood != 'all') { // filter by neighborhood
                    results = results.filter(r => r.neighborhood == neighborhood);
                }
                callback(null, results);
            }
        });
    }

    /**
     * Fetch all neighborhoods with proper error handling.
     */
    static fetchNeighborhoods(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all neighborhoods from all restaurants
                const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
                // Remove duplicates from neighborhoods
                const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
                callback(null, uniqueNeighborhoods);
            }
        });
    }

    /**
     * Fetch all cuisines with proper error handling.
     */
    static fetchCuisines(callback) {
        // Fetch all restaurants
        DBHelper.fetchRestaurants((error, restaurants) => {
            if (error) {
                callback(error, null);
            } else {
                // Get all cuisines from all restaurants
                const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
                // Remove duplicates from cuisines
                const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
                callback(null, uniqueCuisines);
            }
        });
    }

    /**
     * Mark a restaurant as favorite | unfavorite
     * @param id
     * @param boolean
     */
    static addFavoriteRestaurant(id, boolean) {
        const idb = new IndexedDB();
        idb.toggleFavoriteRestaurantInDB(id, boolean).then(data => {
            fetch(`http://localhost:1337/restaurants/${id}/`, {
                method: 'PUT',
                body: JSON.stringify({
                    is_favorite: boolean
                })
            }).then(data => {
                console.log(data)
            }).catch(error => {
                console.error(error)
            })
        });
    }

    /**
     * Post submitted review to the server
     * @param review
     */
    static postSubmittedReview(review) {
        if (!review) return;
        const idb = new IndexedDB();

        return idb.postSubmittedReviewToDB(review).then(() => {
            if (navigator.onLine) {
                fetch(`http://localhost:1337/reviews`, {
                    method: 'POST',
                    body: JSON.stringify(review),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(response => {
                    idb.deleteSubmittedReviewsFromDB();
                    return response.json();
                }).catch(error => {
                    console.error(error)
                }).then( review => {
                    idb.putReviewToDB(review);
                });
                return;
            }

            DBHelper.offlineMessage();

            setTimeout( () => {
                DBHelper.postSubmittedReview(review);
            }, 5000)
        })
    }

    /**
     * Send submitted reviews to the server
     */
    static postReviewsFromDB() {
        const idb = new IndexedDB();
        idb.checkSubmittedReviewsInDB().then( reviews => {
            if (reviews.length === 0) {
                return;
            }
            reviews.forEach( review => {
                fetch(`http://localhost:1337/reviews`, {
                    method: 'POST',
                    body: JSON.stringify(review),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(response => {
                    idb.deleteSubmittedReviewsFromDB();
                    return response.json();
                }).catch(error => {
                    console.error(error)
                }).then( review => {
                    idb.putReviewToDB(review)
                });
            })
        })
    }

    /**
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        return (`/client/img/${restaurant.photograph}.jpg`);
    }

    /**
     * Map marker for a restaurant.
     */
    static mapMarkerForRestaurant(restaurant, map) {
        const marker = new google.maps.Marker({
                position: restaurant.latlng,
                title: restaurant.name,
                url: DBHelper.urlForRestaurant(restaurant),
                map: map,
                animation: google.maps.Animation.DROP
            }
        );
        return marker;
    }

    /**
     * Offline message
     */
    static offlineMessage() {
        if (navigator.onLine) {
            let message = document.getElementsByClassName('offline-message');
            if(message[0]) {
                message[0].remove();
            }
            return;
        }

        const body = document.getElementsByTagName('body');
        let message = document.createElement('section');
        message.className = 'offline-message';
        message.innerHTML = 'Unable to connect. Your review would be submitted after re-connection';
        body[0].appendChild(message);
    };

}


class IndexedDB extends DBHelper {

    /**
     * Open Indexed DB and create object store
     */
    openDatabase() {
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }
        return idb.open('restaurants-db', 1, function (upgradeDb) {
            upgradeDb.createObjectStore('restaurants', {
                keyPath: 'id'
            });
            upgradeDb.createObjectStore('reviews', {
                keyPath: 'id',
                autoIncrement: true
            }).createIndex('restaurant_id', 'restaurant_id');
            upgradeDb.createObjectStore('submitted', {
                autoIncrement: true
            });
        });
    };

    /**
     * Put restaurants to the DB from server
     * @param restaurants
     */
    putRestaurantsToDB(restaurants) {
        return this.openDatabase().then(function (db) {
            if (!db) return;

            let tx = db.transaction('restaurants', 'readwrite');
            let store = tx.objectStore('restaurants');
            restaurants.forEach(function (restaurant) {
                store.put(restaurant);
            });
        })
    }

    /**
     * Put reviews to the DB from server
     * @param reviews
     */
    putReviewsToDB(reviews) {
        return this.openDatabase().then(function (db) {
            if (!db) return;

            let tx = db.transaction('reviews', 'readwrite');
            let store = tx.objectStore('reviews');
            reviews.forEach(function (review) {
                store.put(review);
            });
        })
    }

    /**
     * Put review to the DB from server after submitting
     * @param review
     */
    putReviewToDB(review) {
        return this.openDatabase().then(function (db) {
            if (!db) return;

            let tx = db.transaction('reviews', 'readwrite');
            let store = tx.objectStore('reviews');
            store.put(review);

        })
    }

    /**
     * Put submitted review to the DB
     * @param review
     */
    postSubmittedReviewToDB(review) {
        return this.openDatabase().then(function (db) {
            if (!db) return;

            let tx = db.transaction('submitted', 'readwrite');
            let store = tx.objectStore('submitted');
            return store.put(review);
        })
    }

    /**
     * Delete submitted reviews after they was sent to the server
     */
    deleteSubmittedReviewsFromDB() {
        return this.openDatabase().then(function (db) {
            if (!db) return;

            let tx = db.transaction('submitted', 'readwrite');
            let store = tx.objectStore('submitted');

            return store.openCursor();
        }).then(function deleteReview(cursor) {
            if (!cursor) return;
            cursor.delete();
            return cursor.continue().then(deleteReview)
        })
    }

    /**
     * Check if it is submitted reviews in DB
     */
    checkSubmittedReviewsInDB() {
        return this.openDatabase().then( db => {
            if (!db) return;
            let tx = db.transaction('submitted');
            let store = tx.objectStore('submitted');
            return store.getAll();
        } )
    }

    /**
     * Change favorite restaurant in the DB
     * @param id
     * @param boolean
     */
    toggleFavoriteRestaurantInDB(id, boolean) {
        return this.openDatabase().then(db => {
            if (!db) return;
            let store = db.transaction('restaurants', 'readwrite');
            return store.objectStore('restaurants').openCursor(parseInt(id));
        }).then(cursor => {
            if (!cursor) return;
            let value = cursor.value;
            value.is_favorite = boolean;
            return cursor.update(value);
        })
    }

    /**
     * Get all restaurants from Indexed DB
     */
    getFromDB(callback) {
        return this.openDatabase().then(db => {
            if (!db) return;
            let store = db.transaction('restaurants').objectStore('restaurants');
            return store.getAll().then( data => {
                callback(null, data);
            });
        })
    }

    /**
     * Get restaurant from Indexed DB by id
     * @param id
     */
    getRestaurantFromDBbyId(id) {
        return this.openDatabase().then(db => {
            let store = db.transaction('restaurants').objectStore('restaurants');
            return store.get(parseInt(id));
        })
    }

    /**
     * Get reviews from Indexed DB by restaurant id
     * @param id
     */
    getReviewsFromDBbyRestaurantId(id) {
        return this.openDatabase().then(db => {
            let store = db.transaction('reviews').objectStore('reviews').index('restaurant_id');
            return store.getAll(parseInt(id));
        })
    }

}
