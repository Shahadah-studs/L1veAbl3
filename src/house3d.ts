import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface HouseItem {
  type: string;
  x: number;
  z: number;
}

export class HouseBuilder3D {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private plane: THREE.Mesh;
  private objects: THREE.Object3D[] = [];
  private itemsData: HouseItem[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

  constructor(containerId: string) {
    const container = document.getElementById(containerId)!;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0b0d13);

    this.camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.set(12, 14, 14);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    const ambient = new THREE.AmbientLight(0xffffff, 0.65);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    this.scene.add(ambient, dirLight);

    const grid = new THREE.GridHelper(20, 20, 0x6366f1, 0x252a3a);
    this.scene.add(grid);

    const planeGeo = new THREE.PlaneGeometry(20, 20);
    planeGeo.rotateX(-Math.PI / 2);
    this.plane = new THREE.Mesh(planeGeo, new THREE.MeshStandardMaterial({ color: 0x151822 }));
    this.plane.receiveShadow = true;
    this.scene.add(this.plane);

    this.loadSavedHouse();
    this.bindEvents(container);
    this.animate();
  }

  private createFurnitureMesh(type: string, x: number, z: number): THREE.Mesh {
    let geo: THREE.BufferGeometry;
    let color = 0x6366f1;
    let yPos = 0.5;

    switch (type) {
      case 'wall':
        geo = new THREE.BoxGeometry(1, 2.5, 1);
        color = 0x9ca3af;
        yPos = 1.25;
        break;
      case 'bed':
        geo = new THREE.BoxGeometry(2, 0.6, 1.5);
        color = 0xec4899;
        yPos = 0.3;
        break;
      case 'desk':
        geo = new THREE.BoxGeometry(1.8, 0.8, 0.9);
        color = 0x8b5cf6;
        yPos = 0.4;
        break;
      case 'plant':
        geo = new THREE.ConeGeometry(0.4, 1.2, 8);
        color = 0x10b981;
        yPos = 0.6;
        break;
      case 'light':
        geo = new THREE.SphereGeometry(0.4, 16, 16);
        color = 0xfacc15;
        yPos = 1.0;
        break;
      default:
        geo = new THREE.BoxGeometry(1, 1, 1);
    }

    const mat = new THREE.MeshStandardMaterial({
      color,
      emissive: type === 'light' ? 0xfacc15 : 0x000000,
      emissiveIntensity: type === 'light' ? 0.7 : 0
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, yPos, z);
    mesh.castShadow = true;
    mesh.userData = { type, x, z };
    return mesh;
  }

  private bindEvents(container: HTMLElement) {
    container.addEventListener('pointerdown', (e) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      this.raycaster.setFromCamera(this.pointer, this.camera);

      if (e.button === 2) {
        const hits = this.raycaster.intersectObjects(this.objects);
        if (hits.length > 0) {
          const target = hits.object;
          this.scene.remove(target);
          this.objects = this.objects.filter(o => o !== target);
          this.itemsData = this.itemsData.filter(i => !(i.x === target.userData.x && i.z === target.userData.z));
          this.saveHouse();
        }
        return;
      }

      if (e.button === 0) {
        const hits = this.raycaster.intersectObject(this.plane);
        if (hits.length > 0) {
          const pt = hits.point;
          const x = Math.round(pt.x);
          const z = Math.round(pt.z);
          const type = (document.getElementById('item-type') as HTMLSelectElement).value;
          const mesh = this.createFurnitureMesh(type, x, z);
          this.scene.add(mesh);
          this.objects.push(mesh);
          this.itemsData.push({ type, x, z });
          this.saveHouse();
        }
      }
    });

    container.addEventListener('contextmenu', e => e.preventDefault());

    document.getElementById('clear-house')?.addEventListener('click', () => {
      this.objects.forEach(o => this.scene.remove(o));
      this.objects = [];
      this.itemsData = [];
      this.saveHouse();
    });

    document.getElementById('export-house')?.addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(this.itemsData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'l1veabl3-house-map.json';
      a.click();
    });

    window.addEventListener('resize', () => {
      if (!container.clientWidth) return;
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });
  }

  private saveHouse() {
    localStorage.setItem('l1veabl3_house', JSON.stringify(this.itemsData));
  }

  private loadSavedHouse() {
    const saved = localStorage.getItem('l1veabl3_house');
    if (saved) {
      this.itemsData = JSON.parse(saved);
      this.itemsData.forEach(item => {
        const mesh = this.createFurnitureMesh(item.type, item.x, item.z);
        this.scene.add(mesh);
        this.objects.push(mesh);
      });
    }
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };
}
