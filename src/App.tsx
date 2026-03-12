import { Routes, Route, NavLink } from 'react-router-dom';
import AccessGate from './components/AccessGate';
import MealBankPage from './pages/MealBankPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import PlannerPage from './pages/PlannerPage';
import GroceryListPage from './pages/GroceryListPage';
import PantryPage from './pages/PantryPage';
import SnacksPage from './pages/SnacksPage';
import Beans101Page from './pages/Beans101Page';

function Nav() {
  return (
    <nav className="nav">
      <div className="nav-inner">
        <span className="nav-brand">The Meal Bank</span>
        <div className="nav-links">
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/">Meals</NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/planner">Planner</NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/grocery">Grocery</NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/pantry">Pantry</NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/snacks">Snacks</NavLink>
          <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/beans101">Beans 101</NavLink>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AccessGate>
      <Nav />
      <Routes>
        <Route path="/" element={<MealBankPage />} />
        <Route path="/recipe/:id" element={<RecipeDetailPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/grocery" element={<GroceryListPage />} />
        <Route path="/pantry" element={<PantryPage />} />
        <Route path="/snacks" element={<SnacksPage />} />
        <Route path="/beans101" element={<Beans101Page />} />
      </Routes>
    </AccessGate>
  );
}
