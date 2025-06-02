# LLM Agent Discussion Visualization

This web application provides an interactive visualization of multi-agent collaborative reasoning discussions. It allows you to explore how different AI personas work together to answer questions, showing the step-by-step process and voting results for each turn.

## Features

- View the discussion step-by-step through multiple turns
- See different AI personas and their contributions
- Track voting and consensus formation across turns
- Visualize the final answer and agreement process

## How to Use

1. Open `index.html` in a modern web browser
2. Navigate through the discussion using the "Previous Turn" and "Next Turn" buttons
3. Examine each agent's contribution and reasoning in the center panel
4. See voting results for each turn in the right panel

## Data Format

The application reads data from `discussion-data.json`, which should follow the format demonstrated in the included example. This format captures:

- Agent personas and descriptions
- Task instructions and questions
- Messages exchanged during each turn
- Voting results for each turn
- Final consensus answer

## Customizing

To visualize a different discussion:
1. Replace the content in `discussion-data.json` with your own data following the same format
2. Refresh the page to see the new discussion

## Technical Details

- Built with pure HTML, CSS, and JavaScript (no dependencies)
- Responsive design works on desktop and mobile devices
- Color-coded agent messages for easier tracking
