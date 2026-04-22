Viewed SmartGuide.jsx:1-36

These two files work together to create the overarching shell and navigation structure for your entire application. Here is a breakdown of their roles:

### 1. `Layout.jsx` (The Structural Wrapper)
**Role:** It acts as the master template or "frame" for your application pages.
*   **Structural Grid:** It uses Flexbox (`flex min-h-screen`) to split the screen into two main areas: a fixed area for the sidebar on the left, and a flexible main content area on the right.
*   **The `<Outlet />` component:** This is a special component from `react-router-dom`. Think of it as a placeholder. Whenever you navigate to a different page (like Dashboard or Create Event), `Layout.jsx` stays exactly where it is, and only the `<Outlet />` swaps out its content for the new page.

### 2. `Sidebar.jsx` (The Navigation Menu)
**Role:** It provides the persistent left-hand navigation menu for the user to move between different modules.
*   **Routing Links:** It uses `react-router-dom`'s `<NavLink>` to create links to your core modules: Dashboard (`/`), Create Event (`/create`), and Registry (`/registry`).
*   **Active State Styling:** It automatically detects which page you are currently on and applies a different color (`bg-purple-600`) to highlight the active menu item, helping users understand where they are in the app.

**How they connect in `App.jsx`:**
In your `App.jsx`, `Layout` is set up as the parent route, and pages like `Dashboard` and `Registry` are set up as its children. When a user visits the app, React Router renders the `Layout` (which includes the `Sidebar`), and then drops the specific page component into `Layout`'s `<Outlet />` area.