import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { GeoPoint, Report } from '../types/models';
import { StatusPill } from './StatusPill';
import { SeverityBadge } from './SeverityBadge';
import { SlaCountdown } from './SlaCountdown';
import { useApp } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Navigation, ExternalLink, ShieldCheck, Activity } from 'lucide-react';

// Fix standard Leaflet default marker assets
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper to create sonar-pulsing HTML markers
function createCustomPin(report: Report, isSelected: boolean = false) {
  const isFixed = report.status === 'fixed';
  const isCritical = report.severity === 'critical' && !isFixed;
  const isHigh = report.severity === 'high' && !isFixed;
  const isMedium = report.severity === 'medium' && !isFixed;

  let colorHex = '#5B6B7A'; // Low/default
  let pulseClass = '';
  let glowStyle = 'box-shadow: 0 0 10px rgba(91,107,122,0.5);';

  if (isFixed) {
    colorHex = '#2ED3B7';
    pulseClass = 'sonar-pulse-teal';
    glowStyle = 'box-shadow: 0 0 16px rgba(46,211,183,0.7);';
  } else if (isCritical) {
    colorHex = '#FF4D4D';
    pulseClass = 'sonar-pulse-red';
    glowStyle = 'box-shadow: 0 0 20px rgba(255,77,77,0.9);';
  } else if (isHigh || isMedium) {
    colorHex = '#F5B417';
    pulseClass = 'sonar-pulse-amber';
    glowStyle = 'box-shadow: 0 0 16px rgba(245,180,23,0.8);';
  }

  const clusterBadge =
    report.clusterCount > 1
      ? `<span style="position: absolute; top: -6px; right: -8px; background: #FF4D4D; color: #FFFFFF; border-radius: 9999px; font-size: 9px; font-weight: 800; font-family: 'IBM Plex Mono', monospace; padding: 1px 5px; border: 1.5px solid #0C0E11; box-shadow: 0 0 8px #FF4D4D;">×${report.clusterCount}</span>`
      : '';

  const scale = isSelected ? 'transform: scale(1.25) translate(-50%, -100%);' : 'transform: translate(-50%, -100%);';

  const html = `
    <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; ${scale}">
      <!-- Pulsing Sonar Ring -->
      <div class="${pulseClass}" style="
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: transparent;
        pointer-events: none;
      "></div>

      <!-- Core Marker Pin -->
      <div style="
        background: ${colorHex};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        ${glowStyle}
        border: 2px solid #F2EFE8;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        transition: transform 0.2s ease;
      ">
        <span style="
          transform: rotate(45deg);
          color: #0C0E11;
          font-weight: 900;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          line-height: 1;
        ">${isFixed ? '✓' : isCritical ? '!' : 'R'}</span>
      </div>
      ${clusterBadge}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-map-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -36],
  });
}

function createPickerPin() {
  const html = `
    <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -100%);">
      <div class="sonar-pulse-amber" style="
        position: absolute;
        width: 36px;
        height: 36px;
        border-radius: 50%;
      "></div>
      <div style="
        background: #F5B417;
        width: 34px;
        height: 34px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 0 20px #F5B417;
        border: 2.5px solid #0C0E11;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      ">
        <span style="
          transform: rotate(45deg);
          color: #0C0E11;
          font-weight: 900;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 16px;
        ">+</span>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-map-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
  });
}

// Sub-component to handle map clicks for pin-drop
function MapEventsHandler({
  onLocationSelect,
}: {
  onLocationSelect?: (pos: GeoPoint) => void;
}) {
  useMapEvents({
    click(e) {
      if (onLocationSelect) {
        onLocationSelect({
          lat: Math.round(e.latlng.lat * 100000) / 100000,
          lng: Math.round(e.latlng.lng * 100000) / 100000,
        });
      }
    },
  });
  return null;
}

// Sub-component to pan map when target center changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

