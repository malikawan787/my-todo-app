import { Dark } from 'quasar';

export const DARK_KEY = 'todo_dark';

// Runs once when the app starts: restore the theme the user picked last time.
// If they never picked one, follow the computer's own light/dark setting ('auto').
export default () => {
  const saved = localStorage.getItem(DARK_KEY);
  Dark.set(saved === null ? 'auto' : saved === 'true');
};