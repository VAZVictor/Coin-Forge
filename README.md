# Ascension: The Infinite Clicker

> "You started by clicking a button. Now, you are abdicating the throne of the multiverse."

A deeply addictive, highly polished browser clicker game built with Angular 17+. Designed to test the limits of exponential mathematics, optimize UI feedback loops, and ruin productivity. 

Built as a custom surprise for a fellow clicker addict.

---

## Core Features

### The 5 Realms (Prestige System)
Most clickers stop at a single reset. This game features 5 distinct prestige layers, each completely resetting your previous progress in exchange for game-breaking, permanent multipliers:

1. **Rebirth:** Reset your coins and basic upgrades to earn Rebirth Tokens. Each token provides a baseline boost to click power and passive generation.
2. **Prestige (Reset World):** Shatter your current reality to earn World Shards. Shards multiply the output of the Rebirth layer.
3. **Reincarnation:** Transcend your physical form to earn Souls. Souls unlock passive multiplier trees and boost all lower layers.
4. **Ascension:** Become a divine entity to earn Divinity. Divinity provides exponential multipliers to all production below it.
5. **Abdication:** Step down from the ultimate throne to earn Legacy. Legacy is truly permanent and never resets, providing a massive global multiplier to the entire game.

### Satisfying "Juice" and UI
A clicker is only as good as its feedback. The UI is heavily optimized for tactile satisfaction:
- **Dynamic Click Feedback:** The main button squishes and bounces using spring-easing CSS animations on every press.
- **Floating Text:** Click values spawn exactly at the mouse cursor coordinates, drifting upward and fading out.
- **Particle Systems:** Clicking triggers bursts of particles that explode outward from the button.
- **Screen Shake:** Subtle container translation on milestone clicks to emphasize impact.
- **Dark Mode Aesthetics:** Rich gradients, glowing accents, and modern typography.
- **Achievement Toasts:** Header Like Toasts appear whenever reaching a new step in the Achievements category.

### Massive Mathematics
- The engine automatically formats large numbers by transitioning from standard integers to metric suffixes (K, M, B, T) and switching to scientific notation (e.g., 1.23e34) when values exceed the trillion range.
- Exponential cost scaling for all upgrades to ensure long-term progression balance.

### Quality of Life
- **Auto-Save:** Game state is continuously serialized to a SQLite database.
- **Auto-/Multi Buy:** Many Upgrades can be bought at once and be fully automated. 
- **Achievements:** Milestone tracking across clicking, upgrading, prestige layers and time spent in the game.

---

## Technical Highlights

This project was built to demonstrate modern frontend architecture and complex state management:

- **Angular 17+:** Built entirely using Standalone Components.
- **Angular Signals:** Replaced traditional RxJS and NgModules for highly performant, fine-grained reactivity.
- **Centralized State:** All game logic, math, and progression are handled in a centralized `GameStateService`, keeping UI components strictly presentational.
- **Performance:** Optimized game loop using `setInterval` and `requestAnimationFrame` principles to handle thousands of UI updates per second without dropping frames.
