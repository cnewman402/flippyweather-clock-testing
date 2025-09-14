console.log("Starting FlippyWeather Testing script");

class FlippyWeatherTesting extends HTMLElement {
    setConfig(config) {
        this._config = config;
        console.log("Config set:", config);
        this.render();
    }

    connectedCallback() {
        console.log("Element connected to DOM");
        this.render();
    }

    render() {
        this.innerHTML = `
            <ha-card>
                <div style="padding: 20px; text-align: center; background: linear-gradient(135deg, #74b9ff, #0984e3); color: white; border-radius: 15px;">
                    <h2>FlippyWeather Testing Loaded</h2>
                    <p>Element is working!</p>
                    <p>Config: ${this._config ? JSON.stringify(this._config) : 'No config yet'}</p>
                </div>
            </ha-card>
        `;
    }
}

console.log("About to define custom element");
customElements.define("flippyweather-clock-testing", FlippyWeatherTesting);
console.log("Custom element defined successfully");
