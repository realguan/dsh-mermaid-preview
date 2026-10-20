/**
 * Benchmark corpus — the diagrams every run measures.
 *
 * Eight diagrams spanning mermaid's cost spectrum: a trivial flowchart (the
 * floor), a 40-node flowchart and a 60-message sequence diagram (the
 * layout/edge-routing ceiling), plus one of each of the other common types so
 * the aggregate is not just "flowchart twenty times".
 *
 * The large ones are *generated* here rather than pasted, so the cost axis
 * (node count, message count) is readable and adjustable in one place.
 *
 * Pure data + pure functions: no DOM, no imports. The benchmark page imports
 * this module directly over HTTP.
 */

/** A 3-node flowchart: the floor of the cost spectrum. */
const FLOW_3 = `flowchart LR
  A["Client"] --> B["API gateway"]
  B --> C[("Metadata store")]`

/** A plain-ASCII-in/out flowchart with 3 nodes and one decision. */
const FLOW_3_DECISION = `flowchart TD
  A["Fence detected"] --> B{"Mermaid?"}
  B -->|"yes"| C["Render diagram"]`

/**
 * A 40-node flowchart. `n0 → n1 → … → n39` chain, plus a cross edge every
 * third node and a shared sink, so dagre has both a long spine and a wide
 * fan-in to route — that is what actually costs time, not the node count.
 */
const flowNodes = (count) => {
  const lines = ['flowchart TD']
  for (let i = 0; i < count; i += 1) {
    const shape = i % 5 === 0 ? `[("Node ${i}")]` : `["Node ${i}"]`
    lines.push(`  n${i}${shape}`)
  }
  for (let i = 0; i < count - 1; i += 1) lines.push(`  n${i} --> n${i + 1}`)
  for (let i = 0; i + 7 < count; i += 3) lines.push(`  n${i} -.-> n${i + 7}`)
  lines.push(`  n${count - 1} --> sink(["done"])`)
  return lines.join('\n')
}

/**
 * A 60-message sequence diagram across 8 participants. Message count is the
 * axis that matters (each message is a layout row plus a label measurement).
 */
const sequenceMessages = (count, participants = 8) => {
  const names = Array.from({ length: participants }, (_, i) => `P${i}`)
  const lines = ['sequenceDiagram', '  autonumber']
  for (const name of names) lines.push(`  participant ${name} as Service ${name}`)
  for (let i = 0; i < count; i += 1) {
    const from = names[i % participants]
    const to = names[(i + 1 + (i % 3)) % participants]
    if (i % 10 === 9) {
      // A note band every ten messages: an extra layout row, not an arrow.
      lines.push(`  Note over ${from},${to}: checkpoint ${i}`)
    } else if (i % 3 === 0) {
      lines.push(`  ${from}->>${to}: request ${i}`)
    } else if (i % 3 === 1) {
      lines.push(`  ${to}-->>${from}: reply ${i}`)
    } else {
      lines.push(`  ${from}->>${to}: event ${i}`)
    }
  }
  return lines.join('\n')
}

/** A classDiagram with 12 classes, each with members, plus inheritance. */
const classDiagram = (count = 12) => {
  const lines = ['classDiagram']
  for (let i = 0; i < count; i += 1) {
    const name = `Entity${i}`
    lines.push(`  class ${name} {`)
    lines.push('    +String id')
    lines.push('    +Date createdAt')
    lines.push(`    +String field${i}`)
    lines.push(`    +load(id) ${name}`)
    lines.push('    +save() bool')
    lines.push('  }')
  }
  for (let i = 1; i < count; i += 1) {
    const parent = i % 4 === 0 ? `Entity${i - 2}` : `Entity${i - 1}`
    lines.push(`  ${parent} <|-- Entity${i}`)
  }
  for (let i = 0; i + 3 < count; i += 3) lines.push(`  Entity${i} "1" --> "many" Entity${i + 3} : owns`)
  return lines.join('\n')
}

