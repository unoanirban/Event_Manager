import { useEvents } from '../context/EventContext';
import { Calendar, DollarSign, CalendarDays } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { events, loading } = useEvents();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const totalEvents = events.length;
  const upcomingEvents = events.filter(e => new Date(e.date) > new Date()).length;
  const pendingRevenue = events
    .filter(e => e.paymentStatus === 'Pending')
    .reduce((sum, e) => sum + (e.baseAmount || 0), 0);

  const overallProgress = () => {
    const allTasks = events.flatMap(e => e.tasks || []);
    if (allTasks.length === 0) return 0;
    const completed = allTasks.filter(t => t.isCompleted).length;
    return Math.round((completed / allTasks.length) * 100);
  };

  const recentEvents = [...events]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 3);

  const stats = [
    { label: 'Total Events', value: totalEvents, icon: CalendarDays, color: 'bg-blue-500' },
    { label: 'Upcoming Events', value: upcomingEvents, icon: Calendar, color: 'bg-purple-500' },
    { label: 'Pending Revenue', value: `₹${pendingRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-yellow-500' },
  ];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
              </div>
              <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="text-white" size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Completion Rate</h3>
          <span className="text-2xl font-bold text-purple-600">{overallProgress()}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-purple-600 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress()}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentEvents.length === 0 ? (
            <p className="text-gray-500">No events yet. Create your first event!</p>
          ) : (
            recentEvents.map(event => (
              <div key={event.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-800">{event.clientName}</p>
                  <p className="text-sm text-gray-500">{event.category} • {event.date}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  event.paymentStatus === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {event.paymentStatus}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;