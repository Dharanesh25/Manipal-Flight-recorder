import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Landing from './pages/Landing'
import Overview from './pages/Overview'
import FlightRecorder from './pages/FlightRecorder'
import Investigation from './pages/Investigation'
import Behavior from './pages/Behavior'
import EventTimeline from './pages/EventTimeline'
import Entities from './pages/Entities'
import Detection from './pages/Detection'
import Report from './pages/Report'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<Overview />} />
        <Route path="recorder" element={<FlightRecorder />} />
        <Route path="investigation" element={<Investigation />} />
        <Route path="behavior" element={<Behavior />} />
        <Route path="timeline" element={<EventTimeline />} />
        <Route path="entities" element={<Entities />} />
        <Route path="detection" element={<Detection />} />
        <Route path="report" element={<Report />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
