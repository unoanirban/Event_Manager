import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { EventProvider } from './context/EventContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import Registry from './pages/Registry';
import Logistics from './pages/Logistics';

function App() {
  return (
    <EventProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="create" element={<CreateEvent />} />
            <Route path="registry" element={<Registry />} />
            <Route path="registry/:id" element={<Logistics />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </EventProvider>
  );
}

export default App;