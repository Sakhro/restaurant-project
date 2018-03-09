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
     * Fetch all restaurants.
     */
    static fetchRestaurants(callback) {
        const idb = new IndexedDB();
        fetch(DBHelper.DATABASE_URL)
            .then( data => {
                data.json().then(restaurants => {
                    if (restaurants) {
                        idb.putToDB(restaurants);
                        callback(null, restaurants);
                    } else { // Restaurant does not exist in the database
                        callback('Restaurant does not exist', null);
                    }
                })
            })
            .catch( error => {
                if (!idb) {
                    callback(error, null);
                } else {
                    idb.getFromDB().then( data => {
                        callback(null, data);
                    });
                }
            });
    }

    /**
     * Fetch a restaurant by its ID.
     */
    static fetchRestaurantById(id, callback) {
        const idb = new IndexedDB();
        fetch(`http://localhost:1337/restaurants/${id}`)
            .then( data => {
                data.json().then(restaurant => {
                    if (restaurant) {
                        callback(null, restaurant);
                    } else { // Restaurant does not exist in the database
                        callback('Restaurant does not exist', null);
                    }
                })
            }).catch( error => {
                if (!idb) {
                    callback(error, null);
                } else {
                    idb.getFromDBbyId(id).then( data => {
                        callback(null, data);
                    });
                }
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
     * Restaurant page URL.
     */
    static urlForRestaurant(restaurant) {
        return (`./restaurant.html?id=${restaurant.id}`);
    }

    /**
     * Restaurant image URL.
     */
    static imageUrlForRestaurant(restaurant) {
        return (`/img/${restaurant.photograph}.jpg`);
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

}


class IndexedDB extends DBHelper {

    /**
     * Open Indexed DB
     */
    openDatabase() {
        if (!navigator.serviceWorker) {
            return Promise.resolve();
        }
        return idb.open('restaurants-db', 1, function (upgradeDb) {
            upgradeDb.createObjectStore('restaurants', {
                keyPath: 'id'
            });
        });
    };

    /**
     * Put restaurants to the DB from server
     * @param restaurants
     */
    putToDB(restaurants) {
        this.openDatabase().then(function (db) {
            if (!db) return;

            let tx = db.transaction('restaurants', 'readwrite');
            let store = tx.objectStore('restaurants');
            restaurants.forEach(function (restaurant) {
                store.put(restaurant);
            });
        })
    }

    /**
     * Get all restaurants from Indexed DB
     */
    getFromDB() {
        return this.openDatabase().then( db => {
            if (!db) return;
            let store = db.transaction('restaurants').objectStore('restaurants');
            return store.getAll()
        })
    }

    /**
     * Get restaurant from Indexed DB by id
     * @param id
     */
    getFromDBbyId(id) {
        return this.openDatabase().then( db => {
            if (!db) return;
            let store = db.transaction('restaurants').objectStore('restaurants');
            return store.get(parseInt(id));
        })
    }
}

