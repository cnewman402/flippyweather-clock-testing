import "https://unpkg.com/wired-card@0.8.1/wired-card.js?module";
import "https://unpkg.com/wired-toggle@0.8.0/wired-toggle.js?module";
import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

const themes = {
    default: {
        css: `
            .flippy-container {
                background: linear-gradient(135deg, #74b9ff, #0984e3);
                color: white;
                padding: 15px;
                border-radius: 15px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                height: 200px;
            }
        `
    },
    dark: {
        css: `
            .flippy-container {
                background: linear-gradient(135deg, #2c3e50, #34495e);
                color: white;
                padding: 15px;
                border-radius: 15px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                height: 200px;
            }
        `
    },
    light: {
        css: `
            .flippy-container {
                background: linear-gradient(135deg, #ecf0f1, #bdc3c7);
                color: #2c3e50;
                padding: 15px;
                border-radius: 15px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
                height: 200px;
            }
        `
    },
    sunset: {
        css: `
            .flippy-container {
                background: linear-gradient(135deg, #ff7675, #fd79a8, #fdcb6e);
                color: white;
                padding: 15px;
                border-radius: 15px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 8px 32px rgba(255, 118, 117, 0.3);
                height: 200px;
            }
        `
    },
    ocean: {
        css: `
            .flippy-container {
                background: linear-gradient(135deg, #00b894, #00cec9, #74b9ff);
                color: white;
                padding: 15px;
                border-radius: 15px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                box-shadow: 0 8px 32px rgba(0, 184, 148, 0.3);
                height: 200px;
            }
        `
    }
};

const weatherDefaults = {
    location_name: 'Weather',
    am_pm: false,
    animated_background: true,
    theme: 'default',
    weather_entity: null
};

const flippyVersion = "3.0.0";

console.info("%c 🌤️ FlippyWeather Clock %c ".concat(flippyVersion, " "), "color: white; background: #555555; border-radius: 3px 0 0 3px; padding: 1px 0;", "color: white; background: #3a7ec6; border-radius: 0 3px 3px 0; padding: 1px 0;");

class FlippyWeather extends LitElement {
    constructor() {
        super();
        this.weatherData = null;
        this.previousTime = {};
        this.animatingDigits = new Set();
        this.oldTime = {};
        this.currentCondition = '';
        this.currentTemperature = '--';
    }

    static getStubConfig() {
        return { 
            location_name: 'Home Assistant Location',
            animated_background: true,
            theme: 'default',
            weather_entity: 'weather.home'
        };
    }

    setConfig(config) {
        var defaultConfig = {};
        for (const property in config) {
            defaultConfig[property] = config[property];
        }
        
        for (const property in weatherDefaults) {
            if (config[property] === undefined) {
                defaultConfig[property] = weatherDefaults[property];
            }
        }
        
        this._config = defaultConfig;
    }

    async connectedCallback() {
        super.connectedCallback();
        
        this.updateInterval = setInterval(() => {
            this.requestUpdate();
        }, 1000);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        
        const now = new Date();
        let hour = now.getHours();
        
        if (this._config.am_pm) {
            hour = hour > 12 ? hour - 12 : hour;
            if (hour === 0) hour = 12;
        }
        
        const hourStr = hour < 10 ? "0" + hour : "" + hour;
        const minuteStr = now.getMinutes() < 10 ? "0" + now.getMinutes() : "" + now.getMinutes();
        
        const currentTime = {
            firstHourDigit: hourStr[0],
            secondHourDigit: hourStr[1],
            firstMinuteDigit: minuteStr[0],
            secondMinuteDigit: minuteStr[1]
        };
        
        Object.keys(currentTime).forEach(key => {
            if (this.oldTime[key] !== undefined && this.oldTime[key] !== currentTime[key]) {
                this.animateDigitFlip(key, this.oldTime[key], currentTime[key]);
            }
        });
        
        this.oldTime = currentTime;
    }

    animateDigitFlip(digitKey, oldDigit, newDigit) {
        const digitElement = this.shadowRoot.querySelector(`[data-digit="${digitKey}"]`);
        if (digitElement && !this.animatingDigits.has(digitKey)) {
            this.animatingDigits.add(digitKey);
            this.performFlipAnimation(digitElement, digitKey, oldDigit, newDigit);
        }
    }

    performFlipAnimation(element, digitKey, oldDigit, newDigit) {
        element.classList.add('flipping');
        
        setTimeout(() => {
            const digitDisplay = element.querySelector('.flip-card-face');
            if (digitDisplay) {
                digitDisplay.textContent = newDigit;
            }
        }, 150);
        
        setTimeout(() => {
            element.classList.remove('flipping');
            this.animatingDigits.delete(digitKey);
        }, 300);
    }

