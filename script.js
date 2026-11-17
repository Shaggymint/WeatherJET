
let weather = {
    apikey: "31a7b64b65db8045bdec78e63e537b70",

    // Prevent older image searches from overriding newer ones
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

        // Fetch background image from Openverse
        this.fetchCityImage(name);

        this.clearError();
    },

    // OPENVERSE IMAGE SEARCH
    fetchCityImage: async function (city) {
        const requestId = ++this.imageRequestId;

        try {
            const url =
                `https://api.openverse.org/v1/images/?q=${encodeURIComponent(city)}&page_size=20`;

            console.log("Searching Openverse for:", city);

            const response = await fetch(url);

            console.log("Openverse status:", response.status);

            if (!response.ok) {
                throw new Error(
                    `Openverse returned error: ${response.status}`
                );
            }

            const data = await response.json();

            console.log("Openverse results:", data);

            // Ignore results from previous searches
            if (requestId !== this.imageRequestId) return;

            if (!data.results || data.results.length === 0) {
                console.warn("No images found for:", city);
                return;
            }

            // Try multiple images until one loads successfully
            for (const item of data.results) {

                const imageUrl = item.thumbnail || item.url;

                if (
                    !imageUrl ||
                    !imageUrl.startsWith("https://")
                ) {
                    continue;
                }

                const loaded = await new Promise((resolve) => {
                    const img = new Image();

                    img.onload = () => resolve(true);
                    img.onerror = () => resolve(false);

                    img.src = imageUrl;
                });

                // Check if a newer search has started
                if (requestId !== this.imageRequestId) return;

                if (loaded) {
                    document.body.style.backgroundImage =
                        `url("${imageUrl}")`;

                    document.body.style.backgroundSize = "cover";
                    document.body.style.backgroundPosition = "center";
                    document.body.style.backgroundRepeat = "no-repeat";
                    document.body.style.backgroundAttachment = "fixed";

                    console.log("Successfully loaded:", imageUrl);
                    console.log("Image title:", item.title);

                    return;
                }
            }

            console.warn(
                "None of the returned images could be loaded."
            );

        } catch (error) {
            console.error("Openverse image error:", error);
        }
    },

    // SEARCH FUNCTION
    search: function () {
        const city = document.querySelector(".search-bar").value.trim();

        if (city) {
            this.fetchWeather(city);
        }
    },

    // DISPLAY ERRORS
    displayError: function (message) {
        const errorMessage = document.getElementById("error-message");

        errorMessage.innerText = message;
        errorMessage.style.display = "block";
    },

    // CLEAR ERRORS
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
document
    .querySelector(".search-bar")
    .addEventListener("keyup", function (event) {
        if (event.key === "Enter") {
            weather.search();
        }
    });


// DEFAULT CITY
weather.fetchWeather("Lublin");


// CITY SUGGESTIONS
document.addEventListener("DOMContentLoaded", () => {

    const citySearch = document.getElementById("city-search");
    const suggestionsList = document.getElementById("suggestions");

    citySearch.addEventListener("input", async () => {

        const query = citySearch.value.trim();

        if (query.length < 3) {
            suggestionsList.style.display = "none";
            return;
        }

        const suggestions = await fetchSuggestions(query);

        displaySuggestions(suggestions);
    });


    function displaySuggestions(suggestions) {

        suggestionsList.innerHTML = "";

        if (!suggestions || suggestions.length === 0) {
            suggestionsList.style.display = "none";
            return;
        }

        suggestions.forEach(city => {

            const li = document.createElement("li");

            li.textContent = city;

            li.addEventListener("click", () => {

                citySearch.value = city;

                suggestionsList.style.display = "none";

                weather.fetchWeather(city);
            });

            suggestionsList.appendChild(li);
        });

        suggestionsList.style.display = "block";
    }

});
