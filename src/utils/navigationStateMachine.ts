import { NavigationCameraController, type LatLngLiteral } from "./navigationCamera";
import type { ServiceOrder } from "../types";

export type NavigationStatus = "idle" | "previewing" | "navigating" | "arrived";

export interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
  steps: google.maps.DirectionsStep[];
}

export interface NavigationSnapshot {
  status: NavigationStatus;
  order: ServiceOrder | null;
  origin: LatLngLiteral | null;
  destination: LatLngLiteral | null;
  route: RouteInfo | null;
  error: string | null;
  heading: number;
  speed: number | null;
}

type Listener = (snapshot: NavigationSnapshot) => void;

const ARRIVAL_RADIUS_METERS = 40;
const ARRIVAL_CHECK_INTERVAL_MS = 5000;

export class NavigationStateMachine {
  private snapshot: NavigationSnapshot = {
    status: "idle",
    order: null,
    origin: null,
    destination: null,
    route: null,
    error: null,
    heading: 0,
    speed: null,
  };

  private listeners = new Set<Listener>();
  private cameraController: NavigationCameraController | null = null;
  private directionsService: google.maps.DirectionsService;
  private directionsRenderer: google.maps.DirectionsRenderer;
  private arrivalInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private map: google.maps.Map,
    // função que devolve a posição real mais recente do técnico
    private getCurrentPosition: () => LatLngLiteral | null
  ) {
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: "#0A84FF",
        strokeOpacity: 0.8,
        strokeWeight: 6,
      }
    });
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): NavigationSnapshot {
    return this.snapshot;
  }

  private emit(partial: Partial<NavigationSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    this.listeners.forEach((listener) => listener(this.snapshot));
  }

  // ---- idle -> previewing --------------------------------------------
  async selectOrder(order: ServiceOrder): Promise<void> {
    const origin = this.getCurrentPosition();
    if (!origin) {
      this.emit({ error: "Localização do técnico indisponível no momento." });
      return;
    }

    this.emit({ status: "previewing", order, origin, error: null, route: null, heading: 0, speed: null });

    try {
      const destination = order.location;
      const route = await this.computeRoute(origin, destination);

      this.emit({ destination, route });
      this.map.setCenter(origin);
      this.map.setZoom(15);
      this.map.setTilt(0); // preview: vista de cima, achatada
    } catch (err) {
      this.emit({ status: "idle", order: null, error: (err as Error).message });
    }
  }

  // ---- previewing -> navigating ----------------------------------------
  startNavigation(): void {
    const { status, destination } = this.snapshot;
    if (status !== "previewing" || !destination) return;

    this.emit({ status: "navigating" });

    this.cameraController = new NavigationCameraController(this.map, { tilt: 60, zoom: 18 });
    this.cameraController.onPositionUpdateCallback = (pos, heading, speed) => {
      this.emit({
        origin: pos,
        heading,
        speed,
      });
    };
    this.cameraController.start();

    this.watchArrival();
  }

  // ---- previewing | navigating -> idle ----------------------------------
  cancel(): void {
    this.cameraController?.stop();
    this.cameraController = null;
    this.directionsRenderer.setDirections({ routes: [] } as unknown as google.maps.DirectionsResult);
    this.stopArrivalWatch();

    this.emit({
      status: "idle",
      order: null,
      destination: null,
      route: null,
      error: null,
      heading: 0,
      speed: null,
    });
  }

  setFollowing(following: boolean): void {
    if (this.cameraController) {
      this.cameraController.isFollowing = following;
    }
  }

  // ---- navigating -> arrived --------------------------------------------
  private watchArrival(): void {
    this.arrivalInterval = setInterval(() => {
      const { status, destination } = this.snapshot;
      if (status !== "navigating" || !destination) {
        this.stopArrivalWatch();
        return;
      }

      const current = this.getCurrentPosition();
      if (current && this.distanceMeters(current, destination) <= ARRIVAL_RADIUS_METERS) {
        this.cameraController?.stop();
        this.cameraController = null;
        this.stopArrivalWatch();
        this.emit({ status: "arrived" });
      }
    }, ARRIVAL_CHECK_INTERVAL_MS);
  }

  private stopArrivalWatch(): void {
    if (this.arrivalInterval !== null) {
      clearInterval(this.arrivalInterval);
      this.arrivalInterval = null;
    }
  }

  // ---- arrived -> idle ---------------------------------------------------
  completeOrder(): void {
    this.cameraController?.stop();
    this.cameraController = null;
    this.directionsRenderer.setDirections({ routes: [] } as unknown as google.maps.DirectionsResult);
    this.stopArrivalWatch();

    this.emit({
      status: "idle",
      order: null,
      origin: null,
      destination: null,
      route: null,
      error: null,
      heading: 0,
      speed: null,
    });
  }

  private async geocodeAddress(address: string): Promise<LatLngLiteral> {
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({ address });
    const location = result.results[0]?.geometry.location;
    if (!location) throw new Error(`Endereço não encontrado: ${address}`);
    return { lat: location.lat(), lng: location.lng() };
  }

  private computeRoute(origin: LatLngLiteral, destination: LatLngLiteral): Promise<RouteInfo> {
    return new Promise((resolve, reject) => {
      this.directionsService.route(
        { origin, destination, travelMode: google.maps.TravelMode.DRIVING },
        (result, status) => {
          if (status !== "OK" || !result) {
            reject(new Error(`Falha ao calcular rota: ${status}`));
            return;
          }
          this.directionsRenderer.setDirections(result);

          const leg = result.routes[0].legs[0];
          resolve({
            distanceMeters: leg.distance?.value ?? 0,
            durationSeconds: leg.duration?.value ?? 0,
            steps: leg.steps,
          });
        }
      );
    });
  }

  private distanceMeters(a: LatLngLiteral, b: LatLngLiteral): number {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }
}
