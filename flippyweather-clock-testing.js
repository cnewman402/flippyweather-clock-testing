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

const flippyVersion = "3.0.0-testing";

console.info("%c 🌤️ FlippyWeather Clock Testing %c " + flippyVersion + " ", "color: white; background: #555555; border-radius: 3px 0 0 3px; padding: 1px 0;", "color: white; background: #3a7ec6; border-radius: 0 3px 3px 0; padding: 1px 0;");

class FlippyWeatherTesting extends LitElement {
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

    getWeatherIconClass(condition) {
        if (!condition) return 'sun';
        
        const lowerCondition = condition.toLowerCase();
        
        if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) return 'sun';
        if (lowerCondition.includes('rainy') || lowerCondition.includes('rain')) return 'rain';
        if (lowerCondition.includes('snowy') || lowerCondition.includes('snow')) return 'snow';
        if (lowerCondition.includes('lightning') || lowerCondition.includes('storm')) return 'storm';
        if (lowerCondition.includes('cloudy')) return 'cloud';
        if (lowerCondition.includes('fog')) return 'fog';
        
        return 'sun';
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
        
        const weatherIcon = this.getWeatherEmoji(weatherData.condition);
        const iconClass = this.getWeatherIconClass(weatherData.condition);

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
                
                .weather-icon-large {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 300px;
                    z-index: 1;
                    pointer-events: none;
                    line-height: 1;
                    filter: none;
                    text-shadow: none;
                }
                
                .weather-icon-large.sun {
                    animation: sunSpin 6s linear infinite;
                }
                
                .weather-icon-large.rain {
                    animation: rainShake 2s ease-in-out infinite;
                }
                
                .weather-icon-large.snow {
                    animation: snowSpin 8s ease-in-out infinite;
                }
                
                .weather-icon-large.storm {
                    animation: stormShake 1.5s ease-in-out infinite;
                }
                
                .weather-icon-large.cloud {
                    animation: cloudFloat 6s ease-in-out infinite;
                }
                
                .weather-icon-large.fog {
                    animation: fogPulse 4s ease-in-out infinite;
                }
                
                @keyframes sunSpin {
                    0% { transform: rotate(0deg) scale(1); }
                    25% { transform: rotate(90deg) scale(1.1); }
                    50% { transform: rotate(180deg) scale(1.2); }
                    75% { transform: rotate(270deg) scale(1.1); }
                    100% { transform: rotate(360deg) scale(1); }
                }
                
                @keyframes rainShake {
                    0% { transform: translateY(0px) translateX(0px) scale(1); }
                    25% { transform: translateY(-15px) translateX(-8px) scale(0.95); }
                    50% { transform: translateY(-5px) translateX(8px) scale(1.05); }
                    75% { transform: translateY(-15px) translateX(-5px) scale(0.95); }
                    100% { transform: translateY(0px) translateX(0px) scale(1); }
                }
                
                @keyframes snowSpin {
                    0% { transform: rotate(0deg) scale(1) translateY(0px); }
                    16.6% { transform: rotate(60deg) scale(1.05) translateY(-5px); }
                    33.3% { transform: rotate(120deg) scale(1.1) translateY(-10px); }
                    50% { transform: rotate(180deg) scale(1.2) translateY(-15px); }
                    66.6% { transform: rotate(240deg) scale(1.1) translateY(-10px); }
                    83.3% { transform: rotate(300deg) scale(1.05) translateY(-5px); }
                    100% { transform: rotate(360deg) scale(1) translateY(0px); }
                }
                
                @keyframes stormShake {
                    0% { transform: scale(1) rotate(0deg) translateX(0px); }
                    10% { transform: scale(1.4) rotate(-3deg) translateX(-5px); }
                    20% { transform: scale(0.9) rotate(2deg) translateX(5px); }
                    30% { transform: scale(1.3) rotate(-2deg) translateX(-3px); }
                    40% { transform: scale(1.1) rotate(1deg) translateX(3px); }
                    50% { transform: scale(1.5) rotate(-4deg) translateX(-7px); }
                    60% { transform: scale(0.8) rotate(3deg) translateX(7px); }
                    70% { transform: scale(1.2) rotate(-1deg) translateX(-2px); }
                    80% { transform: scale(1) rotate(0deg) translateX(2px); }
                    90% { transform: scale(1.3) rotate(-2deg) translateX(-4px); }
                    100% { transform: scale(1) rotate(0deg) translateX(0px); }
                }
                
                @keyframes cloudFloat {
                    0% { transform: translateX(-25px) translateY(0px) scale(1); }
                    25% { transform: translateX(-10px) translateY(-8px) scale(1.05); }
                    50% { transform: translateX(25px) translateY(-5px) scale(1.1); }
                    75% { transform: translateX(10px) translateY(-8px) scale(1.05); }
                    100% { transform: translateX(-25px) translateY(0px) scale(1); }
                }
                
                @keyframes fogPulse {
                    0% { transform: scale(1); opacity: 1; }
                    25% { transform: scale(1.1); opacity: 0.7; }
                    50% { transform: scale(1.3); opacity: 0.4; }
                    75% { transform: scale(1.1); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
                
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
                    height: 100%;
                }
                
                .temperature-overlay {
                    font-size: 1.5em;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    padding: 4px 8px;
                    border-radius: 10px;
                    line-height: 1;
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
            </style>
            <ha-card>
                <div class="flippy-container ${weatherAnimationClass}">
                    <div class="weather-icon-large ${iconClass}">${weatherIcon}</div>
                    
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
                            <div class="temperature-overlay">${weatherData.temperature}°</div>
                        </div>
                    </div>
                    
                    <div class="bottom-section">
                        <div class="condition">${weatherData.condition}</div>
                        ${this.renderForecast(weatherData.forecast)}
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

customElements.define("flippyweather-clock-testing", FlippyWeatherTesting);
