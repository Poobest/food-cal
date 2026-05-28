# CONTEXT.md — Food Nutrition Calculator (LINE LIFF)

## Glossary

### User
A person who has registered with email and password. A User has one Profile and zero or more Meal Logs.

### Profile
A User's physical and goal data used to calculate TDEE: gender, age, weight (kg), height (cm), Activity Level, and Goal Type. Collected during Onboarding.

### Onboarding
The first-run flow after registration where the system collects Profile data, calculates TDEE, and sets the user's Nutrition Goal.

### Goal Type
The User's fitness objective. One of: `LOSE_WEIGHT`, `GAIN_MUSCLE`, `MAINTAIN`.

### Activity Level
The User's typical physical activity. One of five levels: `SEDENTARY`, `LIGHTLY_ACTIVE`, `MODERATELY_ACTIVE`, `VERY_ACTIVE`, `EXTRA_ACTIVE`. Used in TDEE calculation.

### TDEE
Total Daily Energy Expenditure — the estimated total calories a User burns per day. Calculated using the Mifflin-St Jeor formula applied to Profile data. TDEE is the basis for the Nutrition Goal.

### Nutrition Goal
The recommended daily intake targets for each Tracked Nutrient, derived from TDEE and Goal Type. A User has one active Nutrition Goal at a time.

### Tracked Nutrients
The fixed set of nutrients the system monitors: Calories (kcal), Protein (g), Carbohydrates (g), Dietary Fiber (g), Sugar (g), Total Fat (g), Saturated Fat (g), Sodium (mg).

### Food Item
A specific food entry from the USDA FoodData Central database. Contains a name and values for each Tracked Nutrient per 100g (or per serving).

### Food Recognition
The process of sending a photo to the OpenRouter.ai API, which returns the name of the identified Food Item. The name is then used to query the USDA FoodData Central API.

### Meal Log
A record that a User consumed a Food Item at a specific date and time, with a quantity (in grams or servings). The atomic unit of food tracking.

### Daily Summary
The aggregated Tracked Nutrient totals from all Meal Logs for a given calendar day, compared against the User's Nutrition Goal.

### LIFF
LINE Front-end Framework — the platform this app runs on, embedded inside the LINE messaging app. The app is accessed via a LIFF URL registered in the LINE Developers Console.

### Dashboard
The main screen shown when a User opens the LIFF app. Displays the Daily Summary for today and provides access to log a new Meal Log.
