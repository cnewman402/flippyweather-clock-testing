console.log("FlippyWeather Testing script loaded");

import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class FlippyWeatherTesting extends LitElement {
    setConfig(config) {
        this._config = config;
        console.log("Config set:", config);
    }

    render() {
        return html`
            <ha-card>
                <div style="padding: 20px; text-align: center;">
                    <h2>FlippyWeather Testing Loaded</h2>
                    <p>Element is working!</p>
                    <p>Config: ${JSON.stringify(this._config)}</p>
                </div>
            </ha-card>
        `;
    }
}

console.log("Defining flippyweather-clock-testing element");
customElements.define("flippyweather-clock-testing", FlippyWeatherTesting);
console.log("FlippyWeather Testing element defined");
