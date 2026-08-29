import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { LeafletMap } from '../components/LeafletMap';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusPill } from '../components/StatusPill';
import { SlaCountdown } from '../components/SlaCountdown';
import { smoothScrollTo } from '../services/scroll';
import {
  Camera,
  Compass,
  Radio,
  MessageSquare,
  HardHat,
  Star,
  ShieldCheck,
  Sliders,
  TrendingDown,
  ChevronRight,
  Filter,
  Check,
  Copy,
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [copiedApi, setCopiedApi] = useState(false);

  const allWards = Array.from(new Set(state.reports.map((r) => r.ward))).sort();

  const filteredReports = state.reports.filter((r) => {
    const wardMatch = selectedWard === 'all' || r.ward === selectedWard;
    return wardMatch;
  });

  const featuredReport = state.reports.find((r) => r.severity === 'critical' || r.severity === 'high') || state.reports[0];

  const handleCopyApi = () => {
    const apiCode = `# GET /api/v1/roads/ward-12/summary
{
  "open_cases": 42,
  "avg_fix_time_hrs": 58,
  "sla_met_pct": 81,
  "top_contractor": "Meridian Roadworks",
  "repeat_failure_pct": 6.4
}`;
    navigator.clipboard.writeText(apiCode);
    setCopiedApi(true);
    setTimeout(() => setCopiedApi(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* ========== HERO ========== */}
      <header className="hero" id="top">
        <div className="hero-in">
          <div className="hero-copy">
            <span className="badge">
              <span className="dot" />
              Live civic accountability
            </span>
            <h1>
              Snap a broken road. Watch it become a <span className="hz">fix</span>.
            </h1>
            <p className="hero-sub">
              RaastaFix turns one street photo into an accountable repair. AI reads the damage,
              pins the exact location, routes it to the right municipal corporation with a deadline
              — and contractor ratings decide who earns the next contract.
            </p>
            <div className="hero-cta">
              <Link to="/report" className="btn btn-primary btn-lg">
                Report a road
              </Link>
              <button
                type="button"
                onClick={() => smoothScrollTo('how', 850, 72)}
                className="btn btn-ghost btn-lg cursor-pointer"
              >
                See how it works
              </button>
            </div>
            <div className="hero-note">
              <span className="arw">→</span> Snap · route · rate · fix — no forms, no dead-end
              helplines.
            </div>
          </div>

          {/* Device Mockup with Compact Road Pin */}
          <div className="device-wrap">
            <div
              className="device cursor-pointer"
              onClick={() => {
                if (featuredReport) navigate(`/road/${featuredReport.id}`);
              }}
              title="Click to view live road case dossier"
            >
              <div className="screen">
                <div className="scr-map">
                  <span className="map-tag">◎ live · Ward 12</span>
                  <div className="road" />
                  <div className="map-pin" />
                </div>
                <div className="scr-body">
                  <div className="scr-row">
                    <span className="sev">● Pothole · Severe</span>
                    <span className="conf">AI 97%</span>
                  </div>
                  <div className="scr-title">Sector 4 Main Road</div>
                  <div className="scr-coord">28.6139° N, 77.2090° E</div>
                  <div className="scr-line">
                    <span className="ico">◈</span> Routed to <b>North Municipal Corp.</b> · fix by{' '}
                    <b>72h</b>
                  </div>
                  <div className="scr-contractor">
                    <span className="cn">
                      Meridian Roadworks<small>assigned contractor</small>
                    </span>
                    <span className="cs">★ 4.8</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="float-chip fc-1">
              <span className="d2" />
              SLA clock started
            </div>
            <div className="float-chip fc-2">
              <span className="d2" />
              12 neighbours notified
            </div>
          </div>
        </div>
      </header>

      {/* ========== COMPACT LIVE RADAR (Compact & Balanced) ========== */}
      <section className="py-12 border-b border-[var(--line)] bg-[var(--surface)]">
        <div className="wrap">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
            <div>
              <span className="eyebrow">Live Map Feed</span>
              <h2 className="text-2xl font-bold mt-1 text-[var(--ink)]">
                Active Ward Hazards &amp; Repairs
              </h2>
              <p className="text-sm text-[var(--ink-soft)] mt-1">
                Compact live overview of road markers across civic sectors.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[var(--surface-2)] px-3 py-1.5 rounded-xl border border-[var(--line)]">
                <Filter className="w-3.5 h-3.5 text-[var(--hazard-ink)]" />
                <span className="text-xs font-mono text-[var(--ink-faint)]">Ward:</span>
                <select
                  value={selectedWard}
                  onChange={(e) => setSelectedWard(e.target.value)}
                  className="bg-transparent text-xs font-mono font-medium text-[var(--ink)] border-0 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Sectors</option>
                  {allWards.map((w) => (
                    <option key={w} value={w}>
                      Ward {w}
                    </option>
                  ))}
                </select>
              </div>

              <Link
                to="/report"
                className="btn btn-primary text-xs py-2 px-3.5"
              >
                + Snap Report
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Compact Map Window */}
            <div className="lg:col-span-8 compact-map-stage">
              <LeafletMap
                reports={filteredReports}
                selectedReportId={selectedReportId || undefined}
                onSelectReport={(report) => setSelectedReportId(report.id)}
                height="100%"
              />
            </div>

            {/* Quick Dossier List */}
            <div className="lg:col-span-4 bg-[var(--surface-2)] border border-[var(--line)] rounded-2xl p-4 h-[380px] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <span className="text-xs font-mono font-semibold uppercase text-[var(--hazard-ink)]">
                  Nearest Reports ({filteredReports.length})
                </span>
                <span className="text-[11px] font-mono text-[var(--ink-faint)]">
                  Live Sync
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1">
                {filteredReports.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReportId(r.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer bg-[var(--surface)] ${
                      selectedReportId === r.id
                        ? 'border-[var(--hazard)] shadow-sm'
                        : 'border-[var(--line)] hover:border-[var(--line-strong)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <SeverityBadge severity={r.severity} size="sm" />
                      <StatusPill status={r.status} size="sm" />
                    </div>
                    <p className="text-xs font-bold text-[var(--ink)] truncate">{r.roadName}</p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-[var(--ink-faint)] mt-2 pt-2 border-t border-[var(--line)]">
                      <span>Ward {r.ward}</span>
                      <Link
                        to={`/road/${r.id}`}
                        className="text-[var(--hazard-ink)] hover:underline font-bold flex items-center gap-0.5"
                      >
                        Inspect &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">How it works</span>
            <h2>From a photo on your phone to a name on the hook.</h2>
            <p>The citizen does one thing — take a picture. RaastaFix does the rest.</p>
          </div>
          <div className="steps">
            <div className="step">
              <div>
                <div className="step-n">01</div>
                <h3>Snap the road</h3>
                <p>
                  Photograph the damage. The photo carries its own GPS, so the report anchors to the
                  exact spot — no address typing.
                </p>
              </div>
              <div className="meta">Photo + live GPS</div>
            </div>
            <div className="step">
              <div>
                <div className="step-n">02</div>
                <h3>AI reads it</h3>
                <p>
                  Vision grades the damage and severity, reads the lat–long, and resolves which
                  corporation's jurisdiction it falls in.
                </p>
              </div>
              <div className="meta">Vision + geocoding</div>
            </div>
            <div className="step">
              <div>
                <div className="step-n">03</div>
                <h3>Routed with a deadline</h3>
                <p>
                  The case lands on the right desk with a public fix-by window. Everyone sees the
                  time given and the time taken.
                </p>
              </div>
              <div className="meta">Auto-assign + SLA</div>
            </div>
            <div className="step">
              <div>
                <div className="step-n">04</div>
                <h3>The street is told</h3>
                <p>
                  A live pin, the assigned contractor's name, and a per-road chat. When it's done,
                  the reporters rate the result.
                </p>
              </div>
              <div className="meta">Live map + chat</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="band" id="features">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">What's inside</span>
            <h2>Every feature points at the same thing: accountability you can see.</h2>
          </div>
          <div className="features">
            <div className="feat">
              <div className="ic text-[var(--hazard-ink)]">
                <Camera className="w-5 h-5" />
              </div>
              <h3>Photo-first reporting</h3>
              <p>
                One tap to report. The picture is the complaint — the AI does the classifying, no
                categories to hunt through.
              </p>
              <span className="tag">Zero-form capture</span>
            </div>

            <div className="feat">
              <div className="ic text-[var(--signal)]">
                <Compass className="w-5 h-5" />
              </div>
              <h3>AI geo-analysis</h3>
              <p>
                Vision grades severity; geocoding maps the lat–long to a jurisdiction and pushes
                the report to the corporation that owns the road.
              </p>
              <span className="tag">Vision + geocoding</span>
            </div>

            <div className="feat">
              <div className="ic text-[var(--hazard-ink)]">
                <Radio className="w-5 h-5" />
              </div>
              <h3>Real-time awareness feed</h3>
              <p>
                A live map of nearby hazards warns drivers before they hit the crater — and turns
                isolated complaints into shared, visible pressure.
              </p>
              <span className="tag">Live location pins</span>
            </div>

            <div className="feat">
              <div className="ic text-[var(--signal)]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3>Per-road chat</h3>
              <p>
                Every road has its own thread where locals confirm, dispute, and add context. A
                2-minute cooldown keeps it signal, not spam.
              </p>
              <span className="tag">Cooldown: 120s</span>
            </div>

            <div className="feat">
              <div className="ic text-[var(--hazard-ink)]">
                <HardHat className="w-5 h-5" />
              </div>
              <h3>Contractor on the record</h3>
              <p>
                The contractor assigned to a stretch is named right on the road. No anonymous work
                — every patch has an author.
              </p>
              <span className="tag">Name on the map</span>
            </div>

            <div className="feat">
              <div className="ic text-[var(--signal)]">
                <Star className="w-5 h-5" />
              </div>
              <h3>Ratings decide contracts</h3>
              <p>
                After a repair, citizens and the review team both rate the work. The best-rated
                contractor wins the next stretch.
              </p>
              <span className="tag">Dual rating → tender</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== TRUST & ANTI-GAMING ========== */}
      <section className="dark-band" id="trust">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Trust &amp; anti-gaming</span>
            <h2>The scoreboard only works if it can't be faked.</h2>
            <p>
              RaastaFix is built so a good rating has to be earned and a closed case has to be real.
              This is what turns &quot;accountability&quot; from a slogan into a system.
            </p>
          </div>
          <div className="trust">
            <div className="tcard">
              <div className="ic">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3>Verified-fix proof</h3>
              <p>
                A case closes only when an &quot;after&quot; photo is taken from the same GPS point. AI
                compares before and after to confirm the repair is real — and checks the image is a
                genuine camera photo, not AI-generated or tampered.
              </p>
              <span className="tag">Same-GPS · authenticity check</span>
            </div>

            <div className="tcard">
              <div className="ic">
                <Sliders className="w-6 h-6" />
              </div>
              <h3>Weighted ratings</h3>
              <p>
                A rating counts for more when it comes from someone who reported the issue or
                actually lives near that road. Sudden spikes and single-device clusters are
                dampened, so a contractor can&apos;t buy or brigade their way up.
              </p>
              <span className="tag">Proximity-weighted · anti-brigade</span>
            </div>

            <div className="tcard">
              <div className="ic">
                <TrendingDown className="w-6 h-6" />
              </div>
              <h3>Durability score</h3>
              <p>
                If a &quot;fixed&quot; road is re-reported within months, that failure automatically pulls
                down the contractor&apos;s score. Cheap patches that look fine on day one but fail
                fast can&apos;t hide — the record follows the work.
              </p>
              <span className="tag">Re-report penalty</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SMARTER AI ========== */}
      <section id="ai">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Smarter routing</span>
            <h2>The AI doesn't just read damage — it sorts the queue.</h2>
            <p>
              Corporations get a ranked, de-duplicated list of what actually needs attention first,
              not an undifferentiated pile of complaints.
            </p>
          </div>
          <div className="twoup">
            <div className="bigcard">
              <div className="k">Severity → priority</div>
              <h3>The worst roads rise to the top</h3>
              <p>
                Priority blends the AI's damage grade with road type and traffic — so a crater on a
                school route outranks a hairline crack on a quiet lane. The corporation works a
                ranked queue.
              </p>
              <div className="prio" aria-hidden="true">
                <div className="prbar">
                  <span className="pl">School route</span>
                  <span className="track">
                    <span className="fill bg-[var(--alert)]" style={{ width: '94%' }} />
                  </span>
                  <span className="pn">94</span>
                </div>
                <div className="prbar">
                  <span className="pl">Arterial rd.</span>
                  <span className="track">
                    <span className="fill bg-[var(--hazard)]" style={{ width: '71%' }} />
                  </span>
                  <span className="pn">71</span>
                </div>
                <div className="prbar">
                  <span className="pl">Quiet lane</span>
                  <span className="track">
                    <span className="fill bg-[var(--signal)]" style={{ width: '34%' }} />
                  </span>
                  <span className="pn">34</span>
                </div>
              </div>
            </div>

            <div className="bigcard">
              <div className="k">Duplicate clustering</div>
              <h3>Ten photos, one case, one strong signal</h3>
              <p>
                When many people photograph the same pothole, RaastaFix collapses them into a single
                case marked &quot;10 people reported this&quot; — cutting noise for the corporation while
                making the demand for a fix impossible to ignore.
              </p>
              <div className="cluster" aria-hidden="true">
                <span className="cc">📷</span>
                <span className="cc">📷</span>
                <span className="cc">📷</span>
                <span className="cc">+7</span>
                <span className="arw">→</span>
                <span className="one">1 case · reported ×10</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CONTRACTOR LEADERBOARD ========== */}
      <section className="band" id="contractors">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">Contractor leaderboard</span>
            <h2>A public scoreboard for the people who pave your streets.</h2>
            <p>
              Every contractor carries a rating built from real, closed jobs — visible to citizens
              and decision-makers alike. A tender stops being a mystery and starts being earned.
            </p>
          </div>
          <div className="board" role="table" aria-label="Contractor leaderboard example">
            <div className="board-top">
              <div className="bt-l">Ward 12 · Contractor standings</div>
              <div className="bt-r">rated by 3,180 citizens + review team</div>
            </div>

            <div className="row">
              <div className="rk">1</div>
              <div className="nm">
                <Link to="/contractors/con-1" className="hover:text-[var(--hazard-ink)]">
                  Meridian Roadworks
                </Link>
                <small>18 stretches · 96% on-time</small>
                <span className="pillbadge win">Next tender favourite</span>
              </div>
              <div className="stars" aria-label="4.8 of 5">
                ★★★★<span className="text-[var(--hazard)]">★</span>
              </div>
              <div className="score">4.8</div>
            </div>

            <div className="row">
              <div className="rk">2</div>
              <div className="nm">
                <Link to="/contractors/con-2" className="hover:text-[var(--hazard-ink)]">
                  Anand Infra Co.
                </Link>
                <small>11 stretches · 90% on-time</small>
              </div>
              <div className="stars" aria-label="4.4 of 5">
                ★★★★<span className="e">★</span>
              </div>
              <div className="score">4.4</div>
            </div>

            <div className="row">
              <div className="rk">3</div>
              <div className="nm">
                <Link to="/contractors/con-3" className="hover:text-[var(--hazard-ink)]">
                  CityPave Ltd.
                </Link>
                <small>9 stretches · 82% on-time</small>
              </div>
              <div className="stars" aria-label="3.9 of 5">
                ★★★<span className="e">★★</span>
              </div>
              <div className="score">3.9</div>
            </div>

            <div className="row">
              <div className="rk">4</div>
              <div className="nm">
                <Link to="/contractors/con-4" className="hover:text-[var(--hazard-ink)]">
                  Sunrise Builders
                </Link>
                <small>6 stretches · 61% on-time</small>
                <span className="pillbadge flag">Re-patch rate high</span>
              </div>
              <div className="stars" aria-label="2.6 of 5">
                ★★<span className="e">★★★</span>
              </div>
              <div className="score">2.6</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== ACCOUNTABILITY LOOP ========== */}
      <section className="dark-band">
        <div className="wrap">
          <div className="sec-head">
            <span className="eyebrow">The accountability loop</span>
            <h2>Good work earns the next contract. Bad work is on the record.</h2>
            <p>
              The rating a contractor earns on one road decides whether they're trusted with the next
              one. Quality compounds into reputation, and reputation compounds into tenders.
            </p>
          </div>
          <div className="loop">
            <div className="node">
              <div className="k">01 · Report</div>
              <div className="t">Citizen flags a road</div>
              <div className="d">Photo + location opens a public, tracked case.</div>
            </div>
            <div className="node">
              <div className="k">02 · Assign</div>
              <div className="t">Contractor named</div>
              <div className="d">Corporation assigns; the name goes live on the map.</div>
            </div>
            <div className="node">
              <div className="k">03 · Fix</div>
              <div className="t">Work completed</div>
              <div className="d">Verified against the SLA clock and an after-photo.</div>
            </div>
            <div className="node">
              <div className="k">04 · Rate</div>
              <div className="t">Citizens + team score it</div>
              <div className="d">Weighted dual rating on durability and finish.</div>
            </div>
            <div className="node">
              <div className="k">05 · Reward</div>
              <div className="t">Best score wins next</div>
              <div className="d">Ratings feed the tender for the next stretch.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== OPEN DATA API ========== */}
      <section id="api">
        <div className="wrap">
          <div className="api">
            <div className="api-copy">
              <span className="eyebrow">Open data</span>
              <h2>An open API for anyone working to fix cities.</h2>
              <p>
                Every anonymised report, repair time, and contractor score is available through a
                public API — so researchers, journalists, and other cities can build on the data.
                It's a transparency feature and a credible funding and partnership angle in one.
              </p>
              <div className="api-uses">
                <span>Researchers</span>
                <span>Journalists</span>
                <span>Other cities</span>
                <span>Civic groups</span>
              </div>
            </div>
            <div className="code" aria-label="Example API response">
              <div className="top flex items-center justify-between">
                <div className="flex gap-1.5">
                  <i style={{ background: 'var(--alert)' }} />
                  <i style={{ background: 'var(--hazard)' }} />
                  <i style={{ background: 'var(--signal)' }} />
                </div>
                <button
                  type="button"
                  onClick={handleCopyApi}
                  className="text-xs font-mono text-[var(--on-asphalt-soft)] hover:text-[var(--on-asphalt)] flex items-center gap-1 cursor-pointer bg-white/5 px-2 py-0.5 rounded"
                >
                  {copiedApi ? (
                    <>
                      <Check className="w-3 h-3 text-[var(--signal)]" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre>
                <span className="cm"># GET /api/v1/roads/ward-12/summary</span>
                {'\n'}
                {'{'}
                {'\n  '}
                <span className="ky">&quot;open_cases&quot;</span>: <span className="st">42</span>,
                {'\n  '}
                <span className="ky">&quot;avg_fix_time_hrs&quot;</span>: <span className="st">58</span>,
                {'\n  '}
                <span className="ky">&quot;sla_met_pct&quot;</span>: <span className="st">81</span>,
                {'\n  '}
                <span className="ky">&quot;top_contractor&quot;</span>:{' '}
                <span className="st">&quot;Meridian Roadworks&quot;</span>,{'\n  '}
                <span className="ky">&quot;repeat_failure_pct&quot;</span>: <span className="st">6.4</span>
                {'\n}'}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="cta" id="cta">
        <div className="wrap">
          <span className="eyebrow">Get involved</span>
          <h2>One photo, and the whole system starts watching.</h2>
          <p>
            Citizens get roads that actually get fixed. Corporations get clean routing and a
            defensible way to award work. Good contractors get rewarded. The scoreboard does the
            rest.
          </p>
          <div className="btns">
            <Link to="/report" className="btn btn-primary btn-lg">
              Report a road
            </Link>
            <Link to="/data" className="btn btn-ghost btn-lg">
              Explore the data
            </Link>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer>
        <div className="wrap">
          <div className="fbrand">
            <span className="pin">
              <span>R</span>
            </span>{' '}
            Raasta<span style={{ color: 'var(--hazard)' }}>Fix</span>
          </div>
          <div className="fnote">
            Snap it → route it → rate it → fix it · concept landing page
          </div>
        </div>
      </footer>
    </div>
  );
};
