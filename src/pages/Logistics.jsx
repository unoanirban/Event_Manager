import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEvents } from '../context/EventContext';
import { useReactToPrint } from 'react-to-print';
import { Printer, Plus, Trash2, Check, ChevronLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const Logistics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEvent, updateEvent, loading } = useEvents();
  const invoiceRef = useRef();

  const [event, setEvent] = useState(null);
  const [taxRate, setTaxRate] = useState(18);
  const [discount, setDiscount] = useState(0);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    const foundEvent = getEvent(id);
    if (foundEvent) {
      setEvent(foundEvent);
      setTaxRate(foundEvent.invoice?.taxRate || 18);
      setDiscount(foundEvent.invoice?.discount || 0);
    }
  }, [id, getEvent]);

  const calculateTotal = () => {
    if (!event) return 0;
    const baseAmount = event.baseAmount || 0;
    const taxAmount = baseAmount * (taxRate / 100);
    return (baseAmount + taxAmount) - discount;
  };

  const handleFinalize = async () => {
    if (!event) return;
    await updateEvent(event.id, {
      paymentStatus: 'Invoiced',
      invoice: {
        ...event.invoice,
        taxRate,
        discount,
        invoiceNumber: event.invoice?.invoiceNumber || `INV-${new Date().getFullYear()}-${Date.now()}`
      }
    });
    setEvent(prev => ({
      ...prev,
      paymentStatus: 'Invoiced',
      invoice: { ...prev.invoice, taxRate, discount }
    }));
  };

  const handleAddTask = async () => {
    if (!newTask.trim() || !event) return;
    const task = {
      id: uuidv4(),
      text: newTask,
      isCompleted: false
    };
    const updatedTasks = [...(event.tasks || []), task];
    await updateEvent(event.id, { tasks: updatedTasks });
    setEvent(prev => ({ ...prev, tasks: updatedTasks }));
    setNewTask('');
  };

  const handleToggleTask = async (taskId) => {
    if (!event) return;
    const updatedTasks = event.tasks.map(t =>
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    );
    await updateEvent(event.id, { tasks: updatedTasks });
    setEvent(prev => ({ ...prev, tasks: updatedTasks }));
  };

  const handleDeleteTask = async (taskId) => {
    if (!event) return;
    const updatedTasks = event.tasks.filter(t => t.id !== taskId);
    await updateEvent(event.id, { tasks: updatedTasks });
    setEvent(prev => ({ ...prev, tasks: updatedTasks }));
  };

  const handlePrint = useReactToPrint({
    contentRef: invoiceRef,
    documentTitle: `Invoice-${event?.invoice?.invoiceNumber || 'Event'}`
  });

  const taskProgress = () => {
    if (!event || !event.tasks || event.tasks.length === 0) return 0;
    const completed = event.tasks.filter(t => t.isCompleted).length;
    return Math.round((completed / event.tasks.length) * 100);
  };

  if (loading || !event) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/registry')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">Logistics & Edit</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Invoice Generator</h3>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Printer size={18} /> Print Invoice
            </button>
          </div>

          <div ref={invoiceRef} className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-bold text-gray-800">INVOICE</h4>
                <p className="text-sm text-gray-500">{event.invoice?.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-800">{event.clientName}</p>
                <p className="text-sm text-gray-500">{event.email}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Event Type</span>
                <span className="font-medium text-gray-800">{event.category}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Date</span>
                <span className="font-medium text-gray-800">{event.date}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Duration</span>
                <span className="font-medium text-gray-800">{event.duration} hours</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Base Amount</span>
                <span className="font-medium text-gray-800">₹{event.baseAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 mb-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-600">Tax Rate (%)</label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-right"
                  min="0"
                  max="100"
                />
              </div>
              <div className="flex justify-between items-center">
                <label className="text-sm text-gray-600">Discount (₹)</label>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-right"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2 py-4 border-t border-gray-200">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal (with tax)</span>
                <span className="font-medium text-gray-800">
                  ₹{((event.baseAmount || 0) * (1 + taxRate / 100)).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span className="text-gray-800">Total</span>
                <span className="text-purple-600">₹{calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleFinalize}
              className="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Finalize Invoice
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Task Checklist</h3>

          <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${taskProgress()}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mb-6">{taskProgress()}% Complete</p>

          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
              placeholder="Add new task..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <button
              onClick={handleAddTask}
              className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-2">
            {!event.tasks || event.tasks.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No tasks yet. Add your first task above!</p>
            ) : (
              event.tasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                      task.isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-500'
                    }`}
                  >
                    {task.isCompleted && <Check size={14} />}
                  </button>
                  <span className={`flex-1 ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {task.text}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Logistics;