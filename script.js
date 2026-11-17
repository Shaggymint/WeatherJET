
let weather = {
    apikey: "31a7b64b65db8045bdec78e63e537b70",

    // Prevent older image searches from replacing newer ones
    imageRequestId: 0,

    fetchWeather: function (city) {
        fetch(
            "https://api.openweathermap.org/data/2.5/weather?q="
            + encodeURIComponent(city)
            + "&units=metric&APPID="
            + this.apikey
        )
            .then((response) => {
                if (!response.ok) {
                    throw new Error("City not found");
                }
                return response.json();
            })
            .then((data) => this.displayWeather(data))
            .catch((error) => this.displayError(error.message));
    },

    displayWeather: function (data) {
        const { name } = data;
        const { icon, description } = data.weather[0];
        const { temp, humidity } = data.main;
        const { speed } = data.wind;

        document.querySelector(".city").innerText = "Weather in " + name;

        document.querySelector(".icon").src =
            "https://openweathermap.org/img/wn/" + icon + ".png";

        document.querySelector(".description").innerText = description;
        document.querySelector(".temp").innerText = temp + "℃";
        document.querySelector(".humidity").innerText =
            "Humidity: " + humidity + "%";

        document.querySelector(".wind").innerText =
            "Wind speed: " + speed + " km/h";

        document.querySelector(".weather").classList.remove("loading");

        // Fetch a background image from Openverse
        this.fetchCityImage(name);

        this.clearError();
    },

    // OPENVERSE IMAGE SEARCH
    fetchCityImage: async function (city) {
        const requestId = ++this.imageRequestId;

        try {
            const url =
                "https://api.openverse.org/v1/images/?q="
                + encodeURIComponent(city + " city")
                + "&page_size=20";

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Openverse image search failed");
            }

            const data = await response.json();

            // Ignore results from older searches
            if (requestId !== this.imageRequestId) {
                return;
            }

            // Find an image with a valid HTTPS thumbnail
            const image = data.results?.find(item =>
                item.thumbnail &&
                item.thumbnail.startsWith("https://")
            );

            if (image) {
                document.body.style.backgroundImage =
                    `url("${image.thumbnail}")`;

                console.log("Background image loaded:", image.title);
            } else {
                console.log("No suitable image found for:", city);
            }

        } catch (error) {
            console.error("Openverse error:", error);
        }
    },

    search: function () {
        this.fetchWeather(document.querySelector(".search-bar").value);
    },

    displayError: function (message) {
        const errorMessage = document.getElementById("error-message");
        errorMessage.innerText = message;
        errorMessage.style.display = "block";
    },

    clearError: function () {
        const errorMessage = document.getElementById("error-message");
        errorMessage.innerText = "";
        errorMessage.style.display = "none";
    }
};


// SEARCH BUTTON
document
    .querySelector(".search button")
    .addEventListener("click", function () {
        weather.search();
    });


// ENTER KEY
document.querySelector(".search-bar").addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
        weather.search();
    }
});


// DEFAULT CITY
weather.fetchWeather("Lublin");


// CITY SUGGESTIONS
document.addEventListener('DOMContentLoaded', () => {
    const citySearch = document.getElementById('city-search');
    const suggestionsList = document.getElementById('suggestions');

    citySearch.addEventListener('input', async () => {
        const query = citySearch.value;

        if (query.length < 3) {
            suggestionsList.style.display = 'none';
            return;
        }

        const suggestions = await fetchSuggestions(query);
        displaySuggestions(suggestions);
    });

    function displaySuggestions(suggestions) {
        suggestionsList.innerHTML = '';

        if (suggestions.length === 0) {
            suggestionsList.style.display = 'none';
            return;
        }

        suggestions.forEach(city => {
            const li = document.createElement('li');
            li.textContent = city;

            li.addEventListener('click', () => {
                citySearch.value = city;
                suggestionsList.style.display = 'none';
                weather.fetchWeather(city);
            });

            suggestionsList.appendChild(li);
        });

        suggestionsList.style.display = 'block';
    }
});