    getWeatherFromEntity() {
        if (!this.hass || !this._config.weather_entity) {
            return {
                temperature: '--',
                condition: 'Unknown',
                icon: '🌤️',
                forecast: []
            };
        }

        const entity = this.hass.states[this._config.weather_entity];
        if (!entity) {
            return {
                temperature: '--',
                condition: 'Entity not found',
                icon: '❓',
                forecast: []
            };
        }

        const temperature = entity.attributes.temperature || '--';
        const condition = entity.state || 'Unknown';
        const forecast = entity.attributes.forecast || [];
        
        return {
            temperature: Math.round(temperature),
            condition: condition,
            icon: this.getWeatherEmoji(condition),
            forecast: forecast.slice(0, 4)
        };
    }

    getWeatherEmoji(condition) {
        if (!condition) return '🌤️';
        
        const lowerCondition = condition.toLowerCase();
        
        if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) return '☀️';
        if (lowerCondition.includes('partlycloudy') || lowerCondition.includes('partly-cloudy')) return '⛅';
        if (lowerCondition.includes('cloudy')) return '☁️';
        if (lowerCondition.includes('rainy') || lowerCondition.includes('rain')) return '🌧️';
        if (lowerCondition.includes('lightning') || lowerCondition.includes('storm')) return '⛈️';
        if (lowerCondition.includes('snowy') || lowerCondition.includes('snow')) return '❄️';
        if (lowerCondition.includes('fog')) return '🌫️';
        if (lowerCondition.includes('windy') || lowerCondition.includes('wind')) return '💨';
        
