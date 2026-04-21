import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarPlus, CalendarSearch, Settings } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/create', icon: CalendarPlus, label: 'Create Event' },
    { to: '/registry', icon: CalendarSearch, label: 'Registry' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white p-6 flex flex-col">
      <h1 className="text-2xl font-bold mb-8">EventFlow</h1>
      <nav className="flex-1 space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive ? 'bg-purple-600' : 'hover:bg-slate-800'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;