/** A gantt with 4 sections and 20 tasks, dates and dependencies. */
const gantt = (taskCount = 20) => {
  const start = new Date(Date.UTC(2025, 0, 6))
  const day = (n) => {
    const d = new Date(start.getTime() + n * 86_400_000)
    return d.toISOString().slice(0, 10)
  }
  const lines = ['gantt', '  dateFormat YYYY-MM-DD', '  axisFormat %m/%d', '  title Release plan']
  const sections = ['Design', 'Build', 'Verify', 'Ship']
  for (let s = 0; s < sections.length; s += 1) {
    lines.push(`  section ${sections[s]}`)
    for (let i = 0; i < taskCount / sections.length; i += 1) {
      const index = s * (taskCount / sections.length) + i
      const from = index * 2
      lines.push(`  Task ${index} :done, t${index}, ${day(from)}, ${2 + (index % 4)}d`)
    }
  }
  return lines.join('\n')
}

/** A stateDiagram-v2 with a dozen states and guards. */
const stateDiagram = `stateDiagram-v2
  [*] --> Idle
  Idle --> Loading : open
  Loading --> Ready : ok
  Loading --> Failed : error
  Ready --> Rendering : paint
  Rendering --> Ready : done
  Rendering --> Failed : throw
  Failed --> Loading : retry
  Ready --> Idle : close
  Idle --> Disposed : stop
  Failed --> Disposed : stop
  Disposed --> [*]
  note right of Loading
    Lazy CDN fetch
    happens here
  end note`

/** A mindmap: 4 branches, 3 leaves each, plus one nested level. */
const mindmap = `mindmap
  root((mermaid preview))
    Detection
      block class
      fence head regex
      banner label
    Render
      queue
      initialize
      render
      innerHTML
    Theme
      radix
      apple
      github
        primer
    Failure
      retry backoff
      note panel
      3 attempts`

/** An erDiagram with 9 entities and relational cardinalities. */
const erDiagram = (entityCount = 9) => {
  const lines = ['erDiagram']
  const names = Array.from({ length: entityCount }, (_, i) => `TABLE_${i}`)
  for (const name of names) {
    lines.push(`  ${name} {`)
    lines.push('    string id PK')
    lines.push('    string name')
    lines.push('    int value')
    lines.push('  }')
  }
  for (let i = 0; i + 1 < entityCount; i += 1) {
    lines.push(`  ${names[i]} ||--o{ ${names[i + 1]} : "has"`)
  }
  return lines.join('\n')
}

/**
 * The corpus, in measurement order. Cheap first: a JIT warmup should already
 * have happened, but keeping the order stable makes runs comparable.
 */
export const CORPUS = [
  { name: 'flow-3', code: FLOW_3, note: 'floor: 3 nodes' },
  { name: 'flow-3-decision', code: FLOW_3_DECISION, note: '3 nodes, one branch' },
  { name: 'state', code: stateDiagram, note: '12 states, one note' },
  { name: 'er-9', code: erDiagram(9), note: '9 entities' },
  { name: 'class-12', code: classDiagram(12), note: '12 classes x 5 members' },
  { name: 'gantt-20', code: gantt(20), note: '20 tasks / 4 sections' },
  { name: 'mindmap', code: mindmap, note: '4 branches, 13 nodes' },
  { name: 'flow-40', code: flowNodes(40), note: '40 nodes, 52 edges' },
  { name: 'sequence-60', code: sequenceMessages(60, 8), note: '8 participants, 60 messages' },
]

/**
 * The diagram used to warm the JIT before a run; never measured. Its text is
 * deliberately *not* one of the corpus diagrams, so the harness's code→name
 * attribution can never confuse a warmup render with a measured one.
 */
export const WARMUP = {
  name: 'warmup',
  code: `flowchart LR
  W1["warm"] --> W2["up"]
  W2 --> W3["render"]
  W3 --> W4[["discarded"]]`,
}

export default CORPUS
