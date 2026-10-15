// Canonical deep links between records, so every reference opens the right one.
import { INCIDENT_BY_ID } from '../data/incidents'

export const isOpenIncident = (inc) => inc && !inc.status.startsWith('CLOSED')

/** Open incidents go to the investigation workspace; closed ones to their detection record. */
export function incidentHref(id) {
  const inc = INCIDENT_BY_ID[id]
  if (!inc) return '/app/investigation'
  return isOpenIncident(inc) ? `/app/investigation?id=${id}` : `/app/detection?id=${inc.detection}`
}

export const detectionHref = (id) => `/app/detection?id=${id}`
