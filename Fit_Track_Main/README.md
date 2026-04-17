
# FitTrack

Welcome to FitTrack, A personalized web application which allows users to log workouts, track daily nutrition, and analyze water intake.

Users are able to analyze their progress through digitalized graphics, including bar charts & pie charts, viewing their progress from week to week.


## Development Tools

FitTrack Pro uses Vue 3, Node.JS, and Express.js, in order to build a smooth web application for users, with both dark mode and light mode capabilities.
## How To Run

```
1. CD into Fit_Track_Main

2. In Terminal: npm install

3. npm start

4. Open localhost on preferred browser
```

## How To Use
1. Open the app in your browser at:

   `http://localhost:3000`
   or whatever your preferred port

2. Log in using the default demo account:

   Username: `demo@fittrack.com`  
   Password: `demo123`

   Or create your own account. For example:

   Username: `example3@example.com`  
   Password: `example3`

3. After logging in, use the navigation menu to access the main features of the app:

### Workouts
- Create a workout plan by entering a [plan name] and optional [mydescription]
- Add one or more exercises to the plan
- Each exercise can include:
  - Exercise name
  - Sets
  - Reps
  - Work time in seconds
  - Rest time in seconds
  - Weight in kg
- Click **Save Plan** to store the workout
- Click **Start** on a saved plan to begin workout mode
- During workout mode, the app tracks active sets, rest periods, total progress, and workout duration

Note: 
Older workout plans created before the custom timer update will still use the default active time of **45 seconds** unless a custom work time is entered.

### Nutrition
- Add a food entry by entering a food name and nutrition values
- **Calories are required**
- Protein, carbs, and fat must be valid non-negative numbers

Example valid food entry:

- Food name: Sample Meal
- Calories: `299`
- Protein: `11g`
- Carbs: `55g`
- Fat: `11g`

**Note about nutrition entry restrictions:**
- Calories must be a valid non-negative number
- Protein, carbs, and fat must be valid non-negative numbers
- Nutrition values should be realistic and consistent
- Macro-based calories should not be wildly higher than the entered total calories  
  \(`4 × protein + 4 × carbs + 9 × fat`\)

### Water Intake
- Water can be logged separately from food
- Use the quick-add buttons such as:
  - `+150ml`
  - `+250ml`
  - `+350ml`
  - `+500ml`
- Or enter a custom amount in milliliters and click: "Add"

**Restriction:**  
Water amount must be a valid positive number

### Body Tracking
- Enter your body weight in kilograms
- You may also add notes
- If a weight entry already exists for the same day, the app updates that entry instead of creating a duplicate

 
- Weight must be a valid positive number

### Analytics and Progress
- Use the analytics and dashboard sections to review progress over time
- FitTrack includes visual summaries such as charts and graphs for workouts, nutrition, and hydration progress