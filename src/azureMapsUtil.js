// ── Azure Maps Configuration ───────────────────────────────
const AZURE_MAPS_KEY = import.meta.env.VITE_AZURE_MAPS_KEY;

// ── Load Azure Maps SDK ───────────────────────────────────
let azureLoaded = false;
let azureQueue = [];

export function loadAzureMaps(cb) {
  if (azureLoaded && window.atlas) { cb(); return; }
  azureQueue.push(cb);
  
  if (document.getElementById("azure-maps-sdk")) return;
  
  // Load Azure Maps CSS
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.css";
  document.head.appendChild(link);
  
  // Load Azure Maps JS
  const s = document.createElement("script");
  s.id = "azure-maps-sdk";
  s.async = true;
  s.src = "https://atlas.microsoft.com/sdk/javascript/mapcontrol/3/atlas.min.js";
  s.onload = () => {
    azureLoaded = true;
    azureQueue.forEach(fn => fn());
    azureQueue = [];
  };
  s.onerror = () => {
    console.error("❌ Failed to load Azure Maps SDK");
    azureQueue.forEach(fn => fn());
    azureQueue = [];
  };
  document.head.appendChild(s);
}

// ── Geocode address using Azure Maps ──────────────────────
export async function azureGeocode(address) {
  return new Promise(async (resolve) => {
    try {
      const response = await fetch(
        `https://atlas.microsoft.com/search/address/json?api-version=1.0&query=${encodeURIComponent(address)}&key=${AZURE_MAPS_KEY}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        resolve({
          lat: result.position.lat,
          lng: result.position.lon,
          formattedAddress: result.address.freeformAddress,
        });
      } else {
        resolve(null);
      }
    } catch (error) {
      console.error("❌ Azure Maps geocoding error:", error);
      resolve(null);
    }
  });
}

// ── Create an interactive Azure Map control ───────────────
export function createAzureMapControl(containerId, centerLat, centerLng, zoomLevel = 13) {
  return new Promise((resolve) => {
    loadAzureMaps(() => {
      const map = new window.atlas.Map(containerId, {
        center: [centerLng, centerLat],
        zoom: zoomLevel,
        authOptions: {
          authType: "subscriptionKey",
          subscriptionKey: AZURE_MAPS_KEY,
        },
      });
      
      map.events.add("load", () => {
        resolve(map);
      });
    });
  });
}

// ── Add marker to Azure Map ──────────────────────────────
export function addMarkerToMap(map, lat, lng, title = "Location") {
  const marker = new window.atlas.data.Feature(
    new window.atlas.data.Point([lng, lat]),
    { title }
  );
  
  const datasource = new window.atlas.source.DataSource();
  datasource.add(marker);
  map.sources.add(datasource);
  
  const layer = new window.atlas.layer.SymbolLayer(datasource, null, {
    textOptions: {
      textField: ["get", "title"],
    },
  });
  
  map.layers.add(layer);
  return marker;
}