        return '🌤️';
    }

    getWeatherAnimationClass(condition) {
        if (!condition || !this._config.animated_background) return '';
        
        const lowerCondition = condition.toLowerCase();
        const now = new Date();
        const hour = now.getHours();
        const isNightTime = hour < 6 || hour >= 20;
        
        if (lowerCondition.includes('rainy') || lowerCondition.includes('rain')) {
            return `weather-rain${isNightTime ? '-night' : ''}`;
        }
        if (lowerCondition.includes('snowy') || lowerCondition.includes('snow')) {
            return `weather-snow${isNightTime ? '-night' : ''}`;
        }
        if (lowerCondition.includes('lightning') || lowerCondition.includes('storm')) {
            return `weather-storm${isNightTime ? '-night' : ''}`;
        }
        if (lowerCondition.includes('cloudy')) {
            return `weather-cloudy${isNightTime ? '-night' : ''}`;
        }
        if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
            return isNightTime ? 'weather-clear-night' : 'weather-sunny';
        }
        if (lowerCondition.includes('fog')) {
            return `weather-fog${isNightTime ? '-night' : ''}`;
        }
        
        return isNightTime ? 'weather-default-night' : 'weather-default';
    }

    getAnimatedWeatherIcon(condition) {
        if (!condition) return '🌤️';
        
        const lowerCondition = condition.toLowerCase();
        
        if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
            return html`<div class="weather-icon-animated sun-icon">☀️</div>`;
        }
        if (lowerCondition.includes('rainy') || lowerCondition.includes('rain')) {
            return html`<div class="weather-icon-animated rain-icon">🌧️</div>`;
        }
        if (lowerCondition.includes('snowy') || lowerCondition.includes('snow')) {
            return html`<div class="weather-icon-animated snow-icon">❄️</div>`;
        }
        if (lowerCondition.includes('lightning') || lowerCondition.includes('storm')) {
            return html`<div class="weather-icon-animated storm-icon">⛈️</div>`;
        }
        if (lowerCondition.includes('cloudy')) {
            return html`<div class="weather-icon-animated cloud-icon">☁️</div>`;
        }
        if (lowerCondition.includes('fog')) {
            return html`<div class="weather-icon-animated fog-icon">🌫️</div>`;
        }
        
        return html`<div class="weather-icon-animated default-icon">🌤️</div>`;
    }

    renderForecast(forecast) {
        if (!forecast || forecast.length === 0) {
            return html``;
        }
        
        return html`
            <div class="forecast-container">
                ${forecast.map(period => {
                    const temp = period.temperature || period.templow || '--';
                    const condition = period.condition || period.text || 'Unknown';
                    const name = period.datetime ? new Date(period.datetime).toLocaleDateString('en-US', { weekday: 'short' }) : 'N/A';
                    
                    return html`
                        <div class="forecast-item">
                            <div class="forecast-day">${name}</div>
                            <div class="forecast-icon">${this.getWeatherEmoji(condition)}</div>
                            <div class="forecast-temp">${temp}°</div>
                        </div>
                    `;
                })}
            </div>
        `;
    }

    render() {
        if (!this._config) {
            return html`<ha-card><div style="padding: 20px;">Loading configuration...</div></ha-card>`;
        }

        const now = new Date();
        let hour = now.getHours();
        
        if (this._config.am_pm) {
            hour = hour > 12 ? hour - 12 : hour;
            if (hour === 0) hour = 12;
        }
        
        const hourStr = hour < 10 ? "0" + hour : "" + hour;
        const minuteStr = now.getMinutes() < 10 ? "0" + now.getMinutes() : "" + now.getMinutes();
        
        const weatherData = this.getWeatherFromEntity();
        const weatherAnimationClass = this.getWeatherAnimationClass(weatherData.condition);
        const selectedTheme = themes[this._config.theme] || themes.default;

        return html`
            <style>
                ${selectedTheme.css}
                
                .flippy-container {
                    position: relative;
                    overflow: hidden;
                    transition: background 1s ease-in-out;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                
                /* Weather Animations - moved to background areas */
                .weather-rain::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 40%;
                    background-image: 
                        linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px);
                    background-size: 3px 100%, 7px 100%;
                    animation: rainFall 0.8s linear infinite, rainFall2 1.2s linear infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                
                @keyframes rainFall {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                
                @keyframes rainFall2 {
                    0% { transform: translateY(-100%) translateX(-1px); }
                    100% { transform: translateY(100%) translateX(-1px); }
                }
                
                .weather-snow::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 40%;
                    background-image: 
                        radial-gradient(1px 1px at 10px 15px, white, transparent),
                        radial-gradient(1px 1px at 20px 35px, white, transparent),
                        radial-gradient(1px 1px at 45px 20px, white, transparent);
                    background-repeat: repeat;
                    background-size: 50px 25px;
                    animation: snowFall 8s linear infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                
                @keyframes snowFall {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                
                .weather-cloudy::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: -20%;
                    width: 140%;
                    height: 40%;
                    background: 
                        radial-gradient(ellipse 50px 25px at 50% 50%, rgba(255,255,255,0.3), transparent),
                        radial-gradient(ellipse 40px 20px at 30% 40%, rgba(255,255,255,0.2), transparent);
                    animation: cloudDrift 15s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                
                @keyframes cloudDrift {
                    0%, 100% { transform: translateX(-5px); }
                    50% { transform: translateX(5px); }
                }
                
                .weather-storm::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 40%;
                    background: rgba(255,255,255,0.1);
                    animation: lightning 3s infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                
                @keyframes lightning {
                    0%, 90%, 100% { opacity: 0; }
                    5%, 10% { opacity: 1; }
                }
                
                /* Night mode animations */
                .weather-rain-night::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    height: 40%;
                    background-image: 
                        linear-gradient(90deg, rgba(173,216,230,0.4) 1px, transparent 1px);
                    background-size: 3px 100%;
                    animation: rainFall 0.8s linear infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                
                .weather-clear-night::after {
                    content: '⭐';
                    position: absolute;
                    top: 20%;
                    right: 20%;
                    font-size: 1em;
                    animation: twinkle 3s ease-in-out infinite;
                    pointer-events: none;
                    z-index: 1;
                }
                
                @keyframes twinkle {
                    0%, 100% { opacity: 0.3; transform: scale(0.8); }
                    50% { opacity: 1; transform: scale(1.2); }
                }
                
                /* Clock and weather content */
                .top-section {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: relative;
                    z-index: 2;
                    height: 60%;
                }
                
                .htc-clock {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .flip-card {
                    width: 40px;
                    height: 60px;
                    perspective: 1000px;
                }
                
                .flip-card-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transition: transform 0.3s;
                    transform-style: preserve-3d;
                }
                
                .flip-card-inner.flipping {
                    transform: rotateX(180deg);
                }
                
                .flip-card-face {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    backface-visibility: hidden;
                    background: rgba(255, 255, 255, 0.15);
                    border-radius: 8px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2em;
                    font-weight: bold;
                    color: #ffffff;
                    font-family: 'Courier New', monospace;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
                    backdrop-filter: blur(5px);
                }
                
                .clock-separator {
                    font-size: 2.5em;
                    color: white;
                    animation: blink 2s infinite;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                    margin: 0 5px;
                }
                
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0.3; }
                }
                
                .am-pm-indicator {
                    margin-left: 8px;
                    font-size: 0.9em;
                    background: rgba(255,255,255,0.2);
                    padding: 4px 8px;
                    border-radius: 10px;
                    font-weight: bold;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                }
                
                .weather-display {
                    display: flex;
                    align-items: center;
                    position: relative;
                }
                
                .weather-icon-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .weather-icon-animated {
                    font-size: 4em;
                    line-height: 1;
                }
                
                .sun-icon {
                    animation: sunRotate 4s linear infinite;
                }
                
                @keyframes sunRotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                .rain-icon {
                    animation: rainBounce 1s ease-in-out infinite;
                }
                
                @keyframes rainBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                
                .snow-icon {
                    animation: snowFloat 3s ease-in-out infinite;
                }
                
                @keyframes snowFloat {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-5px) rotate(180deg); }
                }
                
                .storm-icon {
                    animation: stormFlash 2s infinite;
                }
                
                @keyframes stormFlash {
                    0%, 90%, 100% { opacity: 1; }
                    5%, 10% { opacity: 0.7; }
                }
                
                .cloud-icon {
                    animation: cloudFloat 4s ease-in-out infinite;
                }
                
                @keyframes cloudFloat {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(3px); }
                }
                
                .fog-icon {
                    animation: fogWave 3s ease-in-out infinite;
                }
                
                @keyframes fogWave {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                
                .temperature-overlay {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 1.8em;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    background: rgba(0,0,0,0.4);
                    padding: 2px 8px;
                    border-radius: 15px;
                    backdrop-filter: blur(5px);
                }
                
                .bottom-section {
                    position: relative;
                    z-index: 2;
                    text-align: center;
                    height: 40%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                }
                
                .condition {
                    font-size: 0.9em;
                    opacity: 0.9;
                    margin-bottom: 8px;
                    text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
                }
                
                .forecast-container {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 5px;
                }
                
                .forecast-item {
                    text-align: center;
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 5px;
                    min-width: 50px;
                    backdrop-filter: blur(5px);
                }
                
                .forecast-day {
                    font-size: 0.7em;
                    opacity: 0.9;
                    font-weight: bold;
                    margin-bottom: 2px;
                }
                
                .forecast-icon {
                    font-size: 1.5em;
                    margin: 2px 0;
                }
                
                .forecast-temp {
                    font-size: 0.8em;
                    font-weight: bold;
                }
                
                .version-info {
                    font-size: 0.6em;
                    opacity: 0.7;
                    margin-top: 5px;
                    text-align: center;
                }
            </style>
            <ha-card>
                <div class="flippy-container ${weatherAnimationClass}">
                    <div class="top-section">
                        <div class="htc-clock">
                            <div class="flip-card">
                                <div class="flip-card-inner" data-digit="firstHourDigit">
                                    <div class="flip-card-face">${hourStr[0]}</div>
                                </div>
                            </div>
                            
                            <div class="flip-card">
                                <div class="flip-card-inner" data-digit="secondHourDigit">
                                    <div class="flip-card-face">${hourStr[1]}</div>
                                </div>
                            </div>
                            
                            <div class="clock-separator">:</div>
                            
                            <div class="flip-card">
                                <div class="flip-card-inner" data-digit="firstMinuteDigit">
                                    <div class="flip-card-face">${minuteStr[0]}</div>
                                </div>
                            </div>
                            
                            <div class="flip-card">
                                <div class="flip-card-inner" data-digit="secondMinuteDigit">
                                    <div class="flip-card-face">${minuteStr[1]}</div>
                                </div>
                            </div>
                            
                            ${this._config.am_pm ? html`
                                <div class="am-pm-indicator">
                                    ${now.getHours() >= 12 ? 'PM' : 'AM'}
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="weather-display">
                            <div class="weather-icon-container">
                                ${this.getAnimatedWeatherIcon(weatherData.condition)}
                                <div class="temperature-overlay">${weatherData.temperature}°</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="bottom-section">
                        <div class="condition">${weatherData.condition}</div>
                        ${this.renderForecast(weatherData.forecast)}
                        <div class="version-info">FlippyWeather v${flippyVersion}</div>
                    </div>
                </div>
            </ha-card>
        `;
    }

    getCardSize() {
        return 2;
    }

    set hass(hass) {
        this._hass = hass;
        this.requestUpdate();
    }

    get hass() {
        return this._hass;
    }
}

customElements.define("flippyweather-card", FlippyWeather);