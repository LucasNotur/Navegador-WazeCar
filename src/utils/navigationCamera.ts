// navigationCamera.ts
//
// Controlador de câmera de navegação para o Google Maps JavaScript API (Vector Maps).
// Resolve o problema de "câmera presa na vista estática de cima" ao:
//   1. Garantir que o mapa está em modo vetorial (tilt/heading só funcionam em vetor);
//   2. Rastrear a posição do usuário via GPS (watchPosition);
//   3. Calcular o heading (direção do movimento) a partir do GPS ou do deslocamento entre pontos;
//   4. Mover a câmera suavemente (tilt/heading/zoom/center) a cada frame, estilo "modo carro".

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

export interface NavigationCameraOptions {
  /** Inclinação da câmera em modo navegação, em graus (padrão 60, faixa útil 45-67.5) */
  tilt?: number;
  /** Zoom em modo navegação (padrão 18) */
  zoom?: number;
  /** 0-1: quanto maior, mais rápido a câmera "gruda" na posição real a cada frame (padrão 0.35) */
  smoothingFactor?: number;
  /** Distância mínima (m) entre pontos para recalcular heading por deslocamento (padrão 3) */
  minDistanceForHeading?: number;
}

const DEFAULTS: Required<NavigationCameraOptions> = {
  tilt: 60,
  zoom: 18,
  smoothingFactor: 0.35,
  minDistanceForHeading: 3,
};

export class NavigationCameraController {
  private map: google.maps.Map;
  private options: Required<NavigationCameraOptions>;

  private watchId: number | null = null;
  private animationFrame: number | null = null;
  private active = false;

  private lastPosition: LatLngLiteral | null = null;
  private lastHeading = 0;

  private targetCamera: google.maps.CameraOptions | null = null;
  private currentCamera: google.maps.CameraOptions | null = null;
  
  public onPositionUpdateCallback?: (pos: LatLngLiteral, heading: number, speed: number | null) => void;
  public isFollowing = true;

  constructor(map: google.maps.Map, options: NavigationCameraOptions = {}) {
    this.map = map;
    this.options = { ...DEFAULTS, ...options };
  }

  /** Chame isso no clique de "Iniciar rota" */
  start(): void {
    console.log('start chamado');
    if (this.active) return;
    this.active = true;

    // Prepara o mapa para o modo navegação. Isso NÃO ativa vetor sozinho —
    // o mapa já precisa ter sido criado com renderingType/mapId de vetor.
    this.map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
    this.map.setTilt(this.options.tilt);
    this.map.setZoom(this.options.zoom);

    if (!navigator.geolocation) {
      console.error("Geolocalização não suportada neste navegador.");
      this.active = false;
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.onPositionUpdate(pos),
      (err) => {
        console.error("Erro de geolocalização no NavigationCamera:", err);
        if (err.code === err.PERMISSION_DENIED) {
          alert("GPS bloqueado! Se estiver no AI Studio, clique no ícone 'Abrir em nova aba' (canto superior direito) para permitir o acesso ao GPS.");
        } else if (err.code === err.TIMEOUT) {
          console.warn("Aviso: Tempo limite para obter GPS de alta precisão esgotado. Tentando novamente...");
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          console.warn("Aviso: Sinal de GPS indisponível no momento.");
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );

    this.tick();
  }

  /** Chame isso ao parar/cancelar a navegação */
  stop(): void {
    this.active = false;
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  // Permite forçar um destino inicial, caso queira apontar a câmera logo de cara
  setInitialHeading(heading: number) {
     this.lastHeading = heading;
  }
  
  setInitialPosition(pos: LatLngLiteral) {
     this.lastPosition = pos;
     this.targetCamera = {
        center: pos,
        heading: this.lastHeading,
        tilt: this.options.tilt,
        zoom: this.options.zoom,
     };
     this.currentCamera = { ...this.targetCamera };
  }

  private onPositionUpdate(pos: GeolocationPosition): void {
    const newPosition: LatLngLiteral = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
    
    console.log('Nova posição recebida:', newPosition);

    // Prioriza o heading nativo do GPS quando o usuário está realmente se movendo;
    // parado (speed baixo/heading null), calcula pelo deslocamento entre os 2 últimos pontos.
    let heading = this.lastHeading;
    if (pos.coords.heading !== null && pos.coords.speed && pos.coords.speed > 0.5) {
      heading = pos.coords.heading;
    } else if (this.lastPosition) {
      const dist = this.haversineDistance(this.lastPosition, newPosition);
      if (dist >= this.options.minDistanceForHeading) {
        heading = this.computeBearing(this.lastPosition, newPosition);
      }
    }

    this.lastPosition = newPosition;
    this.lastHeading = heading;

    this.targetCamera = {
      center: newPosition,
      heading,
      tilt: this.options.tilt,
      zoom: this.options.zoom,
    };
    
    if (this.onPositionUpdateCallback) {
       this.onPositionUpdateCallback(newPosition, heading, pos.coords.speed);
    }
  }

  // Loop de animação: interpola suavemente a câmera atual em direção ao alvo,
  // em vez de "teleportar" a cada leitura de GPS (o que pareceria travado/robótico).
  private tick = (): void => {
    if (!this.active) return;

    if (this.targetCamera) {
      if (this.isFollowing) {
        this.currentCamera = this.interpolateCamera(
          this.currentCamera ?? this.targetCamera,
          this.targetCamera,
          this.options.smoothingFactor
        );
        this.map.moveCamera(this.currentCamera);
      } else {
        // When not following, clear currentCamera so it resets cleanly when following resumes
        this.currentCamera = null;
      }
    }

    this.animationFrame = requestAnimationFrame(this.tick);
  };

  private interpolateCamera(
    from: google.maps.CameraOptions,
    to: google.maps.CameraOptions,
    factor: number
  ): google.maps.CameraOptions {
    const fromCenter = from.center as LatLngLiteral;
    const toCenter = to.center as LatLngLiteral;

    return {
      center: {
        lat: this.lerp(fromCenter.lat, toCenter.lat, factor),
        lng: this.lerp(fromCenter.lng, toCenter.lng, factor),
      },
      heading: this.lerpAngle(from.heading ?? 0, to.heading ?? 0, factor),
      tilt: this.lerp(from.tilt ?? 0, to.tilt ?? 0, factor),
      zoom: this.lerp(from.zoom ?? this.options.zoom, to.zoom ?? this.options.zoom, factor),
    };
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  // Interpola ângulos pelo caminho mais curto (evita o mapa "girar ao contrário"
  // quando o heading cruza a fronteira 0°/360°).
  private lerpAngle(a: number, b: number, t: number): number {
    const diff = ((b - a + 540) % 360) - 180;
    return (a + diff * t + 360) % 360;
  }

  private computeBearing(from: LatLngLiteral, to: LatLngLiteral): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;

    const dLng = toRad(to.lng - from.lng);
    const lat1 = toRad(from.lat);
    const lat2 = toRad(to.lat);

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x =
      Math.cos(lat1) * Math.sin(lat2) -
      Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    return (toDeg(Math.atan2(y, x)) + 360) % 360;
  }

  private haversineDistance(a: LatLngLiteral, b: LatLngLiteral): number {
    const R = 6371000; // raio da Terra em metros
    const toRad = (d: number) => (d * Math.PI) / 180;

    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(h));
  }
}
