/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { TPlace } from "@/components/sections/LocationAutocomplete";

type Center = {
  id: string;
  name: string;
  address?: string;
  location?: { type: "Point"; coordinates: [number, number] }; // [lng, lat]
};

interface MapWithRouteProps {
  dho?: TPlace | null;
  origin?: TPlace | null;
  destinations?: (TPlace | null)[];
  height?: string;
  onLocationChange?: (
    type: "dho" | "origin" | "destination",
    place: TPlace | null,
    index?: number,
  ) => void;

  centers?: Center[];
  selectedCenterId?: string | null;
  onCenterSelect?: (center: Center) => void;
}

const MapWithRoute: React.FC<MapWithRouteProps> = ({
  dho = null,
  origin = null,
  destinations = [],
  height = "400px",
  onLocationChange,

  centers = [],
  selectedCenterId = null,
  onCenterSelect,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // keep your current directions setup
  const [directionsService] = useState(
    () => new google.maps.DirectionsService(),
  );
  const [directionsRenderer] = useState(
    () => new google.maps.DirectionsRenderer(),
  );

  // route markers (your existing logic)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);

  // centers markers (NEW)
  const centerMarkersRef = useRef<Map<string, google.maps.Marker>>(new Map());

  const getRedPin = (): google.maps.Icon => ({
    url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNy41OCAyIDQgNS41OCA0IDEwYzAgNS4yNSA2LjQgMTEuMzIgNy4wNSAxMS45M2ExLjQgMS40IDAgMCAwIDEuOSAwQzEzLjYgMjEuMzIgMjAgMTUuMjUgMjAgMTBjMC00LjQyLTMuNTgtOC04LTh6IiBmaWxsPSIjQzYyODI4Ii8+CjxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjQuMiIgZmlsbD0id2hpdGUiLz4KPGNpcmNsZSBjeD0iMTIiIGN5PSIxMCIgcj0iMi42IiBmaWxsPSIjQzYyODI4Ii8+Cjwvc3ZnPg==",
    scaledSize: new google.maps.Size(32, 32),
    anchor: new google.maps.Point(16, 32),
  });

  useEffect(() => {
    if (!mapRef.current || !(window as any).google) return;

    const googleMap = new google.maps.Map(mapRef.current, {
      zoom: 5,
      center: { lat: 39.8283, lng: -98.5795 },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });

    setMap(googleMap);
    directionsRenderer.setMap(googleMap);
  }, []);
  // directionsRenderer
  // ---- helpers ----
  const markersRef = useRef<google.maps.Marker[]>([]);

  const clearRouteMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  };

  const clearCenterMarkers = () => {
    centerMarkersRef.current.forEach((m) => m.setMap(null));
    centerMarkersRef.current.clear();
  };

  const clearRoutes = () => {
    directionsRenderer.setDirections({
      routes: [],
      request: {
        travelMode: google.maps.TravelMode.DRIVING,
      } as google.maps.DirectionsRequest,
    } as google.maps.DirectionsResult);
  };

  useEffect(() => {
    if (!map) return;
    if (!centers || centers.length === 0) return;

    // clear route stuff so map shows only centers pins
    clearRouteMarkers();
    clearRoutes();

    // rebuild center markers
    clearCenterMarkers();

    const bounds = new google.maps.LatLngBounds();

    centers.forEach((c) => {
      const coords = c?.location?.coordinates;
      if (!coords || coords.length < 2) return;

      const [lng, lat] = coords;
      const pos = { lat, lng };

      const marker = new google.maps.Marker({
        map,
        position: pos,
        title: c.name,
        icon: getRedPin(),
      });

      marker.addListener("click", () => {
        onCenterSelect?.(c);
      });

      centerMarkersRef.current.set(c.id, marker);
      bounds.extend(pos);
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);

      const listener = google.maps.event.addListener(map, "idle", () => {
        const z = map.getZoom();
        if (z && z > 15) map.setZoom(15);
        google.maps.event.removeListener(listener);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, centers]);

  useEffect(() => {
    if (!map) return;
    if (!centers || centers.length === 0) return;
    if (!selectedCenterId) return;

    const marker = centerMarkersRef.current.get(selectedCenterId);
    if (!marker) return;

    const pos = marker.getPosition();
    if (!pos) return;

    map.panTo(pos);
    map.setZoom(14);
  }, [map, selectedCenterId, centers]);

  useEffect(() => {
    if (!map) return;

    if (centers && centers.length > 0) return;

    clearRouteMarkers();
    clearCenterMarkers(); // in case we switched from centers -> route
    clearRoutes();

    const validDestinations = destinations.filter(
      (dest): dest is TPlace => dest !== null,
    );

    const allLocations: TPlace[] = [];
    if (dho) allLocations.push(dho);
    if (origin) allLocations.push(origin);
    allLocations.push(...validDestinations);

    if (allLocations.length === 0) return;

    const newMarkers = allLocations.map((location) => {
      const position = {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lon),
      };

      let icon: google.maps.Icon | undefined;
      let label: string | undefined;

      if (location === dho) {
        icon = {
          url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNy41ODYgMiA0IDUuNTg2IDQgMTBDNCAxNC40MTQgNy41ODYgMTggMTIgMThDMTYuNDE0IDE4IDIwIDE0LjQxNCAyMCAxMEMyMCA1LjU4NiAxNi40MTQgMiAxMiAyWk0xMiAxMkMxMC44OTcgMTIgMTAgMTEuMTAzIDEwIDEwQzEwIDguODk3IDEwLjg5NyA4IDEyIDhDMTMuMTAzIDggMTQgOC44OTcgMTQgMTBDMTQgMTEuMTAzIDEzLjEwMyAxMiAxMiAxMloiIGZpbGw9IiMzMzgwRkYiLz4KPC9zdmc+",
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12),
        };
        label = "DHO";
      } else if (location === origin) {
        icon = {
          url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNy41ODYgMiA0IDUuNTg2IDQgMTBDNCAxNC40MTQgNy41ODYgMTggMTIgMThDMTYuNDE0IDE4IDIwIDE0LjQxNCAyMCAxMEMyMCA1LjU4NiAxNi40MTQgMiAxMiAyWk0xMiAxMkMxMC44OTcgMTIgMTAgMTEuMTAzIDEwIDEwQzEwIDguODk3IDEwLjg5NyA4IDEyIDhDMTMuMTAzIDggMTQgOC44OTcgMTQgMTBDMTQgMTEuMTAzIDEzLjEwMyAxMiAxMiAxMloiIGZpbGw9IiMxNjlFNzYiLz4KPC9zdmc+",
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12),
        };
        label = "Origin";
      } else {
        icon = {
          url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNy41ODYgMiA0IDUuNTg2IDQgMTBDNCAxNC40MTQgNy41ODYgMTggMTIgMThDMTYuNDE0IDE4IDIwIDE0LjQxNCAyMCAxMEMyMCA1LjU4NiAxNi40MTQgMiAxMiAyWk0xMiAxMkMxMC44OTcgMTIgMTAgMTEuMTAzIDEwIDEwQzEwIDguODk3IDEwLjg5NyA4IDEyIDhDMTMuMTAzIDggMTQgOC44OTcgMTQgMTBDMTQgMTEuMTA3IDEzLjEwMyAxMiAxMiAxMloiIGZpbGw9IiNERjQ0MzYiLz4KPC9zdmc+",
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12),
        };
        label = `Dest ${validDestinations.indexOf(location) + 1}`;
      }

      const marker = new google.maps.Marker({
        position,
        map,
        icon,
        label: {
          text: label,
          color: "#fff",
          fontSize: "10px",
          fontWeight: "bold",
        },
        title: location.display_name,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <div class="font-semibold">${label}</div>
            <div class="text-sm text-gray-600">${location.display_name}</div>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      return marker;
    });

    // setMarkers(newMarkers);

    if ((dho && origin) || (origin && validDestinations.length > 0)) {
      calculateAndDisplayRoute();
    }

    const bounds = new google.maps.LatLngBounds();
    allLocations.forEach((location) => {
      bounds.extend({
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lon),
      });
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);

      const listener = google.maps.event.addListener(map, "idle", () => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 15) {
          map.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    map,
    dho,
    origin,
    destinations,
    directionsService,
    directionsRenderer,
    centers,
  ]);

  const calculateAndDisplayRoute = () => {
    if (!map || (!dho && !origin)) return;

    const validDestinations = destinations.filter(
      (dest): dest is TPlace => dest !== null,
    );

    let waypoints: google.maps.DirectionsWaypoint[] = [];
    let routeOrigin: google.maps.LatLngLiteral;
    let routeDestination: google.maps.LatLngLiteral;

    if (dho && origin && validDestinations.length > 0) {
      routeOrigin = { lat: parseFloat(dho.lat), lng: parseFloat(dho.lon) };
      routeDestination = {
        lat: parseFloat(validDestinations[validDestinations.length - 1].lat),
        lng: parseFloat(validDestinations[validDestinations.length - 1].lon),
      };

      waypoints = [
        {
          location: {
            lat: parseFloat(origin.lat),
            lng: parseFloat(origin.lon),
          },
          stopover: true,
        },
        ...validDestinations.slice(0, -1).map((dest) => ({
          location: { lat: parseFloat(dest.lat), lng: parseFloat(dest.lon) },
          stopover: true,
        })),
      ];
    } else if (origin && validDestinations.length > 0) {
      routeOrigin = {
        lat: parseFloat(origin.lat),
        lng: parseFloat(origin.lon),
      };
      routeDestination = {
        lat: parseFloat(validDestinations[validDestinations.length - 1].lat),
        lng: parseFloat(validDestinations[validDestinations.length - 1].lon),
      };

      waypoints = validDestinations.slice(0, -1).map((dest) => ({
        location: { lat: parseFloat(dest.lat), lng: parseFloat(dest.lon) },
        stopover: true,
      }));
    } else if (dho && origin) {
      routeOrigin = { lat: parseFloat(dho.lat), lng: parseFloat(dho.lon) };
      routeDestination = {
        lat: parseFloat(origin.lat),
        lng: parseFloat(origin.lon),
      };
    } else {
      return;
    }

    directionsService.route(
      {
        origin: routeOrigin,
        destination: routeDestination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
        } else {
          console.warn("Directions request failed due to", status);
        }
      },
    );
  };

  return (
    <div
      ref={mapRef}
      style={{ height }}
      className="w-full rounded-lg border border-gray-200"
    />
  );
};

export default MapWithRoute;
