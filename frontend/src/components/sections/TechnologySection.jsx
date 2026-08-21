import MonoValue, { SectionHeader } from '../ui/MonoValue.jsx'
import KeyValueRow from '../ui/KeyValueRow.jsx'
import StatusBadge from '../ui/StatusBadge.jsx'

/* ─── Pill tag for frameworks / libraries ─── */
function TechPill({ name }) {
  return (
    <span className="font-mono text-[11px] text-ink/80 tracking-wide px-2.5 py-1 rounded-md border border-invert/[0.07] bg-invert/[0.025]">
      {name}
    </span>
  )
}

function parseCms(cmsObj, websiteGenerator) {
  const cmsNameRaw = cmsObj?.name || websiteGenerator || null
  if (!cmsNameRaw) return { name: null, version: null }

  // Check if cmsNameRaw contains a version string (e.g. "WordPress 6.4.2")
  const parts = cmsNameRaw.trim().split(/\s+/)
  if (parts.length >= 2 && /^\d+(\.\d+)*$/.test(parts[parts.length - 1])) {
    const version = parts.pop()
    return {
      name: parts.join(' '),
      version,
    }
  }

  return {
    name: cmsNameRaw,
    version: cmsObj?.version || null,
  }
}

export default function TechnologySection({ technology, error, website }) {
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
    const cms = parseCms(technology.cms, website?.metadata?.generator)
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

    const meta = total > 0 ? `${total} detected` : 'None identified'

    const serverDisplay = server.name
      ? `${server.name}${server.version ? ` / ${server.version}` : ''}`
      : null

    const cmsDisplay = cms.name
      ? `${cms.name}${cms.version ? ` / ${cms.version}` : ''}`
      : null

    const edgeDisplay = edge.detected
      ? `${edge.detected}${edge.source ? ` (${edge.source})` : ''}`
      : null

    return (
      <>
        <SectionHeader title="Technology" meta={meta} />

        {/* Server, Backend, CMS, Edge */}
        <div className="mb-6">
          <KeyValueRow label="Web Server" value={serverDisplay} />
          <KeyValueRow label="Backend"    value={backend.framework} />
          <KeyValueRow label="CMS"        value={cmsDisplay} />
          <KeyValueRow label="Edge / CDN" value={edgeDisplay} />
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
