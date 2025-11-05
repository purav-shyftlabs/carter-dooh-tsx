declare global {
  interface Window {
    google: {
      maps: {
        Map: new (element: HTMLElement, options: google.maps.MapOptions) => google.maps.Map;
        MapTypeId: {
          ROADMAP: string;
          SATELLITE: string;
          HYBRID: string;
          TERRAIN: string;
        };
        Marker: new (options: google.maps.MarkerOptions) => google.maps.Marker;
        InfoWindow: new (options?: google.maps.InfoWindowOptions) => google.maps.InfoWindow;
        places: {
          PlacesService: new (map: google.maps.Map) => google.maps.places.PlacesService;
        };
      };
    };
  }
}

declare namespace google {
  namespace maps {
    interface Map {
      setCenter(latLng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: string;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      mapTypeControl?: boolean;
      scaleControl?: boolean;
      streetViewControl?: boolean;
      rotateControl?: boolean;
      fullscreenControl?: boolean;
      styles?: MapTypeStyle[];
    }

    interface LatLng {
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    interface MarkerOptions {
      position: LatLng | LatLngLiteral;
      map: Map;
      title?: string;
    }

    interface Marker {
      setPosition(position: LatLng | LatLngLiteral): void;
      setMap(map: Map | null): void;
    }

    interface InfoWindowOptions {
      content?: string;
      position?: LatLng | LatLngLiteral;
    }

    interface InfoWindow {
      open(map?: Map, marker?: Marker): void;
      close(): void;
      setContent(content: string): void;
    }

    interface MapTypeStyle {
      featureType?: string;
      elementType?: string;
      stylers?: Array<{ [key: string]: any }>;
    }

    namespace places {
      interface PlacesService {
        search(request: PlaceSearchRequest, callback: (results: PlaceResult[], status: PlacesServiceStatus) => void): void;
      }

      interface PlaceSearchRequest {
        location?: LatLng | LatLngLiteral;
        radius?: number;
        query?: string;
        type?: string;
      }

      interface PlaceResult {
        name?: string;
        place_id?: string;
        geometry?: {
          location?: LatLng;
        };
      }

      type PlacesServiceStatus = 'OK' | 'ZERO_RESULTS' | 'OVER_QUERY_LIMIT' | 'REQUEST_DENIED' | 'INVALID_REQUEST' | 'UNKNOWN_ERROR';
    }
  }
}

export {};

