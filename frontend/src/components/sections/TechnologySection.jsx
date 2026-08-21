import MonoValue, { SectionHeader } from '../ui/MonoValue.jsx'
import KeyValueRow from '../ui/KeyValueRow.jsx'

/* ─── Pill tag for frameworks / libraries ─── */
function TechPill({ name }) {
  return (
    <span className="font-mono text-[11px] text-ink/80 tracking-wide px-2.5 py-1 rounded-md border border-invert/[0.07] bg-invert/[0.025]">
      {name}
    </span>
  )
}

export default function TechnologySection({ technology, error }) {
  if (error) {
    return (
      <>
        <SectionHeader title="Technology" />
        <p className="font-mono text-sm text-alert">{error}</p>
      </>
    )
  }

  if (technology && !technology.error) {
    const server = technology.web_server || {}
    const backend = technology.backend || {}
    const frontend = technology.frontend || {}
    const cms = technology.cms || {}
    const jsLibs = technology.javascript_libraries || []
    const edge = technology.edge_platform || {}

    // Count detected technologies for the meta text
    const detected = []
    if (server.name) detected.push(server.name)
    if (backend.framework) detected.push(backend.framework)
    if (cms.name) detected.push(cms.name)
    if (edge.detected) detected.push(edge.detected)
    const fwCount = (frontend.frameworks?.length || 0) + jsLibs.length
    const total = detected.length + fwCount

    const meta = total > 0 ? `${total} identified` : 'No technologies identified'

    const serverDisplay = server.name
      ? `${server.name}${server.version ? ` / ${server.version}` : ''}`
      : null

    return (
      <>
        <SectionHeader title="Technology" meta={meta} />

        {/* Server & Backend */}
        <div className="mb-6">
          <KeyValueRow label="Web Server" value={serverDisplay} />
          <KeyValueRow label="Backend"    value={backend.framework} />
          <KeyValueRow label="CMS"        value={cms.name} />
          <KeyValueRow label="Edge / CDN" value={edge.detected} />
        </div>

        {/* Frontend Frameworks */}
        {frontend.frameworks?.length > 0 && (
          <div className="mb-6">
            <span className="font-body text-[11px] font-semibold tracking-[0.16em] text-muted/60 uppercase block mb-3">
              Frontend Frameworks
            </span>
            <div className="flex flex-wrap gap-2">
              {frontend.frameworks.map((fw, i) => (
                <TechPill key={i} name={fw} />
              ))}
            </div>
          </div>
        )}

        {/* JS Libraries */}
        {jsLibs.length > 0 && (
          <div className="mb-6">
            <span className="font-body text-[11px] font-semibold tracking-[0.16em] text-muted/60 uppercase block mb-3">
              JavaScript Libraries
            </span>
            <div className="flex flex-wrap gap-2">
              {jsLibs.map((lib, i) => (
                <TechPill key={i} name={lib} />
              ))}
            </div>
          </div>
        )}

        {/* Fallback when nothing detected */}
        {total === 0 && (
          <p className="font-mono text-sm text-muted/50">
            No technologies could be fingerprinted from the response.
          </p>
        )}
      </>
    )
  }

  return (
    <>
      <SectionHeader title="Technology" />
      <p className="font-mono text-sm text-muted/50">No technology data available.</p>
    </>
  )
}
