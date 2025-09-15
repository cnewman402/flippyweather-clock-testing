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
                height: 220px;
            }
            .flippy-container.weather-clear-night,
            .flippy-container.weather-default-night,
            .flippy-container.weather-rain-night,
            .flippy-container.weather-snow-night,
            .flippy-container.weather-storm-night,
            .flippy-container.weather-cloudy-night,
            .flippy-container.weather-fog-night {
                background: linear-gradient(135deg, #2c3e50, #34495e, #1a252f);
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
    weather_entity: null,
    temperature_unit: 'fahrenheit'
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
            weather_entity: 'weather.home',
            temperature_unit: 'fahrenheit'
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

    getTemperatureUnit() {
        return this._config.temperature_unit === 'celsius' ? 'C' : 'F';
    }

    getWeatherFromEntity() {
        if (!this.hass || !this._config.weather_entity) {
            return {
                temperature: '--',
                condition: 'Unknown',
                icon: '🌤️'
            };
        }

        const entity = this.hass.states[this._config.weather_entity];
        if (!entity) {
            return {
                temperature: '--',
                condition: 'Entity not found',
                icon: '❓'
            };
        }

        const temperature = entity.attributes.temperature || '--';
        const condition = entity.state || 'Unknown';
        
        // Use temperature as-is from Home Assistant (it's already in the correct unit)
        const displayTemp = temperature === '--' ? '--' : Math.round(temperature);
        
        return {
            temperature: displayTemp,
            condition: condition,
            icon: this.getWeatherEmoji(condition)
        };
    }

    getWeatherEmoji(condition) {
        if (!condition) return '🌤️';
        
        const lowerCondition = condition.toLowerCase();
        
        // Check for compound conditions first (more specific)
        if (lowerCondition.includes('snowy') || lowerCondition.includes('snow')) return '❄️';
        if (lowerCondition.includes('rainy') || lowerCondition.includes('rain')) return '🌧️';
        if (lowerCondition.includes('lightning') || lowerCondition.includes('storm') || lowerCondition.includes('thunderstorm')) return '⛈️';
        if (lowerCondition.includes('fog') || lowerCondition.includes('foggy') || lowerCondition.includes('mist')) return '🌫️';
        if (lowerCondition.includes('windy') || lowerCondition.includes('wind')) return '💨';
        
        // Then check for single conditions
        if (lowerCondition.includes('sunny') || lowerCondition.includes('clear') || lowerCondition.includes('sun')) return '☀️';
        if (lowerCondition.includes('partlycloudy') || lowerCondition.includes('partly-cloudy') || lowerCondition.includes('partly cloudy')) return '⛅';
        if (lowerCondition.includes('cloudy') || lowerCondition.includes('overcast')) return '☁️';
        if (lowerCondition.includes('hail') || lowerCondition.includes('sleet')) return '🧊';
        if (lowerCondition.includes('drizzle')) return '🌦️';
        
        return '🌤️';
    }

    getWeatherAnimationClass(condition) {
        if (!condition || !this._config.animated_background) return '';
        
        const lowerCondition = condition.toLowerCase();
        const now = new Date();
        const hour = now.getHours();
        const isNightTime = hour < 6 || hour >= 20;
        
        // Priority order: most specific conditions first
        if (lowerCondition.includes('lightning') || lowerCondition.includes('storm') || lowerCondition.includes('thunderstorm')) {
            return `weather-storm${isNightTime ? '-night' : ''}`;
        }
        if (lowerCondition.includes('snowy') || lowerCondition.includes('snow') || lowerCondition.includes('blizzard')) {
            return `weather-snow${isNightTime ? '-night' : ''}`;
        }
        if (lowerCondition.includes('rainy') || lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
            return `weather-rain${isNightTime ? '-night' : ''}`;
        }
        if (lowerCondition.includes('fog') || lowerCondition.includes('foggy') || lowerCondition.includes('mist')) {
            return `weather-fog${isNightTime ? '-night' : ''}`;
        }
        if (lowerCondition.includes('cloudy') || lowerCondition.includes('overcast')) {
            return `weather-cloudy${isNightTime ? '-night' : ''}`;
        }
        if (lowerCondition.includes('windy') || lowerCondition.includes('wind')) {
            return `weather-cloudy${isNightTime ? '-night' : ''}`;  // Use cloudy animation for wind
        }
        if (lowerCondition.includes('sunny') || lowerCondition.includes('clear') || lowerCondition.includes('sun')) {
            return isNightTime ? 'weather-clear-night' : 'weather-sunny';
        }
        
        return isNightTime ? 'weather-default-night' : 'weather-default';
    }

    getWeatherIconClass(condition) {
        if (!condition) return 'sun';
        
        const lowerCondition = condition.toLowerCase();
        
        // Priority order for icon animations
        if (lowerCondition.includes('lightning') || lowerCondition.includes('storm') || lowerCondition.includes('thunderstorm')) return 'storm';
        if (lowerCondition.includes('snowy') || lowerCondition.includes('snow') || lowerCondition.includes('blizzard')) return 'snow';
        if (lowerCondition.includes('rainy') || lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return 'rain';
        if (lowerCondition.includes('fog') || lowerCondition.includes('foggy') || lowerCondition.includes('mist')) return 'fog';
        if (lowerCondition.includes('cloudy') || lowerCondition.includes('overcast')) return 'cloud';
        if (lowerCondition.includes('windy') || lowerCondition.includes('wind')) return 'cloud';  // Use cloud animation for wind
        if (lowerCondition.includes('sunny') || lowerCondition.includes('clear') || lowerCondition.includes('sun')) return 'sun';
        
        return 'sun';
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
        const tempUnit = this.getTemperatureUnit();

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
                    opacity: 0.3;
                }
                
                /* Night mode styles */
                .flippy-container.weather-clear-night,
                .flippy-container.weather-default-night {
                    background: linear-gradient(135deg, #1a252f, #2c3e50, #34495e);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
                }
                
                .flippy-container.weather-rain-night {
                    background: linear-gradient(135deg, #1e3a8a, #1e40af, #2563eb);
                    box-shadow: 0 8px 32px rgba(30, 58, 138, 0.4);
                }
                
                .flippy-container.weather-snow-night {
                    background: linear-gradient(135deg, #374151, #4b5563, #6b7280);
                    box-shadow: 0 8px 32px rgba(55, 65, 81, 0.4);
                }
                
                .flippy-container.weather-storm-night {
                    background: linear-gradient(135deg, #111827, #1f2937, #374151);
                    box-shadow: 0 8px 32px rgba(17, 24, 39, 0.8);
                }
                
                .flippy-container.weather-cloudy-night {
                    background: linear-gradient(135deg, #374151, #4b5563, #6b7280);
                    box-shadow: 0 8px 32px rgba(55, 65, 81, 0.4);
                }
                
                .flippy-container.weather-fog-night {
                    background: linear-gradient(135deg, #4b5563, #6b7280, #9ca3af);
                    box-shadow: 0 8px 32px rgba(75, 85, 99, 0.4);
                }
                
                /* Night mode icon animations */
                .weather-icon-large.night {
                    opacity: 0.4;
                    filter: brightness(0.7);
                }
                
                /* Darker flip cards for night mode */
                .flippy-container.weather-clear-night .flip-card-face,
                .flippy-container.weather-default-night .flip-card-face,
                .flippy-container.weather-rain-night .flip-card-face,
                .flippy-container.weather-snow-night .flip-card-face,
                .flippy-container.weather-storm-night .flip-card-face,
                .flippy-container.weather-cloudy-night .flip-card-face,
                .flippy-container.weather-fog-night .flip-card-face {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                }
                
                /* Night mode temperature and condition text */
                .flippy-container.weather-clear-night .temperature-overlay,
                .flippy-container.weather-default-night .temperature-overlay,
                .flippy-container.weather-rain-night .temperature-overlay,
                .flippy-container.weather-snow-night .temperature-overlay,
                .flippy-container.weather-storm-night .temperature-overlay,
                .flippy-container.weather-cloudy-night .temperature-overlay,
                .flippy-container.weather-fog-night .temperature-overlay {
                    text-shadow: 2px 2px 8px rgba(0,0,0,0.9);
                }
                
                .flippy-container.weather-clear-night .condition,
                .flippy-container.weather-default-night .condition,
                .flippy-container.weather-rain-night .condition,
                .flippy-container.weather-snow-night .condition,
                .flippy-container.weather-storm-night .condition,
                .flippy-container.weather-cloudy-night .condition,
                .flippy-container.weather-fog-night .condition {
                    text-shadow: 2px 2px 6px rgba(0,0,0,0.9);
                }
                
                .container {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                }
                
                .top-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    position: relative;
                    z-index: 2;
                    flex: 1;
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
                
                .temperature-overlay {
                    font-size: 4em;
                    font-weight: bold;
                    color: white;
                    text-shadow: 3px 3px 6px rgba(0,0,0,0.9);
                }
                
                .bottom-row {
                    position: relative;
                    z-index: 10;
                    text-align: center;
                    padding-top: 15px;
                }
                
                .condition {
                    font-size: 1.2em;
                    font-weight: bold;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
                }
            </style>
            <ha-card>
                <div class="flippy-container ${weatherAnimationClass}">
                    <div class="weather-icon-large ${iconClass}">${weatherIcon}</div>
                    
                    <div class="container">
                        <div class="top-row">
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
                            
                            <div class="temperature-overlay">${weatherData.temperature}°${tempUnit}</div>
                        </div>
                        
                        <div class="bottom-row">
                            <div class="condition">${weatherData.condition}</div>
                        </div>
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
