#include <FastLED.h>

#define LED_PIN 7
#define NUM_LEDS 240
#define LED_TYPE WS2812B
#define COLOR_ORDER GRB
CRGBPalette16 currentPalette;
TBlendType currentBlending;
int BRIGHTNESS = 0;
int rgb[3] = {148, 187, 204};
CRGB leds[NUM_LEDS];

void setup()
{

    pinMode(2, INPUT);
    pinMode(3, INPUT);
    pinMode(4, INPUT);
    pinMode(8, OUTPUT);
    pinMode(A0, INPUT);
    delay(3000);
    Serial.begin(9600);
    LEDS.addLeds<LED_TYPE, LED_PIN, COLOR_ORDER>(leds, NUM_LEDS); //.setCorrection(TypicalLEDStrip);
    FastLED.clear();
    FastLED.setBrightness(BRIGHTNESS);
    for (int i = 0; i < NUM_LEDS; i++)
    {
        leds[i].setRGB(rgb[0], rgb[1], rgb[2]);
    }
    FastLED.show();
    currentPalette = RainbowColors_p;
    currentBlending = LINEARBLEND;
}

// Clean ^

void loop()
{

    if (RGBshift == true)
    {
        delay(10);
        static uint8_t startIndex = 0;
        startIndex = startIndex + 1; /* motion speed */

        FillLEDsFromPaletteColors(startIndex);

        FastLED.show();
    }
    if (Serial.available())
    {
        int value = Serial.read();

        if (value == 123)
        {
            while (!Serial.available())
            {
            }
            rgb[0] = Serial.read(); //(Serial.read() - rgb[0]) / 50;
            while (!Serial.available())
            {
            }
            rgb[1] = Serial.read(); // (Serial.read() - rgb[1]) / 50;
            while (!Serial.available())
            {
            }
            rgb[2] = Serial.read(); //(Serial.read() - rgb[2]) / 50;
            RGBshift = false;
            shift = false;
        }
        else if (value == 124)
        {
            while (!Serial.available())
            {
            }
            BRIGHTNESS = Serial.read();
            FastLED.setBrightness(BRIGHTNESS);
        }
        else if (value == 125)
        {
            RGBshift = true;
        }
        else if (value == 126)
        {
            digitalWrite(8, HIGH);
            delay(100);
            digitalWrite(8, LOW);
        }

        if (!RGBshift)
        {
            FastLED.clear();
            for (int i = 0; i < num; i++)
            {
                leds[i].setRGB(rgb[0], rgb[1], rgb[2]);
                //delay(5);
            }
            FastLED.show();
        }
    }
}

void FillLEDsFromPaletteColors(uint8_t colorIndex)
{
    uint8_t brightness = 255;

    for (int i = 0; i < NUM_LEDS; i++)
    {
        leds[i] = ColorFromPalette(currentPalette, colorIndex, brightness, currentBlending);
        colorIndex += 1;
    }