interface LeafletMapProps {
  reports?: Report[];
  center?: GeoPoint;
  zoom?: number;
  selectedReportId?: string;
  onSelectReport?: (report: Report) => void;
  interactiveSelection?: boolean;
  selectedLocation?: GeoPoint | null;
  onLocationSelect?: (pos: GeoPoint) => void;
  className?: string;
  height?: string;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  reports = [],
  center = { lat: 12.9260, lng: 77.6520 },
  zoom = 13,
  selectedReportId,
  onSelectReport,
  interactiveSelection = false,
  selectedLocation,
  onLocationSelect,
  className = '',
  height = '100%',
}) => {
  const navigate = useNavigate();
  const { getContractorById } = useApp();
  const [mapReady, setMapReady] = useState(false);

  const mapCenter: [number, number] = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : [center.lat, center.lng];

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-[#0C0E11] border border-white/10 shadow-2xl ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &bull; RaastaFix Sentinel'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <ChangeView center={mapCenter} zoom={zoom} />

        {interactiveSelection && (
          <MapEventsHandler onLocationSelect={onLocationSelect} />
        )}

        {/* Selected manual picker pin */}
        {selectedLocation && (
          <Marker
            position={[selectedLocation.lat, selectedLocation.lng]}
            icon={createPickerPin()}
          >
            <Popup>
              <div className="p-2 text-xs font-mono bg-[#14171C] text-[#F2EFE8] rounded-lg border border-[#F5B417]/40">
                <p className="font-bold text-[#F5B417] flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5" /> Target Coordinates
                </p>
                <p className="text-[#9AA3AD] mt-1 text-[11px]">
                  LAT: {selectedLocation.lat.toFixed(5)} &bull; LNG: {selectedLocation.lng.toFixed(5)}
                </p>
                <p className="text-[10px] text-[#F5B417] mt-1 font-semibold">
                  Tap anywhere on the road grid to re-calibrate
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Render reports pins */}
        {reports.map((report) => {
          const contractor = report.assignedContractorId
            ? getContractorById(report.assignedContractorId)
            : null;
          const isSelected = report.id === selectedReportId;

          return (
            <Marker
              key={report.id}
              position={[report.location.lat, report.location.lng]}
              icon={createCustomPin(report, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onSelectReport) onSelectReport(report);
                },
              }}
            >
              <Popup className="raastafix-popup">
                <div className="w-72 p-3 text-left bg-[#14171C] text-[#F2EFE8] rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <SeverityBadge severity={report.severity} size="sm" />
                    <StatusPill status={report.status} size="sm" />
                  </div>

                  <h4 className="font-bold text-sm text-[#F2EFE8] leading-snug mb-1 line-clamp-2">
                    {report.roadName}
                  </h4>

                  <p className="text-xs text-[#9AA3AD] line-clamp-2 mb-2 font-mono">
                    {report.shortDescription || `${report.defectType} reported in ${report.ward}`}
                  </p>

                  {/* Contractor on the record */}
                  <div className="bg-[#1B1F26] rounded-lg p-2 border border-white/5 mb-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[9px] uppercase font-mono text-[#9AA3AD] font-semibold">
                        Liable Contractor
                      </p>
                      {contractor && (
                        <span className="text-[9px] font-mono text-[#F5B417] font-bold">
                          {contractor.overallScore.toFixed(1)} ★
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-[#F2EFE8] truncate mt-0.5">
                      {contractor ? contractor.name : 'Pending municipal assignment'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-white/10">
                    <SlaCountdown
                      slaDueAt={report.slaDueAt}
                      status={report.status}
                      completedAt={report.completedAt}
                      size="sm"
                    />

                    <button
                      type="button"
                      onClick={() => navigate(`/road/${report.id}`)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#F5B417] hover:bg-[#ffc22e] text-[#0C0E11] text-xs font-mono font-bold cursor-pointer transition-all shadow-[0_0_8px_rgba(245,180,23,0.3)]"
                    >
                      <span>AUDIT</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Static Fallback Indicator if tiles loading */}
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0C0E11]/90 z-20 backdrop-blur-md">
          <div className="text-center">
            <div className="w-9 h-9 border-3 border-[#F5B417] border-t-transparent rounded-full animate-spin mx-auto mb-2.5 shadow-[0_0_12px_#F5B417]" />
            <p className="text-xs font-mono text-[#9AA3AD] font-semibold tracking-wider">
              INITIALIZING ROAD TELEMETRY RADAR...
            </p>
          </div>
        </div>
      )}

      {/* Map Helper overlay for interactive pin-drop */}
      {interactiveSelection && (
        <div className="absolute top-3 left-3 z-[400] bg-[#14171C]/95 backdrop-blur-xl px-3.5 py-1.5 rounded-xl border border-[#F5B417]/50 shadow-2xl flex items-center gap-2 text-xs">
          <MapPin className="w-4 h-4 text-[#F5B417] animate-bounce" />
          <span className="font-mono text-xs font-semibold text-[#F2EFE8]">
            Click road surface to drop exact GPS pin
          </span>
        </div>
      )}
    </div>
  );
};
