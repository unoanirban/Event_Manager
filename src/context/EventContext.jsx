import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const EventContext = createContext();

export const useEvents = () => useContext(EventContext);

export const EventProvider = ({ children }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/events');
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const addEvent = async (eventData) => {
    const newEvent = {
      id: uuidv4(),
      ...eventData,
      paymentStatus: 'Pending',
      invoice: {
        taxRate: 18,
        discount: 0,
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(events.length + 1).padStart(3, '0')}`
      },
      tasks: []
    };

    const response = await fetch('http://localhost:5000/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newEvent)
    });

    if (!response.ok) throw new Error('Failed to add event');
    
    const savedEvent = await response.json();
    setEvents(prev => [...prev, savedEvent]);
    return savedEvent;
  };

  const updateEvent = async (id, updates) => {
    const response = await fetch(`http://localhost:5000/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!response.ok) throw new Error('Failed to update event');

    const updatedEvent = await response.json();
    setEvents(prev => prev.map(e => e.id === id ? updatedEvent : e));
    return updatedEvent;
  };

  const deleteEvent = async (id) => {
    const response = await fetch(`http://localhost:5000/events/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Failed to delete event');
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const getEvent = (id) => events.find(e => e.id === id);

  return (
    <EventContext.Provider value={{
      events,
      loading,
      error,
      addEvent,
      updateEvent,
      deleteEvent,
      getEvent,
      fetchEvents
    }}>
      {children}
    </EventContext.Provider>
  );
};